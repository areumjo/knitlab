
import { StitchSymbolDef, ChartCell, ChartState, ChartGrid, Layer, ChartDisplaySettings, ApplicationState, KeyDefinition, KeyInstance, Point, KeyCellContent } from './types';

export const DEFAULT_CELL_COLOR_LIGHT = '#FAF9F6'; 
export const DEFAULT_CELL_COLOR_DARK = '#374151'; 

export const DEFAULT_STITCH_COLOR_LIGHT = '#1F2937'; 
export const DEFAULT_STITCH_COLOR_DARK = '#E5E7EB';  

// Sentinel for background matching grid lines (original "transparent")
export const TRANSPARENT_BACKGROUND_SENTINEL = 'transparent_grid_bg';
// New sentinel for background matching theme's default cell color
export const THEME_DEFAULT_BACKGROUND_SENTINEL = 'theme_default_background';
// New sentinel for symbol color matching theme's default stitch color
export const THEME_DEFAULT_SYMBOL_COLOR_SENTINEL = 'theme_default_symbol_color';


export const DEFAULT_STITCH_SYMBOLS: StitchSymbolDef[] = [
  { id: 'empty', name: 'Empty', abbreviation: '', svgContent: '<rect width="100%" height="100%" fill="transparent"/>', description: 'Empty stitch, no action.' },
  { id: 'knit', name: 'Knit Stitch', abbreviation: 'K', svgContent: '<line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="2.5"/>', description: 'Face knit stitch (vertical line).' },
  { id: 'purl', name: 'Purl Stitch', abbreviation: 'P', svgContent: '<line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2.5"/>', description: 'Face purl stitch (horizontal line).' },
  { id: 'tuck', name: 'Tuck Stitch', abbreviation: 'N', svgContent: '<path d="M7 18 V9 C7 6 9 6 12 6 S17 6 17 9 V18" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Tuck stitch (n shape).' },
  { id: 'miss', name: 'Miss/Skip Stitch', abbreviation: 'O', svgContent: '<circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Miss/skip stitch (o shape).' },
  { id: 'full_needle', name: 'Full Needle Rib', abbreviation: '+', svgContent: '<path d="M12 4 V20 M4 12 H20" stroke="currentColor" stroke-width="2.5"/>', description: 'Full needle rib (+ shape).' },
  { id: 'filling_in', name: 'Filling In Stitch', abbreviation: 'V︎●●', svgContent: '<path d="M8 15 L12 19 L16 15" stroke="currentColor" stroke-width="2.5" fill="none"/> <circle cx="10" cy="12" r="1.5" fill="currentColor"/> <circle cx="14" cy="12" r="1.5" fill="currentColor"/>', description: 'Filling in stitch (V with 2 dots on top).' },
  { id: 'tubular_vertical', name: 'Tubular Vertical', abbreviation: 'TuV', svgContent: '<circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="2.5" fill="none"/> <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2.5"/>', description: 'Tubular stitch (O with vertical line).' },
  { id: 'tubular_horizontal', name: 'Tubular Horizontal', abbreviation: 'TuH', svgContent: '<circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="2.5" fill="none"/> <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2.5"/>', description: 'Tubular stitch (O with horizontal line).' },
  { id: 'slip', name: 'Slip Stitch', abbreviation: 'V', svgContent: '<path d="M8 10 L12 14 L16 10" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Slip stitch (V shape).' },
  { id: 'float', name: 'Float Stitch', abbreviation: 'V-', svgContent: '<path d="M8 10 L12 14 L16 10 M7 12 H17" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Float stitch (V with horizontal line).' },
  { id: 'rack_left', name: 'Face Left Racking', abbreviation: 'RL\\', svgContent: '<line x1="17" y1="5" x2="7" y2="19" stroke="currentColor" stroke-width="2.5"/>', description: 'Face left racking (\\ shape).' },
  { id: 'rack_right', name: 'Face Right Racking', abbreviation: 'RR/', svgContent: '<line x1="7" y1="5" x2="17" y2="19" stroke="currentColor" stroke-width="2.5"/>', description: 'Face right racking (/ shape).' },
  { id: 'cross_right_over', name: 'Right Over Cross', abbreviation: 'XRO', svgContent: '<path d="M7 19 L17 5 M7 5 L10 8 M14 16 L17 19" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Right over cross (\\ with broken / over it).' },
  { id: 'cross_left_over', name: 'Left Over Cross', abbreviation: 'XLO', svgContent: '<path d="M7 5 L17 19 M7 16 L10 19 M14 8 L17 5" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Left over cross (/ with broken \\ over it).' },
  { id: 'widen_face_right', name: 'Face Right Widening', abbreviation: 'WFR', svgContent: '<path d="M12 4 V20 M12 10 L18 10" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Face right widening (vertical line with branch right).' },
  { id: 'widen_face_left', name: 'Face Left Widening', abbreviation: 'WFL', svgContent: '<path d="M12 4 V20 M12 10 L6 10" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Face left widening (vertical line with branch left).' },
  { id: 'narrow_face_right', name: 'Face Right Narrowing', abbreviation: 'NFR', svgContent: '<path d="M12 4 L12 14 L18 20" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Face right narrowing (vertical line with branch downwards right).' },
  { id: 'narrow_face_left', name: 'Face Left Narrowing', abbreviation: 'NFL', svgContent: '<path d="M12 4 L12 14 L6 20" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Face left narrowing (vertical line with branch downwards left).' },
  { id: 'narrow_back_right', name: 'Back Right Narrowing', abbreviation: 'NBR', svgContent: '<path d="M17 5 L7 19 M7 12 H13" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Back right narrowing (\\ with horizontal branch left).' },
  { id: 'narrow_back_left', name: 'Back Left Narrowing', abbreviation: 'NBL', svgContent: '<path d="M7 5 L17 19 M11 12 H17" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Back left narrowing (/ with horizontal branch right).' },
  { id: 'face_3_in_1', name: 'Face Three Stitches in One', abbreviation: 'F3in1', svgContent: '<path d="M12 5 V13 M7 19 L12 13 L17 19" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Face three stitches in one (3 lines converging up from bottom, central line continues up).' },
  { id: 'back_3_in_1', name: 'Back Three Stitches in One', abbreviation: 'B3in1', svgContent: '<path d="M6 7 L12 13 M12 7 L12 13 M18 7 L12 13" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Back three stitches in one (3 lines converging down from top).' },
  { id: 'transfer_to_right', name: 'Transfer Stitch to Right', abbreviation: 'TR->', svgContent: '<path d="M8 18 L16 6 M10 12 H18" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Transfer stitch to right needle (/ with perpendicular line right).' },
  { id: 'transfer_to_left', name: 'Transfer Stitch to Left', abbreviation: 'TR<-', svgContent: '<path d="M16 18 L8 6 M6 12 H14" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Transfer stitch to left needle (\\ with perpendicular line left).' },
  { id: 'widen_back_right', name: 'Back Right Widening', abbreviation: 'WBR', svgContent: '<path d="M6 12 H18 M12 12 L18 6" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Back right widening (horizontal with / branch up-right).' },
  { id: 'widen_back_left', name: 'Back Left Widening', abbreviation: 'WBL', svgContent: '<path d="M6 12 H18 M12 12 L6 6" stroke="currentColor" stroke-width="2.5" fill="none"/>', description: 'Back left widening (horizontal with \\ branch up-left).' },
];

