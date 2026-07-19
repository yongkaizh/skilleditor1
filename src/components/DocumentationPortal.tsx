import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Book, X, ExternalLink, Code, Info, ChevronRight, Hash } from 'lucide-react';

interface DocumentationPortalProps {
  isOpen: boolean;
  onClose: () => void;
  manualFns: any[];
  onInsert: (text: string) => void;
  isInline?: boolean;
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
}

export const DocumentationPortal: React.FC<DocumentationPortalProps> = ({ 
  isOpen, 
  onClose, 
  manualFns, 
  onInsert, 
  isInline,
  searchQuery: externalSearchQuery,
  setSearchQuery: setExternalSearchQuery
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = setExternalSearchQuery !== undefined ? setExternalSearchQuery : setInternalSearchQuery;

  const [selectedFn, setSelectedFn] = useState<any | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    manualFns.forEach(fn => {
      if (fn.category) cats.add(fn.category);
    });
    return Array.from(cats).sort();
  }, [manualFns]);

  const filteredFns = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = manualFns.filter(fn => {
      const name = fn.name || "";
      const desc = fn.description || "";
      const usage = fn.usage || "";
      
      const matchesSearch = !query || 
        name.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query) ||
        usage.toLowerCase().includes(query);
      
      const matchesCategory = selectedCategory === "All" || fn.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    if (!query && selectedCategory === "All") {
      return { items: filtered, total: filtered.length };
    }

    const sorted = filtered.sort((a, b) => {
        if (a.name.toLowerCase() === query) return -1;
        if (b.name.toLowerCase() === query) return 1;
        if (a.name.toLowerCase().startsWith(query) && !b.name.toLowerCase().startsWith(query)) return -1;
        if (!a.name.toLowerCase().startsWith(query) && b.name.toLowerCase().startsWith(query)) return 1;
        return a.name.localeCompare(b.name);
    });

    return { items: sorted, total: sorted.length };
  }, [manualFns, searchQuery, selectedCategory]);

  const renderContent = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          {selectedFn ? (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col bg-[#0b0c10] z-10"
            >
              <div className="p-4 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between shrink-0">
                <button 
                  onClick={() => setSelectedFn(null)}
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider transition-all group"
                >
                  <ChevronRight size={16} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                  Back
                </button>
                <button
                  onClick={() => {
                    onInsert(selectedFn.usage.replace(/\[|\]/g, ''));
                  }}
                  className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all border border-indigo-500/20 flex items-center gap-1.5"
                >
                  <Code size={14} />
                  Insert
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[9px] font-bold rounded uppercase tracking-wider">
                      Function
                    </span>
                    {selectedFn.category && (
                      <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest truncate max-w-[150px]">
                        {selectedFn.category}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight break-all font-mono">
                    {selectedFn.name}
                  </h2>
                </div>

                <section className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Info size={12} className="text-indigo-400" />
                    Description
                  </h3>
                  <div className="text-slate-400 text-sm leading-relaxed bg-white/[0.02] border border-white/5 p-3.5 rounded-xl whitespace-pre-wrap">
                    {selectedFn.description || "No description available for this function."}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Hash size={12} className="text-emerald-400" />
                    Syntax
                  </h3>
                  <div className="bg-[#1a1c23] border border-white/5 rounded-xl p-3 font-mono text-[11px] text-indigo-300 shadow-inner overflow-x-auto whitespace-pre leading-relaxed">
                    {selectedFn.usage}
                  </div>
                </section>

                {selectedFn.parameters && (
                  <section className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Code size={12} className="text-pink-400" />
                      Params
                    </h3>
                    <div className="text-slate-400 text-[11px] leading-relaxed bg-white/[0.02] border border-white/5 p-3.5 rounded-xl whitespace-pre-wrap font-mono">
                      {selectedFn.parameters}
                    </div>
                  </section>
                )}

                {selectedFn.example && (
                  <section className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <ExternalLink size={12} className="text-amber-400" />
                      Example
                    </h3>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-emerald-400 shadow-inner whitespace-pre overflow-x-auto leading-relaxed">
                      {selectedFn.example}
                    </div>
                  </section>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Header Area */}
              <div className="p-4 border-b border-white/[0.04] shrink-0 bg-white/[0.01]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-indigo-500/10 p-1.5 rounded-lg">
                    <Book className="text-indigo-400" size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider">SKILL API</h2>
                    <p className="text-[10px] text-slate-500 font-medium">{manualFns.length} functions indexed</p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search functions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                    autoFocus
                  />
                </div>

                <div className="flex overflow-x-auto gap-1 mt-3 pb-1 no-scrollbar mask-linear-fade-right">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                        selectedCategory === cat
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                          : "bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 px-1">
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.1em]">Results</span>
                  <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                    {filteredFns.items.length}
                  </span>
                </div>
              </div>

              {/* Function List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-black/10">
                {filteredFns.items.map((fn, idx) => (
                  <button
                    key={`${fn.name}-${idx}`}
                    onClick={() => setSelectedFn(fn)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group border border-transparent ${
                      selectedFn?.name === fn.name 
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                      : 'hover:bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:border-white/[0.04]'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-mono text-[13px] font-semibold truncate group-hover:text-white transition-colors">{fn.name}</span>
                      <span className="text-[10px] opacity-50 line-clamp-1 mt-0.5">{fn.description || 'No description'}</span>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 text-indigo-500/50 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 ${selectedFn?.name === fn.name ? 'opacity-100 translate-x-0.5' : ''}`} />
                  </button>
                ))}
                {filteredFns.items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <Search className="text-slate-700 mb-2" size={24} />
                    <p className="text-slate-500 text-xs italic">
                      No functions match "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (isInline) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0b0c10]">
        {renderContent()}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#0b0c10]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#12141a] border border-white/10 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-2 rounded-xl">
                  <Book className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">SKILL API Finder</h1>
                  <p className="text-slate-500 text-xs mt-0.5">Search and explore over {manualFns.length} standard Cadence SKILL functions</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
               {/* Original 2-col logic could go here if we wanted to keep the modal version, 
                   but since we are moving to sidebar, we might just use the renderContent() even for modal if needed.
                   However, the user wants it in the sidebar specifically.
               */}
               {renderContent()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
