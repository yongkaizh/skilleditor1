import { skillInterpreter } from './src/editor/skillInterpreter';
async function run() {
    console.log(await skillInterpreter.evaluate("let((varList) varList = '(1 2 3) println(car(varList)))"));
}
run();
