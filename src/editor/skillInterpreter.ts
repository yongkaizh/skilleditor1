export interface EvaluationResult {
  value: any;
  output: string[];
  type: 'success' | 'error';
}

class ReturnException extends Error {
    value: any;
    constructor(value: any) {
        super("Return");
        this.value = value;
    }
}

class Environment {
    parent?: Environment;
    vars: Map<string, any> = new Map();
    constructor(parent?: Environment) {
        this.parent = parent;
    }
    get(name: string): any {
        if (this.vars.has(name)) return this.vars.get(name);
        if (this.parent) return this.parent.get(name);
        return undefined;
    }
    set(name: string, value: any) {
        let env: Environment | undefined = this;
        while (env) {
            if (env.vars.has(name)) {
                env.vars.set(name, value);
                return;
            }
            env = env.parent;
        }
        this.vars.set(name, value);
    }
    define(name: string, value: any) {
        this.vars.set(name, value);
    }
}

export type ASTNode = 
  | { type: 'number', value: number, line: number }
  | { type: 'string', value: string, line: number }
  | { type: 'boolean', value: boolean, line: number }
  | { type: 'symbol', name: string, line: number }
  | { type: 'list', elements: ASTNode[], line: number }
  | { type: 'call', fn: string, args: ASTNode[], line: number }
  | { type: 'quote', value: ASTNode, line: number };

class SkillInterpreter {
  private globalEnv = new Environment();
  private onOutput?: (text: string) => void;
  private isStepMode: boolean = false;
  private breakpoints: Set<number> = new Set();
  private onPause?: (line: number) => Promise<void>;

  constructor() {
    this.initBuiltins();
  }

  public getVariables() {
    return Object.fromEntries(this.globalEnv.vars);
  }

  public setStepMode(active: boolean) {
    this.isStepMode = active;
  }

  private initBuiltins() {
    this.globalEnv.define('+', (...args: any[]) => args.reduce((a, b) => a + b, 0));
    this.globalEnv.define('-', (...args: any[]) => args.length === 1 ? -args[0] : args[0] - args[1]);
    this.globalEnv.define('*', (...args: any[]) => args.reduce((a, b) => a * b, 1));
    this.globalEnv.define('/', (a: number, b: number) => a / b);
    this.globalEnv.define('<', (a: any, b: any) => a < b);
    this.globalEnv.define('>', (a: any, b: any) => a > b);
    this.globalEnv.define('<=', (a: any, b: any) => a <= b);
    this.globalEnv.define('>=', (a: any, b: any) => a >= b);
    this.globalEnv.define('==', (a: any, b: any) => a === b);
    this.globalEnv.define('!=', (a: any, b: any) => a !== b);
    this.globalEnv.define('makeTable', (name?: string, defVal?: any) => { return {}; });
    this.globalEnv.define('list', (...args: any[]) => args);
    this.globalEnv.define('car', (list: any[]) => list?.[0]);
    this.globalEnv.define('cdr', (list: any[]) => list?.slice(1));
    this.globalEnv.define('nth', (n: number, list: any[]) => list?.[n]);
    this.globalEnv.define('length', (list: any[]) => list?.length || 0);
    this.globalEnv.define('append', (l1: any[], l2: any[]) => (l1||[]).concat(l2||[]));
    
    this.globalEnv.define('println', (...args: any[]) => {
      const val = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (this.onOutput) this.onOutput(val);
      return args[args.length - 1];
    });
    this.globalEnv.define('printf', (format: string, ...args: any[]) => {
      let str = format || "";
      let argIndex = 0;
      str = str.replace(/%[-+0-9\.]*[sfdgc]/g, (match) => {
          if (argIndex < args.length) {
             return String(args[argIndex++]);
          }
          return match;
      });
      str = str.replace(/\\n/g, '\n');
      str = str.replace(/\\t/g, '\t');
      if (this.onOutput) {
          this.onOutput(str);
      }
      return str;
    });

    // EDA Mocks
    this.globalEnv.define('geGetWindowCellView', () => 'db:cellview');
    this.globalEnv.define('geGetSelSetBBox', () => [[0, 0], [10, 10]]);
    this.globalEnv.define('geGetSelSet', () => ['obj1', 'obj2']);
    this.globalEnv.define('xCoord', (coord: any) => coord ? coord[0] : 0);
    this.globalEnv.define('yCoord', (coord: any) => coord ? coord[1] : 0);
    this.globalEnv.define('lowerLeft', (bbox: any) => bbox ? bbox[0] : [0,0]);
    this.globalEnv.define('upperRight', (bbox: any) => bbox ? bbox[1] : [10,10]);
    this.globalEnv.define('dbMoveFig', () => true);
    this.globalEnv.define('dbCreateRect', () => 'db:shape');
  }

