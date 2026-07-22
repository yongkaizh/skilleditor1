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
            ├─► ')' ─► Pop Stack                               │   └──► Verify against 760+ dictionary functions
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
- **📚 Dynamic Documentation & Function Explorer**: Search, filter, and inspect over 760+ Cadence SKILL API functions with real-time category filtering (Database Access, Layout, UI, IPC, CDF, Schematic, Graphics, etc.), prefix chips (`db*`, `le*`, `ge*`, `hi*`, `sch*`, `cdf*`, `ipc*`), flat/grouped view modes, and 1-click code insertion.
- **🕵️ Expert Automated Code Refactoring**:
  - Automatically identifies missing `db*` API namespace qualifiers.
  - Cleans up and structures nested `let((var1 var2) ...)` lists according to best-practice formatting rules.
  - Suggests optimizing loop statements by replacing cluttered `foreach` loops with high-performance `mapcar` calls.
- **🐞 Active Step Debugger**: Set active breakpoints directly inside the gutter margin of Monaco, run step-by-step lines, and inspect dynamic variable bindings via a clean debug scope panel.

---

## ⚙️ Compiler & Interpreter Architecture: How It Works

The Cadence SKILL Web IDE includes a client-side compiler and AST interpreter (`src/editor/skillInterpreter.ts`) designed specifically to handle both **Lisp S-expression syntax** `(procedure (add a b) (plus a b))` and **C-style infix algebraic syntax** `procedure(add(a b) a + b)` used in Cadence Virtuoso environments.

```mermaid
flowchart TD
    A[SKILL Source Code<br/>Lisp or Infix C-style] --> B[1. Lexical Analysis<br/>tokenize]
    B -->|Token Stream| C[2. Infix & Arrow Resolver<br/>Transform to S-Expressions]
    C -->|Canonical S-Exprs| D[3. AST Parser<br/>parseCode]
    D -->|Abstract Syntax Tree| E[4 & 5. Interpreter Engine<br/>evalExpr]

    subgraph Scope & Environment Model
        G[Global Environment<br/>StdLib & Cadence DB Stubs]
        L[Local Lexical Frame<br/>let / prog / procedure scope]
        G <--> L
    end

    E <--> Scope & Environment Model

    E --> F{Breakpoint Line?}
    F -- Yes --> H[6. Interactive Debugger<br/>Pause Promise & Scope Inspection]
    H -->|Step / Resume| E
    F -- No --> I[Execution Output<br/>Console & Return Values]
```

### 1. Lexical Analysis (Tokenizer)
The `tokenize(code: string)` function scans raw source code sequentially and converts it into a typed array of tokens:
- **Comments**: Strips single-line `; ...` and block `/* ... */` comments while preserving line number tracking for debugging.
- **Literals**: Identifies string constants `"..."` (supporting `\n`, `\t`, `\"` escapes) and numeric literals (both integers like `42` and floating point numbers like `3.1415`).
- **Symbols & Keywords**: Captures variable symbols, function identifiers, and reserved constructs (`let`, `prog`, `procedure`, `defun`, `if`, `when`, `unless`, `cond`, `case`, `foreach`, `while`, `for`, `return`, `go`, `quote`).
- **Operators**: Processes binary math operators (`+`, `-`, `*`, `/`), logical/relational operators (`==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`), unary incrementors (`++`, `--`), and Cadence object field selectors (`~>`, `->`).
- **Punctuation**: Groups nested parens `()`, brackets `[]`, colon point pairs (`x:y`), and quote prefixes (`'`).

### 2. Syntax Transformation & Infix Resolution
SKILL code mixes Lisp and C-style notations. Before or during AST node creation, algebraic infix operations (`a + b * c`) and arrow field accesses (`cv~>instances~>cellName`) are transformed into canonical S-expressions:
- Infix expressions `a = b + c` convert to `(setq a (plus b c))`.
- Property access `obj~>prop` converts to `(dbGetq obj prop)`.
- Property assignment `obj~>prop = val` converts to `(dbSetq obj prop val)`.

### 3. Abstract Syntax Tree (AST) Parsing
The `parseCode(code: string)` function converts the flat token stream into a nested Abstract Syntax Tree made of strongly typed node objects:
- **Primitive Nodes**: `NumberNode` (`{ type: 'number', value: N }`), `StringNode` (`{ type: 'string', value: S }`), and `SymbolNode` (`{ type: 'symbol', name: S }`).
- **List / S-Expression Nodes**: `ListNode` (`{ type: 'list', elements: ASTNode[] }`), where the first element denotes the operator, special keyword, or target function symbol.

