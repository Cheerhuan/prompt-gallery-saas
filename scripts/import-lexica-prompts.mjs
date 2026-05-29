/**
 * import-lexica-prompts.mjs
 * 每日從 Lexica.art 擷取 trending prompts 並匯入 prompt-gallery-saas。
 *
 * 使用方式：
 *   node scripts/import-lexica-prompts.mjs           # 匯入新 prompts（最多 5 個）
 *   node scripts/import-lexica-prompts.mjs --dry-run  # 僅顯示結果，不寫入
 *   node scripts/import-lexica-prompts.mjs --reset-track  # 清除追蹤記錄
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const TRACK_FILE = path.join(PROJECT_ROOT, 'scripts/.lexica-track.json');
const PROMPTS_FILE = path.join(PROJECT_ROOT, 'src/data/prompts.json');
const MAX_PER_RUN = 5;  // 每次跑最多 5 個

// ── Helper: 讀取 / 寫入 JSON ──
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ── Helper: Fetch + 解析回傳文字 ──
async function fetchText(url) {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${url}`);
  return resp.text();
}

// ── Step 1: 從 Lexica 首頁取得所有 trending prompt IDs ──
async function getTrendingPrompts() {
  console.log('🔍 Fetching Lexica homepage...');
  const html = await fetchText('https://lexica.art/');
  const ids = new Set();
  const titleMap = new Map();

  // 匹配 /prompt/{uuid}
  const promptRegex = /\/prompt\/([a-f0-9\-]{36})/g;
  let m;
  while ((m = promptRegex.exec(html)) !== null) {
    ids.add(m[1]);
  }

  // 嘗試從 HTML 中提取提示文字（在 a[href="/prompt/{uuid}"] 旁邊的 p 標籤）
  for (const id of ids) {
    const titleRegex = new RegExp(`/prompt/${id}[^<]*<[^>]*>[^<]*<p[^>]*>([^<]+)</p>`, 'i');
    const tm = html.match(titleRegex);
    if (tm) {
      titleMap.set(id, tm[1].trim());
    }
  }

  console.log(`  → Found ${ids.size} prompts on homepage`);
  return { ids: [...ids], titleMap };
}

// ── Step 2: 檢查哪些是新提示（不在 track 中）──
function getNewPrompts(allIds, track, titleMap) {
  const known = new Set(track.map(t => t.id));
  const newIds = allIds.filter(id => !known.has(id));
  // 取前 MAX_PER_RUN 個
  return newIds.slice(0, MAX_PER_RUN);
}

// ── Step 3: 取得詳情頁 metadata（model, dimensions, 第一張圖）──
async function getPromptDetail(id) {
  console.log(`  📄 Fetching detail for ${id}...`);
  const html = await fetchText(`https://lexica.art/prompt/${id}`);

  // 提取 model
  const modelMatch = html.match(/Model\s+([A-Za-z0-9\s.]+?)(?:<|\s+Dimensions)/);
  const model = modelMatch ? modelMatch[1].trim() : 'Aperture';

  // 提取 dimensions
  const dimMatch = html.match(/Dimensions\s+(\d+\s*[×x]\s*\d+)/);
  const dimensions = dimMatch ? dimMatch[1].trim() : '';

  const [width, height] = dimensions ? dimensions.split(/[×x]/).map(s => parseInt(s.trim())) : [0, 0];

  // 提取 prompt text（從 <p> inside prompt link）
  const promptMatch = html.match(new RegExp(
    `<a[^>]*href="/\\?q=[^"]*"[^>]*>[^<]*</a>`
  ));
  const promptText = promptMatch ? '' : ''; // 我們從首頁 title 取得

  return { model, width, height };
}

// ── Step 4: 建構 prompt entry ──
function buildEntry(id, title, detail) {
  const entry = {
    id: 0,  // will be set on append
    title: `[Lexica] ${title}`,
    full_prompt: title,
    image: `https://image.lexica.art/full_jpg/${id}`,
    creator: '',
    model: detail.model || 'Aperture',
    tags: [],
    _source: 'lexica.art',
    _lexica_id: id,
  };
  return entry;
}

// ── Step 5: 將新 prompts 附加至 prompts.json ──
function appendPrompts(newEntries, prompts) {
  const maxId = prompts.reduce((max, p) => Math.max(max, p.id || 0), 0);
  let appended = 0;
  for (const entry of newEntries) {
    // 去重檢查：用 title 判斷
    const exists = prompts.some(p => p.title === entry.title || p._lexica_id === entry._lexica_id);
    if (exists) {
      console.log(`  ⏭️  Skip duplicate: "${entry.title.slice(0, 60)}..."`);
      continue;
    }
    maxId++;
    entry.id = maxId;
    prompts.push(entry);
    appended++;
  }
  return appended;
}

// ── Main ──
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const resetTrack = process.argv.includes('--reset-track');

  // 載入追蹤與現有資料
  let track = readJSON(TRACK_FILE);
  const prompts = readJSON(PROMPTS_FILE);

  if (resetTrack) {
    track = [];
    console.log('🗑️  Track reset');
  }

  // Step 1: 取得 trending prompts
  const { ids, titleMap } = await getTrendingPrompts();

  // Step 2: 找出新的
  const newIds = getNewPrompts(ids, track, titleMap);
  console.log(`  → ${newIds.length} new prompts to import`);

  if (newIds.length === 0) {
    console.log('✅ No new prompts. Exiting.');
    return;
  }

  // Step 3: 取得詳情
  const newEntries = [];
  for (const id of newIds) {
    try {
      const detail = await getPromptDetail(id);
      const title = titleMap.get(id) || 'Lexica prompt';
      const entry = buildEntry(id, title, detail);
      newEntries.push(entry);
      // 加入追蹤
      track.push({ id, title: title.slice(0, 100), scraped_at: new Date().toISOString() });
    } catch (e) {
      console.error(`  ❌ Error fetching ${id}: ${e.message}`);
    }
  }

  // Step 4: 寫入
  if (isDryRun) {
    console.log(`\n📋 DRY RUN — Would import ${newEntries.length} prompts:`);
    for (const e of newEntries) {
      console.log(`  • ${e.title.slice(0, 80)}`);
      console.log(`    Image: ${e.image}`);
      console.log(`    Model: ${e.model}`);
    }
    console.log(`\n📊 Track would have ${track.length} entries`);
    return;
  }

  // Real run: append to prompts.json
  const appended = appendPrompts(newEntries, prompts);
  if (appended > 0) {
    writeJSON(PROMPTS_FILE, prompts);
    console.log(`\n✅ Imported ${appended} new prompts into prompts.json`);
  } else {
    console.log('⏭️  No new unique prompts to import.');
  }

  // 更新追蹤（含失敗的也加入，避免重複嘗試）
  writeJSON(TRACK_FILE, track);
  console.log(`📊 Track updated: ${track.length} entries`);
}

main().catch(e => {
  console.error('💥 Fatal error:', e.message);
  process.exit(1);
});
