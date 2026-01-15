
import React from 'react';
import { ToolCallState } from '../types';

interface JarvisHUDProps {
  isActive: boolean;
  isInitializing: boolean;
  currentTool: ToolCallState | null;
  onToggle: () => void;
}

export const JarvisHUD: React.FC<JarvisHUDProps> = ({ isActive, isInitializing, currentTool, onToggle }) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Rings */}
      <div className={`absolute w-[400px] h-[400px] border border-cyan-500/10 rounded-full transition-transform duration-1000 ${isActive ? 'scale-110 rotate-180' : 'scale-100'}`}></div>
      <div className={`absolute w-[350px] h-[350px] border-2 border-dashed border-cyan-500/20 rounded-full transition-transform duration-1000 ${isActive ? 'rotate-[360deg]' : ''}`}></div>
      
      {/* Main Core */}
      <button 
        onClick={onToggle}
        disabled={isInitializing}
        className={`relative z-10 w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-500 group
          ${isActive 
            ? 'bg-cyan-500/10 shadow-[0_0_60px_rgba(6,182,212,0.3)]' 
            : 'bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]'
          }
        `}
      >
        {/* Ark Reactor Graphics */}
        <div className={`absolute inset-0 rounded-full border-4 border-cyan-500/40 opacity-50 ${isActive ? 'ark-pulse' : ''}`}></div>
        <div className="relative z-20 flex flex-col items-center">
          {isInitializing ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span className="font-orbitron text-xs tracking-widest text-cyan-400">BOOTING...</span>
            </div>
          ) : isActive ? (
            <>
              <div className="w-20 h-20 relative mb-4">
                <div className="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-20 animate-pulse"></div>
                <div className="absolute inset-2 border-2 border-cyan-400 rounded-full animate-ping opacity-40"></div>
                <div className="absolute inset-4 bg-cyan-500 rounded-full shadow-[0_0_20px_cyan]"></div>
              </div>
              <span className="font-orbitron text-sm tracking-[0.3em] text-cyan-400 hud-glow">LISTENING</span>
              <p className="text-[10px] text-cyan-300/60 mt-2 uppercase tracking-tighter">Click to Disconnect</p>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 text-cyan-500/40 group-hover:text-cyan-400 transition-colors mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              <span className="font-orbitron text-sm tracking-[0.3em] text-cyan-500/60 group-hover:text-cyan-400 transition-colors">INITIALIZE</span>
            </>
          )}
        </div>
      </button>

      {/* Tool Execution Overlay */}
      {currentTool && (
        <div className="absolute -bottom-16 w-full flex flex-col items-center">
          <div className="bg-cyan-500/10 border border-cyan-500/30 px-6 py-2 rounded-full flex items-center space-x-3 backdrop-blur-sm animate-bounce">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-orbitron text-cyan-300 uppercase tracking-widest">
              Executing: {currentTool.name.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </div>
          <div className="mt-2 h-1 w-32 bg-cyan-500/20 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 animate-[loading_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      )}

      {/* Ambient Data Floaties */}
      <div className={`absolute w-full h-full pointer-events-none transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-0 left-[-100px] text-[8px] text-cyan-500/40 font-mono rotate-90">
          0x42F1 // CORE_TEMP // OPTIMAL
        </div>
        <div className="absolute bottom-0 right-[-100px] text-[8px] text-cyan-500/40 font-mono -rotate-90">
          SECURE_NODE // AES_256 // SYNCED
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 100%; transform: translateX(0); }
          100% { width: 0%; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
