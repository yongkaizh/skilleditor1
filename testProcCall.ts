import { skillInterpreter } from './src/editor/skillInterpreter.ts';

async function run() {
    console.log(await skillInterpreter.evaluate(`
        procedure( myProc(a b)
            a + b
        )
    `));
    console.log(await skillInterpreter.evaluate(`
        myProc()
    `));
}
run();
