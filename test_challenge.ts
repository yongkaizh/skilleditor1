import { skillInterpreter } from './src/editor/skillInterpreter';
import { challenges } from './src/data/challenges';

async function run() {
    for (const c of challenges) {
        if (!c.exampleInput || !c.solutionCode) continue;
        console.log(`\nTesting challenge: ${c.title}`);
        try {
            const fullCode = `${c.solutionCode}\n${c.exampleInput}\n`;
            let callStr = '';
            // Hacky way to figure out what to call
            if (c.id === 'boolean-sat-3') callStr = 'solve3SAT(clauses vars)';
            if (c.id === 'metal-fill-insertion') callStr = 'maxMetalDensity(grid W)';
            if (c.id === 'a-star-router') callStr = 'routeAStar(sourcePt targetPt obstacles 1)';
            if (c.id === 'via-stitching') callStr = 'generateViaStitching(m1Box m2Box viaSize viaSpacing enclosure)';
            if (c.id === 'prop-cleanup') callStr = 'cleanupHierarchy(cvId pattern protected)';
            if (c.id === 'power-mesh') callStr = 'estimateMeshResistance(segments startNode endNode)';
            
            if (!callStr) continue;
            
            const codeToRun = `${fullCode}\nprintln(${callStr})\n`;
            skillInterpreter.setOutputHandler((out) => console.log('OUTPUT:', out));
            const result = await skillInterpreter.evaluate(codeToRun);
            console.log('Result:', result);
        } catch (e) {
            console.error('Error:', e);
        }
    }
}
run();
