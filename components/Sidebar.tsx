
// This file is deprecated and replaced by TabbedSidebar.tsx.
// Its contents have been moved and adapted.
// This file can be safely deleted.
//
// import React, { useState } from 'react';
// import { Tool, StitchSymbolDef, Layer, Point, ChartState as GlobalChartState } from '../types'; 
// import { SymbolPalette } from './SymbolPalette';
// import { LayerPanel } from './LayerPanel';
// import { MiniMap } from './MiniMap';
// import { ColorPicker } from './ColorPicker';
// import { GripVerticalIcon } from './Icon';

// interface SidebarProps {
//   allSymbols: StitchSymbolDef[];
//   activeSymbolId: string | null;
//   onSymbolSelect: (symbolId: string) => void;
//   onAddCustomSymbol: () => void;

//   activeColor: string; 
//   onColorChange: (color: string) => void; 

//   layers: Layer[]; 
//   activeLayerId: string | null;
//   onLayerSelect: (id: string) => void;
//   onAddLayer: () => void;
//   onRemoveLayer: (id: string) => void;
//   onToggleLayerVisibility: (id: string) => void;
//   onSelectAllActiveLayer: () => void; 

//   chartState: GlobalChartState; 
//   currentStitchColor: string; 

//   mainCanvasViewport: { x: number; y: number; width: number; height: number }; 
//   mainCanvasZoom: number;
//   onMiniMapPan: (targetCenterGridCoords: Point) => void; 
//   mainCanvasSize: {width: number, height: number};
//   isDarkMode: boolean; 
// }

// export const Sidebar: React.FC<SidebarProps> = ({
//   allSymbols, activeSymbolId, onSymbolSelect, onAddCustomSymbol,
//   activeColor, onColorChange,
//   layers, activeLayerId, onLayerSelect, onAddLayer, onRemoveLayer, onToggleLayerVisibility, onSelectAllActiveLayer,
//   chartState, currentStitchColor, 
//   mainCanvasViewport, mainCanvasZoom, onMiniMapPan, mainCanvasSize,
//   isDarkMode 
// }) => {
//   const [width, setWidth] = useState(260); 
//   const [isResizing, setIsResizing] = useState(false);

//   const minWidth = 200; 
//   const maxWidth = 450; 

//   const handleMouseDownResize = (e: React.MouseEvent) => {
//     e.preventDefault();
//     setIsResizing(true);
//   };

//   const handleMouseUpResize = React.useCallback(() => {
//     setIsResizing(false);
//   }, []);

//   const handleMouseMoveResize = React.useCallback((e: MouseEvent) => {
//     if (!isResizing) return;
//     let newWidth = e.clientX; 
//     if (newWidth < minWidth) newWidth = minWidth;
//     if (newWidth > maxWidth) newWidth = maxWidth;
//     setWidth(newWidth);
//   }, [isResizing, minWidth, maxWidth]);
  
//   React.useEffect(() => {
//     if (isResizing) {
//       document.addEventListener('mousemove', handleMouseMoveResize);
//       document.addEventListener('mouseup', handleMouseUpResize);
//     } else {
//       document.removeEventListener('mousemove', handleMouseMoveResize);
//       document.removeEventListener('mouseup', handleMouseUpResize);
//     }
//     return () => {
//       document.removeEventListener('mousemove', handleMouseMoveResize);
//       document.removeEventListener('mouseup', handleMouseUpResize);
//     };
//   }, [isResizing, handleMouseMoveResize, handleMouseUpResize]);

//   return (
//     <aside 
//       className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex flex-col border-r border-neutral-200 dark:border-neutral-700 print:hidden relative"
//       style={{ width: `${width}px` }}
//     >
//       <div className="flex-grow overflow-y-auto flex flex-col">
//         <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
//           <ColorPicker initialColor={activeColor} onChange={onColorChange} label="Active Cell Color" />
//         </div>
        
//         <div className="border-b border-neutral-200 dark:border-neutral-700">
//          <SymbolPalette
//             symbols={allSymbols}
//             activeSymbolId={activeSymbolId}
//             onSymbolSelect={onSymbolSelect}
//             onAddCustomSymbol={onAddCustomSymbol}
//             currentStitchColor={currentStitchColor}
//           />
//         </div>
        
//         <div className="border-b border-neutral-200 dark:border-neutral-700">
//           <LayerPanel
//             layers={layers} 
//             activeLayerId={activeLayerId} 
//             onLayerSelect={onLayerSelect}
//             onAddLayer={onAddLayer}
//             onRemoveLayer={onRemoveLayer}
//             onToggleLayerVisibility={onToggleLayerVisibility}
//             onSelectAllActiveLayer={onSelectAllActiveLayer} 
//           />
//         </div>
        
//         <div className="flex-grow border-t border-neutral-200 dark:border-neutral-700 flex flex-col min-h-[280px]"> 
//           <MiniMap 
//             chartState={chartState} 
//             viewport={mainCanvasViewport} 
//             canvasZoom={mainCanvasZoom}
//             onPan={onMiniMapPan}
//             canvasSize={mainCanvasSize}
//             isDarkMode={isDarkMode} 
//           />
//         </div>
//       </div>

//       <div 
//         className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize flex items-center justify-center group"
//         onMouseDown={handleMouseDownResize}
//       >
//         <GripVerticalIcon className="text-neutral-400 dark:text-neutral-500 group-hover:text-primary w-3 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
//       </div>
//     </aside>
//   );
// };
