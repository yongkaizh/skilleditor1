import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

start_str = '<main className="flex flex-1 overflow-hidden relative">'
end_str = '</main>'

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

new_main = """<main className="flex flex-1 overflow-hidden relative">
        <AnimatePresence initial={false}>
          {activeTab && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "min(400px, 100vw)", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="absolute md:relative z-30 h-full bg-[#0b0c10] flex flex-col shrink-0 shadow-2xl md:shadow-none overflow-hidden border-r border-white/[0.04]"
            >
              <div className="w-[100vw] md:w-[400px] h-full flex flex-col relative">
                {activeTab === "files" && (
                  <div className="flex flex-col h-full overflow-hidden">
                    <FileExplorer 
                      files={files} 
                      activeFileId={activeFileId} 
                      onFileSelect={handleFileSelect} 
                      onFilesChange={setFiles} 
                    />
                    <FunctionNavigator onFunctionClick={handleFunctionJump} />
                  </div>
                )}
                {activeTab === "search" && (
                  <SearchSidebar files={files} onResultClick={handleSearchResultClick} onClose={() => setActiveTab(null)} />
                )}
                {activeTab === "tour" && (
                  <TutorialSidebar isActive={true} isInline={true} currentText={content} onClose={() => setActiveTab(null)} onInsertCode={(code) => { setContent(code); if (editorRef.current) editorRef.current.setValue(code); showToast("Loaded lesson blueprint into editor!"); }} />
                )}
                {activeTab === "templates" && (
                  <TemplateGallery isOpen={true} isInline={true} onClose={() => setActiveTab(null)} onSelect={handleSelectTemplate} />
                )}
                {activeTab === "cheatsheet" && (
                  <CheatsheetDrawer isOpen={true} isInline={true} onClose={() => setActiveTab(null)} onInsert={handleInsertSnippet} manualFns={manualFns} />
                )}
                {activeTab === "documentation" && (
                  <DocumentationPortal isOpen={true} isInline={true} onClose={() => setActiveTab(null)} manualFns={manualFns} onInsert={handleInsertSnippet} searchQuery={documentationSearchQuery} setSearchQuery={setDocumentationSearchQuery} />
                )}
                {activeTab === "challenges" && (
                  <ChallengeHub onClose={() => setActiveTab(null)} onSelectChallenge={(c, isSol) => { handleSelectChallenge(c, isSol); setActiveTab(null); }} />
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        
        <div className="flex-1 flex flex-col min-w-0">
          <section className="flex-1 flex flex-col overflow-hidden bg-[#12141a]">
            <EditorTabs files={files} openFileIds={openFileIds} activeFileId={activeFileId} onTabSelect={handleFileSelect} onTabClose={handleTabClose} />
            <div className="px-6 py-3 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider bg-[#0b0c10] border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <EditorBreadcrumbs activeFile={activeFile} files={files} onFileSelect={handleFileSelect} />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsConsoleOpen(!isConsoleOpen)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all ${isConsoleOpen ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white'}`}>
                  <MessageSquare size={14} />
                  <span className="hidden sm:inline">Console</span>
                </button>
                <button onClick={() => handleRun(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 transition-all text-[11px] font-bold tracking-wider uppercase">
                  <Bug size={14} />
                  <span className="hidden sm:inline">Debug</span>
                </button>
                <button id="run-skill-btn" onClick={() => handleRun(false)} disabled={isSimulating} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all text-[11px] font-bold tracking-wider uppercase shadow-lg ${isSimulating ? 'bg-indigo-500/50 text-white/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 hover:shadow-indigo-500/40'}`}>
                  {isSimulating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  <span className="hidden sm:inline">{isSimulating ? "Running..." : "Run SKILL"}</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto relative">
              <EditorPane activeFileName={activeFile.name} value={content} onChange={handleEditorChange} onMount={handleEditorMount} showMinimap={showMinimap} wordWrap={wordWrap} fontSize={fontSize} manualFns={manualFns} breakpoints={Array.from(breakpoints.get(activeFile.name) || [])} onBreakpointToggle={handleBreakpointToggle} onNavigate={handleNavigate} />
            </div>
          </section>

          {isConsoleOpen && (
            <div className="h-64 flex flex-col min-w-0 border-t border-white/[0.04]">
              <Console messages={consoleOutput} onClear={() => setConsoleOutput([])} onClose={() => setIsConsoleOpen(false)} onApplyQuickFix={handleApplyQuickFix} onCommand={handleConsoleCommand} onExpertAnalyze={handleExpertAnalyze} onRefactor={handleRefactorCode} isSimulating={isSimulating} />
            </div>
          )}
        </div>
      </main>"""

content = content[:start_idx] + new_main + content[end_idx:]

with open('src/App.tsx', 'w') as f:
    f.write(content)

