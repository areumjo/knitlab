
// This file is deprecated and replaced by FloatingToolPalette.tsx.
// Its contents have been moved and adapted.
// This file can be safely deleted.
//
// import React from 'react';
// import { Tool } from '../types';
// import { Button } from './Button';
// import { PenIcon, EraserIcon, FillIcon, SelectIcon, PaletteIcon, CheckSquareIcon, MoveIcon as MoveIconSvg } from './Icon';

// const MoveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5" /></svg>;
// const ApplyColorIcon = () => <CheckSquareIcon className="w-5 h-5" />; 

// interface ToolButtonProps {
//   label: string;
//   icon: React.ReactNode;
//   tool?: Tool; 
//   activeTool?: Tool;
//   onClick: () => void;
//   hotkey?: string;
//   disabled?: boolean;
//   title?: string; 
// }

// const TopToolButton: React.FC<ToolButtonProps> = ({ label, icon, tool, activeTool, onClick, hotkey, disabled, title }) => (
//   <Button
//     variant={tool && activeTool === tool ? 'primary' : 'ghost'}
//     size="sm"
//     onClick={onClick}
//     title={title ?? (hotkey ? `${label} (${hotkey})` : label)}
//     className={`p-2 flex flex-col items-center h-auto min-w-[50px] ${tool && activeTool === tool ? 'ring-2 ring-accent dark:ring-accent' : ''}`}
//     aria-pressed={tool ? activeTool === tool : undefined}
//     disabled={disabled}
//   >
//     {icon}
//     {hotkey && <span className="text-xs mt-0.5 text-neutral-500 dark:text-neutral-400">{hotkey}</span>}
//     <span className="sr-only">{label}{hotkey ? ` (${hotkey})` : ''}</span>
//   </Button>
// );

// interface TopToolbarProps {
//   activeTool: Tool;
//   onToolSelect: (tool: Tool) => void;
//   onApplyColorToSelection: () => void;
//   isSelectionActive: boolean; 
// }

// export const TopToolbar: React.FC<TopToolbarProps> = ({ activeTool, onToolSelect, onApplyColorToSelection, isSelectionActive }) => {
//   const tools: { label: string; icon: React.ReactNode; tool: Tool, hotkey: string }[] = [
//     { label: 'Pen Tool', icon: <PenIcon />, tool: Tool.Pen, hotkey: '1' },
//     { label: 'Eraser Tool', icon: <EraserIcon />, tool: Tool.Eraser, hotkey: '2' },
//     { label: 'Fill Tool', icon: <FillIcon />, tool: Tool.Fill, hotkey: '3' },
//     { label: 'Select Tool', icon: <SelectIcon />, tool: Tool.Select, hotkey: '4' },
//     { label: 'Color Active Cell', icon: <PaletteIcon />, tool: Tool.ColorPicker, hotkey: '5' }, 
//     { label: 'Move/Pan Tool', icon: <MoveIcon/>, tool: Tool.Move, hotkey: '6' },
//   ];

//   return (
//     <div className="bg-neutral-100 dark:bg-neutral-800 border-b dark:border-neutral-700 p-1.5 flex items-center space-x-1 print:hidden">
//       {tools.map(({ label, icon, tool, hotkey }) => (
//         <TopToolButton
//           key={tool}
//           label={label}
//           icon={icon}
//           tool={tool}
//           activeTool={activeTool}
//           onClick={() => onToolSelect(tool)}
//           hotkey={hotkey}
//         />
//       ))}
//       <div className="h-8 border-l border-neutral-300 dark:border-neutral-600 mx-2"></div>
//       <TopToolButton
//         label="Apply Color to Selection"
//         icon={<PaletteIcon className="w-5 h-5"/>}
//         onClick={onApplyColorToSelection}
//         disabled={!isSelectionActive}
//         title={isSelectionActive ? "Apply active cell color to current selection" : "No selection active"}
//       />
//     </div>
//   );
// };
