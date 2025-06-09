
import React, { useState } from 'react';
import { KeyDefinition, StitchSymbolDef, ContextMenuItem } from '../types';
import { Button } from './Button';
import { PlusIcon, PenIcon as EditIcon, TrashIcon, CopyIcon as DuplicateIcon } from './Icon';
import { StitchSymbolDisplay } from './StitchSymbolDisplay';
import {
    KEY_ID_EMPTY,
    TRANSPARENT_BACKGROUND_SENTINEL,
    THEME_DEFAULT_BACKGROUND_SENTINEL,
    DEFAULT_CELL_COLOR_DARK,
    DEFAULT_CELL_COLOR_LIGHT,
    GRID_LINE_COLOR_DARK,
    GRID_LINE_COLOR_LIGHT
} from '../constants';
import { ContextMenu } from './ContextMenu';

export interface KeyUsageData {
  keyDef: KeyDefinition;
  count: number;
}

interface KeyPaletteProps {
  keyPalette: KeyDefinition[];
  activeKeyId: string | null;
  onKeySelect: (keyId: string) => void;
  onAddKey: () => void;
  onEditKey: (key: KeyDefinition) => void;
  onDeleteKey: (keyId: string) => void;
  onDuplicateKey: (keyId: string) => void;
  allStitchSymbols: StitchSymbolDef[];
  isDarkMode: boolean;
  showKeyUsageTally: boolean;
  onToggleShowKeyTally: () => void;
  keyUsageData: KeyUsageData[];
}

interface KeyPreviewButtonProps {
  keyDef: KeyDefinition;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (event: React.MouseEvent, keyDef: KeyDefinition) => void;
  allStitchSymbols: StitchSymbolDef[];
  shortcutNumber?: number;
  isDarkMode: boolean;
}

const KeyPreviewButton: React.FC<KeyPreviewButtonProps> = ({
    keyDef,
    isActive,
    onClick,
    onContextMenu,
    allStitchSymbols,
    shortcutNumber,
    isDarkMode,
}) => {

  const previewButtonSize = 36;
  const padding = 2;
  const innerContentSize = previewButtonSize - (padding * 2);

  const renderMxNBackgroundPreview = () => {
    if (keyDef.width === 1 && keyDef.height === 1) {
      return null;
    }
    const cells = [];
    const cellDisplayW = innerContentSize / keyDef.width;
    const cellDisplayH = innerContentSize / keyDef.height;

    for (let r = 0; r < keyDef.height; r++) {
      for (let c = 0; c < keyDef.width; c++) {
        let cellBgColor: string;
        if (keyDef.backgroundColor === TRANSPARENT_BACKGROUND_SENTINEL) {
            cellBgColor = isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;
        } else if (keyDef.backgroundColor === THEME_DEFAULT_BACKGROUND_SENTINEL) {
            cellBgColor = isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT;
        } else {
            cellBgColor = keyDef.backgroundColor;
        }
        cells.push(
          <div
            key={`preview-cell-${r}-${c}`}
            style={{
              position: 'absolute',
              width: `${cellDisplayW - 0.5}px`,
              height: `${cellDisplayH - 0.5}px`,
              left: `${c * cellDisplayW}px`,
              top: `${r * cellDisplayH}px`,
              backgroundColor: cellBgColor,
            }}
          />
        );
      }
    }
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ padding: `${padding}px`}}>
        <div className="relative w-full h-full">{cells}</div>
      </div>
    );
  };

  let borderClasses = 'border-2 ';
  if (isActive) {
    borderClasses += 'border-primary dark:border-primary-light ring-2 ring-primary';
  } else {
    borderClasses += 'border-neutral-300 dark:border-neutral-600 hover:border-primary/70';
  }

  const unitSizeForDisplay = innerContentSize / Math.max(keyDef.width, keyDef.height, 1);

  let buttonBackgroundColor: string;
  if (keyDef.width === 1 && keyDef.height === 1) {
    if (keyDef.backgroundColor === TRANSPARENT_BACKGROUND_SENTINEL) {
      buttonBackgroundColor = isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;
    } else if (keyDef.backgroundColor === THEME_DEFAULT_BACKGROUND_SENTINEL) {
      buttonBackgroundColor = isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT;
    } else {
      buttonBackgroundColor = keyDef.backgroundColor;
    }
  } else {
    buttonBackgroundColor = 'transparent';
  }

  return (
    <div className="relative group flex-shrink-0">
      <button
        title={`${keyDef.name} (${keyDef.width}x${keyDef.height})${isActive ? ' (Active)' : ''}${shortcutNumber ? ` [${shortcutNumber}]` : ''}`}
        onClick={onClick}
        onContextMenu={(e) => onContextMenu(e, keyDef)}
        className={`p-0 rounded flex items-center justify-center transition-colors relative overflow-hidden
                    ${borderClasses}`}
        style={{
            width: `${previewButtonSize}px`,
            height: `${previewButtonSize}px`,
            backgroundColor: buttonBackgroundColor,
         }}
        aria-pressed={isActive}
      >
        { (keyDef.width > 1 || keyDef.height > 1) && renderMxNBackgroundPreview() }

        <div className="absolute inset-0 flex items-center justify-center" style={{pointerEvents: 'none'}}>
             <StitchSymbolDisplay
                keyDef={keyDef}
                allStitchSymbols={allStitchSymbols}
                cellSize={unitSizeForDisplay}
                isDarkMode={isDarkMode}
            />
        </div>
        {shortcutNumber && (
          <span className="absolute top-0.5 right-0.5 text-[10px] font-bold px-1 bg-neutral-300/80 dark:bg-neutral-600/80 text-neutral-700 dark:text-neutral-200 rounded-sm leading-none z-10">
            {shortcutNumber}
          </span>
        )}
      </button>
    </div>
  );
};


