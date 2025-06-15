import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KeyDefinition, StitchSymbolDef, Line, Point, KeyCellContent } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { ColorPicker } from './ColorPicker';
import { StitchSymbolDisplay } from './StitchSymbolDisplay';
import { BrushIcon, TextWithUnderlineIcon, BrushWithUnderlineIcon, SearchIcon,
    XIcon as CloseIcon, ToggleOnIcon, ToggleOffIcon } from './Icon';
import {
  DEFAULT_STITCH_COLOR_LIGHT,
  DEFAULT_STITCH_COLOR_DARK,
  DEFAULT_CELL_COLOR_LIGHT,
  DEFAULT_CELL_COLOR_DARK,
  DEFAULT_STITCH_SYMBOLS,
  UNICODE_SYMBOLS_FOR_KEY_EDITOR,
  KEY_ID_EMPTY,
  generateNewKeyId,
  MAX_KEY_WIDTH,
  MAX_KEY_HEIGHT,
  TRANSPARENT_BACKGROUND_SENTINEL,
  GRID_LINE_COLOR_LIGHT,
  GRID_LINE_COLOR_DARK,
  THEME_DEFAULT_BACKGROUND_SENTINEL,
  THEME_DEFAULT_SYMBOL_COLOR_SENTINEL,
  ABBREVIATION_SKIP_SENTINEL,
  CIRCLED_DIGITS
} from '../constants';

interface KeyEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keyDef: KeyDefinition) => void;
  existingKey: KeyDefinition | null;
  allStitchSymbols: StitchSymbolDef[];
  isDarkMode: boolean;
  keyPalette: KeyDefinition[];
}

const createInitialCells = (rows: number, cols: number): (KeyCellContent | null)[][] => {
  return Array(rows).fill(null).map(() => Array(cols).fill(null));
};

const SNAP_DISTANCE_SVG_UNITS = 0.3;
const PREVIEW_CELL_SIZE = 32;
const GUTTER_CONTROLS_AREA_SIZE = 20;
const GUTTER_CONTROL_THICKNESS = 16;
const SNAP_POINT_VISUAL_RADIUS = 4;
const SNAP_POINT_HOVER_OPACITY = 0.8;
const SNAP_POINT_DEFAULT_OPACITY = 0.4;

interface PopoverProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

const Popover: React.FC<PopoverProps> = ({ anchorEl, isOpen, onClose, children, className, position = 'bottom-start' }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
          anchorEl && !anchorEl.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen || !anchorEl) return null;

  const anchorRect = anchorEl.getBoundingClientRect();
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1100,
  };

  switch (position) {
    case 'bottom-start':
      style.top = anchorRect.bottom + 4;
      style.left = anchorRect.left;
      break;
    case 'bottom-end':
      style.top = anchorRect.bottom + 4;
      style.right = window.innerWidth - anchorRect.right;
      break;
    case 'top-start':
        style.bottom = window.innerHeight - anchorRect.top + 4;
        style.left = anchorRect.left;
        break;
    case 'top-end':
        style.bottom = window.innerHeight - anchorRect.top + 4;
        style.right = window.innerWidth - anchorRect.right;
        break;
  }

  return (
    <div ref={popoverRef} style={style} className={`bg-neutral-50 dark:bg-neutral-800 shadow-xl rounded-md border border-neutral-300 dark:border-neutral-600 p-3 animate-fadeIn ${className}`}>
      {children}
    </div>
  );
};

