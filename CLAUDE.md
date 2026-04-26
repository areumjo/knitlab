# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Knitlab is a browser-based knitting chart design tool - think "Figma for knitting". It's a static-first SPA (no backend) that runs entirely in the browser, deployed to GitHub Pages. Users manually save/load their work via JSON export/import.

**Tech Stack:** React + TypeScript, Vite, Tailwind CSS (via CDN in index.html)

## Commands

**Development:**
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (usually http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
```

**Deployment:** Pushing to `main` triggers automatic deployment to GitHub Pages via `.github/workflows/deploy.yml`

## Architecture

### State Management Philosophy

The entire application follows a **single state object + top-down flow** pattern:

1. **All state lives in `App.tsx`** - managed by the custom `useChartHistory` hook
2. **State updates must use the correct method:**
   - `recordChange(...)` - for undoable changes (almost everything)
   - `updateCurrentState(...)` - for transient UI changes that shouldn't create history entries (e.g., theme toggle)
3. **Components receive data and callbacks as props** - no external state management libraries

### Source of Truth vs. Derived Data

Critical distinction in the data model:

- **`keyPlacements` (array of `KeyInstance`)** = SOURCE OF TRUTH
  - The canonical representation of what's on the canvas
  - Each `KeyInstance` records which key (`keyId`) is at what position (`anchor`)

- **`grid` (2D ChartGrid)** = DERIVED DATA
  - Built on-demand from `keyPlacements` via `buildGridFromKeyPlacements`
  - Used for fast lookups during rendering/interaction
  - Never modify directly - always update `keyPlacements` and rebuild

### Key Files

Start here to understand the codebase:

1. **`types.ts`** - Core data structures. Read this first to understand the domain model (`ApplicationState`, `ChartState`, `Layer`, `KeyDefinition`)
2. **`App.tsx`** - Root component, owns all state and feature logic (large file ~2000 lines)
3. **`hooks/useChartHistory.ts`** - The state management engine powering undo/redo
4. **`components/KnitCanvas.tsx`** - Most complex component, handles canvas rendering and user input
5. **`components/KeyEditorModal.tsx`** - Self-contained complex UI for creating/editing custom stitch symbols
6. **`services/exportService.ts`** - Handles JPG export by rendering to off-screen canvas
7. **`canvasUtils.ts`** - Performance optimizations via symbol caching

### Important Patterns

**When updating state in `App.tsx`:**
```typescript
// DO: Wrap undoable changes
recordChange(prevState => ({
  ...prevState,
  sheets: updatedSheets
}));

// DON'T: Direct mutation
currentState.sheets = updatedSheets;
```

**When working with layers:**
- Always update `keyPlacements` (source of truth)
- The `grid` will be rebuilt automatically from `keyPlacements`

## Development Notes

- **Styling:** All styling uses Tailwind CSS. Config is in `index.html` (not a separate tailwind.config.js)
- **No tests:** The project currently has no test suite
- **No backend:** All processing (image quantization, instruction generation, exports) happens client-side
- **Data persistence:** Users manually export/import JSON files - there's no auto-save or cloud storage
