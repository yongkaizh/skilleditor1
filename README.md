# 🖥️ Cadence SKILL Web IDE & Interactive Interpreter

A state-of-the-art, high-fidelity in-browser development environment engineered specifically for writing, linting, debugging, and refactoring **Cadence SKILL** and **SKILL++** scripts. By combining a powerful, custom-configured Monaco Editor with an in-browser Abstract Syntax Tree (AST) parser, interpreter, and real-time debugger, this IDE provides an unmatched, professional coding platform for Electronic Design Automation (EDA) and Integrated Circuit (IC) layout engineers.

---

## 🏛️ High-Level System Architecture

The following block diagram illustrates how the core React state orchestrates communication between the Monaco Language Services, the in-memory linter, the custom SKILL interpreter, and the file system storage layer:

```text
========================================================================================================
                                      CADENCE SKILL IDE ARCHITECTURE
========================================================================================================

        +--------------------------------------------------------------------------------------+
        |                                REACT ORCHESTRATION LAYER                             |
        |                                                                                      |
        |   +--------------------+     +--------------------------+     +------------------+   |
        |   |    Active Files    |     |      Console Output      |     | Breakpoint State |   |
        |   | (State/IndexedDB)  |     |   (Shell logs/Stdout)    |     |  (Line Numbers)  |   |
        |   +---------+----------+     +------------^-------------+     +--------+---------+   |
        +-------------|-----------------------------|----------------------------|-------------+
                      |                             |                            |
                      v                             |                            v
        +-------------v-----------------------------+----------------------------v-------------+
        |                            MONACO INTEGRATED EDITOR PANE                             |
        |                                                                                      |
        |   +--------------------------+  +--------------------------+  +------------------+   |
        |   |      Monarch Tokens      |  |  Hover & Auto-Complete   |  | Debug Decoration |   |
        |   |   (Syntax Highlighting)  |  |        Providers         |  |   Highlights     |   |
        |   +------------^-------------+  +------------^-------------+  +--------^---------+   |
        +----------------|-----------------------------|-------------------------|-------------+
                         |                             |                         |
  Updates Marker State   |                             | Pulls Doc               | Controls Highlight
  +----------------------+                             | Objects                 |
  |                                                    |                         |
+-v------------------------------------+   +-----------+------------+   +--------+-------------+
|        DUBBOUNCED LINTER EYE         |   |     MANUAL PARSER      |   |  AST INTERPRETER     |
|                                      |   |                        |   |       ENGINE         |
|  1. Paren Stack Alignment Check      |   |  Reads raw text-based  |   |                      |
|  2. Levenshtein Distance Typo Check  |   |  API annotations from  |   |  Executes SKILL      |
|  3. Cadence strict API checks        |   |  `manual.txt` and      |   |  expressions, hooks  |
|     (db*, le*, hi*, ge*, tech*)      |   |  compiles in-memory    |   |  debugger and        |
|  4. Scope Parameter-Count Mismatch   |   |  indexes dynamically.  |   |  evaluates bindings. |
+--------------------------------------+   +-----------^------------+   +----------------------+
                                                       |
                                              [ Reads API Docs ]
                                                       |
                                            +----------v----------+
                                            |   src/data/         |
                                            |   manual.txt        |
                                            +---------------------+
```

---

## 📊 Deep-Dive Functional Pipeline Graphs

### 1. The AST Parsing & Interpreter Pipeline
The interpreter reads raw SKILL code, tokenizes it into structured chunks, converts them into a tree structure (AST), and recursively evaluates the expressions within an isolated variable binding scope (Environment):

