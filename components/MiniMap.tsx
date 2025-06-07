
import React, { useRef, useEffect, useCallback } from 'react';
import { ChartState, Point, KeyDefinition, MiniMapProps } from '../types';
import {
    DEFAULT_STITCH_COLOR_DARK,
    DEFAULT_STITCH_COLOR_LIGHT,
    KEY_ID_EMPTY,
    DEFAULT_CELL_COLOR_DARK,
    DEFAULT_CELL_COLOR_LIGHT,
    GRID_LINE_COLOR_DARK,
    GRID_LINE_COLOR_LIGHT,
    TRANSPARENT_BACKGROUND_SENTINEL,
    THEME_DEFAULT_BACKGROUND_SENTINEL,
    THEME_DEFAULT_SYMBOL_COLOR_SENTINEL
} from '../constants';

export const MiniMap: React.FC<MiniMapProps> = ({
  chartState,
  keyPalette,
  viewport,
  onPan,
  isDarkMode,
  maxContainerSize
}) => {
  const { rows, cols, layers } = chartState;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); 

  const themeDefaultBg = isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT;
  const gridLineBg = isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;

  const defaultKeyDefForEmpty = keyPalette.find(k => k.id === KEY_ID_EMPTY) ||
                      {
                        id: KEY_ID_EMPTY, name: "No Stitch", width: 1, height: 1,
                        backgroundColor: TRANSPARENT_BACKGROUND_SENTINEL,
                        symbolColor: isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT
                      };

  const baseEmptyBgColorForMinimap = defaultKeyDefForEmpty.backgroundColor === TRANSPARENT_BACKGROUND_SENTINEL
    ? gridLineBg
    : (defaultKeyDefForEmpty.backgroundColor === THEME_DEFAULT_BACKGROUND_SENTINEL ? themeDefaultBg : defaultKeyDefForEmpty.backgroundColor);


  const getMinimapCellColor = useCallback((r_idx: number, c_idx: number): string => {
    let finalKeyId: string | null = null;
    // Iterate from top visible layer downwards to find the keyId for the cell
    for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (layer.isVisible && layer.grid[r_idx]?.[c_idx]) {
            const cellInGrid = layer.grid[r_idx][c_idx];
            // Consider the keyId only if it's not null (meaning it's explicitly set)
            // and it's an anchor cell or a 1x1 key. For MxN parts, we only care about the anchor.
            const keyDefOnLayer = keyPalette.find(k => k.id === cellInGrid.keyId);
            if (cellInGrid.keyId !== null && keyDefOnLayer && (cellInGrid.isAnchorCellForMxN || (keyDefOnLayer.width === 1 && keyDefOnLayer.height === 1))) {
                finalKeyId = cellInGrid.keyId;
                break; 
            } else if (cellInGrid.keyId !== null && keyDefOnLayer && !cellInGrid.isAnchorCellForMxN && (keyDefOnLayer.width > 1 || keyDefOnLayer.height > 1)){
                 // This is part of an MxN symbol, use its main keyId
                finalKeyId = cellInGrid.keyId;
                break;
            }
        }
    }
    
    const keyDef = finalKeyId ? (keyPalette.find(k => k.id === finalKeyId) || defaultKeyDefForEmpty) : defaultKeyDefForEmpty;

    let cellBgColor: string;
    if (keyDef.backgroundColor === TRANSPARENT_BACKGROUND_SENTINEL) {
      cellBgColor = gridLineBg;
    } else if (keyDef.backgroundColor === THEME_DEFAULT_BACKGROUND_SENTINEL) {
      cellBgColor = themeDefaultBg;
    } else {
      cellBgColor = keyDef.backgroundColor;
    }
    
    const keyHasRenderableContent = (keyDef.cells && keyDef.cells.flat().some(cell => cell !== null)) || (keyDef.lines && keyDef.lines.length > 0);

    if (keyHasRenderableContent && cellBgColor === baseEmptyBgColorForMinimap && keyDef.id !== KEY_ID_EMPTY) {
        let symbolBaseColor = keyDef.symbolColor;
        if (symbolBaseColor === THEME_DEFAULT_SYMBOL_COLOR_SENTINEL) {
            symbolBaseColor = isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT;
        }

        if (symbolBaseColor.startsWith('#') && (symbolBaseColor.length === 7 || symbolBaseColor.length === 4)) {
            let rHex, gHex, bHex;
            if (symbolBaseColor.length === 4) {
                rHex = symbolBaseColor[1] + symbolBaseColor[1];
                gHex = symbolBaseColor[2] + symbolBaseColor[2];
                bHex = symbolBaseColor[3] + symbolBaseColor[3];
            } else {
                rHex = symbolBaseColor.substring(1, 3);
                gHex = symbolBaseColor.substring(3, 5);
                bHex = symbolBaseColor.substring(5, 7);
            }
            const rCVal = parseInt(rHex, 16);
            const gCVal = parseInt(gHex, 16);
            const bCVal = parseInt(bHex, 16);
            // Use a noticeable alpha for the symbol color to tint the cell
            return `rgba(${rCVal},${gCVal},${bCVal},0.5)`; 
        }
        // If symbol color is not a hex (e.g. a named color, less likely here), fall back to bg or a default tint
        return cellBgColor; // Or a default tint if symbolBaseColor is unusual
    }
    return cellBgColor;
  }, [layers, keyPalette, defaultKeyDefForEmpty, isDarkMode, gridLineBg, themeDefaultBg, baseEmptyBgColorForMinimap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const containerEl = containerRef.current;

    if (!canvas || !containerEl || rows === 0 || cols === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const minimapRootDivPadding = 0; 
    const containerBorder = 2; 

    const availableHeightForCanvas = maxContainerSize.height - (minimapRootDivPadding * 2) - containerBorder;
    const availableWidthForCanvas = maxContainerSize.width - (minimapRootDivPadding * 2) - containerBorder;
    
    if (availableWidthForCanvas <= 0 || availableHeightForCanvas <= 0) return;

    const scaleX = availableWidthForCanvas / cols;
    const scaleY = availableHeightForCanvas / rows;
    const dynamicMiniCellSize = Math.max(0.1, Math.min(scaleX, scaleY)); 

    const mapContentDrawingWidth = cols * dynamicMiniCellSize;
    const mapContentDrawingHeight = rows * dynamicMiniCellSize;

    containerEl.style.width = `${mapContentDrawingWidth}px`;
    containerEl.style.height = `${mapContentDrawingHeight}px`;
    
    canvas.width = mapContentDrawingWidth;
    canvas.height = mapContentDrawingHeight;
    
    if (dynamicMiniCellSize <= 0) return; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = getMinimapCellColor(r, c);
        ctx.fillRect(
          c * dynamicMiniCellSize,
          r * dynamicMiniCellSize,
          dynamicMiniCellSize,
          dynamicMiniCellSize
        );
      }
    }

    ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 1; 

    const viewRectX_scaled = viewport.x * dynamicMiniCellSize;
    const viewRectY_scaled = viewport.y * dynamicMiniCellSize;
    const viewRectWidth_scaled = viewport.width * dynamicMiniCellSize;
    const viewRectHeight_scaled = viewport.height * dynamicMiniCellSize;

    const drawX_intersect = Math.max(0, viewRectX_scaled);
    const drawY_intersect = Math.max(0, viewRectY_scaled);
    const drawEndX_intersect = Math.min(viewRectX_scaled + viewRectWidth_scaled, canvas.width);
    const drawEndY_intersect = Math.min(viewRectY_scaled + viewRectHeight_scaled, canvas.height);

    const drawWidth_intersect = drawEndX_intersect - drawX_intersect;
    const drawHeight_intersect = drawEndY_intersect - drawY_intersect;

    if (drawWidth_intersect > 0 && drawHeight_intersect > 0) {
        ctx.beginPath();
        const x1 = Math.round(drawX_intersect) + 0.5;
        const y1 = Math.round(drawY_intersect) + 0.5;
        const x2_raw = drawX_intersect + drawWidth_intersect;
        const y2_raw = drawY_intersect + drawHeight_intersect;
        const x2 = (x2_raw >= canvas.width - 0.5) ? Math.round(canvas.width) - 0.5 : Math.round(x2_raw) + 0.5;
        const y2 = (y2_raw >= canvas.height - 0.5) ? Math.round(canvas.height) - 0.5 : Math.round(y2_raw) + 0.5;
        if (x2 > x1 && y2 > y1) {
            ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1, y2); ctx.lineTo(x1, y1);
            ctx.stroke();
        }
    }
  }, [rows, cols, getMinimapCellColor, viewport, isDarkMode, maxContainerSize.width, maxContainerSize.height, chartState]); 

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return; 

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const dynamicMiniCellSize = canvas.width / cols; 
    if (dynamicMiniCellSize <= 0) return; 

    const targetGridX = Math.floor(clickX / dynamicMiniCellSize);
    const targetGridY = Math.floor(clickY / dynamicMiniCellSize);

    onPan({ x: targetGridX, y: targetGridY });
  };

  return (
    <div 
        ref={containerRef}
        className="w-full h-full border border-neutral-300 dark:border-neutral-600 bg-neutral-200/80 dark:bg-neutral-700/80 relative overflow-hidden cursor-pointer shadow-lg rounded"
        onClick={handleClick}
        style={{ backdropFilter: 'blur(2px)' }}
    >
        <h3 className="absolute top-1 left-1 text-xs font-semibold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider select-none pointer-events-none px-1 py-0.5 rounded bg-transparent">
            Mini Map
        </h3>
        <canvas ref={canvasRef} className="block" />
        <p className="absolute bottom-1 left-1 text-xs text-neutral-600 dark:text-neutral-300 italic select-none pointer-events-none px-1 py-0.5 rounded bg-transparent">
            Click to pan.
        </p>
    </div>
  );
};
