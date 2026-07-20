import React, { useState, useRef, useMemo } from 'react';
import { FileCode, Plus, Trash2, Edit2, Check, X, Folder, FolderOpen, ChevronRight, ChevronDown, Upload, FolderUp, Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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

interface TreeNode {
  name: string;
  fullPath: string;
  isFile: boolean;
  fileId?: string;
  children: Record<string, TreeNode>;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files, activeFileId, onFileSelect, onFilesChange
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileId?: string, folderPath?: string } | null>(null);
  
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const [editName, setEditName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  
  
  const handleExportFile = (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, file.name);
    }
  };


  const handleExportFolder = async (folderPath) => {
    const zip = new JSZip();
    const folderFiles = files.filter(f => f.name.startsWith(folderPath + '/'));
    if (folderFiles.length === 0) return;
    folderFiles.forEach(f => {
      const relativeName = f.name.substring(folderPath.length + 1);
      zip.file(relativeName, f.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const folderName = folderPath.split('/').pop() || 'folder';
    saveAs(blob, folderName + '.zip');
  };

  const handleExportAll = async () => {
    const zip = new JSZip();
    files.forEach(f => {
      zip.file(f.name, f.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'cadence_skill_project.zip');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    const newSkillFiles: SkillFile[] = [];
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const text = await file.text();
      // Handle webkitRelativePath for folder uploads
      const path = file.webkitRelativePath || file.name;
      newSkillFiles.push({
        id: uuidv4(),
        name: path,
        content: text
      });
      
      // Auto-expand uploaded folders
      const parts = path.split('/');
      if (parts.length > 1) {
        const folderPath = parts.slice(0, -1).join('/');
        setExpandedFolders(prev => new Set(prev).add(folderPath));
      }
    }

    if (newSkillFiles.length > 0) {
      const mergedFiles = [...files, ...newSkillFiles];
      onFilesChange(mergedFiles);
      onFileSelect(newSkillFiles[0].id);
    }
    
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const toggleFolder = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleAddFile = (folderPath: string = '') => {
    let newNum = 1;
    let baseName = `script${newNum}.il`;
    let newName = folderPath ? `${folderPath}/${baseName}` : baseName;
    
    while (files.some(f => f.name === newName)) {
      newNum++;
      baseName = `script${newNum}.il`;
      newName = folderPath ? `${folderPath}/${baseName}` : baseName;
    }
    const newFile = { id: uuidv4(), name: newName, content: '; New SKILL script\n' };
    onFilesChange([...files, newFile]);
    onFileSelect(newFile.id);
    
    if (folderPath) {
      setExpandedFolders(prev => new Set(prev).add(folderPath));
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (files.length === 1) return;
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
    let finalName = editName.trim();
    if (!finalName.endsWith('.il') && !finalName.includes('.')) {
      finalName += '.il';
    }
    onFilesChange(files.map(f => f.id === id ? { ...f, name: finalName } : f));
    setEditingId(null);
    
    const parts = finalName.split('/');
    if (parts.length > 1) {
       const folderPath = parts.slice(0, -1).join('/');
       setExpandedFolders(prev => new Set(prev).add(folderPath));
    }
  };

  const tree = useMemo(() => {
    const root: TreeNode = { name: '', fullPath: '', isFile: false, children: {} };
    
    files.forEach(file => {
      const parts = file.name.split('/');
      let current = root;
      let currentPath = '';
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isFile = i === parts.length - 1;
        
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            fullPath: currentPath,
            isFile,
            fileId: isFile ? file.id : undefined,
            children: {}
          };
        }
        current = current.children[part];
      }
    });
    
    return root;
  }, [files]);

  const renderTree = (node: TreeNode, depth: number = 0) => {
    const nodes = Object.values(node.children).sort((a, b) => {
      if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
      return a.isFile ? 1 : -1;
    });

    return nodes.map(child => {
      if (!child.isFile) {
        const isExpanded = expandedFolders.has(child.fullPath);
        return (
          <div key={child.fullPath}>
            <div 
              className="flex items-center justify-between py-1 px-2 rounded cursor-pointer text-[#94a3b8] hover:bg-white/5 hover:text-white transition-colors group"
              style={{ paddingLeft: `${(depth * 12) + 8}px` }}
              onClick={(e) => toggleFolder(child.fullPath, e)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, folderPath: child.fullPath });
              }}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {isExpanded ? <FolderOpen size={14} className="text-indigo-400" /> : <Folder size={14} />}
                <span className="truncate text-sm">{child.name}</span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); handleAddFile(child.fullPath); }} className="p-1 hover:bg-white/10 rounded" title="New file in folder">
                  <Plus size={12} />
                </button>
              </div>
            </div>
            {isExpanded && renderTree(child, depth + 1)}
          </div>
        );
      } else {
        const isActive = child.fileId === activeFileId;
        const file = files.find(f => f.id === child.fileId);
        if (!file) return null;
        
        return (
          <div 
            key={child.fileId}
            onClick={() => onFileSelect(child.fileId!)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, fileId: child.fileId });
            }}
            className={`flex items-center justify-between py-1.5 px-2 rounded cursor-pointer group transition-colors ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-[#94a3b8] hover:bg-white/5 hover:text-white'}`}
            style={{ paddingLeft: `${(depth * 12) + 24}px` }}
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <FileCode size={14} className="shrink-0" />
              {editingId === child.fileId ? (
                <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveRename(child.fileId!);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="bg-[#12141a] text-white text-xs w-full outline-none px-1 py-0.5 rounded border border-indigo-500/50"
                  />
                  <button onClick={() => saveRename(child.fileId!)} className="text-emerald-400 hover:text-emerald-300"><Check size={14}/></button>
                  <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300"><X size={14}/></button>
                </div>
              ) : (
                <span className="truncate text-sm">{child.name}</span>
              )}
            </div>
            {editingId !== child.fileId && (
              <div className={`flex items-center gap-1 shrink-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                <button onClick={(e) => startRename(e, file)} className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded">
                  <Edit2 size={12} />
                </button>
                {files.length > 1 && (
                  <button onClick={(e) => handleDelete(e, child.fileId!)} className="p-1 text-white/50 hover:text-red-400 hover:bg-white/10 rounded">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      }
    });
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
            onClick={handleExportAll}
            className="p-1 hover:bg-white/10 rounded text-[#94a3b8] hover:text-white transition-colors"
            title="Export Project"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={() => handleAddFile('')}
            className="p-1 hover:bg-white/10 rounded text-[#94a3b8] hover:text-white transition-colors"
            title="New File"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {renderTree(tree)}
      </div>
    
      {contextMenu && (
        <div 
          className="fixed z-50 bg-[#1e212b] border border-white/10 rounded shadow-xl py-1 w-48"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.fileId && (
            <>
              <button 
                className="w-full text-left px-3 py-1.5 text-sm text-[#94a3b8] hover:text-white hover:bg-indigo-500/20 flex items-center gap-2"
                onClick={() => {
                  const file = files.find(f => f.id === contextMenu.fileId);
                  if (file) startRename({ stopPropagation: () => {} } as any, file);
                  setContextMenu(null);
                }}
              >
                <Edit2 size={14} /> Rename
              </button>
              
              <button 
                className="w-full text-left px-3 py-1.5 text-sm text-[#94a3b8] hover:text-white hover:bg-indigo-500/20 flex items-center gap-2"
                onClick={() => {
                  handleExportFile(contextMenu.fileId);
                  setContextMenu(null);
                }}
              >
                <Download size={14} /> Export
              </button>
              <button 
                className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
                onClick={() => {
                  handleDelete({ stopPropagation: () => {}, preventDefault: () => {} } as any, contextMenu.fileId!);
                  setContextMenu(null);
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
          {contextMenu.folderPath && (
            <>
              <button 
                className="w-full text-left px-3 py-1.5 text-sm text-[#94a3b8] hover:text-white hover:bg-indigo-500/20 flex items-center gap-2"
                onClick={() => {
                  handleAddFile(contextMenu.folderPath);
                  setContextMenu(null);
                }}
              >
                <Plus size={14} /> New File Here
              </button>
            
              <button 
                className="w-full text-left px-3 py-1.5 text-sm text-[#94a3b8] hover:text-white hover:bg-indigo-500/20 flex items-center gap-2"
                onClick={() => {
                  handleExportFolder(contextMenu.folderPath);
                  setContextMenu(null);
                }}
              >
                <Download size={14} /> Export Folder
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
