import React, { useState, useMemo } from 'react';
import { ChartState, StitchSymbolDef, KeyDefinition } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { DEFAULT_STITCH_SYMBOLS, KEY_ID_EMPTY, ABBREVIATION_SKIP_SENTINEL } from '../constants';

interface InstructionsGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  chartState: ChartState;
  stitchSymbols: StitchSymbolDef[];
  keyPalette: KeyDefinition[];
}

const resolveKeyAbbreviationForInstructions = (keyDef: KeyDefinition | null | undefined, allStitchSymbols: StitchSymbolDef[]): string => {
  if (!keyDef || keyDef.abbreviation === ABBREVIATION_SKIP_SENTINEL) {
    return ''; // Return empty string for skipped keys, caller will filter these out
  }

  // If abbreviation is a non-empty string, use it.
  if (typeof keyDef.abbreviation === 'string' && keyDef.abbreviation.trim() !== '') {
    return keyDef.abbreviation.trim();
  }

  // If abbreviation is null, undefined, or an empty string (user cleared it or default non-circled for existing), generate one.
  // For KEY_ID_EMPTY, this path should ideally not be taken if filtered by ABBREVIATION_SKIP_SENTINEL.
  if (keyDef.lines && keyDef.lines.length > 0) {
    return `Draw`; // Or a more descriptive placeholder for custom lines
  }
  if (keyDef.cells && keyDef.cells.length > 0 && keyDef.cells[0].length > 0) {
    const firstCellContent = keyDef.cells[0][0];
    if (firstCellContent) {
      if (firstCellContent.type === 'svg') {
        const symbol = allStitchSymbols.find(s => s.id === firstCellContent.value);
        return symbol?.abbreviation || symbol?.name?.charAt(0)?.toUpperCase() || keyDef.name.substring(0,1).toUpperCase() || '?';
      } else if (firstCellContent.type === 'text') {
        return firstCellContent.value.charAt(0) || keyDef.name.substring(0,1).toUpperCase() || '?';
      }
    }
  }
  return keyDef.name.substring(0, 1).toUpperCase() || '?'; // Fallback to first letter of name or '?'
};

