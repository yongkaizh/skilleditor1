const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const btnClassOld = 'inline-flex items-center gap-2 bg-white/5 border border-white/10 text-[#e2e8f0] px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-white/10 hover:-translate-y-px';
const btnClassNew = 'inline-flex items-center gap-2 text-slate-400 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:text-white hover:bg-white/5';

code = code.split(btnClassOld).join(btnClassNew);

const primaryBtnOld = 'inline-flex items-center gap-2 bg-[#2a2d36] text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all hover:bg-[#323640] hover:-translate-y-px';
const primaryBtnNew = 'inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-indigo-500/20 hover:text-indigo-300';
code = code.replace(primaryBtnOld, primaryBtnNew);

const secondaryBtnOld = 'inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-slate-700 hover:-translate-y-px';
const secondaryBtnNew = 'inline-flex items-center gap-2 text-slate-400 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:text-white hover:bg-white/5';
code = code.replace(secondaryBtnOld, secondaryBtnNew);

// Make the app container look slightly cleaner
// <div className="flex flex-col h-screen overflow-hidden bg-[#0b0c10] text-[#e2e8f0] font-sans">
// I'll keep it but ensure borders are more subtle
code = code.split('border-white/5').join('border-white/[0.04]');

fs.writeFileSync('src/App.tsx', code);
