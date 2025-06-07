import { ChartState, KeyDefinition, StitchSymbolDef, Line, KeyCellContent } from '../types';
import {
  CELL_SIZE,
  GUTTER_SIZE,
  GRID_LINE_COLOR_LIGHT,
  GRID_LINE_COLOR_DARK,
  DEFAULT_CELL_COLOR_LIGHT,
  DEFAULT_CELL_COLOR_DARK,
  DEFAULT_STITCH_COLOR_LIGHT,
  DEFAULT_STITCH_COLOR_DARK,
  TRANSPARENT_BACKGROUND_SENTINEL,
  THEME_DEFAULT_BACKGROUND_SENTINEL,
  THEME_DEFAULT_SYMBOL_COLOR_SENTINEL,
  KEY_ID_EMPTY,
} from '../constants';

const COPYRIGHT_TEXT_LINE1 = "© 2025 Areum Knits. All rights reserved.";
const COPYRIGHT_TEXT_LINE2 = "Crafted with ❤️ and code.";
const COPYRIGHT_FONT_SIZE = 10; // pixels
const COPYRIGHT_LINE_HEIGHT = 12; // pixels
const COPYRIGHT_MARGIN_TOP = 10; // pixels
const COPYRIGHT_TOTAL_HEIGHT = (COPYRIGHT_LINE_HEIGHT * 2) + COPYRIGHT_MARGIN_TOP;

async function drawSymbolSvgOnCanvas(
    ctx: CanvasRenderingContext2D,
    svgContent: string,
    symbolColor: string,
    x: number, y: number,
    width: number, height: number
): Promise<void> {
    // Ensure SVG has a viewBox and fill/stroke are set to currentColor or a specific color that can be overridden
    const fullSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" style="color: ${symbolColor};">${svgContent}</svg>`;
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, x, y, width, height);
            resolve();
        };
        img.onerror = (err) => {
            console.error("Error loading SVG for canvas drawing:", err, svgContent);
            // Fallback: draw a question mark
            ctx.fillStyle = symbolColor;
            ctx.font = `${height * 0.6}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', x + width / 2, y + height / 2);
            resolve(); // Resolve even on error to not break the whole export
        };
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fullSvgString)}`;
    });
}


