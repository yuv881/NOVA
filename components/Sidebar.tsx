
import React, { useState } from 'react';
import { MemoryItem, TranscriptionItem } from '../types';

interface SidebarProps {
  memories: MemoryItem[];
  transcriptions: TranscriptionItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ memories, transcriptions }) => {
  const [activeTab, setActiveTab] = useState<'memories' | 'chat'>('chat');

  return (
    <div className="w-80 h-full border-r border-cyan-500/20 bg-slate-900/60 backdrop-blur-md flex flex-col relative z-20">
      <div className="p-6 border-b border-cyan-500/20">
        <h2 className="font-orbitron text-lg tracking-widest text-cyan-400 mb-6 hud-glow flex items-center">
          <span className="mr-3 text-cyan-500">◈</span> JARVIS CORE
        </h2>
        
        <div className="flex bg-slate-950 rounded p-1">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 text-[10px] font-orbitron uppercase tracking-widest rounded transition-all ${activeTab === 'chat' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]' : 'text-cyan-500/60 hover:text-cyan-400'}`}
          >
            Terminal
          </button>
          <button 
            onClick={() => setActiveTab('memories')}
            className={`flex-1 py-1.5 text-[10px] font-orbitron uppercase tracking-widest rounded transition-all ${activeTab === 'memories' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]' : 'text-cyan-500/60 hover:text-cyan-400'}`}
          >
            Memory
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'chat' ? (
          <div className="space-y-4">
            {transcriptions.length === 0 ? (
              <p className="text-xs text-cyan-700 italic text-center mt-10">No communication logged.</p>
            ) : (
              transcriptions.map((t, idx) => (
                <div key={idx} className={`flex flex-col ${t.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] uppercase font-orbitron text-cyan-600 mb-1">{t.speaker}</span>
                  <div className={`max-w-[85%] p-2 rounded text-xs leading-relaxed ${t.speaker === 'user' ? 'bg-cyan-950/40 text-cyan-100' : 'bg-slate-800/40 text-cyan-200 border-l border-cyan-500/30'}`}>
                    {t.text}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
             {memories.length === 0 ? (
              <p className="text-xs text-cyan-700 italic text-center mt-10">Neural banks are empty.</p>
            ) : (
              memories.map((m) => (
                <div key={m.id} className="p-3 bg-slate-950/50 border border-cyan-900/50 rounded-lg group hover:border-cyan-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[8px] bg-cyan-900/50 text-cyan-300 px-1.5 py-0.5 rounded uppercase">{m.category}</span>
                    <span className="text-[8px] text-cyan-700">{new Date(m.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] text-cyan-200/80 leading-relaxed">{m.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.4); }
      `}</style>
    </div>
  );
};
