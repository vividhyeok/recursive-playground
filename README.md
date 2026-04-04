# Recursive Playground

Recursive Playground is a client-side learning tool for recursion built with React and Vite. Students solve three scaffolded recursion challenges, switch between Blockly and Python, and watch each run animate from a Pyodide execution trace.

## Stages

- Stage 1: Factorial visualizes a single call stack growing downward and returning upward.
- Stage 2: Fibonacci visualizes binary recursion as a branching call tree.
- Stage 3: Tower of Hanoi uses Three.js to animate disk moves in 3D with a live call stack sidebar.

## Features

- Blockly and Python editing modes on every stage
- Best-effort Blockly regeneration from Python edits
- In-browser Python execution through Pyodide
- Trace-driven animation replay with `Run` and `Step`
- localStorage persistence for code and unlocked stages
- Desktop-first responsive layout

## Tech Stack

- React + Vite
- Blockly
- Pyodide
- Three.js
- Plain CSS

## Setup

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually `http://127.0.0.1:5173`.

## Build

```bash
npm run build
npm run preview
```

## Notes

- Everything runs in the browser. There is no backend.
- Student progress is stored in localStorage with the `rp_*` keys.
- Pyodide loads from the jsDelivr CDN on first use, so the first run needs network access before the browser cache can help offline use.
