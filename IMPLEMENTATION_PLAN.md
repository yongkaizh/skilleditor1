# Cadence SKILL Editor - Implementation Plan

This document outlines the roadmap for turning the current prototype into a fully-featured, production-ready in-browser IDE for Cadence SKILL.

## Phase 1: Robust Virtual File System & Multi-Tab Editing
Currently, files are managed as a flat list with basic string paths. We need a proper IDE experience.
* [ ] **1.1 Multi-Tab Editor (`src/components/EditorTabs.tsx`)**: Implement a tab bar above the breadcrumbs so users can keep multiple files open simultaneously, just like VS Code.
* [ ] **1.2 Advanced File Explorer**: Add right-click context menus, nested folder creation, file moving (drag-and-drop), and robust renaming capabilities.

## Phase 2: Global Search & Navigation
For larger projects, users need to find things quickly.
* [ ] **2.1 Global Search Panel (`src/components/SearchSidebar.tsx`)**: Add a new sidebar tab for searching text across all files in the project, with support for Regex and case-sensitivity.
* [ ] **2.2 Go-to Definition / Cross-file References**: Enhance the Monaco Editor configuration so that clicking a function name jumps to its definition, even if it's in another file.

## Phase 3: Interactive REPL & Terminal
A core part of LISP/SKILL development is the REPL.
* [ ] **3.1 Interactive SKILL REPL (`src/components/Repl.tsx`)**: Upgrade the current read-only console into an interactive terminal where users can type SKILL commands and evaluate them on the fly against the current interpreter state.
* [ ] **3.2 Console History & Output Formatting**: Add up/down arrow history for the REPL and better syntax highlighting for the output.

## Phase 4: Layout & UX Polish
Make it feel like a native desktop application.
* [ ] **4.1 Resizable Panes**: Introduce `react-resizable-panels` so users can dynamically resize the sidebar, the editor, and the console.
* [ ] **4.2 Settings Modal (`src/components/SettingsModal.tsx`)**: Centralize configurations (font size, minimap toggle, auto-save settings, light/dark theme) into a proper settings dialog.
