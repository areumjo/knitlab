export const COLORWORK_CHART_KIND = 'knitlab-colorwork-chart' as const;
export const COLORWORK_CHART_VERSION = 1 as const;

export interface ColorworkChartPaletteEntry {
  id: string;
  name: string;
  hex: string;
}

export interface ColorworkChartV1 {
  kind: typeof COLORWORK_CHART_KIND;
  version: typeof COLORWORK_CHART_VERSION;
  title?: string;
  width: number;
  height: number;
  rowNumbering: 'bottom-up' | 'top-down';
  palette: ColorworkChartPaletteEntry[];
  cells: number[][];
}

export class InvalidColorworkChartError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid ColorworkChartV1:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
    this.name = 'InvalidColorworkChartError';
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

export function parseColorworkChartV1(value: unknown): ColorworkChartV1 {
  const issues: string[] = [];
  if (!isRecord(value)) throw new InvalidColorworkChartError(['root must be an object']);

  if (value['kind'] !== COLORWORK_CHART_KIND) issues.push(`kind must be "${COLORWORK_CHART_KIND}"`);
  if (value['version'] !== COLORWORK_CHART_VERSION) issues.push(`version must be ${COLORWORK_CHART_VERSION}`);
  if (!positiveInteger(value['width'])) issues.push('width must be a positive integer');
  if (!positiveInteger(value['height'])) issues.push('height must be a positive integer');
  if (value['rowNumbering'] !== 'bottom-up' && value['rowNumbering'] !== 'top-down') {
    issues.push('rowNumbering must be "bottom-up" or "top-down"');
  }
  if (value['title'] !== undefined && (typeof value['title'] !== 'string' || value['title'].length === 0 || value['title'].length > 200)) {
    issues.push('title must be a non-empty string of at most 200 characters');
  }

  const palette = value['palette'];
  const paletteEntries: ColorworkChartPaletteEntry[] = [];
  const paletteIds = new Set<string>();
  if (!Array.isArray(palette) || palette.length === 0) {
    issues.push('palette must contain at least one entry');
  } else {
    palette.forEach((entry, index) => {
      if (!isRecord(entry)) {
        issues.push(`palette[${index}] must be an object`);
        return;
      }
      const id = entry['id'];
      const name = entry['name'];
      const hex = entry['hex'];
      if (typeof id !== 'string' || id.length === 0 || id.length > 100) {
        issues.push(`palette[${index}].id must be a non-empty string of at most 100 characters`);
      } else if (paletteIds.has(id)) {
        issues.push(`palette[${index}].id duplicates "${id}"`);
      } else {
        paletteIds.add(id);
      }
      if (typeof name !== 'string' || name.length === 0 || name.length > 100) {
        issues.push(`palette[${index}].name must be a non-empty string of at most 100 characters`);
      }
      if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
        issues.push(`palette[${index}].hex must be a six-digit sRGB hex color`);
      }
      if (typeof id === 'string' && typeof name === 'string' && typeof hex === 'string') {
        paletteEntries.push({ id, name, hex });
      }
    });
  }

  const width = value['width'];
  const height = value['height'];
  const cells = value['cells'];
  const parsedCells: number[][] = [];
  if (!Array.isArray(cells)) {
    issues.push('cells must be an array of rows');
  } else {
    if (positiveInteger(height) && cells.length !== height) {
      issues.push(`cells has ${cells.length} rows; expected height ${height}`);
    }
    cells.forEach((row, rowIndex) => {
      if (!Array.isArray(row)) {
        issues.push(`cells[${rowIndex}] must be an array`);
        return;
      }
      if (positiveInteger(width) && row.length !== width) {
        issues.push(`cells[${rowIndex}] has ${row.length} columns; expected width ${width}`);
      }
      const parsedRow: number[] = [];
      row.forEach((paletteIndex, colIndex) => {
        if (!Number.isInteger(paletteIndex) || Number(paletteIndex) < 0) {
          issues.push(`cells[${rowIndex}][${colIndex}] must be a non-negative integer`);
          return;
        }
        const index = Number(paletteIndex);
        if (Array.isArray(palette) && index >= palette.length) {
          issues.push(`cells[${rowIndex}][${colIndex}] references missing palette index ${index}`);
        }
        parsedRow.push(index);
      });
      parsedCells.push(parsedRow);
    });
  }

  if (issues.length > 0) throw new InvalidColorworkChartError(issues);
  return {
    kind: COLORWORK_CHART_KIND,
    version: COLORWORK_CHART_VERSION,
    ...(typeof value['title'] === 'string' ? { title: value['title'] } : {}),
    width: width as number,
    height: height as number,
    rowNumbering: value['rowNumbering'] as ColorworkChartV1['rowNumbering'],
    palette: paletteEntries,
    cells: parsedCells,
  };
}

export function parseColorworkChartV1Json(json: string): ColorworkChartV1 {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch (error) {
    throw new InvalidColorworkChartError([
      `file is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
  return parseColorworkChartV1(value);
}

