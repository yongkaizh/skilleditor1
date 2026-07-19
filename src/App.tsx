import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderOpen,
  FileArchive,
  Copy,
  Code2,
  Sparkles,
  Book,
  LayoutTemplate,
  GraduationCap,
  Undo2,
  Redo2,
  AlignLeft,
  CheckCircle2,
  Loader2,
  Search,
  Map as MapIcon,
  Play,
  Trophy,
  X,
  WrapText,
  MessageSquare,
  Cloud,
  ChevronDown,
  ChevronUp,
  Save,
  SaveOff,
  Bug,
} from "lucide-react";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { EditorPane } from "./components/EditorPane";
import { FileExplorer } from "./components/FileExplorer";
import { EditorBreadcrumbs } from "./components/EditorBreadcrumbs";
import { GitHubSyncModal } from "./components/GitHubSyncModal";
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
import { projectState } from "./editor/projectState";
import { parseManual } from "./editor/manualParser";
import { skillInterpreter } from "./editor/skillInterpreter";
import { refactorSkillCode } from "./editor/refactorEngine";
import { RefactorDiffView } from "./components/RefactorDiffView";
import manualRawText from "./data/manual.txt?raw";

const DEFAULT_SKILL = `; Cadence SKILL Useful Script
; ----------------------------------------------------
; Procedure: alignShapesToOrigin
; Description: Moves all selected shapes such that the 
; lower-left corner of their bounding box is exactly at (0, 0).
; Useful for creating normalized PCells or footprints.

procedure( alignShapesToOrigin()
    let( (cv selBox minX minY deltaX deltaY count)
        cv = geGetWindowCellView()
        
        ; Calculate the bounding box of the selection
        selBox = geGetSelSetBBox()
        
        if( selBox then
            ; Extract the lower-left coordinates
            minX = xCoord(lowerLeft(selBox))
            minY = yCoord(lowerLeft(selBox))
            
            ; Calculate the translation required to hit (0, 0)
            deltaX = -minX
            deltaY = -minY
            
            count = 0
            
            ; Move each selected object by the delta
            foreach( obj geGetSelSet()
                dbMoveFig(obj cv list(deltaX:deltaY "R0" 1))
                count++
            )
            
            printf("*Success* Moved %d objects by (%.3f, %.3f) to align with origin.\\n" count deltaX deltaY)
        else
            printf("*Warning* No objects selected. Please select objects to align.\\n")
        )
        
        t
    )
)

; Run the procedure if this script is loaded
; alignShapesToOrigin()
`;

