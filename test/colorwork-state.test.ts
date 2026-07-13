import { describe, expect, it } from 'vitest';
import {
  buildGridFromKeyPlacements,
  INITIAL_APPLICATION_STATE,
  KEY_ID_KNIT_DEFAULT,
  THEME_DEFAULT_BACKGROUND_SENTINEL,
} from '../constants';
import { sanitizeColorworkState } from '../lib/colorworkState';
import type { KeyDefinition } from '../types';

describe('colorwork state boundary', () => {
  it('drops symbol and no-stitch definitions and their placements', () => {
    const state = structuredClone(INITIAL_APPLICATION_STATE);
    const symbol: KeyDefinition = {
      id: 'legacy-symbol',
      name: 'Yarn over',
      width: 1,
      height: 1,
      backgroundColor: '#FFFFFF',
      symbolColor: '#111111',
      cells: [[{ type: 'text', value: 'O' }]],
    };
    const noStitch: KeyDefinition = {
      id: 'key_empty_no_stitch',
      name: 'No stitch',
      width: 1,
      height: 1,
      backgroundColor: 'transparent_grid_bg',
      symbolColor: '#111111',
      cells: [[null]],
    };
    state.keyPalette.push(symbol, noStitch);
    const sheet = state.sheets[0]!;
    const layer = sheet.layers[0]!;
    layer.keyPlacements = [
      { keyId: symbol.id, anchor: { x: 0, y: 0 } },
      { keyId: noStitch.id, anchor: { x: 1, y: 0 } },
    ];
    layer.grid = buildGridFromKeyPlacements(layer.keyPlacements, sheet.rows, sheet.cols, state.keyPalette);

    const sanitized = sanitizeColorworkState(state);
    expect(sanitized.keyPalette.map((key) => key.id)).not.toContain(symbol.id);
    expect(sanitized.keyPalette.map((key) => key.id)).not.toContain(noStitch.id);
    expect(sanitized.sheets[0]!.layers[0]!.keyPlacements).toEqual([]);
    expect(sanitized.sheets[0]!.layers[0]!.grid[0]![0]!.keyId).toBe(KEY_ID_KNIT_DEFAULT);
  });

  it('keeps a reusable color block (as authored by BlockEditorModal) across sanitize', () => {
    const state = structuredClone(INITIAL_APPLICATION_STATE);
    const block: KeyDefinition = {
      id: 'block-1',
      name: 'Color block',
      abbreviation: null,
      width: 2,
      height: 2,
      backgroundColor: THEME_DEFAULT_BACKGROUND_SENTINEL,
      symbolColor: '#1F2937',
      colorCells: [
        ['#C2413A', null],
        [null, '#C2413A'],
      ],
      cells: [[null]],
    };
    state.keyPalette.push(block);
    const sheet = state.sheets[0]!;
    const layer = sheet.layers[0]!;
    layer.keyPlacements = [{ keyId: block.id, anchor: { x: 0, y: 0 } }];
    layer.grid = buildGridFromKeyPlacements(layer.keyPlacements, sheet.rows, sheet.cols, state.keyPalette);

    const sanitized = sanitizeColorworkState(state);
    expect(sanitized.keyPalette.map((key) => key.id)).toContain(block.id);
    expect(sanitized.sheets[0]!.layers[0]!.keyPlacements).toEqual(layer.keyPlacements);
    expect(sanitized.sheets[0]!.layers[0]!.grid[0]![0]!.keyId).toBe(block.id);
  });
});
