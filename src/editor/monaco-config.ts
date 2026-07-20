import { projectState } from "./projectState";
import type { Monaco } from '@monaco-editor/react';
import type { SkillFunction } from './manualParser';

const SKILL_KEYWORDS = [
  'procedure', 'defun', 'let', 'prog', 'if', 'then', 'else', 'case', 'cond',
  'foreach', 'for', 'while', 'return', 'setq', 't', 'nil', 'in', 'go', 'printf', 'fprintf', 'sprintf',
  'define', 'lambda'
];

function extractLocalProcedures(text: string): { name: string, args: string }[] {
  const procs: { name: string, args: string }[] = [];
  const defRegex = /\b(?:procedure|defun)\s*\(\s*([a-zA-Z_]\w*)\s*\((.*?)\)/g;
  let match;
  while ((match = defRegex.exec(text)) !== null) {
    procs.push({ name: match[1], args: match[2] });
  }
  return procs;
}

function extractLocalVariables(text: string): string[] {
  const vars = new Set<string>();
  const regex = /\b(let|prog)\s*\(\s*\(/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const startIdx = regex.lastIndex;
    let depth = 1;
    let endIdx = startIdx;
    while (endIdx < text.length && depth > 0) {
      const char = text[endIdx];
      if (char === '(') depth++;
      else if (char === ')') depth--;
      endIdx++;
    }
    if (depth === 0) {
      const varListStr = text.substring(startIdx, endIdx - 1);
      let i = 0;
      while (i < varListStr.length) {
        while (i < varListStr.length && /\s/.test(varListStr[i])) i++;
        if (i >= varListStr.length) break;

        if (varListStr[i] === '(') {
          i++;
          while (i < varListStr.length && /\s/.test(varListStr[i])) i++;
          const wordMatch = varListStr.substring(i).match(/^([a-zA-Z_]\w*)/);
          if (wordMatch) {
            vars.add(wordMatch[1]);
            i += wordMatch[1].length;
          }
          let pDepth = 1;
          while (i < varListStr.length && pDepth > 0) {
            if (varListStr[i] === '(') pDepth++;
            else if (varListStr[i] === ')') pDepth--;
            i++;
          }
        } else {
          const wordMatch = varListStr.substring(i).match(/^([a-zA-Z_]\w*)/);
          if (wordMatch) {
            vars.add(wordMatch[1]);
            i += wordMatch[1].length;
          } else {
            i++;
          }
        }
      }
    }
  }

  // Extract parameters from procedure/defun definitions:
  const procRegex = /\b(?:procedure|defun)\s*\(\s*[a-zA-Z_]\w*\s*\(([^)]*)\)/g;
  while ((match = procRegex.exec(text)) !== null) {
    const paramsStr = match[1];
    const paramWords = paramsStr.match(/\b[a-zA-Z_]\w*\b/g);
    if (paramWords) {
      for (const p of paramWords) {
        vars.add(p);
      }
    }
  }

  // Extract foreach variables:
  const foreachRegex = /\bforeach\s*\(\s*([a-zA-Z_]\w*)/g;
  while ((match = foreachRegex.exec(text)) !== null) {
    vars.add(match[1]);
  }

  const excluded = new Set(['t', 'nil', 'let', 'prog', 'procedure', 'defun', 'foreach', 'if', 'then', 'else']);
  return Array.from(vars).filter(v => !excluded.has(v));
}

let globalManualFunctions: SkillFunction[] = [];

export function configureMonaco(monaco: Monaco, manualFunctions: SkillFunction[] = []) {
  globalManualFunctions = manualFunctions;

  // Define custom theme
  monaco.editor.defineTheme('cadence-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' }, // indigo-400
      { token: 'identifier', foreground: 'e2e8f0' }, // slate-200
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' }, // slate-500
      { token: 'string', foreground: '34d399' }, // emerald-400
      { token: 'string.symbol', foreground: 'fbbf24' }, // amber-400
      { token: 'number', foreground: 'f87171' }, // red-400
      { token: 'operator', foreground: '94a3b8' }, // slate-400
      { token: 'brackets', foreground: '94a3b8' },
    ],
    colors: {
      'editor.background': '#0b0c10',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#1e293b44',
      'editorCursor.foreground': '#818cf8',
      'editorWhitespace.foreground': '#334155',
      'editor.selectionBackground': '#818cf833',
      'editorWidget.background': '#0f172a',
      'editorWidget.border': '#1e293b',
      'editorSuggestWidget.background': '#0f172a',
      'editorSuggestWidget.border': '#1e293b',
      'editorSuggestWidget.selectedBackground': '#1e293b',
      'editorSuggestWidget.highlightForeground': '#818cf8',
    }
  });

  // Check if language is already registered
  const isRegistered = monaco.languages.getLanguages().some((l: any) => l.id === 'cadence-skill');
  
  if (isRegistered) {
    return;
  }

  // Register custom language
  monaco.languages.register({ id: 'cadence-skill' });

  // Register folding range provider
  monaco.languages.registerFoldingRangeProvider('cadence-skill', {
    provideFoldingRanges: (model: any) => {
      const lines = model.getLinesContent();
      const ranges = [];
      const stack = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Start of a block (procedure, let, foreach, etc.)
        if (line.match(/^\s*\(\s*(procedure|let|foreach|while|prog|if|when|unless|case|cond|defun|define)\b/i)) {
          stack.push(i);
        }
        
        // Count closing parentheses on lines that are primarily closing parens
        const closingMatch = line.match(/^\s*(\)+)\s*(;.*)?$/);
        if (closingMatch && stack.length > 0) {
          const count = closingMatch[1].length;
          // For each closing paren, we might be closing a block
          for (let c = 0; c < count; c++) {
            const startLine = stack.pop();
            if (startLine !== undefined && i > startLine) {
              ranges.push({
                start: startLine + 1,
                end: i + 1,
                kind: monaco.languages.FoldingRangeKind.Region
              });
            }
          }
        }
      }
      return ranges;
    }
  });

  // Register Definition Provider for Jump to Definition
  monaco.languages.registerDefinitionProvider('cadence-skill', {
    provideDefinition: (model: any, position: any) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      // Search in project state for function definition
      const fn = projectState.functions.find(f => f.name === word.word);
      if (!fn) return null;

      // Return the location of the definition
      return {
        uri: monaco.Uri.parse(`file:///${fn.fileName}`),
        range: {
          startLineNumber: fn.line,
          startColumn: 1,
          endLineNumber: fn.line,
          endColumn: 1,
        },
      };
    },
  });

  // Define Monarch token provider for syntax highlighting
  monaco.languages.setMonarchTokensProvider('cadence-skill', {
    defaultToken: '',
    tokenPostfix: '.skill',

    keywords: SKILL_KEYWORDS,

    operators: [
      '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
      '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
      '<<', '>>', '=>'
    ],

    symbols:  /[=><!~?:&|+\-*/^%]+/,

    escapes: /\\\\(?:[abfnrtv\\\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    tokenizer: {
      root: [
        // identifiers and keywords
        [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],

        // whitespace
        { include: '@whitespace' },

        // delimiters and operators
        [/[{}()[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],

        // numbers
        [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/\d+/, 'number'],

        // strings
        [/"([^"\\\\]|\\\\.)*$/, 'string.invalid' ],  // non-teminated string
        [/"/,  { token: 'string.quote', bracket: '@open', next: '@string' } ],

        // keywords starting with ? (e.g., ?name)
        [/\?[a-zA-Z_]\w*/, 'keyword'],
        // quoted symbols (e.g., 'symbol)
        [/'[a-zA-Z_]\w*/, 'string.symbol'],
        // characters
        [/'[^\\\\']'/, 'string'],
        [/(')(@escapes)(')/, ['string','string.escape','string']],
        [/'/, 'string.invalid']
      ],

      comment: [
        [/[^\\/*]+/, 'comment' ],
        [/\/\*/,    'comment', '@push' ],    // nested comment
        ["\\*/",    'comment', '@pop'  ],
        [/[\\/*]/,   'comment' ]
      ],

      string: [
        [/[^\\\\"]+/,  'string'],
        [/@escapes/, 'string.escape'],
        [/\\\\./,      'string.escape.invalid'],
        [/"/,        { token: 'string.quote', bracket: '@close', next: '@pop' } ]
      ],

      whitespace: [
        [/[ \\t\\r\\n]+/, 'white'],
        [/\/\*/,       'comment', '@push' ],
        [/;.*$/,      'comment'], // SKILL line comment
      ],
    },
  });

  // Language configuration (brackets, auto-closing pairs)
  monaco.languages.setLanguageConfiguration('cadence-skill', {
    comments: {
      lineComment: ';',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ]
  });

  // Register custom completion provider
  monaco.languages.registerCompletionItemProvider('cadence-skill', {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const text = model.getValue();

      // 1. Static Snippets & Keywords
      const keywordSuggestions = SKILL_KEYWORDS.map(k => ({
        label: k,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: k,
        range,
        detail: 'SKILL Keyword',
        sortText: 'c_' + k
      }));

      const snippetSuggestions = [
        {
          label: 'procedure',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'procedure( ${1:myFunction}(${2:args})',
            '    let( (${3:local_vars})',
            '        ${4:; body}',
            '    )',
            ')'
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'SKILL Procedure Template',
          sortText: 'b_procedure',
          range
        },
        {
          label: 'let',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'let( (${1:vars})',
            '    ${2:; body}',
            ')'
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Local variable binding',
          detail: 'SKILL Let Block',
          sortText: 'b_let',
          range
        },
        // ... adding more essential snippets directly
        {
          label: 'foreach',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'foreach( ${1:element} ${2:list}',
            '    ${3:; body}',
            ')'
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Iterate over a list',
          detail: 'SKILL Loop',
          sortText: 'b_foreach',
          range
        }
      ];

      // 2. Local Functions (Procedures/Defuns in current file)
      const localProcs = extractLocalProcedures(text);
      const localProcSuggestions = localProcs.map(p => ({
        label: p.name,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: `${p.name}(\${1:${p.args || ''}})`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: `**procedure ${p.name}(${p.args})**\n\nLocal procedure defined in this file.`
        },
        detail: 'Local Procedure',
        sortText: 'a_' + p.name, // Highest priority
        range
      }));

      // 3. Local Variables
      const localVars = extractLocalVariables(text);
      const varSuggestions = localVars.map((varName: string) => ({
        label: varName,
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: varName,
        detail: 'Local Variable',
        sortText: 'a_' + varName,
        range
      }));

      // 4. Standard Cadence API (from manual.txt)
      const dynamicSuggestions = globalManualFunctions.map((fn: any) => {
        const argsMatch = fn.usage.match(/\((.*?)\)/);
        let insertSnippet = fn.name + '()';
        if (argsMatch && argsMatch[1].trim() !== '') {
          // Create placeholder arguments: dbOpenCellViewByType(${1:cvId})
          let cleanedArgs = argsMatch[1].trim().replace(/\[/g, '').replace(/\]/g, '').replace(/\.\.\./g, 'rest');
          const args = cleanedArgs.split(/\s+/).filter((a: string) => a !== '').map((arg: string, i: number) => `\${${i+1}:${arg}}`).join(' ');
          insertSnippet = `${fn.name}(${args})`;
        }

        return {
          label: fn.name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: insertSnippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: {
            value: [
              '```cadence-skill',
              fn.usage,
              '```',
              '---',
              fn.description || 'No description available.',
              ...(fn.example ? ['', '**Example:**', '```cadence-skill', fn.example, '```'] : [])
            ].join('\n')
          },
          detail: `Cadence API (${fn.category})`,
          sortText: 'd_' + fn.name,
          range
        };
      });

      // 5. Project-wide Functions (from other files)
      const currentFileName = model.uri.path.split('/').pop() || '';
      const projectSuggestions = projectState.functions.filter((f: any) => f.fileName !== currentFileName).map(fn => {
        let additionalTextEdits = [];
        const loadRegex = new RegExp(`load\\s*\\(\\s*"${fn.fileName}"\\s*\\)`);
        if (!loadRegex.test(text)) {
          additionalTextEdits.push({
            range: new monaco.Range(1, 1, 1, 1),
            text: `load("${fn.fileName}")\n`
          });
        }

        return {
          label: fn.name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${fn.name}(\${1:${fn.args.trim() ? '' : ''}})`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          additionalTextEdits,
          documentation: {
            value: [
              '```cadence-skill',
              `procedure ${fn.name}(${fn.args})`,
              '```',
              '---',
              `Defined in ${fn.fileName}`
            ].join('\n')
          },
          detail: `Project Function (${fn.fileName})`,
          sortText: 'e_' + fn.name,
          range
        };
      });

      return { 
        suggestions: [
          ...keywordSuggestions, 
          ...snippetSuggestions, 
          ...localProcSuggestions, 
          ...varSuggestions, 
          ...dynamicSuggestions,
          ...projectSuggestions
        ] 
      };
    }
  });

  // Register hover provider
  monaco.languages.registerHoverProvider('cadence-skill', {
    provideHover: (model: any, position: any) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const fn = globalManualFunctions.find(f => f.name === word.word);
      if (!fn) return null;

      return {
        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
        contents: [
          { value: `**${fn.name}**` },
          { value: '```cadence-skill\n' + fn.usage + '\n```' },
          { value: fn.description },
          ...(fn.example ? [{ value: '**Example:**\n```cadence-skill\n' + fn.example + '\n```' }] : [])
        ]
      };
    }
  });

  // Register Code Action Provider (Quick Fixes)
  monaco.languages.registerCodeActionProvider('cadence-skill', {
    provideCodeActions: (model: any, _range: any, context: any) => {
      const actions: any[] = [];
      for (const marker of context.markers) {
        if (marker.message.includes('Missing load statement')) {
          const match = marker.message.match(/load\("([^"]+)"\)/);
          if (match && match[1]) {
            const fileName = match[1];
            actions.push({
              title: `Add load("${fileName}")`,
              diagnostics: [marker],
              kind: "quickfix",
              edit: {
                edits: [
                  {
                    resource: model.uri,
                    textEdit: {
                      range: {
                        startLineNumber: 1,
                        startColumn: 1,
                        endLineNumber: 1,
                        endColumn: 1
                      },
                      text: `load("${fileName}")\n`
                    }
                  }
                ]
              },
              isPreferred: true
            });
          }
        }
        
        if (marker.message.includes('Did you mean')) {
          const match = marker.message.match(/Did you mean '([^']+)'/);
          if (match && match[1]) {
            const suggestion = match[1];
            actions.push({
              title: `Change to '${suggestion}'`,
              diagnostics: [marker],
              kind: "quickfix",
              edit: {
                edits: [
                  {
                    resource: model.uri,
                    textEdit: {
                      range: {
                        startLineNumber: marker.startLineNumber,
                        startColumn: marker.startColumn,
                        endLineNumber: marker.endLineNumber,
                        endColumn: marker.endColumn
                      },
                      text: suggestion
                    }
                  }
                ]
              },
              isPreferred: true
            });
          }
        }
      }
      return {
        actions: actions,
        dispose: () => {}
      };
    }
  });

  // Register Code Formatter
  monaco.languages.registerDocumentFormattingEditProvider('cadence-skill', {
    provideDocumentFormattingEdits: (model: any, options: any, _token: any) => {
      const text = model.getValue();
      const lines = text.split('\n');
      const edits = [];
      
      let indentLevel = 0;
      let inBlockComment = false;
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trim();
        
        // Block comment logic (simplified for formatter)
        if (trimmed.startsWith('/*')) inBlockComment = true;
        
        if (!inBlockComment && trimmed.length > 0) {
          // Adjust indent for closing parenthesis at the start of the line
          let lineIndent = indentLevel;
          if (trimmed.startsWith(')')) {
            lineIndent = Math.max(0, indentLevel - 1);
          }
          else if (trimmed.startsWith('}')) {
             lineIndent = Math.max(0, indentLevel - 1);
          }
          
          const indentStr = ' '.repeat(lineIndent * options.tabSize);
          const formattedLine = indentStr + trimmed;
          
          if (formattedLine !== line) {
            edits.push({
              range: new monaco.Range(i + 1, 1, i + 1, line.length + 1),
              text: formattedLine
            });
          }
        }
        
        if (trimmed.endsWith('*/')) inBlockComment = false;
        
        if (!inBlockComment) {
          // Calculate next line indent
          let openParens = (trimmed.match(/\(/g) || []).length;
          let closeParens = (trimmed.match(/\)/g) || []).length;
          let openBraces = (trimmed.match(/\{/g) || []).length;
          let closeBraces = (trimmed.match(/\}/g) || []).length;
          
          indentLevel += (openParens - closeParens) + (openBraces - closeBraces);
          if (indentLevel < 0) indentLevel = 0;
        }
      }
      return edits;
    }
  });
}