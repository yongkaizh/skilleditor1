import re

with open('src/editor/monaco-config.ts', 'r') as f:
    content = f.read()

# We need to find `export function configureMonaco` and append `monaco.languages.registerDefinitionProvider` to it.

if 'registerDefinitionProvider' not in content:
    definition_provider_code = """
  // Register Definition Provider
  monaco.languages.registerDefinitionProvider('cadence-skill', {
    provideDefinition: (model: any, position: any) => {
      const wordInfo = model.getWordAtPosition(position);
      if (!wordInfo) return null;
      const word = wordInfo.word;

      // Access project files from our global project state
      const files = projectState.getFiles();
      for (const file of files) {
        const text = file.content;
        const lines = text.split('\\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Simple regex to match procedure or defun definition
          const regex = new RegExp(`\\\\b(?:procedure|defun)\\\\s*\\\\(\\\\s*${word}\\\\b`);
          if (regex.test(line)) {
            // Found a definition
            
            const targetModel = monaco.editor.getModels().find((m: any) => m.uri.path.endsWith(file.name));
            if (targetModel) {
              return {
                uri: targetModel.uri,
                range: {
                  startLineNumber: i + 1,
                  startColumn: 1,
                  endLineNumber: i + 1,
                  endColumn: line.length + 1
                }
              };
            }
          }
        }
      }
      return null;
    }
  });
"""
    # Insert it before the end of configureMonaco
    # Actually, let's insert it right after `monaco.languages.registerFoldingRangeProvider`
    target = "  monaco.languages.registerCompletionItemProvider('cadence-skill',"
    content = content.replace(target, definition_provider_code + "\n" + target)

with open('src/editor/monaco-config.ts', 'w') as f:
    f.write(content)

