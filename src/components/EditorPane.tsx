import { projectState } from "../editor/projectState";
import React from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { configureMonaco } from '../editor/monaco-config';
import { levenshteinDistance } from '../editor/utils';

interface EditorPaneProps {
  value: string;
  onChange: (value: string | undefined) => void;
  onMount?: (editor: any, monaco: any) => void;
  showMinimap?: boolean;
  fontSize?: number;
  wordWrap?: boolean;
  activeFileName?: string;
  manualFns: any[];
  breakpoints?: number[];
  onBreakpointToggle?: (line: number) => void;
  onNavigate?: (fileName: string, line?: number) => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({ 
  value, 
  onChange, 
  onMount, 
  showMinimap = false, 
  fontSize = 14, 
  wordWrap = true, 
  activeFileName = 'script.il',
  manualFns,
  breakpoints = [],
  onBreakpointToggle,
  onNavigate
}) => {
  const monaco = useMonaco();
  const editorRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (monaco) {
      configureMonaco(monaco, manualFns);
      
      monaco.editor.defineTheme('antigravity-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: 'C678DD' },      // purple
          { token: 'identifier', foreground: 'E06C75' },   // red
          { token: 'string', foreground: '98C379' },       // green
          { token: 'comment', foreground: '5C6370', fontStyle: 'italic' }, // grey
          { token: 'number', foreground: 'D19A66' },       // orange
          { token: 'operator', foreground: '56B6C2' },     // cyan
        ],
        colors: {
          'editor.background': '#12141a',
          'editor.lineHighlightBackground': '#1a1c23',
          'editorLineNumber.foreground': '#475569',
        }
      });
    }
  }, [monaco, manualFns]);

  // Advanced SKILL Linter implementation (Parentheses + Typo Detection)
  React.useEffect(() => {
    if (!monaco || value === undefined || manualFns.length === 0) return;

    const timeout = setTimeout(() => {
      const markers: any[] = [];
      const lines = value.split('\n');
      
      const functionNames = manualFns.map(f => f.name);
      
      // Extract user-defined functions
      const localFunctions: string[] = [];
      const defRegex = /\b(?:procedure|defun)\s*\(\s*([a-zA-Z_]\w*)/g;
      let defMatch;
      while ((defMatch = defRegex.exec(value)) !== null) {
        localFunctions.push(defMatch[1]);
      }
      
            const projectFuncs = projectState.functions.filter((f: any) => f.fileName !== activeFileName);
      const projectFuncNames = projectFuncs.map((f: any) => f.name);
      
const parenStack: { line: number; col: number }[] = [];
      const procBlocks: { startLine: number; endLine: number }[] = [];
      let currentProcLine: number | null = null;

      const keywords = [
        'procedure', 'defun', 'let', 'prog', 'if', 'then', 'else', 'case', 'cond',
        'foreach', 'for', 'while', 'return', 'setq', 't', 'nil', 'in', 'go', 'printf', 'fprintf', 'sprintf',
        'car', 'cdr', 'cadr', 'cons', 'append', 'length', 'member', 'reverse', 'sort', 'list',
        'apply', 'funcall', 'eval', 'strcat', 'substring', 'buildString', 'parseString',
        'error', 'warn', 'rexMatch', 'rexCompile', 'rexReplace', 'open', 'close', 'lineread', 'gets'
      ];
      const allValid = new Set([...functionNames, ...keywords, ...localFunctions, ...projectFuncNames]);

      
      const calledProjectFuncs = new Set<string>();
      let inBlockComment = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        
      let inString = false;
        let cleanLine = '';
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (inBlockComment) {
            cleanLine += ' ';
            if (char === '*' && line[j+1] === '/') {
              inBlockComment = false;
              cleanLine += ' ';
              j++;
            }
            continue;
          }
          
          if (char === '/' && line[j+1] === '*') {
            inBlockComment = true;
            cleanLine += '  ';
            j++;
            continue;
          }
          
          if (char === ';') {
            // line comment, ignore rest of line
            cleanLine += ' '.repeat(line.length - j);
            break;
          }
          
          if (char === '"' && (j === 0 || line[j - 1] !== '\\')) {
            inString = !inString;
            cleanLine += ' ';
            continue;
          }
          
          if (inString) {
            cleanLine += ' ';
            continue;
          }
          
          cleanLine += char;
          
          if (char === '(') {
            parenStack.push({ line: i + 1, col: j + 1 });
            if (currentProcLine === null && /\b(procedure|defun)\s*\($/.test(cleanLine)) {
              currentProcLine = i + 1;
            }

          } else if (char === ')') {
            if (parenStack.length > 0) {
              parenStack.pop();
              if (parenStack.length === 0 && currentProcLine !== null) {
                procBlocks.push({ startLine: currentProcLine, endLine: i + 1 });
                currentProcLine = null;
              }
            } else {
              markers.push({
                message: 'Unexpected closing parenthesis ")"',
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: i + 1,
                startColumn: j + 1,
                endLineNumber: i + 1,
                endColumn: j + 2,
              });
            }
          }
        }
        
        if (inString) {
          markers.push({
            message: 'Unterminated string literal',
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: i + 1,
            startColumn: line.lastIndexOf('"') + 1,
            endLineNumber: i + 1,
            endColumn: line.length + 1,
          });
        }

        // 2. Generic Function Call Typo Detection
        const callRegex = /\b([a-zA-Z_]\w*)\s*\(/g;
        let callMatch;
        while ((callMatch = callRegex.exec(cleanLine)) !== null) {
          const word = callMatch[1];
          if (projectFuncNames.includes(word)) {
            calledProjectFuncs.add(word);
          }
          if (!allValid.has(word)) {
            let closest = '';
            let minDistance = 999;
            for (const valid of allValid) {
              if (Math.abs(valid.length - word.length) > 2) continue;
              const dist = levenshteinDistance(word, valid);
              if (dist < minDistance) {
                minDistance = dist;
                closest = valid;
              }
            }
            if (minDistance > 0 && minDistance <= 2) {
              markers.push({
                message: `Typo detected: Unknown function '${word}'.\nDid you mean '${closest}'?`,
                severity: monaco.MarkerSeverity.Warning,
                startLineNumber: i + 1,
                startColumn: callMatch.index + 1,
                endLineNumber: i + 1,
                endColumn: callMatch.index + 1 + word.length,
              });
            }
          }
        }

        // 3. Cadence API specific check (strict prefix check)
        const apiRegex = /\b(db|le|ge|hi|tech|rod)[A-Z][a-zA-Z0-9_]*\b/g;
        let match: any;
        while ((match = apiRegex.exec(cleanLine)) !== null) {
          const word = match[0];
          
          if (!functionNames.includes(word) && !keywords.includes(word)) {
            let closest = '';
            let minDistance = 999;
            
            for (const fnName of functionNames) {
              if (Math.abs(fnName.length - word.length) > 3) continue;
              if (fnName.substring(0,2) === word.substring(0,2)) {
                const dist = levenshteinDistance(word, fnName);
                if (dist < minDistance) {
                  minDistance = dist;
                  closest = fnName;
                }
              }
            }
            
            const isAlreadyMarked = markers.some(m => m.startLineNumber === i + 1 && m.startColumn === match.index + 1);
            
            if (!isAlreadyMarked) {
              if (minDistance > 0 && minDistance <= 3) {
                markers.push({
                  message: `Typo detected: Unknown function '${word}'.\nDid you mean '${closest}'?`,
                  severity: monaco.MarkerSeverity.Warning,
                  startLineNumber: i + 1,
                  startColumn: match.index + 1,
                  endLineNumber: i + 1,
                  endColumn: match.index + 1 + word.length,
                });
              }
            }
          }
        }
      }
      
            calledProjectFuncs.forEach((funcName: any) => {
        const fn = projectFuncs.find((f: any) => f.name === funcName);
        if (fn) {
           const loadRegex = new RegExp(`load\\s*\\(\\s*"${fn.fileName}"\\s*\\)`);
           if (!loadRegex.test(value)) {
              markers.push({
                message: `Missing load statement for '${funcName}' defined in '${fn.fileName}'.\nDid you mean to add 'load("${fn.fileName}")'?`,
                severity: monaco.MarkerSeverity.Warning,
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 2
              });
           }
        }
      });

      for (const unclosed of parenStack) {
        markers.push({
          message: 'Missing closing parenthesis ")"',
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: unclosed.line,
          startColumn: unclosed.col,
          endLineNumber: unclosed.line,
          endColumn: unclosed.col + 1,
        });
      }

      const models = monaco.editor.getModels();
      if (models.length > 0) {
        const model = models[0];
        monaco.editor.setModelMarkers(model, 'skill-linter', markers);
        
        // Add Minimap Decorations for procedure/defun
        const decs: any[] = procBlocks.map(block => ({
          range: new monaco.Range(block.startLine, 1, block.endLine, 1),
          options: {
            isWholeLine: true,
            minimap: {
              color: '#4f46e540', // Indigo 600 with transparency
              position: monaco.editor.MinimapPosition.Inline
            },
            overviewRuler: {
              color: '#4f46e580',
              position: monaco.editor.OverviewRulerLane.Left
            },
            linesDecorationsClassName: 'block-boundary-decoration'
          }
        }));
        
        // Add Breakpoint Decorations
        const breakpointDecs: any[] = breakpoints.map(line => ({
          range: new monaco.Range(line, 1, line, 1),
          options: {
            isWholeLine: false,
            glyphMarginClassName: 'breakpoint-margin',
            glyphMarginHoverMessage: { value: 'Breakpoint' }
          }
        }));
        
        if (editorRef.current) {
           if (!editorRef.current.decorationIds) {
             editorRef.current.decorationIds = [];
           }
           if (!editorRef.current.breakpointDecorationIds) {
             editorRef.current.breakpointDecorationIds = [];
           }
           
           editorRef.current.decorationIds = editorRef.current.deltaDecorations(editorRef.current.decorationIds, decs);
           editorRef.current.breakpointDecorationIds = editorRef.current.deltaDecorations(editorRef.current.breakpointDecorationIds, breakpointDecs);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeout);
  }, [monaco, value, manualFns, activeFileName, breakpoints]);

  return (
    <div className="h-full w-full">
      <Editor
        path={activeFileName}
        height="100%"
        defaultLanguage="cadence-skill"
        theme="cadence-dark"
        value={value}
        onChange={onChange}
        onMount={(editor, m) => {
          editorRef.current = editor;
          
          // Intercept navigation for "Jump to Definition"
          const editorService = (editor as any)._codeEditorService;
          const openEditorBase = editorService.openCodeEditor.bind(editorService);
          editorService.openCodeEditor = async (input: any, source: any) => {
            const result = await openEditorBase(input, source);
            if (input.resource && onNavigate) {
              const filename = input.resource.path.split('/').pop() || '';
              const line = input.options?.selection?.startLineNumber;
              onNavigate(filename, line);
            }
            return result;
          };

          if (onMount) onMount(editor, m);

          // Handle gutter click for breakpoints
          editor.onMouseDown((e: any) => {
            if (e.target.type === 2) { // 2 is GLYPH_MARGIN
              const line = e.target.position.lineNumber;
              if (onBreakpointToggle) onBreakpointToggle(line);
            }
          });
        }}
        options={{
          minimap: { enabled: showMinimap },
          wordWrap: wordWrap ? 'on' : 'off',
          lineNumbers: 'on',
          glyphMargin: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          formatOnType: true,
          bracketPairColorization: { enabled: true },
          padding: { top: 20, bottom: 20 },
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: fontSize,
        }}
      />
    </div>
  );
};
