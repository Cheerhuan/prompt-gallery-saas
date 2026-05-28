#!/usr/bin/env node
/**
 * import-meigen-prompts.mjs
 *
 * 每日從 meigen.ai 擷取新的 featured prompts 並匯入 prompt-gallery-saas。
 * 會自動比對已匯入的 tweet ID，避免重複。
 *
 * 用法：
 *   node scripts/import-meigen-prompts.mjs          # 匯入新的 prompts（最多 10 個）
 *   node scripts/import-meigen-prompts.mjs --dry-run  # 僅顯示結果，不寫入
 *   node scripts/import-meigen-prompts.mjs --reset-track  # 清除追蹤記錄
 *
 * 搭配 cron 每日 06:00 自動執行。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(PROJECT_ROOT, 'src/data/prompts.json');
const TRACK_FILE = path.join(PROJECT_ROOT, 'scripts/.meigen-track.json');
const MAX_PER_RUN = 10;

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isReset = args.includes('--reset-track');

// ── Track file management ──
function loadTrack() {
  try {
    return JSON.parse(fs.readFileSync(TRACK_FILE, 'utf-8'));
  } catch {
    return { used: [] };
  }
}

function saveTrack(track) {
  fs.writeFileSync(TRACK_FILE, JSON.stringify(track, null, 2));
}

if (isReset) {
  saveTrack({ used: [] });
  console.log('✅ Track file reset');
  process.exit(0);
}

// ── Step 1: Fetch meigen.ai homepage for all prompt IDs ──
async function fetchHomepage() {
  const resp = await fetch('https://www.meigen.ai/');
  const text = await resp.text();
  const tweetIds = [...text.matchAll(/\/prompt\/(\d{16,20})/g)].map(m => m[1]);
  return [...new Set(tweetIds)]; // deduplicate
}

// ── Step 2: Fetch a prompt detail page ──
async function fetchPromptDetail(tweetId) {
  const resp = await fetch(`https://www.meigen.ai/prompt/${tweetId}`);
  const html = await resp.text();

  // Extract title from <title>
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const rawTitle = titleMatch ? titleMatch[1].replace(/ \| MeiGen$/, '').trim() : '';

  // Extract creator from title (format: "GPT Image 1 Prompt by @username")
  const creatorMatch = rawTitle.match(/@(\S+)/);
  const creator = creatorMatch ? creatorMatch[1] : 'unknown';

  // Extract model from title
  const modelMatch = rawTitle.match(/^(GPT Image|Midjourney|Nano Banana|SDXL|DALL-E)/);
  const model = modelMatch ? modelMatch[1] : 'GPT Image';

  // Extract full prompt text from description/content
  // Look for the long paragraph content
  const paragraphMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/g);
  let fullPrompt = '(Prompt text not available)';
  if (paragraphMatch) {
    // Find the longest paragraph (that's likely the prompt)
    const paragraphs = paragraphMatch
      .map(p => p.replace(/<[^>]*>/g, '').trim())
      .filter(p => p.length > 100);
    if (paragraphs.length > 0) {
      fullPrompt = paragraphs.reduce((a, b) => a.length > b.length ? a : b);
    }
  }

  // Generate a concise title from the prompt start
  const shortTitle = fullPrompt.length > 80
    ? fullPrompt.replace(/["']/g, '').slice(0, 77).trim() + '...'
    : fullPrompt.slice(0, 50) + '...';

  return {
    title: shortTitle,
    image: `https://images.meigen.ai/cdn-cgi/image/format=auto,quality=85/tweets/${tweetId}/0.jpg`,
    full_prompt: fullPrompt,
    model: model,
    creator: creator,
    tier: 'free',
    _source: 'meigen.ai',
    _version: '2026-05-28-v1',
  };
}

// ── Step 3: Append to prompts.json ──
function appendToData(newEntries) {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const numericIds = data
    .filter(d => /^\d+$/.test(d.id))
    .map(d => parseInt(d.id, 10));
  const maxId = Math.max(...numericIds, 0);

  let nextId = maxId + 1;
  for (const entry of newEntries) {
    entry.id = String(nextId++);
    data.push(entry);
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2, 'utf-8'));
  return data.length;
}

// ── Main ──
async function main() {
  console.log('🔍 Fetching meigen.ai homepage...');
  let allIds;
  try {
    allIds = await fetchHomepage();
  } catch (err) {
    console.error('❌ Failed to fetch homepage:', err.message);
    process.exit(1);
  }

  if (allIds.length === 0) {
    console.log('⚠️  No prompt IDs found on homepage');
    process.exit(0);
  }

  console.log(`📋 Found ${allIds.length} total prompt IDs on homepage`);

  // Filter out already-tracked IDs
  const track = loadTrack();
  const newIds = allIds.filter(id => !track.used.includes(id));

  if (newIds.length === 0) {
    console.log('✅ No new prompts to import');
    process.exit(0);
  }

  console.log(`🆕 ${newIds.length} new prompts found (importing up to ${MAX_PER_RUN})`);

  // Process up to MAX_PER_RUN
  const toImport = newIds.slice(0, MAX_PER_RUN);
  const imported = [];

  for (const tweetId of toImport) {
    console.log(`  📥 Fetching prompt ${tweetId}...`);
    try {
      const entry = await fetchPromptDetail(tweetId);
      imported.push(entry);
      track.used.push(tweetId);
      console.log(`    ✅ ${entry.title.slice(0, 60)}... by ${entry.creator}`);
    } catch (err) {
      console.error(`    ❌ Failed: ${err.message}`);
      // Still mark as used to avoid retrying broken links
      track.used.push(tweetId);
    }
    // Small delay to be polite
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n📦 ${imported.length} prompts ready for import`);

  if (isDryRun) {
    console.log('📍 Dry-run — not writing to file');
    console.log(JSON.stringify(imported, null, 2));
  } else {
    saveTrack(track);
    const total = appendToData(imported);
    console.log(`✅ Wrote ${imported.length} entries to prompts.json (total: ${total})`);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
