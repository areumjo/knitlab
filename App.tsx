import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { TabbedSidebar } from './components/TabbedSidebar';
import { KnitCanvas } from './components/KnitCanvas';
import { BlockEditorModal } from './components/BlockEditorModal';
import { ColorEditorModal } from './components/ColorEditorModal';
import { ImageProcessorModal } from './components/ImageProcessorModal';
import { ChartSettingsModal } from './components/ChartSettingsModal';
import { FloatingToolPalette } from './components/FloatingToolPalette';
import { TopRibbon, KeyUsageData } from './components/TopRibbon';
import { MiniMap } from './components/MiniMap';
import { ExportPreviewModal } from './components/ExportPreviewModal';
import { Tool, Layer, ChartState, Point, SelectionRect, TabId, DraggedCellsInfo, KeyInstance, ApplicationState, ClipboardData, KeyDefinition, ChartDisplaySettings, ProcessedImageData, StitchSymbolDef } from './types';
import {
  INITIAL_APPLICATION_STATE,
  INITIAL_CHART_STATE,
  DEFAULT_CELL_COLOR_LIGHT,
  DEFAULT_CELL_COLOR_DARK,
  DEFAULT_STITCH_COLOR_LIGHT,
  DEFAULT_STITCH_COLOR_DARK,
  ZOOM_LEVELS_BASE,
  DEFAULT_ZOOM_INDEX,
  buildGridFromKeyPlacements,
  CELL_SIZE,
  GUTTER_SIZE,
  createNewSheet,
  KEY_ID_EMPTY,
  KEY_ID_KNIT_DEFAULT,
  generateNewKeyId,
  generateNewSheetId,
  createChartGrid,
  ABBREVIATION_SKIP_SENTINEL
} from './constants';
import { useChartHistory } from './hooks/useChartHistory';
import { getExpandedSelection } from './utils';
import { generateChartJpeg } from './services/exportService';
import { deserialize, serialize } from './services/serializationService';
import { clearAutosave, loadAutosave, saveAutosave } from './lib/autosave';
import { sanitizeColorworkState } from './lib/colorworkState';
import {
  clearColorworkRegion,
  commitColorworkMutation,
  deleteColorworkColumn,
  deleteColorworkRow,
  insertColorworkColumn,
  insertColorworkRow,
  moveColorworkPlacements,
  opsForTiledSelection,
  pasteColorworkPlacements,
  resizeColorworkLayer,
} from './services/colorworkMutationService';

const MINIMAP_MAX_WIDTH = 200;
const MINIMAP_MAX_HEIGHT = 200;
const FOOTER_DEFAULT_BOTTOM = '8px';
const MINIMAP_DEFAULT_BOTTOM = '8px';
const RESPONSIVE_BREAKPOINT = 768; // md breakpoint for lifting elements
const MINIMAP_SIDE_MARGIN = 8; // Gap between sidebar and minimap, and minimap and screen edge (if applicable)
const ICON_RIBBON_WIDTH_CONST = 56; // From TabbedSidebar
const COLORWORK_SYMBOLS: StitchSymbolDef[] = [];