  public setOutputHandler(handler: (text: string) => void) {
    this.onOutput = handler;
  }

  public async evaluate(code: string, breakpoints: Set<number> = new Set(), onPause?: (line: number) => Promise<void>): Promise<EvaluationResult> {
    const output: string[] = [];
    this.breakpoints = breakpoints;
    this.onPause = onPause;
    
    const oldOutput = this.onOutput;
    this.onOutput = (text) => {
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.trim()) output.push(line);
        }
        if (oldOutput) oldOutput(text);
    };

    try {
      const tokens = this.tokenize(code);
      const ast = this.parse(tokens);
      const value = await this.evaluateBlock(ast, this.globalEnv);
      this.onOutput = oldOutput;
      return { value, output, type: 'success' };
    } catch (err: any) {
      this.onOutput = oldOutput;
      return { value: null, output: [...output, err.message], type: 'error' };
    }
  }

  private tokenize(code: string) {
    let tokens: any[] = [];
    let i = 0;
    let line = 1;
    while (i < code.length) {
        let char = code[i];
        if (char === '\n') { line++; i++; continue; }
        if (char === ' ' || char === '\t' || char === '\r' || char === ',') { i++; continue; }
        if (char === ';') {
            while (i < code.length && code[i] !== '\n') i++;
            continue;
        }
        if (char === '"') {
            let str = '"';
            i++;
            while (i < code.length) {
                str += code[i];
                if (code[i] === '"' && code[i-1] !== '\\') { i++; break; }
                if (code[i] === '\n') line++;
                i++;
            }
            tokens.push({val: str, line});
            continue;
        }
        if (char === '(' || char === ')' || char === '\'' || char === '[' || char === ']') {
            tokens.push({val: char, line});
            i++;
            continue;
        }
        if ("=+-*/<>!:[]".includes(char)) {
            if (char === '-' && (tokens.length === 0 || " \t\n\r(,;=+-*/<>!:[]".includes(code[i-1]))) {
                i++;
                let word = "-";
                while (i < code.length && !(" \t\n\r(),;\"'=+-*/<>!:[]".includes(code[i]))) {
                    word += code[i];
                    i++;
                }
                if (word === "-") {
                    tokens.push({val: "-", line});
                } else {
                    tokens.push({val: word, line});
                }
                continue;
            }

            let op = char;
            if (i + 1 < code.length && "=+-*/<>!".includes(code[i+1])) {
                op += code[i+1];
                i += 2;
            } else {
                i++;
            }
            tokens.push({val: op, line});
            continue;
        }
        let word = "";
        while (i < code.length && !(" \t\n\r(),;\"'=+-*/<>!:[]".includes(code[i]))) {
            word += code[i];
            i++;
        }
        if (word) {
            tokens.push({val: word, line});
        }
    }
    return tokens;
  }

  private processInfix(nodes: ASTNode[]): ASTNode[] {
      let res = [...nodes];
      const PRECEDENCE = [
          ['*', '/'],
          ['+', '-'],
          ['<', '>', '<=', '>=', '==', '!='],
          ['&&', '||'],
          ['=']
      ];

      // Unary minus
      for (let i = 0; i < res.length; i++) {
          if (res[i].type === 'symbol' && res[i].name === '-') {
              let isUnary = false;
              if (i === 0) {
                  isUnary = true;
              } else {
                  let prev = res[i - 1];
                  if (prev.type === 'symbol') {
                      isUnary = PRECEDENCE.some(level => level.includes(prev.name));
                  }
              }
              if (isUnary && i + 1 < res.length) {
                  let call = { type: 'call', fn: '-', args: [res[i+1]], line: res[i].line };
                  res.splice(i, 2, call);
                  i--;
              }
          }
      }

      // Binary operators
      for (let level of PRECEDENCE) {
          let isAssign = level.includes('=');
          if (isAssign) {
              for (let i = res.length - 1; i >= 0; i--) {
                  if (res[i].type === 'symbol' && level.includes(res[i].name)) {
                      if (i > 0 && i < res.length - 1) {
                          let call = { type: 'call', fn: res[i].name, args: [res[i-1], res[i+1]], line: res[i].line };
                          res.splice(i - 1, 3, call);
                          i--;
                      }
                  }
              }
          } else {
              for (let i = 0; i < res.length; i++) {
                  if (res[i].type === 'symbol' && level.includes(res[i].name)) {
                      if (i > 0 && i < res.length - 1) {
                          let call = { type: 'call', fn: res[i].name, args: [res[i-1], res[i+1]], line: res[i].line };
                          res.splice(i - 1, 3, call);
                          i--;
                      }
                  }
              }
          }
      }
      return res;
  }

  private parse(tokens: any[]): ASTNode[] {
      let i = 0;
      const parseExpr = (): ASTNode | null => {
          if (i >= tokens.length) return null;
          let t = tokens[i];
          
          let e: ASTNode | null = null;
          if (t.val === '\'') {
              i++;
              let inner = parseExpr();
              e = inner ? { type: 'quote', value: inner, line: t.line } : null;
          } else if (t.val === '(') {
              i++;
              let list: ASTNode[] = [];
              while (i < tokens.length && tokens[i].val !== ')') {
                  let innerE = parseExpr();
                  if (innerE) list.push(innerE);
              }
              if (i < tokens.length) i++; // consume ')'
              e = { type: 'list', elements: this.processInfix(list), line: t.line };
          } else {
              i++;
              if (i < tokens.length && tokens[i].val === '(') {
                 i++;
                 let list: ASTNode[] = [];
                 while (i < tokens.length && tokens[i].val !== ')') {
                     let innerE = parseExpr();
                     if (innerE) list.push(innerE);
                 }
                 if (i < tokens.length) i++; // consume ')'
                 e = { type: 'call', fn: t.val, args: this.processInfix(list), line: t.line };
              } else if (/^-?\d+(\.\d+)?$/.test(t.val)) {
                  e = { type: 'number', value: parseFloat(t.val), line: t.line };
              } else if (t.val.startsWith('"') && t.val.endsWith('"')) {
                  e = { type: 'string', value: t.val.slice(1, -1), line: t.line };
              } else if (t.val === 't') {
                  e = { type: 'boolean', value: true, line: t.line };
              } else if (t.val === 'nil') {
                  e = { type: 'boolean', value: false, line: t.line };
              } else {
                  e = { type: 'symbol', name: t.val, line: t.line };
              }
          }

          while (e && i < tokens.length && tokens[i].val === '[') {
              i++;
              let indexExpr = parseExpr();
              if (i < tokens.length && tokens[i].val === ']') i++; // consume ]
              e = { type: 'call', fn: 'array_access', args: [e, indexExpr], line: t.line };
          }

          return e;
      }
      
      let exprs: ASTNode[] = [];
      while (i < tokens.length) {
          let e = parseExpr();
          if (e) exprs.push(e);
      }
      return this.processInfix(exprs);
  }

  private async checkBreakpoint(line: number) {
      if (this.breakpoints.has(line) || this.isStepMode) {
          this.isStepMode = false;
          if (this.onPause) {
              await this.onPause(line);
          }
      }
  }

  private async evaluateBlock(exprs: ASTNode[], env: Environment): Promise<any> {
      let lastVal = null;
      for (let i = 0; i < exprs.length; i++) {
          let expr = exprs[i];
          await this.checkBreakpoint(expr.line);
          lastVal = await this.evaluateExpr(expr, env);
      }
      return lastVal;
  }

  private async evaluateExpr(expr: ASTNode, env: Environment): Promise<any> {
      if (!expr) return null;
      switch (expr.type) {
          case 'number':
          case 'string':
          case 'boolean':
              return expr.value;
          case 'symbol':
              if (expr.name.startsWith('-') && expr.name.length > 1) {
                  let numStr = expr.name.substring(1);
                  if (/^\d+(\.\d+)?$/.test(numStr)) {
                      return -parseFloat(numStr);
                  }
                  let val = env.get(numStr);
                  return typeof val === 'number' ? -val : `*unbound_${expr.name}*`;
              }
              let envVal = env.get(expr.name);
              return envVal !== undefined ? envVal : `*unbound_${expr.name}*`;
          case 'quote':
              return this.evaluateQuote(expr.value);
          case 'list':
              if (expr.elements.length === 0) return null;
              let first = expr.elements[0];
              if (first.type === 'symbol') {
                  return await this.evaluateCall(first.name, expr.elements.slice(1), env, expr.line);
              }
              return await this.evaluateBlock(expr.elements, env);
          case 'call':
              return await this.evaluateCall(expr.fn, expr.args, env, expr.line);
      }
  }

  private evaluateQuote(expr: ASTNode): any {
      if (expr.type === 'symbol') return expr.name;
      if (expr.type === 'number' || expr.type === 'string' || expr.type === 'boolean') return expr.value;
      if (expr.type === 'list') return expr.elements.map(e => this.evaluateQuote(e));
      return null;
  }

  private async evaluateCall(fnName: string, args: ASTNode[], env: Environment, line: number): Promise<any> {
      await this.checkBreakpoint(line);

      if (fnName === 'procedure' || fnName === 'defun') {
          let sig = args[0];
          let procName = "";
          let procArgs: string[] = [];
          if (sig.type === 'call') {
              procName = sig.fn;
              procArgs = sig.args.map((a: any) => a.name || a.val);
          } else if (sig.type === 'list' && sig.elements.length > 0) {
              let fst = sig.elements[0];
              if (fst.type === 'symbol') procName = fst.name;
              procArgs = sig.elements.slice(1).map((a: any) => a.name || a.val);
          }
          let body = args.slice(1);
          let globalEnv = env;
          while(globalEnv.parent) globalEnv = globalEnv.parent;
          globalEnv.define(procName, { type: 'procedure', args: procArgs, body: body });
          return procName;
      }

      if (fnName === 'let' || fnName === 'prog') {
          let vars: string[] = [];
          if (args[0] && args[0].type === 'list') {
              for (let e of args[0].elements) {
                  if (e.type === 'symbol') vars.push(e.name);
                  else if (e.type === 'list' && e.elements.length > 0 && e.elements[0].type === 'symbol') {
                      vars.push(e.elements[0].name);
                  }
              }
          }
          let newEnv = new Environment(env);
          for (let v of vars) newEnv.define(v, null);

          if (args[0] && args[0].type === 'list') {
              for (let e of args[0].elements) {
                  if (e.type === 'list' && e.elements.length >= 2 && e.elements[0].type === 'symbol') {
                      newEnv.set(e.elements[0].name, await this.evaluateExpr(e.elements[1], env));
                  }
              }
          }

          try {
             return await this.evaluateBlock(args.slice(1), newEnv);
          } catch (err) {
              if (fnName === 'prog' && err instanceof ReturnException) {
                  return err.value;
              }
              throw err;
          }
      }

      if (fnName === 'progn') {
          return await this.evaluateBlock(args, env);
      }

      if (fnName === 'return') {
          let val = args.length > 0 ? await this.evaluateExpr(args[0], env) : null;
          throw new ReturnException(val);
      }

      if (fnName === 'setq' || fnName === '=') {
          if (args.length !== 2) throw new Error(`*Error* ${fnName} requires 2 arguments`);
          let sym = args[0];
          let val = await this.evaluateExpr(args[1], env);
          
          if (sym.type === 'symbol') {
              env.set(sym.name, val);
              return val;
          } else if (sym.type === 'call' && sym.fn === 'array_access') {
              let arr = await this.evaluateExpr(sym.args[0], env);
              let index = await this.evaluateExpr(sym.args[1], env);
              if (arr && typeof arr === 'object') {
                  arr[index] = val;
                  return val;
              }
              throw new Error(`*Error* cannot index non-table/array`);
          }
          throw new Error(`*Error* ${fnName}: first argument must be a symbol or array access`);
      }

      if (fnName === 'array_access') {
          let arr = await this.evaluateExpr(args[0], env);
          let index = await this.evaluateExpr(args[1], env);
          if (arr && typeof arr === 'object') {
              return arr[index];
          }
          return null;
      }

      if (fnName === 'if') {
          let cond = await this.evaluateExpr(args[0], env);
          let thenBranch = [];
          let elseBranch = [];
          let inElse = false;
          for (let i = 1; i < args.length; i++) {
              if (args[i].type === 'symbol' && (args[i] as any).name === 'then') continue;
              if (args[i].type === 'symbol' && (args[i] as any).name === 'else') { inElse = true; continue; }
              if (inElse) elseBranch.push(args[i]);
              else thenBranch.push(args[i]);
          }
          if (cond && cond !== 'nil' && cond !== '*unbound_nil*') {
              return await this.evaluateBlock(thenBranch, env);
          } else {
              return await this.evaluateBlock(elseBranch, env);
          }
      }

      if (fnName === '&&') {
          let left = await this.evaluateExpr(args[0], env);
          if (!left || left === 'nil' || left === '*unbound_nil*') return false;
          return await this.evaluateExpr(args[1], env);
      }

      if (fnName === '||') {
          let left = await this.evaluateExpr(args[0], env);
          if (left && left !== 'nil' && left !== '*unbound_nil*') return left;
          return await this.evaluateExpr(args[1], env);
      }
      
      if (fnName === 'when') {
          let cond = await this.evaluateExpr(args[0], env);
          if (cond && cond !== 'nil' && cond !== '*unbound_nil*') {
              return await this.evaluateBlock(args.slice(1), env);
          }
          return false;
      }
      
      if (fnName === 'unless') {
          let cond = await this.evaluateExpr(args[0], env);
          if (!cond || cond === 'nil' || cond === '*unbound_nil*') {
              return await this.evaluateBlock(args.slice(1), env);
          }
          return false;
      }

      if (fnName === 'while') {
          if (args.length < 1) return null;
          let lastVal = null;
          while (true) {
              let cond = await this.evaluateExpr(args[0], env);
              if (!cond || cond === 'nil' || cond === '*unbound_nil*') break;
              try {
                  lastVal = await this.evaluateBlock(args.slice(1), env);
              } catch (err) {
                  if (err instanceof ReturnException) throw err;
                  throw err;
              }
          }
          return lastVal;
      }

      if (fnName === 'for') {
          if (args.length < 3) return null;
          let varName = args[0].type === 'symbol' ? args[0].name : '';
          let start = await this.evaluateExpr(args[1], env);
          let end = await this.evaluateExpr(args[2], env);
          let lastVal = null;
          if (typeof start === 'number' && typeof end === 'number') {
              for (let i = start; i <= end; i++) {
                  let newEnv = new Environment(env);
                  newEnv.define(varName, i);
                  try {
                      lastVal = await this.evaluateBlock(args.slice(3), newEnv);
                  } catch (err) {
                      if (err instanceof ReturnException) throw err;
                      throw err;
                  }
              }
          }
          return lastVal;
      }

      if (fnName === 'cond') {
          for (let clause of args) {
              if (clause.type === 'list' && clause.elements.length > 0) {
                  let condExpr = clause.elements[0];
                  let condVal = await this.evaluateExpr(condExpr, env);
                  if (condVal && condVal !== 'nil' && condVal !== '*unbound_nil*') {
                      return await this.evaluateBlock(clause.elements.slice(1), env);
                  }
              }
          }
          return null;
      }

      if (fnName === 'case') {
          if (args.length < 1) return null;
          let caseVal = await this.evaluateExpr(args[0], env);
          for (let i = 1; i < args.length; i++) {
              let clause = args[i];
              if (clause.type === 'list' && clause.elements.length > 0) {
                  let testExpr = clause.elements[0];
                  let matches = false;
                  if (testExpr.type === 'symbol' && testExpr.name === 't') {
                      matches = true;
                  } else if (testExpr.type === 'list') {
                      for (let el of testExpr.elements) {
                          let val = await this.evaluateExpr(el, env);
                          if (val === caseVal) {
                              matches = true;
                              break;
                          }
                      }
                  } else {
                      let val = await this.evaluateExpr(testExpr, env);
                      if (val === caseVal) matches = true;
                  }
                  if (matches) {
                      return await this.evaluateBlock(clause.elements.slice(1), env);
                  }
              }
          }
          return null;
      }

      if (fnName === 'foreach') {
          if (args.length < 2) return null;
          let varName = args[0].type === 'symbol' ? args[0].name : '';
          let lst = await this.evaluateExpr(args[1], env);
          let lastVal = null;
          if (Array.isArray(lst)) {
              for (let item of lst) {
                  let newEnv = new Environment(env);
                  newEnv.define(varName, item);
                  try {
                      lastVal = await this.evaluateBlock(args.slice(2), newEnv);
                  } catch (err) {
                      if (err instanceof ReturnException) {
                          throw err; 
                      }
                      throw err;
                  }
              }
          }
          return lastVal;
      }

      let fn = env.get(fnName);
      if (fn && fn.type === 'procedure') {
          if (args.length !== fn.args.length) {
              let msg = args.length > fn.args.length ? "too many arguments" : "too few arguments";
              throw new Error(`*Error* eval: ${msg} - ${fnName} (expected ${fn.args.length}, got ${args.length})`);
          }

          let newEnv = new Environment(env);
          for (let i = 0; i < fn.args.length; i++) {
              newEnv.define(fn.args[i], i < args.length ? await this.evaluateExpr(args[i], env) : null);
          }
          try {
             return await this.evaluateBlock(fn.body, newEnv);
          } catch (err) {
              if (err instanceof ReturnException) {
                  return err.value;
              }
              throw err;
          }
      }

      let evalArgs = [];
      for (let i = 0; i < args.length; i++) {
          if (args[i].type === 'symbol' && (args[i] as any).name === ':') {
              let left = evalArgs.pop();
              let right = await this.evaluateExpr(args[i+1], env);
              evalArgs.push([left, right]);
              i++;
              continue;
          }
          evalArgs.push(await this.evaluateExpr(args[i], env));
      }

      if (typeof fn === 'function') {
          return fn(...evalArgs);
      }

      return `*mock_func_${fnName}*`;
  }
}

export const skillInterpreter = new SkillInterpreter();
