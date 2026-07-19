import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, FileCode, ChevronRight, ChevronDown, X } from 'lucide-react';
import type { SkillFile } from './FileExplorer';

interface SearchSidebarProps {
  files: SkillFile[];
  onResultClick: (fileId: string, line: number) => void;
  onClose: () => void;
}

interface SearchResult {
  fileId: string;
  fileName: string;
  line: number;
  text: string;
  matchStart: number;
  matchLength: number;
}

export const SearchSidebar: React.FC<SearchSidebarProps> = ({ files, onResultClick, onClose }) => {
  const [query, setQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const results = useMemo(() => {
    if (!query) return [];

    let regex: RegExp;
    try {
      const flags = matchCase ? 'g' : 'gi';
      regex = useRegex ? new RegExp(query, flags) : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    } catch {
      return [];
    }

    const allResults: SearchResult[] = [];

    files.forEach(file => {
      const lines = file.content.split('\n');
      lines.forEach((lineText, lineIdx) => {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(lineText)) !== null) {
          allResults.push({
            fileId: file.id,
            fileName: file.name,
            line: lineIdx + 1,
            text: lineText.trim(),
            matchStart: match.index - (lineText.length - lineText.trimStart().length),
            matchLength: match[0].length
          });
          // Prevent infinite loops on empty matches
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      });
    });

    return allResults;
  }, [query, files, matchCase, useRegex]);

  const groupedResults = useMemo(() => {
    const grouped = new Map<string, SearchResult[]>();
    results.forEach(r => {
      if (!grouped.has(r.fileId)) grouped.set(r.fileId, []);
      grouped.get(r.fileId)!.push(r);
    });
    return Array.from(grouped.entries()).map(([fileId, items]) => ({
      fileId,
      fileName: items[0].fileName,
      items
    }));
  }, [results]);

  const toggleFile = (fileId: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0c10]">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <SearchIcon size={16} className="text-indigo-400" />
            Search
          </h2>
          <button onClick={onClose} className="p-1 text-[#94a3b8] hover:text-white rounded">
            <X size={16} />
          </button>
        </div>
        
        <div className="flex flex-col gap-2 relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-[#12141a] text-white text-sm px-3 py-1.5 rounded border border-white/10 outline-none focus:border-indigo-500 transition-colors"
            autoFocus
          />
          <div className="absolute right-2 top-1.5 flex items-center gap-1">
            <button 
              onClick={() => setMatchCase(!matchCase)}
              className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${matchCase ? 'bg-indigo-500/20 text-indigo-400' : 'text-[#94a3b8] hover:text-white'}`}
              title="Match Case"
            >
              Aa
            </button>
            <button 
              onClick={() => setUseRegex(!useRegex)}
              className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${useRegex ? 'bg-indigo-500/20 text-indigo-400' : 'text-[#94a3b8] hover:text-white'}`}
              title="Use Regular Expression"
            >
              .*
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {query && groupedResults.length === 0 && (
          <div className="text-center text-[#94a3b8] text-sm mt-4">
            No results found.
          </div>
        )}
        
        {groupedResults.map(group => {
          const isExpanded = !expandedFiles.has(group.fileId);
          return (
            <div key={group.fileId} className="mb-2">
              <div 
                onClick={() => toggleFile(group.fileId)}
                className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/5 rounded cursor-pointer text-[#94a3b8] hover:text-white"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <FileCode size={14} className="text-indigo-400 opacity-70" />
                <span className="text-sm font-mono truncate flex-1">{group.fileName}</span>
                <span className="text-xs bg-white/10 px-1.5 rounded-full">{group.items.length}</span>
              </div>
              
              {isExpanded && (
                <div className="mt-1">
                  {group.items.map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => onResultClick(item.fileId, item.line)}
                      className="group flex gap-2 pl-8 pr-2 py-1 text-xs font-mono cursor-pointer hover:bg-white/5 rounded"
                    >
                      <span className="text-[#94a3b8] select-none w-6 text-right shrink-0">{item.line}</span>
                      <div className="truncate text-[#94a3b8] group-hover:text-white">
                        <span>{item.text.substring(0, Math.max(0, item.matchStart))}</span>
                        <span className="bg-indigo-500/30 text-indigo-200">
                          {item.text.substring(item.matchStart, item.matchStart + item.matchLength)}
                        </span>
                        <span>{item.text.substring(item.matchStart + item.matchLength)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
