
/**
 * Expert Refactor Engine for Cadence SKILL
 * Applies common design patterns and best practices.
 */
export const refactorSkillCode = (code: string): string => {
  let refactored = code;

  // 1. Ensure 'let' blocks have proper list structure if missing
  refactored = refactored.replace(/let\s*\(\s*([a-zA-Z0-9_\s]+)\s*\n/g, (match, vars) => {
    const varList = vars.trim().split(/\s+/);
    if (varList.length > 0 && !match.includes('(')) {
      return `let( (${varList.join(' ')})\n`;
    }
    return match;
  });

  // 2. Optimize foreach loops (suggesting mapping or better iteration)
  // Simple heuristic: suggest using 'mapcar' for simple value transformations
  refactored = refactored.replace(/foreach\(\s*(\w+)\s+([a-zA-Z0-9_]+)\s+result\s*=\s*cons\(.*\s*result\)\s*\)/g, (match, item, list) => {
    return `; Optimized with mapcar\nresult = mapcar('lambda((${item}) ...) ${list})`;
  });

  // 3. Standardize Geometric Prefixes
  // Ensure common geometric operations use the 'db' or 'le' prefix if they look like standard calls
  const geoFuncs = ['CreateRect', 'CreatePath', 'CreateVia', 'GetOverlaps'];
  geoFuncs.forEach(func => {
    const regex = new RegExp(`(?<!db|le|hi|ge|tech|rod)(?<![a-zA-Z0-9_])${func}\\(`, 'g');
    refactored = refactored.replace(regex, `db${func}(`);
  });

  // 4. Add header if missing
  if (!refactored.trim().startsWith(';')) {
    const timestamp = new Date().toISOString().split('T')[0];
    refactored = `; Refactored: ${timestamp}\n; Automated Design Pattern Improvements Applied\n\n${refactored}`;
  }

  return refactored;
};
