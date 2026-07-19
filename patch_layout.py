import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add imports
if 'import { Panel' not in content:
    content = content.replace('import { EditorTabs } from "./components/EditorTabs";', 'import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";\nimport { EditorTabs } from "./components/EditorTabs";')

# Replace the layout
start_str = '<main className="flex flex-1 overflow-hidden relative">'
end_str = '</main>'

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

main_content = content[start_idx:end_idx]

# We want to wrap the aside in a Panel
new_main = main_content.replace('<AnimatePresence initial={false}>', '<PanelGroup direction="horizontal">\n        <AnimatePresence initial={false}>')

new_main = new_main.replace('<motion.aside', '<Panel defaultSize={20} minSize={15} maxSize={40} className="relative z-30">\n              <motion.aside')
new_main = new_main.replace('</motion.aside>', '</motion.aside>\n            </Panel>')
new_main = new_main.replace('</AnimatePresence>', '</AnimatePresence>\n        {activeTab && <PanelResizeHandle className="w-1 bg-white/5 hover:bg-indigo-500/50 cursor-col-resize transition-colors" />}\n        <Panel>\n          <PanelGroup direction="vertical">')

# Editor part
new_main = new_main.replace('<div className="flex-1 flex flex-col min-w-0">', '<Panel defaultSize={70} minSize={30} className="flex flex-col min-w-0">')
new_main = new_main.replace('</section>', '</section>\n          </Panel>')

# Console part
new_main = new_main.replace('{isConsoleOpen && (', '{isConsoleOpen && (\n            <>\n              <PanelResizeHandle className="h-1 bg-white/5 hover:bg-indigo-500/50 cursor-row-resize transition-colors" />\n              <Panel defaultSize={30} minSize={20} className="flex flex-col min-w-0">')
new_main = new_main.replace('/>\n          )}', '/>\n              </Panel>\n            </>\n          )}')

# End wrapper
new_main = new_main.replace('</div>\n      </main>', '          </PanelGroup>\n        </Panel>\n      </PanelGroup>\n      </main>')

content = content[:start_idx] + new_main + content[end_idx:]

with open('src/App.tsx', 'w') as f:
    f.write(content)

