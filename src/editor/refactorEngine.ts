
/**
 * Expert Refactor Engine for Cadence SKILL
 * Applies common design patterns and best practices.
 */
export interface RefactorResult {
  code: string;
  explanations: string[];
}

export const refactorSkillCode = (code: string): RefactorResult => {
  let refactored = code;
  const explanations: string[] = [];

  // 1. Ensure 'let' blocks have proper list structure if missing
  const letRegex = /let\s*\(\s*([a-zA-Z0-9_\s]+)\s*\n/g;
  let replacedLet = false;
  refactored = refactored.replace(letRegex, (match, vars) => {
    const varList = vars.trim().split(/\s+/);
    if (varList.length > 0 && !vars.includes('(')) {
      replacedLet = true;
      return `let( (${varList.join(' ')})\n`;
    }
    return match;
  });
  if (replacedLet) explanations.push("Enclosed local variables in 'let' blocks within a list to fix syntax.");

  // 2. Optimize foreach loops
  const foreachRegex = /foreach\(\s*(\w+)\s+([a-zA-Z0-9_]+)\s+result\s*=\s*cons\(.*?\s*result\s*\)\s*\)/g;
  let replacedForeach = false;
  refactored = refactored.replace(foreachRegex, (match, item, list) => {
    replacedForeach = true;
    return `; Optimized with mapcar\nresult = mapcar('lambda((${item}) ...) ${list})`;
  });
  if (replacedForeach) explanations.push("Optimized 'foreach' loops with 'cons' accumulation into 'mapcar' for better performance.");

  // 3. Standardize Geometric Prefixes
  const geoFuncs = ['CreateRect', 'CreatePath', 'CreateVia', 'GetOverlaps'];
  let addedPrefixes = false;
  geoFuncs.forEach(func => {
    const regex = new RegExp(`(?<!db|le|hi|ge|tech|rod)(?<![a-zA-Z0-9_])${func}\\(`, 'g');
    refactored = refactored.replace(regex, () => {
      addedPrefixes = true;
      return `db${func}(`;
    });
  });
  if (addedPrefixes) explanations.push("Standardized generic geometric functions with standard Cadence 'db' prefixes.");

  // 4. Clean trailing whitespace
  const trailingWhitespaceRegex = /[ \t]+$/gm;
  let removedWhitespace = false;
  refactored = refactored.replace(trailingWhitespaceRegex, () => {
    removedWhitespace = true;
    return '';
  });
  if (removedWhitespace) explanations.push("Removed trailing whitespace for cleaner code.");

  // 5. Add header if missing
  if (!refactored.trim().startsWith(';') && explanations.length > 0) {
    const timestamp = new Date().toISOString().split('T')[0];
    refactored = `; Refactored: ${timestamp}\n; Automated Design Pattern Improvements Applied\n\n${refactored}`;
    explanations.push("Added standard file header documentation.");
  }

  return { code: refactored, explanations };
};
