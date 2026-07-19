const fs = require('fs');
let content = fs.readFileSync('src/editor/skillInterpreter.ts', 'utf8');

content = content.replace("const args = argsStr.split(',').filter(s => s.trim()).map(p => this.evaluateExpression(p.trim()));", `
      let inQ = false;
      let cleanArgs = "";
      for (let i=0; i<argsStr.length; i++) {
         if(argsStr[i] === '"') inQ = !inQ;
         if(argsStr[i] === ',' && !inQ) cleanArgs += ' ';
         else cleanArgs += argsStr[i];
      }
      const parts = this.tokenize(cleanArgs);
      const args = parts.map(p => this.evaluateExpression(p));
`);
fs.writeFileSync('src/editor/skillInterpreter.ts', content);
