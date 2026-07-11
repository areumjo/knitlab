import React, { useMemo, useRef } from 'react';
import { Button } from './Button';
import {
  DownloadIcon,
  ExportJpgIcon,
  ImportImageIcon,
  MoonIcon,
  PlusIcon,
  RedoIcon,
  SettingsIcon,
  SunIcon,
  UndoIcon,
  UploadIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from './Icon';
import { ZOOM_LEVELS_BASE } from '../constants';

interface HeaderProps {
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  onNew: () => void;
  onOpenProject: (contents: string) => void;
  onSaveProject: () => void;
  onOpenExport: () => void;
  onImportImage: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onOpenSettings: () => void;
  currentZoom: number;
  onZoomChange: (newZoom: number) => void;
  chartRows: number;
  chartCols: number;
}

export const Header: React.FC<HeaderProps> = ({
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  onNew,
  onOpenProject,
  onSaveProject,
  onOpenExport,
  onImportImage,
  isDarkMode,
  toggleDarkMode,
  onOpenSettings,
  currentZoom,
  onZoomChange,
  chartRows,
  chartCols,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const effectiveZoomLevels = useMemo(() => (
    chartRows >= 100 || chartCols >= 100 ? [0.25, ...ZOOM_LEVELS_BASE] : ZOOM_LEVELS_BASE
  ), [chartRows, chartCols]);

  const zoom = (direction: -1 | 1) => {
    const currentIndex = effectiveZoomLevels.indexOf(currentZoom);
    const next = effectiveZoomLevels[currentIndex + direction];
    if (next !== undefined) onZoomChange(next);
  };

  const openFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onOpenProject(reader.result);
    };
    reader.readAsText(file);
  };

  const iconButton = 'h-9 w-9 p-2 flex-shrink-0';
  return (
    <header className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 print:hidden">
      <h1 className="order-1 whitespace-nowrap text-xl font-semibold text-neutral-800 dark:text-neutral-100">
        KnitLab Chart
      </h1>

      <div className="order-3 flex w-full min-w-0 items-center justify-center gap-1 overflow-x-auto border-t border-neutral-200 pt-1 dark:border-neutral-700 md:order-2 md:w-auto md:flex-1 md:border-0 md:pt-0" aria-label="Chart commands">
        <Button variant="ghost" size="sm" className={iconButton} onClick={onNew} title="New chart" aria-label="New chart"><PlusIcon /></Button>
        <Button variant="ghost" size="sm" className={iconButton} onClick={() => fileInputRef.current?.click()} title="Open .knitlab file" aria-label="Open chart"><UploadIcon /></Button>
        <input ref={fileInputRef} type="file" accept=".knitlab,.json" className="hidden" onChange={openFile} />
        <Button variant="ghost" size="sm" className={iconButton} onClick={onSaveProject} title="Save .knitlab file" aria-label="Save chart"><DownloadIcon /></Button>
        <div className="mx-1 h-6 border-l border-neutral-300 dark:border-neutral-600" />
        <Button variant="ghost" size="sm" className={iconButton} onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><UndoIcon /></Button>
        <Button variant="ghost" size="sm" className={iconButton} onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" aria-label="Redo"><RedoIcon /></Button>
        <div className="mx-1 h-6 border-l border-neutral-300 dark:border-neutral-600" />
        <Button variant="ghost" size="sm" className={iconButton} onClick={onImportImage} title="Import image" aria-label="Import image"><ImportImageIcon /></Button>
        <Button variant="ghost" size="sm" className={iconButton} onClick={onOpenExport} title="Export colorwork" aria-label="Export colorwork"><ExportJpgIcon /></Button>
      </div>

      <div className="order-2 ml-auto flex flex-shrink-0 items-center gap-1 md:order-3">
        <Button variant="ghost" size="sm" className={iconButton} onClick={() => zoom(-1)} title="Zoom out" aria-label="Zoom out" disabled={effectiveZoomLevels.indexOf(currentZoom) === 0}><ZoomOutIcon /></Button>
        <span className="w-11 text-center text-sm tabular-nums">{Math.round(currentZoom * 100)}%</span>
        <Button variant="ghost" size="sm" className={iconButton} onClick={() => zoom(1)} title="Zoom in" aria-label="Zoom in" disabled={effectiveZoomLevels.indexOf(currentZoom) === effectiveZoomLevels.length - 1}><ZoomInIcon /></Button>
        <Button variant="ghost" size="sm" className={iconButton} onClick={toggleDarkMode} title={isDarkMode ? 'Use light theme' : 'Use dark theme'} aria-label={isDarkMode ? 'Use light theme' : 'Use dark theme'}>
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </Button>
        <Button variant="ghost" size="sm" className={iconButton} onClick={onOpenSettings} title="Chart size and numbering" aria-label="Chart settings"><SettingsIcon /></Button>
      </div>
    </header>
  );
};
