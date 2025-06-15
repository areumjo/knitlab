export interface Point {
  x: number;
  y: number;
}

export interface Line {
  start: Point;
  end: Point;
}

export interface StitchSymbolDef {
  id: string;
  name: string;
  abbreviation: string;
  displayText?: string;
  svgContent?: string;
  description?: string;
  category?: string;
  viewBox?: string;
}

export interface KeyCellContent {
  type: 'svg' | 'text';
  value: string;
}

export interface KeyDefinition {
  id: string;
  name: string;
  abbreviation?: string | null; // Added for custom abbreviation
  width: number;
  height: number;
  backgroundColor: string;
  symbolColor: string;
  cells?: (KeyCellContent | null)[][];
  lines?: Line[];
}

export interface ChartCell {
  keyId: string | null;
  isAnchorCellForMxN?: boolean;
  keyPartRowOffset?: number;
  keyPartColOffset?: number;
}

export interface ChartGrid {
  [rowIndex: number]: {
    [colIndex: number]: ChartCell;
  };
}

export interface KeyInstance {
  anchor: Point;
  keyId: string;
}

export interface Layer {
  id:string;
  name: string;
  isVisible: boolean;
  grid: ChartGrid;
  keyPlacements: KeyInstance[];
}

export interface ChartDisplaySettings {
  rowCountVisibility: 'none' | 'left' | 'right' | 'both' | 'alternating-left' | 'alternating-right';
  colCountVisibility: 'none' | 'top' | 'bottom' | 'both';
}

export interface ChartState {
  id: string;
  rows: number;
  cols: number;
  orientation: 'bottom-up' | 'top-down' | 'left-right' | 'in-the-round';
  name: string;
  displaySettings: ChartDisplaySettings;
  layers: Layer[];
  activeLayerId: string | null;
}

export enum Tool {
  Pen = 'pen',
  Select = 'select',
  Move = 'move',
}

export interface SelectionRect {
  start: Point;
  end: Point;
}

export interface HistoryEntry<T> {
  state: T;
  timestamp: number;
}

type ActionContextItem = {
  label: string;
  action: () => void;
  disabled?: boolean;
  isSeparator?: false | undefined;
};

type SeparatorContextItem = {
  isSeparator: true;
};

export type ContextMenuItem = ActionContextItem | SeparatorContextItem;

export interface HoveredGutterInfo {
  type: 'row' | 'col';
  index: number;
  displayNumber?: number;
}

export interface DraggedCellsInfo {
  relativeKeyInstances: KeyInstance[];
  width: number;
  height: number;
  originalStartCoords: Point;
}

export type TabId = 'layers' | 'text' | 'sheets' | 'keys';
// If 'image-import' needed to show distinct content in the sidebar pane,
// it would be added here: e.g. export type TabId = 'layers' | 'text' | 'sheets' | 'keys' | 'image-import';
// For now, it only triggers a modal, so the existing TabId might suffice for content-displaying tabs.

export interface ApplicationState {
  sheets: ChartState[];
  activeSheetId: string | null;
  keyPalette: KeyDefinition[];
}

export interface ClipboardData {
  relativeKeyInstances: KeyInstance[];
  width: number;
  height: number;
  sourceKeyDefinitions: KeyDefinition[];
}

export interface StitchSymbolDisplayProps {
  keyDef: KeyDefinition | null;
  allStitchSymbols?: StitchSymbolDef[];
  className?: string;
  cellSize?: number;
  keyPartRowOffset?: number;
  keyPartColOffset?: number;
  isDarkMode?: boolean;
}

// Data structure for the output of ImageProcessorModal
export interface ProcessedImageData {
  gridData: {
    rows: number;
    cols: number;
    // cellAspectWidth: number; // Not directly needed for chart creation from colors
    // cellAspectHeight: number; // Not directly needed for chart creation from colors
    colors: string[]; // Array of RGB or HEX color strings for each cell
  };
  palette: string[]; // Array of unique RGB or HEX color strings
}

export interface MiniMapProps {
  chartState: ChartState;
  keyPalette: KeyDefinition[];
  viewport: { x: number; y: number; width: number; height: number };
  canvasZoom: number;
  onPan: (targetCenterGridCoords: Point) => void;
  canvasSize: { width: number; height: number };
  isDarkMode: boolean;
  maxContainerSize: { width: number; height: number }; // Added for dynamic scaling
}
