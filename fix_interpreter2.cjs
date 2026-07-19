const fs = require('fs');

const interpreterCode = `
export interface EvaluationResult {
  value: any;
  output: string[];
  type: 'success' | 'error';
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
        return null;
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
    this.globalEnv.define('list', (...args: any[]) => args);
    this.globalEnv.define('car', (list: any[]) => list?.[0]);
    this.globalEnv.define('cdr', (list: any[]) => list?.slice(1));
    this.globalEnv.define('nth', (n: number, list: any[]) => list?.[n]);
    
    this.globalEnv.define('println', (...args: any[]) => {
      const val = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (this.onOutput) this.onOutput(val);
      return args[args.length - 1];
    });
    this.globalEnv.define('printf', (format: string, ...args: any[]) => {
      let str = format || "";
      args.forEach(arg => {
          str = str.replace(/%[0-9\\.]*[sfdg]/, String(arg));
      });
      str = str.replace(/\\\\n/g, '\\n');
      if (this.onOutput) {
          this.onOutput(str);
      }
      return str;
    });

    // Mocks
    this.globalEnv.define('geGetWindowCellView', () => 'db:cellview');
    this.globalEnv.define('geGetSelSetBBox', () => [[0, 0], [10, 10]]);
    this.globalEnv.define('geGetSelSet', () => ['obj1', 'obj2']);
    this.globalEnv.define('xCoord', (coord: any) => coord ? coord[0] : 0);
    this.globalEnv.define('yCoord', (coord: any) => coord ? coord[1] : 0);
    this.globalEnv.define('lowerLeft', (bbox: any) => bbox ? bbox[0] : [0,0]);
    this.globalEnv.define('upperRight', (bbox: any) => bbox ? bbox[1] : [10,10]);
    this.globalEnv.define('dbMoveFig', () => true);
    
    this.globalEnv.define('t', true);
    this.globalEnv.define('nil', false);
  }

  public setOutputHandler(handler: (text: string) => void) {
    this.onOutput = handler;
  }

  public async evaluate(code: string, breakpoints: Set<number> = new Set(), onPause?: (line: number) => Promise<void>): Promise<EvaluationResult> {
    const output: string[] = [];
    this.breakpoints = breakpoints;
    this.onPause = onPause;
    
    // Capture output
    const oldOutput = this.onOutput;
    this.onOutput = (text) => {
        // Output might have multiple lines, split them
        const lines = text.split('\\n');
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
        if (char === '\\n') { line++; i++; continue; }
        if (char === ' ' || char === '\\t' || char === '\\r') { i++; continue; }
        if (char === ';') {
            while (i < code.length && code[i] !== '\\n') i++;
            continue;
        }
        if (char === '"') {
            let str = '"';
            i++;
            while (i < code.length) {
                str += code[i];
                if (code[i] === '"' && code[i-1] !== '\\\\') { i++; break; }
                if (code[i] === '\\n') line++;
                i++;
            }
            tokens.push({val: str, line});
            continue;
        }
        if (char === '(' || char === ')') {
            tokens.push({val: char, line});
            i++;
            continue;
        }
        if ("=+-*/<>!:".includes(char)) {
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
        while (i < code.length && !(" \\t\\n\\r();\\"=+-*/<>!:".includes(code[i]))) {
            word += code[i];
            i++;
        }
        if (word) {
            tokens.push({val: word, line});
        }
    }
    return tokens;
  }

  private parse(tokens: any[]) {
      let i = 0;
      function parseExpr(): any {
          if (i >= tokens.length) return null;
          let t = tokens[i];
          if (t.val === '(') {
              i++;
              let list = [];
              while (i < tokens.length && tokens[i].val !== ')') {
                  let e = parseExpr();
                  if (e) list.push(e);
              }
              if (i < tokens.length) i++; // consume ')'
              return { type: 'list', elements: list, line: t.line };
          } else {
              i++;
              if (i < tokens.length && tokens[i].val === '(') {
                 i++;
                 let list = [];
                 while (i < tokens.length && tokens[i].val !== ')') {
                     let e = parseExpr();
                     if (e) list.push(e);
                 }
                 if (i < tokens.length) i++; // consume ')'
                 return { type: 'call', fn: t.val, args: list, line: t.line };
              }
              return { type: 'atom', val: t.val, line: t.line };
          }
      }
      
      let exprs = [];
      while (i < tokens.length) {
          let e = parseExpr();
          if (e) exprs.push(e);
      }
      return exprs;
  }

  private async checkBreakpoint(line: number) {
      if (this.breakpoints.has(line) || this.isStepMode) {
          this.isStepMode = false;
          if (this.onPause) {
              await this.onPause(line);
          }
      }
  }

  private async evaluateBlock(exprs: any[], env: Environment): Promise<any> {
      let lastVal = null;
      for (let i = 0; i < exprs.length; i++) {
          let expr = exprs[i];
          await this.checkBreakpoint(expr.line);
          
          if (i + 1 < exprs.length && exprs[i+1].type === 'atom' && exprs[i+1].val === '=') {
              let val = await this.evaluateExpr(exprs[i+2], env);
              env.set(expr.val, val);
              lastVal = val;
              i += 2;
              continue;
          }
          if (i + 1 < exprs.length && exprs[i+1].type === 'atom' && exprs[i+1].val === '++') {
              let current = env.get(expr.val) || 0;
              env.set(expr.val, current + 1);
              lastVal = current + 1;
              i += 1;
              continue;
          }
          if (i + 1 < exprs.length && exprs[i+1].type === 'atom' && exprs[i+1].val === ':') {
              let left = await this.evaluateExpr(expr, env);
              let right = await this.evaluateExpr(exprs[i+2], env);
              lastVal = [left, right];
              i += 2;
              continue;
          }
          lastVal = await this.evaluateExpr(expr, env);
      }
      return lastVal;
  }

  private async evaluateExpr(expr: any, env: Environment): Promise<any> {
      if (!expr) return null;
      if (expr.type === 'atom') {
          let val = expr.val;
          if (/^-?\\d+(\\.\\d+)?$/.test(val)) return parseFloat(val);
          if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
          if (val === 't') return true;
          if (val === 'nil') return false;
          let envVal = env.get(val);
          return envVal !== null ? envVal : \`*unbound_\\${val}*\`;
      }
      if (expr.type === 'list') {
          if (expr.elements.length === 0) return null;
          let first = expr.elements[0];
          if (first.type === 'atom') {
              return await this.evaluateCall(first.val, expr.elements.slice(1), env, expr.line);
          }
          return await this.evaluateBlock(expr.elements, env);
      }
      if (expr.type === 'call') {
          return await this.evaluateCall(expr.fn, expr.args, env, expr.line);
      }
      return null;
  }

  private async evaluateCall(fnName: string, args: any[], env: Environment, line: number): Promise<any> {
      await this.checkBreakpoint(line);

      if (fnName === 'procedure') {
          let sig = args[0];
          let procName = "";
          let procArgs: string[] = [];
          if (sig.type === 'call') {
              procName = sig.fn;
              procArgs = sig.args.map((a: any) => a.val);
          } else if (sig.type === 'list' && sig.elements.length > 0) {
              procName = sig.elements[0].val;
              procArgs = sig.elements.slice(1).map((a: any) => a.val);
          }
          let body = args.slice(1);
          let globalEnv = env;
          while(globalEnv.parent) globalEnv = globalEnv.parent;
          globalEnv.define(procName, { type: 'procedure', args: procArgs, body: body });
          return true;
      }

      if (fnName === 'let') {
          let vars: string[] = [];
          if (args[0] && args[0].type === 'list') {
              for (let e of args[0].elements) {
                  if (e.type === 'atom') vars.push(e.val);
                  else if (e.type === 'list' && e.elements.length > 0) vars.push(e.elements[0].val);
              }
          }
          let newEnv = new Environment(env);
          for (let v of vars) newEnv.define(v, null);
          return await this.evaluateBlock(args.slice(1), newEnv);
      }

      if (fnName === 'if') {
          let cond = await this.evaluateExpr(args[0], env);
          let thenBranch = [];
          let elseBranch = [];
          let inElse = false;
          for (let i = 1; i < args.length; i++) {
              if (args[i].type === 'atom' && args[i].val === 'then') continue;
              if (args[i].type === 'atom' && args[i].val === 'else') { inElse = true; continue; }
              if (inElse) elseBranch.push(args[i]);
              else thenBranch.push(args[i]);
          }
          if (cond && cond !== 'nil' && cond !== '*unbound_nil*') {
              return await this.evaluateBlock(thenBranch, env);
          } else {
              return await this.evaluateBlock(elseBranch, env);
          }
      }

      if (fnName === 'foreach') {
          let varName = args[0].val;
          let lst = await this.evaluateExpr(args[1], env);
          let lastVal = null;
          if (Array.isArray(lst)) {
              for (let item of lst) {
                  let newEnv = new Environment(env);
                  newEnv.define(varName, item);
                  lastVal = await this.evaluateBlock(args.slice(2), newEnv);
              }
          }
          return lastVal;
      }

      let fn = env.get(fnName);
      if (fn && fn.type === 'procedure') {
          let newEnv = new Environment(env);
          for (let i = 0; i < fn.args.length; i++) {
              newEnv.define(fn.args[i], args[i] ? await this.evaluateExpr(args[i], env) : null);
          }
          return await this.evaluateBlock(fn.body, newEnv);
      }

      let evalArgs = [];
      for (let i = 0; i < args.length; i++) {
          if (args[i].type === 'atom' && args[i].val === ':') continue;
          evalArgs.push(await this.evaluateExpr(args[i], env));
      }

      if (typeof fn === 'function') {
          return fn(...evalArgs);
      }

      return \`*mock_func_\\${fnName}*\`;
  }
}

export const skillInterpreter = new SkillInterpreter();
`;

fs.writeFileSync('src/editor/skillInterpreter.ts', interpreterCode);
