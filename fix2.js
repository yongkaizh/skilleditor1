const fs = require('fs');
let text = fs.readFileSync('src/editor/skillInterpreter.ts', 'utf8');
const searchStr = `      str = str.replace(/\\n/g, '\n');\n      str = str.replace(/\\t/g, '\t');`;
text = text.replace(searchStr, "      str = str.replace(/\\\\n/g, '\\n');\n      str = str.replace(/\\\\t/g, '\\t');");
fs.writeFileSync('src/editor/skillInterpreter.ts', text);
