# KnitLab Chart

**Status: active product migration, 2026-07-09.** KnitLab is becoming a focused
colorwork chart editor that runs entirely in the browser and deploys as a
static GitHub Pages site.

## Product promise

Make exact colorwork charts beautifully. KnitLab Chart owns cell-level drawing,
palettes, reusable multi-color tiles, image reduction, transforms, persistence,
and portable export. It does not generate knitting instructions or machine
programs.

## Keep from the evolved editor

- `KnitCanvas` interaction and rendering behavior
- color palette editing and custom multi-color blocks
- mutation service overlap/ownership rules
- selection, fill, copy/paste, move, mirror, repeat, and undo/redo
- image intake and explicit palette reduction
- `.knitlab` persistence, migration, and browser autosave
- exact one-pixel-per-cell PNG export

The evolved implementations currently live in `knitlab2/reference/knitlab` and
are the behavior donor. This repository remains the product home and GitHub
Pages deployment target. Code is brought over behind focused behavior tests;
the old frozen editor is not extended independently.

## Remove from the product

- hand-knit stitch symbols and semantic stitch operations
- Kniterate mode, machine export, visualizer, swatches, and run artifacts
- garments, shaping, measurements, instructions, and publication surfaces
- stitch maps, Explore/publishing workflow, and backend assumptions

## File boundary

- `.knitlab` is the editable source and may retain editor concepts such as
  reusable tile identity.
- `ColorworkChartV1` JSON is the flattened interchange artifact consumed by
  Kniterate Studio.
- exact PNG is a companion export: visual top-to-bottom, one pixel per cell,
  exact palette colors, no antialiasing or decoration.

See [`COLORWORK_CHART_V1.md`](./COLORWORK_CHART_V1.md) for the contract.

## Delivery sequence

1. Contract and compatibility fixtures.
2. Tested extraction of the evolved colorwork core.
3. New single-purpose `ColorworkApp` shell.
4. Static build and GitHub Pages proof.
5. Standalone author/save/reopen/export product gate.
6. Kniterate Studio import and combined end-to-end gate.

