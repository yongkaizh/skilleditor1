export interface SkillFunction {
  name: string;
  usage: string;
  description: string;
  example: string;
  parameters?: string;
  category?: string;
}

/**
 * Parses a raw text manual into an array of SkillFunction objects.
 * Expects the format:
 * @function functionName
 * @usage functionUsage(...)
 * @desc Description text.
 */
export function parseManual(rawText: string): SkillFunction[] {
  const functions: SkillFunction[] = [];
  const lines = rawText.split('\n');

  let currentFunc: Partial<SkillFunction> = {};
  let currentSection: 'description' | 'example' | 'parameters' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed && currentSection !== 'example') {
      continue;
    }

    if (trimmed.startsWith('@function')) {
      if (currentFunc.name) {
        functions.push(currentFunc as SkillFunction);
      }
      currentFunc = {
        name: trimmed.replace(/^@function\s+/, '').trim(),
        usage: '',
        description: '',
        example: '',
        parameters: '',
        category: 'General'
      };
      currentSection = null;
    } else if (trimmed.startsWith('@usage') && currentFunc.name) {
      currentFunc.usage = trimmed.replace(/^@usage\s+/, '').trim();
      currentSection = null;
    } else if (trimmed.startsWith('@example') && currentFunc.name) {
      const content = trimmed.replace(/^@example\s*/, '').trim();
      currentFunc.example = content;
      currentSection = 'example';
    } else if (trimmed.startsWith('@parameters') && currentFunc.name) {
      const content = trimmed.replace(/^@parameters\s*/, '').trim();
      currentFunc.parameters = content;
      currentSection = 'parameters';
    } else if (trimmed.startsWith('@category') && currentFunc.name) {
      currentFunc.category = trimmed.replace(/^@category\s+/, '').trim();
      currentSection = null;
    } else if ((trimmed.startsWith('@desc') || trimmed.startsWith('@description')) && currentFunc.name) {
      currentFunc.description = trimmed.replace(/^@(description|desc)\s+/, '').trim();
      currentSection = 'description';
    } else if (currentFunc.name && currentSection) {
      if (!trimmed.startsWith('@')) {
        if (currentSection === 'description') {
          currentFunc.description += (currentFunc.description ? '\n' : '') + trimmed;
        } else if (currentSection === 'example') {
          currentFunc.example += (currentFunc.example ? '\n' : '') + line; // Keep indentation for examples
        } else if (currentSection === 'parameters') {
          currentFunc.parameters += (currentFunc.parameters ? '\n' : '') + trimmed;
        }
      }
    }
  }

  if (currentFunc.name) {
    functions.push(currentFunc as SkillFunction);
  }

  
  const deduplicated = new Map<string, SkillFunction>();
  for (const fn of functions) {
    if (deduplicated.has(fn.name)) {
      const existing = deduplicated.get(fn.name)!;
      const existingScore = (existing.description?.length || 0) + (existing.example?.length || 0) + (existing.parameters?.length || 0);
      const newScore = (fn.description?.length || 0) + (fn.example?.length || 0) + (fn.parameters?.length || 0);
      if (newScore > existingScore) {
        deduplicated.set(fn.name, fn);
      }
    } else {
      deduplicated.set(fn.name, fn);
    }
  }
  return Array.from(deduplicated.values());
}
