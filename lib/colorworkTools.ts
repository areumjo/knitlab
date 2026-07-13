import { DEFAULT_CELL_COLOR_LIGHT, resolveKeyCellBackgroundColor } from '../constants';
import type { KeyDefinition, Layer, Point } from '../types';

const pointKey = (point: Point): string => `${point.x}:${point.y}`;

export function pointInChart(point: Point, rows: number, cols: number): boolean {
  return point.x >= 0 && point.x < cols && point.y >= 0 && point.y < rows;
}

export function rasterLine(start: Point, end: Point): Point[] {
  const points: Point[] = [];
  let x = start.x;
  let y = start.y;
  const dx = Math.abs(end.x - x);
  const sx = x < end.x ? 1 : -1;
  const dy = -Math.abs(end.y - y);
  const sy = y < end.y ? 1 : -1;
  let error = dx + dy;

  while (true) {
    points.push({ x, y });
    if (x === end.x && y === end.y) break;
    const twiceError = 2 * error;
    if (twiceError >= dy) {
      error += dy;
      x += sx;
    }
    if (twiceError <= dx) {
      error += dx;
      y += sy;
    }
  }

  return points;
}

export function rasterRectangle(start: Point, end: Point, filled = false): Point[] {
  const left = Math.min(start.x, end.x);
  const right = Math.max(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const bottom = Math.max(start.y, end.y);
  const points: Point[] = [];

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      if (filled || y === top || y === bottom || x === left || x === right) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

export function appendContinuousStroke(points: readonly Point[], next: Point, previous = points[points.length - 1]): Point[] {
  if (points.length === 0) return [next];
  const unique = new Map(points.map((point) => [pointKey(point), point]));
  for (const point of rasterLine(previous, next)) {
    unique.set(pointKey(point), point);
  }
  return [...unique.values()];
}

function cellColor(layer: Layer, palette: readonly KeyDefinition[], point: Point): string {
  const cell = layer.grid[point.y]?.[point.x];
  const key = palette.find((candidate) => candidate.id === cell?.keyId);
  if (!key) return DEFAULT_CELL_COLOR_LIGHT.toLowerCase();
  return resolveKeyCellBackgroundColor(
    key,
    cell?.keyPartRowOffset ?? 0,
    cell?.keyPartColOffset ?? 0,
    false,
  ).toLowerCase();
}

export function floodFillPoints(
  layer: Layer,
  palette: readonly KeyDefinition[],
  start: Point,
  rows: number,
  cols: number,
  replacement: KeyDefinition,
): Point[] {
  if (!pointInChart(start, rows, cols)) return [];
  const targetColor = cellColor(layer, palette, start);
  const replacementColor = resolveKeyCellBackgroundColor(replacement, 0, 0, false).toLowerCase();
  if (targetColor === replacementColor) return [];

  const pending = [start];
  const visited = new Set<string>();
  const points: Point[] = [];

  while (pending.length > 0) {
    const point = pending.pop()!;
    const key = pointKey(point);
    if (visited.has(key) || !pointInChart(point, rows, cols)) continue;
    visited.add(key);
    if (cellColor(layer, palette, point) !== targetColor) continue;
    points.push(point);
    pending.push(
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 },
    );
  }

  return points;
}
