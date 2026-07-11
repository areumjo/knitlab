# Editable project serialization

`.knitlab` is KnitLab Chart's editable source format. It stores sheets, layers,
ordered color definitions, reusable multi-color blocks, and sparse placements.
The derived cell grid is rebuilt when a project opens.

The format pipeline is:

```text
ApplicationState -> MessagePack -> DEFLATE -> base64
```

`services/serializationService.ts` writes format version 2 and still accepts
legacy JSON and earlier compressed files. Every file and autosave passes through
`lib/colorworkState.ts`; symbol keys, no-stitch cells, lines, and publication
metadata are discarded rather than exposed by the colorwork product.

The `.knitlab` format is private editable state. The stable integration seam is
the separate `ColorworkChartV1` JSON artifact documented in
[`COLORWORK_CHART_V1.md`](./COLORWORK_CHART_V1.md).
