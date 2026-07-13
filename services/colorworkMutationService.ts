import {
  buildGridFromKeyPlacements,
  calculateFootprint,
  doFootprintsOverlap,
  KEY_ID_KNIT_DEFAULT,
} from '../constants';
import type {
  KeyDefinition,
  KeyInstance,
  Layer,
  Point,
  SelectionRect,
} from '../types';

export interface ColorworkMutationOp {
  key: KeyDefinition;
  anchor: Point;
}

interface MutationInput {
  layer: Layer;
  ops: readonly ColorworkMutationOp[];
  chartRows: number;
  chartCols: number;
  palette: readonly KeyDefinition[];
}

interface SolidMutationInput extends Omit<MutationInput, 'ops'> {
  key: KeyDefinition;
  points: readonly Point[];
}

export type ColorworkMutationResult =
  | { ok: true; layer: Layer }
  | { ok: false; reason: string };

interface MoveInput extends Omit<MutationInput, 'ops'> {
  relativeKeyInstances: readonly KeyInstance[];
  sourceOrigin: Point;
  targetOrigin: Point;
}

interface PasteInput extends MutationInput {
  clearRegion?: SelectionRect | null;
}

type Footprint = ReturnType<typeof calculateFootprint>;

function keyForOp(
  op: ColorworkMutationOp,
  palette: readonly KeyDefinition[],
): KeyDefinition | null {
  const key = palette.find((candidate) => candidate.id === op.key.id);
  if (!key || !Number.isInteger(key.width) || !Number.isInteger(key.height) || key.width < 1 || key.height < 1) {
    return null;
  }
  return key;
}

function isWithinChart(footprint: Footprint, rows: number, cols: number): boolean {
  return footprint.minR >= 0 && footprint.minC >= 0 && footprint.maxR < rows && footprint.maxC < cols;
}

function normalizedFootprint(selection: SelectionRect): Footprint {
  return {
    minR: Math.min(selection.start.y, selection.end.y),
    maxR: Math.max(selection.start.y, selection.end.y),
    minC: Math.min(selection.start.x, selection.end.x),
    maxC: Math.max(selection.start.x, selection.end.x),
  };
}

function footprintContains(outer: Footprint, inner: Footprint): boolean {
  return inner.minR >= outer.minR && inner.maxR <= outer.maxR &&
    inner.minC >= outer.minC && inner.maxC <= outer.maxC;
}

function footprintForPlacement(
  placement: KeyInstance,
  palette: readonly KeyDefinition[],
): Footprint | null {
  const key = palette.find((candidate) => candidate.id === placement.keyId);
  return key ? calculateFootprint(placement.anchor, key) : null;
}

/** Returns only complete placement owners contained by a selection. */
export function placementsFullyContainedInRegion(
  layer: Layer,
  selection: SelectionRect,
  palette: readonly KeyDefinition[],
): KeyInstance[] {
  const region = normalizedFootprint(selection);
  return layer.keyPlacements.filter((placement) => {
    const footprint = footprintForPlacement(placement, palette);
    return footprint ? footprintContains(region, footprint) : false;
  });
}

/** Removes an explicit set of placement owners without touching partial neighbours. */
export function removeColorworkPlacements(
  layer: Layer,
  placementsToRemove: readonly KeyInstance[],
  chartRows: number,
  chartCols: number,
  palette: readonly KeyDefinition[],
): Layer {
  const owners = new Set(placementsToRemove.map((placement) =>
    `${placement.keyId}:${placement.anchor.x}:${placement.anchor.y}`,
  ));
  const placements = layer.keyPlacements.filter((placement) =>
    !owners.has(`${placement.keyId}:${placement.anchor.x}:${placement.anchor.y}`),
  );
  return {
    ...layer,
    keyPlacements: placements,
    grid: buildGridFromKeyPlacements(placements, chartRows, chartCols, [...palette]),
  };
}

/**
 * The one commit boundary for chart paint. It validates the entire batch before
 * editing, treats a reusable block as one owner, and rebuilds the grid once.
 */
