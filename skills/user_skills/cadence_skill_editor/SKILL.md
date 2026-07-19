---
name: cadence-skill-editor
description: Guidelines and architectural context for the Cadence SKILL Editor IDE project.
---

# Cadence SKILL Editor

This skill provides context and guidelines for working on the Cadence SKILL Editor.

## Architecture
- **App/Layout**: A React SPA using Tailwind CSS for styling.
- **Monaco Editor Integration**: `src/editor/monaco-config.ts` configures the Monaco editor to support the Cadence SKILL language, providing syntax highlighting (Monarch), autocompletion, and hover information.
- **Linter**: `src/components/EditorPane.tsx` implements a live debounced linter detecting parenthesis mismatches (using a stack) and typos in function names (Levenshtein distance).
- **Manual Data**: `src/data/manual.txt` contains SKILL function signatures, parsed by `src/editor/manualParser.ts` for editor features.

## Styling Standardization
The project uses Tailwind CSS.
- Adhere strictly to the Tailwind utility classes.
- The UI follows a dark theme (`bg-[#0b0c10]`, `bg-[#12141a]`) with `indigo-500` accents.

## Potential Improvements & Known Bugs
- Ensure `registerSkillLanguage` does not fail on remounts.
- Linter debounce is crucial for performance.
