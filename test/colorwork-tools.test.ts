import { describe, expect, it } from 'vitest';
import { buildGridFromKeyPlacements, KEY_ID_KNIT_DEFAULT } from '../constants';
import {
  appendContinuousStroke,
  floodFillPoints,
  rasterLine,
  rasterRectangle,
} from '../lib/colorworkTools';
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
  ...natural,
  id: 'red',
  name: 'Red',
  backgroundColor: '#C2413A',
};

const navy: KeyDefinition = {
  ...natural,
  id: 'navy',
  name: 'Navy',
  backgroundColor: '#24415D',
};

const checker: KeyDefinition = {
  ...natural,
  id: 'checker',
  name: 'Checker',
  width: 2,
  height: 2,
  colorCells: [['#C2413A', '#24415D'], ['#24415D', '#C2413A']],
};

const palette = [natural, red, navy, checker];

function layerWith(placements: Layer['keyPlacements']): Layer {
  return {
    id: 'color',
    name: 'Colorwork',
    isVisible: true,
    keyPlacements: placements,
    grid: buildGridFromKeyPlacements(placements, 4, 5, palette),
  };
}

describe('colorwork raster tools', () => {
  it('rasterizes lines without gaps', () => {
    expect(rasterLine({ x: 0, y: 0 }, { x: 4, y: 2 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ]);
  });

  it('rasterizes outline and filled rectangles', () => {
    expect(rasterRectangle({ x: 0, y: 0 }, { x: 2, y: 2 })).toHaveLength(8);
    expect(rasterRectangle({ x: 0, y: 0 }, { x: 2, y: 2 }, true)).toHaveLength(9);
  });

  it('interpolates skipped pointer samples and deduplicates points', () => {
    expect(appendContinuousStroke([{ x: 0, y: 0 }], { x: 3, y: 0 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    expect(appendContinuousStroke(
      [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
      { x: 1, y: 1 },
      { x: 1, y: 0 },
    )).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
    ]);
  });

  it('fills a contiguous exact-color region across reusable block cells', () => {
    const layer = layerWith([
      { keyId: checker.id, anchor: { x: 0, y: 0 } },
      { keyId: red.id, anchor: { x: 2, y: 0 } },
    ]);
    expect(floodFillPoints(layer, palette, { x: 0, y: 0 }, 4, 5, navy)).toEqual([
      { x: 0, y: 0 },
    ]);
    expect(floodFillPoints(layer, palette, { x: 2, y: 0 }, 4, 5, navy)).toEqual([
      { x: 2, y: 0 },
    ]);
  });

  it('handles the maximum chart area without revisiting cells', () => {
    const rows = 200;
    const cols = 200;
    const layer: Layer = {
      id: 'large',
      name: 'Large',
      isVisible: true,
      keyPlacements: [],
      grid: buildGridFromKeyPlacements([], rows, cols, palette),
    };
    expect(floodFillPoints(layer, palette, { x: 0, y: 0 }, rows, cols, red)).toHaveLength(rows * cols);
  });
});
