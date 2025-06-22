import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChartState, StitchSymbolDef, Tool, Point, SelectionRect, ContextMenuItem, HoveredGutterInfo, DraggedCellsInfo, ClipboardData, KeyDefinition, KeyInstance } from '../types';
import { ContextMenu } from './ContextMenu';
import {
    CELL_SIZE, GRID_LINE_COLOR_LIGHT, GRID_LINE_COLOR_DARK, KEY_ID_EMPTY,
    DEFAULT_CELL_COLOR_LIGHT, DEFAULT_CELL_COLOR_DARK, GUTTER_SIZE, TRANSPARENT_BACKGROUND_SENTINEL,
    THEME_DEFAULT_BACKGROUND_SENTINEL, DEFAULT_STITCH_COLOR_LIGHT, DEFAULT_STITCH_COLOR_DARK
} from '../constants';
import { PlusIcon, XIcon } from './Icon';
import { drawStitchSymbolOnCanvas } from '../canvasUtils';

interface KnitCanvasProps {
  chartState: ChartState;
  keyPalette: KeyDefinition[];
  activeTool: Tool;
  allSymbols: StitchSymbolDef[];
  isDarkMode: boolean;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  effectiveZoomLevels: number[];
  viewOffset: Point;
  onViewOffsetChange: (newOffset: Point) => void;
  canvasSize: {width: number, height: number};

  selection: SelectionRect | null;
  isActuallyDrawingSel: boolean;
  selectionDragAnchorForCanvas: Point | null;
  isActuallyDraggingSel: boolean;
  draggedCellsPreviewInfo: DraggedCellsInfo | null;
  dragPreviewSnappedGridPosition: Point | null;

  onSelectionChange: (rawSelection: SelectionRect | null, isStillDrawing: boolean, currentActionPoint?: Point) => void;
  onCellAction: (anchorCoords: Point, keyDefToApply: KeyDefinition | null) => void; // Simplified signature
  onSelectionDragStart: (dragInfo: DraggedCellsInfo, initialGridPos: Point, event: React.MouseEvent) => void;
  onSelectionDragMove: (snappedGridPos: Point, event: React.MouseEvent) => void;
  onSelectionDragEnd: (dropTarget: Point | null, event: React.MouseEvent) => void;

  onRequestApplyActiveKeyToSelection: () => void;
  onRequestClearAllInSelection: () => void;

  onInsertRow: (rowIndex: number) => void;
  onDeleteRow: (rowIndex: number) => void;
  onInsertColumn: (colIndex: number) => void;
  onDeleteColumn: (colIndex: number) => void;

  selectAllActiveLayerFlag: string | null;
  onSelectAllProcessed: () => void;

  onCopySelection: () => void;
  onCutSelection: () => void;
  onPasteFromClipboard: () => void;
  canPaste: boolean;

  isPreviewingPaste: boolean;
  pastePreviewInfo: ClipboardData | null;
  pastePreviewAnchor: Point | null;
  hoveredCanvasCell: Point | null;
  onHoveredCellChange: (coords: Point | null) => void;
  onPastePreviewMove: (newAnchor: Point) => void;
  onPastePreviewFinalize: () => void;
  onPastePreviewCancel: () => void;
  activeKeyId: string | null;

  onPenDragSessionStart: () => void;
  onPenDragSessionContinue: () => void;
  onPenDragSessionEnd: () => void;
}


