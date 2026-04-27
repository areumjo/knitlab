# XSS Audit: Untrusted .knitlab Content

**Date:** 2026-04-26
**Verdict:** PASS — no fixes required before launching public design submissions.

## Threat model

knitlab will accept user-submitted `.knitlab` files via a public GitHub Issues gallery. When a viewer opens someone else's design, that file's contents are deserialized into `ApplicationState` and rendered. This audit checks whether a malicious submitter can weaponize any field to execute JS, exfiltrate data, or otherwise abuse the viewer's browser.

## Surfaces audited

| Surface | Source | Render method | Verdict |
|---|---|---|---|
| `StitchSymbolDisplay` SVG render (`components/StitchSymbolDisplay.tsx:21,38`) | `symbolDef.svgContent` from hardcoded `DEFAULT_STITCH_SYMBOLS` | `dangerouslySetInnerHTML` | PASS — SVG markup never comes from user data; `.knitlab` files reference symbols by ID only |
| Cell text content (`StitchSymbolDisplay.tsx:119,168,228-231`) | `cellData.value` (user-controlled) | React text content via `.charAt(0)` | PASS — React auto-escapes; only first char rendered |
| Key/sheet/layer names (`TopRibbon.tsx`, `SheetPanel.tsx`, `LayerPanel.tsx`) | `keyDef.name`, `sheet.name`, `layer.name` (user-controlled) | JSX text + `title` attrs | PASS — React escapes text and attributes |
| Color values (`backgroundColor`, `symbolColor`) | User-controlled per key | React `style={{}}` object | PASS — CSS-only channel, no DOM injection vector |
| Canvas SVG cache (`canvasUtils.ts:50,68`) | `symbolDef.svgContent` from constant | `img.src = data:image/svg+xml,...` | PASS — source is hardcoded, not user data |

## Negative results (no instances found)

- `innerHTML` / `outerHTML` / `insertAdjacentHTML` assignment with user data
- `eval()`, `new Function()`, string-form `setTimeout`/`setInterval`
- `href` / `src` / `window.location` driven by `.knitlab` fields (no `javascript:` URL vector)
- `document.write` / `document.createElement` with attribute injection

## When to re-audit

Re-run this audit if any of the following change:
- Custom keys gain free-form SVG markup (today they only use a fixed cell grid + symbol IDs)
- Any user-controlled string is rendered via `dangerouslySetInnerHTML`
- New URL-bearing fields are added to `KeyDefinition` or `Sheet` (e.g., link, image source)
- Color/style fields are widened to accept arbitrary CSS strings instead of color values
