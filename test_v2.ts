import { skillInterpreter } from './src/editor/skillInterpreter';
async function run() {
    console.log(await skillInterpreter.evaluate("let((assign v) assign = makeTable(\"a\" -1) v = 1 assign[v] = 0 println(assign[v]))"));
}
run();
