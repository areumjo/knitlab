import React from 'react';
import { StitchSymbolDisplayProps } from '../types';
import { DEFAULT_STITCH_SYMBOLS, THEME_DEFAULT_SYMBOL_COLOR_SENTINEL, DEFAULT_STITCH_COLOR_DARK, DEFAULT_STITCH_COLOR_LIGHT } from '../constants';

const getSymbolSVG = (
  symbolDef: typeof DEFAULT_STITCH_SYMBOLS[number],
  cellSize: number,
  color: string
): React.ReactElement | null => {
  if (!symbolDef?.svgContent) return null;

  const svgDisplaySizeRatio = 0.85;
  const widthPx = `${cellSize * svgDisplaySizeRatio}px`;
  const heightPx = `${cellSize * svgDisplaySizeRatio}px`;

  // Case 1: Already a full SVG
  if (symbolDef.svgContent.includes('<svg')) {
    return (
      <div
        style={{ width: widthPx, height: heightPx }}
        dangerouslySetInnerHTML={{ __html: symbolDef.svgContent }}
      />
    );
  }

  // Case 2: Raw content like <path> or <g>
  const viewBox =
    symbolDef.viewBox ||
    symbolDef.svgContent.match(/viewBox\s*=\s*["']([^"']+)["']/)?.[1] ||
    '0 0 24 24';

  return (
    <svg
      width={widthPx}
      height={heightPx}
      viewBox={viewBox}
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: symbolDef.svgContent }}
    />
  );
};

