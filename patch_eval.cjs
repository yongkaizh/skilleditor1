const fs = require('fs');

let code = fs.readFileSync('src/editor/skillInterpreter.ts', 'utf8');

code = code.replace(/private async evaluateExpr\\(expr: ASTNode, env: Environment\\): Promise<any> \\{/,
`private async evaluateExpr(expr: ASTNode, env: Environment): Promise<any> {
    try {
        return await this._evaluateExpr(expr, env);
    } catch (err: any) {
        if (err instanceof ReturnException) throw err;
        if (err.name === 'SkillError') throw err;
        throw new SkillError(err.message, expr.line, expr.col);
    }
}
private async _evaluateExpr(expr: ASTNode, env: Environment): Promise<any> {`
);

fs.writeFileSync('src/editor/skillInterpreter.ts', code);
console.log("Patched evaluateExpr");
