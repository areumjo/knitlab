import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { ArrowLeftIcon } from './Icon';

export type HelpAnchor = 'using-knitlab' | 'publishing';

interface HelpViewProps {
  onBackToEditor: () => void;
  initialAnchor?: HelpAnchor;
}

interface TocEntry {
  id: string;
  title: string;
  children?: TocEntry[];
}

const TOC: TocEntry[] = [
  {
    id: 'using-knitlab',
    title: 'Using Knitlab',
    children: [
      { id: 'editor-at-a-glance', title: 'The editor at a glance' },
      { id: 'painting', title: 'Painting tools' },
      { id: 'sheets-and-layers', title: 'Sheets and layers' },
      { id: 'custom-keys', title: 'Creating custom keys' },
      { id: 'photo-import', title: 'Importing a photo' },
      { id: 'save-and-load', title: 'Saving and loading your work' },
      { id: 'browse-explore', title: 'Browsing Explore & remixing' },
    ],
  },
  {
    id: 'publishing',
    title: 'Publishing your design',
    children: [
      { id: 'what-publish-means', title: 'What "publish" actually does' },
      { id: 'what-gets-included', title: 'What gets included in a published design' },
      { id: 'publish-steps', title: 'Step by step' },
      { id: 'remix-attribution', title: 'Remixing & attribution' },
      { id: 'after-submit', title: 'After you submit' },
    ],
  },
];

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="my-4 flex items-center justify-center h-32 border border-dashed border-neutral-300 dark:border-neutral-600 rounded text-xs text-neutral-500 dark:text-neutral-400 italic">
    [screenshot placeholder — {label}]
  </div>
);