export const UNICODE_SYMBOLS_FOR_KEY_EDITOR: { value: string, name: string }[] = [
  { value: '•', name: 'Bullet' }, { value: '■', name: 'Square' }, { value: '●', name: 'Circle' },
  { value: 'K', name: 'Knit (Text)' }, { value: 'P', name: 'Purl (Text)' },
  { value: 'A', name: 'Letter A' }, { value: 'B', name: 'Letter B' }, { value: 'C', name: 'Letter C' },
  { value: 'X', name: 'Letter X' }, { value: 'O', name: 'Letter O' },
  { value: '/', name: 'Forward Slash' }, { value: '\\', name: 'Backslash' },
  { value: '+', name: 'Plus Sign' }, { value: '-', name: 'Minus Sign' },
  { value: '★', name: 'Star' }, { value: '♥', name: 'Heart' }, { value: '♦', name: 'Diamond' },
  { value: '😊', name: 'Smiling Face Emoji' }, { value: '👍', name: 'Thumbs Up Emoji' }, { value: '✨', name: 'Sparkles Emoji' }
];

export const CIRCLED_DIGITS = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];


export const INITIAL_ROWS = 20;
export const INITIAL_COLS = 20;
export const MAX_CHART_ROWS = 200;
export const MAX_CHART_COLS = 200;
export const CELL_SIZE = 28; 
export const GRID_LINE_COLOR_LIGHT = '#D1D5DB'; 
export const GRID_LINE_COLOR_DARK = '#4B5563'; 
export const GUTTER_SIZE = 30;

