
export class SkillError extends Error {
    line?: number;
    col?: number;
    constructor(message: string, line?: number, col?: number) {
        super(message);
        this.line = line;
        this.col = col;
        this.name = "SkillError";
    }
}
export interface EvaluationResult {
  value: any;
  output: string[];
  type: 'success' | 'error';
  line?: number;
  col?: number;
}

class ReturnException extends Error {
    value: any;
    constructor(value: any) {
        super("*Error* eval: return outside of prog/procedure");
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
        // eslint-disable-next-line @typescript-eslint/no-this-alias
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
  | { type: 'number', value: number, line: number, col: number }
  | { type: 'string', value: string, line: number, col: number }
  | { type: 'boolean', value: boolean, line: number, col: number }
  | { type: 'symbol', name: string, line: number, col: number }
  | { type: 'list', elements: ASTNode[], line: number, col: number }
  | { type: 'call', fn: string, args: ASTNode[], line: number, col: number }
  | { type: 'quote', value: ASTNode, line: number, col: number };

class SkillInterpreter {
  private globalEnv = new Environment();
  private onOutput?: (text: string) => void;
  private isStepMode: boolean = false;
  private breakpoints: Set<number> = new Set();
  private onPause?: (line: number) => Promise<void>;
  private currentEnv?: Environment;

  constructor() {
    this.initBuiltins();
  }

  public getVariables() {
    const allVars: Record<string, any> = {};
    let env = this.currentEnv || this.globalEnv;
    
    const envChain: Environment[] = [];
    while (env) {
      envChain.push(env);
      env = env.parent!;
    }
    
    for (let i = envChain.length - 1; i >= 0; i--) {
      const e = envChain[i];
      for (const [key, value] of e.vars.entries()) {
        if (value && typeof value === 'object' && value.type === 'procedure') {
          continue;
        }
        if (typeof value === 'function') {
          continue;
        }
        allVars[key] = value;
      }
    }
    return allVars;
  }

  public setStepMode(active: boolean) {
    this.isStepMode = active;
  }

  private initBuiltins() {
    this.globalEnv.define('+', (...args: any[]) => {
      if (args.some(a => typeof a !== 'number')) throw new Error("*Error* plus: not a number");
      return args.reduce((a, b) => a + b, 0);
    });
    this.globalEnv.define('-', (...args: any[]) => {
      if (args.length === 0) return 0;
      if (args.some(a => typeof a !== 'number')) throw new Error("*Error* difference: not a number");
      return args.length === 1 ? -args[0] : args[0] - args[1];
    });
    this.globalEnv.define('*', (...args: any[]) => {
      if (args.some(a => typeof a !== 'number')) throw new Error("*Error* times: not a number");
      return args.reduce((a, b) => a * b, 1);
    });
    this.globalEnv.define('/', (a: any, b: any) => {
      if (typeof a !== 'number' || typeof b !== 'number') throw new Error("*Error* quotient: not a number");
      if (b === 0) throw new Error("*Error* quotient: division by zero");
      return a / b;
    });
    this.globalEnv.define('<', (a: any, b: any) => {
      if (typeof a !== typeof b) throw new Error("*Error* lessp: type mismatch");
      return a < b;
    });
    this.globalEnv.define('>', (a: any, b: any) => {
      if (typeof a !== typeof b) throw new Error("*Error* greaterp: type mismatch");
      return a > b;
    });
    this.globalEnv.define('<=', (a: any, b: any) => {
      if (typeof a !== typeof b) throw new Error("*Error* leq: type mismatch");
      return a <= b;
    });
    this.globalEnv.define('>=', (a: any, b: any) => {
      if (typeof a !== typeof b) throw new Error("*Error* geq: type mismatch");
      return a >= b;
    });
    this.globalEnv.define('==', (a: any, b: any) => a === b);
    this.globalEnv.define('!=', (a: any, b: any) => a !== b);
    this.globalEnv.define('!', (a: any) => a === null || a === false);
    this.globalEnv.define('null', (a: any) => a === null || a === false);
    this.globalEnv.define('makeTable', (name?: any, defVal?: any) => {
      if (name !== undefined && typeof name !== 'string' && typeof name !== 'symbol') {
          throw new Error("*Error* makeTable: first argument must be a string or symbol");
      }
      return new Proxy({}, { get: function(target, prop) { return prop in target ? target[prop] : defVal; } });
    });
    this.globalEnv.define('list', (...args: any[]) => args);
    this.globalEnv.define('abs', (a: any) => {
      if (typeof a !== 'number') throw new Error("*Error* abs: not a number");
      return Math.abs(a);
    });
    this.globalEnv.define('float', (a: any) => {
      if (typeof a !== 'number') throw new Error("*Error* float: not a number");
      return a;
    });
    this.globalEnv.define('car', (list: any[]) => {
      if (list === null || list === undefined || list === 'nil') return null;
      if (!Array.isArray(list)) throw new Error("*Error* car: argument must be a list");
      return list[0];
    });
    this.globalEnv.define('cadr', (list: any[]) => {
      if (list === null || list === 'nil') return null;
      if (!Array.isArray(list)) throw new Error("*Error* cadr: not a list");
      return list.length > 1 ? list[1] : null;
    });
    this.globalEnv.define('cdr', (list: any[]) => {
      if (list === null || list === undefined || list === 'nil') return null;
      if (!Array.isArray(list)) throw new Error("*Error* cdr: argument must be a list");
      return list.length <= 1 ? null : list.slice(1);
    });
    this.globalEnv.define('nth', (n: number, list: any[]) => {
      if (list === null || list === undefined || list === 'nil') return null;
      if (typeof n !== 'number') throw new Error("*Error* nth: first argument must be a number");
      if (!Array.isArray(list)) throw new Error("*Error* nth: second argument must be a list");
      return list[n];
    });
    this.globalEnv.define('length', (list: any[]) => {
      if (list === null || list === undefined || list === 'nil') return 0;
      if (!Array.isArray(list)) throw new Error("*Error* length: argument must be a list");
      return list.length;
    });
    this.globalEnv.define('strcat', (...args: any[]) => {
      if (args.some(a => typeof a !== 'string' && typeof a !== 'symbol')) {
          throw new Error("*Error* strcat: all arguments must be strings or symbols");
      }
      return args.join('');
    });
    this.globalEnv.define('substring', (str: any, start: any, len?: any) => {
      if (typeof str !== 'string' && typeof str !== 'symbol') throw new Error("*Error* substring: first argument must be a string");
      if (typeof start !== 'number') throw new Error("*Error* substring: second argument must be a number");
      if (len !== undefined && typeof len !== 'number') throw new Error("*Error* substring: third argument must be a number");
      let s = String(str);
      let startIndex = start > 0 ? start - 1 : s.length + start;
      if (len !== undefined) return s.substr(startIndex, len);
      return s.substr(startIndex);
    });
    this.globalEnv.define('buildString', (list: any[], sep?: any) => {
      if (list !== null && list !== 'nil' && !Array.isArray(list)) throw new Error("*Error* buildString: first argument must be a list");
      if (sep !== undefined && typeof sep !== 'string') throw new Error("*Error* buildString: second argument must be a string");
      if (list === null || list === 'nil') return "";
      return list.join(sep || "");
    });
    this.globalEnv.define('parseString', (str: any, sep?: any) => {
      if (typeof str !== 'string' && typeof str !== 'symbol') throw new Error("*Error* parseString: first argument must be a string");
      if (sep !== undefined && typeof sep !== 'string') throw new Error("*Error* parseString: second argument must be a string");
      return String(str).split(sep || " ");
    });
    this.globalEnv.define('append', (l1: any[], l2: any[]) => {
      if (l1 !== null && l1 !== 'nil' && !Array.isArray(l1)) throw new Error("*Error* append: first argument must be a list");
      if (l2 !== null && l2 !== 'nil' && !Array.isArray(l2)) throw new Error("*Error* append: second argument must be a list");
      return (l1 && l1 !== 'nil' ? l1 : []).concat(l2 && l2 !== 'nil' ? l2 : []);
    });
    this.globalEnv.define('println', (...args: any[]) => {
      const val = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (this.onOutput) this.onOutput(val);
      return args[args.length - 1];
    });
    const formatString = (fnName: string, format: string, ...args: any[]) => {
      if (typeof format !== 'string') {
          throw new Error(`*Error* ${fnName}: first argument must be a format string, got ${typeof format}`);
      }
      let str = format || "";
      let argIndex = 0;
      str = str.replace(/%[-+0-9.]*[sfdgcL]/g, (match) => {
          if (argIndex < args.length) {
             let val = args[argIndex++];
             let specifier = match[match.length - 1];
             if (specifier === 'd' || specifier === 'f' || specifier === 'g') {
                 if (typeof val !== 'number') throw new Error(`*Error* ${fnName}: format specifier ${match} expects a number, got ${typeof val}`);
             } else if (specifier === 's') {
                 if (typeof val !== 'string' && typeof val !== 'symbol' && typeof val !== 'boolean') throw new Error(`*Error* ${fnName}: format specifier ${match} expects a string or symbol, got ${typeof val}`);
             } else if (specifier === 'L') {
                 if (val !== null && typeof val !== 'object' && typeof val !== 'boolean') throw new Error(`*Error* ${fnName}: format specifier ${match} expects a list, got ${typeof val}`);
                 return typeof val === 'object' ? JSON.stringify(val) : String(val);
             }
             return String(val);
          }
          return match;
      });
      str = str.replace(/\\n/g, '\n');
      str = str.replace(/\\t/g, '\t');
      return str;
    };
    this.globalEnv.define('printf', (format: string, ...args: any[]) => {
      const str = formatString('printf', format, ...args);
      if (this.onOutput) this.onOutput(str);
      return str;
    });
    this.globalEnv.define('sprintf', (sym: any, format: string, ...args: any[]) => {
      let actualFormat = typeof sym === 'string' && format === undefined ? sym : format;
      let actualArgs = typeof sym === 'string' && format === undefined ? [] : args;
      if (typeof sym === 'string' && typeof format !== 'string') {
         actualFormat = sym;
         actualArgs = [format, ...args].filter(a => a !== undefined);
      } else if (sym === null || sym === 'nil') {
         actualFormat = format;
         actualArgs = args;
      }
      const str = formatString('sprintf', actualFormat, ...actualArgs);
      return str;
    });
    this.globalEnv.define('fprintf', (port: any, format: string, ...args: any[]) => {
      const str = formatString('fprintf', format, ...args);
      if (this.onOutput) this.onOutput(str);
      return str;
    });
    this.globalEnv.define('geGetWindowCellView', (windowId?: any) => {
      if (windowId !== undefined && typeof windowId !== 'string' && typeof windowId !== 'number' && typeof windowId !== 'symbol') throw new Error("*Error* geGetWindowCellView: invalid window ID");
      return 'db:cellview';
    });
    this.globalEnv.define('geGetSelSetBBox', (windowId?: any) => {
      if (windowId !== undefined && typeof windowId !== 'string' && typeof windowId !== 'number' && typeof windowId !== 'symbol') throw new Error("*Error* geGetSelSetBBox: invalid window ID");
      return [[0, 0], [10, 10]];
    });
    this.globalEnv.define('geGetSelSet', (windowId?: any) => {
      if (windowId !== undefined && typeof windowId !== 'string' && typeof windowId !== 'number' && typeof windowId !== 'symbol') throw new Error("*Error* geGetSelSet: invalid window ID");
      return ['obj1', 'obj2'];
    });
    this.globalEnv.define('xCoord', (coord: any) => {
      if (!Array.isArray(coord) || coord.length < 2) throw new Error("*Error* xCoord: argument must be a coordinate list");
      return coord[0];
    });
    this.globalEnv.define('yCoord', (coord: any) => {
      if (!Array.isArray(coord) || coord.length < 2) throw new Error("*Error* yCoord: argument must be a coordinate list");
      return coord[1];
    });
    this.globalEnv.define('lowerLeft', (bbox: any) => {
      if (!Array.isArray(bbox) || bbox.length < 2) throw new Error("*Error* lowerLeft: argument must be a bounding box list");
      return bbox[0];
    });
    this.globalEnv.define('upperRight', (bbox: any) => {
      if (!Array.isArray(bbox) || bbox.length < 2) throw new Error("*Error* upperRight: argument must be a bounding box list");
      return bbox[1];
    });
    this.globalEnv.define('dbMoveFig', (fig: any, cv: any, transform: any) => {
      if (!fig) throw new Error("*Error* dbMoveFig: first argument must be a database object");
      if (!Array.isArray(transform)) throw new Error("*Error* dbMoveFig: third argument must be a transform list");
      return true;
    });
    this.globalEnv.define('dbCreateRect', (cv: any, layer: any, bbox: any) => {
      if (!cv) throw new Error("*Error* dbCreateRect: first argument must be a cellview");
      if (!layer) throw new Error("*Error* dbCreateRect: second argument must be a layer");
      if (!Array.isArray(bbox) || bbox.length < 2) throw new Error("*Error* dbCreateRect: third argument must be a bounding box list");
      return 'db:shape';
    });

  }
  public setOutputHandler(handler: (text: string) => void) {
    this.onOutput = handler;
  }

  public async evaluate(code: string, breakpoints: Set<number> = new Set(), onPause?: (line: number) => Promise<void>): Promise<EvaluationResult> {
    const output: string[] = [];
    this.breakpoints = breakpoints;
    this.onPause = onPause;
    this.currentEnv = undefined;
    
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
      return { value: null, output: [...output, err.message], type: 'error', line: err.line, col: err.col };
    }
  }

    public tokenize(code: string) {
    let tokens: any[] = [];
    let i = 0;
    let line = 1;
    let col = 1;
    let spaceBefore = false;
    while (i < code.length) {
        let char = code[i];
        if (char === '\n') { line++; col = 1; i++; spaceBefore = true; continue; }
        if (char === ' ' || char === '\t' || char === '\r' || char === ',') { col++; i++; spaceBefore = true; continue; }
        if (char === ';') {
            while (i < code.length && code[i] !== '\n') { i++; col++; }
            spaceBefore = true;
            continue;
        }
        let currSpaceBefore = spaceBefore;
        spaceBefore = false;
        
        let startCol = col;
        if (char === '"') {
            let str = '"';
            i++; col++;
            while (i < code.length) {
                str += code[i];
                if (code[i] === '"' && code[i-1] !== '\\') { i++; col++; break; }
                if (code[i] === '\n') { line++; col = 1; } else { col++; }
                i++;
            }
            tokens.push({val: str, line, col: startCol, spaceBefore: currSpaceBefore});
            continue;
        }
        if (char === '(' || char === ')' || char === '\'' || char === '[' || char === ']') {
            tokens.push({val: char, line, col: startCol, spaceBefore: currSpaceBefore});
            i++; col++;
            continue;
        }
        let objMatch = code.substring(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*:0x[0-9a-fA-F]+/i);
        if (objMatch) {
            tokens.push({val: objMatch[0], line, col: startCol, spaceBefore: currSpaceBefore});
            i += objMatch[0].length;
            col += objMatch[0].length;
            continue;
        }
        if ("=+-*/<>!:[]".includes(char)) {
            if (char === '-' && (tokens.length === 0 || " \t\n\r(,;=+-*/<>!:[]".includes(code[i-1]))) {
                i++; col++;
                let word = "-";
                while (i < code.length && !(" \t\n\r(),;\"'=+-*/<>!:[]".includes(code[i]))) {
                    word += code[i];
                    i++; col++;
                }
                if (word === "-") {
                    tokens.push({val: "-", line, col: startCol, spaceBefore: currSpaceBefore});
                } else {
                    tokens.push({val: word, line, col: startCol, spaceBefore: currSpaceBefore});
                }
                continue;
            }
            let op = char;
            if (i + 1 < code.length && "=+-*/<>!".includes(code[i+1])) {
                op += code[i+1];
                i += 2; col += 2;
            } else {
                i++; col++;
            }
            tokens.push({val: op, line, col: startCol, spaceBefore: currSpaceBefore});
            continue;
        }
        let word = "";
        while (i < code.length && !(" \t\n\r(),;\"'=+-*/<>!:[]".includes(code[i]))) {
            word += code[i];
            i++; col++;
        }
        if (word) {
            tokens.push({val: word, line, col: startCol, spaceBefore: currSpaceBefore});
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

  public parse(tokens: any[]): ASTNode[] {
      let i = 0;
      const parseExpr = (): ASTNode | null => {
          if (i >= tokens.length) return null;
          let t = tokens[i];
          
          let e: ASTNode | null = null;
          if (t.val === '\'') {
              i++;
              let inner = parseExpr();
              e = inner ? { type: 'quote', value: inner, line: t.line, col: t.col } : null;
          } else if (t.val === '(') {
              i++;
              let list: ASTNode[] = [];
              while (i < tokens.length && tokens[i].val !== ')') {
                  let innerE = parseExpr();
                  if (innerE) list.push(innerE);
              }
              if (i < tokens.length) i++; // consume ')'
              e = { type: 'list', elements: this.processInfix(list), line: t.line, col: t.col };
          } else {
              i++;
              if (i < tokens.length && tokens[i].val === '(' && !tokens[i].spaceBefore) {
                 i++;
                 let list: ASTNode[] = [];
                 while (i < tokens.length && tokens[i].val !== ')') {
                     let innerE = parseExpr();
                     if (innerE) list.push(innerE);
                 }
                 if (i < tokens.length) i++; // consume ')'
                 e = { type: 'call', fn: t.val, args: this.processInfix(list), line: t.line, col: t.col };
              } else if (/^-?(0x[0-9a-fA-F]+|\d+(\.\d+)?)$/i.test(t.val)) {
                  let isHex = t.val.toLowerCase().includes('0x');
                  let isNeg = t.val.startsWith('-');
                  let numStr = isNeg ? t.val.substring(1) : t.val;
                  let val = isHex ? parseInt(numStr, 16) : parseFloat(numStr);
                  if (isNeg) val = -val;
                  e = { type: 'number', value: val, line: t.line, col: t.col };
              } else if (/^[a-zA-Z_][a-zA-Z0-9_]*:0x[0-9a-fA-F]+$/i.test(t.val)) {
                  e = { type: 'string', value: t.val, line: t.line, col: t.col };
              } else if (t.val.startsWith('"') && t.val.endsWith('"')) {
                  e = { type: 'string', value: t.val.slice(1, -1), line: t.line, col: t.col };
              } else if (t.val === 't') {
                  e = { type: 'boolean', value: true, line: t.line, col: t.col };
              } else if (t.val === 'nil') {
                  e = { type: 'boolean', value: false, line: t.line, col: t.col };
              } else {
                  e = { type: 'symbol', name: t.val, line: t.line, col: t.col };
              }
          }

          while (e && i < tokens.length && tokens[i].val === '[') {
              i++;
              let indexExpr = parseExpr();
              if (i < tokens.length && tokens[i].val === ']') i++; // consume ]
              e = { type: 'call', fn: 'array_access', args: [e, indexExpr], line: t.line, col: t.col };
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

  private async checkBreakpoint(line: number, env?: Environment) {
      if (this.breakpoints.has(line) || this.isStepMode) {
          this.isStepMode = false;
          this.currentEnv = env;
          if (this.onPause) {
              await this.onPause(line);
          }
      }
  }

  private async evaluateBlock(exprs: ASTNode[], env: Environment): Promise<any> {
      let lastVal = null;
      for (let i = 0; i < exprs.length; i++) {
          let expr = exprs[i];
          await this.checkBreakpoint(expr.line, env);
          lastVal = await this.evaluateExpr(expr, env);
      }
      return lastVal;
  }

  private async evaluateExpr(expr: ASTNode, env: Environment): Promise<any> {
    try { return await this._evaluateExpr(expr, env); }
    catch (err: any) {
        if (err instanceof ReturnException) throw err;
        if (err.name === 'SkillError') throw err;
        throw new SkillError(err.message, expr.line, expr.col);
    }
}
private async _evaluateExpr(expr: ASTNode, env: Environment): Promise<any> {
      if (!expr) return null;
      try {
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
                  if (val === undefined) throw new Error(`*Error* eval: unbound variable - ${numStr}`);
                  if (typeof val !== 'number') throw new Error(`*Error* eval: not a number - ${numStr}`);
                  return -val;
              }
              let envVal = env.get(expr.name);
              if (envVal === undefined) {
                  if (expr.name === 't') return true;
                  if (expr.name === 'nil') return false;
                  throw new Error(`*Error* eval: unbound variable - ${expr.name} at line ${expr.line}\nvarList: ${env.get('varList')}`);
              }
              return envVal;
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
      } catch (err: any) {
          if (err instanceof ReturnException) throw err;
          if (err.message && !err.message.includes(' at line ')) {
              err.message = `${err.message} at line ${expr.line}`;
          }
          throw err;
      }
  }

  private evaluateQuote(expr: ASTNode): any {
      if (expr.type === 'symbol') return expr.name;
      if (expr.type === 'number' || expr.type === 'string' || expr.type === 'boolean') return expr.value;
      if (expr.type === 'list') return expr.elements.map(e => this.evaluateQuote(e));
      return null;
  }

  private async evaluateCall(fnName: string, args: ASTNode[], env: Environment, line: number): Promise<any> {
      await this.checkBreakpoint(line, env);

      if (fnName === 'procedure' || fnName === 'defun') {
          let sig = args[0];
          let procName = "";
          let procArgs: string[] = [];
          let body = args.slice(1);
          
          if (sig.type === 'call') {
              procName = sig.fn;
              procArgs = sig.args.map((a: any) => a.name || a.val);
          } else if (sig.type === 'list' && sig.elements.length > 0) {
              let fst = sig.elements[0];
              if (fst.type === 'symbol') procName = fst.name;
              procArgs = sig.elements.slice(1).map((a: any) => a.name || a.val);
          } else if (sig.type === 'symbol') {
              procName = sig.name;
              if (args[1] && args[1].type === 'list') {
                  procArgs = args[1].elements.map((a: any) => a.name || a.val);
                  body = args.slice(2);
              }
          }
          
          let globalEnv = env;
          while(globalEnv.parent) globalEnv = globalEnv.parent;
          globalEnv.define(procName, { type: 'procedure', args: procArgs, body: body });
          return procName;
      }

      if (fnName === 'let' || fnName === 'prog') {
          if (!args[0] || args[0].type !== 'list') throw new Error(`*Error* ${fnName}: first argument must be a list of variables`);
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

      if (fnName === 'sprintf') {
          if (args.length < 2) {
              if (args.length === 1) {
                  // e.g. sprintf("hello")
                  return await this.evaluateExpr(args[0], env);
              }
              throw new Error(`*Error* eval: too few arguments - sprintf`);
          }
          let sym = args[0];
          let format = await this.evaluateExpr(args[1], env);
          let formatArgs = [];
          for (let i = 2; i < args.length; i++) {
              formatArgs.push(await this.evaluateExpr(args[i], env));
          }
          
          let fn = env.get('sprintf_helper') || env.get('sprintf');
          let str = "";
          if (typeof fn === 'function') {
              str = fn(null, format, ...formatArgs);
          } else {
              // fallback if not defined in env
              str = format; // basic fallback
          }

          if (sym.type === 'symbol' && sym.name !== 'nil') {
              env.set(sym.name, str);
          }
          return str;
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
          if (args.length < 2) throw new Error("*Error* eval: too few arguments - if");
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
          if (args.length < 2) throw new Error("*Error* eval: too few arguments - &&");
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
          if (args.length < 2) throw new Error("*Error* eval: too few arguments - when");
          let cond = await this.evaluateExpr(args[0], env);
          if (cond && cond !== 'nil' && cond !== '*unbound_nil*') {
              return await this.evaluateBlock(args.slice(1), env);
          }
          return false;
      }
      
      if (fnName === 'unless') {
          if (args.length < 2) throw new Error("*Error* eval: too few arguments - unless");
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
          if (args.length < 3) throw new Error("*Error* eval: too few arguments - for");
          if (args[0].type !== 'symbol') throw new Error("*Error* for: first argument must be a symbol");
          let varName = args[0].name;
          let start = await this.evaluateExpr(args[1], env);
          let end = await this.evaluateExpr(args[2], env);
          let lastVal = null;
          if (typeof start !== 'number' || typeof end !== 'number') throw new Error("*Error* for: limits must be numbers");
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
          return lastVal;
      }

      if (fnName === 'cond') {
          for (let clause of args) {
              if (clause.type !== 'list') throw new Error("*Error* cond: clause must be a list");
              if (clause.elements.length > 0) {
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
          if (args.length < 1) throw new Error("*Error* eval: too few arguments - case");
          let caseVal = await this.evaluateExpr(args[0], env);
          for (let i = 1; i < args.length; i++) {
              let clause = args[i];
              if (clause.type !== 'list') throw new Error("*Error* case: clause must be a list");
              if (clause.elements.length > 0) {
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

      if (fnName === 'mapcar') {
          if (args.length < 2) throw new Error("*Error* eval: too few arguments - mapcar");
          let funcExpr = args[0];
          let lst = await this.evaluateExpr(args[1], env);
          
          if (lst !== null && lst !== 'nil' && !Array.isArray(lst)) {
              throw new Error("*Error* mapcar: second argument must be a list");
          }
          if (lst === null || lst === 'nil') return [];
          
          let funcName = "";
          if (funcExpr.type === 'symbol') funcName = funcExpr.name;
          else if (funcExpr.type === 'string') funcName = funcExpr.value;
          else {
              let evalFunc = await this.evaluateExpr(funcExpr, env);
              if (typeof evalFunc === 'string' || typeof evalFunc === 'symbol') funcName = evalFunc;
          }
          if (!funcName) throw new Error("*Error* mapcar: first argument must be a function name or symbol");
          
          let result = [];
          for (let item of lst) {
              let callNode = { type: 'call', fn: funcName, args: [{ type: 'quote', value: item }] };
              result.push(await this.evaluateExpr(callNode as any, env));
          }
          return result;
      }
      if (fnName === 'foreach') {
          if (args.length < 2) throw new Error("*Error* eval: too few arguments - foreach");
          if (args[0].type !== 'symbol') throw new Error("*Error* foreach: first argument must be a symbol");
          let varName = args[0].name;
          let lst = await this.evaluateExpr(args[1], env);
          let lastVal = null;
          if (lst !== null && lst !== 'nil' && !Array.isArray(lst)) throw new Error("*Error* foreach: second argument must be a list");
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

      throw new Error(`*Error* eval: undefined function - ${fnName}`);
  }
}

export const skillInterpreter = new SkillInterpreter();
