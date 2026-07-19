import React from 'react';
import { X, FileCode } from 'lucide-react';
import type { SkillFile } from './FileExplorer';

interface EditorTabsProps {
  files: SkillFile[];
  openFileIds: string[];
  activeFileId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string, e: React.MouseEvent) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  files, openFileIds, activeFileId, onTabSelect, onTabClose
}) => {
  return (
    <div className="flex bg-[#0b0c10] border-b border-white/[0.04] overflow-x-auto hide-scrollbar">
      {openFileIds.map(id => {
        const file = files.find(f => f.id === id);
        if (!file) return null;
        const isActive = id === activeFileId;
        return (
          <div
            key={id}
            onClick={() => onTabSelect(id)}
            className={`group flex items-center gap-2 px-4 py-2 min-w-[120px] max-w-[200px] border-r border-white/[0.04] cursor-pointer transition-colors ${
              isActive 
                ? 'bg-[#12141a] text-indigo-300 border-t-2 border-t-indigo-500' 
                : 'bg-[#0b0c10] text-[#94a3b8] hover:bg-[#12141a]/50 border-t-2 border-t-transparent'
            }`}
          >
            <FileCode size={14} className={isActive ? 'text-indigo-400' : 'opacity-70'} />
            <span className="truncate text-[13px] font-mono flex-1">{file.name}</span>
            <button
              onClick={(e) => onTabClose(id, e)}
              className={`p-0.5 rounded-md hover:bg-white/10 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