export function commitColorworkMutation(input: MutationInput): ColorworkMutationResult {
  const { layer, ops, chartRows, chartCols, palette } = input;
  const validatedOps: ColorworkMutationOp[] = [];

  for (const op of ops) {
    const key = keyForOp(op, palette);
    if (!key) {
      return { ok: false, reason: `Unknown or invalid colorwork key: ${op.key.id}` };
    }
    const canonicalOp = { key, anchor: { ...op.anchor } };
    if (!isWithinChart(calculateFootprint(canonicalOp.anchor, key), chartRows, chartCols)) {
      return {
        ok: false,
        reason: `Can't paint "${key.name}" at row ${op.anchor.y + 1}, col ${op.anchor.x + 1}: the tile would extend off the chart.`,
      };
    }
    validatedOps.push(canonicalOp);
  }

  let placements = layer.keyPlacements.filter((placement) =>
    palette.some((key) => key.id === placement.keyId),
  );

  for (const op of validatedOps) {
    const incomingFootprint = calculateFootprint(op.anchor, op.key);
    placements = placements.filter((placement) => {
      const existingFootprint = footprintForPlacement(placement, palette);
      return !existingFootprint || !doFootprintsOverlap(incomingFootprint, existingFootprint);
    });

    // Natural is the implicit canvas background, so clearing never creates
    // hundreds of redundant 1x1 placements.
    if (op.key.id !== KEY_ID_KNIT_DEFAULT) {
      placements.push({ keyId: op.key.id, anchor: { ...op.anchor } });
    }
  }

  return {
    ok: true,
    layer: {
      ...layer,
      keyPlacements: placements,
      grid: buildGridFromKeyPlacements(placements, chartRows, chartCols, [...palette]),
    },
  };
}

/** Efficient owner-aware batch paint for a solid 1x1 color. */
export function commitSolidColorMutation(input: SolidMutationInput): ColorworkMutationResult {
  const { layer, key, points, chartRows, chartCols, palette } = input;
  const canonicalKey = palette.find((candidate) => candidate.id === key.id);
  if (!canonicalKey || canonicalKey.width !== 1 || canonicalKey.height !== 1) {
    return { ok: false, reason: 'Solid-color tools require a 1x1 color.' };
  }

  const uniquePoints = new Map<string, Point>();
  for (const point of points) {
    if (point.x < 0 || point.x >= chartCols || point.y < 0 || point.y >= chartRows) continue;
    uniquePoints.set(`${point.x}:${point.y}`, { ...point });
  }
  if (uniquePoints.size === 0) return { ok: true, layer };

  const touched = new Set(uniquePoints.keys());
  const placements = layer.keyPlacements.filter((placement) => {
    const footprint = footprintForPlacement(placement, palette);
    if (!footprint) return false;
    for (let y = footprint.minR; y <= footprint.maxR; y += 1) {
      for (let x = footprint.minC; x <= footprint.maxC; x += 1) {
        if (touched.has(`${x}:${y}`)) return false;
      }
    }
    return true;
  });

  if (canonicalKey.id !== KEY_ID_KNIT_DEFAULT) {
    for (const point of uniquePoints.values()) {
      placements.push({ keyId: canonicalKey.id, anchor: point });
    }
  }

  return {
    ok: true,
    layer: {
      ...layer,
      keyPlacements: placements,
      grid: buildGridFromKeyPlacements(placements, chartRows, chartCols, [...palette]),
    },
  };
}

/** Clears every complete placement owner touched by a rectangular region. */
export function clearColorworkRegion(
  layer: Layer,
  selection: SelectionRect,
  chartRows: number,
  chartCols: number,
  palette: readonly KeyDefinition[],
): Layer {
  const region = normalizedFootprint(selection);
  const placements = layer.keyPlacements.filter((placement) => {
    const footprint = footprintForPlacement(placement, palette);
    return !footprint || !doFootprintsOverlap(region, footprint);
  });
  return {
    ...layer,
    keyPlacements: placements,
    grid: buildGridFromKeyPlacements(placements, chartRows, chartCols, [...palette]),
  };
}

/** Builds a batch of whole-tile anchors that fit fully inside a selection. */
export function opsForTiledSelection(
  selection: SelectionRect,
  key: KeyDefinition,
): ColorworkMutationOp[] {
  const region = normalizedFootprint(selection);
  const ops: ColorworkMutationOp[] = [];
  for (let y = region.minR; y + key.height - 1 <= region.maxR; y += key.height) {
    for (let x = region.minC; x + key.width - 1 <= region.maxC; x += key.width) {
      ops.push({ key, anchor: { x, y } });
    }
  }
  return ops;
}

/** Moves explicit color placements as an all-or-nothing operation. */
export function moveColorworkPlacements(input: MoveInput): ColorworkMutationResult {
  const {
    layer,
    relativeKeyInstances,
    sourceOrigin,
    targetOrigin,
    chartRows,
    chartCols,
    palette,
  } = input;
  const moving = relativeKeyInstances.filter((instance) => instance.keyId !== KEY_ID_KNIT_DEFAULT);
  const ops: ColorworkMutationOp[] = [];

  for (const instance of moving) {
    const key = palette.find((candidate) => candidate.id === instance.keyId);
    if (!key) return { ok: false, reason: `Unknown colorwork key: ${instance.keyId}` };
    ops.push({
      key,
      anchor: {
        x: targetOrigin.x + instance.anchor.x,
        y: targetOrigin.y + instance.anchor.y,
      },
    });
  }

  // Preflight destinations against the original layer before touching sources.
  const preflight = commitColorworkMutation({ layer, ops, chartRows, chartCols, palette });
  if (!preflight.ok) return preflight;

  const sourceOwners = new Set(moving.map((instance) =>
    `${instance.keyId}:${sourceOrigin.x + instance.anchor.x}:${sourceOrigin.y + instance.anchor.y}`,
  ));
  const sourceClearedPlacements = layer.keyPlacements.filter((placement) =>
    !sourceOwners.has(`${placement.keyId}:${placement.anchor.x}:${placement.anchor.y}`),
  );
  const sourceClearedLayer: Layer = { ...layer, keyPlacements: sourceClearedPlacements };
  return commitColorworkMutation({ layer: sourceClearedLayer, ops, chartRows, chartCols, palette });
}