export const KEY_ID_EMPTY = 'key_empty_no_stitch'; 
export const KEY_ID_KNIT_DEFAULT = 'key_knit_default';
export const KEY_ID_PURL_DEFAULT = 'key_purl_default';

export const MAX_KEY_WIDTH = 8;
export const MAX_KEY_HEIGHT = 8;
export const ABBREVIATION_SKIP_SENTINEL = "__ABBR_SKIP__";


export const generateNewKeyId = () => `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
export const generateNewSheetId = () => `sheet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const INITIAL_KEY_PALETTE: KeyDefinition[] = [
  {
    id: KEY_ID_KNIT_DEFAULT,
    name: 'Knit',
    abbreviation: 'K',
    width: 1,
    height: 1,
    backgroundColor: DEFAULT_CELL_COLOR_LIGHT, 
    symbolColor: DEFAULT_STITCH_COLOR_LIGHT,
    cells: [[null]], 
  },
  {
    id: KEY_ID_PURL_DEFAULT, 
    name: 'Purl', 
    abbreviation: 'P',
    width: 1,
    height: 1,
    backgroundColor: DEFAULT_CELL_COLOR_LIGHT, 
    symbolColor: DEFAULT_STITCH_COLOR_LIGHT, 
    cells: [[{ type: 'text', value: '•' }]], 
  },
  {
    id: KEY_ID_EMPTY, 
    name: 'No Stitch', 
    abbreviation: ABBREVIATION_SKIP_SENTINEL, // Explicitly skip this in legend
    width: 1,
    height: 1,
    backgroundColor: TRANSPARENT_BACKGROUND_SENTINEL, 
    symbolColor: DEFAULT_STITCH_COLOR_LIGHT, 
    cells: [[null]], 
  },
];

export const createChartGrid = (rows: number, cols: number): ChartGrid => {
  const grid: ChartGrid = {};
  for (let r = 0; r < rows; r++) {
    grid[r] = {};
    for (let c = 0; c < cols; c++) {
      // Initialize with default knit stitch
      grid[r][c] = { keyId: KEY_ID_KNIT_DEFAULT, isAnchorCellForMxN: false, keyPartRowOffset: 0, keyPartColOffset: 0 }; 
    }
  }
  return grid;
};

