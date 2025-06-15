
import React, { useMemo } from 'react';
import { Button } from './Button';
import { SettingsIcon, SunIcon, MoonIcon, UndoIcon, RedoIcon, TextToInstructionIcon, ExportJpgIcon, ZoomInIcon, ZoomOutIcon } from './Icon';
import { ZOOM_LEVELS_BASE } from '../constants';

interface HeaderProps {
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onOpenSettings: () => void;
  onOpenExportModal: () => void;
  onImport: () => void;
  onGenerateInstructions: () => void;
  currentZoom: number;
  onZoomChange: (newZoom: number) => void;
  chartRows: number;
  chartCols: number;
}

export const Header: React.FC<HeaderProps> = ({
  onUndo, canUndo, onRedo, canRedo,
  isDarkMode, toggleDarkMode,
  onOpenSettings, onOpenExportModal, onImport, onGenerateInstructions,
  currentZoom, onZoomChange,
  chartRows, chartCols,
}) => {

  const effectiveZoomLevels = useMemo(() => {
    if (chartRows >= 100 || chartCols >= 100) {
      return [0.25, ...ZOOM_LEVELS_BASE];
    }
    return ZOOM_LEVELS_BASE;
  }, [chartRows, chartCols]);

  const handleZoomIn = () => {
    const currentIndex = effectiveZoomLevels.indexOf(currentZoom);
    if (currentIndex < effectiveZoomLevels.length - 1) {
      onZoomChange(effectiveZoomLevels[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = effectiveZoomLevels.indexOf(currentZoom);
    if (currentIndex > 0) {
      onZoomChange(effectiveZoomLevels[currentIndex - 1]);
    }
  };

  return (
    <header className="bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 shadow-md p-2 md:p-3 flex items-center justify-between print:hidden flex-shrink-0">
      <div className="flex items-center sm:space-x-1 md:space-x-2">
        <h1
          className="text-xl md:text-2xl font-semibold text-neutral-700 dark:text-neutral-200 whitespace-nowrap"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Areum Knitlab
        </h1>
      </div>

      <div className="flex items-center sm:space-x-1 md:space-x-1.5">
        <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"><UndoIcon /></Button>
        <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"><RedoIcon /></Button>
        <div className="h-6 border-l border-neutral-300 dark:border-neutral-600 mx-0.5 sm:mx-1"></div>
        <Button variant="ghost" size="sm" onClick={onGenerateInstructions} title="Generate Written Instructions"><TextToInstructionIcon /></Button>
        <Button variant="ghost" size="sm" onClick={onOpenExportModal} title="Export to JPG"><ExportJpgIcon /></Button>
      </div>

      <div className="flex items-center sm:space-x-0.5 md:space-x-1">
        <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom Out" disabled={effectiveZoomLevels.indexOf(currentZoom) === 0}><ZoomOutIcon /></Button>
        <span className="text-sm w-10 text-center tabular-nums">{Math.round(currentZoom * 100)}%</span>
        <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom In" disabled={effectiveZoomLevels.indexOf(currentZoom) === effectiveZoomLevels.length - 1}><ZoomInIcon /></Button>
        <div className="h-6 border-l border-neutral-300 dark:border-neutral-600 mx-0.5 sm:mx-1"></div>
        <Button variant="ghost" size="sm" onClick={toggleDarkMode} title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenSettings} title="Sheet Settings"><SettingsIcon /></Button>
      </div>
    </header>
  );
};
