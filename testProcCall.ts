import { skillInterpreter } from './src/editor/skillInterpreter.ts';

async function run() {
    console.log("--- Executing procedure declaration ---");
    const declRes = await skillInterpreter.evaluate(`
        procedure( replaceSchematicInstances(cvId oldCellName newLibName newCellName)
            let( (newMaster count)
                newMaster = dbOpenCellViewByType(newLibName newCellName "symbol" "" "r")
                count = 0
                if( newMaster then
                    foreach( inst cvId~>instances
                        if( inst~>cellName == oldCellName then
                            inst~>master = newMaster
                            count++
                        )
                    )
                    printf("*Success* Swapped %d instances of '%s' with '%s/%s' symbol\\n" count oldCellName newLibName newCellName)
                    dbClose(newMaster)
                else
                    printf("*Error* Could not find symbol master for %s/%s\\n" newLibName newCellName)
                )
            )
        )
    `);
    console.log("Declaration result:", declRes);

    console.log("\n--- Testing call with invalid cvId (1) ---");
    const badRes = await skillInterpreter.evaluate(`
        replaceSchematicInstances(1 "nfet_old" "analogLib" "nmos4")
    `);
    console.log("Bad input result:", badRes);

    console.log("\n--- Testing call with valid mock cellview ---");
    const goodRes = await skillInterpreter.evaluate(`
        replaceSchematicInstances(geGetWindowCellView() "nfet_old" "analogLib" "nmos4")
    `);
    console.log("Good input result:", goodRes);
}
run();
