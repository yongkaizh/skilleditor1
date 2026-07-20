const fs = require('fs');
let code = fs.readFileSync('src/components/Console.tsx', 'utf8');

code = code.replace(/isExpertAnalyzing\?: boolean;/, 'line?: number;\n  col?: number;\n  isExpertAnalyzing?: boolean;');
code = code.replace(/onRefactor\?: \(\) => void;/, 'onRefactor?: () => void;\n  onJumpToError?: (line: number, col?: number) => void;');
code = code.replace(/onRefactor,/, 'onRefactor,\n  onJumpToError,');

const jumpButtonHtml = `
                      {msg.line !== undefined && onJumpToError && (
                        <button
                          onClick={() => onJumpToError(msg.line, msg.col)}
                          className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded text-[10px] font-bold transition-all"
                        >
                          Jump to Error {msg.line}{msg.col ? \`:\${msg.col}\` : ''}
                        </button>
                      )}
`;

code = code.replace(/\{msg\.quickFix && \(/, jumpButtonHtml + '\n                      {msg.quickFix && (');

fs.writeFileSync('src/components/Console.tsx', code);
