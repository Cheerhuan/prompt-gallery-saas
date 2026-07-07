#!/usr/bin/env node
/**
 * import-awesome-prompts.mjs
 *
 * 從 EvoLinkAI/awesome-gpt-image-2-API-and-Prompts 提取隨機案例，
 * 匯入 prompt-gallery-saas 的 prompts.json
 *
 * 用法：
 *   node scripts/import-awesome-prompts.mjs --count 5 --track
 *   node scripts/import-awesome-prompts.mjs --count 10 --dry-run
 *
 * 選項：
 *   --count N     要提取的案例數量（預設 5，新舊各半）
 *   --dry-run     僅顯示結果，不寫入檔案
 *   --track       記錄已使用的案例（避免重複）
 *   --reset-track  清除追蹤記錄
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(PROJECT_ROOT, 'src/data/prompts.json');
const TRACK_FILE = path.join(PROJECT_ROOT, 'scripts/.used-cases.json');
const BASE_IMG = 'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-gpt-image-2/main/images';

// 7 大分類的 raw URL
const CASE_FILES = {
  'portrait':   'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-gpt-image-2/main/cases/portrait.md',
  'character':  'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-gpt-image-2/main/cases/character.md',
  'ad-creative':'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/ad-creative.md',
  'ecommerce':  'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-gpt-image-2/main/cases/ecommerce.md',
  'poster':     'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-gpt-image-2/main/cases/poster.md',
  'comparison': 'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-gpt-image-2/main/cases/comparison.md',
  'ui':         'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-gpt-image-2/main/cases/ui.md',
};

// 類別中文標籤映射
const CATEGORY_LABELS = {
  'portrait':    '人像攝影',
  'character':   '角色設計',
  'ad-creative': '廣告創意',
  'ecommerce':   '電商產品',
  'poster':      '海報插畫',
  'comparison':  '對比展示',
  'ui':          '介面設計',
};

/** 從 case text 提取標題 */
function extractTitle(text) {
  const m = text.match(/### Case \d+: \[([^\]]+)\]/);
  return m ? m[1].trim() : null;
}

/** 從 case text 提取圖片 URL（支援 markdown 與 HTML `<img>` 格式） */
function extractImageUrl(text) {
  // HTML format: <img src="url">
  const imgTagMatch = text.match(/src="([^"]+)"/);
  if (imgTagMatch) return imgTagMatch[1].trim();
  // Markdown format: [![Output image](url)]
  const mdMatch = text.match(/\[!\[Output image\]\(([^)]+)\)\]/);
  return mdMatch ? mdMatch[1].trim() : null;
}

/** 從 case text 提取 prompt（程式碼區塊中的內容） */
function extractPrompt(text) {
  const m = text.match(/```\n?([\s\S]*?)```/);
  return m ? m[1].trim() : null;
}

/** 從圖片 URL 推斷分類 */
function inferCategoryFromImageUrl(url) {
  if (!url) return 'poster';
  for (const cat of Object.keys(CASE_FILES)) {
    if (url.includes(`/${cat}_case`)) return cat;
  }
  return 'poster';
}

