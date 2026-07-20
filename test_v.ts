import { skillInterpreter } from './src/editor/skillInterpreter';
async function run() {
    console.log(await skillInterpreter.evaluate("let((v) v = 1 println(v))"));
}
run();
