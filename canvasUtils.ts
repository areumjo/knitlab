
import { KeyDefinition, StitchSymbolDef } from './types';
import { DEFAULT_STITCH_SYMBOLS, THEME_DEFAULT_SYMBOL_COLOR_SENTINEL, DEFAULT_STITCH_COLOR_DARK, DEFAULT_STITCH_COLOR_LIGHT } from './constants';

interface SymbolCacheEntry {
  canvas: HTMLCanvasElement;
  lastUsed: number;
}

const MAX_CACHE_SIZE = 250; // Max number of symbols to cache
const CACHE_EVICTION_TARGET = 200; // When evicting, reduce to this size

const symbolCache = new Map<string, SymbolCacheEntry>();

function generateCacheKey(
  keyDefId: string,
  symbolIdentifier: string, // Could be SVG id, text content, or 'lines'
  cellSizeOrSymbolDrawSize: number,
  resolvedSymbolColor: string,
  isDarkModeKey: boolean, // Added to reflect that dark mode affects theme sentinels
  keyPartRowOffset?: number,
  keyPartColOffset?: number
): string {
  const rOff = keyPartRowOffset ?? 0;
  const cOff = keyPartColOffset ?? 0;
  return `${keyDefId}_${symbolIdentifier}_${cellSizeOrSymbolDrawSize.toFixed(2)}_${resolvedSymbolColor}_${isDarkModeKey}_${rOff}_${cOff}`;
}

function evictCache() {
  if (symbolCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(symbolCache.entries()).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    for (let i = 0; i < symbolCache.size - CACHE_EVICTION_TARGET; i++) {
      symbolCache.delete(sortedEntries[i][0]);
    }
  }
}

