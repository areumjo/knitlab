import React, { useEffect, useState } from 'react';
import type { KeyDefinition } from '../types';
import { Button } from './Button';
import { Modal } from './Modal';

interface ColorEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  color: KeyDefinition | null;
  onSave: (color: KeyDefinition) => void;
}

export const ColorEditorModal: React.FC<ColorEditorModalProps> = ({
  isOpen,
  onClose,
  color,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#000000');

  useEffect(() => {
    if (!isOpen || !color) return;
    setName(color.name);
    setHex(color.backgroundColor.toUpperCase());
  }, [isOpen, color]);

  if (!color) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit color" size="sm">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Name</span>
          <input
            name="color-name"
            autoComplete="off"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-600 dark:bg-neutral-700"
          />
        </label>
        <label className="flex items-center gap-3">
          <input
            type="color"
            name="color-value"
            aria-label="Color value"
            value={hex}
            onChange={(event) => setHex(event.target.value.toUpperCase())}
            className="h-12 w-16 cursor-pointer rounded border border-neutral-300 bg-white p-1 dark:border-neutral-600 dark:bg-neutral-700"
          />
          <span className="font-mono text-sm text-neutral-700 dark:text-neutral-200">{hex}</span>
        </label>
        <div className="flex justify-end gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            onClick={() => {
              onSave({ ...color, name: name.trim() || hex, backgroundColor: hex });
              onClose();
            }}
          >
            Save color
          </Button>
        </div>
      </div>
    </Modal>
  );
};
