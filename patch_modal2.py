import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add the modal component at the end right before the Debugger
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

if '<SettingsModal' not in content:
    content = content.replace('<GitHubSyncModal', modal_jsx + '      <GitHubSyncModal')

with open('src/App.tsx', 'w') as f:
    f.write(content)

