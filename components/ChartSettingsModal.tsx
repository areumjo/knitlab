import React, { useState, useEffect, useRef } from 'react';
import { ChartState, Layer, ChartDisplaySettings } from '../types'; 
import { Modal } from './Modal';
import { Button } from './Button';
import { INITIAL_CHART_STATE, createChartGrid, MAX_CHART_ROWS, MAX_CHART_COLS } from '../constants'; 

interface CoreChartSettings { // Define CoreChartSettings for clarity
  rows: number;
  cols: number;
  orientation: ChartState['orientation'];
  displaySettings: ChartDisplaySettings;
}

interface ChartSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: ChartState; 
  currentDefaultCellColor: string; // New prop for the sheet's effective default background
  onSave: (newCoreSettings: CoreChartSettings & { defaultCellColor: string }) => void;
}

export const ChartSettingsModal: React.FC<ChartSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  currentDefaultCellColor, // New
  onSave,
}) => {
  const [rows, setRows] = useState(currentSettings.rows);
  const [cols, setCols] = useState(currentSettings.cols);
  const [orientation, setOrientation] = useState(currentSettings.orientation);
  const [defaultCellColorLocal, setDefaultCellColorLocal] = useState(currentDefaultCellColor); // Use prop
  const [displaySettings, setDisplaySettings] = useState<ChartDisplaySettings>(
    currentSettings.displaySettings ? { ...currentSettings.displaySettings } : { ...INITIAL_CHART_STATE.displaySettings }
  );

  const prevIsOpenRef = useRef<boolean>(isOpen);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
        setRows(currentSettings.rows);
        setCols(currentSettings.cols);
        setOrientation(currentSettings.orientation);
        setDefaultCellColorLocal(currentDefaultCellColor); // Use prop
        
        const newInitialDisplaySettings = currentSettings.displaySettings
                                          ? { ...currentSettings.displaySettings } 
                                          : { ...INITIAL_CHART_STATE.displaySettings };
        setDisplaySettings(newInitialDisplaySettings);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentSettings, currentDefaultCellColor]); // Add currentDefaultCellColor


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      rows,
      cols,
      orientation,
      defaultCellColor: defaultCellColorLocal, // This is the color selected in the modal
      displaySettings, 
    });
    onClose();
  };

  const handleDisplaySettingChange = <K extends keyof ChartDisplaySettings>(
    key: K, value: ChartDisplaySettings[K]
  ) => {
    setDisplaySettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chart Settings" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="chartRows" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Rows</label>
              <input
                type="number"
                id="chartRows"
                value={rows}
                onChange={(e) => setRows(Math.min(MAX_CHART_ROWS, Math.max(1, parseInt(e.target.value) || 1)))}
                min="1" max={MAX_CHART_ROWS}
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-neutral-700"
              />
            </div>
            <div>
              <label htmlFor="chartCols" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Columns</label>
              <input
                type="number"
                id="chartCols"
                value={cols}
                onChange={(e) => setCols(Math.min(MAX_CHART_COLS, Math.max(1, parseInt(e.target.value) || 1)))}
                min="1" max={MAX_CHART_COLS}
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-neutral-700"
              />
            </div>
        </div>
        <div>
          <label htmlFor="chartOrientation" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Orientation</label>
          <select
            id="chartOrientation"
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as ChartState['orientation'])}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white dark:bg-neutral-700"
          >
            <option value="bottom-up">Bottom-Up</option>
            <option value="top-down">Top-Down</option>
            <option value="left-right">Left-to-Right (Flat)</option>
            <option value="in-the-round">In The Round</option>
          </select>
        </div>
        <div>
          <label htmlFor="defaultCellColor" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Default Cell Background</label>
          <input
            type="color"
            id="defaultCellColor"
            value={defaultCellColorLocal}
            onChange={(e) => setDefaultCellColorLocal(e.target.value)}
            className="mt-1 block w-full h-10 p-0 border-none rounded-md cursor-pointer"
          />
        </div>

        <div className="pt-2 border-t border-neutral-300 dark:border-neutral-600">
            <h4 className="text-md font-medium text-neutral-700 dark:text-neutral-300 mb-2">Row/Column Counters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="rowCountVisibility" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Row Counters</label>
                    <select
                        id="rowCountVisibility"
                        value={displaySettings.rowCountVisibility}
                        onChange={(e) => handleDisplaySettingChange('rowCountVisibility', e.target.value as ChartDisplaySettings['rowCountVisibility'])}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white dark:bg-neutral-700"
                    >
                        <option value="none">None</option>
                        <option value="left">Left Side</option>
                        <option value="right">Right Side</option>
                        <option value="both">Both Sides</option>
                        <option value="alternating-left">Alternating (Start Left)</option>
                        <option value="alternating-right">Alternating (Start Right)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="colCountVisibility" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Column Counters</label>
                    <select
                        id="colCountVisibility"
                        value={displaySettings.colCountVisibility}
                        onChange={(e) => handleDisplaySettingChange('colCountVisibility', e.target.value as ChartDisplaySettings['colCountVisibility'])}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white dark:bg-neutral-700"
                    >
                        <option value="none">None</option>
                        <option value="top">Top Side</option>
                        <option value="bottom">Bottom Side</option>
                        <option value="both">Both Sides</option>
                    </select>
                </div>
            </div>
        </div>


        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Settings</Button>
        </div>
      </form>
    </Modal>
  );
};