const Section: React.FC<{ id: string; title: string; level: 1 | 2; children: React.ReactNode }> = ({
  id,
  title,
  level,
  children,
}) => {
  const Heading: React.ElementType = level === 1 ? 'h2' : 'h3';
  const headingClass =
    level === 1
      ? 'text-2xl font-semibold text-neutral-800 dark:text-neutral-100 mt-12 first:mt-0 mb-4'
      : 'text-lg font-semibold text-neutral-700 dark:text-neutral-200 mt-8 mb-2 scroll-mt-4';
  return (
    <section id={id} className="scroll-mt-6">
      <Heading
        className={headingClass}
        style={level === 1 ? { fontFamily: "'Cormorant Garamond', serif" } : undefined}
      >
        {title}
      </Heading>
      <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
};

export const HelpView: React.FC<HelpViewProps> = ({ onBackToEditor, initialAnchor }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Jump to a section if we entered via a link with an anchor.
  useEffect(() => {
    if (!initialAnchor) return;
    const el = document.getElementById(initialAnchor);
    if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [initialAnchor]);

  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 overflow-hidden">
      {/* Header bar */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex-shrink-0">
        <div className="flex items-center px-4 py-3">
          <div className="flex-1">
            <Button variant="ghost" size="sm" onClick={onBackToEditor} title="Back to Editor" aria-label="Back to Editor">
              <ArrowLeftIcon />
            </Button>
          </div>
          <h2
            className="text-2xl font-semibold text-neutral-700 dark:text-neutral-200"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Help
          </h2>
          <div className="flex-1" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sticky table of contents */}
        <nav
          aria-label="Help navigation"
          className="hidden md:block w-64 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-700 overflow-y-auto custom-scrollbar p-4 text-sm"
        >
          <div className="text-xs uppercase font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
            On this page
          </div>
          <ul className="space-y-1">
            {TOC.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  onClick={(e) => handleTocClick(e, entry.id)}
                  className="block py-1 font-medium text-neutral-700 dark:text-neutral-200 hover:text-primary dark:hover:text-primary-light"
                >
                  {entry.title}
                </a>
                {entry.children && (
                  <ul className="ml-3 mt-0.5 mb-2 space-y-0.5 border-l border-neutral-200 dark:border-neutral-700 pl-3">
                    {entry.children.map((child) => (
                      <li key={child.id}>
                        <a
                          href={`#${child.id}`}
                          onClick={(e) => handleTocClick(e, child.id)}
                          className="block py-0.5 text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary-light"
                        >
                          {child.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <main ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar">
          <article className="max-w-3xl mx-auto px-6 md:px-10 py-8 pb-24">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">
              New to Knitlab, or just want to know what a particular feature does? You're in the right place.
              This page walks through how to use the editor and how to share your designs with everyone else.
            </p>

            {/* ───── Section 1: Using Knitlab ───── */}
            <Section id="using-knitlab" title="Using Knitlab" level={1}>
              <p>
                Knitlab is a browser-based knitting chart designer — think of it as a sketch pad
                for your stitches. Everything you do happens locally in your browser; nothing is
                uploaded anywhere unless you explicitly publish a design (more on that in the
                second half of this page).
              </p>

              <Section id="editor-at-a-glance" title="The editor at a glance" level={2}>
                <p>The main screen is split into a few areas:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Top toolbar.</strong> Undo/redo, generate written instructions,
                    export to JPG, publish, and open the Explore gallery. There's also a zoom
                    control on the right and a button to toggle dark mode.
                  </li>
                  <li>
                    <strong>Left side panel.</strong> A skinny ribbon of icons opens a panel
                    for sheets, layers, custom keys, and a couple of other tools. Click the
                    same icon again to close the panel.
                  </li>
                  <li>
                    <strong>Canvas.</strong> The grid in the middle is your chart. Each cell
                    is a stitch. Click and drag to paint with whatever key is currently
                    active.
                  </li>
                  <li>
                    <strong>Mini map.</strong> A small overview in the corner. Click anywhere
                    on it to jump that part of the chart into view.
                  </li>
                </ul>
                <Placeholder label="annotated screenshot of the editor with arrows pointing to each region" />
              </Section>

              <Section id="painting" title="Painting tools" level={2}>
                <p>
                  The active key in your palette is what gets painted. Click a key in the
                  palette to select it, then click cells on the canvas to apply it.
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Brush:</strong> click or drag to paint cells one at a time.
                  </li>
                  <li>
                    <strong>Fill:</strong> bucket-fill a contiguous region of the same key.
                  </li>
                  <li>
                    <strong>Selection:</strong> drag a rectangle to select cells, then move
                    them, copy them, or apply a key to all of them at once.
                  </li>
                  <li>
                    <strong>Eyedropper:</strong> pick the key from a cell to make it active.
                  </li>
                </ul>
                <p>
                  Made a mistake? <strong>Cmd/Ctrl + Z</strong> undoes the last change, and
                  <strong> Cmd/Ctrl + Shift + Z</strong> (or <strong>Cmd/Ctrl + Y</strong>)
                  redoes it. Undo history is generous — you can step back through dozens of
                  edits.
                </p>
              </Section>

              <Section id="sheets-and-layers" title="Sheets and layers" level={2}>
                <p>
                  <strong>Sheets</strong> are separate charts that live in the same workspace —
                  use them when a single project has multiple pieces (front, back, sleeve,
                  etc.) or when you want to keep variations side by side. Switch between them
                  using the Sheets panel on the left.
                </p>
                <p>
                  <strong>Layers</strong> live inside a single sheet. They're useful for
                  things like sketching a colour-block plan on one layer and the actual stitch
                  pattern on another, then toggling visibility to compare. Each sheet has its
                  own layer stack.
                </p>
                <p>
                  Heads up: when you publish a design, only the <em>active sheet</em> goes
                  out — your other sheets stay private. Same for custom keys: only the ones
                  the published sheet actually uses are included.
                </p>
              </Section>

              <Section id="custom-keys" title="Creating custom keys" level={2}>
                <p>
                  A "key" is a stitch in your palette. Knitlab ships with the basics (knit,
                  purl, no-stitch), but you'll usually want to build your own — a cable, a
                  bobble, a colour block, anything you need on your chart.
                </p>
                <p>Click the <strong>+</strong> button in the key palette to open the editor. You'll
                  pick a name, a background colour, a symbol colour, and the cell dimensions
                  (most keys are 1×1, but cables and large motifs can span several cells).
                  Then choose how the symbol gets defined:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Cell mode:</strong> place text characters or pre-built symbols in
                    each cell. Good for "K", "P", "•", numbers, or any glyph from the symbol
                    library.
                  </li>
                  <li>
                    <strong>Line mode:</strong> draw lines between snap points to make custom
                    shapes — diagonals, cables, zigzags, anything geometric. Snap points
                    appear at every cell corner and midpoint. Click and drag from one snap
                    point to another to draw a line; the editor has its own undo/redo
                    (Cmd/Ctrl+Z) for line drawing.
                  </li>
                </ul>
                <Placeholder label="custom key editor showing both cell mode and line mode tabs" />
                <p>
                  When you save, the key joins your palette. Right-click on a key to edit,
                  duplicate, or remove it later.
                </p>
              </Section>

              <Section id="photo-import" title="Importing a photo" level={2}>
                <p>
                  Want to base a chart on an existing image? Use the photo importer (the
                  image icon in the left sidebar). Pick a photo from your device, choose how
                  many colours you want it reduced to, and the importer quantises the image
                  and turns each pixel into a coloured custom key on your chart.
                </p>
                <p>
                  This works best for relatively simple, blocky images. Detailed photos tend
                  to produce charts that are larger than you can practically knit. After
                  import, you can resize the chart, swap colours, and tweak individual cells
                  exactly like a hand-drawn chart.
                </p>
                <Placeholder label="photo import flow — original photo next to generated chart" />
              </Section>

              <Section id="save-and-load" title="Saving and loading your work" level={2}>
                <p>
                  There's no auto-save and no cloud account — you keep your designs in
                  <code className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">
                    .knitlab
                  </code>
                  files on your own device. Use the Save button in the top toolbar to
                  download one, and the Open button (in the sidebar's file panel) to load
                  one back in.
                </p>
                <p>
                  A <code>.knitlab</code> file is a compressed snapshot of your entire
                  workspace: every sheet, every layer, every custom key, the whole undo
                  history reset. They're pretty small (usually a few KB) so it's fine to
                  keep many of them in a project folder or sync them via Dropbox / iCloud /
                  whatever you already use.
                </p>
              </Section>

              <Section id="browse-explore" title="Browsing Explore & remixing" level={2}>
                <p>
                  The grid icon in the top toolbar opens <strong>Explore</strong> — a public
                  gallery of designs that other Knitlab users have published. Browse, filter
                  by tag, search by title, and click any card to see it bigger.
                </p>
                <p>
                  When you find something you like, click <strong>Open in editor</strong>.
                  The design loads as your active workspace and you can knit it as-is, tweak
                  it, or remix it into something new. If you publish your remix later,
                  Knitlab automatically credits the original designer.
                </p>
                <Placeholder label="Explore gallery view with a few designs visible" />
              </Section>
            </Section>

            {/* ───── Section 2: Publishing ───── */}
            <Section id="publishing" title="Publishing your design" level={1}>
              <p>
                When your design is ready to share, you can publish it to the Explore
                gallery so other Knitlab users can find, open, and remix it. Publishing is
                free, doesn't require an account beyond GitHub, and is reviewed by a human
                before your design goes live.
              </p>

              <Section id="what-publish-means" title='What "publish" actually does' level={2}>
                <p>
                  Publishing in Knitlab works through GitHub. When you click
                  <strong> Publish</strong>, Knitlab packages up your design and helps you
                  submit it as a GitHub issue. A maintainer reviews the submission, and if
                  it looks good, your design appears in the Explore gallery within a few
                  minutes.
                </p>
                <p>
                  You'll need a free GitHub account to file the issue. That's the only
                  account Knitlab will ever ask for, and your username is the only thing
                  that becomes publicly attached to your design (unless you choose to enter a
                  separate display name in the publish form).
                </p>
              </Section>

              <Section id="what-gets-included" title="What gets included in a published design" level={2}>
                <p>
                  Only the things needed to render the chart you're looking at. Specifically:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Your active sheet</strong> — the one currently selected in the
                    sidebar. Other sheets stay private.
                  </li>
                  <li>
                    <strong>The custom keys that sheet actually uses.</strong> Unused keys
                    elsewhere in your palette are stripped out, so you don't accidentally
                    leak custom stitches you'd built for another project.
                  </li>
                  <li>
                    <strong>A small thumbnail</strong> generated from your chart for the
                    gallery card.
                  </li>
                </ul>
                <p>
                  The publish form shows you the thumbnail before you submit, so you can
                  double-check what's about to go out.
                </p>
              </Section>

              <Section id="publish-steps" title="Step by step" level={2}>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    Make sure the sheet you want to publish is the active one. Switch sheets
                    via the Sheets panel if needed.
                  </li>
                  <li>
                    Click the <strong>Publish</strong> (share) button in the top toolbar.
                  </li>
                  <li>
                    Fill in a title, optional description, optional tags (comma-separated),
                    and an optional display name. The thumbnail generates automatically.
                  </li>
                  <li>
                    Click <strong>Continue to Submit</strong>, then <strong>Copy submission &
                    open GitHub</strong>. Knitlab copies the prepared issue body to your
                    clipboard and opens GitHub in a new tab.
                  </li>
                  <li>
                    On GitHub, click into the empty <strong>Add a description</strong> field
                    and paste with <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">Cmd/Ctrl+V</kbd>.
                    The body is large (it contains your encoded design), so always paste —
                    don't try to type it.
                  </li>
                  <li>
                    Click <strong>Submit new issue</strong>. That's it on your end.
                  </li>
                </ol>
                <Placeholder label="publish modal showing the form filled in with a sample design" />
              </Section>

              <Section id="remix-attribution" title="Remixing & attribution" level={2}>
                <p>
                  If you opened your design from Explore and edited it, the publish form
                  shows a small "Remix of …" badge and Knitlab carries the original
                  designer's name through automatically. The maintainer can verify the
                  remix relationship, and the gallery displays it on the new card so the
                  original creator gets credit.
                </p>
                <p>
                  If you didn't change anything from the original, the form warns you —
                  publishing an unchanged copy will usually be rejected, since it's just a
                  duplicate of an existing design.
                </p>
              </Section>

              <Section id="after-submit" title="After you submit" level={2}>
                <p>
                  A maintainer reviews each submission by hand. It usually takes a day or
                  two. Once approved, your design appears in the Explore gallery within a
                  few minutes — no further action needed on your end.
                </p>
                <p>
                  If something needs fixing — a typo in the title, a missing tag — you can
                  comment on your own issue and the maintainer will adjust before merging,
                  or you can withdraw and resubmit.
                </p>
                <p>
                  Want to take down a published design later? Comment on the original issue
                  asking for removal, and a maintainer will pull it from the gallery.
                </p>
              </Section>
            </Section>
          </article>
        </main>
      </div>
    </div>
  );
};
