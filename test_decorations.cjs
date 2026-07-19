const fs = require('fs');
let code = fs.readFileSync('src/components/EditorPane.tsx', 'utf8');

// Check if we already have editorRef
if (!code.includes('editorRef')) {
  code = code.replace(
    'const manualFns = React.useMemo(',
    'const editorRef = React.useRef<any>(null);\n  const decorationsRef = React.useRef<any[]>([]);\n  const manualFns = React.useMemo('
  );
  
  code = code.replace(
    'onMount={onMount}',
    `onMount={(editor, m) => {
          editorRef.current = editor;
          if (onMount) onMount(editor, m);
        }}`
  );
  
  fs.writeFileSync('src/components/EditorPane.tsx', code);
  console.log("Added editorRef to EditorPane");
} else {
  console.log("editorRef already exists in EditorPane");
}
