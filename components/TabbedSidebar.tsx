
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layer, Point, ChartState as GlobalChartState, TabId, ChartState } from '../types'; 
import { LayerPanel } from './LayerPanel';
import { SheetPanel } from './SheetPanel'; // Import SheetPanel
import { TabLayersIcon, TextIcon, GripVerticalIcon, SheetsIcon, ImageIcon } from './Icon'; 

interface TabDefinition {
  id: TabId | 'image-import'; // Allow 'image-import' as a valid TabId here for TABS array
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDefinition[] = [
  { id: 'sheets', label: 'Sheets', icon: <SheetsIcon /> }, 
  { id: 'layers', label: 'Layers', icon: <TabLayersIcon /> },
  { id: 'image-import', label: 'Image Import', icon: <ImageIcon /> },
  // { id: 'text', label: 'Text Pattern', icon: <TextIcon /> }, // Removed Text Pattern Tab
];

const ICON_RIBBON_WIDTH = 56; // pixels
const DEFAULT_CONTENT_WIDTH = 224; // Default width for the content area
const MIN_TOTAL_WIDTH = 200;
const MAX_TOTAL_WIDTH = 450;

interface TabbedSidebarProps {
  // LayerPanel Props
  layers: Layer[];
  activeLayerId: string | null;
  onLayerSelect: (id: string) => void;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onSelectAllActiveLayer: () => void;

  // SheetPanel Props
  allSheets: ChartState[]; 
  activeSheetId: string | null;
  onSheetSelect: (id: string) => void;
  onAddSheet: () => void;
  onRemoveSheet: (id: string) => void;
  onRenameSheet: (id: string, newName: string) => void;
  
  // Tab Management Props
  activeTab: TabId;
  onTabSelect: (tabId: TabId) => void;
  isSidebarContentVisible: boolean;
  onToggleSidebarContentVisibility: () => void;
  onOpenImageProcessor: () => void; 
  onActualWidthChange?: (width: number) => void; // New prop
}

const isContentTabId = (id: TabId | 'image-import'): id is TabId => {
    return id !== 'image-import';
};

export const TabbedSidebar: React.FC<TabbedSidebarProps> = (props) => {
  const [resizableWidth, setResizableWidth] = useState(DEFAULT_CONTENT_WIDTH); 
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const minResizableWidth = Math.max(0, MIN_TOTAL_WIDTH - ICON_RIBBON_WIDTH);
  const maxResizableWidth = Math.max(0, MAX_TOTAL_WIDTH - ICON_RIBBON_WIDTH);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseUpResize = useCallback(() => setIsResizing(false), []);

  const handleMouseMoveResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !sidebarRef.current) return;
    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    // Calculate new width based on mouse position relative to the document,
    // not the sidebar's own left edge, to account for sidebar moving.
    const newTotalWidth = e.clientX - sidebarRect.left + (sidebarRef.current.offsetLeft || 0) ;
    
    let newContentWidth = newTotalWidth - ICON_RIBBON_WIDTH;
    newContentWidth = Math.max(minResizableWidth, Math.min(maxResizableWidth, newContentWidth));
    setResizableWidth(newContentWidth);
  }, [isResizing, minResizableWidth, maxResizableWidth]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMoveResize);
      document.addEventListener('mouseup', handleMouseUpResize);
    } else {
      document.removeEventListener('mousemove', handleMouseMoveResize);
      document.removeEventListener('mouseup', handleMouseUpResize);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveResize);
      document.removeEventListener('mouseup', handleMouseUpResize);
    };
  }, [isResizing, handleMouseMoveResize, handleMouseUpResize]);

  const handleTabButtonClick = (tabId: TabId | 'image-import') => {
    if (tabId === 'image-import') {
      props.onOpenImageProcessor();
      return;
    }

    if (props.activeTab === tabId && props.isSidebarContentVisible) {
      props.onToggleSidebarContentVisibility(); 
    } else {
      props.onTabSelect(tabId);
      if (!props.isSidebarContentVisible) {
        props.onToggleSidebarContentVisibility(); 
      }
    }
  };

  const renderTabContent = () => {
    switch (props.activeTab) {
      case 'sheets': 
        return (
          <SheetPanel
            sheets={props.allSheets}
            activeSheetId={props.activeSheetId}
            onSheetSelect={props.onSheetSelect}
            onAddSheet={props.onAddSheet}
            onRemoveSheet={props.onRemoveSheet}
            onRenameSheet={props.onRenameSheet}
          />
        );
      case 'layers':
        return (
          <LayerPanel
            layers={props.layers}
            activeLayerId={props.activeLayerId}
            onLayerSelect={props.onLayerSelect}
            onAddLayer={props.onAddLayer}
            onRemoveLayer={props.onRemoveLayer}
            onToggleLayerVisibility={props.onToggleLayerVisibility}
            onSelectAllActiveLayer={props.onSelectAllActiveLayer}
          />
        );
      default:
        return null;
    }
  };
  
  const currentTotalWidth = props.isSidebarContentVisible && isContentTabId(props.activeTab)
    ? ICON_RIBBON_WIDTH + resizableWidth 
    : ICON_RIBBON_WIDTH;

  useEffect(() => {
    if (props.onActualWidthChange) {
      props.onActualWidthChange(currentTotalWidth);
    }
  }, [currentTotalWidth, props.onActualWidthChange]);


  return (
    <div
      ref={sidebarRef}
      className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex print:hidden relative transition-all duration-150 ease-in-out"
      style={{ width: `${currentTotalWidth}px` }}
    >
      {/* Tab Buttons Column */}
      <div 
        className="flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 border-r border-neutral-300 dark:border-neutral-700 py-2 space-y-1 flex-shrink-0"
        style={{ width: `${ICON_RIBBON_WIDTH}px` }}
      >
        {TABS.map((tab) => {
          const isActuallyContentTab = isContentTabId(tab.id);
          const isActive = isActuallyContentTab && props.activeTab === tab.id && props.isSidebarContentVisible;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabButtonClick(tab.id)}
              title={tab.label}
              className={`p-2.5 rounded-md w-10 h-10 flex items-center justify-center transition-colors
                          ${isActive
                            ? 'bg-primary text-white'
                            : 'hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                          }`}
              aria-label={tab.label}
              aria-selected={isActive}
            >
              {React.cloneElement(tab.icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {props.isSidebarContentVisible && isContentTabId(props.activeTab) && (
        <div className="flex flex-col flex-grow overflow-hidden" style={{width: `${resizableWidth}px`}}>
          <div className="flex-grow overflow-y-auto custom-scrollbar">
            {renderTabContent()}
          </div>
        </div>
      )}
      
      {/* Resizer */}
      {props.isSidebarContentVisible && isContentTabId(props.activeTab) && (
        <div
          className="absolute top-0 h-full w-2 cursor-col-resize flex items-center justify-center group"
          style={{ right: '0px' }} 
          onMouseDown={handleMouseDownResize}
        >
          <GripVerticalIcon className="text-neutral-400 dark:text-neutral-500 group-hover:text-primary w-2.5 h-8 opacity-30 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
};
