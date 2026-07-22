export interface SkillFunction {
  name: string;
  usage: string;
  description: string;
  example: string;
  parameters?: string;
  category?: string;
}

export function normalizeCategory(name: string, rawCat?: string): string {
  let cat = rawCat;
  if (!cat || cat === 'General' || cat === 'Uncategorized') {
    if (name.startsWith('db')) return 'Database Access';
    if (name.startsWith('le')) return 'Layout Editor';
    if (name.startsWith('ge')) return 'Graphics & Display';
    if (name.startsWith('hi')) return 'User Interface';
    if (name.startsWith('sch')) return 'Schematic Editor';
    if (name.startsWith('cdf')) return 'Component Description Format';
    if (name.startsWith('ipc')) return 'Inter-Process Communication';
    if (name.startsWith('dd')) return 'Data Manager';
    if (name.startsWith('rod')) return 'Relative Object Design';
    if (name.startsWith('tech')) return 'Technology File';
    if (name.startsWith('env') || ['sh', 'system', 'getWorkingDir', 'changeWorkingDir', 'getShellEnvVar', 'setShellEnvVar'].includes(name)) return 'Environment & OS';
    if (name.startsWith('str') || name.startsWith('pcre') || name.startsWith('rex') || name.includes('String') || name.includes('Substring')) return 'String & RegEx';
    if (['list', 'cons', 'car', 'cdr', 'append', 'length', 'nth', 'member', 'assoc', 'foreach', 'map', 'mapcar', 'reverse', 'remove', 'last'].includes(name) || name.endsWith('List') || name.includes('List')) return 'List Operations';
    if (['abs', 'cos', 'sin', 'tan', 'sqrt', 'log', 'exp', 'plus', 'minus', 'times', 'quotient', 'mod', 'min', 'max', 'round', 'floor', 'ceiling'].includes(name) || name.startsWith('math')) return 'Math & Numbers';
    if (name.endsWith('p') && (name.startsWith('is') || ['atom', 'listp', 'stringp', 'fixp', 'floatp', 'symbolp', 'numberp', 'null', 'zerop'].includes(name))) return 'Type Checking';
    return 'Core Language';
  }

  // Standardize existing category synonyms
  if (cat === 'Database') return 'Database Access';
  if (cat === 'Graphic Editor' || cat === 'Graphics') return 'Graphics & Display';
  if (cat === 'Human Interface' || cat === 'UI') return 'User Interface';
  if (cat === 'Data Dictionary' || cat === 'Design Data') return 'Data Manager';
  if (cat === 'Techfile') return 'Technology File';
  if (cat === 'ROD') return 'Relative Object Design';
  if (cat === 'Strings' || cat === 'RegEx') return 'String & RegEx';
  if (cat === 'Language' || cat === 'Core') return 'Core Language';
  if (cat === 'Layout') return 'Layout Editor';
  if (cat === 'Schematic') return 'Schematic Editor';
  if (cat === 'List') return 'List Operations';
  if (cat === 'Math') return 'Math & Numbers';
  if (cat === 'File I/O') return 'File I/O';
  if (cat === 'Environment') return 'Environment & OS';

  return cat;
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
        currentFunc.category = normalizeCategory(currentFunc.name, currentFunc.category);
        functions.push(currentFunc as SkillFunction);
      }
      currentFunc = {
        name: trimmed.replace(/^@function\s+/, '').trim(),
        usage: '',
        description: '',
        example: '',
        parameters: '',
        category: ''
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
    currentFunc.category = normalizeCategory(currentFunc.name, currentFunc.category);
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
