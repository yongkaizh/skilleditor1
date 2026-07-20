import { skillInterpreter } from './src/editor/skillInterpreter';
const code = `
      if( null(varList) then t
      else
        let( (v res) v = car(varList)
          assign[v] = 0
          if( null(res) then assign[v] = -1 )
          res
        )
      )
`;
console.log(JSON.stringify((skillInterpreter as any).parse((skillInterpreter as any).tokenize(code)), null, 2));