export const KnitCanvas: React.FC<KnitCanvasProps> = ({
  chartState, keyPalette, activeTool, allSymbols, isDarkMode, zoomLevel, setZoomLevel, effectiveZoomLevels,
  viewOffset, onViewOffsetChange: externalOnViewOffsetChange, canvasSize,
  selection, isActuallyDrawingSel, selectionDragAnchorForCanvas,
  isActuallyDraggingSel, draggedCellsPreviewInfo, dragPreviewSnappedGridPosition,
  onSelectionChange, onCellAction, onSelectionDragStart, onSelectionDragMove, onSelectionDragEnd,
  onRequestApplyActiveKeyToSelection, onRequestClearAllInSelection,
  onInsertRow, onDeleteRow, onInsertColumn, onDeleteColumn,
  selectAllActiveLayerFlag, onSelectAllProcessed,
  onCopySelection, onCutSelection, onPasteFromClipboard, canPaste,
  isPreviewingPaste, pastePreviewInfo, pastePreviewAnchor, hoveredCanvasCell,
  onHoveredCellChange, onPastePreviewMove, onPastePreviewFinalize, onPastePreviewCancel,
  activeKeyId,
  onPenDragSessionStart, onPenDragSessionContinue, onPenDragSessionEnd,
}) => {
  const { rows, cols, layers, activeLayerId: currentActiveLayerIdFromChartState, orientation, displaySettings } = chartState;
  const activeLayer = layers.find(l => l.id === currentActiveLayerIdFromChartState);

  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const interactionCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const currentMousePositionRef = useRef<{ xInCanvas: number, yInCanvas: number, xInPannable: number, yInPannable: number } | null>(null);


  const [isPenDrawing, setIsPenDrawing] = useState(false);
  const [isMiddleClickPanning, setIsMiddleClickPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [hoveredGutterInfo, setHoveredGutterInfo] = useState<HoveredGutterInfo | null>(null);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; items: ContextMenuItem[]; } | null>(null);

  const scaledCellSize = CELL_SIZE * zoomLevel;
  const noStitchKeyDef = keyPalette.find(k => k.id === KEY_ID_EMPTY) ||
    { id: KEY_ID_EMPTY, name: "No Stitch", width: 1, height: 1,
      backgroundColor: TRANSPARENT_BACKGROUND_SENTINEL,
      symbolColor: isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT
    };

  const gutterLeft = (displaySettings.rowCountVisibility === 'left' || displaySettings.rowCountVisibility === 'both' || displaySettings.rowCountVisibility === 'alternating-left' || displaySettings.rowCountVisibility === 'alternating-right') ? GUTTER_SIZE : 0;
  const gutterRight = (displaySettings.rowCountVisibility === 'right' || displaySettings.rowCountVisibility === 'both' || displaySettings.rowCountVisibility === 'alternating-left' || displaySettings.rowCountVisibility === 'alternating-right') ? GUTTER_SIZE : 0;
  const gutterTop = (displaySettings.colCountVisibility === 'top' || displaySettings.colCountVisibility === 'both') ? GUTTER_SIZE : 0;
  const gutterBottom = (displaySettings.colCountVisibility === 'bottom' || displaySettings.colCountVisibility === 'both') ? GUTTER_SIZE : 0;


  const actualGridContentWidth = cols * scaledCellSize;
  const actualGridContentHeight = rows * scaledCellSize;
  const totalPannableWidth = gutterLeft + actualGridContentWidth + gutterRight;
  const totalPannableHeight = gutterTop + actualGridContentHeight + gutterBottom;


  const onViewOffsetChange = useCallback((proposedOffset: Point) => {
    let clampedX = proposedOffset.x;
    let clampedY = proposedOffset.y;

    if (totalPannableWidth <= canvasSize.width) {
        clampedX = Math.max(0, Math.min(proposedOffset.x, canvasSize.width - totalPannableWidth));
    } else {
        clampedX = Math.max(canvasSize.width - totalPannableWidth, Math.min(0, proposedOffset.x));
    }

    if (totalPannableHeight <= canvasSize.height) {
        clampedY = Math.max(0, Math.min(proposedOffset.y, canvasSize.height - totalPannableHeight));
    } else {
        clampedY = Math.max(canvasSize.height - totalPannableHeight, Math.min(0, proposedOffset.y));
    }
    externalOnViewOffsetChange({ x: clampedX, y: clampedY});
  }, [totalPannableWidth, totalPannableHeight, canvasSize.width, canvasSize.height, externalOnViewOffsetChange]);

  const fixedGridLineColor = isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;

  const redrawCellOnBaseCanvas = useCallback(async (r: number, c: number, keyDefToApply: KeyDefinition) => {
    if (!baseCanvasRef.current || !activeLayer) return;
    const ctx = baseCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const cellX = gutterLeft + c * scaledCellSize;
    const cellY = gutterTop + r * scaledCellSize;

    ctx.save();
    ctx.translate(viewOffset.x, viewOffset.y);

    ctx.clearRect(cellX, cellY, scaledCellSize, scaledCellSize);

    let bgColor = keyDefToApply.backgroundColor;
    if (bgColor === TRANSPARENT_BACKGROUND_SENTINEL) bgColor = isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;
    else if (bgColor === THEME_DEFAULT_BACKGROUND_SENTINEL) bgColor = isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT;

    ctx.fillStyle = bgColor;
    ctx.fillRect(cellX, cellY, scaledCellSize, scaledCellSize);

    if (keyDefToApply && keyDefToApply.id !== KEY_ID_EMPTY) {
      await drawStitchSymbolOnCanvas(
        ctx, keyDefToApply, allSymbols, cellX, cellY, scaledCellSize, isDarkMode,
        0, 0
      );
    }

    ctx.strokeStyle = fixedGridLineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Draw bottom and right border for the individual cell, snapped for crispness
    const rightBorderX = Math.round(cellX + scaledCellSize) + 0.5;
    const bottomBorderY = Math.round(cellY + scaledCellSize) + 0.5;
    const roundedCellX = Math.round(cellX) + 0.5;
    const roundedCellY = Math.round(cellY) + 0.5;

    ctx.moveTo(rightBorderX, roundedCellY - 0.5); // Start from top-right for vertical line
    ctx.lineTo(rightBorderX, bottomBorderY);
    ctx.lineTo(roundedCellX - 0.5, bottomBorderY); // Continue to bottom-left for horizontal line
    ctx.stroke();

    ctx.restore();

  }, [activeLayer, keyPalette, scaledCellSize, isDarkMode, allSymbols, gutterLeft, gutterTop, fixedGridLineColor, viewOffset, noStitchKeyDef]);


  const drawBaseLayer = useCallback(async () => {
    if (!baseCanvasRef.current || !activeLayer || canvasSize.width === 0 || canvasSize.height === 0) return;
    const canvas = baseCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    ctx.fillStyle = isDarkMode ? '#1F2937' : '#FCFCFC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewOffset.x, viewOffset.y);

    const gutterBgColor = isDarkMode ? '#374151' : '#E5E7EB';
    if(gutterLeft > 0) ctx.fillRect(0, gutterTop, gutterLeft, actualGridContentHeight);
    if(gutterTop > 0) ctx.fillRect(gutterLeft, 0, actualGridContentWidth, gutterTop);
    if(gutterRight > 0) ctx.fillRect(gutterLeft + actualGridContentWidth, gutterTop, gutterRight, actualGridContentHeight);
    if(gutterBottom > 0) ctx.fillRect(gutterLeft, gutterTop + actualGridContentHeight, actualGridContentWidth, gutterBottom);

    const visibleStartCol = Math.max(0, Math.floor((-viewOffset.x - gutterLeft) / scaledCellSize));
    const visibleEndCol = Math.min(cols, Math.ceil((-viewOffset.x - gutterLeft + canvasSize.width) / scaledCellSize));
    const visibleStartRow = Math.max(0, Math.floor((-viewOffset.y - gutterTop) / scaledCellSize));
    const visibleEndRow = Math.min(rows, Math.ceil((-viewOffset.y - gutterTop + canvasSize.height) / scaledCellSize));

    const symbolDrawingPromises: Promise<void>[] = [];
    for (let r = visibleStartRow; r < visibleEndRow; r++) {
      for (let c = visibleStartCol; c < visibleEndCol; c++) {
        const cellX = gutterLeft + c * scaledCellSize;
        const cellY = gutterTop + r * scaledCellSize;
        const cellData = activeLayer.grid[r]?.[c];
        const keyDef = cellData?.keyId ? (keyPalette.find(k => k.id === cellData.keyId) || noStitchKeyDef) : noStitchKeyDef;

        let bgColor = keyDef.backgroundColor;
        if (bgColor === TRANSPARENT_BACKGROUND_SENTINEL) bgColor = isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;
        else if (bgColor === THEME_DEFAULT_BACKGROUND_SENTINEL) bgColor = isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT;

        ctx.fillStyle = bgColor;
        ctx.fillRect(cellX, cellY, scaledCellSize, scaledCellSize);

        if (keyDef && keyDef.id !== KEY_ID_EMPTY) {
           symbolDrawingPromises.push(drawStitchSymbolOnCanvas(
            ctx, keyDef, allSymbols, cellX, cellY, scaledCellSize, isDarkMode,
            cellData?.keyPartRowOffset, cellData?.keyPartColOffset
          ));
        }
      }
    }
    await Promise.all(symbolDrawingPromises);

    ctx.strokeStyle = fixedGridLineColor;
    ctx.lineWidth = 1;

    // Draw all horizontal grid lines
    for (let r = visibleStartRow; r <= visibleEndRow; r++) {
        ctx.beginPath();
        const yPos = Math.round(gutterTop + r * scaledCellSize) + 0.5;
        const lineStartX = Math.round(gutterLeft + visibleStartCol * scaledCellSize) + 0.5;
        const lineEndX = Math.round(gutterLeft + visibleEndCol * scaledCellSize) + 0.5;
        ctx.moveTo(lineStartX - 0.5, yPos);
        ctx.lineTo(lineEndX - 0.5, yPos);
        ctx.stroke();
    }
    // Draw all vertical grid lines
    for (let c = visibleStartCol; c <= visibleEndCol; c++) {
        ctx.beginPath();
        const xPos = Math.round(gutterLeft + c * scaledCellSize) + 0.5;
        const lineStartY = Math.round(gutterTop + visibleStartRow * scaledCellSize) + 0.5;
        const lineEndY = Math.round(gutterTop + visibleEndRow * scaledCellSize) + 0.5;
        ctx.moveTo(xPos, lineStartY - 0.5);
        ctx.lineTo(xPos, lineEndY - 0.5);
        ctx.stroke();
    }

    ctx.fillStyle = isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT;
    const gutterFontSize = Math.max(8, Math.min(14, scaledCellSize * 0.4 * Math.max(0.5, 1/zoomLevel) ));
    ctx.font = `${gutterFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const getRowDisplayNumber = (rIdx: number) => orientation === 'bottom-up' ? rows - rIdx : rIdx + 1;
    for (let rIdx = visibleStartRow; rIdx < visibleEndRow; rIdx++) {
        const displayNumber = getRowDisplayNumber(rIdx);
        const yPosText = gutterTop + rIdx * scaledCellSize + scaledCellSize / 2;
        if (-viewOffset.y <= yPosText && yPosText <= -viewOffset.y + canvasSize.height) {
            if ((displaySettings.rowCountVisibility === 'left' || displaySettings.rowCountVisibility === 'both') ||
                (displaySettings.rowCountVisibility === 'alternating-left' && displayNumber % 2 !== 0) ||
                (displaySettings.rowCountVisibility === 'alternating-right' && displayNumber % 2 === 0)) {
                if(gutterLeft > 0) ctx.fillText(String(displayNumber), gutterLeft / 2, yPosText);
            }
            if ((displaySettings.rowCountVisibility === 'right' || displaySettings.rowCountVisibility === 'both') ||
                (displaySettings.rowCountVisibility === 'alternating-right' && displayNumber % 2 !== 0) ||
                (displaySettings.rowCountVisibility === 'alternating-left' && displayNumber % 2 === 0)) {
                if(gutterRight > 0) ctx.fillText(String(displayNumber), gutterLeft + actualGridContentWidth + gutterRight / 2, yPosText);
            }
        }
    }
     for (let cIdx = visibleStartCol; cIdx < visibleEndCol; cIdx++) {
        const displayNumber = cIdx + 1;
        const xPosText = gutterLeft + cIdx * scaledCellSize + scaledCellSize / 2;
         if (-viewOffset.x <= xPosText && xPosText <= -viewOffset.x + canvasSize.width) {
            if (displaySettings.colCountVisibility === 'top' || displaySettings.colCountVisibility === 'both') {
                if(gutterTop > 0) ctx.fillText(String(displayNumber), xPosText, gutterTop / 2);
            }
            if (displaySettings.colCountVisibility === 'bottom' || displaySettings.colCountVisibility === 'both') {
                if(gutterBottom > 0) ctx.fillText(String(displayNumber), xPosText, gutterTop + actualGridContentHeight + gutterBottom / 2);
            }
        }
    }
    ctx.restore();
  }, [
      activeLayer, keyPalette, allSymbols, isDarkMode, zoomLevel, viewOffset, canvasSize, rows, cols,
      displaySettings, orientation, noStitchKeyDef, scaledCellSize, actualGridContentWidth, actualGridContentHeight,
      gutterLeft, gutterTop, gutterRight, gutterBottom, fixedGridLineColor
  ]);

  const drawInteractionLayer = useCallback(async () => {
    if (!interactionCanvasRef.current || !activeLayer || canvasSize.width === 0 || canvasSize.height === 0) return;
    const canvas = interactionCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    ctx.save();
    ctx.translate(viewOffset.x, viewOffset.y);

    if (selection) {
        const normSel = {
            start: { x: Math.min(selection.start.x, selection.end.x), y: Math.min(selection.start.y, selection.end.y) },
            end: { x: Math.max(selection.start.x, selection.end.x), y: Math.max(selection.start.y, selection.end.y) }
        };
        ctx.strokeStyle = isDarkMode ? '#F7A17F' : '#E3815D';
        ctx.lineWidth = 2 / zoomLevel;
        ctx.strokeRect(
            gutterLeft + normSel.start.x * scaledCellSize,
            gutterTop + normSel.start.y * scaledCellSize,
            (normSel.end.x - normSel.start.x + 1) * scaledCellSize,
            (normSel.end.y - normSel.start.y + 1) * scaledCellSize
        );
    }

    if (hoveredCanvasCell && !isPreviewingPaste && !isPenDrawing && !isMiddleClickPanning && !selection && !isActuallyDraggingSel && !isActuallyDrawingSel && activeTool !== Tool.Move) {
        ctx.fillStyle = isDarkMode ? 'rgba(42, 157, 177, 0.3)' : 'rgba(118, 196, 213, 0.2)';
        ctx.fillRect(
            gutterLeft + hoveredCanvasCell.x * scaledCellSize,
            gutterTop + hoveredCanvasCell.y * scaledCellSize,
            scaledCellSize, scaledCellSize
        );
    }

    const symbolDrawingPromises: Promise<void>[] = [];
    if (isActuallyDraggingSel && draggedCellsPreviewInfo && dragPreviewSnappedGridPosition) {
      ctx.globalAlpha = 0.6;
      for (const relInstance of draggedCellsPreviewInfo.relativeKeyInstances) {
        const keyDef = keyPalette.find(k => k.id === relInstance.keyId);
        if (!keyDef) continue;
        const absAnchorX = dragPreviewSnappedGridPosition.x + relInstance.anchor.x;
        const absAnchorY = dragPreviewSnappedGridPosition.y + relInstance.anchor.y;

        for (let rOffset = 0; rOffset < keyDef.height; rOffset++) {
          for (let cOffset = 0; cOffset < keyDef.width; cOffset++) {
            const cellR = absAnchorY + rOffset;
            const cellC = absAnchorX + cOffset;
            if (cellR >= 0 && cellR < rows && cellC >= 0 && cellC < cols) {
              const cellX = gutterLeft + cellC * scaledCellSize;
              const cellY = gutterTop + cellR * scaledCellSize;
              let bgColor = keyDef.backgroundColor;
              if (bgColor === TRANSPARENT_BACKGROUND_SENTINEL) bgColor = isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;
              else if (bgColor === THEME_DEFAULT_BACKGROUND_SENTINEL) bgColor = isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT;
              ctx.fillStyle = bgColor;
              ctx.fillRect(cellX, cellY, scaledCellSize, scaledCellSize);
              if (keyDef.id !== KEY_ID_EMPTY) {
                 symbolDrawingPromises.push(drawStitchSymbolOnCanvas(
                    ctx, keyDef, allSymbols, cellX, cellY, scaledCellSize, isDarkMode,
                    rOffset, cOffset
                ));
              }
            }
          }
        }
      }
      await Promise.all(symbolDrawingPromises);
      ctx.globalAlpha = 1.0;
    }

    const pasteSymbolPromises: Promise<void>[] = [];
    if (isPreviewingPaste && pastePreviewInfo && pastePreviewAnchor) {
        ctx.globalAlpha = 0.6;
        for (const relInstance of pastePreviewInfo.relativeKeyInstances) {
            const keyDef = keyPalette.find(k => k.id === relInstance.keyId);
            if (!keyDef) continue;
            const absAnchorX = pastePreviewAnchor.x + relInstance.anchor.x;
            const absAnchorY = pastePreviewAnchor.y + relInstance.anchor.y;

            for (let rOffset = 0; rOffset < keyDef.height; rOffset++) {
                for (let cOffset = 0; cOffset < keyDef.width; cOffset++) {
                    const cellR = absAnchorY + rOffset;
                    const cellC = absAnchorX + cOffset;
                    if (cellR >= 0 && cellR < rows && cellC >= 0 && cellC < cols) {
                        const cellX = gutterLeft + cellC * scaledCellSize;
                        const cellY = gutterTop + cellR * scaledCellSize;
                         let bgColor = keyDef.backgroundColor;
                        if (bgColor === TRANSPARENT_BACKGROUND_SENTINEL) bgColor = isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;
                        else if (bgColor === THEME_DEFAULT_BACKGROUND_SENTINEL) bgColor = isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT;
                        ctx.fillStyle = bgColor;
                        ctx.fillRect(cellX, cellY, scaledCellSize, scaledCellSize);
                        if (keyDef.id !== KEY_ID_EMPTY) {
                            pasteSymbolPromises.push(drawStitchSymbolOnCanvas(
                                ctx, keyDef, allSymbols, cellX, cellY, scaledCellSize, isDarkMode,
                                rOffset, cOffset
                            ));
                        }
                    }
                }
            }
        }
        await Promise.all(pasteSymbolPromises);
        ctx.globalAlpha = 1.0;
    }
    ctx.restore();
  }, [
      activeLayer, selection, isDarkMode, viewOffset, scaledCellSize, canvasSize, rows, cols, zoomLevel,
      isActuallyDraggingSel, draggedCellsPreviewInfo, dragPreviewSnappedGridPosition, keyPalette, allSymbols,
      isPreviewingPaste, pastePreviewInfo, pastePreviewAnchor,
      hoveredCanvasCell, isPenDrawing, isMiddleClickPanning, activeTool,
      gutterLeft, gutterTop
  ]);

  useEffect(() => {
    drawBaseLayer().then(() => drawInteractionLayer());
  }, [drawBaseLayer]);

  useEffect(() => {
    drawInteractionLayer();
  }, [drawInteractionLayer]);


  useEffect(() => {
    if (selectAllActiveLayerFlag && activeLayer && activeLayer.id === currentActiveLayerIdFromChartState) {
        const fullSelection = { start: { x: 0, y: 0 }, end: { x: cols - 1, y: rows - 1 } };
        onSelectionChange(fullSelection, false, { x: cols - 1, y: rows - 1 });
        onSelectAllProcessed();
    }
  }, [selectAllActiveLayerFlag, currentActiveLayerIdFromChartState, rows, cols, onSelectAllProcessed, onSelectionChange, activeLayer]);


  const getCoordsFromMouseEvent = useCallback((event: React.MouseEvent | MouseEvent): Point | null => {
    if (!canvasContainerRef.current) return null;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const mouseXInCanvas = event.clientX - rect.left;
    const mouseYInCanvas = event.clientY - rect.top;
    const gridX = Math.floor((mouseXInCanvas - viewOffset.x - gutterLeft) / scaledCellSize);
    const gridY = Math.floor((mouseYInCanvas - viewOffset.y - gutterTop) / scaledCellSize);
    return { x: gridX, y: gridY };
  }, [viewOffset.x, viewOffset.y, gutterLeft, gutterTop, scaledCellSize]);

  const handlePenAction = useCallback(async (coords: Point) => {
    if (activeKeyId) {
        const activeKeyDefinition = keyPalette.find(k => k.id === activeKeyId);
        if (activeKeyDefinition) {
            await redrawCellOnBaseCanvas(coords.y, coords.x, activeKeyDefinition);
            onCellAction(coords, activeKeyDefinition);
        }
    }
  }, [activeKeyId, keyPalette, onCellAction, redrawCellOnBaseCanvas]);

  const handleCanvasMouseDown = async (event: React.MouseEvent) => {
    setContextMenu(null);
    const coords = getCoordsFromMouseEvent(event);
    if (!coords) return;
    const isOverGridCellsArea = coords.x >= 0 && coords.x < cols && coords.y >= 0 && coords.y < rows;

    if (isPreviewingPaste) {
        if (event.button === 0) onPastePreviewFinalize();
        else if (event.button === 2) onPastePreviewCancel();
        return;
    }
    if (hoveredGutterInfo) {
        if ((event.target as HTMLElement).closest('button[data-gutter-control]')) {
             event.stopPropagation(); return;
        }
    }

    if (isOverGridCellsArea) {
        if (event.button === 0) { // Left click
          if (activeTool === Tool.Pen) {
            setIsPenDrawing(true);
            onPenDragSessionStart();
            await handlePenAction(coords); // Await the first action
            onPenDragSessionContinue();
          } else if (activeTool === Tool.Select) {
            let clickedInsideCurrentSelection = false;
            const normSel = selection ? {
                start: { x: Math.min(selection.start.x, selection.end.x), y: Math.min(selection.start.y, selection.end.y) },
                end: { x: Math.max(selection.start.x, selection.end.x), y: Math.max(selection.start.y, selection.end.y) }
            } : null;

            if (normSel && coords.x >= normSel.start.x && coords.x <= normSel.end.x && coords.y >= normSel.start.y && coords.y <= normSel.end.y) {
                clickedInsideCurrentSelection = true;
            }

            if (clickedInsideCurrentSelection && selection && activeLayer && normSel) {
                const selectionWidth = normSel.end.x - normSel.start.x + 1;
                const selectionHeight = normSel.end.y - normSel.start.y + 1;
                const relativeKeyInstances: KeyInstance[] = [];

                for(let rOffset = 0; rOffset < selectionHeight; rOffset++) {
                    for(let cOffset = 0; cOffset < selectionWidth; cOffset++) {
                        const chartR = normSel.start.y + rOffset;
                        const chartC = normSel.start.x + cOffset;
                        const cellInGrid = activeLayer.grid[chartR]?.[chartC];
                        if (cellInGrid?.keyId) {
                            const keyDef = keyPalette.find(k => k.id === cellInGrid.keyId);
                            if (keyDef) {
                                 if (cellInGrid.isAnchorCellForMxN || (keyDef.width===1 && keyDef.height===1)){
                                     if (!relativeKeyInstances.some(inst => inst.keyId === cellInGrid.keyId && inst.anchor.x === cOffset && inst.anchor.y === rOffset)) {
                                         relativeKeyInstances.push({
                                            anchor: { y: rOffset, x: cOffset },
                                            keyId: cellInGrid.keyId,
                                        });
                                    }
                                 }
                            }
                        }
                    }
                }
                const dragStartData: DraggedCellsInfo = {
                    relativeKeyInstances, width: selectionWidth, height: selectionHeight, originalStartCoords: normSel.start
                };
                onSelectionDragStart(dragStartData, coords, event);
            } else {
                onSelectionChange({ start: coords, end: coords }, true, coords);
            }
            setIsPenDrawing(false);
          } else if (activeTool === Tool.Move) {
            setIsPenDrawing(false); setPanStart({x: event.clientX, y: event.clientY });
          }
        } else if (event.button === 1) { // Middle click
          event.preventDefault(); setIsMiddleClickPanning(true); setPanStart({x: event.clientX, y: event.clientY});
        }
    } else { // Clicked outside grid cells (e.g., on gutter or empty space)
        if (event.button === 0) { // Left click
            if (activeTool === Tool.Select && selection) {
                onSelectionChange(null, false, undefined); // Clear selection
            } else if (activeTool === Tool.Move) {
                setIsPenDrawing(false); setPanStart({x: event.clientX, y: event.clientY });
            }
        } else if (event.button === 1) { // Middle click
            event.preventDefault(); setIsMiddleClickPanning(true); setPanStart({x: event.clientX, y: event.clientY});
        }
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent) => {
    if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const mouseXInCanvas = event.clientX - rect.left;
        const mouseYInCanvas = event.clientY - rect.top;
        currentMousePositionRef.current = {
            xInCanvas: mouseXInCanvas,
            yInCanvas: mouseYInCanvas,
            xInPannable: mouseXInCanvas - viewOffset.x,
            yInPannable: mouseYInCanvas - viewOffset.y,
        };
    }

    const coords = getCoordsFromMouseEvent(event);
    if (!coords) { onHoveredCellChange(null); return; }

    const isOverGridCellsArea = coords.x >= 0 && coords.x < cols && coords.y >= 0 && coords.y < rows;

    const HOVER_THRESHOLD = 8 / zoomLevel;
    let newHoveredGutter: HoveredGutterInfo | null = null;
    if (canvasContainerRef.current && currentMousePositionRef.current) {
        const { xInPannable: mouseXInPannableContent, yInPannable: mouseYInPannableContent } = currentMousePositionRef.current;
        for (let r_line = 0; r_line <= rows; r_line++) {
            const lineYPosGutter = gutterTop + r_line * scaledCellSize;
            if (Math.abs(mouseYInPannableContent - lineYPosGutter) < HOVER_THRESHOLD) {
                if ((gutterLeft > 0 && mouseXInPannableContent >=0 && mouseXInPannableContent < gutterLeft) ||
                    (gutterRight > 0 && mouseXInPannableContent >= gutterLeft + actualGridContentWidth && mouseXInPannableContent < totalPannableWidth)) {
                    newHoveredGutter = { type: 'row', index: r_line, displayNumber: getRowColDisplayNumber(r_line < rows ? r_line : r_line -1, 'row').displayNumber };
                    break;
                }
            }
        }
        if (!newHoveredGutter) {
            for (let c_line = 0; c_line <= cols; c_line++) {
                const lineXPosGutter = gutterLeft + c_line * scaledCellSize;
                if (Math.abs(mouseXInPannableContent - lineXPosGutter) < HOVER_THRESHOLD) {
                    if ((gutterTop > 0 && mouseYInPannableContent >=0 && mouseYInPannableContent < gutterTop) ||
                        (gutterBottom > 0 && mouseYInPannableContent >= gutterTop + actualGridContentHeight && mouseYInPannableContent < totalPannableHeight )) {
                        newHoveredGutter = { type: 'col', index: c_line, displayNumber: getRowColDisplayNumber(c_line < cols ? c_line : c_line -1, 'col').displayNumber };
                        break;
                    }
                }
            }
        }
    }
    setHoveredGutterInfo(newHoveredGutter);


    if (isOverGridCellsArea && !newHoveredGutter) {
        if(!isActuallyDraggingSel && !isPenDrawing && !isActuallyDrawingSel && activeTool !== Tool.Move) onHoveredCellChange(coords);
        else onHoveredCellChange(null);
        if (isPreviewingPaste) onPastePreviewMove(coords);
    } else if (!newHoveredGutter) {
        onHoveredCellChange(null);
        if (isPreviewingPaste) onPastePreviewMove(coords);
    }


    if (isActuallyDraggingSel) {
        onSelectionDragMove(coords, event);
    } else if (isActuallyDrawingSel && activeTool === Tool.Select && selectionDragAnchorForCanvas) {
         const selEndX = Math.max(0, Math.min(cols - 1, coords.x));
         const selEndY = Math.max(0, Math.min(rows - 1, coords.y));
         onSelectionChange({start: selectionDragAnchorForCanvas, end: {x: selEndX, y: selEndY}}, true, {x: selEndX, y: selEndY});
    } else if (isMiddleClickPanning && panStart) {
        const dx = event.clientX - panStart.x; const dy = event.clientY - panStart.y;
        onViewOffsetChange({ x: viewOffset.x + dx, y: viewOffset.y + dy });
        setPanStart({x: event.clientX, y: event.clientY});
    } else if (activeTool === Tool.Move && panStart && event.buttons === 1) {
        const dx = event.clientX - panStart.x; const dy = event.clientY - panStart.y;
        onViewOffsetChange({ x: viewOffset.x + dx, y: viewOffset.y + dy });
        setPanStart({x: event.clientX, y: event.clientY});
    } else if (isPenDrawing && isOverGridCellsArea && activeTool === Tool.Pen) {
         handlePenAction(coords);
    }
  };

  const handleGlobalMouseUp = useCallback((event: MouseEvent) => {
    if (isPenDrawing) {
      setIsPenDrawing(false);
      onPenDragSessionEnd(); // Signal App: drag has ended
    }
    if (isMiddleClickPanning) setIsMiddleClickPanning(false);
    if (panStart) setPanStart(null);
    const coords = getCoordsFromMouseEvent(event);

    if (isActuallyDraggingSel && dragPreviewSnappedGridPosition) {
        onSelectionDragEnd(dragPreviewSnappedGridPosition, event as unknown as React.MouseEvent);
    } else if (isActuallyDrawingSel && selectionDragAnchorForCanvas) {
        const finalCoords = coords ? {x: Math.max(0, Math.min(cols - 1, coords.x)), y: Math.max(0, Math.min(rows - 1, coords.y))} : selectionDragAnchorForCanvas;
        onSelectionChange({ start: selectionDragAnchorForCanvas, end: finalCoords}, false, finalCoords);
    }
  }, [isPenDrawing, isMiddleClickPanning, panStart, isActuallyDraggingSel, onSelectionDragEnd, dragPreviewSnappedGridPosition, isActuallyDrawingSel, selectionDragAnchorForCanvas, onSelectionChange, cols, rows, getCoordsFromMouseEvent, onPenDragSessionEnd]);

  useEffect(() => {
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleGlobalMouseUp]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDirection = e.deltaY < 0 ? 1 : -1;
      const currentZoomIndex = effectiveZoomLevels.indexOf(zoomLevel);
      let newZoomIndex = currentZoomIndex + zoomDirection;

      newZoomIndex = Math.max(0, Math.min(effectiveZoomLevels.length - 1, newZoomIndex));

      if (effectiveZoomLevels[newZoomIndex] !== zoomLevel) {
        setZoomLevel(effectiveZoomLevels[newZoomIndex]);
      } else {
        onViewOffsetChange({ x: viewOffset.x - e.deltaX, y: viewOffset.y - e.deltaY });
      }
    };

    const canvasElement = canvasContainerRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (canvasElement) {
        canvasElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [effectiveZoomLevels, zoomLevel, setZoomLevel, viewOffset, onViewOffsetChange]);

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isPreviewingPaste) { onPastePreviewCancel(); return; }
    if (isActuallyDraggingSel || isActuallyDrawingSel) { setContextMenu(null); return; }
    setContextMenu(null);

    let items: ContextMenuItem[] = [];
    const isGutterAction = hoveredGutterInfo && (hoveredGutterInfo.type === 'row' || hoveredGutterInfo.type === 'col');

    if (isGutterAction && hoveredGutterInfo) {
        const {type, index, displayNumber} = hoveredGutterInfo;
        if (type === 'row') {
            items.push({ label: `Insert Row Before ${displayNumber}`, action: () => onInsertRow(index) });
            items.push({ label: `Insert Row After ${displayNumber}`, action: () => onInsertRow(index + 1) });
            if (rows > 1) items.push({ label: `Delete Row ${displayNumber}`, action: () => onDeleteRow(index), disabled: rows <=1 });
        } else {
            items.push({ label: `Insert Column Before ${displayNumber}`, action: () => onInsertColumn(index) });
            items.push({ label: `Insert Column After ${displayNumber}`, action: () => onInsertColumn(index + 1) });
             if (cols > 1) items.push({ label: `Delete Column ${displayNumber}`, action: () => onDeleteColumn(index), disabled: cols <=1 });
        }
    } else if (selection) {
        items.push(
            { label: "Copy (Ctrl+C)", action: onCopySelection, disabled: !selection },
            { label: "Cut (Ctrl+X)", action: onCutSelection, disabled: !selection },
            { label: "Paste (Ctrl+V)", action: onPasteFromClipboard, disabled: !canPaste }
        );
        items.push({ isSeparator: true });
        items.push({ label: "Apply Active Key to Selection", action: onRequestApplyActiveKeyToSelection, disabled: !activeKeyId });
        items.push({ label: `Apply "No Stitch" to Selection`, action: onRequestClearAllInSelection });
        items.push({ isSeparator: true });
        items.push({ label: "Deselect Area", action: () => onSelectionChange(null, false, undefined) });
    } else {
        items.push({ label: "Paste (Ctrl+V)", action: onPasteFromClipboard, disabled: !canPaste });
    }

    if (items.length > 0 && items[items.length-1]?.isSeparator) items.pop();
    if (items.length > 0) {
        setContextMenu({ visible: true, x: event.clientX, y: event.clientY, items });
    }
  };

  let cursorStyle = 'crosshair';
  if (activeTool === Tool.Select && !isActuallyDrawingSel) cursorStyle = isActuallyDraggingSel ? 'grabbing' : 'cell';
  else if (activeTool === Tool.Move || isMiddleClickPanning) cursorStyle = (isMiddleClickPanning || (activeTool === Tool.Move && panStart)) ? 'grabbing' : 'grab';
  if (isPreviewingPaste) cursorStyle = 'copy';

  const getRowColDisplayNumber = (index: number, type: 'row' | 'col'): { displayNumber: number, isPrimaryDirection: boolean } => {
    const displayNumber = type === 'row'
        ? (orientation === 'bottom-up' ? rows - index : index + 1)
        : index + 1;

    let isPrimaryDirection = true;
    if (type === 'row') {
        if (displaySettings.rowCountVisibility === 'alternating-left') isPrimaryDirection = displayNumber % 2 !== 0;
        if (displaySettings.rowCountVisibility === 'alternating-right') isPrimaryDirection = displayNumber % 2 === 0;
    }
    return { displayNumber, isPrimaryDirection };
  };

  const renderGutterControls = (type: 'row' | 'col', lineIndex: number, positionStyle: React.CSSProperties) => {
    const { displayNumber } = getRowColDisplayNumber(lineIndex < (type === 'row' ? rows : cols) ? lineIndex : lineIndex -1, type);
    const isLastLine = type === 'row' ? lineIndex === rows : lineIndex === cols;

    return (
        <div style={{ ...positionStyle, display: 'flex', flexDirection: type === 'row' ? 'row' : 'column', gap: '2px', zIndex:15, pointerEvents: 'auto' }}>
            <button data-gutter-control onClick={() => type === 'row' ? onInsertRow(lineIndex) : onInsertColumn(lineIndex)} className="p-0.5 rounded bg-neutral-200/80 dark:bg-neutral-700/80 hover:bg-primary/40 dark:hover:bg-primary-dark/50 text-neutral-700 dark:text-neutral-200 hover:text-primary-dark dark:hover:text-primary-light transition-colors shadow-md" title={`Insert ${type} here`} aria-label={`Insert ${type}`}><PlusIcon size={14}/></button>
            {!isLastLine && (type === 'row' ? rows > 1 : cols > 1) &&
                <button data-gutter-control onClick={() => type === 'row' ? onDeleteRow(lineIndex) : onDeleteColumn(lineIndex)} className="p-0.5 rounded bg-neutral-200/80 dark:bg-neutral-700/80 hover:bg-red-500/40 dark:hover:bg-red-400/50 text-neutral-700 dark:text-neutral-200 hover:text-red-700 dark:hover:text-red-500 transition-colors shadow-md" title={`Delete ${type} ${displayNumber}`} aria-label={`Delete ${type}`}><XIcon size={14}/></button>
            }
        </div>
    );
  }

  return (
    <div
      ref={canvasContainerRef}
      className="w-full h-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative select-none touch-none"
      style={{ cursor: cursorStyle }}
      onContextMenu={handleContextMenu}
      onMouseMove={handleCanvasMouseMove}
      onMouseDown={handleCanvasMouseDown}
      onMouseLeave={() => { onHoveredCellChange(null); setHoveredGutterInfo(null); if(isPenDrawing) {setIsPenDrawing(false); onPenDragSessionEnd();} }}
      aria-label="Knitting Chart Canvas"
      role="application"
    >
      <canvas ref={baseCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} aria-hidden="true" />
      <canvas ref={interactionCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden="true" />

      <div style={{ position: 'absolute', left: viewOffset.x, top: viewOffset.y, width: totalPannableWidth, height: totalPannableHeight, pointerEvents: 'none', zIndex: 5}}>
          {Array.from({ length: rows + 1 }).map((_, r_line) => {
            if (!(hoveredGutterInfo?.type === 'row' && hoveredGutterInfo.index === r_line)) return null;

            let showLeftControls = false;
            let showRightControls = false;
            const vizRows = displaySettings.rowCountVisibility;

            if (vizRows === 'left') showLeftControls = true;
            else if (vizRows === 'right') showRightControls = true;
            else if (vizRows === 'both' || vizRows === 'alternating-left' || vizRows === 'alternating-right') {
                showLeftControls = true;
                showRightControls = true;
            }
            if (gutterLeft === 0) showLeftControls = false;
            if (gutterRight === 0) showRightControls = false;

            return (
                <React.Fragment key={`row-gutter-controls-${r_line}`}>
                    {showLeftControls && renderGutterControls('row', r_line, {position: 'absolute', top: `${gutterTop + r_line * scaledCellSize - 10}px`, left: `${gutterLeft / 2 - 20}px`})}
                    {showRightControls && renderGutterControls('row', r_line, {position: 'absolute', top: `${gutterTop + r_line * scaledCellSize - 10}px`, left: `${gutterLeft + actualGridContentWidth + gutterRight / 2 - 20}px`})}
                </React.Fragment>
            );
          })}
          {Array.from({ length: cols + 1 }).map((_, c_line) => {
            if (!(hoveredGutterInfo?.type === 'col' && hoveredGutterInfo.index === c_line)) return null;

            let showTopControls = false;
            let showBottomControls = false;
            const vizCols = displaySettings.colCountVisibility;
            const mouseYInPannable = currentMousePositionRef.current?.yInPannable;

            if (vizCols === 'top') {
                showTopControls = true;
            } else if (vizCols === 'bottom') {
                showBottomControls = true;
            } else if (vizCols === 'both') {
                if (mouseYInPannable !== undefined) {
                    // Determine if mouse is in the top or bottom gutter region for this specific column line
                    if (mouseYInPannable >= 0 && mouseYInPannable < gutterTop) {
                        showTopControls = true;
                    } else if (mouseYInPannable >= gutterTop + actualGridContentHeight && mouseYInPannable < totalPannableHeight) {
                        showBottomControls = true;
                    } else {
                        // Fallback if mouse is somehow not directly in a gutter but line is hovered
                        // (e.g. directly on the grid line boundary) - default to showing based on halves
                         if (mouseYInPannable < gutterTop + actualGridContentHeight / 2) {
                            showTopControls = true;
                         } else {
                            showBottomControls = true;
                         }
                    }
                } else { // Fallback if mouse position isn't available (should be rare)
                    showTopControls = true; showBottomControls = true;
                }
            }

            if(gutterTop === 0) showTopControls = false;
            if(gutterBottom === 0) showBottomControls = false;

            return (
                <React.Fragment key={`col-gutter-controls-${c_line}`}>
                    {showTopControls && renderGutterControls('col', c_line, {position: 'absolute', left: `${gutterLeft + c_line * scaledCellSize - 10}px`, top: `${gutterTop / 2 - 20}px`})}
                    {showBottomControls && renderGutterControls('col', c_line, {position: 'absolute', left: `${gutterLeft + c_line * scaledCellSize - 10}px`, top: `${gutterTop + actualGridContentHeight + gutterBottom / 2 - 20}px`})}
                </React.Fragment>
            );
          })}
      </div>

      {contextMenu?.visible && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />}
    </div>
  );
};
