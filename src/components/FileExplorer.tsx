import React, { useState, useRef } from 'react';
import { FileCode, Plus, Trash2, Edit2, Check, X, Upload, FolderUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export interface SkillFile {
  id: string;
  name: string;
  content: string;
}

interface FileExplorerProps {
  files: SkillFile[];
  activeFileId: string;
  onFileSelect: (id: string) => void;
  onFilesChange: (files: SkillFile[]) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files, activeFileId, onFileSelect, onFilesChange
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    const newSkillFiles: SkillFile[] = [];
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      // Basic filter for text files
      const text = await file.text();
      newSkillFiles.push({
        id: uuidv4(),
        name: file.name,
        content: text
      });
    }

    if (newSkillFiles.length > 0) {
      const mergedFiles = [...files, ...newSkillFiles];
      // Keep only unique names, new overrides old or we can just append
      // To avoid duplicates we could filter
      onFilesChange(mergedFiles);
      onFileSelect(newSkillFiles[0].id);
    }
    
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleAddFile = () => {
    let newNum = files.length + 1;
    let name = `script${newNum}.il`;
    while (files.some(f => f.name === name)) {
      newNum++;
      name = `script${newNum}.il`;
    }
    const newFile = { id: uuidv4(), name, content: '; New SKILL script\n' };
    onFilesChange([...files, newFile]);
    onFileSelect(newFile.id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (files.length === 1) return; // Don't delete last file
    const newFiles = files.filter(f => f.id !== id);
    onFilesChange(newFiles);
    if (activeFileId === id) {
      onFileSelect(newFiles[0].id);
    }
  };

  const startRename = (e: React.MouseEvent, file: SkillFile) => {
    e.stopPropagation();
    setEditingId(file.id);
    setEditName(file.name);
  };

  const saveRename = (id: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    const finalName = editName.trim().endsWith('.il') ? editName.trim() : editName.trim() + '.il';
    onFilesChange(files.map(f => f.id === id ? { ...f, name: finalName } : f));
    setEditingId(null);
  };

  return (
    <div className="flex flex-col flex-1 h-1/2 shrink-0 min-h-0">
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
          Project Files
        </h3>
        <div className="flex items-center gap-1">
          <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".il,.txt,.skill,.cdn" />
          <input type="file" ref={folderInputRef} className="hidden" onChange={handleFileUpload} {...({ webkitdirectory: "true", directory: "true" } as any)} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-1 hover:bg-white/10 rounded text-[#94a3b8] hover:text-white transition-colors"
            title="Import Files"
          >
            <Upload size={14} />
          </button>
          <button 
            onClick={() => folderInputRef.current?.click()}
            className="p-1 hover:bg-white/10 rounded text-[#94a3b8] hover:text-white transition-colors"
            title="Import Folder"
          >
            <FolderUp size={14} />
          </button>
          <button 
            onClick={handleAddFile}
            className="p-1 hover:bg-white/10 rounded text-[#94a3b8] hover:text-white transition-colors"
            title="New File"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {files.map(file => {
          const isActive = file.id === activeFileId;
          return (
            <div 
              key={file.id}
              onClick={() => onFileSelect(file.id)}
              className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer group transition-colors ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-[#94a3b8] hover:bg-white/5 hover:text-white'}`}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <FileCode size={14} className="shrink-0" />
                {editingId === file.id ? (
                  <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveRename(file.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="bg-[#12141a] text-white text-xs w-full outline-none px-1 py-0.5 rounded border border-indigo-500/50"
                    />
                    <button onClick={() => saveRename(file.id)} className="text-emerald-400 hover:text-emerald-300"><Check size={14}/></button>
                    <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300"><X size={14}/></button>
                  </div>
                ) : (
                  <span className="truncate text-sm">{file.name}</span>
                )}
              </div>
              {editingId !== file.id && (
                <div className={`flex items-center gap-1 shrink-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                  <button onClick={(e) => startRename(e, file)} className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded">
                    <Edit2 size={12} />
                  </button>
                  {files.length > 1 && (
                    <button onClick={(e) => handleDelete(e, file.id)} className="p-1 text-white/50 hover:text-red-400 hover:bg-white/10 rounded">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
