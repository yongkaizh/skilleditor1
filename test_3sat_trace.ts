import { skillInterpreter } from './src/editor/skillInterpreter';
const code = `
procedure( solve3SAT(clauses vars)
  let( (assign)
    assign = makeTable("a" -1)
    procedure( backtrack(varList)
      println("varList is: ")
      println(varList)
      if( null(varList) then t
      else
        let( (v res) v = car(varList)
          println("v is: ")
          println(v)
          res = t
          res
        )
      )
    )
    backtrack(vars)
  )
)
vars = '(1 2 3)
clauses = '( (1 2 -3) )
solve3SAT(clauses vars)
`;
async function run() { console.log(await skillInterpreter.evaluate(code)); }
run();
