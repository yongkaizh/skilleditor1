import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Book, 
  X, 
  ExternalLink, 
  Code, 
  Info, 
  ChevronRight, 
  Hash, 
  Copy,
  Check,
  Sparkles,
  List,
  Grid
} from 'lucide-react';

interface DocumentationPortalProps {
  isOpen: boolean;
  onClose: () => void;
  manualFns: any[];
  onInsert: (text: string) => void;
  isInline?: boolean;
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
}

// Helper to return category-specific color themes
const getCategoryBadgeClass = (category: string) => {
  switch (category) {
    case 'Database Access':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Layout Editor':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Graphics & Display':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'User Interface':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'Schematic Editor':
      return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    case 'Component Description Format':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'Inter-Process Communication':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'Data Manager':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'Environment & OS':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

const NEW_CATEGORIES = new Set([
  'Component Description Format',
  'Inter-Process Communication',
  'Data Manager',
  'Environment & OS'
]);

const NEW_FUNCTION_NAMES = new Set([
  'dbTransformBBox', 'dbPointArrayToBBox', 'dbLayerOr', 'dbLayerAnd', 'dbLayerAndNot',
  'dbLayerXor', 'dbLayerSize', 'dbCopyShape', 'dbMoveShape', 'dbDeleteObjectList',
  'dbFindNetByName', 'dbFindTermByName', 'dbFindPinByName', 'geGetSelectedSet',
  'geSelectObject', 'geDeselectObject', 'geDeselectAll', 'geSelectFig', 'geDeselectFig',
  'gePointToGrid', 'geGetEditCellView', 'geHiZoomIn', 'geHiZoomOut', 'geHiZoomFit',
  'hiDisplayForm', 'hiCreateAppForm', 'hiCreateMenu', 'hiCreatePulldownMenu', 'hiAddMenuItem',
  'schCreateInst', 'schCreatePin', 'schHiCreateInst', 'schHiCreateWire'
]);

const PREFIX_FILTERS = ['db*', 'le*', 'ge*', 'hi*', 'sch*', 'cdf*', 'ipc*', 'dd*', 'rod*', 'tech*'];

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
  const [activePrefix, setActivePrefix] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: manualFns.length };
    manualFns.forEach(fn => {
      const cat = fn.category || 'Core Language';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [manualFns]);

  const categories = useMemo(() => {
    const cats = Object.keys(categoryCounts).filter(c => c !== "All").sort();
    return ["All", ...cats];
  }, [categoryCounts]);

  // Filter functions
  const filteredFns = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    return manualFns.filter(fn => {
      const name = fn.name || "";
      const desc = fn.description || "";
      const usage = fn.usage || "";
      const category = fn.category || "";

      // Match Search
      const matchesSearch = !query || 
        name.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query) ||
        usage.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query);
      
      // Match Category
      const matchesCategory = selectedCategory === "All" || fn.category === selectedCategory;

      // Match Prefix
      let matchesPrefix = true;
      if (activePrefix) {
        const prefixClean = activePrefix.replace('*', '').toLowerCase();
        matchesPrefix = name.toLowerCase().startsWith(prefixClean);
      }

      return matchesSearch && matchesCategory && matchesPrefix;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [manualFns, searchQuery, selectedCategory, activePrefix]);

  // Grouped by Category for 'grouped' view mode
  const groupedFns = useMemo(() => {
    const map = new Map<string, any[]>();
    filteredFns.forEach(fn => {
      const cat = fn.category || 'Core Language';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(fn);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredFns]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

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
              {/* Detail Header */}
              <div className="p-4 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between shrink-0">
                <button 
                  onClick={() => setSelectedFn(null)}
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider transition-all group"
                >
                  <ChevronRight size={16} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                  Back to List
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(selectedFn.usage)}
                    className="bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border border-white/10"
                  >
                    {copiedText === selectedFn.usage ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedText === selectedFn.usage ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => {
                      onInsert(selectedFn.usage.replace(/\[|\]/g, ''));
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                  >
                    <Code size={14} />
                    Insert
                  </button>
                </div>
              </div>
              
              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider ${getCategoryBadgeClass(selectedFn.category)}`}>
                      {selectedFn.category || "General"}
                    </span>
                    {(NEW_CATEGORIES.has(selectedFn.category) || NEW_FUNCTION_NAMES.has(selectedFn.name)) && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles size={10} /> NEW API
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight break-all font-mono">
                    {selectedFn.name}
                  </h2>
                </div>

                <section className="space-y-1.5">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Info size={12} className="text-indigo-400" />
                    Description
                  </h3>
                  <div className="text-slate-300 text-sm leading-relaxed bg-white/[0.02] border border-white/5 p-3.5 rounded-xl whitespace-pre-wrap">
                    {selectedFn.description || "No description available for this function."}
                  </div>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Hash size={12} className="text-emerald-400" />
                    Syntax
                  </h3>
                  <div className="bg-[#1a1c23] border border-white/5 rounded-xl p-3.5 font-mono text-xs text-indigo-300 shadow-inner overflow-x-auto whitespace-pre leading-relaxed">
                    {selectedFn.usage}
                  </div>
                </section>

                {selectedFn.parameters && (
                  <section className="space-y-1.5">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Code size={12} className="text-pink-400" />
                      Parameters
                    </h3>
                    <div className="text-slate-300 text-xs leading-relaxed bg-white/[0.02] border border-white/5 p-3.5 rounded-xl whitespace-pre-wrap font-mono">
                      {selectedFn.parameters}
                    </div>
                  </section>
                )}

                {selectedFn.example && (
                  <section className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <ExternalLink size={12} className="text-amber-400" />
                        Code Example
                      </h3>
                      <button
                        onClick={() => onInsert(selectedFn.example)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold uppercase tracking-wider flex items-center gap-1"
                      >
                        <Code size={12} /> Insert Example
                      </button>
                    </div>
                    <div className="bg-black/50 border border-white/5 rounded-xl p-4 font-mono text-xs text-emerald-400 shadow-inner whitespace-pre overflow-x-auto leading-relaxed">
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
              {/* Header Panel */}
              <div className="p-3.5 border-b border-white/[0.06] shrink-0 bg-white/[0.01] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-500/20">
                      <Book className="text-indigo-400" size={16} />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-white tracking-tight uppercase tracking-wider">Function Explorer</h2>
                      <p className="text-[10px] text-slate-400 font-medium">{manualFns.length} SKILL API functions indexed</p>
                    </div>
                  </div>

                  {/* View Mode Switcher */}
                  <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/5">
                    <button
                      onClick={() => setViewMode('flat')}
                      title="Flat List View"
                      className={`p-1 rounded-md text-xs transition-colors ${viewMode === 'flat' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <List size={13} />
                    </button>
                    <button
                      onClick={() => setViewMode('grouped')}
                      title="Grouped by Category"
                      className={`p-1 rounded-md text-xs transition-colors ${viewMode === 'grouped' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Grid size={13} />
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search name, syntax, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Prefix Filter Chips */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest shrink-0 pr-1">Prefix:</span>
                  {PREFIX_FILTERS.map(prefix => {
                    const isActive = activePrefix === prefix;
                    return (
                      <button
                        key={prefix}
                        onClick={() => setActivePrefix(isActive ? null : prefix)}
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-medium transition-all whitespace-nowrap border ${
                          isActive 
                            ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm' 
                            : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        {prefix}
                      </button>
                    );
                  })}
                  {activePrefix && (
                    <button
                      onClick={() => setActivePrefix(null)}
                      className="text-[9px] text-rose-400 hover:text-rose-300 ml-1 font-semibold underline shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Pills with Count Badges */}
                <div className="flex overflow-x-auto gap-1.5 pb-0.5 no-scrollbar mask-linear-fade-right">
                  {categories.map((cat) => {
                    const count = categoryCounts[cat] || 0;
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-sm"
                            : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono ${isSelected ? 'bg-indigo-500/30 text-indigo-200' : 'bg-white/5 text-slate-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Filter Summary Status */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>Showing {filteredFns.length} functions</span>
                  {(selectedCategory !== "All" || searchQuery || activePrefix) && (
                    <button 
                      onClick={() => {
                        setSelectedCategory("All");
                        setSearchQuery("");
                        setActivePrefix(null);
                      }}
                      className="text-indigo-400 hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>

              {/* Function List Output */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-black/10">
                {viewMode === 'flat' ? (
                  <>
                    {filteredFns.map((fn, idx) => {
                      const isNew = NEW_CATEGORIES.has(fn.category) || NEW_FUNCTION_NAMES.has(fn.name);
                      return (
                        <div
                          key={`${fn.name}-${idx}`}
                          onClick={() => setSelectedFn(fn)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group border border-transparent cursor-pointer ${
                            selectedFn?.name === fn.name 
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                            : 'hover:bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:border-white/[0.04]'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold truncate group-hover:text-white transition-colors">{fn.name}</span>
                              {isNew && (
                                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded uppercase tracking-wider shrink-0 border border-emerald-500/30">
                                  NEW
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{fn.description || 'No description'}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider border hidden sm:inline-block ${getCategoryBadgeClass(fn.category)}`}>
                              {fn.category}
                            </span>
                            <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {groupedFns.map(([categoryName, fns]) => (
                      <div key={categoryName} className="space-y-1 mb-3">
                        <div className="sticky top-0 z-10 bg-[#0b0c10]/95 backdrop-blur-sm py-1 px-2 border-b border-white/5 flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryBadgeClass(categoryName)}`}>
                            {categoryName}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">{fns.length} functions</span>
                        </div>
                        {fns.map((fn, idx) => {
                          const isNew = NEW_CATEGORIES.has(fn.category) || NEW_FUNCTION_NAMES.has(fn.name);
                          return (
                            <div
                              key={`${fn.name}-${idx}`}
                              onClick={() => setSelectedFn(fn)}
                              className="p-2 rounded-lg hover:bg-white/[0.03] text-slate-400 hover:text-slate-200 transition-all flex items-center justify-between cursor-pointer group"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs group-hover:text-white transition-colors">{fn.name}</span>
                                  {isNew && (
                                    <span className="px-1 py-0.1 bg-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 line-clamp-1">{fn.description}</span>
                              </div>
                              <ChevronRight size={12} className="text-slate-600 group-hover:text-indigo-400 transition-all shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </>
                )}

                {filteredFns.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Search className="text-slate-700 mb-2" size={28} />
                    <p className="text-slate-400 text-xs font-medium">No functions found</p>
                    <p className="text-slate-600 text-[11px] mt-1">Try adjusting search or category filters</p>
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
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-2 rounded-xl">
                  <Book className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight">SKILL API Function Explorer</h1>
                  <p className="text-slate-500 text-xs mt-0.5">Explore over {manualFns.length} standard Cadence SKILL functions</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
               {renderContent()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