function App() {
  
  const [files, setFiles] = useState<{id: string, name: string, content: string}[]>([
    { id: '1', name: 'main.il', content: DEFAULT_SKILL }
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('1');
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

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

  const [isFolded, setIsFolded] = useState(false);

  const handleFoldToggle = () => {
    if (editorRef.current) {
      if (isFolded) {
        editorRef.current.getAction('editor.unfoldAll').run();
      } else {
        editorRef.current.getAction('editor.foldAll').run();
      }
      setIsFolded(!isFolded);
    }
  };

  const handleNavigate = (fileName: string, line?: number) => {
    const file = files.find(f => f.name === fileName);
    if (file) {
      setActiveFileId(file.id);
      if (line !== undefined && editorRef.current) {
        // Delay ensures editor has loaded the new model before scrolling
        setTimeout(() => {
          editorRef.current.revealLineInCenter(line);
          editorRef.current.setPosition({ lineNumber: line, column: 1 });
          editorRef.current.focus();
        }, 100);
      }
    }
  };

  const activeFile = files.find(f => f.id === activeFileId) || files[0];
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
  const [activeTab, setActiveTab] = useState<"files" | "tour" | "scenarios" | "challenges" | "templates" | "cheatsheet" | "documentation" | null>("files");


  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("ag-skill-auto-save");
    return saved === null ? true : saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("ag-skill-auto-save", autoSaveEnabled.toString());
    if (autoSaveEnabled) {
      const timeoutId = setTimeout(() => {
        set("ag-skill-files", files).catch(console.error);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [autoSaveEnabled, files]);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!autoSaveEnabled) {
          set("ag-skill-files", files).catch(console.error);
          setSaveStatus("saving");
          setTimeout(() => setSaveStatus("saved"), 300);
          setTimeout(() => setSaveStatus("idle"), 2300);
          showToast("Project saved manually");
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoSaveEnabled, files]);
  const [manualFns, setManualFns] = useState<any[]>([]);

  useEffect(() => {
    const parsed = parseManual(manualRawText);
    setManualFns(parsed);
  }, []);

  const [showMinimap, setShowMinimap] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [isSimulating, setIsSimulating] = useState(false);
  const [proposedRefactor, setProposedRefactor] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleMessage[]>([]);
  const [isTourOpen, setIsTourOpen] = useState(false);

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
    get("ag-skill-files").then((saved) => {
      if (saved) {
        try {
          const parsed = typeof saved === "string" ? JSON.parse(saved) : saved;
          if (parsed && parsed.length > 0) {
            setFiles(parsed);
            setActiveFileId(parsed[0].id);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        // Fallback migration from localStorage
        const localSaved = localStorage.getItem("ag-skill-files");
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (parsed && parsed.length > 0) {
              setFiles(parsed);
              setActiveFileId(parsed[0].id);
              set("ag-skill-files", parsed);
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
      setActiveFileId(fn.fileId);
    }
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(fn.line);
        editorRef.current.setPosition({ lineNumber: fn.line, column: 1 });
        editorRef.current.focus();
      }
    }, 50);
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleInsertSnippet = (text: string) => {
    if (editorRef.current && monacoRef.current) {
      const snippetController =
        editorRef.current.getContribution("snippetController2");
      if (snippetController) {
        snippetController.insert(text);
      } else {
        const position = editorRef.current.getPosition();
        editorRef.current.executeEdits("cheatsheet", [
          {
            range: new monacoRef.current.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column,
            ),
            text: text,
            forceMoveMarkers: true,
          },
        ]);
      }
      editorRef.current.focus();
    } else {
      setContent((prev) => prev + "\n" + text);
    }
  };

  const handleSelectTemplate = (text: string) => {
    let newNum = files.length + 1;
    let name = `template${newNum}.il`;
    while (files.some(f => f.name === name)) {
      newNum++;
      name = `template${newNum}.il`;
    }
    const newFile = { id: uuidv4(), name, content: text };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleSelectChallenge = (challenge: any, isSolution?: boolean) => {
    let name = `${challenge.id}${isSolution ? '-sol' : ''}.il`;
    let existing = files.find(f => f.name === name);
    if (existing) {
      setActiveFileId(existing.id);
    } else {
      const code = isSolution ? challenge.solutionCode : challenge.initialCode;
      const newFile = { id: uuidv4(), name, content: code || "" };
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
    }
    showToast(`Challenge "${challenge.title}" ${isSolution ? 'Solution' : ''} initialized!`);
  };

    const handleDownload = async () => {
    if (files.length === 1) {
      const blob = new Blob([files[0].content], { type: "text/plain" });
      saveAs(blob, files[0].name);
    } else {
      const zip = new JSZip();
      files.forEach(f => {
        zip.file(f.name, f.content);
      });
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "skill_project.zip");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger("keyboard", "undo", null);
      editorRef.current.focus();
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger("keyboard", "redo", null);
      editorRef.current.focus();
    }
  };

  const handleSearch = () => {
    if (editorRef.current) {
      editorRef.current.getAction("actions.find").run();
      editorRef.current.focus();
    }
  };

  const handleToggleComment = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.commentLine").run();
      editorRef.current.focus();
    }
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
        debugMode ? currentBreakpoints : new Set(),
        async (line) => {
          setIsPaused(true);
          setCurrentDebugLine(line);
          setDebugVariables(skillInterpreter.getVariables());
          
          // Add highlighting to the editor
          if (editorRef.current) {
            editorRef.current.deltaDecorations([], [
              {
                range: new monacoRef.current.Range(line, 1, line, 1),
                options: {
                  isWholeLine: true,
                  className: 'debug-line-highlight',
                  glyphMarginClassName: 'breakpoint-margin' // Keep breakpoint icon visible
                }
              }
            ]);
            editorRef.current.revealLineInCenter(line);
          }

          return new Promise<void>(resolve => {
            debugResolver.current = () => {
              setIsPaused(false);
              setCurrentDebugLine(null);
              // Clear debug highlight
              if (editorRef.current) {
                editorRef.current.deltaDecorations(
                  editorRef.current.getModel().getAllDecorations()
                    .filter((d: any) => d.options.className === 'debug-line-highlight')
                    .map((d: any) => d.id),
                  []
                );
              }
              resolve();
            };
          });
        }
      );
      
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
          text: result.output.join('\n') 
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
  const handleConsoleCommand = (command: string) => {
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
      // Real evaluation using interpreter
      const result = skillInterpreter.evaluate(command);
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
    const getTimestamp = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Set loading state for this message
    setConsoleOutput(prev => prev.map(m => m.id === msg.id ? { ...m, isExpertAnalyzing: true } : m));

    try {
      const response = await fetch("/api/expert/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          error: msg.text,
          code: content,
          context: "User is working in the Cadence SKILL IDE."
        }),
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      setConsoleOutput(prev => [
        ...prev.map(m => m.id === msg.id ? { ...m, isExpertAnalyzing: false } : m),
        { 
          id: uuidv4(), 
          timestamp: getTimestamp(), 
          type: "info", 
          text: `*** EXPERT ANALYSIS ***\n\n${data.analysis}` 
        }
      ]);
    } catch (err: any) {
      setConsoleOutput(prev => [
        ...prev.map(m => m.id === msg.id ? { ...m, isExpertAnalyzing: false } : m),
        { 
          id: uuidv4(), 
          timestamp: getTimestamp(), 
          type: "error", 
          text: `Expert Analysis Failed: ${err.message}` 
        }
      ]);
    }
  };

  const handleFormatCode = () => {
    if (!content) return;

    const lines = content.split("\n");
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

    if (editorRef.current) {
      editorRef.current.pushUndoStop();
      editorRef.current.executeEdits("format", [
        {
          range: editorRef.current.getModel().getFullModelRange(),
          text: newContent,
        },
      ]);
      editorRef.current.pushUndoStop();
    } else {
      setContent(newContent);
    }
  };
  
  const handleRefactorCode = () => {
    if (!content) return;
    const newContent = refactorSkillCode(content);
    if (newContent === content) {
      showToast("Code is already optimized");
      return;
    }
    setProposedRefactor(newContent);
  };

  const handleAcceptRefactor = () => {
    if (!proposedRefactor) return;
    
    if (editorRef.current) {
      editorRef.current.pushUndoStop();
      editorRef.current.executeEdits("refactor", [
        {
          range: editorRef.current.getModel()!.getFullModelRange(),
          text: proposedRefactor,
        },
      ]);
      editorRef.current.pushUndoStop();
    } else {
      setContent(proposedRefactor);
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
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        <AnimatePresence initial={false}>
          {activeTab && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: "min(400px, 100vw)", 
                opacity: 1,
              }}
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
                      onFileSelect={setActiveFileId} 
                      onFilesChange={setFiles} 
                    />
                    <FunctionNavigator onFunctionClick={handleFunctionJump} />
                  </div>
                )}
                {activeTab === "tour" && (
                  <TutorialSidebar
                    isActive={true}
                    isInline={true}
                    currentText={content}
                    onClose={() => setActiveTab(null)}
                    onInsertCode={(code) => {
                      setContent(code);
                      if (editorRef.current) {
                        editorRef.current.setValue(code);
                      }
                      showToast("Loaded lesson blueprint into editor!");
                    }}
                  />
                )}
                {activeTab === "templates" && (
                  <TemplateGallery
                    isOpen={true}
                    isInline={true}
                    onClose={() => setActiveTab(null)}
                    onSelect={handleSelectTemplate}
                  />
                )}
                {activeTab === "cheatsheet" && (
                  <CheatsheetDrawer
                    isOpen={true}
                    isInline={true}
                    onClose={() => setActiveTab(null)}
                    onInsert={handleInsertSnippet}
                    manualFns={manualFns}
                  />
                )}
                {activeTab === "documentation" && (
                  <DocumentationPortal 
                    isOpen={true} 
                    isInline={true} 
                    onClose={() => setActiveTab(null)} 
                    manualFns={manualFns}
                    onInsert={handleInsertSnippet}
                    searchQuery={documentationSearchQuery}
                    setSearchQuery={setDocumentationSearchQuery}
                  />
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
          <div className="px-6 py-3 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider bg-[#0b0c10] border-b border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EditorBreadcrumbs activeFile={activeFile} files={files} onFileSelect={setActiveFileId} />
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1.5 text-indigo-400 normal-case tracking-normal font-medium text-[11px]">
                  <Loader2 size={12} className="animate-spin" /> saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1.5 text-emerald-400 normal-case tracking-normal font-medium text-[11px]">
                  <CheckCircle2 size={12} /> saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all ${isConsoleOpen ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white'}`}
              >
                <MessageSquare size={14} />
                <span className="hidden sm:inline">Console</span>
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button
                onClick={handleFoldToggle}
                title={isFolded ? "Unfold All" : "Fold Procedures & Loops"}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-all"
              >
                {isFolded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />
              <button
                onClick={() => handleRun(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 transition-all text-[11px] font-bold tracking-wider uppercase"
              >
                <Bug size={14} />
                <span className="hidden sm:inline">Debug</span>
              </button>
              <button
                id="run-skill-btn"
                onClick={() => handleRun(false)}
                disabled={isSimulating}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all text-[11px] font-bold tracking-wider uppercase shadow-lg ${isSimulating ? 'bg-indigo-500/50 text-white/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 hover:shadow-indigo-500/40'}`}
              >
                {isSimulating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                <span className="hidden sm:inline">{isSimulating ? "Running..." : "Run SKILL"}</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto relative">
            <EditorPane
              activeFileName={activeFile.name}
              value={content}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              showMinimap={showMinimap}
              wordWrap={wordWrap}
              fontSize={fontSize}
              manualFns={manualFns}
              breakpoints={Array.from(breakpoints.get(activeFile.name) || [])}
              onBreakpointToggle={handleBreakpointToggle}
              onNavigate={handleNavigate}
            />
          </div>
        </section>
          {isConsoleOpen && (
            <Console 
              messages={consoleOutput}
              onClear={() => setConsoleOutput([])}
              onClose={() => setIsConsoleOpen(false)}
              onApplyQuickFix={handleApplyQuickFix}
              onCommand={handleConsoleCommand}
              onExpertAnalyze={handleExpertAnalyze}
              onRefactor={handleRefactorCode}
              isSimulating={isSimulating}
            />
          )}
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
            modifiedCode={proposedRefactor}
            onAccept={handleAcceptRefactor}
            onCancel={() => setProposedRefactor(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
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
      </AnimatePresence>

      <GitHubSyncModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        files={files}
        onFilesChange={setFiles}
      />

      <OnboardingTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      
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
