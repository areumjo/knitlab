import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ChartState, KeyDefinition, StitchSymbolDef } from '../types';
import {
  buildColorworkChartV1,
  generateColorworkPixelPng,
  serializeColorworkChartV1,
} from '../services/colorworkExportService';
import type { ColorworkChartV1 } from '../lib/colorwork-chart-v1';

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
  const [mode, setMode] = useState<'chart' | 'colorwork'>('colorwork');
  const [exportZoom, setExportZoom] = useState(initialZoom);
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colorworkArtifact, setColorworkArtifact] = useState<ColorworkChartV1 | null>(null);
  const [pixelImageSrc, setPixelImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setExportZoom(initialZoom); // Reset zoom on open
      setPreviewImageSrc(null); // Clear previous preview
      setError(null);
      setColorworkArtifact(null);
      setPixelImageSrc(null);
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
    if (isOpen && mode === 'chart') {
        handleGeneratePreview();
    }
  }, [isOpen, mode, exportZoom, handleGeneratePreview]);

  useEffect(() => {
    if (!isOpen || mode !== 'colorwork') return;
    try {
      const artifact = buildColorworkChartV1(chartState, keyPalette);
      setColorworkArtifact(artifact);
      setPixelImageSrc(generateColorworkPixelPng(artifact).dataUrl);
      setError(null);
    } catch (err) {
      setColorworkArtifact(null);
      setPixelImageSrc(null);
      setError(err instanceof Error ? err.message : 'Could not export this chart as colorwork.');
    }
  }, [isOpen, mode, chartState, keyPalette]);


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

  const safeName = chartState.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'chart';

  const downloadColorworkJson = () => {
    if (!colorworkArtifact) return;
    const url = URL.createObjectURL(new Blob(
      [serializeColorworkChartV1(colorworkArtifact)],
      { type: 'application/json' },
    ));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}.colorwork.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPixelPng = () => {
    if (!pixelImageSrc) return;
    const link = document.createElement('a');
    link.href = pixelImageSrc;
    link.download = `${safeName}.png`;
    link.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export chart" size="xl">
      <div className="space-y-4">
        <div className="inline-flex rounded-md border border-neutral-300 p-0.5 dark:border-neutral-600" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'colorwork'}
            onClick={() => setMode('colorwork')}
            className={`rounded px-3 py-1.5 text-sm ${mode === 'colorwork' ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'}`}
          >
            Colorwork
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'chart'}
            onClick={() => setMode('chart')}
            className={`rounded px-3 py-1.5 text-sm ${mode === 'chart' ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'}`}
          >
            Chart JPG
          </button>
        </div>

        {mode === 'chart' && (
          <>
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
          </>
        )}

        {mode === 'colorwork' && colorworkArtifact && pixelImageSrc && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600 dark:text-neutral-300">
              <span>{colorworkArtifact.width} x {colorworkArtifact.height} cells</span>
              <span>{colorworkArtifact.palette.length} colors</span>
              <span>{colorworkArtifact.rowNumbering === 'bottom-up' ? 'Row 1 at bottom' : 'Row 1 at top'}</span>
            </div>
            <div className="max-h-[60vh] overflow-auto border border-neutral-300 bg-neutral-100 p-4 dark:border-neutral-600 dark:bg-neutral-800">
              <img
                src={pixelImageSrc}
                alt="Exact colorwork pixels"
                className="mx-auto [image-rendering:pixelated]"
                style={{
                  width: Math.min(640, Math.max(colorworkArtifact.width, colorworkArtifact.width * 12)),
                  height: 'auto',
                }}
              />
            </div>
          </div>
        )}
        {mode === 'colorwork' && error && (
          <div className="rounded border border-red-400 bg-red-100 p-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
      </div>
      <div className="pt-5 mt-auto">
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {mode === 'chart' ? (
            <Button onClick={handleDownload} disabled={!previewImageSrc || isLoadingPreview} variant="primary">
              Download JPG
            </Button>
          ) : (
            <>
              <Button onClick={downloadPixelPng} disabled={!pixelImageSrc} variant="outline">Download PNG</Button>
              <Button onClick={downloadColorworkJson} disabled={!colorworkArtifact} variant="primary">Download chart data</Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
