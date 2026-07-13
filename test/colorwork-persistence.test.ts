import { describe, expect, it } from 'vitest';
import { buildGridFromKeyPlacements, INITIAL_APPLICATION_STATE } from '../constants';
import { deserialize, serialize } from '../services/serializationService';
import type { KeyDefinition } from '../types';

describe('colorwork persistence', () => {
  it('preserves reusable multi-color tile identity and rebuilds its grid', () => {
    const state = structuredClone(INITIAL_APPLICATION_STATE);
    const block: KeyDefinition = {
      id: 'key_color_block_test',
      name: 'Checker',
      width: 2,
      height: 2,
      backgroundColor: '#FAF9F6',
      symbolColor: '#111111',
      cells: [[null]],
      colorCells: [['#C2413A', '#24415D'], ['#24415D', '#C2413A']],
    };
    state.keyPalette.push(block);
    const sheet = state.sheets[0]!;
    const layer = sheet.layers[0]!;
    layer.keyPlacements = [{ anchor: { x: 3, y: 4 }, keyId: block.id }];
    layer.grid = buildGridFromKeyPlacements(layer.keyPlacements, sheet.rows, sheet.cols, state.keyPalette);

    const reopened = deserialize(serialize(state));
    expect(reopened.keyPalette.find((key) => key.id === block.id)?.colorCells).toEqual(block.colorCells);
    expect(reopened.sheets[0]!.layers[0]!.grid[4]![3]).toMatchObject({
      keyId: block.id,
      isAnchorCellForMxN: true,
    });
    expect(reopened.sheets[0]!.layers[0]!.grid[5]![4]).toMatchObject({
      keyId: block.id,
      keyPartRowOffset: 1,
      keyPartColOffset: 1,
    });
  });
});

