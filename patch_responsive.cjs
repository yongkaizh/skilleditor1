const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Header responsiveness
code = code.replace(
  '<header className="h-16 flex items-center justify-between px-6 bg-[#0b0c10]/80 backdrop-blur-xl border-b border-white/[0.02] z-10">',
  '<header className="h-16 flex items-center justify-between px-4 md:px-6 bg-[#0b0c10]/80 backdrop-blur-xl border-b border-white/[0.02] z-30 relative">'
);

// Title hidden on very small screens, or at least smaller text
code = code.replace(
  '<div className="font-semibold text-lg tracking-tight flex items-center gap-3 text-white">',
  '<div className="font-semibold text-base md:text-lg tracking-tight flex items-center gap-2 md:gap-3 text-white shrink-0">'
);
code = code.replace(
  'Cadence SKILL Editor',
  '<span className="hidden sm:inline">Cadence SKILL Editor</span><span className="sm:hidden">SKILL Editor</span>'
);

// Flex container for buttons - allow horizontal scroll on mobile
code = code.replace(
  '<div className="flex gap-3 items-center">',
  '<div className="flex gap-2 md:gap-3 items-center overflow-x-auto no-scrollbar mask-linear-fade">'
);

// Button text hidden on mobile
code = code.replace('<FolderOpen size={16} /> Files', '<FolderOpen size={16} /> <span className="hidden lg:inline">Files</span>');
code = code.replace('<GraduationCap size={16} /> Tour', '<GraduationCap size={16} /> <span className="hidden lg:inline">Tour</span>');
code = code.replace('<LayoutTemplate size={16} /> Templates', '<LayoutTemplate size={16} /> <span className="hidden lg:inline">Templates</span>');
code = code.replace('<Book size={16} /> Cheatsheet', '<Book size={16} /> <span className="hidden lg:inline">Cheatsheet</span>');
code = code.replace('<Cloud size={16} />\\n            Sync GitHub', '<Cloud size={16} /> <span className="hidden lg:inline">Sync GitHub</span>');
code = code.replace('<Cloud size={16} />\n            Sync GitHub', '<Cloud size={16} /> <span className="hidden lg:inline">Sync GitHub</span>'); // cover exact match

// Change aside to be absolute on mobile, relative on desktop
code = code.replace(
  '<aside className="w-64 bg-[#0b0c10] border-r border-white/[0.04] flex flex-col h-full shrink-0">',
  '<aside className="absolute md:relative z-20 w-64 md:w-64 bg-[#0b0c10] border-r border-white/[0.04] flex flex-col h-full shrink-0 shadow-2xl md:shadow-none transition-transform">'
);

// Update main area wrapper
code = code.replace(
  '<main className="flex flex-1 overflow-hidden">',
  '<main className="flex flex-1 overflow-hidden relative">'
);

fs.writeFileSync('src/App.tsx', code);