export const TopRibbon: React.FC<KeyPaletteProps> = ({
  keyPalette,
  activeKeyId,
  onKeySelect,
  onAddKey,
  onEditKey,
  onDeleteKey,
  onDuplicateKey,
  allStitchSymbols,
  isDarkMode,
  showKeyUsageTally,
  keyUsageData,
}) => {
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; keyDef: KeyDefinition; items: ContextMenuItem[] } | null>(null);

  const handleKeyContextMenu = (event: React.MouseEvent, keyDef: KeyDefinition) => {
    event.preventDefault();
    setContextMenu(null);

    const menuItems: ContextMenuItem[] = [
        { label: 'Edit Key', action: () => onEditKey(keyDef) },
        { label: 'Duplicate Key', action: () => onDuplicateKey(keyDef.id) },
    ];

    if (keyDef.id !== KEY_ID_EMPTY && keyPalette.length > 1) {
        menuItems.push({ isSeparator: true });
        menuItems.push({ label: 'Delete Key', action: () => onDeleteKey(keyDef.id), disabled: keyPalette.length <=1 });
    }

    if (menuItems.length > 0) {
      setContextMenu({ visible: true, x: event.clientX, y: event.clientY, keyDef, items: menuItems });
    }
  };

  const closeContextMenu = () => setContextMenu(null);

  let shortcutCounter = 0;
  const paletteWithShortcutsAndTally = keyPalette.map(keyDef => {
    let shortcutNum: number | undefined = undefined;
    if (shortcutCounter < 5) {
      shortcutCounter++;
      shortcutNum = shortcutCounter;
    }
    const usage = keyUsageData.find(data => data.keyDef.id === keyDef.id);
    return { ...keyDef, shortcutNumber: shortcutNum, tallyCount: usage?.count };
  });

  return (
    <div className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-1.5 flex items-end space-x-1.5 print:hidden overflow-x-auto overflow-y-hidden custom-scrollbar h-[52px] flex-shrink-0">

      {paletteWithShortcutsAndTally.map((keyDefWithDetails) => (
        <div
          key={`key-item-${keyDefWithDetails.id}`}
          className="flex flex-col items-center flex-shrink-0"
          title={showKeyUsageTally && keyDefWithDetails.tallyCount ? `${keyDefWithDetails.name} - Used: ${keyDefWithDetails.tallyCount}` : keyDefWithDetails.name}
        >
          {showKeyUsageTally && keyDefWithDetails.tallyCount && keyDefWithDetails.tallyCount > 0 ? (
            <span
              className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 mb-0.5 text-center leading-none"
              aria-hidden="true"
            >
              {keyDefWithDetails.tallyCount > 999 ? '999+' : keyDefWithDetails.tallyCount}
            </span>
          ) : (
            <span className="text-[10px] invisible mb-0.5 leading-none" aria-hidden="true">-</span> // Placeholder for alignment
          )}
          <KeyPreviewButton
            keyDef={keyDefWithDetails}
            isActive={activeKeyId === keyDefWithDetails.id}
            onClick={() => onKeySelect(keyDefWithDetails.id)}
            onContextMenu={handleKeyContextMenu}
            allStitchSymbols={allStitchSymbols}
            shortcutNumber={keyDefWithDetails.shortcutNumber}
            isDarkMode={isDarkMode}
          />
        </div>
      ))}

      <div className="h-7 border-l border-neutral-300 dark:border-neutral-600 ml-2 mr-1 flex-shrink-0 self-center"></div>

      <div className="flex flex-col items-center flex-shrink-0 self-center">
        {/* Placeholder for Add button tally if needed, or just to align with keys */}
        <span className="text-[10px] invisible mb-0.5 leading-none" aria-hidden="true">-</span>
        <Button
            variant="ghost"
            size="sm"
            onClick={onAddKey}
            title="Add New Key"
            className="p-2 h-[36px] w-[36px] flex-shrink-0 border border-dashed border-neutral-400 dark:border-neutral-500 hover:border-primary"
        >
            <PlusIcon />
        </Button>
      </div>

      {contextMenu?.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};
