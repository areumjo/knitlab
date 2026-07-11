import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  InvalidColorworkChartError,
  parseColorworkChartV1,
  parseColorworkChartV1Json,
} from '../lib/colorwork-chart-v1';

const fixturePath = path.resolve('fixtures/colorwork-chart-v1/four-color-checker.json');

describe('ColorworkChartV1', () => {
  it('parses the shared four-color fixture', () => {
    const chart = parseColorworkChartV1Json(fs.readFileSync(fixturePath, 'utf8'));
    expect(chart.width).toBe(4);
    expect(chart.height).toBe(3);
    expect(chart.palette.map((entry) => entry.id)).toEqual(['natural', 'red', 'gold', 'navy']);
    expect(chart.cells[0]).toEqual([3, 2, 1, 0]);
  });

  it('rejects invalid colors, duplicate IDs, dimensions, and cell references', () => {
    try {
      parseColorworkChartV1({
        kind: 'knitlab-colorwork-chart',
        version: 1,
        width: 2,
        height: 2,
        rowNumbering: 'bottom-up',
        palette: [
          { id: 'same', name: 'One', hex: '#112233' },
          { id: 'same', name: 'Two', hex: 'navy' },
        ],
        cells: [[0, 2]],
      });
      throw new Error('expected parser to reject invalid input');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidColorworkChartError);
      expect((error as InvalidColorworkChartError).issues).toEqual(expect.arrayContaining([
        expect.stringContaining('duplicates'),
        expect.stringContaining('six-digit'),
        expect.stringContaining('expected height'),
        expect.stringContaining('missing palette index'),
      ]));
    }
  });

  it('allows palettes larger than a Kniterate carrier set', () => {
    const palette = Array.from({ length: 8 }, (_, index) => ({
      id: `color-${index}`,
      name: `Color ${index}`,
      hex: `#${index.toString(16).padStart(6, '0')}`,
    }));
    const chart = parseColorworkChartV1({
      kind: 'knitlab-colorwork-chart',
      version: 1,
      width: 8,
      height: 1,
      rowNumbering: 'top-down',
      palette,
      cells: [palette.map((_, index) => index)],
    });
    expect(chart.palette).toHaveLength(8);
  });
});

