const fs = require('fs');

let code = fs.readFileSync('src/editor/skillInterpreter.ts', 'utf8');

// Replace public tokenize
const oldTokenize = `  public tokenize(code: string) {
    let tokens: any[] = [];
    let i = 0;
    let line = 1;
    let spaceBefore = false;
    while (i < code.length) {
        let char = code[i];
        if (char === '\\n') { line++; i++; spaceBefore = true; continue; }
        if (char === ' ' || char === '\\t' || char === '\\r' || char === ',') { i++; spaceBefore = true; continue; }
        if (char === ';') {
            while (i < code.length && code[i] !== '\\n') i++;
            spaceBefore = true;
            continue;
        }
        let currSpaceBefore = spaceBefore;
        spaceBefore = false;
        if (char === '"') {
            let str = '"';
            i++;
            while (i < code.length) {
                str += code[i];
                if (code[i] === '"' && code[i-1] !== '\\\\') { i++; break; }
                if (code[i] === '\\n') line++;
                i++;
            }
            tokens.push({val: str, line, spaceBefore: currSpaceBefore});
            continue;
        }
        if (char === '(' || char === ')' || char === '\\'' || char === '[' || char === ']') {
            tokens.push({val: char, line, spaceBefore: currSpaceBefore});
            i++;
            continue;
        }
        let objMatch = code.substring(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*:0x[0-9a-fA-F]+/i);
        if (objMatch) {
            tokens.push({val: objMatch[0], line, spaceBefore: currSpaceBefore});
            i += objMatch[0].length;
            continue;
        }
        if ("=+-*/<>!:[]".includes(char)) {
            if (char === '-' && (tokens.length === 0 || " \\t\\n\\r(,;=+-*/<>!:[]".includes(code[i-1]))) {
                i++;
                let word = "-";
                while (i < code.length && !(" \\t\\n\\r(),;\\"'=+-*/<>!:[]".includes(code[i]))) {
                    word += code[i];
                    i++;
                }
                if (word === "-") {
                    tokens.push({val: "-", line, spaceBefore: currSpaceBefore});
                } else {
                    tokens.push({val: word, line, spaceBefore: currSpaceBefore});
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
            tokens.push({val: op, line, spaceBefore: currSpaceBefore});
            continue;
        }
        let word = "";
        while (i < code.length && !(" \\t\\n\\r(),;\\"'=+-*/<>!:[]".includes(code[i]))) {
            word += code[i];
            i++;
        }
        if (word) {
            tokens.push({val: word, line, spaceBefore: currSpaceBefore});
        }
    }
    return tokens;
  }`;

const newTokenize = `  public tokenize(code: string) {
    let tokens: any[] = [];
    let i = 0;
    let line = 1;
    let col = 1;
    let spaceBefore = false;
    while (i < code.length) {
        let char = code[i];
        if (char === '\\n') { line++; col = 1; i++; spaceBefore = true; continue; }
        if (char === ' ' || char === '\\t' || char === '\\r' || char === ',') { col++; i++; spaceBefore = true; continue; }
        if (char === ';') {
            while (i < code.length && code[i] !== '\\n') { i++; col++; }
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
                if (code[i] === '"' && code[i-1] !== '\\\\') { i++; col++; break; }
                if (code[i] === '\\n') { line++; col = 1; } else { col++; }
                i++;
            }
            tokens.push({val: str, line, col: startCol, spaceBefore: currSpaceBefore});
            continue;
        }
        if (char === '(' || char === ')' || char === '\\'' || char === '[' || char === ']') {
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
            if (char === '-' && (tokens.length === 0 || " \\t\\n\\r(,;=+-*/<>!:[]".includes(code[i-1]))) {
                i++; col++;
                let word = "-";
                while (i < code.length && !(" \\t\\n\\r(),;\\"'=+-*/<>!:[]".includes(code[i]))) {
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
        while (i < code.length && !(" \\t\\n\\r(),;\\"'=+-*/<>!:[]".includes(code[i]))) {
            word += code[i];
            i++; col++;
        }
        if (word) {
            tokens.push({val: word, line, col: startCol, spaceBefore: currSpaceBefore});
        }
    }
    return tokens;
  }`;

// wait, is it literally matched?
let idx = code.indexOf('public tokenize(code: string) {');
let endIdx = code.indexOf('private processInfix(nodes: ASTNode[]): ASTNode[] {');
if (idx !== -1 && endIdx !== -1) {
    let replaced = code.substring(0, idx) + newTokenize + '\n  ' + code.substring(endIdx);
    fs.writeFileSync('src/editor/skillInterpreter.ts', replaced);
    console.log("Patched tokenize successfully");
} else {
    console.log("Failed to patch tokenize. idx=" + idx + " endIdx=" + endIdx);
}
