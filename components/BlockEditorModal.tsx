import React, { useCallback, useEffect, useState } from 'react';
import type { KeyDefinition } from '../types';
import {
  DEFAULT_STITCH_COLOR_DARK,
  DEFAULT_STITCH_COLOR_LIGHT,
  MAX_KEY_HEIGHT,
  MAX_KEY_WIDTH,
  THEME_DEFAULT_BACKGROUND_SENTINEL,
  generateNewKeyId,
  resolveKeyCellBackgroundColor,
} from '../constants';
import { Button } from './Button';
import { Modal } from './Modal';

interface BlockEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: KeyDefinition) => void;
  existingBlock: KeyDefinition | null;
  paletteColors: string[];
  isDarkMode: boolean;
}

const CELL_SIZE = 32;
const CLEAR = null as string | null;

function makeCells(
  rows: number,
  cols: number,
  fill: (row: number, col: number) => string | null,
): (string | null)[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => fill(row, col)),
  );
}

export const BlockEditorModal: React.FC<BlockEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingBlock,
  paletteColors,
  isDarkMode,
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(2);
  const [cells, setCells] = useState<(string | null)[][]>(makeCells(2, 2, () => CLEAR));
  const [activeColor, setActiveColor] = useState<string | null>('#C2413A');

  const reset = useCallback(() => {
    if (existingBlock) {
      const nextWidth = Math.max(1, existingBlock.width);
      const nextHeight = Math.max(1, existingBlock.height);
      setId(existingBlock.id);
      setName(existingBlock.name);
      setWidth(nextWidth);
      setHeight(nextHeight);
      setCells(makeCells(nextHeight, nextWidth, (row, col) => existingBlock.colorCells?.[row]?.[col] ?? CLEAR));
      setActiveColor(
        existingBlock.colorCells?.flat().find((color): color is string => typeof color === 'string')
        ?? paletteColors[0]
        ?? '#C2413A',
      );
      return;
    }

    const first = paletteColors[0] ?? '#C2413A';
    const second = paletteColors[1] ?? CLEAR;
    setId(generateNewKeyId().replace(/^key_/, 'key_color_block_'));
    setName('Color block');
    setWidth(2);
    setHeight(2);
    setCells(makeCells(2, 2, (row, col) => ((row + col) % 2 === 0 ? first : second)));
    setActiveColor(first);
  }, [existingBlock, paletteColors]);

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  const resize = (nextWidth: number, nextHeight: number) => {
    const clampedWidth = Math.min(MAX_KEY_WIDTH, Math.max(1, nextWidth));
    const clampedHeight = Math.min(MAX_KEY_HEIGHT, Math.max(1, nextHeight));
    setCells((previous) => makeCells(
      clampedHeight,
      clampedWidth,
      (row, col) => previous[row]?.[col] ?? CLEAR,
    ));
    setWidth(clampedWidth);
    setHeight(clampedHeight);
  };

  const paint = (row: number, col: number) => {
    setCells((previous) => previous.map((currentRow, rowIndex) =>
      currentRow.map((color, colIndex) => (
        rowIndex === row && colIndex === col ? activeColor : color
      )),
    ));
  };

  const save = () => {
    onSave({
      id,
      name: name.trim() || 'Color block',
      abbreviation: null,
      width,
      height,
      backgroundColor: THEME_DEFAULT_BACKGROUND_SENTINEL,
      symbolColor: isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT,
      colorCells: cells.map((row) => [...row]),
      cells: [[null]],
    });
    onClose();
  };

  const swatches = Array.from(new Set([
    ...paletteColors,
    ...(activeColor && !paletteColors.includes(activeColor) ? [activeColor] : []),
  ]));
  const hasColor = cells.some((row) => row.some((color) => color !== null));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingBlock ? 'Edit color block' : 'New color block'}
      size="md"
    >
      <div className="space-y-4">
        <label className="block">
          <span className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Name</span>
          <input
            type="text"
            name="block-name"
            autoComplete="off"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
          />
        </label>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-neutral-600 dark:text-neutral-400">Width</span>
            <Button type="button" variant="ghost" size="xs" onClick={() => resize(width - 1, height)} disabled={width <= 1}>-</Button>
            <span className="w-6 text-center font-medium">{width}</span>
            <Button type="button" variant="ghost" size="xs" onClick={() => resize(width + 1, height)} disabled={width >= MAX_KEY_WIDTH}>+</Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-600 dark:text-neutral-400">Height</span>
            <Button type="button" variant="ghost" size="xs" onClick={() => resize(width, height - 1)} disabled={height <= 1}>-</Button>
            <span className="w-6 text-center font-medium">{height}</span>
            <Button type="button" variant="ghost" size="xs" onClick={() => resize(width, height + 1)} disabled={height >= MAX_KEY_HEIGHT}>+</Button>
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Paint color</span>
          <div className="flex flex-wrap items-center gap-2">
            {swatches.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={`Use ${color}`}
                aria-pressed={activeColor === color}
                onClick={() => setActiveColor(color)}
                className={`h-8 w-8 rounded border-2 ${activeColor === color ? 'border-primary ring-2 ring-primary/30' : 'border-neutral-300 dark:border-neutral-600'}`}
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              title="Use chart background"
              aria-label="Use chart background"
              aria-pressed={activeColor === null}
              onClick={() => setActiveColor(null)}
              className={`h-8 w-8 rounded border-2 bg-neutral-100 dark:bg-neutral-700 ${activeColor === null ? 'border-primary ring-2 ring-primary/30' : 'border-neutral-300 dark:border-neutral-600'}`}
            />
            <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded border-2 border-dashed border-neutral-400 text-neutral-500 hover:border-primary" title="Choose another color">
              +
              <input
                type="color"
                name="block-color"
                aria-label="Choose another color"
                className="sr-only"
                onChange={(event) => setActiveColor(event.target.value.toUpperCase())}
              />
            </label>
          </div>
        </div>

        <div className="max-h-[45vh] overflow-auto py-2">
          <div
            className="mx-auto grid w-max gap-px border border-neutral-300 bg-neutral-300 dark:border-neutral-600 dark:bg-neutral-600"
            style={{ gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)` }}
          >
            {cells.flatMap((row, rowIndex) => row.map((_color, colIndex) => (
              <button
                key={`${rowIndex}:${colIndex}`}
                type="button"
                onClick={() => paint(rowIndex, colIndex)}
                aria-label={`Cell ${rowIndex + 1}, ${colIndex + 1}`}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: resolveKeyCellBackgroundColor(
                    { backgroundColor: THEME_DEFAULT_BACKGROUND_SENTINEL, colorCells: cells },
                    rowIndex,
                    colIndex,
                    isDarkMode,
                  ),
                }}
              />
            )))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={save} disabled={!hasColor}>{existingBlock ? 'Save block' : 'Add block'}</Button>
        </div>
      </div>
    </Modal>
  );
};
