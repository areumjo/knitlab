import { describe, expect, it } from 'vitest';
import { buildGridFromKeyPlacements, KEY_ID_KNIT_DEFAULT } from '../constants';
import {
  buildColorworkChartV1,
  serializeColorworkChartV1,
} from '../services/colorworkExportService';
import type { ChartState, KeyDefinition } from '../types';

const palette: KeyDefinition[] = [
  {
    id: KEY_ID_KNIT_DEFAULT, name: 'Natural', width: 1, height: 1,
    backgroundColor: '#F4F0E6', symbolColor: '#111111', cells: [[null]],
  },
  {
    id: 'block', name: 'Checker', width: 2, height: 2,
    backgroundColor: '#F4F0E6', symbolColor: '#111111', cells: [[null]],
    colorCells: [['#C2413A', '#D6A633'], ['#24415D', '#F4F0E6']],
  },
];

function chartFixture(): ChartState {
  const placements = [
    { anchor: { x: 0, y: 0 }, keyId: 'block' },
    { anchor: { x: 2, y: 0 }, keyId: KEY_ID_KNIT_DEFAULT },
    { anchor: { x: 3, y: 0 }, keyId: KEY_ID_KNIT_DEFAULT },
  ];
  return {
    id: 'chart',
    name: 'Block proof',
    rows: 2,
    cols: 4,
    orientation: 'bottom-up',
    displaySettings: { rowCountVisibility: 'right', colCountVisibility: 'bottom' },
    layers: [{
      id: 'color',
      name: 'Colorwork',
      isVisible: true,
      keyPlacements: placements,
      grid: buildGridFromKeyPlacements(placements, 2, 4, palette),
    }],
    activeLayerId: 'color',
  };
}

describe('colorwork export', () => {
  it('flattens reusable multi-color tiles without losing exact colors', () => {
    const artifact = buildColorworkChartV1(chartFixture(), palette);
    expect(artifact.palette.map((entry) => entry.hex)).toEqual([
      '#C2413A', '#D6A633', '#F4F0E6', '#24415D',
    ]);
    expect(artifact.cells).toEqual([
      [0, 1, 2, 2],
      [3, 2, 2, 2],
    ]);
  });

  it('serializes unchanged charts byte-stably', () => {
    const artifact = buildColorworkChartV1(chartFixture(), palette);
    expect(serializeColorworkChartV1(artifact)).toBe(serializeColorworkChartV1(artifact));
  });

  it('rejects no-stitch instead of silently inventing a color', () => {
    const noStitch: KeyDefinition = {
      id: 'key_empty_no_stitch', name: 'No stitch', width: 1, height: 1,
      backgroundColor: '#FFFFFF', symbolColor: '#111111', cells: [[null]],
    };
    const chart = chartFixture();
    chart.layers[0]!.keyPlacements = [{ anchor: { x: 0, y: 0 }, keyId: noStitch.id }];
    chart.layers[0]!.grid = buildGridFromKeyPlacements(chart.layers[0]!.keyPlacements, 2, 4, [...palette, noStitch]);
    expect(() => buildColorworkChartV1(chart, [...palette, noStitch])).toThrow(/does not support transparent\/no-stitch/);
  });
});
