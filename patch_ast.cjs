const fs = require('fs');

let code = fs.readFileSync('src/editor/skillInterpreter.ts', 'utf8');

// Add col to ASTNode types
code = code.replace(/\{ type: 'number', value: number, line: number \}/g, "{ type: 'number', value: number, line: number, col: number }");
code = code.replace(/\{ type: 'string', value: string, line: number \}/g, "{ type: 'string', value: string, line: number, col: number }");
code = code.replace(/\{ type: 'boolean', value: boolean, line: number \}/g, "{ type: 'boolean', value: boolean, line: number, col: number }");
code = code.replace(/\{ type: 'symbol', name: string, line: number \}/g, "{ type: 'symbol', name: string, line: number, col: number }");
code = code.replace(/\{ type: 'list', elements: ASTNode\[\], line: number \}/g, "{ type: 'list', elements: ASTNode[], line: number, col: number }");
code = code.replace(/\{ type: 'call', fn: string, args: ASTNode\[\], line: number \}/g, "{ type: 'call', fn: string, args: ASTNode[], line: number, col: number }");
code = code.replace(/\{ type: 'quote', value: ASTNode, line: number \}/g, "{ type: 'quote', value: ASTNode, line: number, col: number }");

// Replace new Error("*Error*...") with new SkillError("*Error*...", expr.line, expr.col)
// But first, we need to add SkillError class
if (!code.includes("class SkillError")) {
    const errorClass = `
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
`;
    code = code.replace('export interface EvaluationResult', errorClass + 'export interface EvaluationResult');
}

// In parse() we need to attach col. Let's see how e = { type: ..., line: t.line } is constructed
code = code.replace(/line: t.line/g, "line: t.line, col: t.col");

// Check where elements are created without col
// e = { type: 'list', elements: listNodes, line: startLine }; -> add startCol
// e = { type: 'call', fn: e.name, args, line: e.line }; -> add col: e.col
// e = { type: 'quote', value: parseExpr(), line: t.line }; -> add col: t.col

code = code.replace(/line: startLine \};/g, "line: startLine, col: startCol };");
code = code.replace(/line: e.line \};/g, "line: e.line, col: e.col };");
code = code.replace(/line: t.line \};/g, "line: t.line, col: t.col };");
code = code.replace(/let startLine = t.line;/g, "let startLine = t.line;\n              let startCol = t.col;");

// Also add startCol to while(true) block variables if needed. Let's check the code after replacing to see if it missed anything.

fs.writeFileSync('src/editor/skillInterpreter.ts', code);
console.log("Patched AST");
