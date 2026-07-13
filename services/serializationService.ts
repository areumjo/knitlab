import { pack, unpack } from 'msgpackr';
import { compressSync, decompressSync } from 'fflate';
import { ApplicationState, ChartState, KeyDefinition, KeyCellContent, Line } from '../types';
import {
  buildGridFromKeyPlacements,
} from '../constants';

const CURRENT_VERSION = 2;

/**
 * Compact format for serialization (abbreviated keys to reduce size)
 */
interface CompactApplicationState {
  v: number;                    // version
  p: CompactKeyDefinition[];    // keyPalette
  s: CompactChartState[];       // sheets
  a: string | null;             // activeSheetId
}

interface CompactKeyDefinition {
  i: string;                    // id
  n: string;                    // name
  ab?: string | null;           // abbreviation
  w: number;                    // width
  h: number;                    // height
  bg: string;                   // backgroundColor
  sc: string;                   // symbolColor
  c?: (KeyCellContent | null)[][]; // cells
  cc?: (string | null)[][];     // per-cell colors for a multi-color tile
  l?: Line[];                   // lines
}

interface CompactChartState {
  i: string;                    // id
  n: string;                    // name
  r: number;                    // rows
  c: number;                    // cols
  o: ChartState['orientation']; // orientation
  d: ChartState['displaySettings']; // displaySettings
  l: CompactLayer[];            // layers
  al: string | null;            // activeLayerId
}

interface CompactLayer {
  i: string;                    // id
  n: string;                    // name
  v: boolean;                   // isVisible
  k: Array<{x: number, y: number, id: string}>; // keyPlacements (simplified)
}

/**
 * Convert full ApplicationState to compact format
 */
function toCompactFormat(state: ApplicationState): CompactApplicationState {
  const compact: CompactApplicationState = {
    v: CURRENT_VERSION,
    p: state.keyPalette.map(k => ({
      i: k.id,
      n: k.name,
      ab: k.abbreviation,
      w: k.width,
      h: k.height,
      bg: k.backgroundColor,
      sc: k.symbolColor,
      c: k.cells,
      cc: k.colorCells,
      l: k.lines,
    })),
    s: state.sheets.map(s => ({
      i: s.id,
      n: s.name,
      r: s.rows,
      c: s.cols,
      o: s.orientation,
      d: s.displaySettings,
      l: s.layers.map(layer => ({
        i: layer.id,
        n: layer.name,
        v: layer.isVisible,
        k: layer.keyPlacements.map(kp => ({
          x: kp.anchor.x,
          y: kp.anchor.y,
          id: kp.keyId,
        })),
      })),
      al: s.activeLayerId,
    })),
    a: state.activeSheetId,
  };

  return compact;
}

/**
 * Convert compact format back to full ApplicationState
 */
function fromCompactFormat(compact: CompactApplicationState, _keyPalette: KeyDefinition[]): ApplicationState {
  const fullKeyPalette: KeyDefinition[] = compact.p.map(k => ({
    id: k.i,
    name: k.n,
    abbreviation: k.ab,
    width: k.w,
    height: k.h,
    backgroundColor: k.bg,
    symbolColor: k.sc,
    cells: k.c,
    colorCells: k.cc,
    lines: k.l,
  }));

  return {
    keyPalette: fullKeyPalette,
    sheets: compact.s.map(s => ({
      id: s.i,
      name: s.n,
      rows: s.r,
      cols: s.c,
      orientation: s.o,
      displaySettings: s.d,
      layers: s.l.map(layer => {
        const keyPlacements = layer.k.map(kp => ({
          anchor: { x: kp.x, y: kp.y },
          keyId: kp.id,
        }));

        // Rebuild grid from keyPlacements (this is the key optimization!)
        const grid = buildGridFromKeyPlacements(keyPlacements, s.r, s.c, fullKeyPalette);

        return {
          id: layer.i,
          name: layer.n,
          isVisible: layer.v,
          keyPlacements: keyPlacements,
          grid: grid,
        };
      }),
      activeLayerId: s.al,
    })),
    activeSheetId: compact.a,
  };
}

