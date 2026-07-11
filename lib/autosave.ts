import type { ApplicationState, ChartState, Layer } from '../types';
import { buildGridFromKeyPlacements } from '../constants';
import { sanitizeColorworkState } from './colorworkState';

const STORAGE_KEY = 'knitlab:colorwork-autosave:v1';
const MAX_BYTES = 4 * 1024 * 1024;

export interface AutosaveSnapshot {
  state: ApplicationState;
  savedAt: number;
}

function stripDerivedGrids(state: ApplicationState): ApplicationState {
  return {
    ...state,
    sheets: state.sheets.map((sheet) => ({
      ...sheet,
      layers: sheet.layers.map((layer) => ({ ...layer, grid: {} })),
    })),
  };
}

function rebuildDerivedGrids(state: ApplicationState): ApplicationState {
  const rebuildLayer = (layer: Layer, sheet: ChartState): Layer => (
    layer.grid && Object.keys(layer.grid).length > 0
      ? layer
      : {
          ...layer,
          grid: buildGridFromKeyPlacements(
            layer.keyPlacements ?? [],
            sheet.rows,
            sheet.cols,
            state.keyPalette,
          ),
        }
  );
  return {
    ...state,
    sheets: state.sheets.map((sheet) => ({
      ...sheet,
      layers: sheet.layers.map((layer) => rebuildLayer(layer, sheet)),
    })),
  };
}

export function loadAutosave(): AutosaveSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AutosaveSnapshot;
    if (!parsed || typeof parsed !== 'object' || !parsed.state) return null;
    return { ...parsed, state: sanitizeColorworkState(rebuildDerivedGrids(parsed.state)) };
  } catch {
    return null;
  }
}

export function saveAutosave(state: ApplicationState): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify({ state: stripDerivedGrids(state), savedAt: Date.now() });
    if (serialized.length <= MAX_BYTES) window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Browser storage may be unavailable or full; explicit file save remains available.
  }
}

export function clearAutosave(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
}
