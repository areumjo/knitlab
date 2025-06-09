
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ApplicationState, HistoryEntry } from '../types';
import areumKnitlabImg from '../assets/areum-knitlab-i-did-that.png';

interface DeveloperMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationState: ApplicationState;
  history: HistoryEntry<ApplicationState>[];
  processLoadState: (jsonString: string) => void;
  showKeyUsageTally: boolean; // New prop
  onToggleShowKeyUsageTally: () => void; // New prop
}

export const DeveloperMenuModal: React.FC<DeveloperMenuModalProps> = ({
  isOpen,
  onClose,
  applicationState,
  history,
  processLoadState,
  showKeyUsageTally,
  onToggleShowKeyUsageTally,
}) => {
  const [activeView, setActiveView] = useState<'none' | 'history' | 'current' | 'load' | 'settings'>('none');
  const [jsonToLoad, setJsonToLoad] = useState('');

  const handleLoad = () => {
    if (jsonToLoad.trim()) {
      processLoadState(jsonToLoad);
      // Modal might be closed by processLoadState on success
    } else {
      alert("Please paste JSON data to load.");
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Data copied to clipboard!'))
      .catch(err => console.error('Failed to copy data: ', err));
  };

  const renderContent = () => {
    let dataToShow = '';
    let ariaLabel = '';
    let showCopyButton = false;

    switch (activeView) {
      case 'history':
        dataToShow = JSON.stringify(history, null, 2);
        ariaLabel = "History data JSON";
        showCopyButton = true;
        break;
      case 'current':
        dataToShow = JSON.stringify(applicationState, null, 2);
        ariaLabel = "Current application state JSON";
        showCopyButton = true;
        break;
      case 'load':
        return (
          <div className="space-y-2 flex flex-col h-full">
            <textarea
              value={jsonToLoad}
              onChange={(e) => setJsonToLoad(e.target.value)}
              placeholder="Paste application state JSON here..."
              className="w-full flex-grow resize-none p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 font-mono text-xs"
              aria-label="Paste application state JSON"
              rows={24}
            />
            <Button onClick={handleLoad} variant="primary" className="self-end">Load Data</Button>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-3 p-2">
            <h4 className="text-md font-semibold text-neutral-700 dark:text-neutral-300">Display Settings:</h4>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showKeyUsageTallyToggle"
                checked={showKeyUsageTally}
                onChange={onToggleShowKeyUsageTally}
                className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 dark:border-neutral-600 rounded"
              />
              <label htmlFor="showKeyUsageTallyToggle" className="text-sm text-neutral-700 dark:text-neutral-300">
                Show Key Usage Tally on Buttons
              </label>
            </div>
            {/* Add more developer settings here in the future */}
          </div>
        );
      default:
        return (
          <div className="space-y-1 p-2">
            <a href="https://www.linkedin.com/in/areum-jo/" target="_blank" rel="noopener noreferrer" className="block text-center text-primary hover:underline">https://www.linkedin.com/in/areum-jo/</a>
            <img src={areumKnitlabImg} alt="Areum Kintlab - I did that" className="w-full h-auto rounded-md" />
          </div>
        );
    }

    if (activeView === 'history' || activeView === 'current') {
        return (
            <div className="space-y-2 flex flex-col h-full">
                <textarea
                    readOnly
                    value={dataToShow}
                    className="w-full flex-grow resize-none p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700 font-mono text-xs"
                    rows={24}
                    aria-label={ariaLabel}
                />
                {showCopyButton && (
                    <Button onClick={() => handleCopyToClipboard(dataToShow)} variant="outline" className="self-end">Copy to Clipboard</Button>
                )}
            </div>
        );
    }
    return null;
  };

  return (
    <Modal
        isOpen={isOpen}
        onClose={() => { setActiveView('none'); setJsonToLoad(''); onClose(); }}
        title="Developer Menu"
        size="xl"
    >
      <div className="flex flex-col space-y-3" style={{minHeight: '60vh'}}>
        <div className="flex space-x-2 border-b p-2 border-neutral-200 dark:border-neutral-700 flex-shrink-0">
          <Button onClick={() => setActiveView('history')} variant={activeView === 'history' ? 'primary' : 'outline'} size="sm">
            View History Data
          </Button>
          <Button onClick={() => setActiveView('current')} variant={activeView === 'current' ? 'primary' : 'outline'} size="sm">
            View Current Data
          </Button>
          <Button onClick={() => setActiveView('load')} variant={activeView === 'load' ? 'primary' : 'outline'} size="sm">
            Load from JSON
          </Button>
          <Button onClick={() => setActiveView('settings')} variant={activeView === 'settings' ? 'primary' : 'outline'} size="sm">
            Settings
          </Button>
        </div>
        <div className="flex-grow overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
};
