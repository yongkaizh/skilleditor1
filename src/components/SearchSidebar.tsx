import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, FileCode, ChevronRight, ChevronDown, X } from 'lucide-react';
import type { SkillFile } from './FileExplorer';

interface SearchSidebarProps {
  files: SkillFile[];
  onResultClick: (fileId: string, line: number) => void;
  onReplaceAll?: (replacePairs: {fileId: string, content: string}[]) => void;
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

export const SearchSidebar: React.FC<SearchSidebarProps> = ({ files, onResultClick, onReplaceAll, onClose }) => {
  const [query, setQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);

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

    const performReplaceAll = () => {
    if (!onReplaceAll || !query) return;
    
    let regex: RegExp;
    try {
      const flags = matchCase ? 'g' : 'gi';
      regex = useRegex ? new RegExp(query, flags) : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    } catch {
      return;
    }

    const replacePairs: {fileId: string, content: string}[] = [];
    files.forEach(file => {
      let newContent = file.content;
      let hasMatch = false;
      if (newContent.match(regex)) {
        hasMatch = true;
        newContent = newContent.replace(regex, replaceText);
      }
      if (hasMatch) {
        replacePairs.push({ fileId: file.id, content: newContent });
      }
    });
    
    if (replacePairs.length > 0) {
      onReplaceAll(replacePairs);
    }
  };
  
  const performReplace = (item: SearchResult) => {
    if (!onReplaceAll || !query) return;
    
    const file = files.find(f => f.id === item.fileId);
    if (!file) return;
    
    const lines = file.content.split('\n');
    const targetLine = lines[item.line - 1];
    
    const before = targetLine.substring(0, item.matchStart);
    const after = targetLine.substring(item.matchStart + item.matchLength);
    const newLine = before + replaceText + after;
    
    lines[item.line - 1] = newLine;
    onReplaceAll([{ fileId: file.id, content: lines.join('\n') }]);
  };
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
        
        <div className="flex flex-col gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowReplace(!showReplace)}
              className="absolute left-2 top-2 text-[#94a3b8] hover:text-white transition-colors z-10"
            >
              {showReplace ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-[#12141a] text-white text-sm pl-7 pr-16 py-1.5 rounded border border-white/10 outline-none focus:border-indigo-500 transition-colors"
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
          
          {showReplace && (
            <div className="relative flex flex-col gap-2">
              <input
                type="text"
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                placeholder="Replace with..."
                className="w-full bg-[#12141a] text-white text-sm px-3 py-1.5 rounded border border-white/10 outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={performReplaceAll}
                  disabled={!query || results.length === 0}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-xs rounded disabled:opacity-50 transition-colors"
                >
                  Replace All
                </button>
              </div>
            </div>
          )}
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
                      className="group flex items-center gap-2 pl-8 pr-2 py-1 text-xs font-mono cursor-pointer hover:bg-white/5 rounded"
                    >
                      <div className="flex-1 flex gap-2 overflow-hidden" onClick={() => onResultClick(item.fileId, item.line)}>
                        <span className="text-[#94a3b8] select-none w-6 text-right shrink-0">{item.line}</span>
                        <div className="truncate text-[#94a3b8] group-hover:text-white">
                          <span>{item.text.substring(0, Math.max(0, item.matchStart))}</span>
                          <span className="bg-indigo-500/30 text-indigo-200">
                            {item.text.substring(item.matchStart, item.matchStart + item.matchLength)}
                          </span>
                          <span>{item.text.substring(item.matchStart + item.matchLength)}</span>
                        </div>
                      </div>
                      {showReplace && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); performReplace(item); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-500/20 text-indigo-300 rounded transition-all shrink-0"
                          title="Replace"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4c0-1.1.9-2 2-2s2 .9 2 2-2 2-2 2-.9-2-2-2z"/><path d="M22 6c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/><path d="M4 14l6-6"/><path d="M14 4L4 14"/><path d="M4 14v6h6L22 8l-6-6-6 6"/></svg>
                        </button>
                      )}
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
