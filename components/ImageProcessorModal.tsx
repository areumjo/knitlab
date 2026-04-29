
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ProcessedImageData } from '../types';
import { MAX_CHART_ROWS, MAX_CHART_COLS } from '../constants';

interface ImageProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChart: (data: ProcessedImageData) => void;
  isDarkMode: boolean;
}

const MAX_PREVIEW_IMAGE_WIDTH = 500;

// Channel-quantization step used when bucketing pixels for `mode` pooling
// inside one cell — small enough that near-identical colours collapse into the
// same bucket, large enough that the most-common bucket has meaningful weight.
const MODE_BUCKET_LEVELS = 8;

type RGB = [number, number, number];

const sqDistRGB = (a: RGB, b: RGB): number =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

/**
 * k-means clustering on RGB points. Picks an initial set of centroids
 * deterministically (k-means++ style: first point + furthest-point seeding),
 * then runs Lloyd's iteration to convergence (or maxIter, whichever first).
 *
 * Returns the chosen centroids plus, for each input point, the index of the
 * centroid it ended up assigned to.
 */
function kmeansRGB(points: RGB[], k: number, maxIter = 20): { centroids: RGB[]; assignments: number[] } {
  if (points.length === 0 || k <= 0) return { centroids: [], assignments: [] };
  if (k >= points.length) {
    return {
      centroids: points.map(p => [p[0], p[1], p[2]]),
      assignments: points.map((_, i) => i),
    };
  }

  const centroids: RGB[] = [[points[0][0], points[0][1], points[0][2]]];
  while (centroids.length < k) {
    let bestIdx = -1;
    let bestMinDist = -1;
    for (let i = 0; i < points.length; i++) {
      let minD = Infinity;
      for (const c of centroids) {
        const d = sqDistRGB(points[i], c);
        if (d < minD) minD = d;
      }
      if (minD > bestMinDist) {
        bestMinDist = minD;
        bestIdx = i;
      }
    }
    if (bestIdx < 0 || bestMinDist === 0) break; // not enough distinct points
    const p = points[bestIdx];
    centroids.push([p[0], p[1], p[2]]);
  }

  const assignments = new Array<number>(points.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      let best = 0;
      let minD = Infinity;
      for (let j = 0; j < centroids.length; j++) {
        const d = sqDistRGB(points[i], centroids[j]);
        if (d < minD) {
          minD = d;
          best = j;
        }
      }
      if (assignments[i] !== best) {
        assignments[i] = best;
        changed = true;
      }
    }
    if (!changed) break;

    const sums: [number, number, number][] = centroids.map(() => [0, 0, 0]);
    const counts = new Array<number>(centroids.length).fill(0);
    for (let i = 0; i < points.length; i++) {
      const a = assignments[i];
      sums[a][0] += points[i][0];
      sums[a][1] += points[i][1];
      sums[a][2] += points[i][2];
      counts[a]++;
    }
    for (let j = 0; j < centroids.length; j++) {
      if (counts[j] > 0) {
        centroids[j] = [sums[j][0] / counts[j], sums[j][1] / counts[j], sums[j][2] / counts[j]];
      }
    }
  }
  return { centroids, assignments };
}

