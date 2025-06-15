import { StitchSymbolDef, ChartState, ChartGrid, Layer, ChartDisplaySettings, ApplicationState, KeyDefinition, KeyInstance, Point } from './types';

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
  { id: 'empty', name: 'empty', abbreviation: '', svgContent: '<rect width="100%" height="100%" fill="transparent" />', description: 'Empty stitch' },
  { id: 'knit', name: 'knit', abbreviation: 'K', svgContent: '<line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="2.5"/ >', description: 'Knit stitch (vertical line)' },
  { id: 'purl', name: 'purl', abbreviation: 'P', svgContent: '<line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2.5"/ >', description: 'Purl stitch (horizontal line)' },
  { id: 'sl', name: 'slip', abbreviation: 'sl', svgContent: '<svg viewBox="-140 -140 828 828"><path d="M35.547 20 279.08 532M279.08 532L516.452 20" stroke="currentColor" stroke-width="75" stroke-linecap="round" /></svg>', description: 'Slip stitch purlwise' },
  { id: 'sl-wyif', name: 'slip 1 wyif', abbreviation: 'sl wyif', svgContent: '<svg viewBox="-140 -140 828 828"><path d="M35.547 20 279.08 532M279.08 532L516.452 20" stroke="currentColor" stroke-width="75" stroke-linecap="round" /><circle cx="280.02" cy="114.252" r="62.563" stroke-width="25" stroke-linecap="round" fill="currentColor"/></svg>', description: 'Slip 1 stitch purlwise with yarn in front' },
  { id: 'k-tbl', name: 'K tbl', abbreviation: 'k tbl', svgContent: '<svg viewBox="-125 -125 745 745" fill="rgb(255, 255, 255)"><path d="M468.825 477.648C372.159 476.314 83.492 274.314 83.492 124.98s280-145.332 280 50.668S28.825 468.314 28.825 468.314" stroke="currentColor" stroke-linecap="round" stroke-width="75" /></svg>', description: 'Knit through back loop' },
  { id: 'p-tbl', name: 'P tbl', abbreviation: 'p tbl', svgContent: '<svg viewBox="-125 -125 745 745" fill="rgb(255, 255, 255)"><path d="M468.825 477.648C372.159 476.314 83.492 274.314 83.492 124.98s280-145.332 280 50.668S28.825 468.314 28.825 468.314" stroke="currentColor" stroke-linecap="round" stroke-width="75" fill="none"/><circle cx="230" cy="160" r="50" stroke-width="25" stroke-linecap="round" fill="currentColor"/></svg>', description: 'Purl through back loop' },
  { id: 'm1r', name: 'm1r', abbreviation: 'm1r', svgContent: '<svg viewBox="-140 -140 828 828" background: rgb(255, 255, 255)><path stroke="currentColor" stroke-linecap="round" stroke-width="75" d="m20 20 256 256L532 20 20 532" fill="none" /></svg>', description: 'Make 1 right leaning' },
  { id: 'm1l', name: 'm1l', abbreviation: 'm1l', svgContent: '<svg viewBox="-140 -140 828 828" background: rgb(255, 255, 255)><path stroke="currentColor" stroke-linecap="round" stroke-width="75" d="M532 20 276 276 20 20l512 512" fill="none" /></svg>', description: 'Make 1 left leaning' },
  { id: 'm1pr', name: 'm1pr', abbreviation: 'm1pr', svgContent: '<svg viewBox="-140 -140 828 828" background: rgb(255, 255, 255)><path stroke="currentColor" stroke-linecap="round" stroke-width="75" d="m20 20 256 256L532 20 20 532" fill="none" /><circle cx="276" cy="84" r="64" stroke="#000000" stroke-miterlimit="10" stroke-width="1" /></svg>', description: 'Make 1 purlwise right leaning.' },
  { id: 'm1pl', name: 'm1pl', abbreviation: 'm1pl', svgContent: '<svg viewBox="-140 -140 828 828" background: rgb(255, 255, 255)><path stroke="currentColor" stroke-linecap="round" stroke-width="75" d="M532 20 276 276 20 20l512 512" fill="none" /><circle cx="276" cy="96.598" r="64" stroke="#000000" stroke-width="1" /></svg>', description: 'Make 1 purlwise left leaning.' },
  { id: 'yo', name: 'yarn over', abbreviation: 'yo', svgContent: '<svg viewBox="-140 -140 828 828"><circle cx="276" cy="276" r="256" stroke="currentColor" stroke-width="75" fill="none" /></svg>', description: 'Yarn over' },
  { id: 'k2tog', name: 'k2tog', abbreviation: 'k2tog', svgContent: '<svg viewBox="-140 -140 828 828"><path d="M532 20 20 532" stroke="currentColor" stroke-width="75" stroke-linecap="round" fill="none" /></svg>', description: 'Knit 2 stitches together' },
  { id: 'ssk', name: 'slip, slip, knit', abbreviation: 'ssk', svgContent: '<svg viewBox="-140 -140 828 828"><path d="M20 20 512 512" stroke="currentColor" stroke-width="75" stroke-linecap="round" fill="none" /></svg>', description: 'Slip, slip, knit' },
  { id: 'sk2p', name: 'SK2P', abbreviation: 'sk2p', svgContent: '<svg viewBox="-130.25 -140 781.5 828"><path d="M263.533 20 20 532m480.905 0L263.533 20" stroke="currentColor" stroke-width="75" stroke-linecap="round" fill="none" /></svg>', description: 'Slip, knit 2 together, pass slipped stitch over' },
  { id: 'p2tog', name: 'Purl 2 Together', abbreviation: 'p2tog', svgContent: '<svg viewBox="-140 -140 828 828"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="75" d="M532 20 20 532" /><circle cx="148" cy="148" r="64" /></svg>', description: 'Purl 2 stitches together' },
  { id: 'turn-rs', name: 'Turn to RS', abbreviation: 'turn-RS', svgContent: '<svg viewBox="0 0 512 512"><path d="M110.024 392.688h138.871M110.024 175.513h138.871m-140.871 0 94.058 94.058m0-188.116-94.058 94.058" stroke="currentColor" stroke-linecap="round" stroke-width="45" /><path d="M248.895 392.688c84.488 0 153.081-48.656 153.081-108.588S333.383 175.513 248.895 175.513" fill="none" stroke="currentColor" stroke-width="45" /></svg>', description: 'Turn to Right Side' },
  { id: 'turn-ws', name: 'Turn to WS', abbreviation: 'turn-WS', svgContent: '<svg viewBox="0 0 512 512"><path d="M401.976 392.688H263.105M401.976 175.513H263.105m138.871 0-94.058 94.058m0-188.116 94.058 94.058" stroke="currentColor" stroke-linecap="round" stroke-width="45" /><path d="M263.105 392.688c-84.488 0-153.081-48.656-153.081-108.588S178.617 175.513 263.105 175.513" fill="none" stroke="currentColor" stroke-width="45" /></svg>', description: 'Turn to Wrong Side' }
];

export const UNICODE_SYMBOLS_FOR_KEY_EDITOR: { value: string, name: string }[] = [
  { value: '•', name: 'bullet' }, { value: '■', name: 'square' }, { value: '●', name: 'circle' },
  { value: 'K', name: 'letter K' }, { value: 'P', name: 'letter P' },
  { value: 'A', name: 'letter A' }, { value: 'B', name: 'letter B' }, { value: 'C', name: 'letter C' },
  { value: 'X', name: 'letter X' }, { value: 'O', name: 'letter O' },
  { value: '+', name: 'plus Sign' }, { value: '-', name: 'minus Sign' },
  { value: '✅', name: 'thumbs Up Emoji' }, { value: '✨', name: 'sparkles Emoji' }
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
