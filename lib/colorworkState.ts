import {
  buildGridFromKeyPlacements,
  INITIAL_KEY_PALETTE,
  KEY_ID_KNIT_DEFAULT,
  THEME_DEFAULT_BACKGROUND_SENTINEL,
} from '../constants';
import type { ApplicationState, KeyDefinition } from '../types';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function isColorworkKey(key: KeyDefinition): boolean {
  // Blocks (multi-color keys) store THEME_DEFAULT_BACKGROUND_SENTINEL as their
  // backgroundColor so unpainted cells fall back to the theme's default color;
  // that's distinct from the legacy transparent "no stitch" sentinel, which
  // must still be dropped here.
  if (!HEX_COLOR.test(key.backgroundColor) && key.backgroundColor !== THEME_DEFAULT_BACKGROUND_SENTINEL) return false;
  if (!Number.isInteger(key.width) || !Number.isInteger(key.height) || key.width < 1 || key.height < 1) return false;
  if (key.lines?.length) return false;
  if (key.cells?.flat().some((cell) => cell !== null)) return false;

  if (!key.colorCells) return key.width === 1 && key.height === 1;
  return key.colorCells.length === key.height && key.colorCells.every((row) =>
    row.length === key.width && row.every((color) => color === null || HEX_COLOR.test(color)),
  );
}

/** Removes legacy symbol/no-stitch data at every file and autosave boundary. */
export function sanitizeColorworkState(state: ApplicationState): ApplicationState {
  const palette: KeyDefinition[] = state.keyPalette
    .filter(isColorworkKey)
    .map((key) => ({
      ...key,
      abbreviation: null,
      cells: [[null]],
      colorCells: key.colorCells?.map((row) => [...row]),
      lines: undefined,
    }));

  if (!palette.some((key) => key.id === KEY_ID_KNIT_DEFAULT)) {
    const natural = INITIAL_KEY_PALETTE.find((key) => key.id === KEY_ID_KNIT_DEFAULT);
    if (natural) palette.unshift(structuredClone(natural));
  }

  const allowedIds = new Set(palette.map((key) => key.id));
  const sheets = state.sheets.map((sheet) => ({
    ...sheet,
    layers: sheet.layers.map((layer) => {
      const keyPlacements = (layer.keyPlacements ?? []).filter((placement) =>
        placement.keyId !== KEY_ID_KNIT_DEFAULT && allowedIds.has(placement.keyId),
      );
      return {
        ...layer,
        keyPlacements,
        grid: buildGridFromKeyPlacements(keyPlacements, sheet.rows, sheet.cols, palette),
      };
    }),
  }));

  return {
    keyPalette: palette,
    sheets,
    activeSheetId: sheets.some((sheet) => sheet.id === state.activeSheetId)
      ? state.activeSheetId
      : sheets[0]?.id ?? null,
  };
}
