

import React from 'react';
import { StitchSymbolDef, KeyDefinition } from '../types';
import { StitchSymbolDisplay } from './StitchSymbolDisplay';
import { Button } from './Button';
import { PlusIcon } from './Icon';

interface SymbolPaletteProps {
  symbols: StitchSymbolDef[];
  activeSymbolId: string | null;
  onSymbolSelect: (symbolId: string) => void;
  onAddCustomSymbol: () => void;
  currentStitchColor: string;
  isDarkMode: boolean;
}

export const SymbolPalette: React.FC<SymbolPaletteProps> = ({
  symbols,
  activeSymbolId,
  onSymbolSelect,
  onAddCustomSymbol,
  currentStitchColor,
  isDarkMode,
}) => {

  return (
    <div className="space-y-1 flex items-center">
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(24px,1fr))] gap-0.5 max-h-[56px] overflow-y-auto pr-1 custom-scrollbar flex-grow"
      >
        {symbols.map((symbol) => {
          const tempKeyDef: KeyDefinition = {
            id: `temp_palette_${symbol.id}`,
            name: symbol.name,
            width: 1,
            height: 1,
            backgroundColor: 'transparent',
            symbolColor: currentStitchColor,
            cells: [[{ type: 'svg', value: symbol.id }]],
          };

          return (
            <button
              key={symbol.id}
              title={`${symbol.name} (${symbol.abbreviation || symbol.displayText || 'Symbol'})`}
              onClick={() => onSymbolSelect(symbol.id)}
              className={`p-0.5 rounded border-2 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors
                          ${activeSymbolId === symbol.id ? 'border-primary dark:border-primary-light ring-1 ring-primary' : 'border-transparent'}`}
              style={{ aspectRatio: '1 / 1', width: '24px', height: '24px' }}
            >
              <StitchSymbolDisplay
                keyDef={tempKeyDef}
                allStitchSymbols={symbols}
                isDarkMode={isDarkMode}
              />
            </button>
          );
        })}s
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onAddCustomSymbol}
        title="Add custom symbol"
        className="p-1 ml-1 flex-shrink-0"
      >
        <PlusIcon size={16}/>
      </Button>
    </div>
  );
};
