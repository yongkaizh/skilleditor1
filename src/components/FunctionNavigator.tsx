import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { projectState } from '../editor/projectState';
import type { ProjectFunction } from '../editor/projectState';

interface FunctionNavigatorProps {
  onFunctionClick: (fn: ProjectFunction) => void;
}

export const FunctionNavigator: React.FC<FunctionNavigatorProps> = ({ onFunctionClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const funcs = projectState.functions.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 h-1/2 border-t border-white/5">
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 shrink-0">
        <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
          Project Functions
        </h3>
      </div>
      <div className="px-3 py-2 border-b border-white/5 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#12141a] text-xs text-white px-2 py-1.5 pl-7 rounded border border-white/10 outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {funcs.map((fn, idx) => (
          <div 
            key={`${fn.name}-${idx}`}
            onClick={() => onFunctionClick(fn)}
            className="px-3 py-2 mb-1 rounded cursor-pointer text-[#94a3b8] hover:bg-white/5 hover:text-white transition-colors flex flex-col gap-1 group"
          >
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-indigo-400 font-bold group-hover:text-indigo-300">ƒ</span>
              <span className="truncate">{fn.name}</span>
            </div>
            <div className="text-[10px] text-white/40 flex justify-between">
              <span className="truncate max-w-[120px]">{fn.fileName}</span>
              <span>Ln {fn.line}</span>
            </div>
          </div>
        ))}
        {funcs.length === 0 && (
          <div className="text-center text-white/30 text-xs mt-4 italic">
            No functions found
          </div>
        )}
      </div>
    </div>
  );
};