```text
[ Raw SKILL Input ]
       │  "procedure(addTwo(x y) x + y)"
       ▼
┌──────────────┐
│  Tokenizer   │  ─► Generates flat array of raw tokens (Symbol, Number, Parenthesis, String)
└──────────────┘
       │
       ▼
┌──────────────┐
│  AST Parser  │  ─► Transforms token streams into a nested Abstract Syntax Tree (AST) representation
└──────────────┘
       │  
       │  AST Node: { type: 'call', fn: 'procedure', args: [ ... ] }
       ▼
┌──────────────┐
│ Environment  │  ─► Manages scope chains (Parent environments, lexical block variables, global APIs)
└──────────────┘
       │
       ▼
┌──────────────┐
│  Evaluator   │  ─► Recursively evaluates AST nodes and coordinates Pause/Resume events
└──────────────┘
       │
       ├─► [ Hit Breakpoint? ] ──► Suspend with Promise Resolver ──► [ UI Highlights Debug Line ]
       │                                                                       │
       │                                                                       ▼
       ├─► [ Resume Button Clicked ] ◄─────────────────────────────────────────┘
       │
       ▼
[ Evaluated Output ] ──► Printed to the Interactive Terminal Panel
```

### 2. Live Monaco Intelligence & manual.txt Parser Feed
This diagram displays how static documentation in `manual.txt` is parsed and converted on the fly into rich Monaco Editor hovers and intelligent auto-completions:

```text
                    ┌─────────────────────────┐
                    │    src/data/manual.txt  │
                    └────────────┬────────────┘
                                 │
                         [ Reads raw text ]
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   src/editor/           │
                    │   manualParser.ts       │
                    └────────────┬────────────┘
                                 │
                      [ Custom Regex Parsing ]
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│ In-Memory Representation: Array of Hover / Auto-Complete Objects │
│                                                             │
│  {                                                          │
│    name: "dbCreateRect",                                    │
│    usage: "dbCreateRect( cvId layer bbox )",                │
│    description: "Creates a rectangular physical shape...",  │
│    example: "dbCreateRect(cvId list(\"M1\" \"drawing\") ...)"│
│  }                                                          │
└────────────────────────────┬────────────────────────────────┘
                             │
            [ Registers Language Providers with Monaco ]
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       MONACO EDITOR                         │
│                                                             │
│   ┌───────────────────────────┐ ┌─────────────────────────┐ │
│   │    Autocomplete Feed      │ │   Rich Hover Tooltip    │ │
│   │  Suggests signatures list │ │ Usage, Example, Details │ │
│   └───────────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3. Advanced Linter Checking Sequence
Every keypress in the IDE triggers a debounced linting cycle that checks syntax correctness, parentheses balance, and runs Levenshtein-distance spelling correctors:

```text
                   [ Editor Text Value Changed ]
                                │
                        (Debounce 300ms)
                                │
                                ▼
                   ┌──────────────────────────┐
                   │    Initialize Markers    │
                   └────────────┬───────────┬──┘
                                │           │
            ┌───────────────────┘           └──────────────────┐
            ▼                                                  ▼
┌───────────────────────┐                          ┌───────────────────────┐
│ Parentheses Stack     │                          │ Custom AST / Words    │
│ Validation            │                          │ Scanner               │
└───────────┬───────────┘                          └───────────┬───────────┘
            │                                                  │
   [ Loop Code Text ]                                  [ Scan identifiers ]
            │                                                  │
            ├─► '(' ─► Push Stack                              ├─► Cadence Prefix? (db, le, hi, ge, tech, rod)
            ├─► ')' ─► Pop Stack                               │   └──► Verify against 780+ dictionary functions
            │                                                  │
     (Stack Empty?)                                            ├─► Known function or local variable?
    /              \                                           │   └──► No ──► Run Levenshtein (Distance <= 3)
   /                \                                          │               ├──► Typo? Suggest Correction
  YES                NO                                        │               └──► Unknown: Mark Red Underline
  │                  │                                         │
┌─v────────┐   ┌─────v────┐                                    ├─► Check Parameter Counts
│ Valid    │   │ Error:   │                                    │   └──► Expected vs Passed Arguments mismatch
│ Brackets │   │ Mismatch │                                    │
└──────────┘   └─────┬────┘                                    └───────────────┬─────────────────────────┘
                     │                                                         │
                     └─────────────────────────┬───────────────────────────────┘
                                               │
                                               ▼
                                  ┌──────────────────────────┐
                                  │ Push Markers to Monaco   │
                                  │ (Red Underlines/Warnings)│
                                  └──────────────────────────┘
