import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderOpen,
  FileArchive,
  FileDown,
  Copy,
  Undo2,
  Redo2,
  Sparkles,
  Book,
  LayoutTemplate,
  GraduationCap,
  CheckCircle2,
  Loader2,
  Search,
  Play,
  Trophy,
  MessageSquare,
  Cloud,
  Save,
  SaveOff,
  Bug,
  Settings,
  ListTree,
  Keyboard,
} from "lucide-react";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { EditorPane } from "./components/EditorPane";
import { FileExplorer } from "./components/FileExplorer";
import { EditorBreadcrumbs } from "./components/EditorBreadcrumbs";
import { EditorTabs } from "./components/EditorTabs";
import { SearchSidebar } from "./components/SearchSidebar";
import { CodeOutlineSidebar } from "./components/CodeOutlineSidebar";
import { GitHubSyncModal } from "./components/GitHubSyncModal";
import { SettingsModal } from "./components/SettingsModal";
import { ShortcutsModal } from "./components/ShortcutsModal";
import { Console, type ConsoleMessage } from "./components/Console";
import { OnboardingTour } from "./components/OnboardingTour";
import { Tooltip } from "./components/Tooltip";

import { FunctionNavigator } from "./components/FunctionNavigator";
import { CheatsheetDrawer } from "./components/CheatsheetDrawer";
import { DocumentationPortal } from "./components/DocumentationPortal";
import { TemplateGallery } from "./components/TemplateGallery";
import { TutorialSidebar } from "./components/TutorialSidebar";
import { Debugger } from "./components/Debugger";
import { ChallengeHub } from "./components/ChallengeHub";
import { challenges } from "./data/challenges";
import { projectState } from "./editor/projectState";
import { parseManual } from "./editor/manualParser";
import { skillInterpreter } from "./editor/skillInterpreter";
import { refactorSkillCode, type RefactorResult } from "./editor/refactorEngine";
import { RefactorDiffView } from "./components/RefactorDiffView";
import manualRawText from "./data/manual.txt?raw";

const DEFAULT_SKILL = ``;

