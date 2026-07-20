const fs = require('fs');
let code = fs.readFileSync('src/editor/skillInterpreter.ts', 'utf8');
code = code.replace(/throw new Error\(\`\*Error\* eval: unbound variable - \$\{expr.name\}\`\);/, "throw new Error(`*Error* eval: unbound variable - ${expr.name} at line ${expr.line}\\nEnv: ${JSON.stringify(Array.from(env.vars.keys()))}`);");
fs.writeFileSync('src/editor/skillInterpreter.ts', code);
