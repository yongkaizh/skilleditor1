import { skillInterpreter } from './src/editor/skillInterpreter.ts';

async function run() {
    skillInterpreter.setOutputHandler((out) => console.log("OUTPUT:", out));
    let res = await skillInterpreter.evaluate(`
        let( (a)
            a = 2
            case( a
                1 println("one") 
                2 println("two") 
            )
        )
    `);
}
run();
