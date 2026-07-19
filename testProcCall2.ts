import { skillInterpreter } from './src/editor/skillInterpreter.ts';

async function run() {
    console.log(await skillInterpreter.evaluate(`
        procedure( alignShapesToOrigin()
            1
        )
    `));
    console.log(await skillInterpreter.evaluate(`
        alignShapesToOrigin()
    `));
    console.log(await skillInterpreter.evaluate(`
        alignShapesToOrigin(1)
    `));
}
run();
