# KnitLab

[![Deploy to GitHub Pages](https://github.com/areumjo/knitlab/actions/workflows/deploy.yml/badge.svg)](https://github.com/areumjo/knitlab/actions/workflows/deploy.yml)

KnitLab is a focused, static colorwork chart editor. It runs entirely in
the browser at [areumjo.github.io/knitlab](https://areumjo.github.io/knitlab/)
and does not require an account or backend.

## Product scope

- continuous pen, line, outline-rectangle, and flood-fill drawing
- reusable multi-color blocks
- selection, move, copy/paste, and undo/redo
- image-to-palette reduction
- browser autosave and editable `.knitlab` files
- exact one-pixel-per-cell PNG export
- versioned `ColorworkChartV1` JSON for Kniterate Studio

Hand-knit symbols, written instructions, garments, and machine generation are
not part of this product. Kniterate Studio owns yarn/carrier assignment,
backing strategies, validation, and `.kc` output.

See [`docs/COLORWORK_PRODUCT.md`](./docs/COLORWORK_PRODUCT.md) for the product
boundary and [`docs/COLORWORK_CHART_V1.md`](./docs/COLORWORK_CHART_V1.md) for the
interchange contract.

## Development

```bash
npm ci
npm run dev
npm run verify
```

`npm run verify` runs TypeScript, focused editor/contract tests, and the
production Vite build. Pull requests run the same gate plus browser acceptance;
pushing `main` deploys the verified static build to the `gh-pages` branch.