/** Clears an optional target region and applies a paste batch atomically. */
export function pasteColorworkPlacements(input: PasteInput): ColorworkMutationResult {
  const { clearRegion, ...mutationInput } = input;
  const preflight = commitColorworkMutation(mutationInput);
  if (!preflight.ok) return preflight;
  const baseLayer = clearRegion
    ? clearColorworkRegion(
        input.layer,
        clearRegion,
        input.chartRows,
        input.chartCols,
        input.palette,
      )
    : input.layer;
  return commitColorworkMutation({ ...mutationInput, layer: baseLayer });
}

export function resizeColorworkLayer(
  layer: Layer,
  rows: number,
  cols: number,
  palette: readonly KeyDefinition[],
): Layer {
  const placements = layer.keyPlacements.filter((placement) => {
    const footprint = footprintForPlacement(placement, palette);
    return footprint && isWithinChart(footprint, rows, cols);
  });
  return {
    ...layer,
    keyPlacements: placements,
    grid: buildGridFromKeyPlacements(placements, rows, cols, [...palette]),
  };
}

function rebuildAfterAxisEdit(
  layer: Layer,
  placements: KeyInstance[],
  rows: number,
  cols: number,
  palette: readonly KeyDefinition[],
): Layer {
  return {
    ...layer,
    keyPlacements: placements,
    grid: buildGridFromKeyPlacements(placements, rows, cols, [...palette]),
  };
}

/** Inserts a blank row and moves every touched tile as one owner. */
export function insertColorworkRow(
  layer: Layer,
  rowIndex: number,
  oldRows: number,
  cols: number,
  palette: readonly KeyDefinition[],
): Layer {
  const placements = layer.keyPlacements.map((placement) => {
    const footprint = footprintForPlacement(placement, palette);
    return footprint && footprint.maxR >= rowIndex
      ? { ...placement, anchor: { ...placement.anchor, y: placement.anchor.y + 1 } }
      : placement;
  });
  return rebuildAfterAxisEdit(layer, placements, oldRows + 1, cols, palette);
}

/** Deletes a row; a reusable tile touched by that row is removed whole. */
export function deleteColorworkRow(
  layer: Layer,
  rowIndex: number,
  oldRows: number,
  cols: number,
  palette: readonly KeyDefinition[],
): Layer {
  const placements = layer.keyPlacements.flatMap((placement) => {
    const footprint = footprintForPlacement(placement, palette);
    if (!footprint) return [];
    if (footprint.minR <= rowIndex && footprint.maxR >= rowIndex) return [];
    return footprint.minR > rowIndex
      ? [{ ...placement, anchor: { ...placement.anchor, y: placement.anchor.y - 1 } }]
      : [placement];
  });
  return rebuildAfterAxisEdit(layer, placements, oldRows - 1, cols, palette);
}

/** Inserts a blank column and moves every touched tile as one owner. */
export function insertColorworkColumn(
  layer: Layer,
  columnIndex: number,
  rows: number,
  oldCols: number,
  palette: readonly KeyDefinition[],
): Layer {
  const placements = layer.keyPlacements.map((placement) => {
    const footprint = footprintForPlacement(placement, palette);
    return footprint && footprint.maxC >= columnIndex
      ? { ...placement, anchor: { ...placement.anchor, x: placement.anchor.x + 1 } }
      : placement;
  });
  return rebuildAfterAxisEdit(layer, placements, rows, oldCols + 1, palette);
}

/** Deletes a column; a reusable tile touched by it is removed whole. */
export function deleteColorworkColumn(
  layer: Layer,
  columnIndex: number,
  rows: number,
  oldCols: number,
  palette: readonly KeyDefinition[],
): Layer {
  const placements = layer.keyPlacements.flatMap((placement) => {
    const footprint = footprintForPlacement(placement, palette);
    if (!footprint) return [];
    if (footprint.minC <= columnIndex && footprint.maxC >= columnIndex) return [];
    return footprint.minC > columnIndex
      ? [{ ...placement, anchor: { ...placement.anchor, x: placement.anchor.x - 1 } }]
      : [placement];
  });
  return rebuildAfterAxisEdit(layer, placements, rows, oldCols - 1, palette);
}
