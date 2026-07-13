# ColorworkChartV1

This is the file seam between KnitLab and Kniterate Studio. The canonical
machine-readable definition is
[`schemas/colorwork-chart-v1.schema.json`](../schemas/colorwork-chart-v1.schema.json).

- `cells` is a dense rectangular grid stored in visual top-to-bottom,
  left-to-right order.
- Each cell is an integer index into the ordered `palette`.
- `rowNumbering` records whether displayed row 1 is at the bottom or top.
- Every cell has an exact six-digit sRGB color. Transparency and no-stitch are
  not part of v1.
- Multi-color tiles are flattened on export; tile identity remains in the
  editable `.knitlab` source.
- Yarn, carrier, gauge, backing, fabric, and machine settings do not belong in
  this artifact.
- KnitLab does not impose a machine carrier limit. Studio validates the
  imported palette against the selected machine workflow.

The companion PNG follows the same visual row order. At one pixel per cell its
dimensions equal the chart dimensions and its pixels use only palette colors.
It contains no grid, labels, symbols, gutters, transparency, or antialiasing.