async function drawSvgToOffscreenCanvas(
    svgContent: string,
    color: string,
    width: number,
    height: number,
): Promise<HTMLCanvasElement | null> {
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = Math.max(1, Math.ceil(width));
    offscreenCanvas.height = Math.max(1, Math.ceil(height));
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return null;

    const fullSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" style="color: ${color};">${svgContent}</svg>`;
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            offscreenCtx.clearRect(0,0, width, height);
            offscreenCtx.drawImage(img, 0, 0, width, height);
            resolve(offscreenCanvas);
        };
        img.onerror = () => {
            console.warn("Failed to load SVG for caching. SVG:", svgContent.substring(0,100));
            offscreenCtx.fillStyle = color;
            offscreenCtx.font = `${Math.max(8,height * 0.6)}px sans-serif`;
            offscreenCtx.textAlign = 'center';
            offscreenCtx.textBaseline = 'middle';
            offscreenCtx.fillText('?', width / 2, height / 2);
            resolve(offscreenCanvas);
        };
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fullSvgString)}`;
    });
}


export async function drawStitchSymbolOnCanvas(
  ctx: CanvasRenderingContext2D,
  keyDef: KeyDefinition,
  allSymbols: StitchSymbolDef[] = DEFAULT_STITCH_SYMBOLS,
  targetX: number, // Top-left X of the *grid cell* on the main canvas
  targetY: number, // Top-left Y of the *grid cell* on the main canvas
  cellSize: number, // Size of one grid cell on the main canvas
  isDarkMode: boolean,
  keyPartRowOffsetVal?: number,
  keyPartColOffsetVal?: number
): Promise<void> {
  if (!keyDef || cellSize <= 0) return;

  const keyPartRowOffset = keyPartRowOffsetVal ?? 0;
  const keyPartColOffset = keyPartColOffsetVal ?? 0;

  let effectiveSymbolColor = keyDef.symbolColor;
  if (keyDef.symbolColor === THEME_DEFAULT_SYMBOL_COLOR_SENTINEL) {
    effectiveSymbolColor = isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT;
  }
  
  // For lines, the "cellSize" for caching refers to the target cell dimensions on the main canvas.
  // For symbols (SVG/text), it's the actual symbolDrawSize.
  const symbolDrawSize = cellSize * 0.85; 
  const symbolRenderX = targetX + (cellSize - symbolDrawSize) / 2;
  const symbolRenderY = targetY + (cellSize - symbolDrawSize) / 2;

  // Generate a unique cache key based on relevant properties
  let cacheKey: string;
  let symbolIdentifier: string;

  if (keyDef.lines && keyDef.lines.length > 0) {
    symbolIdentifier = 'lines_content';
    cacheKey = generateCacheKey(keyDef.id, symbolIdentifier, cellSize, effectiveSymbolColor, isDarkMode, keyPartRowOffset, keyPartColOffset);
  } else if (keyDef.cells && keyDef.cells[keyPartRowOffset] && keyDef.cells[keyPartRowOffset][keyPartColOffset]) {
    const cellContent = keyDef.cells[keyPartRowOffset][keyPartColOffset];
    if (!cellContent) return; // Empty cell part
    symbolIdentifier = cellContent.type === 'svg' ? cellContent.value : `text_${cellContent.value.charAt(0)}`;
    cacheKey = generateCacheKey(keyDef.id, symbolIdentifier, symbolDrawSize, effectiveSymbolColor, isDarkMode, keyPartRowOffset, keyPartColOffset);
  } else {
    return; // No content to draw for this cell part
  }

  const cached = symbolCache.get(cacheKey);
  if (cached) {
    cached.lastUsed = Date.now();
    // Lines are drawn directly at targetX, targetY as their cache is cell-sized
    // Symbols are drawn at symbolRenderX, symbolRenderY as their cache is symbolDrawSize-d
    const drawX = (keyDef.lines && keyDef.lines.length > 0) ? targetX : symbolRenderX;
    const drawY = (keyDef.lines && keyDef.lines.length > 0) ? targetY : symbolRenderY;
    ctx.drawImage(cached.canvas, drawX, drawY);
    return;
  }
  
  let offscreenCanvasToCache: HTMLCanvasElement | null = null;

  if (keyDef.lines && keyDef.lines.length > 0) {
    const tempOffscreen = document.createElement('canvas');
    tempOffscreen.width = Math.max(1, Math.ceil(cellSize));
    tempOffscreen.height = Math.max(1, Math.ceil(cellSize));
    const tempCtx = tempOffscreen.getContext('2d');
    if (tempCtx) {
      tempCtx.strokeStyle = effectiveSymbolColor;
      tempCtx.lineWidth = Math.max(1, cellSize * 0.08);
      tempCtx.lineCap = 'round';
      for (const line of keyDef.lines) {
        const x1 = (line.start.x - keyPartColOffset) * cellSize;
        const y1 = (line.start.y - keyPartRowOffset) * cellSize;
        const x2 = (line.end.x - keyPartColOffset) * cellSize;
        const y2 = (line.end.y - keyPartRowOffset) * cellSize;
        tempCtx.beginPath();
        tempCtx.moveTo(x1, y1);
        tempCtx.lineTo(x2, y2);
        tempCtx.stroke();
      }
      offscreenCanvasToCache = tempOffscreen;
    }
  } else if (keyDef.cells && keyDef.cells[keyPartRowOffset] && keyDef.cells[keyPartRowOffset][keyPartColOffset]) {
    const cellContent = keyDef.cells[keyPartRowOffset][keyPartColOffset]!; // We already checked this
    if (cellContent.type === 'svg') {
      const symbolDef = allSymbols.find(s => s.id === cellContent.value);
      if (symbolDef?.svgContent) {
        offscreenCanvasToCache = await drawSvgToOffscreenCanvas(symbolDef.svgContent, effectiveSymbolColor, symbolDrawSize, symbolDrawSize);
      }
    } else if (cellContent.type === 'text') {
      const tempOffscreen = document.createElement('canvas');
      tempOffscreen.width = Math.max(1, Math.ceil(symbolDrawSize));
      tempOffscreen.height = Math.max(1, Math.ceil(symbolDrawSize));
      const tempCtx = tempOffscreen.getContext('2d');
      if (tempCtx) {
        tempCtx.fillStyle = effectiveSymbolColor;
        const fontSize = Math.max(8, symbolDrawSize * 0.7);
        tempCtx.font = `${fontSize}px 'Roboto Mono', monospace`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(cellContent.value.charAt(0), symbolDrawSize / 2, symbolDrawSize / 2);
        offscreenCanvasToCache = tempOffscreen;
      }
    }
  }

  if (offscreenCanvasToCache) {
    symbolCache.set(cacheKey, { canvas: offscreenCanvasToCache, lastUsed: Date.now() });
    evictCache();
    const drawX = (keyDef.lines && keyDef.lines.length > 0) ? targetX : symbolRenderX;
    const drawY = (keyDef.lines && keyDef.lines.length > 0) ? targetY : symbolRenderY;
    ctx.drawImage(offscreenCanvasToCache, drawX, drawY);
  }
}

export function invalidateSymbolColorCache() {
    const keysToDelete: string[] = [];
    symbolCache.forEach((_value, key) => {
        // Keys are generated like: `${keyDefId}_${symbolIdentifier}_${size}_${color}_${isDarkMode}_${rOff}_${cOff}`
        // If the color part of the key is a theme sentinel or if the isDarkMode part changes, it's affected.
        // A simpler approach: clear all if dark mode changes. For more granular, parse the key.
        // For now, let's assume any key containing 'true' or 'false' (isDarkMode part) or specific sentinel color strings.
        if (key.includes(THEME_DEFAULT_SYMBOL_COLOR_SENTINEL) || 
            key.includes(DEFAULT_STITCH_COLOR_DARK) || 
            key.includes(DEFAULT_STITCH_COLOR_LIGHT) ||
            key.includes('_true_') || key.includes('_false_')) { // Check for isDarkMode part
            keysToDelete.push(key);
        }
    });
    keysToDelete.forEach(key => symbolCache.delete(key));
    // console.log(`Invalidated ${keysToDelete.length} symbol cache entries due to color/theme change.`);
}
