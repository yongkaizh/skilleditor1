import re

with open('src/components/FileExplorer.tsx', 'r') as f:
    content = f.read()

# Add contextMenu state and effect to close it
if 'const [contextMenu' not in content:
    state_injection = """  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileId?: string, folderPath?: string } | null>(null);
  
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
"""
    content = content.replace("  const [editingId, setEditingId] = useState<string | null>(null);", state_injection)

# Folder right click
content = content.replace('onClick={(e) => toggleFolder(child.fullPath, e)}', 'onClick={(e) => toggleFolder(child.fullPath, e)}\n              onContextMenu={(e) => {\n                e.preventDefault();\n                setContextMenu({ x: e.clientX, y: e.clientY, folderPath: child.fullPath });\n              }}')

# File right click
content = content.replace('onClick={() => onFileSelect(child.fileId!)}', 'onClick={() => onFileSelect(child.fileId!)}\n            onContextMenu={(e) => {\n              e.preventDefault();\n              setContextMenu({ x: e.clientX, y: e.clientY, fileId: child.fileId });\n            }}')

# Add the context menu render at the end
context_menu_render = """
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
                className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
                onClick={() => {
                  handleDeleteFile(contextMenu.fileId!);
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
            </>
          )}
        </div>
      )}
"""
content = content.replace('</div>\n  );\n};', context_menu_render + '    </div>\n  );\n};')

with open('src/components/FileExplorer.tsx', 'w') as f:
    f.write(content)

