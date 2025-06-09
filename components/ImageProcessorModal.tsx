
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
    poolingAlgorithm: 'mean' as 'mean' | 'mode'
  });
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false); // Ref to prevent re-entry in processAndDisplay

  const [maxOriginalColors, setMaxOriginalColors] = useState<number | null>(null);

  const [outputGridData, setOutputGridData] = useState<string[] | null>(null);
  const [outputPaletteData, setOutputPaletteData] = useState<string[] | null>(null);
  const [LValueUsed, setLValueUsed] = useState<string>("N/A");
  const [mergingPerformed, setMergingPerformed] = useState(false);

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
    setGridConfig({ cols: 20, rows: 20, numColors: 8, poolingAlgorithm: 'mean' });
    setIsLoading(false);
    isLoadingRef.current = false;
    setMaxOriginalColors(null);
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
  const averageColors = (cStr1: string, cStr2: string): string => {
    const c1 = parseRgb(cStr1), c2 = parseRgb(cStr2);
    if (!c1) return cStr2; if (!c2) return cStr1;
    const aR = Math.round((c1.r + c2.r) / 2), aG = Math.round((c1.g + c2.g) / 2), aB = Math.round((c1.b + c2.b) / 2);
    return `rgb(${aR}, ${aG}, ${aB})`;
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

  const generatePixelDataWithLevels = useCallback((levelsPerChannel: number, poolingAlgo: 'mean' | 'mode') => {
    const { cols: targetCols, rows: targetRows } = gridConfig;
    const sourceSX = selection.x / displayScale;
    const sourceSY = selection.y / displayScale;
    const sourceSW = selection.width / displayScale;
    const sourceSH = selection.height / displayScale;

    if (sourceSW < 1 || sourceSH < 1 || targetCols < 1 || targetRows < 1 || !sourceCanvasRef.current) {
      return { pixelatedData: [], uniqueColors: new Set<string>() };
    }
    const sCtx = sourceCanvasRef.current.getContext('2d');
    if (!sCtx) return { pixelatedData: [], uniqueColors: new Set<string>() };

    const cellWidthInSource = sourceSW / targetCols;
    const cellHeightInSource = sourceSH / targetRows;
    const pixelatedData: string[] = [];
    const uniqueColors = new Set<string>();

    for (let r = 0; r < targetRows; r++) {
      for (let c = 0; c < targetCols; c++) {
        const sx = sourceSX + c * cellWidthInSource;
        const sy = sourceSY + r * cellHeightInSource;
        const cSX = Math.max(0, Math.floor(sx));
        const cSY = Math.max(0, Math.floor(sy));
        let cSW = Math.floor(cellWidthInSource);
        let cSH = Math.floor(cellHeightInSource);
        cSW = Math.max(1, Math.min(cSW, sourceCanvasRef.current.width - cSX));
        cSH = Math.max(1, Math.min(cSH, sourceCanvasRef.current.height - cSY));

        if (cSW <= 0 || cSH <= 0) {
          pixelatedData.push('rgb(128, 128, 128)'); uniqueColors.add('rgb(128, 128, 128)'); continue;
        }
        const imageData = sCtx.getImageData(cSX, cSY, cSW, cSH).data;
        let finalColor = 'rgb(128,128,128)';
        if (imageData.length > 0) {
          if (poolingAlgo === 'mean') {
            let avgR = 0, avgG = 0, avgB = 0; const pixelCount = imageData.length / 4;
            for (let i = 0; i < imageData.length; i += 4) { avgR += imageData[i]; avgG += imageData[i + 1]; avgB += imageData[i + 2]; }
            avgR = Math.round(avgR / pixelCount); avgG = Math.round(avgG / pixelCount); avgB = Math.round(avgB / pixelCount);
            finalColor = `rgb(${quantizeChannel(avgR, levelsPerChannel)}, ${quantizeChannel(avgG, levelsPerChannel)}, ${quantizeChannel(avgB, levelsPerChannel)})`;
          } else if (poolingAlgo === 'mode') {
            const freqMap = new Map<string, number>();
            for (let i = 0; i < imageData.length; i += 4) {
              const qColorStr = `rgb(${quantizeChannel(imageData[i], levelsPerChannel)}, ${quantizeChannel(imageData[i+1], levelsPerChannel)}, ${quantizeChannel(imageData[i+2], levelsPerChannel)})`;
              freqMap.set(qColorStr, (freqMap.get(qColorStr) || 0) + 1);
            }
            if (freqMap.size > 0) {
              let maxFreq = 0;
              for (const [color, freq] of freqMap) { if (freq > maxFreq) { maxFreq = freq; finalColor = color; } }
            }
          }
        }
        pixelatedData.push(finalColor); uniqueColors.add(finalColor);
      }
    }
    return { pixelatedData, uniqueColors };
  }, [ gridConfig.cols, gridConfig.rows, selection.x, selection.y, selection.width, selection.height, displayScale ]);

  const calculateMaxColorsInSelection = useCallback(() => {
    if (!originalImage || selection.width <= 0 || selection.height <= 0 || !sourceCanvasRef.current) {
      setMaxOriginalColors(null); return;
    }
    const sCtx = sourceCanvasRef.current.getContext('2d');
    if (!sCtx) { setMaxOriginalColors(null); return;}
    const sX = Math.floor(selection.x / displayScale), sY = Math.floor(selection.y / displayScale);
    const sW = Math.max(1, Math.floor(selection.width / displayScale)), sH = Math.max(1, Math.floor(selection.height / displayScale));
    if (sX + sW > sourceCanvasRef.current.width || sY + sH > sourceCanvasRef.current.height) {
      setMaxOriginalColors(null); return;
    }
    const imgData = sCtx.getImageData(sX, sY, sW, sH).data;
    const uniqueOriginalColors = new Set<string>();
    for (let i = 0; i < imgData.length; i += 4) uniqueOriginalColors.add(`rgb(${imgData[i]},${imgData[i+1]},${imgData[i+2]})`);
    setMaxOriginalColors(uniqueOriginalColors.size);
  }, [originalImage, selection.x, selection.y, selection.width, selection.height, displayScale]);

  const processAndDisplay = useCallback(async () => {
    if (!originalImage || selection.width <= 0 || selection.height <= 0 || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);

    calculateMaxColorsInSelection();
    await new Promise(resolve => setTimeout(resolve, 10));

    const { numColors: targetNumColors, poolingAlgorithm } = gridConfig;
    let L_base = 0, basePixelatedData: string[] = [], baseUniqueColors = new Set<string>();
    let bestLForBase = 0, colorsAtBestLForBase = 0, minDiffForBaseSearch = Infinity;
    const maxLToTry = 16;

    for (let currentL = 2; currentL <= maxLToTry; currentL++) {
        const { pixelatedData, uniqueColors } = generatePixelDataWithLevels(currentL, poolingAlgorithm);
        const numUnique = uniqueColors.size;
        if (numUnique >= targetNumColors) {
            if (L_base === 0 || numUnique < baseUniqueColors.size) { L_base = currentL; basePixelatedData = pixelatedData; baseUniqueColors = uniqueColors; }
        }
        const diff = Math.abs(numUnique - targetNumColors);
        if (diff < minDiffForBaseSearch || (diff === minDiffForBaseSearch && numUnique > colorsAtBestLForBase) ) {
            minDiffForBaseSearch = diff; bestLForBase = currentL; colorsAtBestLForBase = numUnique;
            if (L_base === 0) { basePixelatedData = pixelatedData; baseUniqueColors = uniqueColors; }
        }
        if (poolingAlgorithm === 'mode' && numUnique <= targetNumColors && numUnique < 5 && currentL > 5) break;
    }
    if (L_base === 0) {
        L_base = bestLForBase || 2;
        const res = generatePixelDataWithLevels(L_base, poolingAlgorithm);
        basePixelatedData = res.pixelatedData; baseUniqueColors = res.uniqueColors;
    }
    setLValueUsed(String(L_base));

    let workingPixelData = [...basePixelatedData];
    let currentPaletteArray = Array.from(baseUniqueColors);
    let mPerformed = false;
    const pixelColorMap: Record<string, string> = {};
    currentPaletteArray.forEach(c => pixelColorMap[c] = c);

    if (currentPaletteArray.length > targetNumColors && targetNumColors > 0) {
        mPerformed = true;
        while (currentPaletteArray.length > targetNumColors) {
            if (currentPaletteArray.length <= 1) break;
            let minDist = Infinity, c1_idx = -1, c2_idx = -1;
            for (let i = 0; i < currentPaletteArray.length; i++) {
                for (let j = i + 1; j < currentPaletteArray.length; j++) {
                    const dist = colorDistance(currentPaletteArray[i], currentPaletteArray[j]);
                    if (dist < minDist) { minDist = dist; c1_idx = i; c2_idx = j; }
                }
            }
            if (c1_idx === -1 || c2_idx === -1) break;
            const colorToMerge1 = currentPaletteArray[c1_idx], colorToMerge2 = currentPaletteArray[c2_idx];
            const mergedColor = averageColors(colorToMerge1, colorToMerge2);
            currentPaletteArray.splice(Math.max(c1_idx, c2_idx), 1);
            currentPaletteArray.splice(Math.min(c1_idx, c2_idx), 1);
            if (!currentPaletteArray.includes(mergedColor)) currentPaletteArray.push(mergedColor);
            for (const oKey in pixelColorMap) {
                if (pixelColorMap[oKey] === colorToMerge1 || pixelColorMap[oKey] === colorToMerge2) pixelColorMap[oKey] = mergedColor;
            }
        }
    }
    setMergingPerformed(mPerformed);

    const finalPixelData = workingPixelData.map(color => pixelColorMap[color] || color);
    setCurrentPixelDataForRemap(finalPixelData);
    const finalPalette = new Set(currentPaletteArray);
    setCurrentPaletteForRemap(finalPalette);

    if (finalPixelData.length > 0) {
        setOutputGridData(finalPixelData); setOutputPaletteData(Array.from(finalPalette));
        const initialRemaps: Record<string, string> = {};
        finalPalette.forEach(color => initialRemaps[color] = rgbToHex(color));
        setRemapColorInputs(initialRemaps);
    } else {
        setOutputGridData(null); setOutputPaletteData(null);
    }
    setIsLoading(false);
    isLoadingRef.current = false;
  }, [ originalImage, selection.width, selection.height, selection.x, selection.y,
       gridConfig.numColors, gridConfig.poolingAlgorithm, gridConfig.cols, gridConfig.rows,
       generatePixelDataWithLevels, calculateMaxColorsInSelection ]);

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
    setMergingPerformed(true); setLValueUsed("N/A (Remapped)");
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
    <Modal isOpen={isOpen} onClose={handleCloseModal} title="Image to Chart Processor" size="full">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2 lg:w-1/3 flex flex-col gap-3 pr-2">
          <div>
            <label htmlFor="image-loader-modal" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">1. Import Image</label>
            <input type="file" id="image-loader-modal" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-primary/80"/>
          </div>
          {originalImage && (
            <>
            <div ref={imageContainerRef} className="relative border border-neutral-300 dark:border-neutral-600 max-w-full mx-auto bg-neutral-200 dark:bg-neutral-700 self-start" style={{ display: 'inline-block' }}>
                <canvas ref={displayCanvasRef} className="block cursor-crosshair max-w-full" />
                <div ref={selectionBoxRef} onMouseDown={handleSelectionMouseDown} className="absolute border-2 border-dashed border-red-500 box-border cursor-move" style={{ display: 'none' }}>
                    {['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map(handle => (
                        <div key={handle} onMouseDown={(e) => handleResizeHandleMouseDown(e, handle)} className={`absolute w-2.5 h-2.5 bg-blue-500 border border-white box-border
                            ${handle.includes('n') ? 'top-[-5px]' : ''} ${handle.includes('s') ? 'bottom-[-5px]' : ''} ${handle.includes('w') ? 'left-[-5px]' : ''} ${handle.includes('e') ? 'right-[-5px]' : ''}
                            ${(handle === 'n' || handle === 's') ? 'left-1/2 -translate-x-1/2 cursor-ns-resize' : ''}
                            ${(handle === 'w' || handle === 'e') ? 'top-1/2 -translate-y-1/2 cursor-ew-resize' : ''}
                            ${handle === 'nw' ? 'cursor-nwse-resize' : ''} ${handle === 'ne' ? 'cursor-nesw-resize' : ''}
                            ${handle === 'sw' ? 'cursor-nesw-resize' : ''} ${handle === 'se' ? 'cursor-nwse-resize' : ''}
                        `}/>
                    ))}
                </div>
            </div>
            <div className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded text-xs">
                Max original colors in selection: {maxOriginalColors !== null ? maxOriginalColors.toLocaleString() : "N/A"}
            </div>
            <div>
                <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">2. Configure Pixelation:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <label htmlFor="grid-cols-modal">Grid Cols:</label>
                        <input
                            type="number" id="grid-cols-modal" value={gridConfig.cols}
                            onChange={e => setGridConfig(p => ({...p, cols: Math.min(MAX_CHART_COLS, Math.max(1, parseInt(e.target.value) || 1))}))}
                            min="1" max={MAX_CHART_COLS}
                            className="w-full mt-1 p-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
                        />
                    </div>
                    <div>
                        <label htmlFor="grid-rows-modal">Grid Rows:</label>
                        <input
                            type="number" id="grid-rows-modal" value={gridConfig.rows}
                            onChange={e => setGridConfig(p => ({...p, rows: Math.min(MAX_CHART_ROWS, Math.max(1, parseInt(e.target.value) || 1))}))}
                            min="1" max={MAX_CHART_ROWS}
                            className="w-full mt-1 p-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
                        />
                    </div>
                    <div><label htmlFor="num-colors-modal">Target Colors:</label><input type="number" id="num-colors-modal" value={gridConfig.numColors} onChange={e => setGridConfig(p => ({...p, numColors: parseInt(e.target.value) || 1}))} min="1" max="256" className="w-full mt-1 p-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"/></div>
                    <div><label htmlFor="pooling-algo-modal">Color Averaging:</label><select id="pooling-algo-modal" value={gridConfig.poolingAlgorithm} onChange={e => setGridConfig(p => ({...p, poolingAlgorithm: e.target.value as 'mean'|'mode'}))} className="w-full mt-1 p-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"><option value="mean">Mean</option><option value="mode">Mode (Dominant)</option></select></div>
                </div>
            </div>
            </>
          )}
        </div>

        <div className="md:w-1/2 lg:w-2/3 flex flex-col gap-3 pr-2">
          {outputGridData && outputPaletteData && (
            <>
            <div>
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">3. Pixelated Output & Palette:</h3>
                <div className="border border-neutral-300 dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-700 p-1 mx-auto mb-2" style={{ width: 'fit-content', maxWidth: '100%'}}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
                        width: outputGridDisplaySize,
                        height: Math.max(10, outputGridDisplaySize / outputGridAspectRatio), // Ensure min height
                        imageRendering: 'pixelated' as any,
                        border: '1px solid #333'
                        }}>
                        {outputGridData.map((color, i) => <div key={`gridcell-${i}`} className="w-full h-full" style={{ backgroundColor: color }} />)}
                    </div>
                </div>
                <div className="mt-1 p-2 bg-neutral-100 dark:bg-neutral-700 rounded text-xs">
                    <p>Algorithm: {gridConfig.poolingAlgorithm}. Target Colors: {gridConfig.numColors}. Achieved: <strong>{outputPaletteData.length}</strong> colors.</p>
                    <p>(Initial Quantization L-value: {LValueUsed}) {mergingPerformed ? "(Colors merged / remapped)" : "(Original quantization)"}</p>
                    <div className="mt-1 max-h-32 overflow-y-auto custom-scrollbar border p-1.5 rounded dark:border-neutral-600 space-y-1">
                        {outputPaletteData.sort((a,b) => colorDistance('rgb(0,0,0)',a) - colorDistance('rgb(0,0,0)',b)).map(originalColorRgb => (
                            <div key={`palette-${originalColorRgb}`} className="flex items-center gap-2 text-xs">
                                <div className="w-5 h-5 border border-black flex-shrink-0" style={{ backgroundColor: originalColorRgb }} />
                                <span className="truncate text-neutral-600 dark:text-neutral-400 w-28" title={originalColorRgb}>{rgbToHex(originalColorRgb)}</span>
                                <span className="text-neutral-500 dark:text-neutral-400">→</span>
                                <input type="color" value={remapColorInputs[originalColorRgb] || rgbToHex(originalColorRgb)} onChange={e => handleRemapColorChange(originalColorRgb, e.target.value)} className="w-8 h-6 p-0.5 border rounded dark:bg-neutral-700 dark:border-neutral-600 cursor-pointer"/>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                        <Button onClick={handleApplyRemap} className="text-sm" size="sm">Apply Color Remap</Button>
                        <Button onClick={handleResetColorMap} variant="outline" className="text-sm" size="sm" disabled={isLoading || !originalImage}>Reset Color Map</Button>
                    </div>
                </div>
            </div>
            </>
          )}
        </div>
      </div>

      <canvas ref={sourceCanvasRef} style={{ display: 'none' }} />

      <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end space-x-2">
        <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
        <Button onClick={handleFinalizeChart} disabled={!outputGridData || !outputPaletteData || isLoading} variant="primary">
          Create Chart from Image
        </Button>
      </div>
    </Modal>
  );
};
