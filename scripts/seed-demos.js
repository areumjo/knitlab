#!/usr/bin/env node
/**
 * Seed the Explore gallery with the demo charts in /demo.
 *
 * For each entry in DEMOS:
 *   - Reads /demo/<file>.json (legacy ApplicationState format)
 *   - Re-serializes to compressed .knitlab format → public/designs/<id>.knitlab
 *   - Renders a low-res cell-color preview PNG → public/thumbnails/<id>.png
 *   - Updates public/manifest.json with the new entry
 *
 * Idempotent: re-running replaces any existing entries with matching ids.
 *
 * Run with: node scripts/seed-demos.js
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { pack } from 'msgpackr';
import { compressSync } from 'fflate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Edit this list to change demo metadata ----
const DEMOS = [
  { file: 'clawd-0-logo.json',       id: '1', title: 'Claude Logo',  tags: ['logo', 'clawd'],          description: 'Claude logo chart.' },
  { file: 'clawd-1-coffee.json',     id: '2', title: 'Coffee',       tags: ['coffee', 'clawd'],        description: 'Coffee cup chart.' },
  { file: 'clawd-2-magnifier.json',  id: '3', title: 'Magnifier',    tags: ['magnifier', 'clawd'],     description: 'Magnifying glass chart.' },
  { file: 'clawd-3-skateboard.json', id: '4', title: 'Skateboard',   tags: ['skateboard', 'clawd'],    description: 'Skateboard chart.' },
];

const AUTHOR = 'Areum Jo';
const SUBMITTER = 'areumjo';
const REPO_URL = 'https://github.com/areumjo/knitlab';
// -------------------------------------------------

const ROOT = path.join(__dirname, '..');
const DEMO_DIR = path.join(ROOT, 'demo');
const DESIGNS_DIR = path.join(ROOT, 'public', 'designs');
const THUMBNAILS_DIR = path.join(ROOT, 'public', 'thumbnails');
const MANIFEST_PATH = path.join(ROOT, 'public', 'manifest.json');

// ---- Compact serialization (mirrors services/serializationService.ts) ----

function toCompactFormat(state) {
  return {
    v: 1,
    p: state.keyPalette.map(k => ({
      i: k.id, n: k.name, ab: k.abbreviation,
      w: k.width, h: k.height,
      bg: k.backgroundColor, sc: k.symbolColor,
      c: k.cells, l: k.lines,
    })),
    s: state.sheets.map(s => ({
      i: s.id, n: s.name, r: s.rows, c: s.cols,
      o: s.orientation, d: s.displaySettings,
      l: s.layers.map(layer => ({
        i: layer.id, n: layer.name, v: layer.isVisible,
        k: (layer.keyPlacements || []).map(kp => ({
          x: kp.anchor.x, y: kp.anchor.y, id: kp.keyId,
        })),
      })),
      al: s.activeLayerId,
    })),
    a: state.activeSheetId,
  };
}

function serialize(state) {
  const compact = toCompactFormat(state);
  const msgpackBytes = pack(compact);
  const compressed = compressSync(new Uint8Array(msgpackBytes));
  return Buffer.from(compressed).toString('base64');
}

// ---- PNG generation (no external deps) ----

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(width, height, rgba) {
  const stride = width * 4;
  const filtered = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (stride + 1)] = 0; // None filter
    rgba.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(filtered);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);   // bit depth
  ihdr.writeUInt8(6, 9);   // color type 6 = RGBA
  ihdr.writeUInt8(0, 10);  // compression
  ihdr.writeUInt8(0, 11);  // filter
  ihdr.writeUInt8(0, 12);  // interlace

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Thumbnail rendering ----

function resolveColor(c) {
  if (!c) return [229, 231, 235]; // neutral-200
  if (c === 'transparent_grid_bg') return [229, 231, 235];
  if (c === 'theme_default_background') return [252, 252, 252];
  if (c === 'theme_default_symbol_color') return [31, 41, 55];
  const m = String(c).match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (m) return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  return [229, 231, 235];
}

function renderThumbnail(state) {
  const sheet = state.sheets.find(s => s.id === state.activeSheetId) ?? state.sheets[0];
  const layer = sheet.layers.find(l => l.isVisible) ?? sheet.layers[0];
  const palette = new Map(state.keyPalette.map(k => [k.id, k]));

  // Cell-block size: scale the grid up so the long axis is around 400px,
  // capped between 4 and 20 px per cell.
  const longAxis = Math.max(sheet.rows, sheet.cols);
  const cellSize = Math.max(4, Math.min(20, Math.floor(400 / longAxis)));

  const width = sheet.cols * cellSize;
  const height = sheet.rows * cellSize;
  const rgba = Buffer.alloc(width * height * 4);

  for (let cy = 0; cy < sheet.rows; cy++) {
    for (let cx = 0; cx < sheet.cols; cx++) {
      const cell = layer.grid?.[cy]?.[cx];
      const keyDef = cell?.keyId ? palette.get(cell.keyId) : null;
      const [r, g, b] = resolveColor(keyDef?.backgroundColor);
      for (let py = 0; py < cellSize; py++) {
        for (let px = 0; px < cellSize; px++) {
          const idx = ((cy * cellSize + py) * width + (cx * cellSize + px)) * 4;
          rgba[idx + 0] = r;
          rgba[idx + 1] = g;
          rgba[idx + 2] = b;
          rgba[idx + 3] = 255;
        }
      }
    }
  }

  return makePng(width, height, rgba);
}

// ---- Main ----

function main() {
  fs.mkdirSync(DESIGNS_DIR, { recursive: true });
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const ids = new Set(DEMOS.map(d => d.id));
  manifest.designs = manifest.designs.filter(d => !ids.has(d.id));

  const date = new Date().toISOString().split('T')[0];

  for (const demo of DEMOS) {
    const jsonPath = path.join(DEMO_DIR, demo.file);
    if (!fs.existsSync(jsonPath)) {
      console.warn(`SKIP: ${demo.file} not found`);
      continue;
    }
    const state = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const payload = serialize(state);
    fs.writeFileSync(path.join(DESIGNS_DIR, `${demo.id}.knitlab`), payload);

    const png = renderThumbnail(state);
    fs.writeFileSync(path.join(THUMBNAILS_DIR, `${demo.id}.png`), png);

    manifest.designs.push({
      id: demo.id,
      title: demo.title,
      author: AUTHOR,
      submitter: SUBMITTER,
      description: demo.description,
      tags: demo.tags,
      date,
      thumbnailUrl: `thumbnails/${demo.id}.png`,
      payloadUrl: `designs/${demo.id}.knitlab`,
      issueUrl: REPO_URL,
    });

    const sheet = state.sheets[0];
    console.log(`Seeded #${demo.id}: ${demo.title} (${sheet.cols}x${sheet.rows})`);
  }

  manifest.updated = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nWrote ${DEMOS.length} demos to public/manifest.json`);
}

main();
