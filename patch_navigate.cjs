const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update handleNavigate
const oldHandleNavigate = `  const handleNavigate = (fileName: string, line?: number) => {
    const file = files.find(f => f.name === fileName);
    if (file) {
      handleFileSelect(file.id);
      if (line !== undefined && editorRef.current) {
        // Delay ensures editor has loaded the new model before scrolling
        setTimeout(() => {
          editorRef.current.revealLineInCenter(line);
          editorRef.current.setPosition({ lineNumber: line, column: 1 });
          editorRef.current.focus();
        }, 100);
      }
    }
  };`;

const newHandleNavigate = `  const errorDecorsRef = useRef<string[]>([]);
  const handleNavigate = (fileName: string, line?: number, col?: number) => {
    const file = files.find(f => f.name === fileName);
    if (file) {
      handleFileSelect(file.id);
      if (line !== undefined && editorRef.current) {
        setTimeout(() => {
          editorRef.current.revealLineInCenter(line);
          editorRef.current.setPosition({ lineNumber: line, column: col || 1 });
          
          if (monacoRef.current) {
            const decors = editorRef.current.deltaDecorations(errorDecorsRef.current, [
              {
                range: new monacoRef.current.Range(line, col || 1, line, (col || 1) + 1),
                options: {
                  className: 'error-highlight',
                  isWholeLine: !col,
                  linesDecorationsClassName: 'error-line-highlight'
                }
              }
            ]);
            errorDecorsRef.current = decors;
          }
          
          editorRef.current.focus();
        }, 100);
      }
    }
  };`;

code = code.replace(oldHandleNavigate, newHandleNavigate);

// Update Console usage
code = code.replace(/<Console([\s\S]*?)onRefactor=\{handleRefactorCode\}/, '<Console$1onJumpToError={(line, col) => handleNavigate(activeFile.name, line, col)}\n                onRefactor={handleRefactorCode}');

fs.writeFileSync('src/App.tsx', code);
