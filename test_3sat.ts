import { skillInterpreter } from './src/editor/skillInterpreter';
const code = `
; Solution: Simple Backtracking for 3-SAT
procedure( solve3SAT(clauses vars)
  let( (assign)
    assign = makeTable("a" -1)
    procedure( check(cls asgn)
      let( (ok) ok=t
        foreach( c cls
          let( (c_ok unknown) c_ok=nil unknown=nil
            foreach( l c
              let( (var sign val)
                var = abs(l) sign = if( l>0 then 1 else 0 )
                val = asgn[var]
                if( val == -1 then unknown = t
                else if( val == sign then c_ok = t ) )
              )
            )
            if( null(c_ok) && null(unknown) then ok = nil )
          )
        )
        ok
      )
    )
    procedure( backtrack(varList)
      if( null(varList) then t
      else
        let( (v res) v = car(varList)
          assign[v] = 0
          if( check(clauses assign) then if( backtrack(cdr(varList)) then res = t ) )
          if( null(res) then
            assign[v] = 1
            if( check(clauses assign) then if( backtrack(cdr(varList)) then res = t ) )
          )
          if( null(res) then assign[v] = -1 )
          res
        )
      )
    )
    backtrack(vars)
  )
)
vars = '(1 2 3)
clauses = '( (1 2 -3) (-1 -2 3) (1 -2 3) )
println(solve3SAT(clauses vars))
`;
async function run() { console.log(await skillInterpreter.evaluate(code)); }
run();
