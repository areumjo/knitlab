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
- `services/colorworkMutationService.ts`: atomic paint/fill/clear/move/paste
- `components/KnitCanvas.tsx`: grid rendering and pointer interactions
- `components/BlockEditorModal.tsx`: reusable multi-color tile definitions
- `services/colorworkExportService.ts`: exact PNG and `ColorworkChartV1` export
- `lib/colorworkState.ts`: rejects legacy symbol/no-stitch state on load
- `services/serializationService.ts`: editable `.knitlab` save/open

All committed chart edits must cross `colorworkMutationService`. Keep machine,
yarn, carrier, garment, instructions, and publishing concerns out of this repo.
