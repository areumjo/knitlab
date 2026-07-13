
import React from 'react';
import { Tool } from '../types';
import { Button } from './Button';
import { PenIcon, LineIcon, RectangleIcon, FillIcon, SelectIcon, MoveIcon, CopyIcon, CutIcon, PasteIcon } from './Icon';

interface FloatingToolPaletteProps {
  activeTool: Tool;
  onToolSelect: (tool: Tool) => void;
  isSelectionActive: boolean;

  onRequestApplyActiveKeyToSelection: () => void;
  onRequestClearSelectionArea: () => void;
  onRequestClearAllInSelection: () => void;

  onCopySelection: () => void;
  onCutSelection: () => void;
  onPasteFromClipboard: () => void;
  canCopy: boolean;
  canCut: boolean;
  canPaste: boolean;
  activeKeyIsSolid: boolean;
}

interface ToolDefinition {
  tool?: Tool;
  label: string;
  icon: React.ReactNode;
  action?: (() => void);
  disabled?: boolean;
}

export const FloatingToolPalette = React.forwardRef<HTMLDivElement, FloatingToolPaletteProps>(({
    activeTool,
    onToolSelect,
    onCopySelection,
    onCutSelection,
    onPasteFromClipboard,
    canCopy,
    canCut,
    canPaste,
    activeKeyIsSolid,
}, ref) => {

  const mainTools: ToolDefinition[] = [
    { tool: Tool.Pen, label: 'Paint color', icon: <PenIcon /> },
    { tool: Tool.Line, label: 'Draw line', icon: <LineIcon />, disabled: !activeKeyIsSolid },
    { tool: Tool.Rectangle, label: 'Draw rectangle', icon: <RectangleIcon />, disabled: !activeKeyIsSolid },
    { tool: Tool.Fill, label: 'Flood fill', icon: <FillIcon />, disabled: !activeKeyIsSolid },
  ];

  const selectAndClipboardTools: ToolDefinition[] = [
    { tool: Tool.Select, label: 'Select area', icon: <SelectIcon /> },
    { label: 'Copy', icon: <CopyIcon />, action: onCopySelection, disabled: !canCopy },
    { label: 'Cut', icon: <CutIcon />, action: onCutSelection, disabled: !canCut },
    { label: 'Paste', icon: <PasteIcon />, action: onPasteFromClipboard, disabled: !canPaste },
  ];

  const utilityTools: ToolDefinition[] = [
    { tool: Tool.Move, label: 'Pan view', icon: <MoveIcon /> },
  ];

  const renderButtonGroup = (group: ToolDefinition[], groupName: string) => (
    <div className="flex items-center space-x-0.5" role="group" aria-label={groupName}>
      {group.map(({ tool, label, icon, action, disabled }) => (
        <Button
          key={tool || label}
          variant={tool && activeTool === tool ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            if (tool) onToolSelect(tool);
            else if (action) action();
          }}
          title={label}
          className={`p-2 relative ${(tool && activeTool === tool) ? 'ring-2 ring-accent dark:ring-accent' : ''}`}
          aria-label={label}
          aria-pressed={tool ? activeTool === tool : undefined}
          disabled={disabled}
        >
          {icon}
        </Button>
      ))}
    </div>
  );

  return (
    <div ref={ref} className="fixed inset-x-0 bottom-0 z-20 overflow-x-auto px-2 pb-2 print:hidden md:bottom-4 md:flex md:justify-center md:pb-0">
      <div className="w-max flex flex-col items-center space-y-1">
        <div className="flex items-center space-x-1 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-lg shadow-xl border border-neutral-300 dark:border-neutral-700">
          {renderButtonGroup(mainTools, "Main Tools")}
          <div className="h-8 border-l border-neutral-300 dark:border-neutral-600 mx-1"></div>
          {renderButtonGroup(selectAndClipboardTools, "Select and Clipboard Tools")}
          <div className="h-8 border-l border-neutral-300 dark:border-neutral-600 mx-1"></div>
          {renderButtonGroup(utilityTools, "Utility Tools")}
        </div>
      </div>
    </div>
  );
});

FloatingToolPalette.displayName = 'FloatingToolPalette';
