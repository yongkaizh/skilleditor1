const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const headerEndRegex = /<header[\s\S]*?<\/header>/;

const newHeader = `<header className="h-14 md:h-16 shrink-0 bg-[#0a0b0f] border-b border-white/[0.04] flex items-center justify-between px-3 md:px-6 z-40 relative">
        <div className="flex items-center gap-4 md:gap-8 shrink-0">
          <div className="font-semibold text-base tracking-tight flex items-center gap-2 md:gap-3 text-white">
            <div className="bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-500/20">
              <Sparkles className="text-indigo-400" size={18} />
            </div>
            <span className="hidden md:inline">Cadence SKILL IDE</span><span className="md:hidden">SKILL</span>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            <Tooltip content="Browse project files" position="bottom" delay={0.5} disabled={activeTab === "files"}>
              <button
                className={\`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all \${activeTab === "files" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}\`}
                onClick={() => setActiveTab(activeTab === "files" ? null : "files")}
              >
                <FolderOpen size={16} /> <span className="hidden lg:inline">Explorer</span>
                {activeTab === "files" && (
                  <motion.div layoutId="activeTabWedge" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="Interactive tutorials and lessons" position="bottom" delay={0.5} disabled={activeTab === "tour"}>
              <button
                className={\`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all \${activeTab === "tour" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}\`}
                onClick={() => setActiveTab(activeTab === "tour" ? null : "tour")}
              >
                <GraduationCap size={16} /> <span className="hidden lg:inline">Lessons</span>
                {activeTab === "tour" && (
                  <motion.div layoutId="activeTabWedge" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="Algorithmic EDA challenges" position="bottom" delay={0.5} disabled={activeTab === "challenges"}>
              <button
                className={\`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all \${activeTab === "challenges" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}\`}
                onClick={() => setActiveTab(activeTab === "challenges" ? null : "challenges")}
              >
                <Trophy size={16} /> <span className="hidden lg:inline">Challenges</span>
                {activeTab === "challenges" && (
                  <motion.div layoutId="activeTabWedge" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            </Tooltip>

            <div className="w-[1px] h-5 bg-white/10 mx-1 hidden md:block" />

            <Tooltip content="Load SKILL recipe templates" position="bottom" delay={0.5} disabled={activeTab === "templates"}>
              <button
                className={\`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all \${activeTab === "templates" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}\`}
                onClick={() => setActiveTab(activeTab === "templates" ? null : "templates")}
              >
                <LayoutTemplate size={16} /> <span className="hidden xl:inline">Templates</span>
                {activeTab === "templates" && (
                  <motion.div layoutId="activeTabWedge" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="SKILL syntax cheatsheet" position="bottom" delay={0.5} disabled={activeTab === "cheatsheet"}>
              <button
                className={\`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all \${activeTab === "cheatsheet" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}\`}
                onClick={() => setActiveTab(activeTab === "cheatsheet" ? null : "cheatsheet")}
              >
                <Book size={16} /> <span className="hidden xl:inline">Cheatsheet</span>
                {activeTab === "cheatsheet" && (
                  <motion.div layoutId="activeTabWedge" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="Search 780+ Cadence API functions" position="bottom" delay={0.5} disabled={activeTab === "documentation"}>
              <button
                className={\`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all \${activeTab === "documentation" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}\`}
                onClick={() => setActiveTab(activeTab === "documentation" ? null : "documentation")}
              >
                <Search size={16} /> <span className="hidden xl:inline">API Finder</span>
                {activeTab === "documentation" && (
                  <motion.div layoutId="activeTabWedge" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex gap-1 md:gap-2 items-center overflow-x-auto no-scrollbar mask-linear-fade">
          <Tooltip content={autoSaveEnabled ? "Auto-save active" : "Auto-save disabled"} position="bottom">
            <button 
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={\`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors \${autoSaveEnabled ? 'text-indigo-400 hover:bg-indigo-400/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}\`}
            >
              {autoSaveEnabled ? <Save size={16} /> : <SaveOff size={16} />}
              <div className="w-16 hidden md:flex items-center justify-start text-[11px]">
                {saveStatus === 'saving' && <span className="animate-pulse flex items-center gap-1.5"><Cloud size={12}/> Saving</span>}
                {saveStatus === 'saved' && <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={12}/> Saved</span>}
                {saveStatus === 'idle' && <span>Auto-save</span>}
              </div>
            </button>
          </Tooltip>

          <div className="w-[1px] h-5 bg-white/10 mx-1 hidden sm:block" />

          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <FileArchive size={16} className="text-amber-400" />
            <span className="hidden md:inline">Export</span>
          </button>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isCopied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} className="text-emerald-400" />}
            <span className="hidden md:inline">{isCopied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </header>`;

content = content.replace(headerEndRegex, newHeader);
fs.writeFileSync('src/App.tsx', content);
