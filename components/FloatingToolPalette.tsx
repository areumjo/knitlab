
import React from 'react';
import { Tool } from '../types';
import { Button } from './Button';
import { PenIcon, SelectIcon, MoveIcon, CopyIcon, CutIcon, PasteIcon } from './Icon';

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
}

interface ToolDefinition {
  tool?: Tool;
  label: string;
  icon: React.ReactNode;
  hotkeyDescription?: string;
  hotkeyDisplay?: string; // For visual badge
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
}, ref) => {

  const mainTools: ToolDefinition[] = [
    { tool: Tool.Pen, label: 'Apply Key / Eraser', icon: <PenIcon />, hotkeyDescription: 'Use with selected key (Empty key for eraser)', hotkeyDisplay: 'A' },
  ];

  const selectAndClipboardTools: ToolDefinition[] = [
    { tool: Tool.Select, label: 'Select Area', icon: <SelectIcon />, hotkeyDescription: 'Drag to select', hotkeyDisplay: 'S' },
    { label: 'Copy', icon: <CopyIcon />, action: onCopySelection, disabled: !canCopy, hotkeyDescription: 'Ctrl+C' },
    { label: 'Cut', icon: <CutIcon />, action: onCutSelection, disabled: !canCut, hotkeyDescription: 'Ctrl+X' },
    { label: 'Paste', icon: <PasteIcon />, action: onPasteFromClipboard, disabled: !canPaste, hotkeyDescription: 'Ctrl+V' },
  ];

  const utilityTools: ToolDefinition[] = [
    { tool: Tool.Move, label: 'Pan View', icon: <MoveIcon />, hotkeyDescription: 'Click & drag canvas / Middle mouse button', hotkeyDisplay: 'ESC' },
  ];

  const renderButtonGroup = (group: ToolDefinition[], groupName: string) => (
    <div className="flex items-center space-x-0.5" role="group" aria-label={groupName}>
      {group.map(({ tool, label, icon, hotkeyDescription, hotkeyDisplay, action, disabled }) => (
        <Button
          key={tool || label}
          variant={tool && activeTool === tool ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            if (tool) onToolSelect(tool);
            else if (action) action();
          }}
          title={hotkeyDescription ? `${label} (${hotkeyDescription})` : label}
          className={`p-2 relative ${(tool && activeTool === tool) ? 'ring-2 ring-accent dark:ring-accent' : ''}`}
          aria-label={label}
          aria-pressed={tool ? activeTool === tool : undefined}
          disabled={disabled}
        >
          {icon}
          {hotkeyDisplay && (
            <span
              className="absolute -bottom-1 -right-0.5 text-[9px] bg-neutral-400 dark:bg-neutral-600 text-neutral-50 dark:text-neutral-200 px-1 py-0.5 rounded-sm leading-none shadow"
              aria-hidden="true"
            >
              {hotkeyDisplay}
            </span>
          )}
        </Button>
      ))}
    </div>
  );

  return (
    <div ref={ref} className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 print:hidden">
      <div className="flex flex-col items-center space-y-1">
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
