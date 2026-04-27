import { ApplicationState, StitchSymbolDef } from '../types';
import { CELL_SIZE } from '../constants';
import { generateChartJpeg } from './exportService';

const DEFAULT_MAX_SIZE = 400;

/**
 * Generate a PNG dataURL thumbnail of the active sheet, sized so its larger
 * axis is at most `maxSize` pixels. Skips gutters and copyright for a clean
 * gallery preview. Used by the publish flow.
 */
export async function generateThumbnail(
  state: ApplicationState,
  allSymbols: StitchSymbolDef[],
  isDarkMode: boolean,
  maxSize: number = DEFAULT_MAX_SIZE
): Promise<string | null> {
  const sheet =
    state.sheets.find(s => s.id === state.activeSheetId) ?? state.sheets[0];
  if (!sheet) return null;

  const naturalSize = Math.max(sheet.cols, sheet.rows) * CELL_SIZE;
  if (naturalSize <= 0) return null;

  const zoom = maxSize / naturalSize;

  return generateChartJpeg(
    sheet,
    state.keyPalette,
    allSymbols,
    isDarkMode,
    zoom,
    false, // includeCopyright
    false, // includeGutters
    'png'
  );
}
