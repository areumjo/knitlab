# KnitLab

**Status: MVP release candidate.** KnitLab is a focused colorwork editor
that runs entirely in the browser and deploys as a static GitHub Pages site.

## MVP promise

Make exact colorwork charts without hand-knit or machine-programming concepts.
The MVP supports:

- continuous pen strokes plus line, outline-rectangle, and flood-fill tools
- solid colors and reusable multi-color blocks
- selection, whole-owner move, copy/paste, and selection fill
- layers, sheets, row/column editing, zoom, pan, and undo/redo
- image intake with explicit palette reduction
- editable `.knitlab` save/open and browser autosave
- exact one-pixel-per-cell PNG and `ColorworkChartV1` JSON export

Line, rectangle, and flood fill operate on solid 1x1 colors. Reusable blocks
remain available as pen stamps and selection-fill tiles. Copy, cut, and move
include only block owners fully contained by the selection; pixel-level paint
or clear operations remove an entire block owner when any of its cells is
touched.

Mirror, directional repeat, filled-rectangle mode, and rotation are post-MVP.
They require an explicit reusable-block identity contract before entering the
editor.

## Product boundary

KnitLab does not contain:

- hand-knit stitch symbols or written instructions
- garments, shaping, measurements, or publication workflows
- Kniterate modes, carrier assignment, backing strategies, validation, or `.kc`
- Explore, publishing, accounts, or backend assumptions

The evolved editor in the sibling `knitlab2/reference/knitlab` tree remains
extraction provenance, not a promise that every historical behavior ships here.

## File boundary

- `.knitlab` is the editable source and preserves reusable block identity.
- `ColorworkChartV1` JSON is the flattened interchange artifact consumed by
  Kniterate Studio.
- exact PNG is a companion export: visual top-to-bottom, one pixel per cell,
  exact palette colors, and no antialiasing or decoration.

See [`COLORWORK_CHART_V1.md`](./COLORWORK_CHART_V1.md) for the interchange
contract.

## MVP release gate

1. Author with every drawing tool and undo each gesture atomically.
2. Create, place, copy, move, save, and reopen a reusable color block.
3. Import an image and reduce it to an explicit palette.
4. Export exact JSON and PNG from the authored chart.
5. Pass unit, production-build, and desktop/mobile browser acceptance checks.
6. Deploy from `main` and repeat the author/save/reopen/export flow publicly.
