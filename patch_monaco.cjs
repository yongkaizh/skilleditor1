const fs = require('fs');
let code = fs.readFileSync('src/editor/monaco-config.ts', 'utf8');

const target = `      // Merge dynamic manual functions
      const dynamicSuggestions = manualFunctions.map(fn => {
        // Create an insert snippet: dbOpenCellViewByType($1)
        const argsMatch = fn.usage.match(/\\((.*?)\\)/);
        let insertSnippet = fn.name + '()';
        if (argsMatch && argsMatch[1].trim() !== '') {
          insertSnippet = fn.name + '($1)';
        }
        return {
          label: fn.name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: insertSnippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: {
            value: [
              '\`\`\`cadence-skill',
              fn.usage,
              '\`\`\`',
              '---',
              fn.description,
              ...(fn.example ? ['', '**Example:**', '\`\`\`cadence-skill', fn.example, '\`\`\`'] : [])
            ].join('\\n')
          },
          detail: 'Cadence SKILL Manual',
          range
        };
      });

      return { suggestions: [...suggestions, ...dynamicSuggestions] };
    }
  });`;

const replacement = `      // Merge dynamic manual functions
      const dynamicSuggestions = manualFunctions.map(fn => {
        // Create an insert snippet: dbOpenCellViewByType($1)
        const argsMatch = fn.usage.match(/\\((.*?)\\)/);
        let insertSnippet = fn.name + '()';
        if (argsMatch && argsMatch[1].trim() !== '') {
          insertSnippet = fn.name + '($1)';
        }
        return {
          label: fn.name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: insertSnippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: {
            value: [
              '\`\`\`cadence-skill',
              fn.usage,
              '\`\`\`',
              '---',
              fn.description,
              ...(fn.example ? ['', '**Example:**', '\`\`\`cadence-skill', fn.example, '\`\`\`'] : [])
            ].join('\\n')
          },
          detail: 'Cadence SKILL Manual',
          range
        };
      });

      // Parse current model for local functions
      const text = model.getValue();
      const localFunctions: any[] = [];
      const defRegex = /\\b(?:procedure|defun)\\s*\\(\\s*([a-zA-Z_]\\w*)\\s*\\((.*?)\\)/g;
      let match;
      while ((match = defRegex.exec(text)) !== null) {
        const fnName = match[1];
        const args = match[2];
        localFunctions.push({
          label: fnName,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: \`\${fnName}(\${args.trim() ? '$1' : ''})\`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: {
            value: [
              '\`\`\`cadence-skill',
              \`procedure \${fnName}(\${args})\`,
              '\`\`\`',
              '---',
              'Local procedure defined in this script.'
            ].join('\\n')
          },
          detail: 'Local function',
          range
        });
      }

      return { suggestions: [...suggestions, ...dynamicSuggestions, ...localFunctions] };
    }
  });`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/editor/monaco-config.ts', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find target in src/editor/monaco-config.ts");
}
