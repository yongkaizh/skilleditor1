import { skillInterpreter } from './src/editor/skillInterpreter.js';

async function test() {
    const oldOut = console.log;
    skillInterpreter.setOutputHandler((t) => oldOut("OUTPUT:", t));
    try {
        const res = await skillInterpreter.evaluate('printf("total is %d" "fibe")');
        console.log("RESULT:", res);
    } catch (e) {
        console.error("CAUGHT:", e);
    }
}
test();
