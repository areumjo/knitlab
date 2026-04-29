import React, { useEffect, useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ApplicationState, StitchSymbolDef } from '../types';
import { generateThumbnail } from '../services/thumbnailService';
import { serialize, trimForPublish } from '../services/serializationService';
import { EXPLORE_REPO_OWNER, EXPLORE_REPO_NAME } from '../constants';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationState: ApplicationState;
  allSymbols: StitchSymbolDef[];
  isDarkMode: boolean;
  hasEdits: boolean; // false if chart is identical to its loaded source (no undo available)
  onOpenHelp: () => void;
}

const MAX_TITLE = 80;
const MAX_DESCRIPTION = 500;

type View = 'form' | 'confirm';

function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

function buildIssueBody(args: {
  title: string;
  author: string;
  description: string;
  tags: string;
  remixOf: string;
  thumbnailB64: string;
  payload: string;
}): string {
  return [
    '### Title',
    '',
    args.title,
    '',
    '### Author',
    '',
    args.author || '_No response_',
    '',
    '### Description',
    '',
    args.description || '_No response_',
    '',
    '### Tags',
    '',
    args.tags || '_No response_',
    '',
    '### Remix of',
    '',
    args.remixOf || '_No response_',
    '',
    '### Thumbnail',
    '',
    '```knitlab-thumbnail',
    args.thumbnailB64,
    '```',
    '',
    '### Payload',
    '',
    '```knitlab-payload',
    args.payload,
    '```',
    '',
  ].join('\n');
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  applicationState,
  allSymbols,
  isDarkMode,
  hasEdits,
  onOpenHelp,
}) => {
  const [view, setView] = useState<View>('form');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [author, setAuthor] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [copiedNote, setCopiedNote] = useState('');

  // Auto-fill remix-of from chart metadata if this was opened from Explore
  const remixOf = applicationState.originalDesignId || '';
  const remixBadge = applicationState.originalTitle
    ? `Remix of "${applicationState.originalTitle}"${applicationState.originalAuthor ? ` by ${applicationState.originalAuthor}` : ''}`
    : null;
  const isUnchangedFork = !!applicationState.originalDesignId && !hasEdits;

  // Reset state every time modal opens, regenerate thumbnail
  useEffect(() => {
    if (!isOpen) return;
    setView('form');
    setTitle('');
    setDescription('');
    setTags('');
    setAuthor('');
    setCopiedNote('');
    setThumbnailUrl(null);
    setThumbnailError(false);

    let cancelled = false;
    generateThumbnail(applicationState, allSymbols, isDarkMode)
      .then(url => {
        if (cancelled) return;
        if (url) setThumbnailUrl(url);
        else setThumbnailError(true);
      })
      .catch(() => {
        if (!cancelled) setThumbnailError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, applicationState, allSymbols, isDarkMode]);

  const submission = useMemo(() => {
    if (!thumbnailUrl) return null;
    const thumbnailB64 = stripDataUrlPrefix(thumbnailUrl);
    const payload = serialize(trimForPublish(applicationState));
    const body = buildIssueBody({
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      tags: tags.trim(),
      remixOf,
      thumbnailB64,
      payload,
    });
    const issueTitle = `[Design] ${title.trim()}`.slice(0, 256);
    const baseUrl = `https://github.com/${EXPLORE_REPO_OWNER}/${EXPLORE_REPO_NAME}/issues/new`;
    // The body is always too long to URL-prefill reliably (base64 thumbnail
    // alone is ~5-10KB). We always copy the body to clipboard and rely on the
    // user pasting into GitHub's issue editor. The URL prefills the title and
    // applies the design-submission label.
    const url = `${baseUrl}?title=${encodeURIComponent(issueTitle)}&labels=design-submission`;
    return { body, url };
  }, [thumbnailUrl, title, author, description, tags, remixOf, applicationState]);

  const titleTrimmed = title.trim();
  const titleTooLong = titleTrimmed.length > MAX_TITLE;
  const descriptionTooLong = description.trim().length > MAX_DESCRIPTION;
  const canContinue =
    !!titleTrimmed && !titleTooLong && !descriptionTooLong && !!thumbnailUrl;

  const handleCopyBody = async () => {
    if (!submission) return;
    try {
      await navigator.clipboard.writeText(submission.body);
      setCopiedNote('Copied to clipboard.');
      setTimeout(() => setCopiedNote(''), 4000);
      return true;
    } catch {
      setCopiedNote('Could not copy automatically — select & copy the text below before opening GitHub.');
      return false;
    }
  };

  const handleOpenAndCopy = async () => {
    if (!submission) return;
    await handleCopyBody();
    window.open(submission.url, '_blank', 'noopener,noreferrer');
  };

  const renderForm = () => (
    <div className="space-y-4">
      {remixBadge && (
        <div className="text-xs italic text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 rounded p-2">
          {remixBadge} — credit will carry through automatically.
        </div>
      )}

      {isUnchangedFork && (
        <div className="text-xs text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded p-3">
          <strong>This looks identical to the original.</strong> You haven't edited
          anything since opening it. The maintainer will likely reject duplicate
          submissions — try editing the chart first, or close this if you didn't
          mean to publish.
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-shrink-0 w-32 h-32 bg-neutral-100 dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600 flex items-center justify-center overflow-hidden">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="Chart preview" className="max-w-full max-h-full" />
          ) : thumbnailError ? (
            <span className="text-xs text-neutral-500 px-2 text-center">Preview failed</span>
          ) : (
            <span className="text-xs text-neutral-500">Generating preview…</span>
          )}
        </div>
        <div className="flex-grow space-y-2">
          <div>
            <label htmlFor="publish-title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="publish-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={MAX_TITLE + 20}
              placeholder="e.g. Simple Lace Hat"
              className="mt-1 w-full px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-sm"
            />
            <p className="text-xs text-neutral-500 mt-0.5">
              {titleTrimmed.length}/{MAX_TITLE}
              {titleTooLong && <span className="text-red-500 ml-2">Too long</span>}
            </p>
          </div>
          <div>
            <label htmlFor="publish-author" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Display name
            </label>
            <input
              id="publish-author"
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="e.g. Jane Knitter, or @yourhandle"
              className="mt-1 w-full px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-sm"
            />
            <p className="text-xs text-neutral-500 mt-0.5">
              Leave blank to credit your GitHub account.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="publish-description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Description
        </label>
        <textarea
          id="publish-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="e.g. A simple lace pattern with three repeats…"
          className="mt-1 w-full px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-sm resize-none"
        />
        <p className="text-xs text-neutral-500 mt-0.5">
          {description.trim().length}/{MAX_DESCRIPTION}
          {descriptionTooLong && <span className="text-red-500 ml-2">Too long</span>}
        </p>
      </div>

      <div>
        <label htmlFor="publish-tags" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Tags
        </label>
        <input
          id="publish-tags"
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="comma-separated, e.g. lace, hat, beginner"
          className="mt-1 w-full px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-sm"
        />
      </div>

      <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
        Your design will be <strong>publicly visible</strong> in Explore and on GitHub.
        Anyone can view, download, and remix it.
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={() => { onClose(); onOpenHelp(); }}
          className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary underline"
        >
          How publishing works
        </button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!canContinue} onClick={() => setView('confirm')}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );

  const renderConfirm = () => (
    <div className="space-y-4">
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        Your submission is ready. The button below copies it to your clipboard and
        opens GitHub in a new tab.
      </p>

      <div className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 rounded p-3">
        <p className="font-medium mb-2">Then on GitHub:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Click the <strong>Add a description</strong> field</li>
          <li>Paste with <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded text-xs">Cmd/Ctrl+V</kbd></li>
          <li>Click <strong>Submit new issue</strong></li>
        </ol>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 italic">
          A maintainer reviews each submission. Your design appears in Explore a few minutes after approval.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="primary" onClick={handleOpenAndCopy}>
          Copy submission & open GitHub
        </Button>
        {copiedNote && (
          <p className="text-xs text-green-700 dark:text-green-400">{copiedNote}</p>
        )}
      </div>

      <div className="flex justify-end gap-1 pt-2 border-t border-neutral-200 dark:border-neutral-700">
        <Button variant="ghost" onClick={() => setView('form')}>Back to edit</Button>
        <Button variant="ghost" onClick={onClose}>Done</Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Publish to Explore" size="lg">
      {view === 'form' ? renderForm() : renderConfirm()}
    </Modal>
  );
};
