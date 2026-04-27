import React, { useEffect, useMemo, useState } from 'react';
import { Button } from './Button';
import { Manifest, ManifestEntry } from '../types';
import { EXPLORE_REPO_OWNER, EXPLORE_REPO_NAME } from '../constants';
import { DesignDetailView } from './DesignDetailView';
import { ArrowLeftIcon, ExternalLinkIcon, SearchIcon } from './Icon';

interface ExploreGalleryProps {
  onOpenInEditor: (entry: ManifestEntry) => void;
  onBackToEditor: () => void;
}

type SortMode = 'newest' | 'random';

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const ExploreGallery: React.FC<ExploreGalleryProps> = ({
  onOpenInEditor,
  onBackToEditor,
}) => {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [randomSeed, setRandomSeed] = useState(0); // re-shuffles when bumped
  const [selectedEntry, setSelectedEntry] = useState<ManifestEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}manifest.json`;
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Manifest) => {
        if (!cancelled) setManifest(data);
      })
      .catch(err => {
        if (!cancelled) setLoadError(err.message ?? 'Failed to load designs');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // All available tags, ordered by frequency (most common first)
  const allTags = useMemo(() => {
    if (!manifest) return [];
    const counts = new Map<string, number>();
    for (const d of manifest.designs) {
      for (const t of d.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [manifest]);

  const filtered = useMemo(() => {
    if (!manifest) return [];
    const q = searchQuery.trim().toLowerCase();
    let designs = manifest.designs.filter(d => {
      if (selectedTags.size > 0 && !d.tags.some(t => selectedTags.has(t))) {
        return false;
      }
      if (!q) return true;
      const haystack = [d.title, d.author, d.description ?? '', ...d.tags]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    if (sortMode === 'newest') {
      designs = designs.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    } else {
      // randomSeed gates the memo so re-shuffles only happen when requested
      void randomSeed;
      designs = shuffle(designs);
    }
    return designs;
  }, [manifest, searchQuery, selectedTags, sortMode, randomSeed]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const renderHeader = () => (
    <div className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex-shrink-0">
      {/* Row 1 — navigation: icon back / centered title / help link */}
      <div className="flex items-center px-4 pt-3 pb-2">
        <div className="flex-1">
          <Button variant="ghost" size="sm" onClick={onBackToEditor} title="Back to Editor" aria-label="Back to Editor">
            <ArrowLeftIcon />
          </Button>
        </div>
        <h2
          className="text-2xl font-semibold text-neutral-700 dark:text-neutral-200"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Explore
        </h2>
        <div className="flex-1 flex justify-end">
          <a
            href={`https://github.com/${EXPLORE_REPO_OWNER}/${EXPLORE_REPO_NAME}/blob/main/docs/PUBLISHING.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary underline inline-flex items-center gap-1"
          >
            How publishing works
            <ExternalLinkIcon className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Row 2 — search */}
      <div className="px-4 pb-2">
        <div className="relative max-w-sm">
          <SearchIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search designs…"
            className="w-full pl-8 pr-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Row 3 — filter chips (left-grow), sort dropdown pinned right */}
      <div className="flex items-start justify-between gap-4 px-4 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 flex-grow min-w-0">
          {allTags.length > 0 && (
            <>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Filter</span>
              {allTags.map(tag => {
                const active = selectedTags.has(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                      active
                        ? 'bg-primary text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
              {selectedTags.size > 0 && (
                <button
                  onClick={() => setSelectedTags(new Set())}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary underline ml-1"
                >
                  clear
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as SortMode)}
            className="px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-xs"
          >
            <option value="newest">Newest</option>
            <option value="random">Random</option>
          </select>
          {sortMode === 'random' && (
            <button
              onClick={() => setRandomSeed(s => s + 1)}
              className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary underline"
            >
              reshuffle
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderCard = (entry: ManifestEntry) => (
    <button
      key={entry.id}
      onClick={() => setSelectedEntry(entry)}
      className="text-left bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden hover:shadow-md hover:border-primary transition focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <div className="aspect-square bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}${entry.thumbnailUrl}`}
          alt={entry.title}
          loading="lazy"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-medium text-sm text-neutral-800 dark:text-neutral-100 truncate" title={entry.title}>
          {entry.title}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
          by {entry.author}
        </p>
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {entry.tags.slice(0, 3).map(t => (
              <span key={t} className="text-xs px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );

  const renderBody = () => {
    if (loadError) {
      return (
        <div className="flex-grow flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-red-600 dark:text-red-400 mb-2">Could not load designs.</p>
            <p className="text-xs text-neutral-500">{loadError}</p>
          </div>
        </div>
      );
    }
    if (!manifest) {
      return (
        <div className="flex-grow flex items-center justify-center p-8">
          <p className="text-neutral-500">Loading designs…</p>
        </div>
      );
    }
    if (manifest.designs.length === 0) {
      return (
        <div className="flex-grow flex items-center justify-center p-8 text-center">
          <div className="space-y-2">
            <p className="text-neutral-700 dark:text-neutral-300">No designs published yet.</p>
            <p className="text-sm text-neutral-500">Be the first — click the share icon in the editor to publish your work.</p>
          </div>
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="flex-grow flex items-center justify-center p-8">
          <p className="text-neutral-500">No designs match your filters.</p>
        </div>
      );
    }
    return (
      <div className="flex-grow overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(renderCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-neutral-100 dark:bg-neutral-900">
      {renderHeader()}
      {renderBody()}
      {selectedEntry && (
        <DesignDetailView
          entry={selectedEntry}
          parentEntry={
            selectedEntry.remixOf
              ? manifest?.designs.find(d => d.id === selectedEntry.remixOf)
              : undefined
          }
          onClose={() => setSelectedEntry(null)}
          onOpenInEditor={(entry) => {
            setSelectedEntry(null);
            onOpenInEditor(entry);
          }}
        />
      )}
    </div>
  );
};
