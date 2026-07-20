// Helper for Typo detection
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export interface ExtractedFunction {
  name: string;
  args: string;
  line: number;
  index: number;
}

export function extractDefinedFunctions(content: string): ExtractedFunction[] {
  const functions: ExtractedFunction[] = [];
  if (!content) return functions;

  const patterns = [
    // Pattern 1: C-style procedure/defun with nested argument parentheses
    // E.g., procedure( addTwo(x y) ... )
    /\b(?:procedure|defun)\s*\(\s*([a-zA-Z_]\w*)\s*\((.*?)\)/g,

    // Pattern 2: Lisp-style with parenthesized signature list
    // E.g., (procedure (addTwo x y) ... ) or (defun (addTwo x y) ... )
    /\(\s*(?:procedure|defun)\s*\(\s*([a-zA-Z_]\w*)\s+([^)]*)\)/g,

    // Pattern 3: Lisp-style with symbol then argument list
    // E.g., (procedure addTwo (x y) ... ) or (defun addTwo (x y) ... )
    /\(\s*(?:procedure|defun)\s+([a-zA-Z_]\w*)\s*\(\s*([^)]*)\)/g,

    // Pattern 4: C-style procedure with name and args comma separated
    // E.g., procedure( addTwo, (x, y) ... )
    /\b(?:procedure|defun)\s*\(\s*([a-zA-Z_]\w*)\s*,\s*\((.*?)\)/g
  ];

  for (const regex of patterns) {
    // Reset regex index
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const line = (content.substring(0, match.index).match(/\n/g) || []).length + 1;
      const name = match[1];
      const args = match[2] ? match[2].trim() : "";
      
      // Prevent duplicates from different patterns at the same position
      if (!functions.some(f => f.name === name && f.line === line)) {
        functions.push({
          name,
          args,
          line,
          index: match.index
        });
      }
    }
  }

  // Sort functions by their position in the file
  return functions.sort((a, b) => a.index - b.index);
}
