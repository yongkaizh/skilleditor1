const fs = require('fs');
let text = fs.readFileSync('src/editor/skillInterpreter.ts', 'utf8');
text = text.replace("    });\n  public setOutputHandler", "    });\n  }\n\n  public setOutputHandler");
fs.writeFileSync('src/editor/skillInterpreter.ts', text);
