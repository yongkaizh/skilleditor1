const fs = require('fs');
let code = fs.readFileSync('src/editor/skillInterpreter.ts', 'utf8');
code = code.replace(/throw new Error\(\`\*Error\* eval: unbound variable - \$\{expr.name\} at line \$\{expr.line\}\\nEnv keys: \$\{JSON.stringify\(Array.from\(env.vars.keys\(\)\)\)\}\\nHas: \$\{env.vars.has\(expr.name\)\}\\nGet: \$\{env.get\(expr.name\)\}\`\);/, "throw new Error(`*Error* eval: unbound variable - ${expr.name} at line ${expr.line}\\nvarList: ${env.get('varList')}`);");
fs.writeFileSync('src/editor/skillInterpreter.ts', code);
