import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('{isConsoleOpen && (\n            <>\n              \n              <div className="h-64 flex flex-col min-w-0">', '{isConsoleOpen && (\n              <div className="h-64 flex flex-col min-w-0">')
content = content.replace('isSimulating={isSimulating}\n            />\n              \n            \n          )}', 'isSimulating={isSimulating}\n            />\n              </div>\n          )}')

with open('src/App.tsx', 'w') as f:
    f.write(content)

