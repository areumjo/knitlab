# Explore Backend Spec

Design schema for the public Explore gallery backed by GitHub Issues. This doc is the contract between three places that must agree:
- The publish flow in the app (`PublishModal` builds an issue body)
- The GitHub Action (parses the issue, writes files)
- The browse flow in the app (reads `manifest.json`, fetches `.knitlab` payloads)

## File layout in the repo

```
/public/manifest.json            # gallery index, fetched by app
/public/designs/{id}.knitlab     # compressed payload per design
/public/thumbnails/{id}.png      # preview image per design
```

These live under `public/` so Vite copies them verbatim into the build output (`dist/`). On deploy, they end up at:

```
https://areumjo.github.io/knitlab/manifest.json
https://areumjo.github.io/knitlab/designs/{id}.knitlab
https://areumjo.github.io/knitlab/thumbnails/{id}.png
```

All three are committed by the Action when a maintainer approves a submission. The existing GitHub Pages deploy workflow picks them up on push to `main` and rebuilds (~30s before the new design is live).

**In code, fetch with the BASE_URL prefix** (Vite's `base: '/knitlab/'` setting):
```ts
const manifest = await fetch(`${import.meta.env.BASE_URL}manifest.json`).then(r => r.json());
```

## Manifest schema (`manifest.json`)

```ts
interface Manifest {
  version: 1;
  updated: string;          // ISO timestamp, set by Action on each commit
  designs: ManifestEntry[];
}

interface ManifestEntry {
  id: string;               // issue number as string, e.g. "42"
  title: string;            // <= 80 chars
  author: string;           // display name; defaults to submitter's GitHub username
  submitter: string;        // GitHub username (always known, set by Action)
  description?: string;     // <= 500 chars
  tags: string[];           // lowercase, no spaces, e.g. ["lace", "hat"]
  date: string;             // ISO date when approved
  thumbnailUrl: string;     // "/thumbnails/{id}.png"
  payloadUrl: string;       // "/designs/{id}.knitlab"
  issueUrl: string;         // GitHub issue URL for comments/community
  remixOf?: string;         // parent design id, if this is a remix
}
```

**Example:**
```json
{
  "version": 1,
  "updated": "2026-04-26T10:00:00Z",
  "designs": [
    {
      "id": "42",
      "title": "Simple Lace Hat",
      "author": "Areum Jo",
      "submitter": "areumjo",
      "description": "A beginner-friendly lace pattern.",
      "tags": ["lace", "hat", "beginner"],
      "date": "2026-04-26",
      "thumbnailUrl": "thumbnails/42.png",
      "payloadUrl": "designs/42.knitlab",
      "issueUrl": "https://github.com/areumjo/knitlab/issues/42"
    }
  ]
}
```

## Design ID convention

`id` = the GitHub issue number as a string (e.g. `"42"`).

**Why issue numbers, not hashes:**
- Trivial mapping back to source for moderation
- Monotonic, naturally sortable by recency
- Easy to debug; the source is already public on GitHub
- Avoids hash-collision concerns

If an issue is later deleted, its `id` is simply absent from the manifest. Gaps are fine.

## Remix metadata in `.knitlab`

When a user opens someone else's design, the app stamps remix metadata onto the in-memory `ApplicationState`. These are optional, backward-compatible fields:

```ts
interface ApplicationState {
  // ...existing fields...

  // Set when this chart was opened from a published design.
  // Persists through save/load cycles in .knitlab files.
  originalDesignId?: string;
  originalAuthor?: string;
  originalTitle?: string;
}
```

**Single-level chain only.** Metadata records the *direct* parent, not the full ancestry. Republishing a remix produces a manifest entry with `remixOf` pointing at its immediate parent. Deeper chains are reconstructible by walking `manifest.json`, not by stuffing an array into every chart.

**Behavior:**
- Opening a published design → app sets the three fields from the manifest entry
- User saves locally → fields persist in `.knitlab`
- User opens that local file later → fields persist; UI shows "Remix of …" badge
- User republishes → publish flow reads these and includes `remixOf: originalDesignId` in the new submission

## Issue body format

The publish flow in the app builds an issue body in a fixed shape and passes it through GitHub's `?body=...` URL prefill. The Action parses by `### ` headers, so any source that produces this shape will round-trip correctly.

```markdown
### Title
My Cool Design

### Author
Areum Jo

### Description
A short description of what this is.

### Tags
lace, hat, beginner

### Remix of
42

### Thumbnail
```knitlab-thumbnail
<base64 PNG, no whitespace>
```

### Payload
```knitlab-payload
<base64 .knitlab, no whitespace>
```
```

The Action keys off the `### ` headers and the fenced code-block language tags (`knitlab-thumbnail`, `knitlab-payload`) to extract each section. Fields are required *except* `Description` and `Remix of`. If a required field is missing, the Action posts an explanatory comment and does not publish.

## Update / delete policy (v1)

- **Updates:** designs are immutable once published. To "update," users submit a new issue (which becomes a new manifest entry). The old entry stays unless explicitly removed.
- **Deletes:** maintainer-only. Maintainer manually edits `manifest.json` and removes the corresponding files in `designs/` and `thumbnails/`. Documented in `docs/MODERATION.md` (task #14).
- **Reports:** community can report a design by commenting on its issue. No automated takedown flow in v1.

## Versioning

`manifest.version: 1` declares the schema version. If the schema ever needs to evolve (e.g., add a `license` field), the app reads `version` first and either migrates in-memory or refuses to load older versions. Don't bump unless a breaking change is unavoidable.