function App() {
  
  const [files, setFiles] = useState<{id: string, name: string, content: string}[]>([
    { id: '1', name: 'skill_script_1.il', content: DEFAULT_SKILL }
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('1');
  const [openFileIds, setOpenFileIds] = useState<string[]>(['1']);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"files" | "search" | "tour" | "scenarios" | "challenges" | "templates" | "cheatsheet" | "documentation" | "outline" | null>("files");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("cadence-workspace-auto-save");
    return saved === null ? true : saved === "true";
  });
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(256);
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleMessage[]>([]);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileSelect = (id: string) => {
    setActiveFileId(id);
    setOpenFileIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const handleTabClose = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFileIds(prev => {
      const newIds = prev.filter(tabId => tabId !== id);
      if (newIds.length === 0) {
        return prev; // keep at least one tab open, or handle empty state. For now just prevent closing last tab.
      }
      if (id === activeFileId) {
        // Find previous tab index
        const index = prev.indexOf(id);
        const nextId = newIds[index] || newIds[index - 1] || newIds[0];
        setActiveFileId(nextId);
      }
      return newIds;
    });
  };

  useEffect(() => {
    projectState.update(files);
    

    const timeout = setTimeout(() => {
      let changed = false;
      setFiles(currentFiles => {
        const newFiles = currentFiles.map(file => {
          let contentChanged = false;
          let newContent = file.content;
          
          let cleanContent = newContent.replace(/;.*$/gm, '').replace(/"(?:\\.|[^"\\])*"/g, '');
          const calledFuncs = new Set<string>();
          const callRegex = /\b([a-zA-Z_]\w*)\s*\(/g;
          let match;
          while ((match = callRegex.exec(cleanContent)) !== null) {
            calledFuncs.add(match[1]);
          }

          projectState.functions.forEach(fn => {
            if (fn.fileName !== file.name && calledFuncs.has(fn.name)) {
              const loadRegex = new RegExp(`load\\s*\\(\\s*"${fn.fileName}"\\s*\\)`);
              if (!loadRegex.test(newContent)) {
                newContent = `load("${fn.fileName}")\n` + newContent;
                contentChanged = true;
                changed = true;
              }
            }
          });
          
          return contentChanged ? { ...file, content: newContent } : file;
        });

        return changed ? newFiles : currentFiles;
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [files]);
  
  const [documentationSearchQuery, setDocumentationSearchQuery] = useState("");

  const errorDecorsRef = useRef<string[]>([]);
  const handleNavigate = (fileName: string, line?: number, col?: number) => {
    const file = files.find(f => f.name === fileName);
    if (file) {
      handleFileSelect(file.id);
      if (line !== undefined && editorRef.current) {
        setTimeout(() => {
          editorRef.current.revealLineInCenter(line);
          editorRef.current.setPosition({ lineNumber: line, column: col || 1 });
          
          if (monacoRef.current) {
            const decors = editorRef.current.deltaDecorations(errorDecorsRef.current, [
              {
                range: new monacoRef.current.Range(line, col || 1, line, (col || 1) + 1),
                options: {
                  className: 'error-highlight',
                  isWholeLine: !col,
                  linesDecorationsClassName: 'error-line-highlight'
                }
              }
            ]);
            errorDecorsRef.current = decors;
          }
          
          editorRef.current.focus();
        }, 100);
      }
    }
  };

  const activeFile = files.find(f => f.id === activeFileId) || files[0] || { id: 'fallback', name: 'fallback', content: '' };
  const content = activeFile.content;

  const setContent = (newContent: string | ((prev: string) => string)) => {
    setFiles(prevFiles => prevFiles.map(f => {
      if (f.id === activeFileId) {
        return { ...f, content: typeof newContent === 'function' ? newContent(f.content) : newContent };
      }
      return f;
    }));
  };

  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem("cadence-workspace-auto-save", autoSaveEnabled.toString());
    if (autoSaveEnabled) {
      const timeoutId = setTimeout(() => {
        set("cadence-workspace-files", files).catch(console.error);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [autoSaveEnabled, files]);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // 1. Close active panel or find/replace widget on Escape
      if (e.key === 'Escape') {
        if (isFindWidgetVisible()) {
          dismissFindWidget();
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        let closedSomething = false;
        if (activeTab && activeTab !== 'files') {
          setActiveTab(null);
          closedSomething = true;
        }
        if (isConsoleOpen) {
          setIsConsoleOpen(false);
          closedSomething = true;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          closedSomething = true;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          closedSomething = true;
        }
        if (isGitHubModalOpen) {
          setIsGitHubModalOpen(false);
          closedSomething = true;
        }
        if (isTourOpen) {
          setIsTourOpen(false);
          closedSomething = true;
        }
        
        if (editorRef.current) {
          editorRef.current.focus();
        }
        
        if (closedSomething) {
          e.preventDefault();
        }
      }

      // 2. Save on Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (!autoSaveEnabled) {
          set("cadence-workspace-files", files).catch(console.error);
          setSaveStatus("saving");
          setTimeout(() => setSaveStatus("saved"), 300);
          setTimeout(() => setSaveStatus("idle"), 2300);
          showToast("Project saved manually");
        } else {
          showToast("Auto-save is enabled");
        }
      }

      // 3. Toggle Files Sidebar on Ctrl+B / Cmd+B
      if ((e.ctrlKey || e.metaKey) && key === 'b') {
        e.preventDefault();
        setActiveTab(prev => prev === 'files' ? null : 'files');
      }

      // 4. Toggle Global Search Sidebar on Ctrl+Shift+H
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'h') {
        e.preventDefault();
        setActiveTab(prev => prev === 'search' ? null : 'search');
      }

      // 5. Toggle diagnostic Console on Ctrl+` (backtick)
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setIsConsoleOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoSaveEnabled, files, activeTab, isConsoleOpen, isSettingsOpen, isShortcutsOpen, isGitHubModalOpen, isTourOpen]);
  const [manualFns, setManualFns] = useState<any[]>([]);

  useEffect(() => {
    const parsed = parseManual(manualRawText);
    setManualFns(parsed);
  }, []);

  const [showMinimap, setShowMinimap] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("cadence-workspace-gemini-key") || "");
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem("cadence-ai-provider") || "gemini");

  useEffect(() => {
    localStorage.setItem("cadence-workspace-gemini-key", apiKey);
  }, [apiKey]);
  useEffect(() => {
    localStorage.setItem("cadence-ai-provider", aiProvider);
  }, [aiProvider]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [proposedRefactor, setProposedRefactor] = useState<RefactorResult | null>(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('skill_editor_tour_seen');
    if (!hasSeenTour) {
      setIsTourOpen(true);
      localStorage.setItem('skill_editor_tour_seen', 'true');
    }
  }, []);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const saveTimeout = useRef<any>(null);
  const savedTimeout = useRef<any>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const isFindWidgetVisible = () => {
    if (editorRef.current) {
      try {
        const domNode = editorRef.current.getDomNode();
        if (domNode) {
          const widget = domNode.querySelector('.find-widget');
          if (widget) {
            return widget.classList.contains('visible');
          }
        }
      } catch {}
    }
    return false;
  };

  const dismissFindWidget = () => {
    if (editorRef.current) {
      try {
        const action = editorRef.current.getAction('closeFindWidget');
        if (action) {
          action.run();
        } else {
          editorRef.current.trigger('keyboard', 'closeFindWidget', null);
        }
      } catch {
        try {
          editorRef.current.trigger('keyboard', 'closeFindWidget', null);
        } catch {}
      }
      try {
        const findContrib = editorRef.current.getContribution('editor.contrib.findController');
        if (findContrib && typeof findContrib.closeFindWidget === 'function') {
          findContrib.closeFindWidget();
        }
      } catch {}
    }
  };

  const stateRef = useRef({
    activeTab,
    isConsoleOpen,
    isSettingsOpen,
    isShortcutsOpen,
    isGitHubModalOpen,
    isTourOpen,
    autoSaveEnabled,
    files,
  });

  useEffect(() => {
    stateRef.current = {
      activeTab,
      isConsoleOpen,
      isSettingsOpen,
      isShortcutsOpen,
      isGitHubModalOpen,
      isTourOpen,
      autoSaveEnabled,
      files,
    };
  }, [activeTab, isConsoleOpen, isSettingsOpen, isShortcutsOpen, isGitHubModalOpen, isTourOpen, autoSaveEnabled, files]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingConsole(true);
    
    const startY = e.clientY;
    const startHeight = consoleHeight;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(100, Math.min(window.innerHeight - 200, startHeight - deltaY));
      setConsoleHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      setIsDraggingConsole(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const [breakpoints, setBreakpoints] = useState<Map<string, Set<number>>>(new Map());
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentDebugLine, setCurrentDebugLine] = useState<number | null>(null);
  const [debugVariables, setDebugVariables] = useState<Record<string, any>>({});
  const debugResolver = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleOutput]);

  useEffect(() => {
    get("cadence-workspace-files").then((saved) => {
      if (saved) {
        try {
          const parsed = typeof saved === "string" ? JSON.parse(saved) : saved;
          
            if (parsed && parsed.length > 0) {
              const migrated = parsed.map((f: any) => {
                if (f.name === 'main.il' && f.content.includes('; Procedure: alignShapesToOrigin')) {
                  return { ...f, content: '' };
                }
                return f;
              });
              setFiles(migrated);
              handleFileSelect(migrated[0].id);
            }

        } catch (e) {
          console.error(e);
        }
      } else {
        // Fallback migration from localStorage
        const localSaved = localStorage.getItem("cadence-workspace-files");
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            
            if (parsed && parsed.length > 0) {
              const migrated = parsed.map((f: any) => {
                if (f.name === 'main.il' && f.content.includes('; Procedure: alignShapesToOrigin')) {
                  return { ...f, content: '' };
                }
                return f;
              });
              setFiles(migrated);
              handleFileSelect(migrated[0].id);
              set("cadence-workspace-files", migrated);
            }

          } catch (e) {
            console.error(e);
          }
        }
      }
    });
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    const newVal = value || "";
    setContent(newVal);
    setSaveStatus("saving");

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    if (savedTimeout.current) clearTimeout(savedTimeout.current);

    saveTimeout.current = setTimeout(() => {
      
      setSaveStatus("saved");

      savedTimeout.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    }, 500);
  };

    const handleFunctionJump = (fn: any) => {
    if (activeFileId !== fn.fileId) {
      handleFileSelect(fn.fileId);
    }
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(fn.line);
        editorRef.current.setPosition({ lineNumber: fn.line, column: 1 });
        editorRef.current.focus();
      }
    }, 50);
  };

    const handleReplaceAll = (replacePairs: {fileId: string, content: string}[]) => {
    let newFiles = [...files];
    
    replacePairs.forEach(pair => {
      const idx = newFiles.findIndex(f => f.id === pair.fileId);
      if (idx !== -1) {
        newFiles[idx] = { ...newFiles[idx], content: pair.content };
        if (activeFileId === pair.fileId) {
          setContent(pair.content);
          if (editorRef.current) {
            editorRef.current.setValue(pair.content);
          }
        }
      }
    });
    
    setFiles(newFiles);
    showToast(`Replaced in ${replacePairs.length} file(s)`);
  };

  const handleSearchResultClick = (fileId: string, line: number) => {
    handleFileSelect(fileId);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(line);
        editorRef.current.setPosition({ lineNumber: line, column: 1 });
        editorRef.current.focus();
      }
    }, 50);
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.addAction({
      id: 'format-skill-code',
      label: 'Format SKILL Code',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      ],
      run: (ed: any) => {
        const model = ed.getModel();
        if (!model) return;
        const currentContent = model.getValue();
        
        const lines = currentContent.split("\n");
        const formatted = [];
        let indentLevel = 0;

        for (let i = 0; i < lines.length; i++) {
          let line = lines[i].trim();
          if (!line) {
            formatted.push("");
            continue;
          }

          let startClosing = 0;
          for (let j = 0; j < line.length; j++) {
            if (line[j] === ")" || line[j] === "}") {
              startClosing++;
            } else if (line[j] !== " " && line[j] !== "\t") {
              break;
            }
          }

          let currentIndent = Math.max(0, indentLevel - startClosing);
          formatted.push(" ".repeat(currentIndent * 4) + line);

          let cleanLine = line
            .replace(/"(?:[^"\\]|\\.)*"/g, "")
            .replace(/;.*$/, "");
          let openParen = (cleanLine.match(/[({]/g) || []).length;
          let closeParen = (cleanLine.match(/[)}]/g) || []).length;

          indentLevel += openParen - closeParen;
          if (indentLevel < 0) indentLevel = 0;
        }

        const newContent = formatted.join("\n");
        
        ed.pushUndoStop();
        ed.executeEdits("format", [
          {
            range: model.getFullModelRange(),
            text: newContent,
          },
        ]);
        ed.pushUndoStop();
      }
    });

    editor.onKeyDown((e: any) => {
      // 1. Escape key
      if (e.keyCode === monaco.KeyCode.Escape) {
        if (isFindWidgetVisible()) {
          dismissFindWidget();
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        const { activeTab, isConsoleOpen, isSettingsOpen, isShortcutsOpen, isGitHubModalOpen, isTourOpen } = stateRef.current;
        let closedSomething = false;

        if (activeTab && activeTab !== 'files') {
          setActiveTab(null);
          closedSomething = true;
        }
        if (isConsoleOpen) {
          setIsConsoleOpen(false);
          closedSomething = true;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          closedSomething = true;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          closedSomething = true;
        }
        if (isGitHubModalOpen) {
          setIsGitHubModalOpen(false);
          closedSomething = true;
        }
        if (isTourOpen) {
          setIsTourOpen(false);
          closedSomething = true;
        }

        if (closedSomething) {
          e.preventDefault();
          e.stopPropagation();
        }
      }

      // 2. Ctrl+S / Cmd+S
      if (e.ctrlKey && e.keyCode === monaco.KeyCode.KeyS) {
        e.preventDefault();
        e.stopPropagation();
        if (!stateRef.current.autoSaveEnabled) {
          set("cadence-workspace-files", stateRef.current.files).catch(console.error);
          setSaveStatus("saving");
          setTimeout(() => setSaveStatus("saved"), 300);
          setTimeout(() => setSaveStatus("idle"), 2300);
          showToast("Project saved manually");
        } else {
          showToast("Auto-save is enabled");
        }
      }

      // 3. Toggle Files Sidebar on Ctrl+B / Cmd+B
      if (e.ctrlKey && e.keyCode === monaco.KeyCode.KeyB) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTab(prev => prev === 'files' ? null : 'files');
      }

      // 4. Toggle Global Search Sidebar on Ctrl+Shift+H
      if (e.ctrlKey && e.shiftKey && e.keyCode === monaco.KeyCode.KeyH) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTab(prev => prev === 'search' ? null : 'search');
      }

      // 5. Toggle diagnostic Console on Ctrl+` (backtick)
      if (e.ctrlKey && e.keyCode === monaco.KeyCode.US_BACKTICK) {
        e.preventDefault();
        e.stopPropagation();
        setIsConsoleOpen(prev => !prev);
      }
    });
  };

  useEffect(() => {
    if (editorRef.current) {
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.layout();
        }
      }, 50);
    }
  }, [consoleHeight, isConsoleOpen, activeTab]);

  const handleInsertSnippet = (text: string) => {
    if (editorRef.current && monacoRef.current) {
      const position = editorRef.current.getPosition();
      editorRef.current.executeEdits("cheatsheet", [
        {
          range: new monacoRef.current.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          text: text,
          forceMoveMarkers: true,
        },
      ]);
      editorRef.current.focus();
    } else {
      setContent((prev) => prev + "\n" + text);
    }
  };

  const handleSelectTemplate = (text: string) => {
    const currentFile = files.find(f => f.id === activeFileId);
    if (currentFile && currentFile.content.trim() === "") {
      setContent(text);
      return;
    }

    let newNum = files.length + 1;
    let name = `template${newNum}.il`;
    while (files.some(f => f.name === name)) {
      newNum++;
      name = `template${newNum}.il`;
    }
    const newFile = { id: uuidv4(), name, content: text };
    setFiles(prev => [...prev, newFile]);
    handleFileSelect(newFile.id);
  };

  const handleSelectChallenge = (challenge: any, isSolution?: boolean) => {
    let name = `${challenge.id}${isSolution ? '-sol' : ''}.il`;
    let existing = files.find(f => f.name === name);
    if (existing) {
      handleFileSelect(existing.id);
    } else {
      const code = isSolution ? challenge.solutionCode : challenge.initialCode;
      const newFile = { id: uuidv4(), name, content: code || "" };
      setFiles(prev => [...prev, newFile]);
      handleFileSelect(newFile.id);
    }
    showToast(`Challenge "${challenge.title}" ${isSolution ? 'Solution' : ''} initialized!`);
  };

    const handleDownloadCurrent = () => {
    const activeF = files.find(f => f.id === activeFileId);
    if (!activeF) return;
    const blob = new Blob([activeF.content], { type: "text/plain" });
    saveAs(blob, activeF.name);
      };

  const handleDownloadProject = async () => {
    const zip = new JSZip();
    files.forEach(f => {
      zip.file(f.name, f.content);
    });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "skill_project.zip");
      };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  
  const handleVerify = async () => {
    if (isSimulating || !activeFile) return;
    const activeChallenge = challenges.find(c => activeFile.name === `${c.id}.il` || activeFile.name === `${c.id}-sol.il`);
    if (!activeChallenge || !activeChallenge.verificationCall || !activeChallenge.exampleInput) return;

    const getTimestamp = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setIsConsoleOpen(true);
    setIsSimulating(true);

    setConsoleOutput(prev => [...prev, { 
      id: uuidv4(), 
      timestamp: getTimestamp(), 
      type: "info", 
      text: `--- Verifying ${activeChallenge.title} ---` 
    }]);

    setTimeout(async () => {
      let finalOut = "";
      const handleOut = (text) => { finalOut += text + "\n"; setConsoleOutput(prev => [...prev, { id: uuidv4(), timestamp: getTimestamp(), type: "output", text }]); };
      skillInterpreter.setOutputHandler(handleOut);

      try {
        const fullCode = `${activeFile.content}\n\n${activeChallenge.exampleInput}\nprintln(${activeChallenge.verificationCall})`;
        const res = await skillInterpreter.evaluate(fullCode);
        
        let expected = String(activeChallenge.exampleOutput).trim().split(';')[0].trim();
        let actual = String(res.value).trim();
        if (expected.startsWith("'")) {
           // Basic unquoting for comparison if expected is quoted
           expected = expected.replace(/^'/, '');
           actual = actual.replace(/^'/, '');
        }
        
        const passed = (actual === expected);
        if (passed) {
            setConsoleOutput(prev => [...prev, { id: uuidv4(), timestamp: getTimestamp(), type: "success", text: `\n✅ SUCCESS: Challenge ${activeChallenge.title} passed! Output matched expected: ${expected}` }]);
        } else {
            setConsoleOutput(prev => [...prev, { id: uuidv4(), timestamp: getTimestamp(), type: "error", text: `\n❌ FAILED: Output ${actual} did not match expected ${expected}` }]);
        }
      } catch (err) {
        setConsoleOutput(prev => [...prev, { id: uuidv4(), timestamp: getTimestamp(), type: "error", text: err.message || String(err) }]);
      }
      setIsSimulating(false);
    }, 100);
  };

  const createPauseHandler = () => {
    return async (line: number) => {
      setIsDebugOpen(true);
      setIsPaused(true);
      setCurrentDebugLine(line);
      setDebugVariables(skillInterpreter.getVariables());
      
      // Add highlighting to the editor
      if (editorRef.current && monacoRef.current) {
        editorRef.current.debugDecorationIds = editorRef.current.deltaDecorations(
          editorRef.current.debugDecorationIds || [],
          [
            {
              range: new monacoRef.current.Range(line, 1, line, 1),
              options: {
                isWholeLine: true,
                className: 'debug-line-highlight',
                glyphMarginClassName: 'breakpoint-margin' // Keep breakpoint icon visible
              }
            }
          ]
        );
        editorRef.current.revealLineInCenter(line);
      }

      return new Promise<void>(resolve => {
        debugResolver.current = () => {
          setIsPaused(false);
          setCurrentDebugLine(null);
          // Clear debug highlight
          if (editorRef.current) {
            editorRef.current.debugDecorationIds = editorRef.current.deltaDecorations(
              editorRef.current.debugDecorationIds || [],
              []
            );
          }
          resolve();
        };
      });
    };
  };

  const handleRun = async (debugMode = false) => {
    if (isSimulating) return;
    const getTimestamp = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setIsConsoleOpen(true);
    setIsSimulating(true);
    
    if (debugMode) {
      setIsDebugOpen(true);
    }

    setConsoleOutput(prev => [...prev, { 
      id: uuidv4(), 
      timestamp: getTimestamp(), 
      type: "info", 
      text: `--- Starting ${debugMode ? 'Debug Session' : 'Execution'} of ${activeFile.name} ---` 
    }]);

    // Small delay to simulate load time
    setTimeout(async () => {
      const currentBreakpoints = breakpoints.get(activeFile.name) || new Set();
      
      const result = await skillInterpreter.evaluate(
        content, 
        currentBreakpoints, // Always pass active breakpoints so they stop even on standard 'Run'
        createPauseHandler()
      );
      
      if (editorRef.current) {
        editorRef.current.debugDecorationIds = editorRef.current.deltaDecorations(
          editorRef.current.debugDecorationIds || [],
          []
        );
      }

      if (result.type === 'success') {
        setConsoleOutput(prev => [...prev, { 
          id: uuidv4(), 
          timestamp: getTimestamp(), 
          type: "success", 
          text: `Execution complete. Return value: ${JSON.stringify(result.value)}` 
        }]);
      } else {
        setConsoleOutput(prev => [...prev, { 
          id: uuidv4(), 
          timestamp: getTimestamp(), 
          type: "error", 
          text: result.output.join('\n'),
          line: result.line,
          col: result.col
        }]);
      }
      setIsSimulating(false);
      setIsDebugOpen(false);
      showToast("Execution complete");
    }, 400);
  };

  const handleContinue = () => {
    if (debugResolver.current) {
      debugResolver.current();
      debugResolver.current = null;
    }
  };

  const handleStep = () => {
    skillInterpreter.setStepMode(true);
    handleContinue();
  };

  const handleStop = () => {
    // Basic stop: just resolve the promise but let the interpreter finish quickly or throw
    // For this simple version, we'll just stop the debug session UI
    setIsDebugOpen(false);
    setIsPaused(false);
    handleContinue();
    setIsSimulating(false);
    if (editorRef.current) {
      editorRef.current.debugDecorationIds = editorRef.current.deltaDecorations(
        editorRef.current.debugDecorationIds || [],
        []
      );
    }
  };

  const handleBreakpointToggle = (line: number) => {
    setBreakpoints(prev => {
      const next = new Map(prev);
      const fileBreakpoints = new Set(next.get(activeFile.name) || []);
      if (fileBreakpoints.has(line)) {
        fileBreakpoints.delete(line);
      } else {
        fileBreakpoints.add(line);
      }
      next.set(activeFile.name, fileBreakpoints);
      return next;
    });
  };

  useEffect(() => {
    skillInterpreter.setOutputHandler((text) => {
      setConsoleOutput(prev => [...prev, { 
        id: uuidv4(), 
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
        type: "output", 
        text 
      }]);
    });
  }, []);
  const handleConsoleCommand = async (command: string) => {
    const getTimestamp = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const cmdId = uuidv4();
    
    setConsoleOutput(prev => [...prev, { id: cmdId, timestamp: getTimestamp(), type: "command", text: command }]);

    const cmd = command.trim().toLowerCase();
    
    if (cmd === 'help') {
      setConsoleOutput(prev => [...prev, { 
        id: uuidv4(), 
        timestamp: getTimestamp(), 
        type: "info", 
        text: "Cadence SKILL Virtual Engine (V-8.2)\nAvailable commands:\n- help: Show this menu\n- clear: Clear the console\n- list: List functions in current project\n- doc <func>: Look up documentation for a function\n- status: Show system status" 
      }]);
    } else if (cmd === 'clear') {
      setConsoleOutput([]);
    } else if (cmd === 'list') {
      const fnNames = manualFns.slice(0, 10).map(f => f.name).join(', ') + '...';
      setConsoleOutput(prev => [...prev, { 
        id: uuidv4(), 
        timestamp: getTimestamp(), 
        type: "info", 
        text: `Available functions in standard library: ${fnNames}` 
      }]);
        } else if (cmd.startsWith('ask ')) {
      const question = command.substring(4);
      if (!apiKey) {
        showToast("Please enter an API Key in Settings first.");
        setIsSettingsOpen(true);
        return;
      }
      setConsoleOutput(prev => [...prev, {
        id: cmdId + '_analyzing',
        timestamp: getTimestamp(),
        type: 'info',
        text: 'AI Expert is analyzing your request...'
      }]);
      
      try {
        const response = await fetch("/api/expert/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            code: content,
            apiKey,
            provider: aiProvider
          })
        });
        const data = await response.json();
        setConsoleOutput(prev => prev.filter(m => m.id !== cmdId + '_analyzing'));
        if (response.ok && data.reply) {
          setConsoleOutput(prev => [...prev, {
            id: uuidv4(),
            timestamp: getTimestamp(),
            type: "success",
            text: data.reply
          }]);
          if (data.newCode) {
            setContent(data.newCode);
            if (editorRef.current) {
              editorRef.current.setValue(data.newCode);
            }
            showToast("AI updated the code!");
          }
        } else {
          throw new Error(data.error || "Unknown error occurred.");
        }
      } catch (err: any) {
        setConsoleOutput(prev => prev.filter(m => m.id !== cmdId + '_analyzing'));
        setConsoleOutput(prev => [...prev, {
          id: uuidv4(),
          timestamp: getTimestamp(),
          type: "error",
          text: "AI Error: " + err.message
        }]);
      }
} else if (cmd.startsWith('doc ')) {
      const funcName = cmd.split(' ')[1];
      const fn = manualFns.find(f => f.name.toLowerCase() === funcName);
      if (fn) {
        setConsoleOutput(prev => [...prev, { 
          id: uuidv4(), 
          timestamp: getTimestamp(), 
          type: "info", 
          text: `DOC: ${fn.name}\nUsage: ${fn.usage}\nDescription: ${fn.description}` 
        }]);
      } else {
        setConsoleOutput(prev => [...prev, { 
          id: uuidv4(), 
          timestamp: getTimestamp(), 
          type: "error", 
          text: `Documentation not found for function: ${funcName}` 
        }]);
      }
    } else if (cmd === 'status') {
       setConsoleOutput(prev => [...prev, { 
        id: uuidv4(), 
        timestamp: getTimestamp(), 
        type: "success", 
        text: "System: Cadence Virtuoso SKILL Online\nStatus: Connected\nFiles: " + files.length + "\nEnvironment: Production (Cloud Native)" 
      }]);
    } else {
      // Real evaluation using interpreter with breakpoint support
      const currentBreakpoints = activeFile ? (breakpoints.get(activeFile.name) || new Set()) : new Set();
      const result = await skillInterpreter.evaluate(
        command,
        currentBreakpoints,
        createPauseHandler()
      );
      if (result.type === 'success') {
        setConsoleOutput(prev => [...prev, { 
          id: uuidv4(), 
          timestamp: getTimestamp(), 
          type: "output", 
          text: `=> ${JSON.stringify(result.value)}` 
        }]);
      } else {
        setConsoleOutput(prev => [...prev, { 
          id: uuidv4(), 
          timestamp: getTimestamp(), 
          type: "error", 
          text: result.output.join('\n') 
        }]);
      }
    }
  };

  const handleExpertAnalyze = async (msg: ConsoleMessage) => {
    if (!apiKey) {
      showToast("Please enter an API Key in Settings first.");
      setIsSettingsOpen(true);
      return;
    }

    setConsoleOutput(prev => prev.map(m => m.id === msg.id ? { ...m, isExpertAnalyzing: true } : m));
    
    try {
      const response = await fetch("/api/expert/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: content,
          error: msg.text,
          context: (msg as any).details || "",
          apiKey,
          provider: aiProvider
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");

      setConsoleOutput(prev => {
        const result = [...prev];
        const idx = result.findIndex(m => m.id === msg.id);
        if (idx !== -1) {
          result[idx] = { ...result[idx], isExpertAnalyzing: false };
          result.splice(idx + 1, 0, {
            id: uuidv4(),
            type: 'info',
            text: 'Expert Analysis:',
            details: data.analysis,
            timestamp: new Date().toLocaleTimeString()
          });
        }
        return result;
      });
    } catch (err: any) {
      setConsoleOutput(prev => prev.map(m => m.id === msg.id ? { ...m, isExpertAnalyzing: false } : m));
      showToast(err.message || "Expert analysis failed");
    }
  };

    const handleRefactorCode = () => {
    if (!content) return;
    const result = refactorSkillCode(content);
    if (result.code === content) {
      showToast("Code is already optimized");
      return;
    }
    setProposedRefactor(result);
  };

  const handleAcceptRefactor = () => {
    if (!proposedRefactor) return;
    
    if (editorRef.current) {
      editorRef.current.pushUndoStop();
      editorRef.current.executeEdits("refactor", [
        {
          range: editorRef.current.getModel()!.getFullModelRange(),
          text: proposedRefactor.code,
        },
      ]);
      editorRef.current.pushUndoStop();
    } else {
      setContent(proposedRefactor.code);
    }
    
    setConsoleOutput(prev => [...prev, { 
      id: uuidv4(), 
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
      type: "success", 
      text: "Expert Refactor Applied: Code optimized for Cadence design patterns." 
    }]);
    
    showToast("Expert refactor applied");
    setProposedRefactor(null);
  };

  const handleApplyQuickFix = (action: () => void) => {
    action();
    showToast("Quick fix applied!");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0b0c10] text-[#e2e8f0] font-sans">
      <header className="h-14 md:h-16 shrink-0 bg-[#0a0b0f] border-b border-white/[0.04] flex items-center justify-between px-3 md:px-6 z-40 relative">
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
                className={`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${activeTab === "files" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                onClick={() => setActiveTab(activeTab === "files" ? null : "files")}
              >
                <FolderOpen size={16} /> <span className="hidden lg:inline">Explorer</span>
                {activeTab === "files" && (
                  <motion.div layoutId="activeTabWedge" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            </Tooltip>
            
            <Tooltip content="Search project" position="bottom" delay={0.5} disabled={activeTab === "search"}>
              <button
                className={`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${activeTab === "search" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                onClick={() => setActiveTab(activeTab === "search" ? null : "search")}
              >
                <Search size={16} /> <span className="hidden lg:inline">Search</span>
                {activeTab === "search" && (
                  <motion.div layoutId="activeTabWedge" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="Code Outline" position="bottom" delay={0.5} disabled={activeTab === "outline"}>
              <button
                className={`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${activeTab === "outline" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                onClick={() => setActiveTab(activeTab === "outline" ? null : "outline")}
              >
                <ListTree size={16} /> <span className="hidden lg:inline">Outline</span>
                {activeTab === "outline" && (
                  <motion.div layoutId="activeTabWedge" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="Interactive tutorials and lessons" position="bottom" delay={0.5} disabled={activeTab === "tour"}>
              <button
                className={`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${activeTab === "tour" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
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
                className={`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${activeTab === "challenges" ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                onClick={() => setActiveTab(activeTab === "challenges" ? null : "challenges")}
              >
                <Trophy size={16} /> <span className="hidden lg:inline">Challenges</span>
                {activeTab === "challenges" && (
                  <motion.div layoutId="activeTabWedge" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-rose-500 rounded-t-full" />
                )}
              </button>
            </Tooltip>

            <div className="w-[1px] h-5 bg-white/10 mx-1 hidden md:block" />

            <Tooltip content="Load SKILL recipe templates" position="bottom" delay={0.5} disabled={activeTab === "templates"}>
              <button
                className={`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${activeTab === "templates" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
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
                className={`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${activeTab === "cheatsheet" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
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
                className={`relative inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${activeTab === "documentation" ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
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
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${autoSaveEnabled ? 'text-indigo-400 hover:bg-indigo-400/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
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
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard Shortcuts Guide"
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Keyboard size={16} className="text-slate-400" />
            <span className="hidden md:inline">Shortcuts</span>
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Settings size={16} className="text-slate-400" />
            <span className="hidden md:inline">Settings</span>
          </button>
          <button 
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
          </button>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isCopied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} className="text-emerald-400" />}
            <span className="hidden md:inline">{isCopied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        <AnimatePresence initial={false}>
          {activeTab && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "min(400px, 100vw)", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="absolute md:relative z-30 h-full bg-[#0b0c10] flex flex-col shrink-0 shadow-2xl md:shadow-none overflow-hidden border-r border-white/[0.04]"
            >
              <div className="w-[100vw] md:w-[400px] h-full flex flex-col relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeTab === "files" && (
                    <motion.div
                      key="files"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col h-full overflow-hidden"
                    >
                      <FileExplorer 
                        files={files} 
                        activeFileId={activeFileId} 
                        onFileSelect={handleFileSelect} 
                        onFilesChange={setFiles} 
                      />
                      <FunctionNavigator onFunctionClick={handleFunctionJump} />
                    </motion.div>
                  )}
                  {activeTab === "search" && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="h-full flex flex-col"
                    >
                      <SearchSidebar files={files} onResultClick={handleSearchResultClick} onReplaceAll={handleReplaceAll} onClose={() => setActiveTab(null)} />
                    </motion.div>
                  )}
                  {activeTab === "outline" && (
                    <motion.div
                      key="outline"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="h-full flex flex-col"
                    >
                      <CodeOutlineSidebar content={content} onNavigate={(line) => handleNavigate(activeFile.name, line)} onClose={() => setActiveTab(null)} />
                    </motion.div>
                  )}
                  {activeTab === "tour" && (
                    <motion.div
                      key="tour"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="h-full flex flex-col"
                    >
                      <TutorialSidebar isActive={true} isInline={true} currentText={content} onClose={() => setActiveTab(null)} onInsertCode={(code) => { setContent(code); if (editorRef.current) editorRef.current.setValue(code); showToast("Loaded lesson blueprint into editor!"); }} />
                    </motion.div>
                  )}
                  {activeTab === "templates" && (
                    <motion.div
                      key="templates"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="h-full flex flex-col"
                    >
                      <TemplateGallery isOpen={true} isInline={true} onClose={() => setActiveTab(null)} onSelect={handleSelectTemplate} onInsert={handleInsertSnippet} />
                    </motion.div>
                  )}
                  {activeTab === "cheatsheet" && (
                    <motion.div
                      key="cheatsheet"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="h-full flex flex-col"
                    >
                      <CheatsheetDrawer isOpen={true} isInline={true} onClose={() => setActiveTab(null)} onInsert={handleInsertSnippet} manualFns={manualFns} />
                    </motion.div>
                  )}
                  {activeTab === "documentation" && (
                    <motion.div
                      key="documentation"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="h-full flex flex-col"
                    >
                      <DocumentationPortal isOpen={true} isInline={true} onClose={() => setActiveTab(null)} manualFns={manualFns} onInsert={handleInsertSnippet} searchQuery={documentationSearchQuery} setSearchQuery={setDocumentationSearchQuery} />
                    </motion.div>
                  )}
                  {activeTab === "challenges" && (
                    <motion.div
                      key="challenges"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="h-full flex flex-col"
                    >
                      <ChallengeHub onClose={() => setActiveTab(null)} onSelectChallenge={(c, isSol) => { handleSelectChallenge(c, isSol); setActiveTab(null); }} />
                    </motion.div>
                  )}
                </AnimatePresence>
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
                
                <button 
                  onClick={() => editorRef.current?.trigger('source', 'undo', null)} 
                  title="Undo (Ctrl+Z)"
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-all"
                >
                  <Undo2 size={14} />
                </button>
                <button 
                  onClick={() => editorRef.current?.trigger('source', 'redo', null)} 
                  title="Redo (Ctrl+Y)"
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-all"
                >
                  <Redo2 size={14} />
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(content);
                    showToast("Code copied to clipboard!");
                  }} 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-all text-[11px] font-bold tracking-wider uppercase"
                >
                  <Copy size={14} />
                  <span className="hidden sm:inline">Copy</span>
                </button>
                <button onClick={() => handleRun(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 transition-all text-[11px] font-bold tracking-wider uppercase">
                  <Bug size={14} />
                  <span className="hidden sm:inline">Debug</span>
                </button>
                
                {challenges.find(c => activeFile?.name === `${c.id}.il` || activeFile?.name === `${c.id}-sol.il`)?.verificationCall && (
                  <button onClick={handleVerify} disabled={isSimulating} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold tracking-wider uppercase border ${isSimulating ? 'bg-amber-500/10 text-amber-500/50 border-amber-500/10 cursor-not-allowed' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20 shadow-amber-500/10 hover:shadow-amber-500/20 shadow-lg'}`}>
                    <CheckCircle2 size={14} />
                    <span className="hidden sm:inline">Verify Solution</span>
                  </button>
                )}

                <button id="run-skill-btn" onClick={() => handleRun(false)} disabled={isSimulating} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all text-[11px] font-bold tracking-wider uppercase shadow-lg ${isSimulating ? 'bg-indigo-500/50 text-white/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 hover:shadow-indigo-500/40'}`}>
                  {isSimulating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  <span className="hidden sm:inline">{isSimulating ? "Running..." : "Run SKILL"}</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <EditorPane activeFileName={activeFile.name} value={content} onChange={handleEditorChange} onMount={handleEditorMount} showMinimap={showMinimap} wordWrap={wordWrap} fontSize={fontSize} manualFns={manualFns} breakpoints={Array.from(breakpoints.get(activeFile.name) || [])} onBreakpointToggle={handleBreakpointToggle} onNavigate={handleNavigate} />
            </div>
          </section>

          {isConsoleOpen && (
            <div 
              onMouseDown={handleResizeStart}
              className="h-1.5 w-full bg-transparent hover:bg-indigo-500/50 cursor-ns-resize transition-colors relative z-40 group flex items-center justify-center select-none shrink-0"
            >
              <div className="absolute inset-x-0 h-[1px] bg-white/5 group-hover:bg-indigo-500/50 transition-colors" />
              <div className="w-12 h-1 bg-white/15 group-hover:bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          <AnimatePresence>
            {isConsoleOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: consoleHeight, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={isDraggingConsole ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.35 }}
                className="flex flex-col min-w-0 border-t border-white/[0.04] overflow-hidden bg-[#0b0c10]"
              >
                <Console messages={consoleOutput} onClear={() => setConsoleOutput([])} onClose={() => setIsConsoleOpen(false)} onApplyQuickFix={handleApplyQuickFix} onCommand={handleConsoleCommand} onExpertAnalyze={handleExpertAnalyze} onJumpToError={(line, col) => handleNavigate(activeFile.name, line, col)}
                   isSimulating={isSimulating} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      <footer className="h-8 shrink-0 bg-[#0b0c10] border-t border-white/[0.04] flex items-center justify-between px-4 text-[11px] text-slate-500 font-medium z-20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            System Ready
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Sparkles size={12} className="text-indigo-500/70" />
            <span className="hidden sm:inline">Designed & Developed </span>by <span className="text-slate-300 font-semibold">Yongkai Zhang</span>
          </span>
        </div>
      </footer>

      <AnimatePresence>
        {proposedRefactor && (
          <RefactorDiffView 
            originalCode={content}
            modifiedCode={proposedRefactor.code}
            explanations={proposedRefactor.explanations}
            onAccept={handleAcceptRefactor}
            onCancel={() => setProposedRefactor(null)}
          />
        )}
      </AnimatePresence>

       <AnimatePresence>
        {isDebugOpen && (
          <Debugger 
            isOpen={isDebugOpen}
            onClose={() => setIsDebugOpen(false)}
            isPaused={isPaused}
            currentLine={currentDebugLine}
            variables={debugVariables}
            onContinue={handleContinue}
            onStep={handleStep}
            onStop={handleStop}
          />
        )}
      </AnimatePresence>

      
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            wordWrap={wordWrap} 
            setWordWrap={setWordWrap} 
            showMinimap={showMinimap} 
            setShowMinimap={setShowMinimap} 
            fontSize={fontSize} 
            setFontSize={setFontSize} 
            apiKey={apiKey}
            setApiKey={setApiKey}
            aiProvider={aiProvider}
            setAiProvider={setAiProvider}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShortcutsOpen && (
          <ShortcutsModal 
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGitHubModalOpen && (
          <GitHubSyncModal
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            files={files}
            onFilesChange={setFiles}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTourOpen && (
          <OnboardingTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
        )}
      </AnimatePresence>
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#1e2128] border border-white/10 shadow-2xl rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-[#e2e8f0] animate-in fade-in slide-in-from-bottom-4 z-50">
          {isSimulating ? (
            <Loader2 size={16} className="text-indigo-400 animate-spin" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-400" />
          )}
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
