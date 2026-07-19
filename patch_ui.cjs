const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove "by Yongkai Zhang" from the header
const headerTarget = `        <div className="flex items-center gap-4">
          <div className="font-semibold text-lg tracking-tight flex items-center gap-3 text-white">
            <Sparkles className="text-indigo-500" size={24} />
            Cadence SKILL Editor
          </div>
          <div className="text-xs font-medium text-[#94a3b8] bg-white/5 border border-white/10 px-2 py-1 rounded-md">
            by Yongkai Zhang
          </div>
        </div>`;
const headerReplacement = `        <div className="font-semibold text-lg tracking-tight flex items-center gap-3 text-white">
          <div className="bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-500/20">
            <Sparkles className="text-indigo-400" size={20} />
          </div>
          Cadence SKILL Editor
        </div>`;

code = code.replace(headerTarget, headerReplacement);

// If the target wasn't found perfectly, try a regex or simpler replace
if (!code.includes(headerReplacement)) {
  code = code.replace(/<div className="flex items-center gap-4">[\s\S]*?Cadence SKILL Editor[\s\S]*?by Yongkai Zhang[\s\S]*?<\/div>\s*<\/div>/, headerReplacement);
}

// 2. Adjust header styling to be more minimalist
code = code.replace('bg-[#12141a]/70 backdrop-blur-md border-b border-white/5', 'bg-[#0b0c10]/80 backdrop-blur-xl border-b border-white/[0.02]');

// 3. Add footer/status bar after </main>
const mainClosingTarget = `      </main>`;
const statusBar = `      </main>
      
      <footer className="h-8 shrink-0 bg-[#0b0c10] border-t border-white/5 flex items-center justify-between px-4 text-[11px] text-slate-500 font-medium z-20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            System Ready
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Sparkles size={12} className="text-indigo-500/70" />
            Designed & Developed by <span className="text-slate-300 font-semibold">Yongkai Zhang</span>
          </span>
        </div>
      </footer>`;
code = code.replace(mainClosingTarget, statusBar);

fs.writeFileSync('src/App.tsx', code);