const generateInstructionsText = (chart: ChartState, symbols: StitchSymbolDef[], keyPalette: KeyDefinition[]): string => {
  let output = `Chart: ${chart.name}\n`;
  output += `Size: ${chart.rows} rows x ${chart.cols} columns\n`;
  output += `Orientation: ${chart.orientation}\n\n`;

  let currentRowKeyId: string | null = null;

  for (let r_idx = 0; r_idx < chart.rows; r_idx++) {
    const rowNum = chart.orientation === 'bottom-up' ? chart.rows - r_idx : r_idx + 1;
    let rowStr = `Row ${rowNum}: `;
    currentRowKeyId = null;
    let count = 0;

    for (let c_idx = 0; c_idx < chart.cols; c_idx++) {
      let cellKeyId: string | null = null;
      for(let i = chart.layers.length -1; i >=0; i--) {
          const layer = chart.layers[i];
          if(layer.isVisible) {
              const keyOnThisLayer = layer.grid[r_idx]?.[c_idx]?.keyId;
              if(keyOnThisLayer !== null) {
                  cellKeyId = keyOnThisLayer;
                  break;
              }
          }
      }
      if (cellKeyId === null) cellKeyId = KEY_ID_EMPTY;


      if (cellKeyId === currentRowKeyId) {
        count++;
      } else {
        if (currentRowKeyId !== null && count > 0) {
          const currentKeyDef = keyPalette.find(k => k.id === currentRowKeyId);
          if (currentKeyDef && currentKeyDef.abbreviation !== ABBREVIATION_SKIP_SENTINEL && currentKeyDef.id !== KEY_ID_EMPTY) {
            const abbr = resolveKeyAbbreviationForInstructions(currentKeyDef, symbols);
            if (abbr) {
              rowStr += `${count > 1 ? count : ''}${abbr}, `;
            }
          }
        }
        currentRowKeyId = cellKeyId;
        const currentKeyDefForCount = keyPalette.find(k => k.id === cellKeyId);
        count = (currentKeyDefForCount && (currentKeyDefForCount.abbreviation === ABBREVIATION_SKIP_SENTINEL || currentKeyDefForCount.id === KEY_ID_EMPTY)) ? 0 : 1;
      }
    }

    if (currentRowKeyId !== null && count > 0) {
      const currentKeyDef = keyPalette.find(k => k.id === currentRowKeyId);
       if (currentKeyDef && currentKeyDef.abbreviation !== ABBREVIATION_SKIP_SENTINEL && currentKeyDef.id !== KEY_ID_EMPTY) {
          const abbr = resolveKeyAbbreviationForInstructions(currentKeyDef, symbols);
          if (abbr) {
            rowStr += `${count > 1 ? count : ''}${abbr}`;
          }
       }
    }

    if (rowStr.endsWith(', ')) {
      rowStr = rowStr.slice(0, -2);
    }
    if (rowStr.trim() !== `Row ${rowNum}:`) {
         rowStr += '.';
    }
    rowStr += '\n';
    output += rowStr;
  }

  output += "\nLegend:\n";
  const usedKeyIds = new Set<string>();
  for (let r_idx = 0; r_idx < chart.rows; r_idx++) {
    for (let c_idx = 0; c_idx < chart.cols; c_idx++) {
        let keyIdInCellOverall: string | null = null;
         for(let i = chart.layers.length -1; i >=0; i--) {
            const layer = chart.layers[i];
            if(layer.isVisible) {
                const keyOnThisLayer = layer.grid[r_idx]?.[c_idx]?.keyId;
                if(keyOnThisLayer !== null) {
                    keyIdInCellOverall = keyOnThisLayer;
                    break;
                }
            }
        }
        if (keyIdInCellOverall) {
            const keyDef = keyPalette.find(k => k.id === keyIdInCellOverall);
            if (keyDef && keyDef.id !== KEY_ID_EMPTY && keyDef.abbreviation !== ABBREVIATION_SKIP_SENTINEL &&
                ( (keyDef.cells && keyDef.cells.flat().some(c => c !== null)) || (keyDef.lines && keyDef.lines.length > 0) ) ) {
                 usedKeyIds.add(keyIdInCellOverall);
            }
        }
    }
  }

  keyPalette
    .filter(kDef => usedKeyIds.has(kDef.id))
    .forEach(kDef => {
      let symbolRepresentation = resolveKeyAbbreviationForInstructions(kDef, symbols);

      if (symbolRepresentation) {
        output += `${symbolRepresentation} = ${kDef.name}`;

        let descriptionPart = "";
        if (kDef.cells && kDef.cells.length > 0 && kDef.cells[0].length > 0) {
            const firstCell = kDef.cells[0][0];
            if (firstCell?.type === 'svg') {
                const baseSymbolDef = DEFAULT_STITCH_SYMBOLS.find(s => s.id === firstCell.value);
                if (baseSymbolDef?.description) descriptionPart = baseSymbolDef.description;
            } else if (firstCell?.type === 'text') {
                descriptionPart = `Displays as '${firstCell.value}'`;
            }
        } else if (kDef.lines && kDef.lines.length > 0) {
            descriptionPart = `Custom drawing`;
        }

        if (kDef.width > 1 || kDef.height > 1) {
            descriptionPart += (descriptionPart ? "; " : "") + `(${kDef.width}x${kDef.height})`;
        }
        if(descriptionPart) output += ` (${descriptionPart})`;
        output += '\n';
      }
  });

  return output;
};

export const InstructionsGenerator: React.FC<InstructionsGeneratorProps> = ({ isOpen, onClose, chartState, stitchSymbols, keyPalette }) => {
  const [generatedText, setGeneratedText] = useState('');

  useMemo(() => {
    if (isOpen && chartState && keyPalette) {
      setGeneratedText(generateInstructionsText(chartState, stitchSymbols, keyPalette));
    }
  }, [isOpen, chartState, stitchSymbols, keyPalette]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText)
      .then(() => alert('Instructions copied to clipboard!'))
      .catch(err => console.error('Failed to copy instructions: ', err));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generated Knitting Instructions" size="xl">
      <div className="space-y-4">
        <textarea
          readOnly
          value={generatedText}
          className="w-full h-96 p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700 font-mono text-xs whitespace-pre"
          aria-label="Generated knitting instructions"
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
          This is a basic instruction generator. Complex patterns or colorwork may need manual refinement. Keys set to be excluded from instructions are omitted.
        </p>
      </div>
      <div className="pt-5">
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={handleCopy} variant="primary">Copy to Clipboard</Button>
        </div>
      </div>
    </Modal>
  );
};
