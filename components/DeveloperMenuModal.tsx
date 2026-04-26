
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { DownloadIcon, UploadIcon } from './Icon';
import { ApplicationState } from '../types';
import { serialize } from '../services/serializationService';
import areumKnitlabImg from '../assets/areum-knitlab-i-did-that.png';

interface DeveloperMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationState: ApplicationState;
  processLoadState: (jsonString: string) => void;
  showKeyUsageTally: boolean;
  onToggleShowKeyUsageTally: () => void;
}

export const DeveloperMenuModal: React.FC<DeveloperMenuModalProps> = ({
  isOpen,
  onClose,
  applicationState,
  processLoadState,
  showKeyUsageTally,
  onToggleShowKeyUsageTally,
}) => {
  const [activeView, setActiveView] = useState<'none' | 'current' | 'load' | 'settings'>('none');
  const [jsonToLoad, setJsonToLoad] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleDownload = () => {
    try {
      const serialized = serialize(applicationState);
      const activeSheet = applicationState.sheets.find(s => s.id === applicationState.activeSheetId);
      const filename = `${activeSheet?.name || 'chart'}.knitlab`;

      const blob = new Blob([serialized], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert(`Error downloading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          processLoadState(content);
        } catch (error) {
          console.error('Failed to load file:', error);
          alert(`Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };
    reader.onerror = () => {
      alert('Error reading file');
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const renderContent = () => {
    let dataToShow = '';
    let ariaLabel = '';
    let showCopyButton = false;

    switch (activeView) {
      case 'current':
        // Use the new compressed serialization format
        dataToShow = serialize(applicationState);
        ariaLabel = "Current application state (compressed)";
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

    if (activeView === 'current') {
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

  const titleNode = (
    <div className="flex items-center justify-between gap-3 flex-grow">
      <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">Developer Menu</h2>
      <div className="flex items-center gap-1">
        <Button onClick={handleDownload} variant="ghost" size="sm" leftIcon={<DownloadIcon />} aria-label="Download chart as .knitlab file">
          Download
        </Button>
        <Button onClick={handleUploadClick} variant="ghost" size="sm" leftIcon={<UploadIcon />} aria-label="Upload .knitlab or .json file">
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".knitlab,.json"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload chart file"
        />
      </div>
    </div>
  );

  const tabs: Array<{ id: typeof activeView; label: string }> = [
    { id: 'current', label: 'Current Data' },
    { id: 'load', label: 'Load from JSON' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <Modal
        isOpen={isOpen}
        onClose={() => { setActiveView('none'); setJsonToLoad(''); onClose(); }}
        title={titleNode}
        size="xl"
    >
      <div className="flex flex-col space-y-3" style={{minHeight: '60vh'}}>
        <div role="tablist" className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
          {tabs.map(tab => {
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveView(tab.id)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex-grow overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
};
