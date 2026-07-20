import { skillInterpreter } from './src/editor/skillInterpreter';
const code = `let( (v res) v = car(varList) \n assign[v] = 0 )`;
console.log(JSON.stringify((skillInterpreter as any).parse((skillInterpreter as any).tokenize(code)), null, 2));
