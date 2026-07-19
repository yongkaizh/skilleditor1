# Cadence SKILL Editor Project Guidelines

## Overview
This project is an in-browser IDE for **Cadence SKILL**, a Lisp-like dialect used heavily in Electronic Design Automation (EDA), specifically Cadence Virtuoso.

## Features
- **Monaco Editor Integration**: Custom token provider, autocomplete, and quick fixes specifically for the SKILL language.
- **Advanced Linter**:
  - Live parenthesis matching via a stack algorithm.
  - Typo detection for keywords and standard library functions using Levenshtein distance.
  - Cadence API specific prefix checks (`db`, `le`, `ge`, `hi`, `tech`, `rod`).
- **Dynamic Manual Parsing**: Loads and parses `manual.txt` dynamically to provide hover documentation and autocomplete suggestions on the fly.
- **Snippets & Templates**: Interactive tools to insert boilerplate SKILL code into the editor.

## Architecture
- `src/editor/monaco-config.ts`: Core Monaco configuration, including Monarch syntax, auto-completion logic, hover provider, and Code Actions.
- `src/components/EditorPane.tsx`: The primary wrapper around the `<Editor>` component. Contains the debounced linter effect.
- `src/editor/manualParser.ts`: Parses custom `@function` annotations from `manual.txt` into a structured array of functions.
- `src/data/manual.txt`: The raw database of Cadence SKILL function signatures and descriptions.

## Guidelines for Future Enhancements
- **Linter Performance**: Ensure any new AST parsing or string distance checks are properly debounced. The linter can be computationally expensive on large SKILL scripts.
- **Syntax Highlighting**: Extend the Monarch tokens in `monaco-config.ts` if adding support for newer SKILL++ (object-oriented) paradigms.
- **Styling**: Standardize UI using Tailwind CSS utility classes moving forward, replacing raw CSS in `index.css`.
