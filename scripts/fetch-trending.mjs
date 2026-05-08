#!/usr/bin/env node

/**
 * Trending Prompt Curator — CLI Tool
 * 
 * Fetches REAL trending AI prompts with images from:
 * - CivitAI API (most reacted images, SFW only)
 * - Reddit r/midjourney (hot posts with images)
 * 
 * Usage:
 *   node scripts/fetch-trending.mjs                           # fetch & download (default: 10)
 *   node scripts/fetch-trending.mjs --source civitai           # specific source only
 *   node scripts/fetch-trending.mjs --count 5                  # specify count
 *   node scripts/fetch-trending.mjs --dry-run                  # preview only, no download/merge
 *   node scripts/fetch-trending.mjs --no-download              # generate entries without downloading
 *   node scripts/fetch-trending.mjs --output tmp/output.json   # custom output path
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, extname, dirname } from 'path';

// ═══════════════════════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════════════════════

const CIVITAI_API = 'https://civitai.com/api/v1/images';
const REDDIT_MIDJOURNEY = 'https://www.reddit.com/r/midjourney/hot.json';
const REDDIT_USER_AGENT = 'prompt-gallery-saas/1.0 (by u/Cheerhuan)';
const IMAGES_DIR = 'public/images';
const PROMPTS_PATH = 'src/data/prompts.json';
const BASE_PATH = '/prompt-gallery-saas';

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeFilename(text, maxLen = 60) {
  return text
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen)
    .toLowerCase() || 'prompt';
}

function slugify(text) {
  return text
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff\s]/g, '')
    .trim()
    .slice(0, 30)
    .replace(/\s+/g, '-');
}

async function downloadFile(url, destPath) {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': REDDIT_USER_AGENT },
    });
    if (!resp.ok) {
      console.error(`  ⚠️ Download failed (${resp.status}): ${url.slice(0, 60)}`);
      return false;
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    writeFileSync(destPath, buffer);
    const sizeKB = (buffer.length / 1024).toFixed(1);
    console.log(`  ✅ Downloaded (${sizeKB}KB): ${destPath.split('/').pop()}`);
    return true;
  } catch (err) {
    console.error(`  ⚠️ Download error: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Source 1: CivitAI
// ═══════════════════════════════════════════════════════════════

async function fetchCivitai({ count, noDownload }) {
  console.log('\n📡 Fetching from CivitAI (Most Reacted, SFW)...');
  
  const entries = [];
  const pagesNeeded = Math.ceil(count / 20);
  let fetched = 0;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout per source
  
  try {
    for (let page = 1; page <= pagesNeeded && fetched < count; page++) {
      const url = `${CIVITAI_API}?sort=${encodeURIComponent('Most Reactions')}&limit=20&page=${page}&nsfw=false`;
      
    let resp;
    try {
      resp = await fetch(url);
    } catch (err) {
      console.error(`  ⚠️ CivitAI fetch error: ${err.message}`);
      break;
    }
    
    if (!resp.ok) {
      const text = await resp.text();
      console.error(`  ⚠️ CivitAI HTTP ${resp.status}: ${text.slice(0, 100)}`);
      break;
    }
    
    const data = await resp.json();
    const items = data.items || [];
    
    if (items.length === 0) break;
    
    for (const item of items) {
      if (fetched >= count) break;
      
      const meta = item.meta || {};
      let promptText = (meta.prompt || '').trim();
      if (!promptText) continue;
      
      // Skip if prompt is too short (noise)
      if (promptText.length < 10) continue;
      
      const imageUrl = item.url;
      if (!imageUrl) continue;
      
      const model = meta.Model || meta.sdxl || meta.modelVersion || 'Unknown';
      const width = item.width || 1024;
      const height = item.height || 1024;
      const stats = item.stats || {};
      const likeCount = stats.likeCount || 0;
      const heartCount = stats.heartCount || 0;
      
      // Generate intelligent title from prompt
      let cleanPrompt = promptText.trim();
      let autoTitle;
      
      // Try to find a natural language phrase (not tag soup)
      const naturalPhrases = cleanPrompt.split(',').filter(t => {
        const t2 = t.trim();
        return t2.length > 15 && !t2.startsWith('score_') && !t2.startsWith('<lora:') && !t2.startsWith('breast') && !t2.startsWith('nsfw') && /[a-zA-Z]{3,}/.test(t2);
      });
      
      if (naturalPhrases.length > 0) {
        autoTitle = naturalPhrases[0].trim().slice(0, 55);
      } else {
        // Use first meaningful tag
        const tags = cleanPrompt.split(',').map(t => t.trim()).filter(t => {
          return t.length > 5 && !t.startsWith('score_') && !t.startsWith('<lora:') && /[a-zA-Z]/.test(t);
        });
        autoTitle = (tags.length > 2 ? tags.slice(0, 3).join(', ') : tags[0]) || `Trending #${fetched + 1}`;
      }
      
      const title = autoTitle.charAt(0).toUpperCase() + autoTitle.slice(1);
      
      const ext = '.jpg';
      const imageFilename = `trending-${dateStamp()}-civitai-${slugify(title).slice(0, 25) || fetched}${ext}`;
      const imagePath = `${IMAGES_DIR}/${imageFilename}`;
      const imageUrlFull = `${BASE_PATH}/images/${imageFilename}`;
      
      const entry = {
        id: 0, // will be assigned by merge
        title: title.charAt(0).toUpperCase() + title.slice(1).replace(/-/g, ' '),
        image: imageUrlFull,
        full_prompt: promptText,
        model: `CivitAI (${model})`,
        _version: new Date().toISOString().slice(0, 10) + '-civitai',
        _source: 'civitai',
        _likes: likeCount + heartCount,
      };
      
      if (!noDownload) {
        const absPath = resolve(process.cwd(), imagePath);
        const ok = await downloadFile(imageUrl, absPath);
        if (!ok) continue;
      }
      
      entries.push(entry);
      fetched++;
    }
    
    // Be polite to the API
    if (fetched < count) await sleep(500);
    }
  } catch (err) {
    console.error(`  ⚠️ CivitAI source error: ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
  
  console.log(`  📊 Fetched ${entries.length} entries from CivitAI`);
  return entries;
}

// ═══════════════════════════════════════════════════════════════
// Source 2: Reddit r/midjourney
// ═══════════════════════════════════════════════════════════════

async function fetchRedditMidjourney({ count, noDownload }) {
  console.log('\n📡 Fetching from Reddit r/midjourney (Hot)...');
  
  const entries = [];
  let fetched = 0;
  let after = null;
  const seenIds = new Set();
  
  while (fetched < count) {
    let url = REDDIT_MIDJOURNEY;
    if (after) url += `?after=${after}`;
    
    let resp;
    try {
      resp = await fetch(url, {
        headers: { 'User-Agent': REDDIT_USER_AGENT },
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      console.error(`  ⚠️ Reddit fetch error: ${err.message}`);
      break;
    }
    
    if (!resp.ok) {
      console.error(`  ⚠️ Reddit HTTP ${resp.status}`);
      break;
    }
    
    const data = await resp.json();
    const children = data.data?.children || [];
    
    if (children.length === 0) break;
    
    after = data.data?.after;
    
    for (const child of children) {
      if (fetched >= count) break;
      
      const post = child.data;
      const postId = post.id;
      if (seenIds.has(postId)) continue;
      seenIds.add(postId);
      
      // Skip non-image posts (announcements, text-only)
      const domain = post.domain || '';
      const url = post.url || '';
      const isDirectImage = domain === 'i.redd.it' && /\.(jpg|jpeg|png|webp)$/i.test(url);
      
      let imageUrl = null;
      
      if (isDirectImage) {
        imageUrl = url;
      } else if (post.is_gallery && post.media_metadata) {
        const firstKey = Object.keys(post.media_metadata)[0];
        if (firstKey) {
          const media = post.media_metadata[firstKey];
          if (media?.status === 'valid' && media?.s?.u) {
            imageUrl = media.s.u.replace(/&amp;/g, '&');
          }
        }
      }
      
      if (!imageUrl) continue;
      
      const title = (post.title || '').trim();
      const selftext = (post.selftext || '').trim();
      
      // Skip announcements / non-prompt posts (selftext is long, title doesn't look like a prompt)
      if (selftext.length > 200 && !title.toLowerCase().includes('prompt')) {
        console.log(`  ⏭️ Skip (announcement/discussion): ${title.slice(0, 40)}`);
        continue;
      }
      
      if (!title || title.length < 5) continue;
      
      // Use title as the prompt (Midjourney posts usually have the prompt in the title)
      let promptText = title;
      
      // If there's a short selftext, it might contain the actual prompt params
      if (selftext && selftext.length < 100 && !selftext.includes('http')) {
        promptText = `${title} ${selftext}`;
      }
      
      const score = post.score || 0;
      const numComments = post.num_comments || 0;
      
      // Clean title for display
      const displayTitle = title
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/^[\s\-–—|]+|[\s\-–—|]+$/g, '')
        .trim()
        .slice(0, 60) || `Midjourney #${fetched + 1}`;
      
      const ext = extname(new URL(imageUrl).pathname) || '.jpg';
      const slug = slugify(displayTitle).slice(0, 25) || 'mj';
      const imageFilename = `trending-${dateStamp()}-reddit-${slug}${ext}`;
      const imagePath = `${IMAGES_DIR}/${imageFilename}`;
      const imageUrlFull = `${BASE_PATH}/images/${imageFilename}`;
      
      const entry = {
        id: 0,
        title: displayTitle,
        image: imageUrlFull,
        full_prompt: promptText,
        model: 'Midjourney',
        _version: new Date().toISOString().slice(0, 10) + '-reddit',
        _source: 'reddit-midjourney',
        _likes: score + numComments,
      };
      
      if (!noDownload) {
        const absPath = resolve(process.cwd(), imagePath);
        const ok = await downloadFile(imageUrl, absPath);
        if (!ok) {
          console.log(`  ⏭️ Skip (download failed): ${displayTitle.slice(0, 40)}`);
          continue;
        }
      }
      
      entries.push(entry);
      fetched++;
    }
    
    if (!after || fetched >= count) break;
    await sleep(300);
  }
  
  console.log(`  📊 Fetched ${entries.length} entries from Reddit`);
  return entries;
}

// ═══════════════════════════════════════════════════════════════
// Deduplication
// ═══════════════════════════════════════════════════════════════

function deduplicate(newEntries, existingEntries) {
  const existingPrompts = new Set(
    existingEntries.map(e => e.full_prompt?.trim()?.toLowerCase() || '')
  );
  const existingTitles = new Set(
    existingEntries.map(e => e.title?.trim()?.toLowerCase() || '')
  );
  
  const unique = [];
  const seenInBatch = new Set();
  
  for (const entry of newEntries) {
    const promptKey = (entry.full_prompt || '').trim().toLowerCase();
    const titleKey = (entry.title || '').trim().toLowerCase();
    
    if (promptKey && existingPrompts.has(promptKey)) {
      console.log(`  🔁 Skipping (duplicate prompt): ${entry.title.slice(0, 40)}`);
      continue;
    }
    if (titleKey && existingTitles.has(titleKey)) {
      console.log(`  🔁 Skipping (duplicate title): ${entry.title.slice(0, 40)}`);
      continue;
    }
    if (promptKey && seenInBatch.has(promptKey)) {
      console.log(`  🔁 Skipping (duplicate in batch): ${entry.title.slice(0, 40)}`);
      continue;
    }
    
    seenInBatch.add(promptKey);
    unique.push(entry);
  }
  
  return unique;
}

// ═══════════════════════════════════════════════════════════════
// Merge & Write
// ═══════════════════════════════════════════════════════════════

function loadExisting(path) {
  const fullPath = resolve(process.cwd(), path);
  if (!existsSync(fullPath)) return [];
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8'));
  } catch {
    console.warn(`⚠️ Could not parse ${path}, starting fresh`);
    return [];
  }
}

function merge(existing, newEntries) {
  const maxId = existing.reduce((max, p) => Math.max(max, parseInt(p.id, 10) || 0), 0);
  
  const merged = [...existing];
  let id = maxId + 1;
  
  for (const entry of newEntries) {
    merged.push({
      ...entry,
      id: String(id++),
      _version: entry._version || (new Date().toISOString().slice(0, 10) + '-trending'),
    });
  }
  
  return merged;
}

function sortByLikes(entries) {
  return entries.sort((a, b) => (b._likes || 0) - (a._likes || 0));
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf('--source');
  const source = sourceIdx >= 0 ? args[sourceIdx + 1] : null;
  const countIdx = args.indexOf('--count');
  const count = countIdx >= 0 ? parseInt(args[countIdx + 1], 10) || 10 : 10;
  const outputIdx = args.indexOf('--output');
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : null;
  const dryRun = args.includes('--dry-run');
  const noDownload = args.includes('--no-download');
  
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  🔥 Prompt Gallery — Trending Curator`);
  console.log(`  Target: ${count} new entries`);
  console.log(`  Dry run: ${dryRun ? 'YES' : 'NO'}`);
  console.log(`  Download images: ${noDownload ? 'NO' : 'YES'}`);
  console.log(`═══════════════════════════════════════════════\n`);
  
  // Ensure images directory exists
  const imagesAbs = resolve(process.cwd(), IMAGES_DIR);
  if (!existsSync(imagesAbs)) {
    mkdirSync(imagesAbs, { recursive: true });
    console.log(`📁 Created images directory: ${IMAGES_DIR}`);
  }
  
  // Fetch from sources
  let allEntries = [];
  
  if (!source || source === 'civitai') {
    const civitai = await fetchCivitai({ count, noDownload });
    allEntries.push(...civitai);
  }
  
  if (!source || source === 'reddit') {
    const reddit = await fetchRedditMidjourney({ count, noDownload });
    allEntries.push(...reddit);
  }
  
  if (allEntries.length === 0) {
    console.log('\n⚠️ No entries fetched from any source.');
    process.exit(1);
  }
  
  // Sort by popularity
  allEntries = sortByLikes(allEntries);
  
  // Trim to requested count
  if (allEntries.length > count) {
    allEntries = allEntries.slice(0, count);
  }
  
  // Load existing prompts for dedup
  const existing = loadExisting(PROMPTS_PATH);
  const unique = deduplicate(allEntries, existing);
  
  if (unique.length === 0) {
    console.log('\n✅ All fetched entries already exist in prompts.json. Nothing new to add.');
    process.exit(0);
  }
  
  // Merge with existing
  const merged = merge(existing, unique);
  
  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`  Existing:  ${existing.length}`);
  console.log(`  New (fetched): ${allEntries.length}`);
  console.log(`  Unique:       ${unique.length}`);
  console.log(`  Total:        ${merged.length}`);
  console.log(`  Source(s):    ${source || 'civitai + reddit'}`);
  
  // Output
  if (dryRun) {
    console.log(`\n📄 Preview of new entries:\n`);
    console.log(JSON.stringify(unique, null, 2));
    return;
  }
  
  if (outputPath) {
    const fullOutput = resolve(process.cwd(), outputPath);
    mkdirSync(dirname(fullOutput), { recursive: true });
    writeFileSync(fullOutput, JSON.stringify(outputPath.endsWith('prompts.json') ? merged : unique, null, 2), 'utf-8');
    console.log(`\n💾 Written → ${fullOutput}`);
  } else {
    // Default: merge into prompts.json directly
    writeFileSync(resolve(process.cwd(), PROMPTS_PATH), JSON.stringify(merged, null, 2), 'utf-8');
    console.log(`\n💾 Updated → ${PROMPTS_PATH}`);
    console.log(`\n🚀 Next step:`);
    console.log(`   npm run build && git add -A && git commit -m "feat: daily trending prompts $(date +%F)" && git push`);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
