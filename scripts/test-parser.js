import { parseManual } from './src/editor/manualParser.js';

const text = `
@function car
@usage car(l_list)
@category List
@parameters
l_list: The list to access.
@example
car(list(1 2 3)) ; Returns 1
@desc Returns the first element of a list.
`;

const fns = parseManual(text);
console.log(JSON.stringify(fns, null, 2));
if (fns.length > 0 && fns[0].name === 'car') {
  console.log("Parser test PASSED");
} else {
  console.log("Parser test FAILED");
  process.exit(1);
}
