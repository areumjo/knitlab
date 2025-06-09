import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ChartState, KeyDefinition, StitchSymbolDef } from '../types';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartState: ChartState;
  keyPalette: KeyDefinition[];
  allSymbols: StitchSymbolDef[];
  isDarkMode: boolean;
  initialZoom: number;
  generateChartJpeg: (
    chartState: ChartState,
    keyPalette: KeyDefinition[],
    allSymbols: StitchSymbolDef[],
    isDarkMode: boolean,
    exportZoom: number,
    includeCopyright: boolean
  ) => Promise<string | null>;
  effectiveZoomLevels: number[];
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  chartState,
  keyPalette,
  allSymbols,
  isDarkMode,
  initialZoom,
  generateChartJpeg,
  effectiveZoomLevels,
}) => {
  const [exportZoom, setExportZoom] = useState(initialZoom);
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setExportZoom(initialZoom); // Reset zoom on open
      setPreviewImageSrc(null); // Clear previous preview
      setError(null);
    }
  }, [isOpen, initialZoom]);

  const handleGeneratePreview = useCallback(async () => {
    setIsLoadingPreview(true);
    setPreviewImageSrc(null);
    setError(null);
    try {
      const dataUrl = await generateChartJpeg(
        chartState,
        keyPalette,
        allSymbols,
        isDarkMode,
        exportZoom,
        true // Include copyright
      );
      if (dataUrl) {
        setPreviewImageSrc(dataUrl);
      } else {
        setError('Failed to generate preview. The image might be too large or an unexpected error occurred.');
      }
    } catch (err) {
      console.error('Error generating JPG preview:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error during preview generation.'}`);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [chartState, keyPalette, allSymbols, isDarkMode, exportZoom, generateChartJpeg]);

  // Auto-generate preview when modal opens or zoom changes
  useEffect(() => {
    if (isOpen) {
        handleGeneratePreview();
    }
  }, [isOpen, exportZoom, handleGeneratePreview]);


  const handleDownload = () => {
    if (!previewImageSrc) return;
    const link = document.createElement('a');
    link.href = previewImageSrc;
    const safeSheetName = chartState.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'chart';
    link.download = `${safeSheetName}_export_${Math.round(exportZoom*100)}pct.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export to JPG Preview" size="xl">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <label htmlFor="exportZoomLevel" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Export Zoom:
          </label>
          <select
            id="exportZoomLevel"
            value={exportZoom}
            onChange={(e) => setExportZoom(parseFloat(e.target.value))}
            className="block w-auto pl-3 pr-8 py-1.5 text-sm border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-primary focus:border-primary rounded-md bg-white dark:bg-neutral-700"
            disabled={isLoadingPreview}
          >
            {effectiveZoomLevels.map(level => (
              <option key={level} value={level}>{Math.round(level * 100)}%</option>
            ))}
          </select>
        </div>

        {isLoadingPreview && (
          <div className="flex justify-center items-center h-64 bg-neutral-100 dark:bg-neutral-700 rounded-md">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-2 text-sm text-neutral-600 dark:text-neutral-300">Generating Preview...</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-md text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {!isLoadingPreview && previewImageSrc && (
          <div className="border border-neutral-300 dark:border-neutral-600 rounded-md overflow-auto max-h-[60vh] bg-neutral-200 dark:bg-neutral-800 p-2">
            <img src={previewImageSrc} alt="Chart Export Preview" className="max-w-full max-h-full mx-auto" />
          </div>
        )}
         {!isLoadingPreview && !previewImageSrc && !error && (
             <div className="flex justify-center items-center h-64 bg-neutral-100 dark:bg-neutral-700 rounded-md">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Adjust zoom to generate preview.</p>
             </div>
         )}
      </div>
      <div className="pt-5 mt-auto">
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGeneratePreview} isLoading={isLoadingPreview} disabled={isLoadingPreview}>
            Refresh Preview
          </Button>
          <Button onClick={handleDownload} disabled={!previewImageSrc || isLoadingPreview} variant="primary">
            Download JPG
          </Button>
        </div>
      </div>
    </Modal>
  );
};