export async function generateChartJpeg(
  chartState: ChartState,
  keyPalette: KeyDefinition[],
  allSymbols: StitchSymbolDef[],
  isDarkMode: boolean,
  exportZoom: number,
  includeCopyright: boolean
): Promise<string | null> {
  try {
    const scaledCellSize = CELL_SIZE * exportZoom;
    const { rows, cols, displaySettings, orientation } = chartState;

    const gutterLeft = (displaySettings.rowCountVisibility === 'left' || displaySettings.rowCountVisibility === 'both' || displaySettings.rowCountVisibility === 'alternating-left') ? GUTTER_SIZE : 0;
    const gutterTop = (displaySettings.colCountVisibility === 'top' || displaySettings.colCountVisibility === 'both') ? GUTTER_SIZE : 0;
    const gutterRight = (displaySettings.rowCountVisibility === 'right' || displaySettings.rowCountVisibility === 'both' || displaySettings.rowCountVisibility === 'alternating-right') ? GUTTER_SIZE : 0;
    const gutterBottom = (displaySettings.colCountVisibility === 'bottom' || displaySettings.colCountVisibility === 'both') ? GUTTER_SIZE : 0;
    
    const gridContentWidth = cols * scaledCellSize;
    const gridContentHeight = rows * scaledCellSize;
    
    const totalWidth = gutterLeft + gridContentWidth + gutterRight;
    let totalHeight = gutterTop + gridContentHeight + gutterBottom;
    if (includeCopyright) {
        totalHeight += COPYRIGHT_TOTAL_HEIGHT;
    }

    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Background
    ctx.fillStyle = isDarkMode ? '#1F2937' : '#FCFCFC'; // neutral-900 or neutral-100
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Grid background (area behind cells)
    ctx.fillStyle = isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT; // neutral-800 or neutral-200
    ctx.fillRect(gutterLeft, gutterTop, gridContentWidth, gridContentHeight);

    const drawingPromises: Promise<void>[] = [];

    // Draw cells and symbols
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellX = gutterLeft + c * scaledCellSize;
        const cellY = gutterTop + r * scaledCellSize;

        const cellData = chartState.layers.find(l=>l.isVisible)?.grid[r]?.[c]; // Simplified: take topmost visible layer
        const keyDef = cellData?.keyId ? keyPalette.find(k => k.id === cellData.keyId) : keyPalette.find(k => k.id === KEY_ID_EMPTY);
        
        if (keyDef) {
          let bgColor = keyDef.backgroundColor;
          if (bgColor === TRANSPARENT_BACKGROUND_SENTINEL) {
            bgColor = isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;
          } else if (bgColor === THEME_DEFAULT_BACKGROUND_SENTINEL) {
            bgColor = isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT;
          }
          ctx.fillStyle = bgColor;
          ctx.fillRect(cellX, cellY, scaledCellSize, scaledCellSize);
          
          let symbolColor = keyDef.symbolColor;
          if (symbolColor === THEME_DEFAULT_SYMBOL_COLOR_SENTINEL) {
            symbolColor = isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT;
          }

          const keyPartRowOffset = cellData?.keyPartRowOffset ?? 0;
          const keyPartColOffset = cellData?.keyPartColOffset ?? 0;
          
          // Handle drawing based on keyDef structure
          if (keyDef.lines && keyDef.lines.length > 0) {
            ctx.strokeStyle = symbolColor;
            ctx.lineWidth = Math.max(1, scaledCellSize * 0.08);
            ctx.lineCap = 'round';
            const linesToDraw = (keyDef.width > 1 || keyDef.height > 1)
              ? keyDef.lines.filter(line => { // Basic clipping for lines within the current cell part
                  const inCellOffsetX = keyPartColOffset * scaledCellSize;
                  const inCellOffsetY = keyPartRowOffset * scaledCellSize;
                  return true; // Simplified: for now draw all lines of an MxN symbol, let svg viewBox handle it
                })
              : keyDef.lines;

            linesToDraw.forEach(line => {
                ctx.beginPath();
                // Adjust line coordinates if it's part of an MxN symbol being drawn in a single cell view
                // The StitchSymbolDisplay handles this by setting up a viewBox for MxN symbols.
                // Here we draw onto the whole key area, but then clip to the current cell for MxN.
                // For 1x1 keys, (line.start.x * scaledCellSize) is correct.
                // For MxN keys, the symbol is drawn relative to the MxN key's combined cell area.
                // StitchSymbolDisplay on canvas uses viewBox on SVG. Here, we are drawing paths.
                // This logic is simplified: assume line coordinates are 0-1 for 1x1, 0-keyWidth/Height for MxN
                
                let x1 = (line.start.x * scaledCellSize) - (keyPartColOffset * scaledCellSize);
                let y1 = (line.start.y * scaledCellSize) - (keyPartRowOffset * scaledCellSize);
                let x2 = (line.end.x * scaledCellSize) - (keyPartColOffset * scaledCellSize);
                let y2 = (line.end.y * scaledCellSize) - (keyPartRowOffset * scaledCellSize);

                ctx.moveTo(cellX + x1, cellY + y1);
                ctx.lineTo(cellX + x2, cellY + y2);
                ctx.stroke();
            });
          } else if (keyDef.cells && keyDef.cells[keyPartRowOffset]?.[keyPartColOffset]) {
            const cellContent = keyDef.cells[keyPartRowOffset][keyPartColOffset];
            if (cellContent) {
              const symbolDrawSize = scaledCellSize * 0.85;
              const symbolX = cellX + (scaledCellSize - symbolDrawSize) / 2;
              const symbolY = cellY + (scaledCellSize - symbolDrawSize) / 2;

              if (cellContent.type === 'text') {
                ctx.fillStyle = symbolColor;
                ctx.font = `${scaledCellSize * 0.6}px 'Roboto Mono', monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(cellContent.value.charAt(0), cellX + scaledCellSize / 2, cellY + scaledCellSize / 2);
              } else if (cellContent.type === 'svg') {
                const symbolDef = allSymbols.find(s => s.id === cellContent.value);
                if (symbolDef?.svgContent) {
                   drawingPromises.push(drawSymbolSvgOnCanvas(ctx, symbolDef.svgContent, symbolColor, symbolX, symbolY, symbolDrawSize, symbolDrawSize));
                }
              }
            }
          }
        }
      }
    }
    await Promise.all(drawingPromises);


    // Draw grid lines
    ctx.strokeStyle = isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;
    ctx.lineWidth = 1; // Thinner lines for export often look better
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(gutterLeft, gutterTop + r * scaledCellSize);
      ctx.lineTo(gutterLeft + gridContentWidth, gutterTop + r * scaledCellSize);
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(gutterLeft + c * scaledCellSize, gutterTop);
      ctx.lineTo(gutterLeft + c * scaledCellSize, gutterTop + gridContentHeight);
      ctx.stroke();
    }

    // Draw Gutters (Row/Col Numbers)
    ctx.fillStyle = isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT;
    const gutterFontSize = Math.max(10, scaledCellSize * 0.35);
    ctx.font = `${gutterFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const getRowDisplayNumber = (rIdx: number) => orientation === 'bottom-up' ? rows - rIdx : rIdx + 1;

    for (let rIdx = 0; rIdx < rows; rIdx++) {
        const displayNumber = getRowDisplayNumber(rIdx);
        const yPos = gutterTop + rIdx * scaledCellSize + scaledCellSize / 2;
        if ((displaySettings.rowCountVisibility === 'left' || displaySettings.rowCountVisibility === 'both') ||
            (displaySettings.rowCountVisibility === 'alternating-left' && displayNumber % 2 !== 0) ||
            (displaySettings.rowCountVisibility === 'alternating-right' && displayNumber % 2 === 0)) {
            if (gutterLeft > 0) ctx.fillText(String(displayNumber), gutterLeft / 2, yPos);
        }
        if ((displaySettings.rowCountVisibility === 'right' || displaySettings.rowCountVisibility === 'both') ||
            (displaySettings.rowCountVisibility === 'alternating-right' && displayNumber % 2 !== 0) ||
            (displaySettings.rowCountVisibility === 'alternating-left' && displayNumber % 2 === 0)) {
            if (gutterRight > 0) ctx.fillText(String(displayNumber), gutterLeft + gridContentWidth + gutterRight / 2, yPos);
        }
    }
    for (let cIdx = 0; cIdx < cols; cIdx++) {
        const displayNumber = cIdx + 1;
        const xPos = gutterLeft + cIdx * scaledCellSize + scaledCellSize / 2;
        if (displaySettings.colCountVisibility === 'top' || displaySettings.colCountVisibility === 'both') {
            if (gutterTop > 0) ctx.fillText(String(displayNumber), xPos, gutterTop / 2);
        }
        if (displaySettings.colCountVisibility === 'bottom' || displaySettings.colCountVisibility === 'both') {
            if (gutterBottom > 0) ctx.fillText(String(displayNumber), xPos, gutterTop + gridContentHeight + gutterBottom / 2);
        }
    }
    
    // Draw Copyright
    if (includeCopyright) {
        ctx.fillStyle = isDarkMode ? 'rgba(200, 200, 200, 0.8)' : 'rgba(50, 50, 50, 0.8)';
        ctx.font = `${COPYRIGHT_FONT_SIZE}px 'ui-sans-serif', system-ui, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        const copyrightX = totalWidth - 5; // 5px padding from right edge
        let copyrightY = totalHeight - 5; // 5px padding from bottom edge
        ctx.fillText(COPYRIGHT_TEXT_LINE2, copyrightX, copyrightY);
        copyrightY -= COPYRIGHT_LINE_HEIGHT;
        ctx.fillText(COPYRIGHT_TEXT_LINE1, copyrightX, copyrightY);
    }

    return canvas.toDataURL('image/jpeg', 0.9); // 0.9 quality
  } catch (error) {
    console.error("Error generating chart JPEG:", error);
    return null;
  }
}