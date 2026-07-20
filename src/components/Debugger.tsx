import React, { useState } from 'react';
import { 
  Play, 
  StepForward, 
  Square, 
  Bug,
  ChevronRight,
  Database,
  Hash,
  Type,
  Eye,
  Plus,
  X,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface DebuggerProps {
  isOpen: boolean;
  onClose: () => void;
  isPaused: boolean;
  currentLine: number | null;
  variables: Record<string, any>;
  onContinue: () => void;
  onStep: () => void;
  onStop: () => void;
  isSimulating?: boolean;
}

export const Debugger: React.FC<DebuggerProps> = ({
  isOpen,
  onClose,
  isPaused,
  currentLine,
  variables,
  onContinue,
  onStep,
  onStop,
  isSimulating = false
}) => {
  const [watchVars, setWatchVars] = useState<string[]>([]);
  const [newWatch, setNewWatch] = useState("");
  const [showGuide, setShowGuide] = useState(true);

  if (!isOpen) return null;

  const handleAddWatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatch.trim() && !watchVars.includes(newWatch.trim())) {
      setWatchVars(prev => [...prev, newWatch.trim()]);
    }
    setNewWatch("");
  };

  const removeWatch = (name: string) => {
    setWatchVars(prev => prev.filter(v => v !== name));
  };

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed right-0 top-16 bottom-0 w-72 bg-[#0d0e12] border-l border-white/5 shadow-2xl z-40 flex flex-col"
    >
      <div className="px-4 py-3 bg-[#12141a] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-500">
          <Bug size={16} />
          <span className="font-bold text-xs uppercase tracking-wider">Debugger</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <Square size={14} className="rotate-45" />
        </button>
      </div>

      <div className="p-4 flex items-center justify-center gap-2 bg-[#0b0c10] border-b border-white/5">
        <button 
          onClick={onContinue}
          disabled={!isPaused}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-30 transition-all"
          title="Continue (F5)"
        >
          <Play size={18} fill="currentColor" />
        </button>
        <button 
          onClick={onStep}
          disabled={!isPaused}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 disabled:opacity-30 transition-all"
          title="Step Over (F10)"
        >
          <StepForward size={18} />
        </button>
        <button 
          onClick={onStop}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
          title="Stop Execution"
        >
          <Square size={16} fill="currentColor" />
        </button>
      </div>

      {isPaused ? (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
            Paused at line {currentLine}
          </span>
        </div>
      ) : isSimulating ? (
        <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
            Executing...
          </span>
        </div>
      ) : (
        <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
            Execution Complete
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Watch Variables Section */}
        <div className="flex flex-col border-b border-white/[0.03]">
          <div className="px-4 py-2 flex items-center gap-2 text-slate-500 border-b border-white/[0.03] bg-white/[0.01]">
            <Eye size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Watch</span>
          </div>
          <div className="p-2 space-y-1">
            {watchVars.map(name => {
              const val = variables[name];
              const isDefined = val !== undefined;
              return (
                <div 
                  key={name}
                  className="group flex flex-col gap-0.5 p-2 rounded hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5 relative"
                >
                  <button 
                    onClick={() => removeWatch(name)}
                    className="absolute right-2 top-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                  <div className="flex items-center justify-between pr-4">
                    <div className="flex items-center gap-1.5">
                      <ChevronRight size={10} className="text-slate-600 group-hover:text-slate-400" />
                      <span className="text-[12px] font-mono font-medium text-slate-300">{name}</span>
                    </div>
                    {isDefined && (
                      <span className="text-[9px] px-1 bg-white/5 text-slate-500 rounded font-mono">
                        {typeof val}
                      </span>
                    )}
                  </div>
                  <div className="pl-4 flex items-center gap-2">
                    {isDefined ? (
                      <>
                        {typeof val === 'number' ? <Hash size={10} className="text-indigo-500" /> : <Type size={10} className="text-emerald-500" />}
                        <span className="text-[12px] font-mono text-indigo-400 break-all">
                          {JSON.stringify(val)}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-600 italic">undefined</span>
                    )}
                  </div>
                </div>
              );
            })}
            
            <form onSubmit={handleAddWatch} className="flex items-center gap-2 px-2 py-1 mt-1">
              <Plus size={12} className="text-slate-500" />
              <input
                type="text"
                value={newWatch}
                onChange={e => setNewWatch(e.target.value)}
                placeholder="Add expression to watch..."
                className="flex-1 bg-transparent border-none text-[11px] font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-0"
              />
            </form>
          </div>
        </div>

        {/* Local Variables Section */}
        <div className="flex flex-col">
          <div className="px-4 py-2 flex items-center gap-2 text-slate-500 border-b border-white/[0.03] bg-white/[0.01]">
            <Database size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Locals</span>
          </div>
          <div className="p-2 space-y-1">
            {Object.entries(variables).length === 0 ? (
              <div className="px-3 py-4 text-center text-slate-600 italic text-[11px]">
                No variables in scope
              </div>
            ) : (
              Object.entries(variables).map(([name, val]) => (
                <div 
                  key={name}
                  className="group flex flex-col gap-0.5 p-2 rounded hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ChevronRight size={10} className="text-slate-600 group-hover:text-slate-400" />
                      <span className="text-[12px] font-mono font-medium text-slate-300">{name}</span>
                    </div>
                    <span className="text-[9px] px-1 bg-white/5 text-slate-500 rounded font-mono">
                      {typeof val}
                    </span>
                  </div>
                  <div className="pl-4 flex items-center gap-2">
                    {typeof val === 'number' ? <Hash size={10} className="text-indigo-500" /> : <Type size={10} className="text-emerald-500" />}
                    <span className="text-[12px] font-mono text-indigo-400 break-all">
                      {JSON.stringify(val)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Guide Section */}
        <div className="flex flex-col border-t border-white/[0.03]">
          <button 
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="px-4 py-2 flex items-center justify-between text-slate-500 hover:text-slate-300 transition-colors bg-white/[0.01] border-b border-white/[0.03]"
          >
            <div className="flex items-center gap-2">
              <HelpCircle size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Quick Guide</span>
            </div>
            <ChevronRight size={10} className={`transform transition-transform text-slate-500 ${showGuide ? 'rotate-90' : ''}`} />
          </button>
          
          {showGuide && (
            <div className="p-3 bg-white/[0.01] space-y-2">
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                Toggle breakpoints by clicking the margin left of any line number in the editor.
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-500">
                <div className="flex flex-col p-1.5 bg-[#12141a] rounded border border-white/5">
                  <span className="text-amber-400 font-bold mb-0.5">Step Over</span>
                  <span>Executes current line and stops at next expression.</span>
                </div>
                <div className="flex flex-col p-1.5 bg-[#12141a] rounded border border-white/5">
                  <span className="text-emerald-400 font-bold mb-0.5">Continue</span>
                  <span>Runs until next breakpoint or complete.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-[#08090d] border-t border-white/5">
        <div className="text-[10px] text-slate-500 flex items-center justify-between">
          <span>Call Stack</span>
          <span className="bg-white/5 px-1 rounded text-[8px]">Active</span>
        </div>
        <div className="mt-2 flex items-center gap-2 px-2 py-1.5 bg-white/[0.02] rounded border border-white/5">
          <div className="w-1 h-1 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-mono text-slate-400 truncate">main_thread</span>
        </div>
      </div>
    </motion.div>
  );
};
