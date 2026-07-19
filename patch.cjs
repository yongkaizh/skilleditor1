const fs = require('fs');
const content = fs.readFileSync('src/components/EditorPane.tsx', 'utf8');
const target = `      }
      
      for (const unclosed of parenStack) {`;
const replacement = `      }
      
      // 4. Missing semicolon check
      for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        if (trimmedLine.length > 0 && !trimmedLine.startsWith(';') && !trimmedLine.startsWith('//')) {
          const lastChar = trimmedLine[trimmedLine.length - 1];
          const continuingChars = ['(', ')', '{', '}', '[', ']', ';', ',', '+', '-', '*', '/', '=', '<', '>', '~'];
          if (!continuingChars.includes(lastChar)) {
            markers.push({
              message: 'Missing semicolon at the end of the statement',
              severity: monaco.MarkerSeverity.Warning,
              startLineNumber: i + 1,
              startColumn: lines[i].length || 1,
              endLineNumber: i + 1,
              endColumn: lines[i].length + 1,
            });
          }
        }
      }

      for (const unclosed of parenStack) {`;
fs.writeFileSync('src/components/EditorPane.tsx', content.replace(target, replacement));
