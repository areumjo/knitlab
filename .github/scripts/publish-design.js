#!/usr/bin/env node
/**
 * Parse a design-submission issue body, validate it, and write the design
 * payload + thumbnail + manifest entry into public/. Run by the
 * publish-design GitHub Action when a maintainer applies the "approved" label.
 *
 * On failure, posts an explanatory comment on the issue and exits non-zero
 * so the workflow halts before committing.
 *
 * Spec: docs/EXPLORE_BACKEND.md
 */

const fs = require('fs');
const path = require('path');

const {
  GITHUB_TOKEN,
  ISSUE_NUMBER,
  ISSUE_BODY = '',
  ISSUE_USER,
  REPO,
  GITHUB_OUTPUT,
} = process.env;

const MAX_TITLE = 80;
const MAX_DESCRIPTION = 500;
const MAX_THUMBNAIL_BYTES = 500_000;
const MIN_PAYLOAD_LENGTH = 100;

const NO_RESPONSE = '_No response_';

function parseSection(body, label) {
  const lines = body.split('\n');
  let inSection = false;
  const collected = [];
  for (const line of lines) {
    if (line.startsWith('### ')) {
      const header = line.slice(4).trim();
      if (header === label) {
        inSection = true;
        continue;
      } else if (inSection) {
        break;
      }
    } else if (inSection) {
      collected.push(line);
    }
  }
  return collected.join('\n').trim();
}

function cleanOptional(value) {
  return !value || value === NO_RESPONSE ? '' : value;
}

function extractCodeBlock(text, language) {
  const re = new RegExp('```' + language + '\\s*\\n([\\s\\S]*?)\\n```');
  const match = text.match(re);
  return match ? match[1].trim() : null;
}

async function commentFailure(message) {
  if (!GITHUB_TOKEN || !REPO || !ISSUE_NUMBER) return;
  const url = `https://api.github.com/repos/${REPO}/issues/${ISSUE_NUMBER}/comments`;
  const body = `Could not publish this design: **${message}**\n\nFix the issue body and re-apply the \`approved\` label, or remove the label to dismiss.`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      console.error(`Failed to post comment: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error(`Error posting comment: ${err.message}`);
  }
}

function writeOutput(key, value) {
  if (GITHUB_OUTPUT) {
    fs.appendFileSync(GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

async function main() {
  if (!ISSUE_BODY) throw new Error('Issue body is empty');
  if (!ISSUE_NUMBER) throw new Error('ISSUE_NUMBER not provided');

  // --- Parse ---
  const title = parseSection(ISSUE_BODY, 'Title').replace(/[\r\n]+/g, ' ').trim();
  if (!title) throw new Error('Title is required');
  if (title.length > MAX_TITLE) throw new Error(`Title exceeds ${MAX_TITLE} characters`);

  // Default to GitHub username; user can override with a display name in the form.
  const author = cleanOptional(parseSection(ISSUE_BODY, 'Author')) || ISSUE_USER || 'Anonymous';

  const description = cleanOptional(parseSection(ISSUE_BODY, 'Description'));
  if (description.length > MAX_DESCRIPTION) {
    throw new Error(`Description exceeds ${MAX_DESCRIPTION} characters`);
  }

  const tagsRaw = cleanOptional(parseSection(ISSUE_BODY, 'Tags'));
  const tags = tagsRaw
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean);

  const remixOf = cleanOptional(parseSection(ISSUE_BODY, 'Remix of')).trim();
  if (remixOf && !/^\d+$/.test(remixOf)) {
    throw new Error('Remix of must be a numeric design ID');
  }

  const thumbnailSection = parseSection(ISSUE_BODY, 'Thumbnail');
  const thumbnailB64Raw = extractCodeBlock(thumbnailSection, 'knitlab-thumbnail');
  if (!thumbnailB64Raw) throw new Error('Thumbnail block is missing or malformed');
  const thumbnailB64 = thumbnailB64Raw.replace(/\s/g, '');

  const payloadSection = parseSection(ISSUE_BODY, 'Payload');
  const payloadRaw = extractCodeBlock(payloadSection, 'knitlab-payload');
  if (!payloadRaw) throw new Error('Payload block is missing or malformed');
  const payload = payloadRaw.replace(/\s/g, '');

  // --- Validate payload (.knitlab is itself a base64 string) ---
  if (!/^[A-Za-z0-9+/=]+$/.test(payload)) {
    throw new Error('Payload does not look like a valid base64 string');
  }
  if (payload.length < MIN_PAYLOAD_LENGTH) {
    throw new Error('Payload is suspiciously small');
  }

  // --- Validate thumbnail (must be PNG) ---
  if (!/^[A-Za-z0-9+/=]+$/.test(thumbnailB64)) {
    throw new Error('Thumbnail is not valid base64');
  }
  const thumbnailBytes = Buffer.from(thumbnailB64, 'base64');
  if (thumbnailBytes.length > MAX_THUMBNAIL_BYTES) {
    throw new Error(`Thumbnail too large (${thumbnailBytes.length} bytes, max ${MAX_THUMBNAIL_BYTES})`);
  }
  // PNG magic number: 89 50 4E 47
  if (
    thumbnailBytes[0] !== 0x89 ||
    thumbnailBytes[1] !== 0x50 ||
    thumbnailBytes[2] !== 0x4e ||
    thumbnailBytes[3] !== 0x47
  ) {
    throw new Error('Thumbnail is not a valid PNG image');
  }

  // --- Write files ---
  const thumbnailPath = path.join('public', 'thumbnails', `${ISSUE_NUMBER}.png`);
  fs.writeFileSync(thumbnailPath, thumbnailBytes);

  const payloadPath = path.join('public', 'designs', `${ISSUE_NUMBER}.knitlab`);
  fs.writeFileSync(payloadPath, payload);

  // --- Update manifest ---
  const manifestPath = path.join('public', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  const entry = {
    id: String(ISSUE_NUMBER),
    title,
    author,
    submitter: ISSUE_USER,
    tags,
    date: new Date().toISOString().split('T')[0],
    thumbnailUrl: `thumbnails/${ISSUE_NUMBER}.png`,
    payloadUrl: `designs/${ISSUE_NUMBER}.knitlab`,
    issueUrl: `https://github.com/${REPO}/issues/${ISSUE_NUMBER}`,
  };
  if (description) entry.description = description;
  if (remixOf) entry.remixOf = remixOf;

  manifest.designs = manifest.designs.filter(d => d.id !== entry.id);
  manifest.designs.push(entry);
  manifest.updated = new Date().toISOString();

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  writeOutput('title', title);
  console.log(`Published design #${ISSUE_NUMBER}: ${title}`);
}

main().catch(async err => {
  console.error(err.message);
  await commentFailure(err.message);
  process.exit(1);
});
