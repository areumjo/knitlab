
import React, { useState } from 'react';
import { ChartState } from '../types';
import { Button } from './Button';
import { PlusIcon, TrashIcon, RenameSheetIcon } from './Icon';

interface SheetPanelProps {
  sheets: ChartState[];
  activeSheetId: string | null;
  onSheetSelect: (id: string) => void;
  onAddSheet: () => void;
  onRemoveSheet: (id: string) => void;
  onRenameSheet: (id: string, newName: string) => void;
}

export const SheetPanel: React.FC<SheetPanelProps> = ({
  sheets,
  activeSheetId,
  onSheetSelect,
  onAddSheet,
  onRemoveSheet,
  onRenameSheet,
}) => {
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleRenameStart = (sheet: ChartState) => {
    setEditingSheetId(sheet.id);
    setEditText(sheet.name);
  };

  const handleRenameConfirm = () => {
    if (editingSheetId && editText.trim()) {
      onRenameSheet(editingSheetId, editText.trim());
    }
    setEditingSheetId(null);
    setEditText('');
  };

  const handleRenameCancel = () => {
    setEditingSheetId(null);
    setEditText('');
  };

  const handleRemoveWithConfirm = (sheetId: string) => {
    if (sheets.length <= 1) {
        alert("Cannot delete the last sheet.");
        return;
    }
    if (window.confirm("Are you sure you want to delete this sheet? This action cannot be undone.")) {
        onRemoveSheet(sheetId);
    }
  }

  return (
    <div className="p-2 space-y-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Sheets</h3>
        <Button size="sm" variant="ghost" onClick={onAddSheet} title="Add new sheet" aria-label="Add new sheet">
          <PlusIcon />
        </Button>
      </div>
      {sheets.length === 0 && <p className="text-xs text-neutral-500 dark:text-neutral-400">No sheets. Add one!</p>}
      <ul className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
        {sheets.map((sheet) => (
          <li
            key={sheet.id}
            className={`group flex items-center justify-between rounded transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700
                        ${activeSheetId === sheet.id ? 'bg-primary/20 dark:bg-primary-dark/30' : ''}`}
          >
            {editingSheetId === sheet.id ? (
              <input
                type="text"
                name="sheet-name"
                autoComplete="off"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleRenameConfirm}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameConfirm();
                  if (e.key === 'Escape') handleRenameCancel();
                }}
                className="m-2 min-w-0 flex-grow rounded border border-primary bg-neutral-50 px-1 py-0.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-neutral-700"
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="min-w-0 flex-grow truncate rounded p-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                title={sheet.name}
                aria-current={activeSheetId === sheet.id ? 'true' : undefined}
                onClick={() => onSheetSelect(sheet.id)}
              >
                {sheet.name}
              </button>
            )}
            <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
              {editingSheetId !== sheet.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleRenameStart(sheet); }}
                  title="Rename sheet"
                  aria-label={`Rename ${sheet.name}`}
                >
                  <RenameSheetIcon />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); handleRemoveWithConfirm(sheet.id); }}
                title="Delete sheet"
                aria-label={`Delete ${sheet.name}`}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                disabled={sheets.length <= 1}
              >
                <TrashIcon />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
