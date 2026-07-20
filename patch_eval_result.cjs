const fs = require('fs');

let code = fs.readFileSync('src/editor/skillInterpreter.ts', 'utf8');

code = code.replace(/export interface EvaluationResult \{[\s\S]*?type: 'success' \| 'error';\n\}/,
`export interface EvaluationResult {
  value: any;
  output: string[];
  type: 'success' | 'error';
  line?: number;
  col?: number;
}`);

code = code.replace(/return \{ value: null, output: \[\.\.\.output, err\.message\], type: 'error' \};/,
`return { value: null, output: [...output, err.message], type: 'error', line: err.line, col: err.col };`);

fs.writeFileSync('src/editor/skillInterpreter.ts', code);
console.log("Patched EvaluationResult");
