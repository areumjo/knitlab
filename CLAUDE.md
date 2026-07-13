# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KnitLab Chart is a colorwork-only chart editor. It is a static SPA with no
backend, deployed to GitHub Pages. The product owns exact cell colors,
multi-color blocks, image reduction, `.knitlab` persistence, browser autosave,
and exact JSON/PNG export. Do not add hand-knit symbols, instructions,
garments, or machine behavior to the product surface.

**Tech Stack:** React + TypeScript, Vite, Tailwind CSS (bundled via PostCSS, see `tailwind.config.cjs`)

## Commands

**Development:**
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (usually http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run typecheck  # TypeScript only
npm test           # Focused contract/persistence tests
npm run test:e2e  # Desktop/mobile browser acceptance
npm run verify     # TypeScript + tests + production build
```

**Deployment:** Pushing to `main` triggers automatic deployment to GitHub Pages via `.github/workflows/deploy.yml`

## Architecture

### State Management Philosophy

The entire application follows a **single state object + top-down flow** pattern:

1. **All editor state lives in `App.tsx`** - managed by the custom `useChartHistory` hook
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
5. **`components/BlockEditorModal.tsx`** - Reusable multi-color tile authoring
6. **`services/colorworkExportService.ts`** - Flattened JSON + exact PNG export
7. **`lib/colorworkTools.ts`** - Pure drawing-tool geometry
8. **`canvasUtils.ts`** - Performance optimizations via symbol caching
9. **`lib/colorwork-chart-v1.ts`** - Untrusted-file parser for the Studio handoff

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

- **Styling:** All styling uses Tailwind CSS, bundled via PostCSS. Config is in `tailwind.config.cjs`
- **No backend:** image quantization, persistence, and exports all run client-side
- **Data persistence:** browser autosave plus explicit `.knitlab` download/open
- **Drawing previews:** keep gesture previews local to `KnitCanvas`; commit once
  through `colorworkMutationService` on pointer release
- **Interchange:** keep `schemas/colorwork-chart-v1.schema.json` and the shared
  four-color fixture byte-identical with the Kniterate Studio copy