export const buildGridFromKeyPlacements = (
  placements: KeyInstance[],
  rows: number,
  cols: number,
  keyPalette: KeyDefinition[]
): ChartGrid => {
  const newGrid = createChartGrid(rows, cols); // This now initializes with KEY_ID_KNIT_DEFAULT

  const sortedPlacements = [...placements].sort((a, b) => {
    const keyA = keyPalette.find(k => k.id === a.keyId);
    const keyB = keyPalette.find(k => k.id === b.keyId);
    if (!keyA || !keyB) return 0;
    
    const isKeyAContentful = (keyA.cells && keyA.cells.flat().some(c => c !== null)) || (keyA.lines && keyA.lines.length > 0);
    const isKeyBContentful = (keyB.cells && keyB.cells.flat().some(c => c !== null)) || (keyB.lines && keyB.lines.length > 0);
    
    if (isKeyAContentful && !isKeyBContentful) return -1; 
    if (!isKeyAContentful && isKeyBContentful) return 1;  
    
    const areaA = keyA.width * keyA.height;
    const areaB = keyB.width * keyB.height;

    if (isKeyAContentful === isKeyBContentful) {
      if (areaB !== areaA) return areaB - areaA; 
    }
    if (a.anchor.y !== b.anchor.y) return a.anchor.y - b.anchor.y;
    return a.anchor.x - b.anchor.x;
  });

  for (const placement of sortedPlacements) {
    const keyDef = keyPalette.find(k => k.id === placement.keyId);
    if (!keyDef) continue; 

    for (let rOffset = 0; rOffset < keyDef.height; rOffset++) {
      for (let cOffset = 0; cOffset < keyDef.width; cOffset++) {
        const targetR = placement.anchor.y + rOffset;
        const targetC = placement.anchor.x + cOffset;

        if (targetR >= 0 && targetR < rows && targetC >= 0 && targetC < cols) {
          newGrid[targetR][targetC] = {
            keyId: placement.keyId, 
            isAnchorCellForMxN: (rOffset === 0 && cOffset === 0 && (keyDef.width > 1 || keyDef.height > 1)),
            keyPartRowOffset: rOffset,
            keyPartColOffset: cOffset,
          };
        }
      }
    }
  }
  return newGrid;
};


export const resizeKeyPlacements = (
  currentPlacements: KeyInstance[],
  keyPalette: KeyDefinition[],
  newRows: number,
  newCols: number
): KeyInstance[] => {
  return currentPlacements.filter(placement => {
    const keyDef = keyPalette.find(k => k.id === placement.keyId);
    if (!keyDef) return false; 
    if (placement.anchor.y >= newRows || placement.anchor.x >= newCols) {
      return false;
    }
    // Allow keys to be partially cut off by resize, don't remove them entirely
    // if (placement.anchor.y + keyDef.height > newRows || placement.anchor.x + keyDef.width > newCols) {
    //   return false; 
    // }
    return true;
  });
};


const initialKnitKeyPlacements: KeyInstance[] = [];
// Grid is now initialized with Knit by createChartGrid, so initialKnitKeyPlacements can be empty
// unless a different default is desired than the one in createChartGrid.
// For consistency, buildGridFromKeyPlacements will use the 'Knit' from createChartGrid.
// If initialKnitKeyPlacements is empty, the grid will be all KEY_ID_KNIT_DEFAULT.

const initialBaseLayerGrid = buildGridFromKeyPlacements(initialKnitKeyPlacements, INITIAL_ROWS, INITIAL_COLS, INITIAL_KEY_PALETTE);

const initialBaseLayer: Layer = {
  id: 'base', 
  name: 'Base Layer',
  isVisible: true,
  grid: initialBaseLayerGrid,
  keyPlacements: initialKnitKeyPlacements,
};

const INITIAL_DISPLAY_SETTINGS: ChartDisplaySettings = {
  rowCountVisibility: 'right', 
  colCountVisibility: 'bottom', 
};

export const INITIAL_CHART_STATE: ChartState = {
  id: generateNewSheetId(),
  name: 'Sheet 1',
  rows: INITIAL_ROWS,
  cols: INITIAL_COLS,
  orientation: 'bottom-up',
  displaySettings: INITIAL_DISPLAY_SETTINGS, 
  layers: [initialBaseLayer],
  activeLayerId: initialBaseLayer.id,
};

export const MAX_HISTORY_LENGTH = 50;

// Standard zoom levels. 0.25 is added conditionally in Header.
export const ZOOM_LEVELS_BASE = [0.5, 0.75, 1, 1.25, 1.5, 2];
export const DEFAULT_ZOOM_INDEX = 2; // For 100% zoom (value: 1) in ZOOM_LEVELS_BASE

