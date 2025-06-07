
import React, { useState, useEffect } from 'react';
import { StitchSymbolDef, KeyDefinition, KeyCellContent } from '../types'; // Added KeyCellContent
import { Modal } from './Modal';
import { Button } from './Button';
import { StitchSymbolDisplay } from './StitchSymbolDisplay';
import { DEFAULT_STITCH_COLOR_LIGHT, DEFAULT_STITCH_COLOR_DARK } from '../constants';

interface CustomSymbolEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (symbol: StitchSymbolDef) => void;
  existingSymbol?: StitchSymbolDef | null;
  isDarkMode: boolean; 
}

export const CustomSymbolEditor: React.FC<CustomSymbolEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  existingSymbol,
  isDarkMode,
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [displayText, setDisplayText] = useState(''); // This is StitchSymbolDef.displayText
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (existingSymbol) {
      setId(existingSymbol.id);
      setName(existingSymbol.name);
      setAbbreviation(existingSymbol.abbreviation);
      setDisplayText(existingSymbol.displayText || ''); 
      setDescription(existingSymbol.description || '');
      setCategory(existingSymbol.category || '');
    } else {
      setId(`custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
      setName('');
      setAbbreviation('');
      setDisplayText('');
      setDescription('');
      setCategory('');
    }
  }, [existingSymbol, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !abbreviation || !displayText) {
        alert("Name, Abbreviation, and Display Text are required for custom symbols.");
        return;
    }
    if (displayText.length > 5 && !confirm("Display Text is quite long. Are you sure? (Recommended: 1-2 characters)")) {
        return;
    }
    onSave({ id, name, abbreviation, displayText, svgContent: undefined, description, category });
    onClose();
  };

  const previewStitchColor = isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT;
  const previewBgColor = isDarkMode ? "#4B5563" : "#E5E7EB"; 

  // Create a KeyDefinition for the preview using the new `cells` structure
  const previewCellContent: KeyCellContent | null = displayText.trim() 
    ? { type: 'text', value: displayText.trim() } 
    : null;

  const previewKeyDef: KeyDefinition = {
      id: id || 'preview', 
      name: name || 'Preview Symbol',
      width: 1, 
      height: 1,
      backgroundColor: previewBgColor,
      symbolColor: previewStitchColor,
      cells: [[previewCellContent]], // Use the new cells structure
      // lines, symbolId, symbolType are not relevant for this specific preview context
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingSymbol ? 'Edit Custom Symbol' : 'Create Custom Symbol'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="symbolName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name*</label>
          <input type="text" id="symbolName" value={name} onChange={(e) => setName(e.target.value)} required
                 className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-neutral-700" />
        </div>
        <div>
          <label htmlFor="symbolAbbr" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Abbreviation*</label>
          <input type="text" id="symbolAbbr" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} required
                 className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-neutral-700" />
        </div>
        <div>
          <label htmlFor="symbolDisplayText" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Display Text (Symbol)*</label>
          <input type="text" id="symbolDisplayText" value={displayText} onChange={(e) => setDisplayText(e.target.value)} required maxLength={5}
                    placeholder='e.g., K, •, O, /, \\, ❖, 😊'
                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-neutral-700 font-mono" />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Enter the character(s) to display on the chart (1-5 recommended, can be Unicode/emoji). This is for custom symbols.</p>
        </div>
         <div className="my-4 p-2 border border-dashed border-neutral-400 dark:border-neutral-600 rounded flex flex-col items-center">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Preview (Custom Symbol):</p>
            <div style={{ width: 60, height: 60, backgroundColor: previewBgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StitchSymbolDisplay
                keyDef={previewKeyDef}
                // allStitchSymbols is not needed here as previewKeyDef uses 'text' type cell or is empty
                cellSize={60}
              />
            </div>
        </div>
        <div>
          <label htmlFor="symbolDesc" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</label>
          <input type="text" id="symbolDesc" value={description} onChange={(e) => setDescription(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-neutral-700" />
        </div>
        <div>
          <label htmlFor="symbolCat" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Category</label>
          <input type="text" id="symbolCat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Lace, Cable"
                 className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-neutral-700" />
        </div>
        <input type="hidden" value={id} readOnly />
        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{existingSymbol ? 'Save Changes' : 'Create Symbol'}</Button>
        </div>
      </form>
    </Modal>
  );
};
