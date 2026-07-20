import { skillInterpreter } from './src/editor/skillInterpreter';
async function run() {
    console.log(await skillInterpreter.evaluate("println(!c_ok)"));
}
run();