export const StitchSymbolDisplay: React.FC<StitchSymbolDisplayProps> = ({
  keyDef,
  allStitchSymbols = DEFAULT_STITCH_SYMBOLS,
  className = '',
  cellSize = 24,
  keyPartRowOffset,
  keyPartColOffset,
  isDarkMode = false,
}) => {
  if (!keyDef) {
    return <div className={`w-full h-full ${className}`} style={{ backgroundColor: 'transparent' }} />;
  }

  const { width: keyWidth, height: keyHeight, symbolColor: rawSymbolColor, lines, cells } = keyDef;

  let effectiveSymbolColor = rawSymbolColor;
  if (rawSymbolColor === THEME_DEFAULT_SYMBOL_COLOR_SENTINEL) {
    effectiveSymbolColor = isDarkMode ? DEFAULT_STITCH_COLOR_DARK : DEFAULT_STITCH_COLOR_LIGHT;
  }

  const displayStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    userSelect: 'none',
    position: 'relative',
    color: effectiveSymbolColor,
  };

  // 🔷 Render key part if we're rendering a single part of a larger key
  if (keyPartRowOffset !== undefined && keyPartColOffset !== undefined && (keyWidth > 1 || keyHeight > 1)) {
    const rOff = keyPartRowOffset;
    const cOff = keyPartColOffset;

    if (lines && lines.length > 0) {
      return (
        <div style={displayStyle} className={className} title={keyDef.name}>
          <svg
            width="100%"
            height="100%"
            viewBox={`${cOff * cellSize} ${rOff * cellSize} ${cellSize} ${cellSize}`}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            preserveAspectRatio="xMidYMid meet"
          >
            {lines.map((line, index) => (
              <line
                key={`key-line-part-${index}`}
                x1={line.start.x * cellSize}
                y1={line.start.y * cellSize}
                x2={line.end.x * cellSize}
                y2={line.end.y * cellSize}
                stroke={effectiveSymbolColor}
                strokeWidth={Math.max(1, cellSize * 0.08)}
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      );
    } else if (cells && cells[rOff] && cells[rOff][cOff]) {
      const cellData = cells[rOff][cOff];
      if (cellData?.type === 'svg') {
        const symbolDef = allStitchSymbols.find((s) => s.id === cellData.value);
        return (
          <div style={displayStyle} className={className} title={keyDef.name}>
            {symbolDef ? getSymbolSVG(symbolDef, cellSize, effectiveSymbolColor) : null}
          </div>
        );
      } else if (cellData?.type === 'text') {
        const fontSize = Math.max(8, cellSize * 0.6);
        return (
          <div style={displayStyle} className={className} title={keyDef.name}>
            <span style={{ fontSize, lineHeight: '1', fontFamily: 'monospace', color: effectiveSymbolColor }}>
              {cellData.value.charAt(0)}
            </span>
          </div>
        );
      }
    }
    return <div className={`w-full h-full ${className}`} title={keyDef.name} style={{ backgroundColor: 'transparent' }} />;
  }

  // 🔷 Single cell (1x1) key
  else if (keyWidth === 1 && keyHeight === 1) {
    if (lines && lines.length > 0) {
      return (
        <div style={displayStyle} className={className} title={keyDef.name}>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${cellSize} ${cellSize}`}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            {lines.map((line, index) => (
              <line
                key={`key-line-1x1-${index}`}
                x1={line.start.x * cellSize}
                y1={line.start.y * cellSize}
                x2={line.end.x * cellSize}
                y2={line.end.y * cellSize}
                stroke={effectiveSymbolColor}
                strokeWidth={Math.max(1, cellSize * 0.08)}
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      );
    } else if (cells && cells[0] && cells[0][0]) {
      const cellData = cells[0][0];
      if (cellData.type === 'svg') {
        const symbolDef = allStitchSymbols.find((s) => s.id === cellData.value);
        return (
          <div style={displayStyle} className={className} title={keyDef.name}>
            {symbolDef ? getSymbolSVG(symbolDef, cellSize, effectiveSymbolColor) : null}
          </div>
        );
      } else if (cellData.type === 'text') {
        const fontSize = Math.max(8, cellSize * 0.6);
        return (
          <div style={displayStyle} className={className} title={keyDef.name}>
            <span style={{ fontSize: `${fontSize}px`, lineHeight: '1', fontFamily: 'monospace', color: effectiveSymbolColor }}>
              {cellData.value.charAt(0)}
            </span>
          </div>
        );
      }
    }
  }

  // 🔷 Multi-cell preview (MxN)
  else if (keyWidth > 1 || keyHeight > 1) {
    const unitSize = cellSize / Math.max(keyWidth, keyHeight);

    if (lines && lines.length > 0) {
      return (
        <div style={displayStyle} className={className} title={keyDef.name}>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${keyWidth * unitSize} ${keyHeight * unitSize}`}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            {lines.map((line, index) => (
              <line
                key={`key-line-mxn-preview-${index}`}
                x1={line.start.x * unitSize}
                y1={line.start.y * unitSize}
                x2={line.end.x * unitSize}
                y2={line.end.y * unitSize}
                stroke={effectiveSymbolColor}
                strokeWidth={Math.max(1, unitSize * 0.08)}
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      );
    } else if (cells) {
      const baseFontSize = Math.min(unitSize * 0.7, 14);
      const fontSize = Math.max(6, baseFontSize);
      return (
        <div style={displayStyle} className={className} title={keyDef.name}>
          <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${keyWidth}, 1fr)`,
              gridTemplateRows: `repeat(${keyHeight}, 1fr)`,
              width: '100%', height: '100%', color: effectiveSymbolColor
          }}>
            {cells.map((row, rIdx) =>
              row.map((cellData, cIdx) => (
                <div key={`preview-mxn-cell-${rIdx}-${cIdx}`}
                     style={{
                         width: '100%', height: '100%',
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         fontSize: `${fontSize}px`,
                         lineHeight: '1',
                         fontFamily: 'monospace',
                         overflow: 'hidden',
                     }}
                >
                  {cellData ? (
                      cellData.type === 'text' ? cellData.value.charAt(0) :
                      (cellData.type === 'svg' ?
                          (allStitchSymbols.find(s => s.id === cellData.value)?.abbreviation || '?')
                          : '')
                  ) : ''}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  }

  return <div className={`w-full h-full ${className}`} title={keyDef.name} style={{ backgroundColor: 'transparent' }} />;
};
