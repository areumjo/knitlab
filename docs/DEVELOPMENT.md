# Development

## Local workflow

```bash
npm ci
npm run dev
npm run verify
```

Vite serves the app locally and builds it with the `/knitlab/` base used by
GitHub Pages. `npm run verify` runs strict TypeScript, Vitest, and a production
build. The deploy workflow runs the same gate before publishing `dist/`.

## Code orientation

- `App.tsx`: application shell and state orchestration
- `lib/colorworkTools.ts`: pure pen/line/rectangle/flood-fill geometry
- `services/colorworkMutationService.ts`: owner-aware paint/clear/move/paste commits
- `components/KnitCanvas.tsx`: grid rendering and pointer interactions
- `components/BlockEditorModal.tsx`: reusable multi-color tile definitions
- `services/colorworkExportService.ts`: exact PNG and `ColorworkChartV1` export
- `lib/colorworkState.ts`: rejects legacy symbol/no-stitch state on load
- `services/serializationService.ts`: editable `.knitlab` save/open

All committed chart edits must cross `colorworkMutationService`; gesture
previews stay local to `KnitCanvas` and never enter history or autosave. Keep machine,
yarn, carrier, garment, instructions, and publishing concerns out of this repo.