### 4. Scope & Environment Binding Model
Variable lifetime and scoping are managed by the `Environment` class:
- **Lexical Chains**: Each environment holds a pointer to its `parent` environment, creating a lookup cascade from local block scope up to global scope.
- **Global Scope**: Pre-loaded with standard library functions (`car`, `cdr`, `list`, `append`, `member`, `assoc`, `printf`, `sprintf`, etc.) and simulated Cadence database primitives (`dbOpenCellViewByType`, `dbCreateRect`, `dbCreateInst`, `dbSave`, `dbGetq`, etc.).
- **Local Scope Creation**: Entering a `let((x 1) (y 2)) ...` or `prog(...)` block creates a isolated child environment frame.
- **Function Closures**: When a `procedure` or `defun` is defined, it captures its definition environment, supporting lexically scoped closures.

### 5. Recursive Evaluation Engine (`evalExpr`)
The interpreter evaluates AST nodes recursively within the current `Environment`:
- **Special Forms**:
  - `let` / `prog`: Binds local variable pairs in a new child environment and evaluates body expressions sequentially.
  - `procedure` / `defun`: Binds a function closure object mapping parameter symbols to the function body.
  - `if` / `when` / `unless` / `cond` / `case`: Evaluates conditions lazily and executes only the taken branch.
  - `foreach` / `while` / `for`: Evaluated in a loop cycle, updating the iteration variable in the local environment frame.
- **Function Application**:
  1. Evaluates all argument AST nodes to produce concrete values.
  2. Binds values to procedure parameter names in a newly instantiated call frame.
  3. Executes procedure body statements and returns the final evaluated expression or explicit `return()` result.

### 6. Interactive Step Debugger Runtime
The evaluation loop integrates directly with Monaco breakpoints:
- Before evaluating an AST expression, the engine checks if the expression's line number exists in the active `breakpoints: Set<number>`.
- If a breakpoint matches, execution suspends using an internal `Promise`.
- The IDE UI highlights the paused code line, updates the call stack display, and populates the **Variables Panel** with current scope bindings from `env.vars`.
- Clicking **Step Over**, **Step Into**, or **Continue** resolves the Promise, allowing `evalExpr` to resume execution smoothly.

---

## 📂 Codebase Directory Index

```text
├── src/
│   ├── components/
│   │   ├── EditorPane.tsx          # Wrapper around Monaco Editor, housing the live linter
│   │   ├── DocumentationPortal.tsx # Searchable Function Explorer modal & panel with category/prefix filters
│   │   ├── Debugger.tsx            # Step-by-step debugger with scope variable inspector and call stack
│   │   ├── Console.tsx             # Interactive, spellcheck-safe command shell & output panel
│   │   ├── RefactorDiffView.tsx    # Visual side-by-side comparison for suggested code refactors
│   │   ├── CodeOutlineSidebar.tsx  # Dynamic file content tree showing procedures, let blocks & loops
│   │   ├── FileExplorer.tsx        # In-browser file explorer with directory structuring & import/export
│   │   ├── FunctionNavigator.tsx   # Rapid workspace symbol & procedure locator
│   │   ├── ChallengeHub.tsx        # SKILL practice problems with automatic code validation
│   │   ├── TemplateGallery.tsx     # Standard IC design script templates (DRC, LVS, PCells)
│   │   └── SearchSidebar.tsx       # Global search-and-replace tool targeting project scripts
│   ├── editor/
│   │   ├── monaco-config.ts        # Language definition, autocomplete feed, hover provider
│   │   ├── skillInterpreter.ts     # Client-side Lisp AST interpreter with step debugging
│   │   ├── manualParser.ts         # Dynamically builds function registry & category maps from manual.txt
│   │   ├── refactorEngine.ts       # Code scanning rules for automated improvements & fixes
│   │   └── utils.ts                # Levenshtein distance & custom function signature extractors
│   ├── data/
│   │   └── manual.txt              # Standard dictionary of 760+ Cadence functions & usage details
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

The intelligence behind Monaco's hover tooltips, autocomplete registry, and Function Explorer is powered entirely by the text database located in `src/data/manual.txt`.

To register a new custom API or standard Cadence function, append its signature to the text file using this standard format:

```text
@function dbCreateLabel
@usage dbCreateLabel(cvId layer bbox text justify orient font height)
@category Database Access
@parameters
cvId: Target cellview ID.
layer: Layer purpose pair e.g. ("M1" "drawing").
bbox: Point list or bounding box.
text: Label string content.
@example
dbCreateLabel(cv list("M1" "drawing") 0:0 "VSS" "centerLeft" "R0" "roman" 0.5)
@desc
Creates a physical label element in the layout view on a specific layer with text parameters.
```

The system automatically parses and injects newly added functions on the fly—no rebuild required!

---

## 📄 License and Trademarks

This IDE is for educational and development purposes.
*Cadence*, *Virtuoso*, *SKILL*, and *SKILL++* are registered trademarks of Cadence Design Systems, Inc.
