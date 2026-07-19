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