export const KeyEditorModal: React.FC<KeyEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingKey,
  isDarkMode,
  keyPalette,
}) => {
  const [id, setId] = useState('');
  const [keyName, setKeyName] = useState('');
  const [editedAbbreviation, setEditedAbbreviation] = useState<string | null>(""); // Empty string for typed, null for placeholder to take over
  const [includeInPatternInstructions, setIncludeInPatternInstructions] = useState(true);

  const [editedWidth, setEditedWidth] = useState(1);
  const [editedHeight, setEditedHeight] = useState(1);
  const [editedBackgroundColor, setEditedBackgroundColor] = useState(isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT);
  const [editedSymbolColor, setEditedSymbolColor] = useState(isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT);

  const [editedCells, setEditedCells] = useState<(KeyCellContent | null)[][]>(createInitialCells(1,1));
  const [editedLines, setEditedLines] = useState<Line[]>([]);

  const [activeEditorMode, setActiveEditorMode] = useState<'cell' | 'line' | null>(null);
  const [activeSymbolContent, setActiveSymbolContent] = useState<{ type: 'svg' | 'text', value: string } | null>(null);
  const [currentLinePreview, setCurrentLinePreview] = useState<Line | null>(null);
  const [hoveredSnapPoint, setHoveredSnapPoint] = useState<Point | null>(null);

  const [uniqueNameError, setUniqueNameError] = useState<string | null>(null);
  const svgGridRef = useRef<SVGSVGElement>(null);

  const [showSymbolColorPicker, setShowSymbolColorPicker] = useState(false);
  const symbolColorButtonRef = useRef<HTMLButtonElement>(null);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const bgColorButtonRef = useRef<HTMLButtonElement>(null);
  const [showSymbolSelector, setShowSymbolSelector] = useState(false);
  const symbolSelectorButtonRef = useRef<HTMLButtonElement>(null);
  const [symbolSearchTerm, setSymbolSearchTerm] = useState('');

  const getDefaultCircledAbbreviation = useCallback((name: string): string => {
    const match = name.match(/^Custom Key (\d+)$/i);
    if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 0 && num < CIRCLED_DIGITS.length) {
            return CIRCLED_DIGITS[num];
        }
    }
    return ""; // Fallback to empty string if no circled digit applies or user clears it
  }, []);


  const resetToDefaultsOrExisting = useCallback(() => {
    setShowSymbolColorPicker(false);
    setShowBgColorPicker(false);
    setShowSymbolSelector(false);
    setSymbolSearchTerm('');
    setHoveredSnapPoint(null);
    setCurrentLinePreview(null);
    setActiveSymbolContent(null);
    setUniqueNameError(null);

    if (existingKey) {
      setId(existingKey.id);
      setKeyName(existingKey.name);
      setEditedWidth(existingKey.width);
      setEditedHeight(existingKey.height);
      setEditedBackgroundColor(existingKey.backgroundColor);
      setEditedSymbolColor(existingKey.symbolColor);
      setEditedLines(existingKey.lines || []);

      const isIncluded = existingKey.id === KEY_ID_EMPTY ? false : existingKey.abbreviation !== ABBREVIATION_SKIP_SENTINEL;
      setIncludeInPatternInstructions(isIncluded);
      setEditedAbbreviation(isIncluded ? (existingKey.abbreviation || "") : ABBREVIATION_SKIP_SENTINEL);

      const newCells = createInitialCells(existingKey.height, existingKey.width);
      if (existingKey.cells && (!existingKey.lines || existingKey.lines.length === 0)) {
        for(let r=0; r < existingKey.height; r++) {
            for(let c=0; c < existingKey.width; c++) {
                newCells[r][c] = existingKey.cells[r]?.[c] || null;
            }
        }
        setActiveEditorMode('cell');
      } else {
        setActiveEditorMode(existingKey.lines && existingKey.lines.length > 0 ? 'line' : 'cell');
      }
      setEditedCells(newCells);
    } else {
      const newId = generateNewKeyId();
      setId(newId);
      let newNameBase = "Custom Key";
      let newNameCounter = 1;
      let potentialName = `${newNameBase} ${newNameCounter}`;
      while(keyPalette.some(k => k.name === potentialName && k.id !== newId)) {
        newNameCounter++;
        potentialName = `${newNameBase} ${newNameCounter}`;
      }
      setKeyName(potentialName);

      setIncludeInPatternInstructions(true);
      setEditedAbbreviation(getDefaultCircledAbbreviation(potentialName));

      const initialW = 1; const initialH = 1;
      setEditedWidth(initialW); setEditedHeight(initialH);
      setEditedBackgroundColor(isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT);
      setEditedSymbolColor(isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT);

      setActiveEditorMode('line');
      setEditedCells(createInitialCells(initialW, initialH));
      setEditedLines([]);
    }
  }, [existingKey, isDarkMode, keyPalette, isOpen, getDefaultCircledAbbreviation]);


  useEffect(() => {
    if (isOpen) {
      resetToDefaultsOrExisting();
    }
  }, [isOpen, resetToDefaultsOrExisting]);

  useEffect(() => {
    if (!isOpen) return;
    const newCellsArray = createInitialCells(editedHeight, editedWidth);
    if (activeEditorMode === 'cell') {
        const oldCells = editedCells;
        for (let r = 0; r < Math.min(editedHeight, oldCells.length); r++) {
            for (let c = 0; c < Math.min(editedWidth, oldCells[r]?.length || 0); c++) {
                newCellsArray[r][c] = oldCells[r][c];
            }
        }
    }
    setEditedCells(newCellsArray);

    if (activeEditorMode !== 'line' && editedLines.length > 0) {
      setEditedLines([]);
    }
  }, [editedWidth, editedHeight, isOpen, activeEditorMode]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setKeyName(newName);
    if (newName.trim() && keyPalette.some(k => k.name.toLowerCase() === newName.trim().toLowerCase() && k.id !== id)) {
      setUniqueNameError("A key with this name already exists.");
    } else {
      setUniqueNameError(null);
    }
     // If new key and abbreviation is the default circled one based on old name, update it
     if (!existingKey && editedAbbreviation && CIRCLED_DIGITS.includes(editedAbbreviation)) {
        setEditedAbbreviation(getDefaultCircledAbbreviation(newName));
    }
  };

  const handleIncludeInPatternInstructionsToggle = () => {
    const newIncludeState = !includeInPatternInstructions;
    setIncludeInPatternInstructions(newIncludeState);
    if (newIncludeState) { // Toggling ON
        // If it was sentinel, make it empty string to show keyName as placeholder, or default circled if applicable
        if (editedAbbreviation === ABBREVIATION_SKIP_SENTINEL) {
            if (!existingKey) { // New key
                setEditedAbbreviation(getDefaultCircledAbbreviation(keyName));
            } else { // Existing key that was skipped
                 setEditedAbbreviation(""); // Let placeholder (keyName) show
            }
        }
    } else { // Toggling OFF
        setEditedAbbreviation(ABBREVIATION_SKIP_SENTINEL);
    }
  };

  const handlePreviewCellClick = (r: number, c: number) => {
    if (activeEditorMode === 'line') return;
    if (editedLines.length > 0) setEditedLines([]);

    const newCells = editedCells.map(row => [...row]);
    newCells[r][c] = activeSymbolContent ? { ...activeSymbolContent } : null;
    setEditedCells(newCells);
  };

  const handleModeToggle = (mode: 'cell' | 'line') => {
    setActiveEditorMode(mode);
    if (mode === 'line') {
        setEditedCells(createInitialCells(editedHeight, editedWidth));
        setActiveSymbolContent(null);
        setShowSymbolSelector(false);
    } else {
        setEditedLines([]);
        setCurrentLinePreview(null);
    }
  };

  const getSnapPoints = useCallback((): Point[] => {
    const points: Point[] = [];
    for (let r = 0; r <= editedHeight; r++) {
      for (let c = 0; c <= editedWidth; c++) {
        points.push({ x: c , y: r });
        if (c < editedWidth) points.push({ x: c + 0.5, y: r });
        if (r < editedHeight) points.push({ x: c, y: r + 0.5 });
        if (c < editedWidth && r < editedHeight) points.push({ x: c + 0.5, y: r + 0.5 });
      }
    }
    return points;
  }, [editedWidth, editedHeight]);

  const getMousePositionInSVG = (event: React.MouseEvent): Point | null => {
    if (!svgGridRef.current) return null;
    const svgRect = svgGridRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - svgRect.left) / PREVIEW_CELL_SIZE,
      y: (event.clientY - svgRect.top) / PREVIEW_CELL_SIZE,
    };
  };

  const findNearestSnapPoint = (mousePos: Point): Point | null => {
    const snapPoints = getSnapPoints();
    let nearestPoint: Point | null = null;
    let minDistanceSq = SNAP_DISTANCE_SVG_UNITS * SNAP_DISTANCE_SVG_UNITS;
    for (const p of snapPoints) {
      const distSq = (p.x - mousePos.x) ** 2 + (p.y - mousePos.y) ** 2;
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        nearestPoint = p;
      }
    }
    return nearestPoint;
  };

  const handleSVGMouseDown = (event: React.MouseEvent) => {
    if (activeEditorMode !== 'line' || event.button !== 0) return;
    const mousePos = getMousePositionInSVG(event);
    if (!mousePos) return;
    const startPoint = findNearestSnapPoint(mousePos);
    if (startPoint) {
      if (editedCells.flat().some(c => c !== null)) {
        setEditedCells(createInitialCells(editedHeight, editedWidth));
      }
      setActiveSymbolContent(null);
      setShowSymbolSelector(false);
      setCurrentLinePreview({ start: startPoint, end: startPoint });
    }
  };

  const handleSVGMouseMove = (event: React.MouseEvent) => {
    if (activeEditorMode !== 'line') { setHoveredSnapPoint(null); return; }
    const mousePos = getMousePositionInSVG(event);
    if (!mousePos) { setHoveredSnapPoint(null); return; }
    setHoveredSnapPoint(findNearestSnapPoint(mousePos));

    if (!currentLinePreview) return;
    const endPoint = findNearestSnapPoint(mousePos) || mousePos;
    setCurrentLinePreview({ ...currentLinePreview, end: endPoint });
  };

  const handleSVGMouseLeave = () => {
    if (currentLinePreview) {
        if (hoveredSnapPoint) {
            if (currentLinePreview.start.x !== hoveredSnapPoint.x || currentLinePreview.start.y !== hoveredSnapPoint.y) {
                setEditedLines(prevLines => [...prevLines, { start: currentLinePreview.start, end: hoveredSnapPoint }]);
            }
        }
        setCurrentLinePreview(null);
    }
    setHoveredSnapPoint(null);
  };

  const handleSVGMouseUp = (event: React.MouseEvent) => {
    if (activeEditorMode !== 'line' || !currentLinePreview || event.button !== 0) return;
    const mousePos = getMousePositionInSVG(event);
     if (!mousePos) { setCurrentLinePreview(null); return; }
    const endPoint = findNearestSnapPoint(mousePos);
    if (endPoint && (currentLinePreview.start.x !== endPoint.x || currentLinePreview.start.y !== endPoint.y)) {
      setEditedLines(prevLines => [...prevLines, { start: currentLinePreview.start, end: endPoint }]);
    }
    setCurrentLinePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalKeyName = keyName.trim();
    if (!finalKeyName) { alert("Key name cannot be empty."); return; }
    if (uniqueNameError) { alert(uniqueNameError); return; }

    let finalAbbreviation: string | null | undefined = editedAbbreviation;
    if (id === KEY_ID_EMPTY) {
        finalAbbreviation = ABBREVIATION_SKIP_SENTINEL;
    } else if (!includeInPatternInstructions) {
        finalAbbreviation = ABBREVIATION_SKIP_SENTINEL;
    } else {
        // If include is ON, use editedAbbreviation. If it's empty string, it's intentional.
        // If it's null (should not happen if UI logic is correct, but defensively), treat as empty.
        finalAbbreviation = editedAbbreviation === null ? "" : editedAbbreviation;
    }

    const keyDefToSave: KeyDefinition = {
      id,
      name: finalKeyName,
      abbreviation: finalAbbreviation,
      width: editedWidth,
      height: editedHeight,
      backgroundColor: editedBackgroundColor,
      symbolColor: editedSymbolColor,
      lines: editedLines.length > 0 ? editedLines : undefined,
      cells: editedLines.length > 0 ? undefined : editedCells.map(row => row.map(cell => cell ? {...cell} : null)),
    };
    onSave(keyDefToSave);
    onClose();
  };

  const renderGutterControl = (
    type: 'inc' | 'dec',
    dimension: 'width' | 'height',
    position: 'top' | 'bottom' | 'left' | 'right'
  ) => {
    const isInc = type === 'inc';
    const currentDimVal = dimension === 'width' ? editedWidth : editedHeight;
    const maxDimVal = dimension === 'width' ? MAX_KEY_WIDTH : MAX_KEY_HEIGHT;
    const isDisabled = (isInc ? currentDimVal >= maxDimVal : currentDimVal <= 1);

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: 'background-color 0.15s ease-out, border-color 0.15s ease-out',
      zIndex: 10,
    };

    let controlStyle: React.CSSProperties = { ...baseStyle };
    let textContent = isInc ? '+' : '-';

    if (dimension === 'height') {
      controlStyle.width = `${editedWidth * PREVIEW_CELL_SIZE}px`;
      controlStyle.height = `${GUTTER_CONTROL_THICKNESS}px`;
      controlStyle.left = `${GUTTER_CONTROLS_AREA_SIZE}px`;
      if (position === 'top') {
        controlStyle.top = `${GUTTER_CONTROLS_AREA_SIZE - GUTTER_CONTROL_THICKNESS}px`;
      } else {
        controlStyle.bottom = `${GUTTER_CONTROLS_AREA_SIZE - GUTTER_CONTROL_THICKNESS}px`;
      }
    } else {
      controlStyle.height = `${editedHeight * PREVIEW_CELL_SIZE}px`;
      controlStyle.width = `${GUTTER_CONTROL_THICKNESS}px`;
      controlStyle.top = `${GUTTER_CONTROLS_AREA_SIZE}px`;
      if (position === 'left') {
        controlStyle.left = `${GUTTER_CONTROLS_AREA_SIZE - GUTTER_CONTROL_THICKNESS}px`;
      } else {
        controlStyle.right = `${GUTTER_CONTROLS_AREA_SIZE - GUTTER_CONTROL_THICKNESS}px`;
      }
    }

    let buttonClasses = "text-xs font-medium ";
    if (isInc) {
      buttonClasses += isDisabled
        ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500"
        : "bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-neutral-700 dark:text-neutral-200";
    } else {
      buttonClasses += isDisabled
        ? "border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 border-2 border-dotted"
        : "border-neutral-400 hover:border-neutral-500 dark:border-neutral-500 dark:hover:border-neutral-400 text-neutral-600 dark:text-neutral-300 border-2 border-dotted hover:bg-neutral-200/30 dark:hover:bg-neutral-700/30";
    }

    return (
        <button
            type="button"
            style={controlStyle}
            className={buttonClasses}
            onClick={() => {
            if (dimension === 'width') setEditedWidth(w => isInc ? Math.min(MAX_KEY_WIDTH, w + 1) : Math.max(1, w - 1));
            else setEditedHeight(h => isInc ? Math.min(MAX_KEY_HEIGHT, h + 1) : Math.max(1, h - 1));
            }}
            disabled={isDisabled}
            aria-label={`${isInc ? 'Increase' : 'Decrease'} ${dimension}`}
        >
            {textContent}
        </button>
    );
  };

  const combinedSymbolListBase = [
    ...DEFAULT_STITCH_SYMBOLS.filter(s => s.id !== KEY_ID_EMPTY).map(s => ({ type: 'svg' as 'svg' | 'text', value: s.id, name: s.name, category: 'SVG Symbols' })),
    ...UNICODE_SYMBOLS_FOR_KEY_EDITOR.map(u => ({ type: 'text' as 'svg' | 'text', value: u.value, name: u.name, category: 'Unicode Symbols' }))
  ];

  let filteredSymbols = combinedSymbolListBase.filter(symbol => {
    if (!symbolSearchTerm) return true;
    const term = symbolSearchTerm.toLowerCase();
    const nameMatch = symbol.name.toLowerCase().includes(term);
    const valueMatch = symbol.value.toLowerCase().includes(term);
    return nameMatch || valueMatch;
  });

  if (symbolSearchTerm.trim()) {
    const customCharValue = symbolSearchTerm.trim().charAt(0);
    const customCharEntry = {
        type: 'text' as 'text',
        value: customCharValue,
        name: `Use character: "${customCharValue}"`,
        category: 'Custom Input'
    };
    filteredSymbols = filteredSymbols.filter(s => !(s.type === 'text' && s.value === customCharValue));
    filteredSymbols.unshift(customCharEntry);
  }

  let actualPreviewBackgroundColor: string;
  if (editedBackgroundColor === TRANSPARENT_BACKGROUND_SENTINEL) {
    actualPreviewBackgroundColor = isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;
  } else if (editedBackgroundColor === THEME_DEFAULT_BACKGROUND_SENTINEL) {
    actualPreviewBackgroundColor = isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT;
  } else {
    actualPreviewBackgroundColor = editedBackgroundColor;
  }

  const getColorPickerInitialValue = (colorValue: string) => {
    if (colorValue === THEME_DEFAULT_BACKGROUND_SENTINEL) return isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT;
    if (colorValue === TRANSPARENT_BACKGROUND_SENTINEL) return isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT;
    if (colorValue === THEME_DEFAULT_SYMBOL_COLOR_SENTINEL) return isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT;
    return colorValue;
  };

  const isAbbreviationInputDisabled = !includeInPatternInstructions || id === KEY_ID_EMPTY;
  let abbreviationPlaceholderText = keyName || "Abbr.";
  if (id === KEY_ID_EMPTY) {
    abbreviationPlaceholderText = "N/A";
  } else if (!includeInPatternInstructions) {
    abbreviationPlaceholderText = "? Abbreviation used in pattern instructions";
  }

  const DefaultColorSwatchButton: React.FC<{
    color: string;
    title: string;
    onClick: () => void;
  }> = ({ color, title, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-start space-x-2 p-1 text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
      title={title}
    >
      <div
        className="w-5 h-5 rounded border border-neutral-400 dark:border-neutral-500 flex-shrink-0"
        style={{ backgroundColor: color }}
      ></div>
      <span className="truncate">{title}</span>
    </button>
  );

  return (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
            <input
                type="text" value={keyName} onChange={handleNameChange}
                placeholder="Key Name"
                className="text-xl font-semibold bg-white dark:bg-neutral-700 focus:ring-1 focus:ring-primary rounded px-2 py-1 outline-none w-full text-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600"
            />
        }
        size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3 max-h-[75vh] flex flex-col">
        {uniqueNameError && <p className="text-sm text-red-500 dark:text-red-400 flex-shrink-0">{uniqueNameError}</p>}

        <div className="flex-shrink-0">
          <label htmlFor="keyAbbreviation" className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-0.5">Abbreviation (for Pattern Instructions)</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="keyAbbreviation"
              value={editedAbbreviation === ABBREVIATION_SKIP_SENTINEL ? "" : (editedAbbreviation || "")}
              onChange={(e) => setEditedAbbreviation(e.target.value)}
              placeholder={abbreviationPlaceholderText}
              disabled={isAbbreviationInputDisabled}
              maxLength={10}
              className="flex-grow px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-neutral-700 disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-500"
            />
            {id !== KEY_ID_EMPTY && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleIncludeInPatternInstructionsToggle}
                title={includeInPatternInstructions ? "Exclude this key from pattern instructions" : "Include this key in pattern instructions"}
                className="p-1.5"
              >
                {includeInPatternInstructions ? <ToggleOnIcon /> : <ToggleOffIcon />}
                <span className="ml-1 text-xs whitespace-nowrap">
                  {includeInPatternInstructions ? "Include: ON" : "Include: OFF"}
                </span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 p-1.5 border rounded-md bg-neutral-100 dark:bg-neutral-800/80 flex-shrink-0 relative">
            <Button type="button" onClick={() => handleModeToggle('line')} variant={activeEditorMode === 'line' ? "primary" : "ghost"} title="Draw Lines Mode">
                <BrushIcon />
            </Button>
            <Button type="button" ref={symbolSelectorButtonRef} onClick={() => { handleModeToggle('cell'); setShowSymbolSelector(s => !s);}} variant={activeEditorMode === 'cell' ? "primary" : "ghost"} title="Select Symbol/Text Mode">
                <SearchIcon />
            </Button>
            <div className="h-6 border-l border-neutral-300 dark:border-neutral-600 mx-1"></div>
            <Button type="button" ref={symbolColorButtonRef} onClick={() => setShowSymbolColorPicker(s => !s)} variant="ghost" title="Symbol/Line Color">
                <TextWithUnderlineIcon />
            </Button>
            <Button type="button" ref={bgColorButtonRef} onClick={() => setShowBgColorPicker(s => !s)} variant="ghost" title="Background Color">
                <BrushWithUnderlineIcon />
            </Button>

            <Popover anchorEl={symbolColorButtonRef.current} isOpen={showSymbolColorPicker} onClose={() => setShowSymbolColorPicker(false)}>
              <div className="space-y-2 w-56">
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 px-1">Symbol Color</p>
                <ColorPicker initialColor={getColorPickerInitialValue(editedSymbolColor)} onChange={(color) => { setEditedSymbolColor(color); }} />
                <DefaultColorSwatchButton
                    color={isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT}
                    title="Theme Default Symbol"
                    onClick={() => {
                        setEditedSymbolColor(THEME_DEFAULT_SYMBOL_COLOR_SENTINEL);
                        setShowSymbolColorPicker(false);
                    }}
                />
              </div>
            </Popover>
            <Popover anchorEl={bgColorButtonRef.current} isOpen={showBgColorPicker} onClose={() => setShowBgColorPicker(false)}>
              <div className="space-y-2 w-56">
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 px-1">Background Color</p>
                <ColorPicker
                    initialColor={getColorPickerInitialValue(editedBackgroundColor)}
                    onChange={(color) => { setEditedBackgroundColor(color); }}
                />
                <DefaultColorSwatchButton
                    color={isDarkMode ? DEFAULT_CELL_COLOR_DARK : DEFAULT_CELL_COLOR_LIGHT}
                    title="Theme Default Background"
                    onClick={() => {
                        setEditedBackgroundColor(THEME_DEFAULT_BACKGROUND_SENTINEL);
                        setShowBgColorPicker(false);
                    }}
                />
                <DefaultColorSwatchButton
                    color={isDarkMode ? GRID_LINE_COLOR_DARK : GRID_LINE_COLOR_LIGHT}
                    title="Grid Lines Background"
                    onClick={() => {
                        setEditedBackgroundColor(TRANSPARENT_BACKGROUND_SENTINEL);
                        setShowBgColorPicker(false);
                    }}
                 />
              </div>
            </Popover>

            <Popover anchorEl={symbolSelectorButtonRef.current} isOpen={showSymbolSelector && activeEditorMode === 'cell'} onClose={() => setShowSymbolSelector(false)} className="w-80 min-h-[200px] max-h-[300px] flex flex-col">
                <div className="p-1 flex items-center border-b border-neutral-300 dark:border-neutral-600 mb-2">
                    <SearchIcon className="text-neutral-500 mr-2" size={18}/>
                    <input
                        type="text"
                        placeholder="Search symbols or type a character..."
                        value={symbolSearchTerm}
                        onChange={(e) => setSymbolSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-sm outline-none py-1"
                    />
                    {symbolSearchTerm && <Button variant="ghost" size="sm" onClick={()=>setSymbolSearchTerm('')} className="p-1"><CloseIcon size={16}/></Button>}
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(32px,1fr))] gap-1">
                        {filteredSymbols.map(symbol => {
                            const symbolKeyDef: KeyDefinition = {
                                id: `picker-${symbol.type}-${symbol.value}-${symbol.name}`,
                                name: symbol.name, width: 1, height: 1,
                                backgroundColor: 'transparent',
                                symbolColor: editedSymbolColor,
                                cells: [[{ type: symbol.type, value: symbol.value }]]
                            };
                            return (
                            <button
                                key={`symbol-picker-${symbol.type}-${symbol.value}-${symbol.name}`}
                                type="button"
                                title={symbol.name}
                                onClick={() => {
                                    setActiveSymbolContent({ type: symbol.type, value: symbol.value });
                                    setShowSymbolSelector(false);
                                }}
                                className={`aspect-square flex items-center justify-center rounded border hover:bg-primary/10 dark:hover:bg-primary-dark/20 transition-colors
                                            ${activeSymbolContent?.type === symbol.type && activeSymbolContent?.value === symbol.value
                                                ? 'border-primary ring-1 ring-primary'
                                                : 'border-neutral-300 dark:border-neutral-600'}`}
                            >
                                <StitchSymbolDisplay keyDef={symbolKeyDef} cellSize={26} isDarkMode={isDarkMode} />
                            </button>
                            );
                        })}
                         {filteredSymbols.length === 0 && <p className="col-span-full text-center text-sm text-neutral-500 p-2">No symbols found.</p>}
                    </div>
                </div>
            </Popover>
        </div>

        {/* Draw Line Mode */}
        {/* [TODO] add margin/padding in the individual cell and add guide lines after adding cells */}
        <div className="flex-grow flex items-center justify-center p-2 overflow-auto custom-scrollbar min-h-[200px]">
           {activeEditorMode === null ? (
                <div className="text-center text-neutral-500 dark:text-neutral-400 p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg">
                    <p className="text-lg font-medium">Choose an editing mode</p>
                    <p className="text-sm">Select Line Mode or Symbol Mode above to begin editing the key.</p>
                </div>
            ) : (
                <div className="relative" style={{
                    paddingTop: GUTTER_CONTROLS_AREA_SIZE, paddingBottom: GUTTER_CONTROLS_AREA_SIZE,
                    paddingLeft: GUTTER_CONTROLS_AREA_SIZE, paddingRight: GUTTER_CONTROLS_AREA_SIZE
                }}>
                    {renderGutterControl('dec', 'height', 'top')}
                    {renderGutterControl('inc', 'height', 'bottom')}
                    {renderGutterControl('dec', 'width', 'left')}
                    {renderGutterControl('inc', 'width', 'right')}

                    <div
                        className="grid border border-neutral-400 dark:border-neutral-500 overflow-hidden relative select-none shadow-md"
                        style={{
                            gridTemplateColumns: `repeat(${editedWidth}, ${PREVIEW_CELL_SIZE}px)`,
                            gridTemplateRows: `repeat(${editedHeight}, ${PREVIEW_CELL_SIZE}px)`,
                            width: editedWidth * PREVIEW_CELL_SIZE,
                            height: editedHeight * PREVIEW_CELL_SIZE,
                            minWidth: PREVIEW_CELL_SIZE, minHeight: PREVIEW_CELL_SIZE,
                            backgroundColor: actualPreviewBackgroundColor,
                            boxSizing: 'content-box'
                        }}
                    >
                        {activeEditorMode === 'cell' && editedCells.map((row, rIdx) =>
                            row.map((cellContent, cIdx) => {
                                const cellKeyDef: KeyDefinition | null = cellContent ? {
                                    id: `cell-preview-${rIdx}-${cIdx}`, name: '',
                                    width: 1, height: 1,
                                    backgroundColor: 'transparent',
                                    symbolColor: editedSymbolColor,
                                    cells: [[cellContent]]
                                } : null;

                                return (
                                    <div
                                        key={`preview-cell-${rIdx}-${cIdx}`}
                                        onClick={() => handlePreviewCellClick(rIdx, cIdx)}
                                        className="w-full h-full flex items-center justify-center border border-neutral-300/20 dark:border-neutral-600/20"
                                        style={{
                                            cursor: 'pointer',
                                            pointerEvents: 'auto'
                                        }}
                                        role="button"
                                        aria-label={`Cell row ${rIdx+1} column ${cIdx+1}.`}
                                    >
                                        {cellKeyDef && <StitchSymbolDisplay keyDef={cellKeyDef} cellSize={PREVIEW_CELL_SIZE * 0.85} isDarkMode={isDarkMode} />}
                                    </div>
                                );
                            })
                        )}

                        <svg
                            ref={svgGridRef}
                            width={editedWidth * PREVIEW_CELL_SIZE}
                            height={editedHeight * PREVIEW_CELL_SIZE}
                            viewBox={`0 0 ${editedWidth * PREVIEW_CELL_SIZE} ${editedHeight * PREVIEW_CELL_SIZE}`}
                            className="absolute inset-0"
                            style={{ pointerEvents: activeEditorMode === 'line' ? 'auto' : 'none', cursor: activeEditorMode === 'line' ? 'crosshair' : 'default' }}
                            onMouseDown={handleSVGMouseDown}
                            onMouseMove={handleSVGMouseMove}
                            onMouseUp={handleSVGMouseUp}
                            onMouseLeave={handleSVGMouseLeave}
                        >
                            {editedLines.map((line, index) => (
                                <line
                                    key={`line-${index}`}
                                    x1={line.start.x * PREVIEW_CELL_SIZE} y1={line.start.y * PREVIEW_CELL_SIZE}
                                    x2={line.end.x * PREVIEW_CELL_SIZE} y2={line.end.y * PREVIEW_CELL_SIZE}
                                    stroke={editedSymbolColor === THEME_DEFAULT_SYMBOL_COLOR_SENTINEL ? (isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT) : editedSymbolColor}
                                    strokeWidth={Math.max(1.5, PREVIEW_CELL_SIZE * 0.06)} strokeLinecap="round"
                                />
                            ))}
                            {currentLinePreview && (
                                <line
                                    x1={currentLinePreview.start.x * PREVIEW_CELL_SIZE} y1={currentLinePreview.start.y * PREVIEW_CELL_SIZE}
                                    x2={currentLinePreview.end.x * PREVIEW_CELL_SIZE} y2={currentLinePreview.end.y * PREVIEW_CELL_SIZE}
                                    stroke={editedSymbolColor === THEME_DEFAULT_SYMBOL_COLOR_SENTINEL ? (isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT) : editedSymbolColor}
                                    strokeWidth={Math.max(1.5, PREVIEW_CELL_SIZE * 0.06)} strokeLinecap="round" strokeDasharray="3 2"
                                />
                            )}
                            {activeEditorMode === 'line' && getSnapPoints().map((p, i) => (
                                <circle
                                  key={`snap-${i}`}
                                  cx={p.x * PREVIEW_CELL_SIZE}
                                  cy={p.y * PREVIEW_CELL_SIZE}
                                  r={SNAP_POINT_VISUAL_RADIUS}
                                  fill={editedSymbolColor === THEME_DEFAULT_SYMBOL_COLOR_SENTINEL ? (isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT) : editedSymbolColor}
                                  opacity={hoveredSnapPoint && hoveredSnapPoint.x === p.x && hoveredSnapPoint.y === p.y ? SNAP_POINT_HOVER_OPACITY : SNAP_POINT_DEFAULT_OPACITY}
                                  className="transition-opacity duration-100"
                                />
                            ))}
                        </svg>
                    </div>
                </div>
            )}
        </div>

        <div className="pt-4 flex justify-end space-x-2 flex-shrink-0">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{existingKey ? 'Save Changes' : 'Create Key'}</Button>
        </div>
      </form>
    </Modal>
  );
};
