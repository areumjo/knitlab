import { describe, expect, it } from 'vitest';
import {
  buildGridFromKeyPlacements,
  KEY_ID_KNIT_DEFAULT,
} from '../constants';
import {
  clearColorworkRegion,
  commitColorworkMutation,
  deleteColorworkColumn,
  deleteColorworkRow,
  insertColorworkColumn,
  insertColorworkRow,
  moveColorworkPlacements,
  opsForTiledSelection,
  resizeColorworkLayer,
} from '../services/colorworkMutationService';
import type { KeyDefinition, Layer } from '../types';

const natural: KeyDefinition = {
  id: KEY_ID_KNIT_DEFAULT,
  name: 'Natural',
  width: 1,
  height: 1,
  backgroundColor: '#FAF9F6',
  symbolColor: '#111111',
  cells: [[null]],
};
const red: KeyDefinition = {
  id: 'red',
  name: 'Red',
  width: 1,
  height: 1,
  backgroundColor: '#C2413A',
  symbolColor: '#111111',
  cells: [[null]],
};
const block: KeyDefinition = {
  id: 'block',
  name: 'Checker',
  width: 2,
  height: 2,
  backgroundColor: '#FAF9F6',
  symbolColor: '#111111',
  cells: [[null]],
  colorCells: [['#C2413A', '#24415D'], ['#24415D', '#C2413A']],
};
const palette = [natural, red, block];

function layerWith(placements: Layer['keyPlacements']): Layer {
  return {
    id: 'color',
    name: 'Colorwork',
    isVisible: true,
    keyPlacements: placements,
    grid: buildGridFromKeyPlacements(placements, 6, 6, palette),
  };
}

describe('colorwork mutation core', () => {
  it('removes a whole multi-color owner when one cell is overpainted', () => {
    const result = commitColorworkMutation({
      layer: layerWith([{ keyId: block.id, anchor: { x: 1, y: 1 } }]),
      ops: [{ key: red, anchor: { x: 2, y: 2 } }],
      chartRows: 6,
      chartCols: 6,
      palette,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.layer.keyPlacements).toEqual([{ keyId: red.id, anchor: { x: 2, y: 2 } }]);
  });

  it('rejects an invalid batch without changing the layer', () => {
    const original = layerWith([{ keyId: red.id, anchor: { x: 0, y: 0 } }]);
    const result = commitColorworkMutation({
      layer: original,
      ops: [
        { key: red, anchor: { x: 1, y: 1 } },
        { key: block, anchor: { x: 5, y: 5 } },
      ],
      chartRows: 6,
      chartCols: 6,
      palette,
    });
    expect(result.ok).toBe(false);
    expect(original.keyPlacements).toEqual([{ keyId: red.id, anchor: { x: 0, y: 0 } }]);
  });

  it('uses implicit Natural when clearing and clears a touched block atomically', () => {
    const original = layerWith([
      { keyId: red.id, anchor: { x: 0, y: 0 } },
      { keyId: block.id, anchor: { x: 2, y: 2 } },
    ]);
    const paintedNatural = commitColorworkMutation({
      layer: original,
      ops: [{ key: natural, anchor: { x: 0, y: 0 } }],
      chartRows: 6,
      chartCols: 6,
      palette,
    });
    expect(paintedNatural.ok && paintedNatural.layer.keyPlacements).toEqual([
      { keyId: block.id, anchor: { x: 2, y: 2 } },
    ]);
    expect(clearColorworkRegion(
      original,
      { start: { x: 3, y: 3 }, end: { x: 3, y: 3 } },
      6,
      6,
      palette,
    ).keyPlacements).toEqual([{ keyId: red.id, anchor: { x: 0, y: 0 } }]);
  });

  it('fills selections with whole reusable tiles only', () => {
    expect(opsForTiledSelection(
      { start: { x: 0, y: 0 }, end: { x: 4, y: 2 } },
      block,
    ).map((op) => op.anchor)).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ]);
  });

  it('moves a reusable block without flattening it and refuses edge overflow', () => {
    const original = layerWith([{ keyId: block.id, anchor: { x: 1, y: 1 } }]);
    const moved = moveColorworkPlacements({
      layer: original,
      relativeKeyInstances: [{ keyId: block.id, anchor: { x: 0, y: 0 } }],
      sourceOrigin: { x: 1, y: 1 },
      targetOrigin: { x: 3, y: 3 },
      chartRows: 6,
      chartCols: 6,
      palette,
    });
    expect(moved.ok && moved.layer.keyPlacements).toEqual([
      { keyId: block.id, anchor: { x: 3, y: 3 } },
    ]);

    const refused = moveColorworkPlacements({
      layer: original,
      relativeKeyInstances: [{ keyId: block.id, anchor: { x: 0, y: 0 } }],
      sourceOrigin: { x: 1, y: 1 },
      targetOrigin: { x: 5, y: 5 },
      chartRows: 6,
      chartCols: 6,
      palette,
    });
    expect(refused.ok).toBe(false);
    expect(original.keyPlacements).toEqual([{ keyId: block.id, anchor: { x: 1, y: 1 } }]);
  });

  it('keeps reusable blocks atomic across row and column structure edits', () => {
    const original = layerWith([
      { keyId: block.id, anchor: { x: 1, y: 1 } },
      { keyId: red.id, anchor: { x: 5, y: 5 } },
    ]);
    expect(insertColorworkRow(original, 2, 6, 6, palette).keyPlacements).toEqual([
      { keyId: block.id, anchor: { x: 1, y: 2 } },
      { keyId: red.id, anchor: { x: 5, y: 6 } },
    ]);
    expect(insertColorworkColumn(original, 2, 6, 6, palette).keyPlacements).toEqual([
      { keyId: block.id, anchor: { x: 2, y: 1 } },
      { keyId: red.id, anchor: { x: 6, y: 5 } },
    ]);
    expect(deleteColorworkRow(original, 2, 6, 6, palette).keyPlacements).toEqual([
      { keyId: red.id, anchor: { x: 5, y: 4 } },
    ]);
    expect(deleteColorworkColumn(original, 2, 6, 6, palette).keyPlacements).toEqual([
      { keyId: red.id, anchor: { x: 4, y: 5 } },
    ]);
    expect(resizeColorworkLayer(original, 2, 2, palette).keyPlacements).toEqual([]);
  });
});