export const calculateFootprint = (anchor: Point, keyDef: KeyDefinition): { minR: number, maxR: number, minC: number, maxC: number } => {
  return {
    minR: anchor.y,
    maxR: anchor.y + keyDef.height - 1,
    minC: anchor.x,
    maxC: anchor.x + keyDef.width - 1,
  };
};

export const doFootprintsOverlap = (
  footprint1: { minR: number, maxR: number, minC: number, maxC: number },
  footprint2: { minR: number, maxR: number, minC: number, maxC: number }
): boolean => {
  return (
    footprint1.minC <= footprint2.maxC &&
    footprint1.maxC >= footprint2.minC &&
    footprint1.minR <= footprint2.maxR &&
    footprint1.maxR >= footprint2.minR
  );
};

export const isPointInFootprint = (
  point: Point,
  footprint: { minR: number, maxR: number, minC: number, maxC: number }
): boolean => {
  return (
    point.x >= footprint.minC &&
    point.x <= footprint.maxC &&
    point.y >= footprint.minR &&
    point.y <= footprint.maxR
  );
};

export const insertRowInKeyPlacements = (
  placements: KeyInstance[], 
  rowIndex: number,
  oldGrid: ChartGrid, // Grid state *before* row insertion (conceptual)
  keyPalette: KeyDefinition[],
  numCols: number
): KeyInstance[] => {
  const shiftedPlacements = placements.map(p => {
    if (p.anchor.y >= rowIndex) {
      return { ...p, anchor: { ...p.anchor, y: p.anchor.y + 1 } };
    }
    return p;
  });

  const newRowPlacements: KeyInstance[] = [];
  // Determine the template row index from the oldGrid.
  // If inserting at row 0, copy from what *was* row 0 (if exists).
  // If inserting at row k > 0, copy from what *was* row k-1.
  // oldGrid refers to the grid *before* any conceptual dimension change or placement shifting.
  const templateRowIndexInOldGrid = rowIndex === 0 
    ? (oldGrid[0] ? 0 : -1) // Use oldGrid[0] if it exists, else -1 (no template)
    : rowIndex - 1;

  if (templateRowIndexInOldGrid >= 0 && oldGrid[templateRowIndexInOldGrid]) {
    for (let c = 0; c < numCols; c++) {
      const cellDataInOldGrid = oldGrid[templateRowIndexInOldGrid]?.[c];
      // Use the keyId from the template cell, or default to knit if undefined/null
      const keyIdToCopy = cellDataInOldGrid?.keyId || KEY_ID_KNIT_DEFAULT; 
      newRowPlacements.push({ anchor: { y: rowIndex, x: c }, keyId: keyIdToCopy });
    }
  } else { // No template row (e.g., inserting into an empty grid or at row 0 of 0-row grid)
    for (let c = 0; c < numCols; c++) {
      newRowPlacements.push({ anchor: { y: rowIndex, x: c }, keyId: KEY_ID_KNIT_DEFAULT });
    }
  }
  
  return [...shiftedPlacements, ...newRowPlacements];
};

export const deleteRowInKeyPlacements = (placements: KeyInstance[], rowIndex: number, keyPalette: KeyDefinition[], newNumRows: number): KeyInstance[] => {
  return placements
    .filter(p => { 
      const keyDef = keyPalette.find(k => k.id === p.keyId);
      if (!keyDef) return false;
      // Remove if anchor is in the deleted row
      if (p.anchor.y === rowIndex) return false; 
      return true; 
    })
    .map(p => { 
      if (p.anchor.y > rowIndex) {
        return { ...p, anchor: { ...p.anchor, y: p.anchor.y - 1 } };
      }
      return p;
    });
};