/** 從 case text 提取 case number */
function extractCaseNumber(text, defaultCat) {
  const m = text.match(/### Case (\d+):/);
  return m ? parseInt(m[1]) : 0;
}

/** 產生唯一 case ID */
function makeCaseId(cat, num) {
  return `${cat}-${num}`;
}

/** 解析單個 case 區塊 */
function parseCase(text, defaultCategory) {
  const title = extractTitle(text);
  if (!title) return null;
  
  const imageUrl = extractImageUrl(text);
  const prompt = extractPrompt(text);
  const caseNum = extractCaseNumber(text, defaultCategory);
  const category = imageUrl ? inferCategoryFromImageUrl(imageUrl) : defaultCategory;
  
  if (!prompt || !imageUrl) return null;
  
  return {
    id: makeCaseId(category, caseNum),
    caseNum,
    category,
    categoryLabel: CATEGORY_LABELS[category] || category,
    title,
    imageUrl,
    prompt,
  };
}

/** 下載並解析單個 case 檔案 */
async function fetchAndParseCategory(category, url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    
    // 用正則分割每個 case 區塊
    // 每個 case 以 ### Case 開頭，到下一個 ### Case 或檔案結尾
    const blocks = text.split(/(?=### Case \d+:)/g);
    
    const cases = [];
    for (const block of blocks) {
      if (!block.startsWith('### Case')) continue;
      const parsed = parseCase(block, category);
      if (parsed) cases.push(parsed);
    }
    
    return cases;
  } catch (err) {
    console.error(`❌ Failed to fetch ${category}: ${err.message}`);
    return [];
  }
}

/** 讀取追蹤記錄 */
function loadTrack() {
  try {
    return JSON.parse(fs.readFileSync(TRACK_FILE, 'utf-8'));
  } catch {
    return { used: [], version: '1' };
  }
}

/** 儲存追蹤記錄 */
function saveTrack(track) {
  fs.writeFileSync(TRACK_FILE, JSON.stringify(track, null, 2));
}

/** 讀取現有 prompts.json */
function loadPrompts() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

/** 寫入 prompts.json */
function savePrompts(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n');
}

/** 從現有 prompt IDs 推斷最大 id */
function getMaxId(prompts) {
  return Math.max(...prompts.map(p => parseInt(p.id) || 0), 0);
}

/** 將 case 轉為 gallery prompt 格式 */
function toPromptEntry(caseItem, maxId, index) {
  const enLabel = caseItem.categoryLabel;
  return {
    id: String(maxId + index + 1),
    title: `${caseItem.title} [${enLabel}]`,
    image: caseItem.imageUrl,
    full_prompt: caseItem.prompt,
    model: 'GPT-Image-2',
    _version: '2026-05-09-imported',
    _source: 'awesome-gpt-image-2',
    _case_id: caseItem.id,
  };
}

// ============ MAIN ============

async function main() {
  const args = process.argv.slice(2);
  const countFlag = args.indexOf('--count');
  const count = countFlag >= 0 ? parseInt(args[countFlag + 1]) || 5 : 5;
  const dryRun = args.includes('--dry-run');
  const doTrack = args.includes('--track');
  const resetTrack = args.includes('--reset-track');
  const newCards = Math.ceil(count / 2);
  const oldCards = count - newCards;

  console.log(`🔍 Fetching cases from ${Object.keys(CASE_FILES).length} categories...`);
  console.log(`📦 Target: ${count} total (${newCards} new-er + ${oldCards} old-er)`);
  if (dryRun) console.log('🏃 Dry-run mode (no files will be modified)');

  // 讀取已用追蹤
  let track = loadTrack();
  if (resetTrack) {
    track = { used: [], version: '1' };
    console.log('🔄 Track reset');
  }

  // 並行下載所有 case 檔案
  const allResults = await Promise.all(
    Object.entries(CASE_FILES).map(([cat, url]) => fetchAndParseCategory(cat, url))
  );
  
  const allCases = allResults.flat();
  console.log(`📊 Total cases found: ${allCases.length}`);

  // 依 case number 排序（新舊區分）
  allCases.sort((a, b) => a.caseNum - b.caseNum);
  
  // 未使用的案例
  const unused = allCases.filter(c => !track.used.includes(c.id));
  console.log(`📋 Already used: ${track.used.length}`);
  console.log(`🆕 Available (unused): ${unused.length}`);

  if (unused.length < count) {
    console.warn(`⚠️ Only ${unused.length} unused cases available, less than ${count} requested. Taking all.`);
  }

  // 分新舊
  // "新" = case number 較高的，取後半段
  // "舊" = case number 較低的，取前半段
  const availableNew = unused.filter(c => c.caseNum >= 50);
  const availableOld = unused.filter(c => c.caseNum < 50);

  // 隨機選取
  function pickRandom(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, shuffled.length));
  }

  const pickedNew = pickRandom(availableNew, newCards);
  const pickedOld = pickRandom(availableOld, oldCards);
  const picked = [...pickedNew, ...pickedOld].sort(() => Math.random() - 0.5);

  // 隨機調整，確保多樣化類別
  const finalPicked = [];

  // 嘗試取不同類別
  const categories = [...new Set(picked.map(c => c.category))];
  for (const cat of categories) {
    const fromCat = picked.filter(c => c.category === cat);
    finalPicked.push(...fromCat);
  }

  // 去重
  const uniquePicked = [...new Map(finalPicked.map(c => [c.id, c])).values()];
  const selected = uniquePicked.slice(0, count);

  console.log(`\n🎯 Selected ${selected.length} cases:`);
  selected.forEach((c, i) => {
    console.log(`  ${i+1}. [${c.categoryLabel}] Case #${c.caseNum}: ${c.title}`);
    console.log(`     📷 ${c.imageUrl.substring(0, 80)}`);
  });

  // 讀取現有 prompts
  const prompts = loadPrompts();
  const maxId = getMaxId(prompts);

  // 建立現有內容指紋集 (Image + Prompt)
  const existingFingerprints = new Set(
    prompts.map(p => `${p.image}|${p.full_prompt?.trim().toLowerCase()}`)
  );

  // 轉換為 prompt entries 並執行指紋過濾
  const entries = [];
  selected.forEach((c, i) => {
    const entry = toPromptEntry(c, maxId, entries.length);
    const fingerprint = `${entry.image}|${entry.full_prompt?.trim().toLowerCase()}`;
    
    if (!existingFingerprints.has(fingerprint)) {
      entries.push(entry);
    } else {
      console.log(`  ⏩ Skipping duplicate: [${c.categoryLabel}] Case #${c.caseNum}`);
    }
  });

  if (dryRun) {
    console.log(`\n🏁 DRY RUN — would add ${entries.length} entries:`);
    entries.forEach(e => {
      console.log(`  #${e.id}: ${e.title}`);
    });
    return;
  }

  // 合併
  prompts.push(...entries);
  savePrompts(prompts);

  // 更新追蹤
  if (doTrack) {
    const newUsed = selected.map(c => c.id);
    track.used.push(...newUsed);
    saveTrack(track);
    console.log(`✅ Track updated: ${track.used.length} total used cases`);
  }

  console.log(`\n✅ Done! Added ${entries.length} new prompts to prompts.json`);
  console.log(`   Total prompts: ${prompts.length}`);
  console.log(`   Next: run 'npm run build && git push origin main'`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