```

---

## ✨ Outstanding Features

- **🎯 Next-Gen Syntax Highlighting**: A custom Monarch tokenizer engineered specifically for Cadence SKILL. It highlights standard procedures, variable blocks, database pointers, and list constructs flawlessly.
- **⚡ Real-Time Debounced Linter**:
  - Live parenthesis matching via a strict stack tracker.
  - Variable-to-parameter count verification by matching calls against signature declarations.
  - Levenshtein-distance typo correction recommending real-world CAD API methods if you mistype them.
  - Cadence API prefix checker (`db`, `le`, `ge`, `hi`, `tech`, `rod`) keeping your code standardized.
- **📚 Dynamic Documentation Engine**: Seamlessly searches, filters, and loads descriptions for over 780 Cadence API functions.
- **🕵️ Expert Automated Code Refactoring**:
  - Automatically identifies missing `db*` API namespace qualifiers.
  - Cleans up and structures nested `let((var1 var2) ...)` lists according to best-practice formatting rules.
  - Suggests optimizing loop statements by replacing cluttered `foreach` loops with high-performance `mapcar` calls.
- **🐞 Active Step Debugger**: Set active breakpoints directly inside the gutter margin of Monaco, run step-by-step lines, and inspect dynamic variable bindings via a clean debug scope panel.

---

## 📂 Codebase Directory Index

```text
├── src/
│   ├── components/
│   │   ├── EditorPane.tsx          # Wrapper around Monaco Editor, housing the live linter
│   │   ├── Console.tsx             # Interactive, spellcheck-safe command shell & output panel
│   │   ├── RefactorDiffView.tsx    # Visual side-by-side comparison for suggested code refactors
│   │   ├── CodeOutlineSidebar.tsx  # Dynamic file content tree showing procedures, let blocks & loops
│   │   ├── FileExplorer.tsx        # In-browser file explorer with directory structuring & import/export
│   │   └── SearchSidebar.tsx       # Global search-and-replace tool targeting project scripts
│   ├── editor/
│   │   ├── monaco-config.ts        # Language definition, autocomplete feed, hover provider
│   │   ├── skillInterpreter.ts     # Client-side Lisp AST interpreter with step debugging
│   │   ├── manualParser.ts         # Dynamically builds interactive hover cards from manual.txt
│   │   ├── refactorEngine.ts       # Code scanning rules for automated improvements & fixes
│   │   └── utils.ts                # Levenshtein distance & custom function signature extractors
│   ├── data/
│   │   └── manual.txt              # Standard dictionary of 780+ Cadence functions & usage details
│   ├── App.tsx                     # Primary Application orchestrator, coordinating reactive states
│   └── index.css                   # Global styling rules & customized scrollbars / Monaco overrides
├── package.json                    # Application builds scripts and module dependencies
└── README.md                       # Comprehensive system documentation with illustrative charts
```

---

## 🧑‍💻 Developer Guide

### Prerequisites
- **Node.js** (v18 or higher is highly recommended)
- **npm** or **yarn**

### Quick Setup

1. **Clone the development repository:**
   ```bash
   git clone https://github.com/YongkaiZHANG/skillEditor.git
   cd skillEditor
   ```

2. **Install all package dependencies:**
   ```bash
   npm install
   ```

3. **Start the local Vite development server:**
   ```bash
   npm run dev
   ```

4. **Run the production compilation:**
   ```bash
   npm run build
   ```

---

## 📖 Appending the Documentation Manual

The intelligence behind Monaco's hover tooltips and autocomplete registry is powered entirely by the text database located in `src/data/manual.txt`.

To register a new custom API or standard Cadence function, append its signature to the text file using this standard format:

```text
@function dbCreateLabel
@usage dbCreateLabel(cvId layer bbox text justify orient font height)
@example dbCreateLabel(cv list("M1" "drawing") 0:0 "VSS" "centerLeft" "R0" "roman" 0.5)
@desc Creates a physical label element in the layout view on a specific layer with text parameters.
```

The system automatically parses and injects newly added functions on the fly—no rebuild required!

---

## 📄 License and Trademarks

This IDE is for educational and development purposes.
*Cadence*, *Virtuoso*, *SKILL*, and *SKILL++* are registered trademarks of Cadence Design Systems, Inc.
