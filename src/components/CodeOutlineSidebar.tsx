import React, { useMemo } from 'react';
import { X, ListTree, Box, FunctionSquare } from 'lucide-react';

interface CodeOutlineSidebarProps {
  content: string;
  onNavigate: (line: number) => void;
  onClose: () => void;
}

interface OutlineItem {
  name: string;
  line: number;
}

export const CodeOutlineSidebar: React.FC<CodeOutlineSidebarProps> = ({ content, onNavigate, onClose }) => {
  const { procedures, globals } = useMemo(() => {
    const lines = content.split('\n');
    const procs: OutlineItem[] = [];
    const glbs: OutlineItem[] = [];
    
    let depth = 0;
    let inString = false;
    let inComment = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const procMatch = line.match(/\b(?:procedure|defun)\s*\(\s*([a-zA-Z_]\w*)/);
      if (procMatch) {
        procs.push({ name: procMatch[1], line: i + 1 });
      }

      if (depth === 0) {
        const assignMatch = line.match(/^\s*([a-zA-Z_]\w*)\s*=/);
        if (assignMatch) {
          glbs.push({ name: assignMatch[1], line: i + 1 });
        }
        const setqMatch = line.match(/^\s*setq\s*\(\s*([a-zA-Z_]\w*)/);
        if (setqMatch) {
          glbs.push({ name: setqMatch[1], line: i + 1 });
        }
      }

      // simplistic depth tracking
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === ';') break; // line comment
        if (char === '"' && line[j-1] !== '\\') inString = !inString;
        
        if (!inString && !inComment) {
          if (char === '(' || char === '{' || char === '[') depth++;
          if (char === ')' || char === '}' || char === ']') depth--;
        }
      }
      
      if (depth < 0) depth = 0;
    }
    
    return { procedures: procs, globals: glbs };
  }, [content]);

  return (
    <div className="w-80 border-r border-white/[0.04] bg-[#0b0c10]/50 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-200 font-medium">
          <ListTree size={16} className="text-indigo-400" />
          Code Outline
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Procedures</h3>
          {procedures.length > 0 ? (
            <div className="space-y-1">
              {procedures.map((proc, idx) => (
                <button
                  key={`${proc.name}-${idx}`}
                  onClick={() => onNavigate(proc.line)}
                  className="w-full text-left px-2 py-1.5 flex items-center gap-2 rounded-lg hover:bg-white/5 text-sm text-slate-300 hover:text-indigo-300 transition-colors"
                >
                  <FunctionSquare size={14} className="text-emerald-500 shrink-0" />
                  <span className="truncate">{proc.name}</span>
                  <span className="ml-auto text-xs text-slate-500 font-mono">L{proc.line}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 px-2 italic">No procedures found</div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Global Variables</h3>
          {globals.length > 0 ? (
            <div className="space-y-1">
              {globals.map((glb, idx) => (
                <button
                  key={`${glb.name}-${idx}`}
                  onClick={() => onNavigate(glb.line)}
                  className="w-full text-left px-2 py-1.5 flex items-center gap-2 rounded-lg hover:bg-white/5 text-sm text-slate-300 hover:text-amber-300 transition-colors"
                >
                  <Box size={14} className="text-amber-500 shrink-0" />
                  <span className="truncate">{glb.name}</span>
                  <span className="ml-auto text-xs text-slate-500 font-mono">L{glb.line}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 px-2 italic">No global variables found</div>
          )}
        </div>
      </div>
    </div>
  );
};
