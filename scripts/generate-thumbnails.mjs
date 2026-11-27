#!/usr/bin/env node
/**
 * generate-thumbnails.mjs
 *
 * Pre-generates 480px WebP thumbnails in public/images/thumbs/<id>.webp
 * and records natural dimensions in src/data/thumb-manifest.json so that:
 *   1. Masonry cards reserve exact aspect-ratio space (fixing CLS + broken lazy loading)
 *   2. Card images serve tiny local WebP (~20-45 KB) cached by sw.js instead of slow 500 KB+ remote origins
 *   3. Known non-image / placeholder URLs (e.g. picsum smoke tests, threads HTML) are flagged `bad: true`
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROMPTS_PATH = path.join(ROOT, 'src/data/prompts.json');
const MANIFEST_PATH = path.join(ROOT, 'src/data/thumb-manifest.json');
const THUMBS_DIR = path.join(ROOT, 'public/images/thumbs');

const FORCE = process.argv.includes('--force');
const CONCURRENCY = 14;
const THUMB_WIDTH = 480;
const TIMEOUT_MS = 15000;

const PLACEHOLDER_HOSTS = ['picsum.photos'];

function safeId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function isPlaceholderUrl(url) {
  return PLACEHOLDER_HOSTS.some((h) => url.includes(h));
}

async function fetchBufferWithTimeout(url) {
  let fetchUrl = url;
  if (fetchUrl.includes('images.meigen.ai/cdn-cgi/image/')) {
    fetchUrl = fetchUrl.replace(
      /\/cdn-cgi\/image\/[^/]+\//,
      '/cdn-cgi/image/format=jpeg,quality=85,width=480/'
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(fetchUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PromptGalleryThumbBot/1.0)',
        Accept: 'image/webp,image/png,image/jpeg,*/*;q=0.8',
      },
    });
    if (!res.ok) {
      return { ok: false, reason: `HTTP ${res.status}` };
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct && !ct.startsWith('image/') && !ct.includes('octet-stream')) {
      return { ok: false, reason: `non-image content-type: ${ct}` };
    }
    const arr = await res.arrayBuffer();
    return { ok: true, buffer: Buffer.from(arr) };
  } catch (err) {
    return { ok: false, reason: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
}

async function processEntry(entry, manifest) {
  const id = String(entry.id);
  const rawImg = (entry.image || '').trim();
  if (!rawImg) {
    manifest[id] = { bad: true, reason: 'empty' };
    return 'bad';
  }

  if (isPlaceholderUrl(rawImg)) {
    manifest[id] = { bad: true, reason: 'placeholder' };
    return 'bad';
  }

  const fileName = `${safeId(id)}.webp`;
  const thumbRel = `/images/thumbs/${fileName}`;
  const thumbAbs = path.join(THUMBS_DIR, fileName);

  if (!FORCE && manifest[id] && !manifest[id].bad && fs.existsSync(thumbAbs)) {
    return 'cached';
  }

  let inputBuffer = null;
  if (rawImg.startsWith('/')) {
    const cleanRel = rawImg.replace(/[?#].*$/, '').replace(/^\/+/, '');
    const localAbs = path.join(ROOT, 'public', cleanRel);
    if (!fs.existsSync(localAbs)) {
      manifest[id] = { bad: true, reason: 'missing local file' };
      return 'bad';
    }
    inputBuffer = fs.readFileSync(localAbs);
  } else if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
    const fetched = await fetchBufferWithTimeout(rawImg);
    if (!fetched.ok) {
      if (fetched.reason.startsWith('non-image') || fetched.reason === 'HTTP 404' || fetched.reason === 'HTTP 410') {
        manifest[id] = { bad: true, reason: fetched.reason };
        return 'bad';
      }
      return 'failed:' + fetched.reason;
    }
    inputBuffer = fetched.buffer;
  } else {
    manifest[id] = { bad: true, reason: 'unsupported url' };
    return 'bad';
  }

  try {
    const pipeline = sharp(inputBuffer, { failOn: 'none' }).rotate();
    const { data, info } = await pipeline
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    fs.writeFileSync(thumbAbs, data);
    manifest[id] = {
      w: info.width,
      h: info.height,
      bytes: data.length,
      thumb: thumbRel,
    };
    return 'generated';
  } catch (err) {
    return 'failed:sharp:' + String(err?.message || err);
  }
}

async function main() {
  fs.mkdirSync(THUMBS_DIR, { recursive: true });
  const prompts = JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf-8'));
  let manifest = {};
  if (!FORCE && fs.existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    } catch {
      manifest = {};
    }
  }

  const stats = { generated: 0, cached: 0, bad: 0, failed: 0 };
  const failures = [];
  let cursor = 0;

  async function worker() {
    while (cursor < prompts.length) {
      const idx = cursor++;
      const entry = prompts[idx];
      const status = await processEntry(entry, manifest);
      if (status === 'generated') stats.generated++;
      else if (status === 'cached') stats.cached++;
      else if (status === 'bad') stats.bad++;
      else {
        stats.failed++;
        failures.push({ id: entry.id, image: entry.image, reason: status });
      }
      const done = stats.generated + stats.cached + stats.bad + stats.failed;
      if (done % 50 === 0 || done === prompts.length) {
        console.log(`Progress: ${done}/${prompts.length} (gen=${stats.generated}, cached=${stats.cached}, bad=${stats.bad}, fail=${stats.failed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  // Sort manifest keys deterministically
  const sortedManifest = {};
  for (const k of Object.keys(manifest).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b))) {
    sortedManifest[k] = manifest[k];
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(sortedManifest, null, 2) + '\n', 'utf-8');

  let totalBytes = 0;
  for (const val of Object.values(sortedManifest)) {
    if (val && typeof val.bytes === 'number') totalBytes += val.bytes;
  }
  console.log(`\nDone. Total thumb size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  if (failures.length > 0) {
    console.log(`Failures (${failures.length}):`);
    failures.slice(0, 15).forEach((f) => console.log(`  id=${f.id} ${f.reason} -> ${f.image}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
