import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

if 'import { SettingsModal }' not in content:
    content = content.replace('import { GitHubSyncModal } from "./components/GitHubSyncModal";', 'import { GitHubSyncModal } from "./components/GitHubSyncModal";\nimport { SettingsModal } from "./components/SettingsModal";')
    content = content.replace('import { FileArchive,', 'import { FileArchive, Settings,')

if 'const [isSettingsOpen' not in content:
    content = content.replace('const [isConsoleOpen, setIsConsoleOpen] = useState(false);', 'const [isConsoleOpen, setIsConsoleOpen] = useState(false);\n  const [isSettingsOpen, setIsSettingsOpen] = useState(false);')

# Add the button in header
header_btn = """          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Settings size={16} className="text-slate-400" />
            <span className="hidden md:inline">Settings</span>
          </button>
"""
content = content.replace('<button \n            onClick={handleDownload}', header_btn + '          <button \n            onClick={handleDownload}')

# Add the modal component at the end
modal_jsx = """
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        wordWrap={wordWrap} 
        setWordWrap={setWordWrap} 
        showMinimap={showMinimap} 
        setShowMinimap={setShowMinimap} 
        fontSize={fontSize} 
        setFontSize={setFontSize} 
      />
"""
content = content.replace('</AnimatePresence>\n      <AnimatePresence>\n        <Debugger', '</AnimatePresence>\n' + modal_jsx + '      <AnimatePresence>\n        <Debugger')

with open('src/App.tsx', 'w') as f:
    f.write(content)

