
import React, { useState } from 'react';
import { ChartState } from '../types';
import { Button } from './Button';
import { PlusIcon, TrashIcon, PenIcon as EditIcon } from './Icon'; // Using PenIcon as EditIcon

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
        <Button size="sm" variant="ghost" onClick={onAddSheet} title="Add new sheet">
          <PlusIcon />
        </Button>
      </div>
      {sheets.length === 0 && <p className="text-xs text-neutral-500 dark:text-neutral-400">No sheets. Add one!</p>}
      <ul className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
        {sheets.map((sheet) => (
          <li
            key={sheet.id}
            className={`group flex items-center justify-between p-2 rounded cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors
                        ${activeSheetId === sheet.id ? 'bg-primary/20 dark:bg-primary-dark/30' : ''}`}
            onClick={() => editingSheetId !== sheet.id && onSheetSelect(sheet.id)}
          >
            {editingSheetId === sheet.id ? (
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleRenameConfirm}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameConfirm();
                  if (e.key === 'Escape') handleRenameCancel();
                }}
                className="text-sm flex-grow bg-neutral-50 dark:bg-neutral-700 border border-primary px-1 py-0.5 rounded outline-none"
                autoFocus
              />
            ) : (
              <span className="text-sm truncate flex-grow" title={sheet.name}>
                {sheet.name}
              </span>
            )}
            <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
              {editingSheetId !== sheet.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleRenameStart(sheet); }}
                  title="Rename sheet"
                >
                  <EditIcon />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); handleRemoveWithConfirm(sheet.id); }}
                title="Delete sheet"
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