export const insertColInKeyPlacements = (
  placements: KeyInstance[], 
  colIndex: number,
  oldGrid: ChartGrid, // Grid state *before* column insertion
  keyPalette: KeyDefinition[],
  numRows: number
): KeyInstance[] => {
  const shiftedPlacements = placements.map(p => {
    if (p.anchor.x >= colIndex) {
      return { ...p, anchor: { ...p.anchor, x: p.anchor.x + 1 } };
    }
    return p;
  });

  const newColPlacements: KeyInstance[] = [];
  const templateColIndexInOldGrid = colIndex === 0 
    ? (oldGrid[0]?.[0] ? 0 : -1) // Check if oldGrid[0] and oldGrid[0][0] exist
    : colIndex - 1;

  for (let r = 0; r < numRows; r++) {
    let keyIdToCopy = KEY_ID_KNIT_DEFAULT;
    if (templateColIndexInOldGrid >= 0 && oldGrid[r]?.[templateColIndexInOldGrid]) {
        const cellDataInOldGrid = oldGrid[r][templateColIndexInOldGrid];
        if (cellDataInOldGrid?.keyId) {
            keyIdToCopy = cellDataInOldGrid.keyId;
        }
    }
    newColPlacements.push({ anchor: { y: r, x: colIndex }, keyId: keyIdToCopy });
  }
  return [...shiftedPlacements, ...newColPlacements];
};

export const deleteColInKeyPlacements = (placements: KeyInstance[], colIndex: number, keyPalette: KeyDefinition[], newNumCols: number): KeyInstance[] => {
 return placements
    .filter(p => {
        const keyDef = keyPalette.find(k => k.id === p.keyId);
        if (!keyDef) return false;
        if (p.anchor.x === colIndex) return false; // Remove if anchor is in the deleted column
        return true;
    })
    .map(p => {
      if (p.anchor.x > colIndex) {
        return { ...p, anchor: { ...p.anchor, x: p.anchor.x - 1 } };
      }
      return p;
    });
};


export const hexToRgba = (hex: string, alpha: number): string => {
  if (hex === TRANSPARENT_BACKGROUND_SENTINEL || hex === THEME_DEFAULT_BACKGROUND_SENTINEL) { 
      return `rgba(0,0,0,0)`; 
  }
  if (!hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) {
    console.warn(`Invalid hex string passed to hexToRgba: ${hex}`);
    return `rgba(0,0,0,0)`; 
  }

  let rHex = '', gHex = '', bHex = '';
  if (hex.length === 4) { 
    rHex = hex[1] + hex[1];
    gHex = hex[2] + hex[2];
    bHex = hex[3] + hex[3];
  } else { 
    rHex = hex.slice(1, 3);
    gHex = hex.slice(3, 5);
    bHex = hex.slice(5, 7);
  }
  
  const r = parseInt(rHex, 16);
  const g = parseInt(gHex, 16);
  const b = parseInt(bHex, 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const INITIAL_APPLICATION_STATE: ApplicationState = {
  sheets: [INITIAL_CHART_STATE],
  activeSheetId: INITIAL_CHART_STATE.id,
  keyPalette: INITIAL_KEY_PALETTE, 
};

export const createNewSheet = (existingSheetNames: string[], currentKeyPalette: KeyDefinition[]): ChartState => {
  let newName = "Sheet 1";
  let counter = 1;
  while (existingSheetNames.includes(newName)) {
    counter++;
    newName = `Sheet ${counter}`;
  }
  
  // initialKeyPlacements will be empty as createChartGrid now handles default fill
  const newKeyPlacements: KeyInstance[] = [];
  const newGrid = buildGridFromKeyPlacements(newKeyPlacements, INITIAL_ROWS, INITIAL_COLS, currentKeyPalette); 
  
  const newBaseLayer: Layer = {
    id: 'base',
    name: 'Base Layer',
    isVisible: true,
    grid: newGrid,
    keyPlacements: newKeyPlacements,
  };

  return {
    id: generateNewSheetId(),
    name: newName,
    rows: INITIAL_ROWS,
    cols: INITIAL_COLS,
    orientation: 'bottom-up',
    displaySettings: { ...INITIAL_DISPLAY_SETTINGS },
    layers: [newBaseLayer],
    activeLayerId: newBaseLayer.id,
  };
};
