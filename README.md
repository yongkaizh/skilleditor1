# Cadence SKILL Web Editor

A modern, web-based IDE designed specifically for writing Cadence SKILL and SKILL++ scripts. Built with React, Vite, and the powerful Monaco Editor (the same engine behind VS Code), this editor brings an intelligent, "IDEA-like" coding experience to EDA developers.

## ✨ Features

- **Rich Syntax Highlighting**: Custom Monarch tokenizer specifically built for Cadence SKILL. It highlights `procedure`, `let`, `if`, `case`, and common Lisp-like structures perfectly.
- **Dynamic Autocomplete Engine**: As you type, the editor intelligently suggests SKILL functions. The completion data is driven by an easily updateable text manual.
- **Intelligent Hover Documentation**: Hover over any recognized function (e.g., `dbOpenCellViewByType`, `hiCreateAppForm`) to instantly view its usage signature, a detailed description, and a real-world code example.
- **Integrated Learning Platform**:
  - **Cheatsheet Drawer**: Quick reference for syntax and API structure.
  - **Template Gallery**: Pre-built boilerplate for common SKILL tasks (PCells, custom UI forms, menu triggers).
  - **Interactive Onboarding**: Step-by-step guidance for new users.
- **Premium UI/UX**: Built with a sleek dark mode, glassmorphism effects, and dynamic micro-animations to make scripting enjoyable.

## 📁 App Structure

### 🏛️ Architecture Overview

Here is a high-level view of how the Cadence SKILL Web Editor components interact:

```text
+-------------------------------------------------------------+
|                     Main Application (App.tsx)              |
|                                                             |
|  +--------------------+  +-------------------------------+  |
|  |     Sidebars       |  |          Editor Pane          |  |
|  |                    |  |                               |  |
|  | - File Explorer    |  |  +-------------------------+  |  |
|  | - Code Outline     |<--->|      Monaco Editor      |  |  |
|  | - Search           |  |  +-------------------------+  |  |
|  | - Cheatsheet       |  |               ^               |  |
|  | - Templates        |  |               |               |  |
|  +--------------------+  +---------------+---------------+  |
|                                          |                  |
+------------------------------------------|------------------+
                                           |
+------------------------------------------v------------------+
|                  Editor Core & Language Services            |
|                                                             |
|  +-----------------+   +------------------+   +----------+  |
|  | monaco-config.ts|   | refactorEngine.ts|   | Linter   |  |
|  | (Theme/Tokens)  |   | (Code Optimizer) |   | (Syntax) |  |
|  +--------^--------+   +------------------+   +----------+  |
|           |                                                 |
|  +--------v--------+                                        |
|  | manualParser.ts |<--------- Reads --------- manual.txt   |
|  | (Docs/Hover)    |                           (DB/API)     |
|  +-----------------+                                        |
+-------------------------------------------------------------+
|                    Browser Local Storage                    |
|                (Saves files, auto-save state)               |
+-------------------------------------------------------------+
```

This application is modularly structured to ensure maintainability and separation of concerns:

- `src/components/`: Contains all React UI components.
  - `EditorPane.tsx`: The primary wrapper around the Monaco Editor instance.
  - `Console.tsx`: The bottom console panel for running commands and interacting with the interpreter.
  - `RefactorDiffView.tsx`: Displays proposed automated refactorings.
  - `SearchSidebar.tsx`, `CodeOutlineSidebar.tsx`, `FileExplorer.tsx`: Sidebar utilities.
- `src/editor/`: Core editor and language intelligence logic.
  - `monaco-config.ts`: Configures the SKILL language tokenizer, autocomplete provider, and hover documentation.
  - `manualParser.ts`: Parses the text-based documentation (`manual.txt`) into structured intelligence for Monaco.
  - `skillInterpreter.ts`: An experimental client-side AST parser and interpreter for executing SKILL syntax.
  - `refactorEngine.ts`: Contains logic for analyzing code and suggesting design pattern improvements.
- `src/data/`: Static data sources.
  - `manual.txt`: The primary dictionary for SKILL functions (used for hover/autocomplete).
- `src/App.tsx`: The main application orchestrator, managing state across the editor, file explorer, and sidebars.

## 🪄 Auto Refactor Code

The **Auto Refactor** tool analyzes your SKILL code and proposes common design pattern improvements to make the code cleaner, safer, and more aligned with Cadence best practices. 

When you apply a refactor, it parses the active script and checks against a set of heuristic rules. For example:
- **`let` block structuring:** Ensures local variables in `let` blocks are correctly enclosed in a list `let((var1 var2) ...)`.
- **Database (`db`) prefixing:** Automatically adds standard Cadence `db` prefixes to recognized core geometry functions if you forgot them (e.g., expanding `CreateRect` to `dbCreateRect`).
- **Loop Optimization:** Can suggest utilizing optimal iteration techniques like `mapcar` instead of `foreach` loops with `cons` accumulation.

If improvements are found, a **Review Refactor Changes** pane will appear displaying a "Before & After" diff, allowing you to review the changes before applying them to your document.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:YongkaiZHANG/skillEditor.git
   cd skillEditor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   Navigate to `http://localhost:5173` to start coding.

## 📖 Updating the Manual

The editor's intelligence (autocomplete and hover documentation) is powered by a central dictionary located at:
`src/data/manual.txt`

To add new Cadence functions to the editor, simply append them to this file using the following format:
```text
@function functionName
@usage functionName(arg1 arg2)
@example cv = functionName("lib" "cell")
@desc A detailed description of what the function does.
```
The editor automatically parses this file and injects the updates into the engine!

## 🛠 Tech Stack
- **Framework**: React 18 + Vite
- **Editor Engine**: Monaco Editor (`@monaco-editor/react`)
- **Styling**: Vanilla CSS with modern variables and animations
- **Language**: TypeScript

## 📄 License
This project is for educational and development purposes. Cadence and SKILL are trademarks of Cadence Design Systems, Inc.
