import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace imports
content = content.replace('import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";\n', '')

# Remove PanelGroup
content = content.replace('<PanelGroup direction="horizontal">', '')
content = content.replace('<PanelGroup direction="vertical">', '')
content = content.replace('</PanelGroup>', '')
content = content.replace('<Panel defaultSize={20} minSize={15} maxSize={40} className="relative z-30">', '')
content = content.replace('<Panel defaultSize={70} minSize={30} className="flex flex-col min-w-0">', '<div className="flex-1 flex flex-col min-w-0">')
content = content.replace('<Panel defaultSize={30} minSize={20} className="flex flex-col min-w-0">', '<div className="h-64 flex flex-col min-w-0">')
content = content.replace('</Panel>', '</div>')
content = content.replace('{activeTab && <PanelResizeHandle className="w-1 bg-white/5 hover:bg-indigo-500/50 cursor-col-resize transition-colors" />}', '')
content = content.replace('<PanelResizeHandle className="h-1 bg-white/5 hover:bg-indigo-500/50 cursor-row-resize transition-colors" />', '')

# Fix extra closing divs created by replacing Panel with div
content = content.replace('</div>\n            </>\n          )}', '\n            </>\n          )}')
content = content.replace('</div>\n        </div>\n      </main>', '</div>\n      </main>')
content = content.replace('</div>\n            </div>', '</div>')


with open('src/App.tsx', 'w') as f:
    f.write(content)