export const App: React.FC = () => {
  const initialAutosave = useMemo(() => loadAutosave(), []);
  const {
    currentState: applicationState,
    recordChange: recordAppChange,
    undo, redo, canUndo, canRedo,
    resetHistory: resetAppHistory,
    updateCurrentState,
  } = useChartHistory(initialAutosave?.state ?? INITIAL_APPLICATION_STATE);

  const activeSheet = applicationState.sheets.find(s => s.id === applicationState.activeSheetId) || applicationState.sheets[0] || INITIAL_CHART_STATE;

  useEffect(() => {
    const timeout = window.setTimeout(() => saveAutosave(applicationState), 750);
    return () => window.clearTimeout(timeout);
  }, [applicationState]);

  const [activeKeyId, setActiveKeyIdInternal] = useState<string | null>(applicationState.keyPalette[0]?.id || null);

  const [activeSidebarTab, setActiveSidebarTab] = useState<TabId>('sheets');
  const [isSidebarContentVisible, setIsSidebarContentVisible] = useState<boolean>(false);

  const allSymbols = COLORWORK_SYMBOLS;

  const [isBlockEditorOpen, setIsBlockEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<KeyDefinition | null>(null);
  const [isColorEditorOpen, setIsColorEditorOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<KeyDefinition | null>(null);

  const [isImageProcessorModalOpen, setIsImageProcessorModalOpen] = useState(false);

  const [isChartSettingsModalOpen, setIsChartSettingsModalOpen] = useState(false);
  const [isExportPreviewModalOpen, setIsExportPreviewModalOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);

  const getEffectiveZoomLevels = useCallback(() => {
    if (activeSheet && (activeSheet.rows >= 100 || activeSheet.cols >= 100)) {
      return [0.25, ...ZOOM_LEVELS_BASE];
    }
    return ZOOM_LEVELS_BASE;
  }, [activeSheet]);

  const [currentZoom, setCurrentZoomInternal] = useState<number>(() => {
    const effectiveLevels = getEffectiveZoomLevels();
    const initialIndex = ZOOM_LEVELS_BASE.indexOf(1) !== -1 ? ZOOM_LEVELS_BASE.indexOf(1) : DEFAULT_ZOOM_INDEX;
    const safeInitialIndex = Math.min(initialIndex, effectiveLevels.length - 1);
    return effectiveLevels[safeInitialIndex];
  });

  const setCurrentZoom = (newZoom: number) => {
    const effectiveLevels = getEffectiveZoomLevels();
    if (effectiveLevels.includes(newZoom)) {
      setCurrentZoomInternal(newZoom);
    } else {
      let closest = effectiveLevels[0];
      for (const level of effectiveLevels) {
        if (Math.abs(level - newZoom) < Math.abs(closest - newZoom)) {
          closest = level;
        }
      }
      setCurrentZoomInternal(closest);
    }
  };

  useEffect(() => {
    const effectiveLevels = getEffectiveZoomLevels();
    if (!effectiveLevels.includes(currentZoom)) {
        const newDefaultZoomIndex = effectiveLevels.indexOf(1) !== -1 ? effectiveLevels.indexOf(1) : Math.floor(effectiveLevels.length / 2);
        setCurrentZoomInternal(effectiveLevels[newDefaultZoomIndex >= 0 ? newDefaultZoomIndex : 0]);
    }
  }, [activeSheet?.rows, activeSheet?.cols, currentZoom, getEffectiveZoomLevels]);

  const [viewOffset, setViewOffset] = useState<Point>({ x: 0, y: 0 });
  const [canvasContainerSize, setCanvasContainerSize] = useState({ width: 0, height: 0 });
  const mainCanvasWrapperRef = useRef<HTMLDivElement>(null);

  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [selectionAnchorPoint, setSelectionAnchorPoint] = useState<Point | null>(null);
  const [isActuallyDrawingSel, setIsActuallyDrawingSel] = useState(false);

  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [draggedCellsInfo, setDraggedCellsInfo] = useState<DraggedCellsInfo | null>(null);
  const [dragPreviewSnappedGridPosition, setDragPreviewSnappedGridPosition] = useState<Point | null>(null);
  const [lastActionPoint, setLastActionPoint] = useState<Point>({
      x: Math.floor(activeSheet.cols / 2),
      y: Math.floor(activeSheet.rows / 2)
  });

  const [selectAllActiveLayerFlag, setSelectAllActiveLayerFlag] = useState<string | null>(null);

  const [clipboardContent, setClipboardContent] = useState<ClipboardData | null>(null);

  const recordAppChangeRef = useRef(recordAppChange);
  useEffect(() => { recordAppChangeRef.current = recordAppChange; }, [recordAppChange]);

  const [isPreviewingPaste, setIsPreviewingPaste] = useState<boolean>(false);
  const [pastePreviewInfo, setPastePreviewInfo] = useState<ClipboardData | null>(null);
  const [pastePreviewAnchor, setPastePreviewAnchor] = useState<Point | null>(null);
  const [hoveredCanvasCell, setHoveredCanvasCell] = useState<Point | null>(null);

  const [activeTool, setActiveToolInternal] = useState<Tool>(Tool.Pen);

  const setActiveTool = useCallback((newToolOrUpdater: Tool | ((prevTool: Tool) => Tool)) => {
    setActiveToolInternal(prevTool => {
        const newTool = typeof newToolOrUpdater === 'function' ? newToolOrUpdater(prevTool) : newToolOrUpdater;
        if (newTool !== Tool.Select && selection && !isDraggingSelection && !isActuallyDrawingSel) { // Keep selection if dragging/drawing
            setSelection(null);
            setIsActuallyDrawingSel(false); // Should already be false, but defensive
            setSelectionAnchorPoint(null); // Should already be null, but defensive
        }
        return newTool;
    });
  }, [selection, isDraggingSelection, isActuallyDrawingSel]);

  const setActiveKeyId = useCallback((keyId: string | null) => {
    setActiveKeyIdInternal(keyId);
    if (keyId !== null) {
        setActiveTool(Tool.Pen);
    }
  }, [setActiveTool]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);


  useEffect(() => {
    const el = mainCanvasWrapperRef.current;
    if (!el) return;
    const updateSize = () => {
      setCanvasContainerSize({ width: el.offsetWidth, height: el.offsetHeight });
    };
    updateSize();
    // Observe the main element directly so the canvas buffer reallocates on any
    // size change — not just window resizes. Without this, opening the side
    // panel shrinks main but leaves the buffer at its old size, and CSS
    // width:100% squishes the pixels into a non-square aspect ratio.
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeKeyId || !applicationState.keyPalette.find(k => k.id === activeKeyId)) {
      setActiveKeyId(applicationState.keyPalette[0]?.id || null);
    }
  }, [activeKeyId, applicationState.keyPalette, setActiveKeyId]);

  const [showKeyUsageTallyGlobal, setShowKeyUsageTallyGlobal] = useState(true); // Default to true
  const toggleShowKeyUsageTallyGlobal = () => setShowKeyUsageTallyGlobal(prev => !prev);


  const keyUsageData = useMemo((): KeyUsageData[] => {
    if (!activeSheet) return [];
    const counts = new Map<string, number>();
    for (const layer of activeSheet.layers) {
      if (!layer.isVisible) continue;
      for (let r = 0; r < activeSheet.rows; r++) {
        for (let c = 0; c < activeSheet.cols; c++) {
          const cellData = layer.grid[r]?.[c];
          if (cellData?.keyId) {
            counts.set(cellData.keyId, (counts.get(cellData.keyId) || 0) + 1);
          }
        }
      }
    }
    const result: KeyUsageData[] = [];
    for (const [keyId, count] of counts.entries()) {
      const keyDef = applicationState.keyPalette.find(k => k.id === keyId);
      if (keyDef && keyDef.id !== KEY_ID_EMPTY) {
        result.push({ keyDef, count });
      }
    }
    return result.sort((a, b) => b.count - a.count);
  }, [activeSheet, applicationState.keyPalette]);

  const colorworkPalette = useMemo(() => applicationState.keyPalette.filter((key) => {
    if (key.id === KEY_ID_EMPTY) return false;
    if (key.colorCells) return true;
    return key.width === 1
      && key.height === 1
      && (!key.cells || key.cells.flat().every((cell) => cell === null))
      && (!key.lines || key.lines.length === 0)
      && /^#[0-9a-fA-F]{6}$/.test(key.backgroundColor);
  }), [applicationState.keyPalette]);

  const colorworkUsageData = useMemo(
    () => keyUsageData.filter(({ keyDef }) => colorworkPalette.some((color) => color.id === keyDef.id)),
    [keyUsageData, colorworkPalette],
  );

  useEffect(() => {
    if (!colorworkPalette.some((color) => color.id === activeKeyId)) {
      setActiveKeyId(colorworkPalette[0]?.id ?? null);
    }
  }, [activeKeyId, colorworkPalette, setActiveKeyId]);


  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const handleActiveSidebarTabChange = (tabId: TabId) => setActiveSidebarTab(tabId);
  const toggleSidebarContentVisibility = () => setIsSidebarContentVisible(prev => !prev);

  const addOrUpdateKeyInPalette = (keyDef: KeyDefinition) => {
    recordAppChange(prevAppState => {
      const existingIndex = prevAppState.keyPalette.findIndex(k => k.id === keyDef.id);
      let newPalette;
      // Ensure abbreviation is correctly set for KEY_ID_EMPTY
      const finalKeyDef = keyDef.id === KEY_ID_EMPTY
          ? { ...keyDef, abbreviation: ABBREVIATION_SKIP_SENTINEL }
          : keyDef;

      if (existingIndex > -1) {
        newPalette = [...prevAppState.keyPalette];
        newPalette[existingIndex] = finalKeyDef;
      } else {
        newPalette = [...prevAppState.keyPalette, finalKeyDef];
      }
      newPalette = newPalette.map(k => ({
        ...k,
        cells: k.lines && k.lines.length > 0 ? undefined : (k.cells || [[null]]),
        lines: k.cells && k.cells.flat().some(c => c !== null) ? undefined : k.lines,
      }));

      return { ...prevAppState, keyPalette: newPalette };
    });
    setActiveKeyId(keyDef.id);
  };

  const handleOpenKeyEditor = (keyToEdit?: KeyDefinition) => {
    if (keyToEdit?.colorCells) {
      setEditingBlock(keyToEdit);
      setIsBlockEditorOpen(true);
      return;
    }
    if (keyToEdit
      && keyToEdit.width === 1
      && keyToEdit.height === 1
      && (!keyToEdit.cells || keyToEdit.cells.flat().every((cell) => cell === null))
      && (!keyToEdit.lines || keyToEdit.lines.length === 0)
      && /^#[0-9a-fA-F]{6}$/.test(keyToEdit.backgroundColor)) {
      setEditingColor(keyToEdit);
      setIsColorEditorOpen(true);
      return;
    }
    if (keyToEdit) {
      setEditingColor(keyToEdit);
      setIsColorEditorOpen(true);
    }
  };

  const handleOpenBlockEditor = (block?: KeyDefinition) => {
    setEditingBlock(block ?? null);
    setIsBlockEditorOpen(true);
  };

  const handleAddColor = (hex: string) => {
    const normalized = hex.toUpperCase();
    const existing = applicationState.keyPalette.find(
      (key) => key.backgroundColor.toUpperCase() === normalized,
    );
    if (existing) {
      setActiveKeyId(existing.id);
      return;
    }
    addOrUpdateKeyInPalette({
      id: generateNewKeyId().replace(/^key_/, 'key_color_'),
      name: normalized,
      abbreviation: null,
      width: 1,
      height: 1,
      backgroundColor: normalized,
      symbolColor: DEFAULT_STITCH_COLOR_LIGHT,
      cells: [[null]],
    });
  };

  const handleDeleteKeyFromPalette = (keyIdToDelete: string) => {
    recordAppChange(prevAppState => {
      if (prevAppState.keyPalette.length <= 1) {
          alert("Cannot delete the last key.");
          return prevAppState;
      }
      const newPalette = prevAppState.keyPalette.filter(k => k.id !== keyIdToDelete);

      const updatedSheets = prevAppState.sheets.map(sheet => {
        const newLayers = sheet.layers.map(layer => {
          const finalPlacements = layer.keyPlacements.filter(p => p.keyId !== keyIdToDelete);
          const updatedGrid = buildGridFromKeyPlacements(finalPlacements, sheet.rows, sheet.cols, newPalette);
          return {...layer, keyPlacements: finalPlacements, grid: updatedGrid};
        });
        return {...sheet, layers: newLayers};
      });

      return { ...prevAppState, keyPalette: newPalette, sheets: updatedSheets };
    });
     // If the active key was deleted, update the local activeKeyId state
    if (activeKeyId === keyIdToDelete) {
        const newPaletteAfterDelete = applicationState.keyPalette.filter(k => k.id !== keyIdToDelete);
        const newActiveKeyIdCandidate = newPaletteAfterDelete[0]?.id || null;
        setActiveKeyId(newActiveKeyIdCandidate); // This will update the component's state
    }
  };

  const handleDuplicateKey = (keyIdToDuplicate: string) => {
    const keyToDuplicate = applicationState.keyPalette.find(k => k.id === keyIdToDuplicate);
    if (!keyToDuplicate) return;

    let newName = `${keyToDuplicate.name} (Copy)`;
    let nameSuffix = 1;
    while (applicationState.keyPalette.some(k => k.name === newName)) {
        nameSuffix++;
        newName = `${keyToDuplicate.name} (Copy ${nameSuffix})`;
    }

    const newKey: KeyDefinition = {
        ...keyToDuplicate,
        id: generateNewKeyId(),
        name: newName,
        abbreviation: keyToDuplicate.abbreviation, // Copy abbreviation too
        cells: keyToDuplicate.cells ? keyToDuplicate.cells.map(row => row.map(cell => cell ? {...cell} : null)) : undefined,
        colorCells: keyToDuplicate.colorCells?.map(row => [...row]),
        lines: keyToDuplicate.lines ? keyToDuplicate.lines.map(line => ({...line, start: {...line.start}, end: {...line.end}})) : undefined,
    };
    addOrUpdateKeyInPalette(newKey);
    if (newKey.colorCells) handleOpenBlockEditor(newKey);
    else handleOpenKeyEditor(newKey);
  };

  const modifyActiveSheetLayer = useCallback((
    modifier: (layer: Layer, chartRows: number, chartCols: number, keyPalette: KeyDefinition[]) => Layer | null
  ) => {
    recordAppChangeRef.current(prevAppState => {
      const activeSheetIndex = prevAppState.sheets.findIndex(s => s.id === prevAppState.activeSheetId);
      if (activeSheetIndex === -1) return prevAppState;
      const oldActiveSheet = prevAppState.sheets[activeSheetIndex];
      if (!oldActiveSheet.activeLayerId) return prevAppState;
      const activeLayerIndex = oldActiveSheet.layers.findIndex(l => l.id === oldActiveSheet.activeLayerId);
      if (activeLayerIndex === -1) return prevAppState;
      const oldLayer = oldActiveSheet.layers[activeLayerIndex];

      const newLayer = modifier(oldLayer, oldActiveSheet.rows, oldActiveSheet.cols, prevAppState.keyPalette);

      if (newLayer === null) return prevAppState;
      const newLayers = [...oldActiveSheet.layers];
      newLayers[activeLayerIndex] = newLayer;
      const newSheets = [...prevAppState.sheets];
      newSheets[activeSheetIndex] = { ...oldActiveSheet, layers: newLayers };
      return { ...prevAppState, sheets: newSheets };
    });
  }, []);

  const modifyActiveSheetLayerWithModifier = (
    prevAppState: ApplicationState,
    modifier: (layer: Layer, chartRows: number, chartCols: number, keyPalette: KeyDefinition[]) => Layer | null
  ): ApplicationState => {
    const activeSheetIndex = prevAppState.sheets.findIndex(s => s.id === prevAppState.activeSheetId);
    if (activeSheetIndex === -1) return prevAppState;
    const oldActiveSheet = prevAppState.sheets[activeSheetIndex];
    if (!oldActiveSheet.activeLayerId) return prevAppState;
    const activeLayerIndex = oldActiveSheet.layers.findIndex(l => l.id === oldActiveSheet.activeLayerId);
    if (activeLayerIndex === -1) return prevAppState;
    const oldLayer = oldActiveSheet.layers[activeLayerIndex];

    const newLayer = modifier(oldLayer, oldActiveSheet.rows, oldActiveSheet.cols, prevAppState.keyPalette);

    if (newLayer === null) return prevAppState; // No change
    const newLayers = [...oldActiveSheet.layers];
    newLayers[activeLayerIndex] = newLayer;
    const newSheets = [...prevAppState.sheets];
    newSheets[activeSheetIndex] = { ...oldActiveSheet, layers: newLayers };
    return { ...prevAppState, sheets: newSheets };
  };

  const handleChartSettingsSave = (settings: {
    rows: number;
    cols: number;
    orientation: ChartState['orientation'];
    displaySettings: ChartDisplaySettings;
  }) => {
    recordAppChangeRef.current(prevAppState => {
        const currentSheetIndex = prevAppState.sheets.findIndex(s => s.id === prevAppState.activeSheetId);
        if (currentSheetIndex === -1) return prevAppState;
        const oldSheet = prevAppState.sheets[currentSheetIndex];

        let updatedPalette = prevAppState.keyPalette;

        const newLayers = oldSheet.layers.map(layer =>
          resizeColorworkLayer(layer, settings.rows, settings.cols, updatedPalette),
        );

        const updatedSheet: ChartState = {
            ...oldSheet,
            rows: settings.rows,
            cols: settings.cols,
            orientation: settings.orientation,
            displaySettings: settings.displaySettings,
            layers: newLayers,
        };

        const newSheets = [...prevAppState.sheets];
        newSheets[currentSheetIndex] = updatedSheet;

        return { ...prevAppState, keyPalette: updatedPalette, sheets: newSheets };
    });

    setLastActionPoint(prev => ({
        x: Math.min(prev.x, settings.cols -1),
        y: Math.min(prev.y, settings.rows -1)
    }));

    if (selection) {
        const normSel = {
            start: { x: Math.min(selection.start.x, selection.end.x), y: Math.min(selection.start.y, selection.end.y) },
            end: { x: Math.max(selection.start.x, selection.end.x), y: Math.max(selection.start.y, selection.end.y) }
        };
        if(normSel.end.x >= settings.cols || normSel.end.y >= settings.rows) {
            setSelection(null);
            setSelectionAnchorPoint(null);
            setIsActuallyDrawingSel(false);
        }
    }
    setIsChartSettingsModalOpen(false);
  };

  const handleAddSheet = () => {
    recordAppChangeRef.current(prevAppState => {
        const existingNames = prevAppState.sheets.map(s => s.name);
        const newSheet = createNewSheet(existingNames, prevAppState.keyPalette);
        const newSheets = [...prevAppState.sheets, newSheet];
        return {...prevAppState, sheets: newSheets, activeSheetId: newSheet.id };
    });
    setActiveKeyId(applicationState.keyPalette[0]?.id || null);
    setSelection(null);
    setSelectionAnchorPoint(null);
    setIsActuallyDrawingSel(false);
    setViewOffset({x:0, y:0});
  };

  const handleRemoveSheet = (idToRemove: string) => {
    if (applicationState.sheets.length <= 1) {
        alert("Cannot delete the last sheet.");
        return;
    }
    recordAppChangeRef.current(prevAppState => {
        const newSheets = prevAppState.sheets.filter(s => s.id !== idToRemove);
        let newActiveSheetId = prevAppState.activeSheetId;
        if (prevAppState.activeSheetId === idToRemove) {
            newActiveSheetId = newSheets[0]?.id || null;
        }
        return {...prevAppState, sheets: newSheets, activeSheetId: newActiveSheetId };
    });
   if (applicationState.activeSheetId === idToRemove) {
        setSelection(null);
        setSelectionAnchorPoint(null);
        setIsActuallyDrawingSel(false);
        setViewOffset({x:0, y:0});
    }
  };

  const handleSelectSheet = (idToSelect: string) => {
     recordAppChangeRef.current(prevAppState => ({...prevAppState, activeSheetId: idToSelect}));
     setActiveKeyId(applicationState.keyPalette[0]?.id || null);
     setSelection(null);
     setSelectionAnchorPoint(null);
     setIsActuallyDrawingSel(false);
     setViewOffset({x:0, y:0});
  };

  const handleRenameSheetById = (id: string, newName: string) => {
    recordAppChangeRef.current(prev => {
        const newSheets = prev.sheets.map(s => s.id === id ? {...s, name: newName} : s);
        return {...prev, sheets: newSheets};
    });
  };

  const handleAddLayer = () => {
    modifyActiveSheetLayer((_currentLayer, chartRows, chartCols, _currentKeyPalette) => {
      const newLayerName = `Layer ${activeSheet.layers.length + 1}`;
      const newLayer: Layer = {
        id: `layer_${Date.now()}`,
        name: newLayerName,
        isVisible: true,
        grid: createChartGrid(chartRows, chartCols),
        keyPlacements: [],
      };
      recordAppChangeRef.current(prevAppState => {
        const newSheets = prevAppState.sheets.map(s => {
          if (s.id === prevAppState.activeSheetId) {
            return { ...s, layers: [...s.layers, newLayer], activeLayerId: newLayer.id };
          }
          return s;
        });
        return { ...prevAppState, sheets: newSheets };
      });
      return null;
    });
  };

  const handleRemoveLayer = (idToRemove: string) => {
    if (activeSheet.layers.length <= 1) {
      alert("Cannot delete the last layer.");
      return;
    }
    recordAppChangeRef.current(prevAppState => {
      const newSheets = prevAppState.sheets.map(s => {
        if (s.id === prevAppState.activeSheetId) {
          const newLayers = s.layers.filter(l => l.id !== idToRemove);
          let newActiveLayerId = s.activeLayerId;
          if (s.activeLayerId === idToRemove) {
            newActiveLayerId = newLayers[0]?.id || null;
          }
          const currentPalette = prevAppState.keyPalette;
          const reGriddedLayers = newLayers.map(nl => ({
            ...nl,
            grid: buildGridFromKeyPlacements(nl.keyPlacements, s.rows, s.cols, currentPalette)
          }));
          return { ...s, layers: reGriddedLayers, activeLayerId: newActiveLayerId };
        }
        return s;
      });
      return { ...prevAppState, sheets: newSheets };
    });
  };

  const handleToggleLayerVisibility = (idToToggle: string) => {
    recordAppChangeRef.current(prevAppState => {
      const newSheets = prevAppState.sheets.map(s => {
        if (s.id === prevAppState.activeSheetId) {
          const newLayers = s.layers.map(l => l.id === idToToggle ? {...l, isVisible: !l.isVisible} : l);
          return {...s, layers: newLayers};
        }
        return s;
      });
      return {...prevAppState, sheets: newSheets};
    });
  };

  const handleSelectLayer = (idToSelect: string) => {
    recordAppChangeRef.current(prevAppState => {
      const newSheets = prevAppState.sheets.map(s => s.id === prevAppState.activeSheetId ? {...s, activeLayerId: idToSelect} : s);
      return {...prevAppState, sheets: newSheets};
    });
  };

  const isCurrentlyDragPaintingRef = useRef(false);

  const handlePenDragSessionStart = useCallback(() => {
    isCurrentlyDragPaintingRef.current = false;
  }, []);

  const handlePenDragSessionContinue = useCallback(() => {
    isCurrentlyDragPaintingRef.current = true;
  }, []);

  const handlePenDragSessionEnd = useCallback(() => {
    isCurrentlyDragPaintingRef.current = false;
  }, []);

  const handleCellAction = (anchorCoords: Point, keyDefToApply: KeyDefinition | null) => {
    setLastActionPoint(anchorCoords);
    if (!keyDefToApply) return;

    const modifier = (currentLayer: Layer, chartRows: number, chartCols: number, currentKeyPalette: KeyDefinition[]) => {
      const result = commitColorworkMutation({
        layer: currentLayer,
        ops: [{ key: keyDefToApply, anchor: anchorCoords }],
        chartRows,
        chartCols,
        palette: currentKeyPalette,
      });
      return result.ok ? result.layer : null;
    };

    if (isCurrentlyDragPaintingRef.current) { // True only for subsequent drag points
      updateCurrentState(prevAppState => modifyActiveSheetLayerWithModifier(prevAppState, modifier));
    } else { // False for single click or first point of drag
      recordAppChangeRef.current(prevAppState => modifyActiveSheetLayerWithModifier(prevAppState, modifier));
    }
  };

  const applyOrClearSelection = useCallback((applyActive: boolean) => {
    if (!selection || !activeSheet) return;
    const keyDefToApplyToSelection = applicationState.keyPalette.find(k => k.id === activeKeyId);
    if (applyActive && !keyDefToApplyToSelection) return;

    modifyActiveSheetLayer((currentLayer, chartRows, chartCols, currentKeyPalette) => {
      if (!applyActive) {
        return clearColorworkRegion(currentLayer, selection, chartRows, chartCols, currentKeyPalette);
      }
      if (!keyDefToApplyToSelection) return null;
      const result = commitColorworkMutation({
        layer: currentLayer,
        ops: opsForTiledSelection(selection, keyDefToApplyToSelection),
        chartRows,
        chartCols,
        palette: currentKeyPalette,
      });
      return result.ok ? result.layer : null;
    });
  }, [selection, activeSheet, activeKeyId, applicationState.keyPalette, modifyActiveSheetLayer]);

  const applyActiveKeyToSelection = useCallback(() => applyOrClearSelection(true), [applyOrClearSelection]);
  const clearAllInCurrentSelection = useCallback(() => applyOrClearSelection(false), [applyOrClearSelection]);

  const handleSelectionDragStart = (dragInfo: DraggedCellsInfo, initialGridPos: Point, _event: React.MouseEvent) => {
    setIsDraggingSelection(true);
    setIsActuallyDrawingSel(false);
    setSelectionAnchorPoint(null);
    setDraggedCellsInfo(dragInfo);
    setDragPreviewSnappedGridPosition(initialGridPos);
  };

  const handleSelectionDragMove = (snappedGridPos: Point, _event: React.MouseEvent) => {
    if (!isDraggingSelection || !draggedCellsInfo || !activeSheet) return;
    const clampedX = Math.max(0, Math.min(activeSheet.cols - draggedCellsInfo.width, snappedGridPos.x));
    const clampedY = Math.max(0, Math.min(activeSheet.rows - draggedCellsInfo.height, snappedGridPos.y));
    setDragPreviewSnappedGridPosition({ x: clampedX, y: clampedY });
  };

  const handleSelectionDragEnd = (dropTarget: Point | null, _event: React.MouseEvent) => {
    if (!isDraggingSelection || !draggedCellsInfo || !dropTarget || !activeSheet.activeLayerId) {
      setIsDraggingSelection(false);
      setDraggedCellsInfo(null);
      setDragPreviewSnappedGridPosition(null);
      return;
    }

    const { relativeKeyInstances, originalStartCoords } = draggedCellsInfo;
    const targetLayerId = activeSheet.activeLayerId;
    const targetSheetId = activeSheet.id;

    recordAppChangeRef.current(prevAppState => {
        const currentPalette = prevAppState.keyPalette;
        const newSheets = prevAppState.sheets.map(sheet => {
            if (sheet.id === targetSheetId) {
                const newLayers = sheet.layers.map(layer => {
                    if (layer.id === targetLayerId) {
                        const result = moveColorworkPlacements({
                          layer,
                          relativeKeyInstances,
                          sourceOrigin: originalStartCoords,
                          targetOrigin: dropTarget,
                          chartRows: sheet.rows,
                          chartCols: sheet.cols,
                          palette: currentPalette,
                        });
                        return result.ok ? result.layer : layer;
                    }
                    return layer;
                });
                return { ...sheet, layers: newLayers };
            }
            return sheet;
        });
        return { ...prevAppState, sheets: newSheets };
    });

    setSelection(null);
    setSelectionAnchorPoint(null);
    setIsActuallyDrawingSel(false);
    setIsDraggingSelection(false);
    setDraggedCellsInfo(null);
    setDragPreviewSnappedGridPosition(null);
  };

  const handleCopySelection = useCallback(() => {
    if (!selection || !activeSheet || !activeSheet.activeLayerId || isPreviewingPaste) return;
    const currentActiveLayer = activeSheet.layers.find(l => l.id === activeSheet.activeLayerId);
    if (!currentActiveLayer) return;

    const normSel = {
        start: { x: Math.min(selection.start.x, selection.end.x), y: Math.min(selection.start.y, selection.end.y) },
        end: { x: Math.max(selection.start.x, selection.end.x), y: Math.max(selection.start.y, selection.end.y) }
    };
    const selWidth = normSel.end.x - normSel.start.x + 1;
    const selHeight = normSel.end.y - normSel.start.y + 1;

    const relativeKeyInstances: KeyInstance[] = [];
    const sourceKeyDefIds = new Set<string>();

    for (let rOffset = 0; rOffset < selHeight; rOffset++) {
        for (let cOffset = 0; cOffset < selWidth; cOffset++) {
            const chartR = normSel.start.y + rOffset;
            const chartC = normSel.start.x + cOffset;
            const cell = currentActiveLayer.grid[chartR]?.[chartC];

            if (cell?.keyId && cell.keyId !== KEY_ID_KNIT_DEFAULT) {
                const keyDef = applicationState.keyPalette.find(k => k.id === cell.keyId);
                if (keyDef) {
                    if (cell?.isAnchorCellForMxN || (keyDef.width === 1 && keyDef.height === 1)) {
                        const fitsSelection = cOffset + keyDef.width <= selWidth &&
                            rOffset + keyDef.height <= selHeight;
                        if (!fitsSelection) continue;
                        const existing = relativeKeyInstances.find(
                            ki => ki.anchor.x === cOffset && ki.anchor.y === rOffset
                        );
                        if (!existing) {
                            relativeKeyInstances.push({
                                anchor: { y: rOffset, x: cOffset },
                                keyId: cell.keyId
                            });
                            sourceKeyDefIds.add(cell.keyId);
                        }
                    }
                }
            }
        }
    }
    const sourceKeyDefinitions = Array.from(sourceKeyDefIds)
        .map(id => applicationState.keyPalette.find(k => k.id === id))
        .filter(Boolean) as KeyDefinition[];

    setClipboardContent({ relativeKeyInstances, width: selWidth, height: selHeight, sourceKeyDefinitions });
  }, [selection, activeSheet, applicationState.keyPalette, isPreviewingPaste]);

  const handleCutSelection = useCallback(() => {
    if (!selection || !activeSheet || !activeSheet.activeLayerId || isPreviewingPaste) return;
    handleCopySelection();
    modifyActiveSheetLayer((currentLayer, chartRows, chartCols, currentKeyPalette) =>
      clearColorworkRegion(currentLayer, selection, chartRows, chartCols, currentKeyPalette),
    );
  }, [handleCopySelection, selection, activeSheet, isPreviewingPaste, modifyActiveSheetLayer]);

  const _performActualPaste = (
    targetOrigin: Point,
    clipboardDataToPaste: ClipboardData,
    activeSelectionForContext: SelectionRect | null
  ) => {
    if (!activeSheet || !activeSheet.activeLayerId) return;

    const targetLayerId = activeSheet.activeLayerId;
    const targetSheetId = activeSheet.id;

    recordAppChangeRef.current(prevAppState => {
        let currentPalette = [...prevAppState.keyPalette];
        const newKeysToAdd: KeyDefinition[] = [];
        for (const defFromClipboard of clipboardDataToPaste.sourceKeyDefinitions) {
            if (!currentPalette.some(k => k.id === defFromClipboard.id)) {
                const newPastedKey: KeyDefinition = {
                  ...defFromClipboard,
                  cells: defFromClipboard.cells?.map(row => row.map(cell => cell ? { ...cell } : null)),
                  colorCells: defFromClipboard.colorCells?.map(row => [...row]),
                  lines: defFromClipboard.lines?.map(line => ({
                    ...line,
                    start: { ...line.start },
                    end: { ...line.end },
                  })),
                };
                newKeysToAdd.push(newPastedKey);
            }
        }
        if (newKeysToAdd.length > 0) {
            currentPalette = [...currentPalette, ...newKeysToAdd];
        }

        const newSheets = prevAppState.sheets.map(sheet => {
            if (sheet.id === targetSheetId) {
                let layerModified = false;
                const newLayers = sheet.layers.map(layer => {
                    if (layer.id === targetLayerId) {
                        layerModified = true;
                        const isPasteIntoMxNSelection = activeSelectionForContext &&
                            (activeSelectionForContext.end.x - activeSelectionForContext.start.x > 0 ||
                             activeSelectionForContext.end.y - activeSelectionForContext.start.y > 0);
                        const ops = [];
                        for (const relInstance of clipboardDataToPaste.relativeKeyInstances) {
                            const keyDefToPlace = currentPalette.find(k => k.id === relInstance.keyId);
                            if (!keyDefToPlace || keyDefToPlace.id === KEY_ID_KNIT_DEFAULT) continue;

                            const absoluteAnchor: Point = {
                                x: targetOrigin.x + relInstance.anchor.x,
                                y: targetOrigin.y + relInstance.anchor.y,
                            };

                            let placeThisKey = true;
                            if (isPasteIntoMxNSelection && activeSelectionForContext) {
                                const keyFootprintEnd: Point = {
                                    x: absoluteAnchor.x + keyDefToPlace.width - 1,
                                    y: absoluteAnchor.y + keyDefToPlace.height - 1,
                                };
                                if (absoluteAnchor.x < activeSelectionForContext.start.x ||
                                    absoluteAnchor.y < activeSelectionForContext.start.y ||
                                    keyFootprintEnd.x > activeSelectionForContext.end.x ||
                                    keyFootprintEnd.y > activeSelectionForContext.end.y) {
                                    placeThisKey = false;
                                }
                            }

                            if (placeThisKey) {
                                ops.push({ key: keyDefToPlace, anchor: absoluteAnchor });
                            }
                        }
                        const result = pasteColorworkPlacements({
                          layer,
                          ops,
                          clearRegion: isPasteIntoMxNSelection ? activeSelectionForContext : null,
                          chartRows: sheet.rows,
                          chartCols: sheet.cols,
                          palette: currentPalette,
                        });
                        return result.ok ? result.layer : layer;
                    }
                    return layer;
                });
                if (layerModified) return { ...sheet, layers: newLayers };
            }
            return sheet;
        });
        return { ...prevAppState, keyPalette: currentPalette, sheets: newSheets };
    });
  };

  const handlePastePreviewCancel = useCallback(() => {
    setIsPreviewingPaste(false);
    setPastePreviewInfo(null);
    setPastePreviewAnchor(null);
  }, []);

  const handlePasteFromClipboard = useCallback(() => {
    if (!clipboardContent || !activeSheet) return;

    if (isPreviewingPaste) {
        if (pastePreviewAnchor && clipboardContent) {
             _performActualPaste(pastePreviewAnchor, clipboardContent, null);
             handlePastePreviewCancel();
        }
        return;
    }

    if (selection) {
        const normSel = {
            start: { x: Math.min(selection.start.x, selection.end.x), y: Math.min(selection.start.y, selection.end.y) },
            end: { x: Math.max(selection.start.x, selection.end.x), y: Math.max(selection.start.y, selection.end.y) },
        };
        _performActualPaste(normSel.start, clipboardContent, normSel);
    } else {
        let targetAnchorForPreview = hoveredCanvasCell || lastActionPoint || { x: 0, y: 0 };
        setIsPreviewingPaste(true);
        setPastePreviewInfo(clipboardContent);
        const clampedAnchor = {
            x: Math.max(0, Math.min(activeSheet.cols - clipboardContent.width, targetAnchorForPreview.x)),
            y: Math.max(0, Math.min(activeSheet.rows - clipboardContent.height, targetAnchorForPreview.y)),
        };
        setPastePreviewAnchor(clampedAnchor);
    }
  }, [clipboardContent, selection, hoveredCanvasCell, lastActionPoint, activeSheet, _performActualPaste, isPreviewingPaste, pastePreviewAnchor, handlePastePreviewCancel]);

  const handlePastePreviewFinalize = useCallback(() => {
    if (isPreviewingPaste && pastePreviewAnchor && pastePreviewInfo) {
        handlePasteFromClipboard();
    } else {
        handlePastePreviewCancel();
    }
  }, [isPreviewingPaste, pastePreviewAnchor, pastePreviewInfo, handlePasteFromClipboard, handlePastePreviewCancel]);

  const handlePastePreviewMove = useCallback((newProposedAnchor: Point) => {
    if (!isPreviewingPaste || !pastePreviewInfo || !activeSheet) return;
    const clampedAnchor = {
        x: Math.max(0, Math.min(activeSheet.cols - pastePreviewInfo.width, newProposedAnchor.x)),
        y: Math.max(0, Math.min(activeSheet.rows - pastePreviewInfo.height, newProposedAnchor.y)),
    };
    setPastePreviewAnchor(clampedAnchor);
  }, [isPreviewingPaste, pastePreviewInfo, activeSheet]);

 const handleInsertRow = useCallback((rowIndex: number) => {
    recordAppChangeRef.current(prevAppState => {
      const activeSheetIndex = prevAppState.sheets.findIndex(s => s.id === prevAppState.activeSheetId);
      if (activeSheetIndex === -1) return prevAppState;
      const oldActiveSheet = prevAppState.sheets[activeSheetIndex];

      const newNumRows = oldActiveSheet.rows + 1;

      const newLayers = oldActiveSheet.layers.map(layer =>
        insertColorworkRow(
          layer,
          rowIndex,
          oldActiveSheet.rows,
          oldActiveSheet.cols,
          prevAppState.keyPalette,
        ),
      );

      const newSheet = { ...oldActiveSheet, rows: newNumRows, layers: newLayers };
      const newSheets = [...prevAppState.sheets];
      newSheets[activeSheetIndex] = newSheet;

      return { ...prevAppState, sheets: newSheets };
    });
  }, []);

  const handleDeleteRow = useCallback((rowIndex: number) => {
    recordAppChangeRef.current(prevAppState => {
      const activeSheetIndex = prevAppState.sheets.findIndex(s => s.id === prevAppState.activeSheetId);
      if (activeSheetIndex === -1) return prevAppState;
      const oldActiveSheet = prevAppState.sheets[activeSheetIndex];
      if (oldActiveSheet.rows <= 1) return prevAppState;
      const newNumRows = oldActiveSheet.rows - 1;

      const newLayers = oldActiveSheet.layers.map(layer =>
        deleteColorworkRow(
          layer,
          rowIndex,
          oldActiveSheet.rows,
          oldActiveSheet.cols,
          prevAppState.keyPalette,
        ),
      );

      const newSheet = { ...oldActiveSheet, rows: newNumRows, layers: newLayers };
      const newSheets = [...prevAppState.sheets];
      newSheets[activeSheetIndex] = newSheet;

      if (selection) {
        let newSel = { ...selection };
        if (newSel.start.y >= rowIndex) newSel.start.y = Math.max(0, newSel.start.y - 1);
        if (newSel.end.y >= rowIndex) newSel.end.y = Math.max(0, newSel.end.y - 1);
        if (newSel.start.y > newSel.end.y || newSel.start.y >= newNumRows) {
            setSelection(null);
            setSelectionAnchorPoint(null);
            setIsActuallyDrawingSel(false);
        } else setSelection(newSel);
      }
      if (lastActionPoint.y >=rowIndex) setLastActionPoint(prev => ({...prev, y: Math.max(0, prev.y -1)}));

      return { ...prevAppState, sheets: newSheets };
    });
  }, [selection, lastActionPoint]);

  const handleInsertCol = useCallback((colIndex: number) => {
    recordAppChangeRef.current(prevAppState => {
      const activeSheetIndex = prevAppState.sheets.findIndex(s => s.id === prevAppState.activeSheetId);
      if (activeSheetIndex === -1) return prevAppState;
      const oldActiveSheet = prevAppState.sheets[activeSheetIndex];

      const newNumCols = oldActiveSheet.cols + 1;

      const newLayers = oldActiveSheet.layers.map(layer =>
        insertColorworkColumn(
          layer,
          colIndex,
          oldActiveSheet.rows,
          oldActiveSheet.cols,
          prevAppState.keyPalette,
        ),
      );

      const newSheet = { ...oldActiveSheet, cols: newNumCols, layers: newLayers };
      const newSheets = [...prevAppState.sheets];
      newSheets[activeSheetIndex] = newSheet;

      return { ...prevAppState, sheets: newSheets };
    });
  }, []);

  const handleDeleteCol = useCallback((colIndex: number) => {
    recordAppChangeRef.current(prevAppState => {
      const activeSheetIndex = prevAppState.sheets.findIndex(s => s.id === prevAppState.activeSheetId);
      if (activeSheetIndex === -1) return prevAppState;
      const oldActiveSheet = prevAppState.sheets[activeSheetIndex];
      if (oldActiveSheet.cols <= 1) return prevAppState;
      const newNumCols = oldActiveSheet.cols - 1;

      const newLayers = oldActiveSheet.layers.map(layer =>
        deleteColorworkColumn(
          layer,
          colIndex,
          oldActiveSheet.rows,
          oldActiveSheet.cols,
          prevAppState.keyPalette,
        ),
      );

      const newSheet = { ...oldActiveSheet, cols: newNumCols, layers: newLayers };
      const newSheets = [...prevAppState.sheets];
      newSheets[activeSheetIndex] = newSheet;

      if (selection) {
        let newSel = { ...selection };
        if (newSel.start.x >= colIndex) newSel.start.x = Math.max(0, newSel.start.x - 1);
        if (newSel.end.x >= colIndex) newSel.end.x = Math.max(0, newSel.end.x - 1);
        if (newSel.start.x > newSel.end.x || newSel.start.x >= newNumCols) {
            setSelection(null);
            setSelectionAnchorPoint(null);
            setIsActuallyDrawingSel(false);
        } else setSelection(newSel);
      }
       if (lastActionPoint.x >= colIndex) setLastActionPoint(prev => ({...prev, x: Math.max(0, prev.x -1)}));

      return { ...prevAppState, sheets: newSheets };
    });
  }, [selection, lastActionPoint]);

  const handleSelectionChangeFromCanvas = useCallback((
    rawSelectionRectFromCanvas: SelectionRect | null,
    isStillDrawing: boolean,
    currentActionPointForLastAction?: Point
  ) => {
    if (isStillDrawing && rawSelectionRectFromCanvas) {
      if (!selectionAnchorPoint) {
        setSelectionAnchorPoint(rawSelectionRectFromCanvas.start);
      }
      const liveRawSel = {
        start: selectionAnchorPoint || rawSelectionRectFromCanvas.start,
        end: rawSelectionRectFromCanvas.end
      };
      const currentActiveLayer = activeSheet?.layers.find(l => l.id === activeSheet.activeLayerId);
      const expandedLiveSel = getExpandedSelection(liveRawSel, currentActiveLayer, applicationState.keyPalette, activeSheet?.rows || 0, activeSheet?.cols || 0);
      setSelection(expandedLiveSel);
      setIsActuallyDrawingSel(true);
    } else {
      setIsActuallyDrawingSel(false);
      setSelectionAnchorPoint(null);
      if (rawSelectionRectFromCanvas) {
        const currentActiveLayer = activeSheet?.layers.find(l => l.id === activeSheet.activeLayerId);
        const finalExpandedSel = getExpandedSelection(rawSelectionRectFromCanvas, currentActiveLayer, applicationState.keyPalette, activeSheet?.rows || 0, activeSheet?.cols || 0);
        setSelection(finalExpandedSel);
      } else {
        setSelection(null);
      }
    }
    if (currentActionPointForLastAction) {
      setLastActionPoint(currentActionPointForLastAction);
    }
  }, [activeSheet, applicationState.keyPalette, selectionAnchorPoint]);

  const handleSelectAllActiveLayer = () => { setSelectAllActiveLayerFlag(`${Date.now()}`); };

  const handleMiniMapPan = (targetCenterGridCoords: Point) => {
    if (!activeSheet || !mainCanvasWrapperRef.current) return;
    const visibleGridWidth = canvasContainerSize.width / (CELL_SIZE * currentZoom);
    const visibleGridHeight = canvasContainerSize.height / (CELL_SIZE * currentZoom);

    const targetOffsetX = (targetCenterGridCoords.x - visibleGridWidth / 2) * CELL_SIZE * currentZoom;
    const targetOffsetY = (targetCenterGridCoords.y - visibleGridHeight / 2) * CELL_SIZE * currentZoom;

    const mainCanvasGutterLeft = (activeSheet.displaySettings.rowCountVisibility === 'left' || activeSheet.displaySettings.rowCountVisibility === 'both' || activeSheet.displaySettings.rowCountVisibility === 'alternating-left') ? GUTTER_SIZE : 0;
    const mainCanvasGutterTop = (activeSheet.displaySettings.colCountVisibility === 'top' || activeSheet.displaySettings.colCountVisibility === 'both') ? GUTTER_SIZE : 0;

    setViewOffset({ x: -targetOffsetX - mainCanvasGutterLeft, y: -targetOffsetY - mainCanvasGutterTop });
  };

  const processLoadApplicationStateDirectly = (data: string) => {
    try {
        // Use the new serialization service (handles both legacy JSON and new compressed format)
        const loadedState = deserialize(data);

        if (loadedState.sheets && loadedState.keyPalette) {
            const validatedPalette = loadedState.keyPalette.map((k: any) => ({
                id: k.id || generateNewKeyId(),
                name: k.name || "Untitled Key",
                abbreviation: k.abbreviation === undefined ? null : k.abbreviation,
                width: typeof k.width === 'number' && k.width > 0 ? k.width : 1,
                height: typeof k.height === 'number' && k.height > 0 ? k.height : 1,
                backgroundColor: k.backgroundColor || (isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT),
                symbolColor: k.symbolColor || (isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT),
                cells: (k.cells && Array.isArray(k.cells)) ? k.cells.map((row: any) => Array.isArray(row) ? row.map((cell: any) => cell) : [null]) : [[null]],
                colorCells: (k.colorCells && Array.isArray(k.colorCells))
                  ? k.colorCells.map((row: unknown) => Array.isArray(row) ? row.map((color) => color) : [])
                  : undefined,
                lines: (k.lines && Array.isArray(k.lines)) ? k.lines : undefined,
            }));

            const validatedState = sanitizeColorworkState({
                ...loadedState,
                keyPalette: validatedPalette,
                sheets: loadedState.sheets.map((s: ChartState) => ({
                    ...s,
                    id: s.id || generateNewSheetId(),
                    layers: s.layers.map((l:Layer) => ({
                        ...l,
                        id: l.id || `layer_${Date.now()}`,
                        keyPlacements: l.keyPlacements || [],
                        grid: buildGridFromKeyPlacements(l.keyPlacements || [], s.rows, s.cols, validatedPalette)
                    }))
                }))
            });

            resetAppHistory(validatedState);
            setSelection(null);
            setIsActuallyDrawingSel(false);
            setIsDraggingSelection(false);
            setDraggedCellsInfo(null);
            setViewOffset({x:0, y:0});
            const firstKeyInNewPalette = validatedState.keyPalette[0]?.id;
            setActiveKeyId(firstKeyInNewPalette || null);

        } else {
            alert("Invalid application state format.");
        }
    } catch (error) {
        console.error("Failed to load application state:", error);
        alert(`Error loading state: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleNewChart = () => {
    if (canUndo && !window.confirm('Start a new chart? Your current browser session will be replaced.')) return;
    clearAutosave();
    resetAppHistory(structuredClone(INITIAL_APPLICATION_STATE));
    setActiveKeyId(INITIAL_APPLICATION_STATE.keyPalette[0]?.id ?? null);
    setSelection(null);
    setViewOffset({ x: 0, y: 0 });
  };

  const handleSaveProject = () => {
    const blob = new Blob([serialize(applicationState)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = activeSheet.name.replace(/[^a-z0-9_-]/gi, '_') || 'chart';
    link.href = url;
    link.download = `${filename}.knitlab`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateChartFromProcessedImage = (data: ProcessedImageData) => {
    let firstKeyIdForNewPalette: string | null = null;

    recordAppChange(prevAppState => {
        let constructedKeyPalette = [...prevAppState.keyPalette];
        const newKeysCreatedInThisOperation: KeyDefinition[] = [];

        data.palette.forEach(hexColor => {
            let existingKey = constructedKeyPalette.find(k => k.backgroundColor === hexColor && k.width === 1 && k.height === 1 && (!k.cells || !k.cells[0][0]) && (!k.lines || k.lines.length === 0));
            if (!existingKey) {
                const newKeyId = generateNewKeyId();
                const newColorKey: KeyDefinition = {
                    id: newKeyId, name: `Color ${hexColor}`, width: 1, height: 1,
                    abbreviation: null, // Default new keys to null abbreviation
                    backgroundColor: hexColor,
                    symbolColor: isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT,
                    cells: [[null]],
                };
                newKeysCreatedInThisOperation.push(newColorKey);
            }
        });

        if (newKeysCreatedInThisOperation.length > 0) {
            constructedKeyPalette = [...constructedKeyPalette, ...newKeysCreatedInThisOperation];
        }

        const colorToKeyIdMap = new Map<string, string>();
        constructedKeyPalette.forEach(k => {
            if (data.palette.includes(k.backgroundColor) && k.width === 1 && k.height === 1 && (!k.cells || !k.cells[0][0]) && (!k.lines || k.lines.length === 0)) {
                 if (!colorToKeyIdMap.has(k.backgroundColor)) {
                    colorToKeyIdMap.set(k.backgroundColor, k.id);
                 }
            }
        });
        data.palette.forEach(hexColor => {
            if (!colorToKeyIdMap.has(hexColor)) {
                 const foundNewKey = newKeysCreatedInThisOperation.find(nk => nk.backgroundColor === hexColor);
                 if (foundNewKey) colorToKeyIdMap.set(hexColor, foundNewKey.id);
            }
        });

        const existingSheetNames = prevAppState.sheets.map(s => s.name);
        let newSheetName = "Image Chart 1";
        let nameCounter = 1;
        while (existingSheetNames.includes(newSheetName)) {
            nameCounter++; newSheetName = `Image Chart ${nameCounter}`;
        }

        const newSheetId = generateNewSheetId();
        const newKeyPlacements: KeyInstance[] = [];

        for (let r = 0; r < data.gridData.rows; r++) {
            for (let c = 0; c < data.gridData.cols; c++) {
                const colorIndex = r * data.gridData.cols + c;
                const cellColorHex = data.gridData.colors[colorIndex];
                const keyIdForCell = colorToKeyIdMap.get(cellColorHex);
                if (keyIdForCell && keyIdForCell !== KEY_ID_KNIT_DEFAULT) {
                    newKeyPlacements.push({ anchor: { y: r, x: c }, keyId: keyIdForCell });
                }
            }
        }

        const newGrid = buildGridFromKeyPlacements(newKeyPlacements, data.gridData.rows, data.gridData.cols, constructedKeyPalette);
        const newBaseLayer: Layer = {
            id: 'base_image_layer', name: 'Image Layer 1', isVisible: true,
            grid: newGrid, keyPlacements: newKeyPlacements,
        };
        const newImageSheet: ChartState = { // Corrected variable name
            id: newSheetId, name: newSheetName,
            rows: data.gridData.rows, cols: data.gridData.cols,
            orientation: 'bottom-up', displaySettings: { ...INITIAL_CHART_STATE.displaySettings },
            layers: [newBaseLayer], activeLayerId: newBaseLayer.id,
        };

        firstKeyIdForNewPalette = constructedKeyPalette[0]?.id || null;

        return {
            ...prevAppState,
            keyPalette: constructedKeyPalette,
            sheets: [...prevAppState.sheets, newImageSheet], // Use corrected variable
            activeSheetId: newSheetId
        };
    });

    setActiveKeyId(firstKeyIdForNewPalette);
    setSelection(null);
    setSelectionAnchorPoint(null);
    setIsActuallyDrawingSel(false);
    setViewOffset({x:0,y:0});
    setActiveSidebarTab('sheets');
    setIsSidebarContentVisible(true);
    setIsImageProcessorModalOpen(false);
  };

  const [dynamicBottomStyle, setDynamicBottomStyle] = useState({ miniMap: MINIMAP_DEFAULT_BOTTOM, footer: FOOTER_DEFAULT_BOTTOM });
  const floatingToolbarRef = useRef<HTMLDivElement>(null);
  const [sidebarActualWidth, setSidebarActualWidth] = useState(ICON_RIBBON_WIDTH_CONST);

  useEffect(() => {
    const calculateBottoms = () => {
        const paletteHeight = floatingToolbarRef.current?.offsetHeight || 0;
        const gap = 8;
        const screenWidth = window.innerWidth;

        if (screenWidth < RESPONSIVE_BREAKPOINT && paletteHeight > 0) {
            const liftedBottomValue = `${paletteHeight + gap + 4}px`; // 4px is toolbar's own bottom
            setDynamicBottomStyle({ miniMap: liftedBottomValue, footer: liftedBottomValue });
        } else {
            setDynamicBottomStyle({ miniMap: MINIMAP_DEFAULT_BOTTOM, footer: FOOTER_DEFAULT_BOTTOM });
        }
    };
    calculateBottoms();
    window.addEventListener('resize', calculateBottoms);

    const toolbarElement = floatingToolbarRef.current;
    let observer: ResizeObserver | undefined;
    if (toolbarElement) {
        observer = new ResizeObserver(calculateBottoms);
        observer.observe(toolbarElement);
    }

    return () => {
        window.removeEventListener('resize', calculateBottoms);
        if (observer && toolbarElement) {
            observer.unobserve(toolbarElement);
        }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        // Don't interfere if user is typing in an input/modal
        if (event.key === "Escape" && (isBlockEditorOpen || isColorEditorOpen || isImageProcessorModalOpen || isChartSettingsModalOpen || isExportPreviewModalOpen)) {
            // Allow Escape to close modals even if an input inside has focus
        } else {
            return;
        }
      }

      // Tool shortcuts
      if (event.key.toLowerCase() === 'a' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActiveTool(Tool.Pen);
      } else if (event.key.toLowerCase() === 's' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setActiveTool(Tool.Select);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (isPreviewingPaste) {
          handlePastePreviewCancel();
        } else if (isActuallyDrawingSel) {
          setIsActuallyDrawingSel(false); // Cancel drawing selection
          setSelectionAnchorPoint(null);
          // Keep current selection if partially drawn, or clear if it was just a click
          if (selection && selection.start.x === selection.end.x && selection.start.y === selection.end.y) {
            setSelection(null);
          }
        } else if (isDraggingSelection) {
          setIsDraggingSelection(false); // Cancel dragging selection
          setDraggedCellsInfo(null);
          setDragPreviewSnappedGridPosition(null);
          // Potentially restore original selection or clear it
          setSelection(null); // For simplicity, clear selection after cancelled drag
        } else if (selection) {
          setSelection(null); // Clear existing selection
        } else {
          setActiveTool(Tool.Move); // Fallback to Pan tool
        }
      }

      // Key palette shortcuts (1-5)
      const keyNum = parseInt(event.key);
      if (!event.ctrlKey && !event.metaKey && keyNum >= 1 && keyNum <= 5) {
          event.preventDefault();
          const keyIndex = keyNum - 1;
          if (colorworkPalette[keyIndex]) {
              setActiveKeyId(colorworkPalette[keyIndex].id);
          }
      }

      // Selection content modification
      if ((event.key === 'Delete' || event.key === 'Backspace') && selection && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        clearAllInCurrentSelection();
      }

      // Global actions (Undo/Redo/Copy/Cut/Paste)
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      if (isCtrlOrCmd && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      } else if (isCtrlOrCmd && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      } else if (isCtrlOrCmd && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        if (selection) handleCopySelection();
      } else if (isCtrlOrCmd && event.key.toLowerCase() === 'x') {
        event.preventDefault();
        if (selection) handleCutSelection();
      } else if (isCtrlOrCmd && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        if (clipboardContent) handlePasteFromClipboard();
      }

    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isPreviewingPaste, isActuallyDrawingSel, isDraggingSelection, selection,
    activeTool, clipboardContent, colorworkPalette,
    undo, redo, handleCopySelection, handleCutSelection, handlePasteFromClipboard,
    clearAllInCurrentSelection, setActiveTool, setActiveKeyId, handlePastePreviewCancel, // Added setActiveKeyId
    isBlockEditorOpen, isColorEditorOpen, isImageProcessorModalOpen,
    isChartSettingsModalOpen, isExportPreviewModalOpen
  ]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-100 transition-colors duration-300 dark:bg-neutral-800">
      <Header
        onUndo={undo}
        canUndo={canUndo}
        onRedo={redo}
        canRedo={canRedo}
        onNew={handleNewChart}
        onOpenProject={processLoadApplicationStateDirectly}
        onSaveProject={handleSaveProject}
        onOpenExport={() => setIsExportPreviewModalOpen(true)}
        onImportImage={() => setIsImageProcessorModalOpen(true)}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onOpenSettings={() => setIsChartSettingsModalOpen(true)}
        currentZoom={currentZoom}
        onZoomChange={setCurrentZoom}
        chartRows={activeSheet.rows}
        chartCols={activeSheet.cols}
      />

      <TopRibbon
        keyPalette={colorworkPalette}
        activeKeyId={activeKeyId}
        onKeySelect={setActiveKeyId}
        onAddColor={handleAddColor}
        onAddBlock={() => handleOpenBlockEditor()}
        onEditKey={handleOpenKeyEditor}
        onDeleteKey={handleDeleteKeyFromPalette}
        onDuplicateKey={handleDuplicateKey}
        allStitchSymbols={allSymbols}
        isDarkMode={isDarkMode}
        showKeyUsageTally={showKeyUsageTallyGlobal}
        onToggleShowKeyTally={toggleShowKeyUsageTallyGlobal} // Not used by UI but part of props
        keyUsageData={colorworkUsageData}
      />

      <div className="flex min-h-0 flex-grow overflow-hidden">
        <TabbedSidebar
          layers={activeSheet.layers}
          activeLayerId={activeSheet.activeLayerId}
          onLayerSelect={handleSelectLayer}
          onAddLayer={handleAddLayer}
          onRemoveLayer={handleRemoveLayer}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onSelectAllActiveLayer={handleSelectAllActiveLayer}

          allSheets={applicationState.sheets}
          activeSheetId={applicationState.activeSheetId}
          onSheetSelect={handleSelectSheet}
          onAddSheet={handleAddSheet}
          onRemoveSheet={handleRemoveSheet}
          onRenameSheet={handleRenameSheetById}

          activeTab={activeSidebarTab}
          onTabSelect={handleActiveSidebarTabChange}
          isSidebarContentVisible={isSidebarContentVisible}
          onToggleSidebarContentVisibility={toggleSidebarContentVisibility}
          onOpenImageProcessor={() => setIsImageProcessorModalOpen(true)}
          onActualWidthChange={setSidebarActualWidth}
        />
        <main ref={mainCanvasWrapperRef} className="relative flex min-h-0 flex-grow items-center justify-center overflow-hidden">
          {canvasContainerSize.width > 0 && canvasContainerSize.height > 0 && activeSheet && (
            <KnitCanvas
              chartState={activeSheet}
              keyPalette={applicationState.keyPalette}
              activeTool={activeTool}
              allSymbols={allSymbols}
              isDarkMode={isDarkMode}
              zoomLevel={currentZoom}
              setZoomLevel={setCurrentZoom}
              effectiveZoomLevels={getEffectiveZoomLevels()}
              viewOffset={viewOffset}
              onViewOffsetChange={setViewOffset}
              canvasSize={canvasContainerSize}

              selection={selection}
              isActuallyDrawingSel={isActuallyDrawingSel}
              selectionDragAnchorForCanvas={selectionAnchorPoint}
              isActuallyDraggingSel={isDraggingSelection}
              draggedCellsPreviewInfo={draggedCellsInfo}
              dragPreviewSnappedGridPosition={dragPreviewSnappedGridPosition}

              onSelectionChange={handleSelectionChangeFromCanvas}
              onCellAction={handleCellAction}
              onSelectionDragStart={handleSelectionDragStart}
              onSelectionDragMove={handleSelectionDragMove}
              onSelectionDragEnd={handleSelectionDragEnd}

              onRequestApplyActiveKeyToSelection={applyActiveKeyToSelection}
              onRequestClearAllInSelection={clearAllInCurrentSelection}

              onInsertRow={handleInsertRow}
              onDeleteRow={handleDeleteRow}
              onInsertColumn={handleInsertCol}
              onDeleteColumn={handleDeleteCol}

              selectAllActiveLayerFlag={selectAllActiveLayerFlag}
              onSelectAllProcessed={() => setSelectAllActiveLayerFlag(null)}

              onCopySelection={handleCopySelection}
              onCutSelection={handleCutSelection}
              onPasteFromClipboard={handlePasteFromClipboard}
              canPaste={!!clipboardContent}

              isPreviewingPaste={isPreviewingPaste}
              pastePreviewInfo={pastePreviewInfo}
              pastePreviewAnchor={pastePreviewAnchor}
              hoveredCanvasCell={hoveredCanvasCell}
              onHoveredCellChange={setHoveredCanvasCell}
              onPastePreviewMove={handlePastePreviewMove}
              onPastePreviewFinalize={handlePastePreviewFinalize}
              onPastePreviewCancel={handlePastePreviewCancel}
              activeKeyId={activeKeyId}

              onPenDragSessionStart={handlePenDragSessionStart}
              onPenDragSessionContinue={handlePenDragSessionContinue}
              onPenDragSessionEnd={handlePenDragSessionEnd}
            />
          )}
            <div
              className="fixed z-10 hidden opacity-80 transition-opacity hover:opacity-100 md:block"
              style={{
                bottom: dynamicBottomStyle.miniMap,
                left: `${sidebarActualWidth + MINIMAP_SIDE_MARGIN}px`,
                width: `${MINIMAP_MAX_WIDTH}px`,
                height: `${MINIMAP_MAX_HEIGHT}px`
              }}
            >
             {activeSheet && canvasContainerSize.width > 0 && canvasContainerSize.height > 0 && (
                 <MiniMap
                     chartState={activeSheet}
                     keyPalette={applicationState.keyPalette}
                     viewport={{
                         x: (-viewOffset.x - (activeSheet.displaySettings.rowCountVisibility === 'left' || activeSheet.displaySettings.rowCountVisibility === 'both' || activeSheet.displaySettings.rowCountVisibility === 'alternating-left' || activeSheet.displaySettings.rowCountVisibility === 'alternating-right' ? GUTTER_SIZE : 0)) / (CELL_SIZE * currentZoom),
                         y: (-viewOffset.y - (activeSheet.displaySettings.colCountVisibility === 'top' || activeSheet.displaySettings.colCountVisibility === 'both' ? GUTTER_SIZE : 0)) / (CELL_SIZE * currentZoom),
                         width: canvasContainerSize.width / (CELL_SIZE * currentZoom),
                         height: canvasContainerSize.height / (CELL_SIZE * currentZoom)
                     }}
                     canvasZoom={currentZoom}
                     onPan={handleMiniMapPan}
                     canvasSize={canvasContainerSize}
                     isDarkMode={isDarkMode}
                     maxContainerSize={{width: MINIMAP_MAX_WIDTH, height: MINIMAP_MAX_HEIGHT}}
                 />
             )}
            </div>
        </main>
      </div>

      <FloatingToolPalette
        ref={floatingToolbarRef}
        activeTool={activeTool}
        onToolSelect={setActiveTool}
        isSelectionActive={!!selection}
        onRequestApplyActiveKeyToSelection={applyActiveKeyToSelection}
        onRequestClearSelectionArea={clearAllInCurrentSelection}
        onRequestClearAllInSelection={clearAllInCurrentSelection}
        onCopySelection={handleCopySelection}
        onCutSelection={handleCutSelection}
        onPasteFromClipboard={handlePasteFromClipboard}
        canCopy={!!selection}
        canCut={!!selection}
        canPaste={!!clipboardContent}
      />

      <footer
        className="fixed right-2 z-10 hidden p-2 text-right text-xs text-neutral-500 transition-all duration-150 ease-in-out dark:text-neutral-400 md:block font-areumFooter"
        style={{ bottom: dynamicBottomStyle.footer }}
        aria-label="Application Footer"
      >
        © 2026 Areum Knits. All rights reserved.<br/>
        Crafted with ❤️ and code.
      </footer>
      {isBlockEditorOpen && (
        <BlockEditorModal
          isOpen={isBlockEditorOpen}
          onClose={() => setIsBlockEditorOpen(false)}
          onSave={addOrUpdateKeyInPalette}
          existingBlock={editingBlock}
          paletteColors={Array.from(new Set(applicationState.keyPalette.flatMap((key) => {
            const direct = /^#[0-9a-fA-F]{6}$/.test(key.backgroundColor) ? [key.backgroundColor] : [];
            const tiled = key.colorCells?.flat().filter((color): color is string => typeof color === 'string') ?? [];
            return [...direct, ...tiled];
          })))}
          isDarkMode={isDarkMode}
        />
      )}
      {isColorEditorOpen && (
        <ColorEditorModal
          isOpen={isColorEditorOpen}
          onClose={() => setIsColorEditorOpen(false)}
          color={editingColor}
          onSave={addOrUpdateKeyInPalette}
        />
      )}
      {isImageProcessorModalOpen && (
        <ImageProcessorModal
            isOpen={isImageProcessorModalOpen}
            onClose={() => setIsImageProcessorModalOpen(false)}
            onCreateChart={handleCreateChartFromProcessedImage}
            isDarkMode={isDarkMode}
        />
      )}
      {isChartSettingsModalOpen && activeSheet && (
        <ChartSettingsModal
            isOpen={isChartSettingsModalOpen}
            onClose={() => setIsChartSettingsModalOpen(false)}
            currentSettings={activeSheet}
            onSave={handleChartSettingsSave}
        />
      )}
      {isExportPreviewModalOpen && activeSheet && (
        <ExportPreviewModal
          isOpen={isExportPreviewModalOpen}
          onClose={() => setIsExportPreviewModalOpen(false)}
          chartState={activeSheet}
          keyPalette={applicationState.keyPalette}
          allSymbols={allSymbols}
          isDarkMode={isDarkMode}
          initialZoom={currentZoom}
          generateChartJpeg={generateChartJpeg}
          effectiveZoomLevels={getEffectiveZoomLevels()}
        />
      )}
    </div>
  );
};
