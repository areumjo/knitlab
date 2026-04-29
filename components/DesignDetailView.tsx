import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { DownloadIcon } from './Icon';
import { ManifestEntry } from '../types';

interface DesignDetailViewProps {
  entry: ManifestEntry;
  parentEntry?: ManifestEntry; // resolved entry that this is a remix of, if any
  onClose: () => void;
  onOpenInEditor: (entry: ManifestEntry) => void;
}

export const DesignDetailView: React.FC<DesignDetailViewProps> = ({
  entry,
  parentEntry,
  onClose,
  onOpenInEditor,
}) => {
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloadError(null);
    try {
      const url = `${import.meta.env.BASE_URL}${entry.payloadUrl}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${entry.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'chart'}.knitlab`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const showSubmitter =
    entry.submitter && entry.author.toLowerCase() !== entry.submitter.toLowerCase();

  return (
    <Modal isOpen={true} onClose={onClose} title={entry.title} size="lg">
      <div className="space-y-4">
        <div className="bg-neutral-100 dark:bg-neutral-700 rounded overflow-hidden max-w-md mx-auto">
          <img
            src={`${import.meta.env.BASE_URL}${entry.thumbnailUrl}`}
            alt={entry.title}
            className="w-full h-auto object-contain"
          />
        </div>

        {entry.description && (
          <p className="text-sm text-neutral-700 dark:text-neutral-300">{entry.description}</p>
        )}

        <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
          <div>
            By <strong>{entry.author}</strong>
            {showSubmitter && ` (@${entry.submitter})`}
            {' • '}
            {entry.date}
          </div>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {entry.tags.map(t => (
                <span key={t} className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}
          {entry.remixOf && (
            <div className="italic pt-1">
              {parentEntry ? (
                <>Remix of "<strong>{parentEntry.title}</strong>" by {parentEntry.author}</>
              ) : (
                <>Remix of design #{entry.remixOf}</>
              )}
            </div>
          )}
        </div>

        {downloadError && (
          <p className="text-xs text-red-600 dark:text-red-400">
            Download failed: {downloadError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="primary" onClick={() => onOpenInEditor(entry)}>
            Open in Editor
          </Button>
          <Button variant="outline" onClick={handleDownload} leftIcon={<DownloadIcon />}>
            Download .knitlab
          </Button>
          <div className="flex-grow" />
          <a
            href={entry.issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary"
          >
            View on GitHub →
          </a>
        </div>
      </div>
    </Modal>
  );
};