export const ImageProcessorModal: React.FC<ImageProcessorModalProps> = ({ isOpen, onClose, onCreateChart, isDarkMode }) => {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);

  const [displayScale, setDisplayScale] = useState(1);
  const [selection, setSelection] = useState({ x: 50, y: 50, width: 100, height: 100 });
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [isResizingSelection, setIsResizingSelection] = useState<string | null>(null);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });
  const initialSelectionForResizeRef = useRef({ ...selection });

  const [gridConfig, setGridConfig] = useState({
    cols: 20,
    rows: 20,
    numColors: 6,
    poolingAlgorithm: 'mode' as 'mean' | 'mode'
  });
  // When on, grid rows/cols are locked to the selection's aspect ratio so each
  // grid cell samples a roughly square region of the source image (otherwise
  // a long-thin crop pixelates into stretched-looking output).
  const [matchAspectToSelection, setMatchAspectToSelection] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false); // Ref to prevent re-entry in processAndDisplay

  const [outputGridData, setOutputGridData] = useState<string[] | null>(null);
  const [outputPaletteData, setOutputPaletteData] = useState<string[] | null>(null);

  const [currentPixelDataForRemap, setCurrentPixelDataForRemap] = useState<string[]>([]);
  const [currentPaletteForRemap, setCurrentPaletteForRemap] = useState<Set<string>>(new Set());
  const [remapColorInputs, setRemapColorInputs] = useState<Record<string, string>>({});

  const debounceTimerRef = useRef<number | null>(null);

  const cleanupState = useCallback(() => {
    setOriginalImage(null);
    if (displayCanvasRef.current) {
        const ctx = displayCanvasRef.current.getContext('2d');
        ctx?.clearRect(0,0, displayCanvasRef.current.width, displayCanvasRef.current.height);
    }
    if (sourceCanvasRef.current) {
        const ctx = sourceCanvasRef.current.getContext('2d');
        ctx?.clearRect(0,0, sourceCanvasRef.current.width, sourceCanvasRef.current.height);
    }
    setDisplayScale(1);
    setSelection({ x: 50, y: 50, width: 100, height: 100 });
    setIsDraggingSelection(false);
    setIsResizingSelection(null);
    setGridConfig({ cols: 20, rows: 20, numColors: 8, poolingAlgorithm: 'mode' });
    setMatchAspectToSelection(true);
    setIsLoading(false);
    isLoadingRef.current = false;
    setOutputGridData(null);
    setOutputPaletteData(null);
    setCurrentPixelDataForRemap([]);
    setCurrentPaletteForRemap(new Set());
    setRemapColorInputs({});
  }, []);

  const handleCloseModal = useCallback(() => {
    cleanupState();
    onClose();
  }, [cleanupState, onClose]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      cleanupState();
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setOriginalImage(img);

          const sourceCtx = sourceCanvasRef.current?.getContext('2d');
          if (sourceCanvasRef.current && sourceCtx) {
            sourceCanvasRef.current.width = img.width;
            sourceCanvasRef.current.height = img.height;
            sourceCtx.drawImage(img, 0, 0);
          }

          const preliminaryScale = Math.min(1, MAX_PREVIEW_IMAGE_WIDTH / img.width);
          setDisplayScale(preliminaryScale);

          const dWidthInitial = img.width * preliminaryScale;
          const dHeightInitial = img.height * preliminaryScale;
          setSelection({
            x: Math.max(0, dWidthInitial * 0.15),
            y: Math.max(0, dHeightInitial * 0.15),
            width: Math.max(20, dWidthInitial * 0.7),
            height: Math.max(20, dHeightInitial * 0.7)
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isOpen && originalImage && displayCanvasRef.current && imageContainerRef.current) {
      let parentEffectiveWidth = MAX_PREVIEW_IMAGE_WIDTH;
      if (imageContainerRef.current.parentElement) {
          parentEffectiveWidth = imageContainerRef.current.parentElement.clientWidth;
      }
      const targetWidthForScaling = Math.min(MAX_PREVIEW_IMAGE_WIDTH, parentEffectiveWidth > 0 ? parentEffectiveWidth : MAX_PREVIEW_IMAGE_WIDTH);
      const newEffectiveScale = Math.min(1, targetWidthForScaling / originalImage.width);

      if (Math.abs(newEffectiveScale - displayScale) > 0.001) {
          setDisplayScale(newEffectiveScale);
          return;
      }

      const actualRenderWidth = originalImage.width * displayScale;
      const actualRenderHeight = originalImage.height * displayScale;

      displayCanvasRef.current.width = actualRenderWidth;
      displayCanvasRef.current.height = actualRenderHeight;
      const displayCtx = displayCanvasRef.current.getContext('2d');
      if (displayCtx) {
        displayCtx.clearRect(0, 0, actualRenderWidth, actualRenderHeight);
        displayCtx.drawImage(originalImage, 0, 0, actualRenderWidth, actualRenderHeight);
      }
      imageContainerRef.current.style.width = `${actualRenderWidth}px`;
      imageContainerRef.current.style.height = `${actualRenderHeight}px`;
    }
  }, [isOpen, originalImage, displayScale, isDarkMode]);

  const handleSelectionMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === selectionBoxRef.current) {
      setIsDraggingSelection(true);
      dragStartOffsetRef.current = {
        x: e.clientX - selectionBoxRef.current!.offsetLeft,
        y: e.clientY - selectionBoxRef.current!.offsetTop,
      };
      selectionBoxRef.current!.style.cursor = 'grabbing';
    }
  };

  const handleResizeHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handleType: string) => {
    e.stopPropagation();
    setIsResizingSelection(handleType);
    dragStartOffsetRef.current = { x: e.clientX, y: e.clientY };
    initialSelectionForResizeRef.current = { ...selection };
  };

  const handleDocumentMouseMove = useCallback((e: MouseEvent) => {
    if (!originalImage || isLoadingRef.current) return; // Use isLoadingRef for gatekeeping

    if (isDraggingSelection && selectionBoxRef.current && displayCanvasRef.current) {
      let nX = e.clientX - dragStartOffsetRef.current.x;
      let nY = e.clientY - dragStartOffsetRef.current.y;
      nX = Math.max(0, Math.min(nX, displayCanvasRef.current.width - selection.width));
      nY = Math.max(0, Math.min(nY, displayCanvasRef.current.height - selection.height));
      setSelection(prev => ({ ...prev, x: nX, y: nY }));
    } else if (isResizingSelection && displayCanvasRef.current) {
      const dX = e.clientX - dragStartOffsetRef.current.x;
      const dY = e.clientY - dragStartOffsetRef.current.y;
      let { x: nX, y: nY, width: nW, height: nH } = initialSelectionForResizeRef.current;

      if (isResizingSelection.includes('w')) { nX += dX; nW -= dX; }
      if (isResizingSelection.includes('e')) { nW += dX; }
      if (isResizingSelection.includes('n')) { nY += dY; nH -= dY; }
      if (isResizingSelection.includes('s')) { nH += dY; }

      const minS = 10;
      if (nW < minS) { if (isResizingSelection.includes('w')) nX = initialSelectionForResizeRef.current.x + initialSelectionForResizeRef.current.width - minS; nW = minS; }
      if (nH < minS) { if (isResizingSelection.includes('n')) nY = initialSelectionForResizeRef.current.y + initialSelectionForResizeRef.current.height - minS; nH = minS; }

      nX = Math.max(0, nX);
      nY = Math.max(0, nY);
      nW = Math.min(nW, displayCanvasRef.current.width - nX);
      nH = Math.min(nH, displayCanvasRef.current.height - nY);

      if (nW > 0 && nH > 0) {
        setSelection({ x: nX, y: nY, width: nW, height: nH });
      }
    }
  }, [isDraggingSelection, isResizingSelection, originalImage, selection.width, selection.height]);

  const handleDocumentMouseUp = useCallback(() => {
    setIsDraggingSelection(false);
    setIsResizingSelection(null);
    if (selectionBoxRef.current) selectionBoxRef.current.style.cursor = 'move';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [handleDocumentMouseMove, handleDocumentMouseUp]);

  const parseRgb = (rgbStr: string): { r: number, g: number, b: number } | null => {
    const m = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) };
    return null;
  }
  const colorDistance = (cStr1: string, cStr2: string): number => {
    const c1 = parseRgb(cStr1), c2 = parseRgb(cStr2);
    if (!c1 || !c2) return Infinity;
    return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
  }
  const rgbToHex = (rgbString: string): string => {
    const rgb = parseRgb(rgbString);
    if (!rgb) return '#000000';
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1).toUpperCase();
  }
  const hexToRgbString = (hex: string): string => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); }
    else if (hex.length === 7) { r = parseInt(hex[1] + hex[2], 16); g = parseInt(hex[3] + hex[4], 16); b = parseInt(hex[5] + hex[6], 16); }
    return `rgb(${r}, ${g}, ${b})`;
  }
  const quantizeChannel = (val: number, levels: number): number => {
    if (levels <= 1) return Math.round(val);
    const step = 255 / (levels - 1);
    return Math.round(Math.round(val / step) * step);
  }

  // Sample one representative RGB triple per output cell. `mean` averages every
  // pixel in the cell; `mode` quantises pixels into MODE_BUCKET_LEVELS-per-
  // channel buckets and picks the bucket with the highest count, so a cell
  // straddling a colour edge snaps to the dominant region instead of smearing
  // into a muddy average.
  const sampleCellColorsRGB = useCallback((poolingAlgo: 'mean' | 'mode'): RGB[] => {
    const { cols: targetCols, rows: targetRows } = gridConfig;
    const sourceSX = selection.x / displayScale;
    const sourceSY = selection.y / displayScale;
    const sourceSW = selection.width / displayScale;
    const sourceSH = selection.height / displayScale;

    if (sourceSW < 1 || sourceSH < 1 || targetCols < 1 || targetRows < 1 || !sourceCanvasRef.current) return [];
    const sCtx = sourceCanvasRef.current.getContext('2d');
    if (!sCtx) return [];

    const cellW = sourceSW / targetCols;
    const cellH = sourceSH / targetRows;
    const out: RGB[] = [];

    for (let r = 0; r < targetRows; r++) {
      for (let c = 0; c < targetCols; c++) {
        const sx = sourceSX + c * cellW;
        const sy = sourceSY + r * cellH;
        const cSX = Math.max(0, Math.floor(sx));
        const cSY = Math.max(0, Math.floor(sy));
        const cSW = Math.max(1, Math.min(Math.floor(cellW), sourceCanvasRef.current.width - cSX));
        const cSH = Math.max(1, Math.min(Math.floor(cellH), sourceCanvasRef.current.height - cSY));
        if (cSW <= 0 || cSH <= 0) { out.push([128, 128, 128]); continue; }
        const data = sCtx.getImageData(cSX, cSY, cSW, cSH).data;
        if (data.length === 0) { out.push([128, 128, 128]); continue; }

        if (poolingAlgo === 'mean') {
          let sumR = 0, sumG = 0, sumB = 0;
          const n = data.length / 4;
          for (let i = 0; i < data.length; i += 4) { sumR += data[i]; sumG += data[i + 1]; sumB += data[i + 2]; }
          out.push([Math.round(sumR / n), Math.round(sumG / n), Math.round(sumB / n)]);
        } else {
          const freq = new Map<number, number>();
          let bestKey = 0;
          let bestCount = 0;
          for (let i = 0; i < data.length; i += 4) {
            const qr = quantizeChannel(data[i], MODE_BUCKET_LEVELS);
            const qg = quantizeChannel(data[i + 1], MODE_BUCKET_LEVELS);
            const qb = quantizeChannel(data[i + 2], MODE_BUCKET_LEVELS);
            const key = (qr << 16) | (qg << 8) | qb;
            const next = (freq.get(key) || 0) + 1;
            freq.set(key, next);
            if (next > bestCount) { bestCount = next; bestKey = key; }
          }
          out.push([(bestKey >> 16) & 0xff, (bestKey >> 8) & 0xff, bestKey & 0xff]);
        }
      }
    }
    return out;
  }, [gridConfig.cols, gridConfig.rows, selection.x, selection.y, selection.width, selection.height, displayScale]);


  const processAndDisplay = useCallback(async () => {
    if (!originalImage || selection.width <= 0 || selection.height <= 0 || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 10));

    const { numColors: targetNumColors, poolingAlgorithm } = gridConfig;
    const cellColors = sampleCellColorsRGB(poolingAlgorithm);

    if (cellColors.length === 0) {
      setOutputGridData(null);
      setOutputPaletteData(null);
      setCurrentPixelDataForRemap([]);
      setCurrentPaletteForRemap(new Set());
      setIsLoading(false);
      isLoadingRef.current = false;
      return;
    }

    // Cluster the per-cell colours so the palette is exactly the targetNum
    // colours that minimise total squared error from the originals — much
    // better than the old "quantise then merge nearest pairs" path, which
    // was both lossy and visually arbitrary about which pairs got merged.
    const { centroids, assignments } = kmeansRGB(cellColors, Math.max(1, targetNumColors));

    const palette: string[] = centroids.map(
      ([r, g, b]) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
    );
    const pixelData: string[] = assignments.map(a => palette[a] || palette[0]);
    const paletteSet = new Set(palette);

    setCurrentPixelDataForRemap(pixelData);
    setCurrentPaletteForRemap(paletteSet);

    if (pixelData.length > 0) {
      setOutputGridData(pixelData);
      setOutputPaletteData(Array.from(paletteSet));
      const initialRemaps: Record<string, string> = {};
      paletteSet.forEach(color => { initialRemaps[color] = rgbToHex(color); });
      setRemapColorInputs(initialRemaps);
    } else {
      setOutputGridData(null);
      setOutputPaletteData(null);
    }
    setIsLoading(false);
    isLoadingRef.current = false;
  }, [
    originalImage, selection.width, selection.height, selection.x, selection.y,
    gridConfig.numColors, gridConfig.poolingAlgorithm, gridConfig.cols, gridConfig.rows,
    sampleCellColorsRGB,
  ]);

  const debouncedProcessAndDisplay = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(processAndDisplay, 400);
  }, [processAndDisplay]);

  useEffect(() => {
    if (originalImage && selectionBoxRef.current) {
        selectionBoxRef.current.style.left = `${selection.x}px`;
        selectionBoxRef.current.style.top = `${selection.y}px`;
        selectionBoxRef.current.style.width = `${selection.width}px`;
        selectionBoxRef.current.style.height = `${selection.height}px`;
        selectionBoxRef.current.style.display = 'block';
        if (isOpen) { // Only process if modal is open and image loaded
            debouncedProcessAndDisplay();
        }
    } else if (selectionBoxRef.current) {
        selectionBoxRef.current.style.display = 'none';
    }
  }, [selection.x, selection.y, selection.width, selection.height, originalImage, isOpen, debouncedProcessAndDisplay]);

  useEffect(() => {
    if (isOpen && originalImage) {
        debouncedProcessAndDisplay();
    }
  }, [gridConfig.cols, gridConfig.rows, gridConfig.numColors, gridConfig.poolingAlgorithm, isOpen, originalImage, debouncedProcessAndDisplay]);

  // When aspect-lock is on, keep `rows` derived from the selection's aspect
  // and the current `cols` so each grid cell samples a roughly square region
  // of the source. Recomputes on selection drag/resize and when the user
  // toggles the lock back on.
  useEffect(() => {
    if (!matchAspectToSelection || selection.width <= 0 || selection.height <= 0) return;
    const aspect = selection.width / selection.height;
    setGridConfig(prev => {
      const newRows = Math.max(1, Math.min(MAX_CHART_ROWS, Math.round(prev.cols / aspect)));
      if (newRows === prev.rows) return prev;
      return { ...prev, rows: newRows };
    });
  }, [matchAspectToSelection, selection.width, selection.height]);

  // Compute the locked counterpart when the user types into one dimension
  // input. Bidirectional: changing cols updates rows and vice versa.
  const setColsRespectingAspect = useCallback((newCols: number) => {
    const cols = Math.max(1, Math.min(MAX_CHART_COLS, newCols));
    setGridConfig(prev => {
      if (!matchAspectToSelection || selection.width <= 0 || selection.height <= 0) {
        return { ...prev, cols };
      }
      const aspect = selection.width / selection.height;
      const rows = Math.max(1, Math.min(MAX_CHART_ROWS, Math.round(cols / aspect)));
      return { ...prev, cols, rows };
    });
  }, [matchAspectToSelection, selection.width, selection.height]);

  const setRowsRespectingAspect = useCallback((newRows: number) => {
    const rows = Math.max(1, Math.min(MAX_CHART_ROWS, newRows));
    setGridConfig(prev => {
      if (!matchAspectToSelection || selection.width <= 0 || selection.height <= 0) {
        return { ...prev, rows };
      }
      const aspect = selection.width / selection.height;
      const cols = Math.max(1, Math.min(MAX_CHART_COLS, Math.round(rows * aspect)));
      return { ...prev, cols, rows };
    });
  }, [matchAspectToSelection, selection.width, selection.height]);

  const handleRemapColorChange = (originalRgb: string, newHex: string) => {
    setRemapColorInputs(prev => ({ ...prev, [originalRgb]: newHex }));
  };

  const handleApplyRemap = () => {
    if (currentPixelDataForRemap.length === 0) return;
    const remapInstructions: Record<string,string> = {};
    let changed = false;
    currentPaletteForRemap.forEach(originalColorRgb => {
        const newHex = remapColorInputs[originalColorRgb];
        const newRgb = hexToRgbString(newHex);
        if (originalColorRgb !== newRgb) { remapInstructions[originalColorRgb] = newRgb; changed = true; }
    });
    if (!changed) return;
    const remappedData = currentPixelDataForRemap.map(pixelColor => remapInstructions[pixelColor] || pixelColor);
    setOutputGridData(remappedData);
    const newRemappedPalette = new Set<string>();
    remappedData.forEach(color => newRemappedPalette.add(color));
    setOutputPaletteData(Array.from(newRemappedPalette));
    setCurrentPixelDataForRemap(remappedData); setCurrentPaletteForRemap(newRemappedPalette);
    const newRemapInputs: Record<string, string> = {};
    newRemappedPalette.forEach(color => newRemapInputs[color] = rgbToHex(color));
    setRemapColorInputs(newRemapInputs);
  };

  const handleResetColorMap = () => {
    if (isLoadingRef.current || !originalImage) return;
    processAndDisplay();
  };

  const handleFinalizeChart = () => {
    if (!outputGridData || !outputPaletteData) {
      alert("No processed image data to create chart from."); return;
    }
    const processedImageData: ProcessedImageData = {
      gridData: {
        rows: Math.min(gridConfig.rows, MAX_CHART_ROWS),
        cols: Math.min(gridConfig.cols, MAX_CHART_COLS),
        colors: outputGridData.map(rgbColor => rgbToHex(rgbColor)),
      },
      palette: outputPaletteData.map(rgbColor => rgbToHex(rgbColor)),
    };
    onCreateChart(processedImageData);
    handleCloseModal();
  };

  const outputGridDisplaySize = Math.min(300, typeof window !== 'undefined' ? window.innerWidth * 0.4 : 300);
  const outputGridAspectRatio = gridConfig.cols / gridConfig.rows || 1;


  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={
        <h2
          className="text-2xl font-semibold text-neutral-700 dark:text-neutral-200"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Import image
        </h2>
      }
      size="full"
      footer={
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {originalImage
              ? 'Drag the box on the image to choose what becomes your chart, then tweak the grid and colors on the right.'
              : 'Pick a photo or graphic to turn into a knit chart.'}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button
              onClick={handleFinalizeChart}
              disabled={!outputGridData || !outputPaletteData || isLoading}
              variant="primary"
            >
              Create chart
            </Button>
          </div>
        </div>
      }
    >
      <canvas ref={sourceCanvasRef} style={{ display: 'none' }} />

      {!originalImage ? (
        // Empty state — single-line prompt + CTA, nothing more.
        <div className="flex items-center justify-center min-h-[40vh] py-8">
          <div className="text-center max-w-md">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Pick a photo or graphic to turn into a knit chart.
            </p>
            <label
              htmlFor="image-loader-modal"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md font-medium cursor-pointer transition-colors text-sm"
            >
              Choose image
              <input
                type="file"
                id="image-loader-modal"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
              />
            </label>
          </div>
        </div>
      ) : (
        // Working state — image + crop on the left, controls on the right.
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT: source image with selection box */}
          <div className="lg:w-3/5 flex flex-col gap-3 min-w-0">
            <div className="flex items-baseline justify-between">
              <h3
                className="text-xl text-neutral-700 dark:text-neutral-200"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Crop
              </h3>
              <label
                htmlFor="image-loader-modal"
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary underline cursor-pointer"
              >
                Choose a different image
                <input
                  type="file"
                  id="image-loader-modal"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-1">
              Drag the dashed box, or grab any handle to resize. Whatever's inside becomes your chart.
            </p>
            <div
              ref={imageContainerRef}
              className="relative border border-neutral-300 dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-700 self-start max-w-full"
              style={{ display: 'inline-block' }}
            >
              <canvas ref={displayCanvasRef} className="block cursor-crosshair max-w-full" />
              <div
                ref={selectionBoxRef}
                onMouseDown={handleSelectionMouseDown}
                className="absolute border-2 border-dashed border-red-500 box-border cursor-move"
                style={{ display: 'none' }}
              >
                {['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map(handle => (
                  <div
                    key={handle}
                    onMouseDown={(e) => handleResizeHandleMouseDown(e, handle)}
                    className={`absolute w-2.5 h-2.5 bg-blue-500 border border-white box-border
                      ${handle.includes('n') ? 'top-[-5px]' : ''} ${handle.includes('s') ? 'bottom-[-5px]' : ''} ${handle.includes('w') ? 'left-[-5px]' : ''} ${handle.includes('e') ? 'right-[-5px]' : ''}
                      ${(handle === 'n' || handle === 's') ? 'left-1/2 -translate-x-1/2 cursor-ns-resize' : ''}
                      ${(handle === 'w' || handle === 'e') ? 'top-1/2 -translate-y-1/2 cursor-ew-resize' : ''}
                      ${handle === 'nw' ? 'cursor-nwse-resize' : ''} ${handle === 'ne' ? 'cursor-nesw-resize' : ''}
                      ${handle === 'sw' ? 'cursor-nesw-resize' : ''} ${handle === 'se' ? 'cursor-nwse-resize' : ''}
                    `}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: stacked sections for grid / palette / preview / tune */}
          <div className="lg:w-2/5 flex flex-col gap-6 min-w-0">
            <section>
              <h3
                className="text-xl text-neutral-700 dark:text-neutral-200 mb-2"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Grid
              </h3>
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                <input
                  type="checkbox"
                  checked={matchAspectToSelection}
                  onChange={e => setMatchAspectToSelection(e.target.checked)}
                  className="rounded"
                />
                Keep cells square (match the crop's aspect)
              </label>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label htmlFor="grid-cols-modal" className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Columns</label>
                  <input
                    type="number" id="grid-cols-modal" value={gridConfig.cols}
                    onChange={e => setColsRespectingAspect(parseInt(e.target.value) || 1)}
                    min="1" max={MAX_CHART_COLS}
                    className="w-full px-2 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                  />
                </div>
                <div>
                  <label htmlFor="grid-rows-modal" className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Rows</label>
                  <input
                    type="number" id="grid-rows-modal" value={gridConfig.rows}
                    onChange={e => setRowsRespectingAspect(parseInt(e.target.value) || 1)}
                    min="1" max={MAX_CHART_ROWS}
                    className="w-full px-2 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3
                className="text-xl text-neutral-700 dark:text-neutral-200 mb-2"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Palette
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label htmlFor="num-colors-modal" className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">How many colors</label>
                  <input
                    type="number" id="num-colors-modal" value={gridConfig.numColors}
                    onChange={e => setGridConfig(p => ({ ...p, numColors: parseInt(e.target.value) || 1 }))}
                    min="1" max="256"
                    className="w-full px-2 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                  />
                </div>
                <div>
                  <label htmlFor="pooling-algo-modal" className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Cell color</label>
                  <select
                    id="pooling-algo-modal"
                    value={gridConfig.poolingAlgorithm}
                    onChange={e => setGridConfig(p => ({ ...p, poolingAlgorithm: e.target.value as 'mean' | 'mode' }))}
                    className="w-full px-2 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                  >
                    <option value="mode">Dominant</option>
                    <option value="mean">Average</option>
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h3
                className="text-xl text-neutral-700 dark:text-neutral-200 mb-2"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Preview
              </h3>
              {isLoading && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Working…</p>
              )}
              {outputGridData ? (
                <div
                  className="border border-neutral-300 dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-700 p-1 mx-auto"
                  style={{ width: 'fit-content', maxWidth: '100%' }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                      gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
                      width: outputGridDisplaySize,
                      height: Math.max(10, outputGridDisplaySize / outputGridAspectRatio),
                      imageRendering: 'pixelated' as any,
                    }}
                  >
                    {outputGridData.map((color, i) => (
                      <div key={`gridcell-${i}`} className="w-full h-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                  Pixelating…
                </p>
              )}
            </section>

            {outputPaletteData && outputPaletteData.length > 0 && (
              <section>
                <h3
                  className="text-xl text-neutral-700 dark:text-neutral-200 mb-2"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Tune palette
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                  Tap a swatch to swap that color across every matching cell.
                </p>
                <div className="border border-neutral-200 dark:border-neutral-700 rounded p-2 max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
                  {outputPaletteData
                    .slice()
                    .sort((a, b) => colorDistance('rgb(0,0,0)', a) - colorDistance('rgb(0,0,0)', b))
                    .map(originalColorRgb => (
                      <div key={`palette-${originalColorRgb}`} className="flex items-center gap-3 text-xs">
                        <div
                          className="w-7 h-7 rounded border border-neutral-400 dark:border-neutral-500 flex-shrink-0"
                          style={{ backgroundColor: originalColorRgb }}
                        />
                        <span
                          className="font-mono text-neutral-600 dark:text-neutral-400 flex-grow truncate"
                          title={originalColorRgb}
                        >
                          {rgbToHex(originalColorRgb)}
                        </span>
                        <input
                          type="color"
                          value={remapColorInputs[originalColorRgb] || rgbToHex(originalColorRgb)}
                          onChange={e => handleRemapColorChange(originalColorRgb, e.target.value)}
                          className="w-9 h-7 p-0.5 border border-neutral-300 dark:border-neutral-600 rounded cursor-pointer flex-shrink-0"
                        />
                      </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button onClick={handleApplyRemap} size="sm">Apply colors</Button>
                  <Button onClick={handleResetColorMap} variant="outline" size="sm" disabled={isLoading || !originalImage}>
                    Reset
                  </Button>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