/**
 * Serialize ApplicationState to compressed base64 string
 *
 * Process: ApplicationState -> Compact Format -> msgpack -> deflate -> base64
 */
export function serialize(state: ApplicationState): string {
  try {
    // Step 1: Convert to compact format (removes grid, abbreviates keys)
    const compact = toCompactFormat(state);

    // Step 2: Encode with msgpack (binary format, ~30% smaller than JSON)
    const msgpackBytes = pack(compact);

    // Step 3: Compress with fflate/deflate (~70% additional reduction)
    const compressed = compressSync(new Uint8Array(msgpackBytes));

    // Step 4: Convert to base64 for safe storage/transmission
    const base64 = btoa(String.fromCharCode(...compressed));

    return base64;
  } catch (error) {
    console.error('Serialization error:', error);
    throw new Error(`Failed to serialize state: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deserialize from compressed base64 string back to ApplicationState
 *
 * Process: base64 -> inflate -> msgpack -> Compact Format -> ApplicationState
 * Also handles legacy JSON format for backward compatibility
 */
export function deserialize(data: string): ApplicationState {
  try {
    // Detect legacy format (starts with '{' or whitespace before '{')
    const trimmed = data.trim();
    if (trimmed.startsWith('{')) {
      console.log('Detected legacy JSON format, migrating...');
      return deserializeLegacy(data);
    }

    // Step 1: Decode base64
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Step 2: Decompress with fflate/inflate
    const decompressed = decompressSync(bytes);

    // Step 3: Decode msgpack
    const compact = unpack(decompressed) as CompactApplicationState;

    // Step 4: Validate version
    if (!compact.v || compact.v !== CURRENT_VERSION) {
      console.warn(`Unknown format version: ${compact.v}, attempting to parse anyway...`);
    }

    // Step 5: Convert from compact to full format (rebuilds grids)
    return fromCompactFormat(compact, []);

  } catch (error) {
    console.error('Deserialization error:', error);

    // Fallback: try legacy JSON format
    try {
      console.log('Attempting legacy JSON fallback...');
      return deserializeLegacy(data);
    } catch (legacyError) {
      throw new Error(`Failed to deserialize state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Deserialize legacy JSON format (backward compatibility)
 * This is the original format that includes grid data
 */
function deserializeLegacy(jsonString: string): ApplicationState {
  const loadedState = JSON.parse(jsonString);

  if (!loadedState.sheets || !loadedState.keyPalette) {
    throw new Error('Invalid legacy format: missing required fields');
  }

  // If legacy format has grid but no keyPlacements, we need to extract placements from grid
  // For now, assume legacy format has both (as per current implementation)
  const sheets = loadedState.sheets.map((s: any) => ({
    ...s,
    layers: s.layers.map((l: any) => {
      // If keyPlacements exists, rebuild grid from it
      if (l.keyPlacements && Array.isArray(l.keyPlacements)) {
        return {
          ...l,
          grid: buildGridFromKeyPlacements(l.keyPlacements, s.rows, s.cols, loadedState.keyPalette),
        };
      }
      // Otherwise keep the grid as-is (legacy)
      return l;
    }),
  }));

  return {
    ...loadedState,
    sheets,
  };
}

/**
 * Calculate size savings (for debugging/logging)
 */
export function calculateSizeInfo(state: ApplicationState): {
  originalJSON: number;
  compactJSON: number;
  compressed: number;
  compressionRatio: number;
} {
  const originalJSON = JSON.stringify(state).length;
  const compactJSON = JSON.stringify(toCompactFormat(state)).length;
  const compressed = serialize(state).length;

  return {
    originalJSON,
    compactJSON,
    compressed,
    compressionRatio: ((originalJSON - compressed) / originalJSON * 100),
  };
}
