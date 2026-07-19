import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, FileCode, Folder } from 'lucide-react';
import type { SkillFile } from './FileExplorer';

interface EditorBreadcrumbsProps {
  activeFile: SkillFile;
  files: SkillFile[];
  onFileSelect: (id: string) => void;
}

export const EditorBreadcrumbs: React.FC<EditorBreadcrumbsProps> = ({ activeFile, files, onFileSelect }) => {
  const parts = activeFile.name.split('/');
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDropdownItems = (index: number) => {
    // If index is the last part (file), show all files in the same directory
    // If index is a folder, show all subfolders/files in that directory
    
    const prefixParts = parts.slice(0, index);
    const prefix = prefixParts.length > 0 ? prefixParts.join('/') + '/' : '';
    
    // Find all files that start with this prefix
    const filesInDir = files.filter(f => f.name.startsWith(prefix));
    
    // We want to group by the next part of the path
    const items = new Map<string, { isFile: boolean, name: string, id?: string, fullPath: string }>();
    
    filesInDir.forEach(f => {
      const remainingPath = f.name.substring(prefix.length);
      if (!remainingPath) return; // shouldn't happen
      
      const nextSlashIndex = remainingPath.indexOf('/');
      if (nextSlashIndex === -1) {
        // It's a file in this directory
        items.set(remainingPath, { isFile: true, name: remainingPath, id: f.id, fullPath: f.name });
      } else {
        // It's a folder
        const folderName = remainingPath.substring(0, nextSlashIndex);
        if (!items.has(folderName)) {
          items.set(folderName, { isFile: false, name: folderName, fullPath: prefix + folderName });
        }
      }
    });
    
    return Array.from(items.values()).sort((a, b) => {
      if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
      return a.isFile ? 1 : -1; // folders first
    });
  };

  return (
    <div className="flex items-center gap-1 text-[13px] font-mono normal-case tracking-normal" ref={dropdownRef}>
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        const isOpen = openDropdownIndex === index;
        const dropdownItems = getDropdownItems(index);
        
        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight size={14} className="text-[#94a3b8]/50" />}
            
            <div className="relative">
              <button
                onClick={() => setOpenDropdownIndex(isOpen ? null : index)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                  isOpen 
                    ? 'bg-indigo-500/20 text-indigo-300' 
                    : isLast 
                      ? 'text-indigo-400 hover:bg-white/5' 
                      : 'text-[#94a3b8] hover:bg-white/5 hover:text-white'
                }`}
              >
                {!isLast && <Folder size={14} className="opacity-70" />}
                {isLast && <FileCode size={14} className="opacity-70" />}
                <span className="tracking-tight">{part}</span>
              </button>
              
              {isOpen && dropdownItems.length > 0 && (
                <div className="absolute top-full left-0 mt-1 min-w-[200px] max-h-[300px] overflow-y-auto bg-[#1e212b] border border-white/10 rounded-lg shadow-xl z-50 py-1">
                  {dropdownItems.map(item => (
                    <button
                      key={item.fullPath}
                      onClick={() => {
                        if (item.isFile && item.id) {
                          onFileSelect(item.id);
                          setOpenDropdownIndex(null);
                        } else {
                          // Could potentially navigate into the folder by selecting its first file?
                          // For simplicity, we just navigate to the first file in that folder
                          const firstFile = files.find(f => f.name.startsWith(item.fullPath + '/'));
                          if (firstFile) {
                            onFileSelect(firstFile.id);
                            setOpenDropdownIndex(null);
                          }
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/5 transition-colors"
                    >
                      {item.isFile ? (
                        <FileCode size={14} className="text-indigo-400" />
                      ) : (
                        <Folder size={14} className="text-[#94a3b8]" />
                      )}
                      <span className={`truncate ${item.isFile && item.name === part ? 'text-indigo-300 font-medium' : 'text-[#94a3b8]'}`}>
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
