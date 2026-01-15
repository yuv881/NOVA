
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { JarvisHUD } from './components/JarvisHUD';
import { Sidebar } from './components/Sidebar';
import { MemoryItem, TranscriptionItem, ToolCallState } from './types';
import { getTools, handleToolCall } from './services/toolService';
import { decode, encode, decodeAudioData } from './services/audioUtils';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [currentTool, setCurrentTool] = useState<ToolCallState | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Load memories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('jarvis_memories');
    if (saved) {
      setMemories(JSON.parse(saved));
    }
  }, []);

  // Save memories to localStorage
  useEffect(() => {
    localStorage.setItem('jarvis_memories', JSON.stringify(memories));
  }, [memories]);

  const startSession = async () => {
    if (isActive) return;
    setIsInitializing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } }, // Sophisticated male voice
          },
          systemInstruction: `You are JARVIS, a highly sophisticated AI virtual concierge inspired by Iron Man. 
          Your tone is respectful, intelligent, and slightly witty. 
          You have access to a memory system and several tools. 
          Use 'saveMemory' to remember important user preferences or facts. 
          Use 'getMemories' to recall past interactions.
          Be proactive, concise, and helpful. 
          Always refer to the user as 'Sir' or by their name if you know it.`,
          tools: [{ functionDeclarations: getTools() }],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('JARVIS Online');
            setIsActive(true);
            setIsInitializing(false);
            
            // Start recording and streaming audio
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Calls
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                setCurrentTool({ name: fc.name, args: fc.args, status: 'executing' });
                
                const result = await handleToolCall(fc.name, fc.args, {
                  memories,
                  setMemories,
                  setTranscriptions
                });
                
                setCurrentTool(prev => prev ? { ...prev, status: 'completed', result } : null);
                
                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result }
                    }
                  });
                });
                
                // Clear tool indicator after a delay
                setTimeout(() => setCurrentTool(null), 3000);
              }
            }

            // Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text) {
                setTranscriptions(prev => [...prev.slice(-49), { speaker: 'user', text, timestamp: Date.now() }]);
              }
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              if (text) {
                setTranscriptions(prev => [...prev.slice(-49), { speaker: 'jarvis', text, timestamp: Date.now() }]);
              }
            }

            // Handle Audio Output
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (err) => {
            console.error('JARVIS Error:', err);
            stopSession();
          },
          onclose: () => {
            console.log('JARVIS Offline');
            stopSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error('Failed to initialize JARVIS:', error);
      setIsInitializing(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setIsActive(false);
    setIsInitializing(false);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-cyan-50 relative overflow-hidden">
      {/* Background HUD Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        <div className="absolute top-0 left-10 w-px h-full bg-cyan-500/30"></div>
        <div className="absolute top-0 right-10 w-px h-full bg-cyan-500/30"></div>
      </div>

      <Sidebar memories={memories} transcriptions={transcriptions} />

      <main className="flex-1 flex flex-col items-center justify-center relative p-8">
        <JarvisHUD 
          isActive={isActive} 
          isInitializing={isInitializing}
          currentTool={currentTool}
          onToggle={isActive ? stopSession : startSession}
        />
        
        {/* Status Indicators */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center space-x-8">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-orbitron tracking-widest text-cyan-400/60 mb-1">System Status</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-500 animate-pulse shadow-[0_0_8px_cyan]' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium uppercase tracking-tighter">
                {isActive ? 'Online - Standby' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-orbitron tracking-widest text-cyan-400/60 mb-1">Network</span>
            <span className="text-xs font-medium uppercase tracking-tighter">Secure Link v2.5</span>
          </div>
        </div>
      </main>

      {/* Side Decorative Panel */}
      <div className="w-64 border-l border-cyan-500/20 bg-slate-900/40 p-6 flex flex-col justify-between hidden lg:flex">
        <div>
          <h3 className="font-orbitron text-xs text-cyan-400 tracking-[0.2em] mb-4 uppercase">System Diagnostics</h3>
          <div className="space-y-4">
            {[
              { label: 'Neural Link', val: '98%' },
              { label: 'Voice Synapse', val: 'Active' },
              { label: 'Logic Core', val: 'Optimal' },
              { label: 'Environment', val: 'Home' }
            ].map(d => (
              <div key={d.label} className="flex justify-between items-end border-b border-cyan-500/10 pb-1">
                <span className="text-[10px] text-cyan-500/60 uppercase">{d.label}</span>
                <span className="text-xs text-cyan-300">{d.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-cyan-950/20 border border-cyan-500/20 p-3 rounded">
          <p className="text-[10px] leading-relaxed text-cyan-200/60 italic">
            "Everything is functional, Sir. Awaiting your command."
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
