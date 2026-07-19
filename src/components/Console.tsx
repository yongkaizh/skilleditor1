import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  X, 
  Trash2, 
  Copy, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ConsoleMessageType = "info" | "error" | "success" | "output" | "warning" | "command";

export interface ConsoleMessage {
  type: ConsoleMessageType;
  text: string;
  timestamp: string;
  id: string;
  quickFix?: {
    label: string;
    action: () => void;
  };
  isExpertAnalyzing?: boolean;
}

interface ConsoleProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  onClose: () => void;
  onCommand?: (command: string) => void;
  onApplyQuickFix?: (action: () => void) => void;
  onExpertAnalyze?: (msg: ConsoleMessage) => void;
  onRefactor?: () => void;
  isSimulating?: boolean;
}

export const Console: React.FC<ConsoleProps> = ({ 
  messages, 
  onClear, 
  onClose,
  onCommand,
  onApplyQuickFix,
  onExpertAnalyze,
  onRefactor,
  isSimulating 
}) => {
  const [filter, setFilter] = useState<ConsoleMessageType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSimulating]);

  const filteredMessages = messages.filter(m => {
    const matchesFilter = filter === 'all' || m.type === filter;
    const matchesSearch = m.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    if (onCommand) {
      onCommand(commandInput.trim());
    }
    
    setHistory(prev => [commandInput.trim(), ...prev.slice(0, 49)]);
    setHistoryIndex(-1);
    setCommandInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setCommandInput(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCommandInput(history[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    }
  };

  const handleCopyAll = () => {
    const text = messages.map(m => `[${m.timestamp}] ${m.type === 'command' ? '> ' : ''}${m.text}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const highlightConsoleLine = (text: string) => {
    const parts = text.split(/(\*?error\*?|\*?success\*?|\*?warning\*?)/i);
    return parts.map((part, i) => {
      const lower = part.toLowerCase();
      if (lower.includes("error")) return <span key={i} className="text-red-400 font-bold">{part}</span>;
      if (lower.includes("success")) return <span key={i} className="text-emerald-400 font-bold">{part}</span>;
      if (lower.includes("warning")) return <span key={i} className="text-amber-400 font-bold">{part}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  const getIcon = (type: ConsoleMessageType) => {
    switch (type) {
      case 'error': return <AlertCircle size={14} className="text-red-400" />;
      case 'success': return <CheckCircle2 size={14} className="text-emerald-400" />;
      case 'warning': return <AlertCircle size={14} className="text-amber-400" />;
      case 'info': return <Info size={14} className="text-indigo-400" />;
      case 'command': return <span className="text-indigo-500 font-bold select-none text-[10px]">&gt;</span>;
      default: return <Terminal size={14} className="text-slate-400" />;
    }
  };

  const handleApplyFix = (action: () => void) => {
    if (onApplyQuickFix) {
      onApplyQuickFix(action);
    } else {
      action();
    }
  };

  return (
    <section className="h-80 border-t border-white/5 bg-[#0b0c10] flex flex-col shrink-0 relative overflow-hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
      {/* Console Header */}
      <div className="px-4 py-2 bg-[#0d0e12] border-b border-white/[0.04] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <Terminal size={14} className="text-indigo-500" />
            Interactive Shell
          </div>
          
          <div className="flex items-center gap-1 bg-white/5 rounded-md p-0.5">
            <button 
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${filter === 'all' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('error')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${filter === 'error' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Errors
            </button>
            <button 
              onClick={() => setFilter('output')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${filter === 'output' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Output
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 150, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  type="text"
                  placeholder="Filter logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] outline-none focus:border-indigo-500/50"
                  autoFocus
                />
              )}
            </AnimatePresence>
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-1.5 rounded hover:bg-white/5 transition-colors ${isSearchOpen ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="Search logs"
            >
              <Search size={14} />
            </button>
          </div>
          
          <div className="w-px h-4 bg-white/5 mx-1" />
          
          <button 
            onClick={handleCopyAll}
            className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            title="Copy all logs"
          >
            <Copy size={14} />
          </button>
          <button 
            onClick={onClear}
            className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            title="Clear Console"
          >
            <Trash2 size={14} />
          </button>

          {onRefactor && (
            <button 
              onClick={onRefactor}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-md text-[10px] font-bold transition-all"
              title="Auto-refactor current code"
            >
              <Sparkles size={12} />
              Refactor
            </button>
          )}

          <button 
            onClick={onClose}
            className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            title="Close Console"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[12px] leading-relaxed scrollbar-thin scrollbar-thumb-white/10 bg-[#08090d]"
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 italic">
            <Terminal size={32} className="opacity-10" />
            <span>{messages.length > 0 ? 'No results matching filter' : 'Waiting for output...'}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filteredMessages.map((msg) => (
              <div 
                key={msg.id}
                className={`group flex gap-3 py-1 px-2 rounded hover:bg-white/[0.02] transition-colors border-l-2 ${
                  msg.type === 'command' ? 'border-indigo-500/30' : 'border-transparent hover:border-white/5'
                }`}
              >
                <span className="text-[10px] text-slate-600 shrink-0 font-medium tabular-nums pt-1">
                  {msg.timestamp}
                </span>
                <span className="mt-1.5 shrink-0 opacity-70">
                  {getIcon(msg.type)}
                </span>
                <div className={`flex-1 break-words whitespace-pre-wrap py-0.5 ${
                  msg.type === 'error' ? 'text-red-300/90' : 
                  msg.type === 'success' ? 'text-emerald-300/90' :
                  msg.type === 'info' ? 'text-indigo-300/70' :
                  msg.type === 'command' ? 'text-indigo-400 font-bold' :
                  'text-slate-300'
                }`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">{highlightConsoleLine(msg.text)}</div>
                    <div className="flex items-center gap-2">
                      {msg.type === 'error' && onExpertAnalyze && (
                        <button
                          onClick={() => onExpertAnalyze(msg)}
                          disabled={msg.isExpertAnalyzing}
                          className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded text-[10px] font-bold transition-all disabled:opacity-50"
                        >
                          {msg.isExpertAnalyzing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          Ask Expert
                        </button>
                      )}
                      {msg.quickFix && (
                        <button
                          onClick={() => handleApplyFix(msg.quickFix!.action)}
                          className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded text-[10px] font-bold transition-all"
                        >
                          Fix: {msg.quickFix.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isSimulating && (
              <div className="flex gap-3 py-1 px-2 animate-in fade-in">
                <span className="text-[10px] text-indigo-500/50 animate-pulse pt-1">
                  {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <span className="text-indigo-400 italic text-[11px]">Executing SKILL engine...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleCommandSubmit}
        className="px-4 py-2 bg-[#0d0e12] border-t border-white/[0.04] flex items-center gap-3 shrink-0"
      >
        <span className="text-indigo-500 font-bold select-none text-xs">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type SKILL command or 'help'..."
          className="flex-1 bg-transparent border-none outline-none text-[12px] font-mono text-slate-200 placeholder:text-slate-600"
        />
        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium select-none">
          <span className="hidden sm:inline">Enter to run</span>
        </div>
      </form>
      
      {/* Footer / Status bar */}
      <div className="px-4 py-1 bg-[#0d0e12] border-t border-white/[0.04] flex items-center justify-between text-[10px] text-slate-500 font-medium shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Filter size={10} className="text-indigo-500/50" />
            {filter.toUpperCase()}
          </span>
          <span>{filteredMessages.length} lines</span>
        </div>
        <div className="flex items-center gap-1 text-indigo-400/50">
          <Clock size={10} />
          Engine: V-8.2 (Cadence Ready)
        </div>
      </div>
    </section>
  );
};
