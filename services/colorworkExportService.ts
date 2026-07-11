import type { ChartState, KeyDefinition, Layer } from '../types';
import { KEY_ID_EMPTY, resolveKeyCellBackgroundColor } from '../constants';
import {
  COLORWORK_CHART_KIND,
  COLORWORK_CHART_VERSION,
  type ColorworkChartV1,
} from '../lib/colorwork-chart-v1';

function normalizeHex(color: string): string {
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [r, g, b] = trimmed.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  throw new Error(`Colorwork export requires an exact hex color; received "${color}".`);
}

function exportLayer(chart: ChartState, layerId?: string): Layer {
  const selected = chart.layers.find((layer) => layer.id === (layerId ?? chart.activeLayerId))
    ?? chart.layers.find((layer) => layer.isVisible);
  if (!selected) throw new Error('Colorwork export requires an active or visible chart layer.');
  return selected;
}

export function buildColorworkChartV1(
  chart: ChartState,
  keyPalette: KeyDefinition[],
  layerId?: string,
): ColorworkChartV1 {
  const layer = exportLayer(chart, layerId);
  const keys = new Map(keyPalette.map((key) => [key.id, key]));
  const palette: ColorworkChartV1['palette'] = [];
  const paletteIndexByHex = new Map<string, number>();
  const cells: number[][] = [];

  const namesByHex = new Map<string, string>();
  for (const key of keyPalette) {
    if (key.id === KEY_ID_EMPTY || key.width !== 1 || key.height !== 1) continue;
    try {
      namesByHex.set(normalizeHex(resolveKeyCellBackgroundColor(key, 0, 0, false)), key.name);
    } catch {
      // A legacy non-hex symbol background is diagnosed only if a chart cell uses it.
    }
  }

  for (let row = 0; row < chart.rows; row += 1) {
    const outputRow: number[] = [];
    for (let col = 0; col < chart.cols; col += 1) {
      const cell = layer.grid[row]?.[col];
      const key = cell?.keyId ? keys.get(cell.keyId) : undefined;
      if (!key) throw new Error(`Colorwork export cannot resolve cell (${row}, ${col}) to a palette key.`);
      if (key.id === KEY_ID_EMPTY) {
        throw new Error(`ColorworkChartV1 does not support transparent/no-stitch cell (${row}, ${col}).`);
      }
      const hex = normalizeHex(resolveKeyCellBackgroundColor(
        key,
        cell?.keyPartRowOffset ?? 0,
        cell?.keyPartColOffset ?? 0,
        false,
      ));
      let paletteIndex = paletteIndexByHex.get(hex);
      if (paletteIndex === undefined) {
        paletteIndex = palette.length;
        paletteIndexByHex.set(hex, paletteIndex);
        palette.push({
          id: `color-${hex.slice(1).toLowerCase()}`,
          name: namesByHex.get(hex) ?? hex,
          hex,
        });
      }
      outputRow.push(paletteIndex);
    }
    cells.push(outputRow);
  }

  return {
    kind: COLORWORK_CHART_KIND,
    version: COLORWORK_CHART_VERSION,
    ...(chart.name.trim() ? { title: chart.name.trim() } : {}),
    width: chart.cols,
    height: chart.rows,
    rowNumbering: chart.orientation === 'top-down' ? 'top-down' : 'bottom-up',
    palette,
    cells,
  };
}

export function serializeColorworkChartV1(chart: ColorworkChartV1): string {
  return `${JSON.stringify(chart, null, 2)}\n`;
}

export interface ColorworkPixelPng {
  dataUrl: string;
  width: number;
  height: number;
  colorCount: number;
}

export function generateColorworkPixelPng(chart: ColorworkChartV1): ColorworkPixelPng {
  const canvas = document.createElement('canvas');
  canvas.width = chart.width;
  canvas.height = chart.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not create a canvas for PNG export.');
  context.imageSmoothingEnabled = false;

  for (let row = 0; row < chart.height; row += 1) {
    for (let col = 0; col < chart.width; col += 1) {
      context.fillStyle = chart.palette[chart.cells[row]![col]!]!.hex;
      context.fillRect(col, row, 1, 1);
    }
  }
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: chart.width,
    height: chart.height,
    colorCount: chart.palette.length,
  };
}

