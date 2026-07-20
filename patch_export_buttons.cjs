const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add FileDown to imports
code = code.replace(/FileArchive,/, 'FileArchive,\n  FileDown,');

// Replace the export menu div with two buttons
const oldExportMenuRegex = /<div className="relative">[\s\S]*?<\/AnimatePresence>\n\s*<\/div>/;

const newButtons = `<button 
            onClick={handleDownloadCurrent}
            title="Export Current File"
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <FileDown size={16} className="text-amber-400" />
            <span className="hidden md:inline">Export File</span>
          </button>
          <button 
            onClick={handleDownloadProject}
            title="Export Entire Project as ZIP"
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <FileArchive size={16} className="text-amber-400" />
            <span className="hidden md:inline">Export Project</span>
          </button>`;

code = code.replace(oldExportMenuRegex, newButtons);

fs.writeFileSync('src/App.tsx', code);
