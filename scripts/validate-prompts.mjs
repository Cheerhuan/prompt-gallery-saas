#!/usr/bin/env node
/**
 * validate-prompts.mjs — 提交前資料完整性驗證
 *
 * 檢查：
 *   1. 是否為有效 JSON
 *   2. 條目數是否未減少（對比 git HEAD）
 *   3. 所有條目是否有必填欄位（id, title, full_prompt, image）
 *   4. 有無重複 ID
 *
 * 用法：
 *   node scripts/validate-prompts.mjs          # 標準驗證
 *   node scripts/validate-prompts.mjs --strict # 嚴格模式：條目數只能增不能減
 *
 * Exit code 0 = 通過, 1 = 失敗
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const PROMPTS_PATH = path.join(root, 'src/data/prompts.json');
const STRICT = process.argv.includes('--strict');

let errors = [];
let warnings = [];

// ─── 1. 檔案存在性 ───
if (!fs.existsSync(PROMPTS_PATH)) {
  console.error('❌ prompts.json not found at', PROMPTS_PATH);
  process.exit(1);
}
const raw = fs.readFileSync(PROMPTS_PATH, 'utf-8');

// ─── 2. 有效 JSON ───
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error(`❌ Invalid JSON: ${e.message}`);
  // 嘗試定位錯誤位置
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1]);
  if (pos) {
    const start = Math.max(0, pos - 80);
    const end = Math.min(raw.length, pos + 80);
    console.error(`   Context: ...${raw.slice(start, end)}...`);
  }
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error('❌ prompts.json is not an array');
  process.exit(1);
}

console.log(`✓ Valid JSON (${data.length} entries)`);

// ─── 3. 條目數防倒退 ───
try {
  const oldRaw = execSync('git show HEAD:src/data/prompts.json', {
    cwd: root,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  const oldData = JSON.parse(oldRaw);
  const oldCount = Array.isArray(oldData) ? oldData.length : 0;

  if (oldCount > 0) {
    const delta = data.length - oldCount;
    if (delta < 0) {
      errors.push(`Entry count DECREASED: ${oldCount} → ${data.length} (lost ${Math.abs(delta)} entries!)`);
    } else if (delta === 0) {
      console.log(`✓ Entry count stable: ${data.length}`);
    } else {
      console.log(`✓ Entry count increased: ${oldCount} → ${data.length} (+${delta})`);
    }
  }
} catch (e) {
  warnings.push(`Could not compare to git HEAD: ${e.message}`);
}

// ─── 4. 必填欄位檢查 ───
const REQUIRED = ['id', 'title', 'full_prompt', 'image'];
const missingFields = [];

for (let i = 0; i < data.length; i++) {
  const entry = data[i];
  for (const field of REQUIRED) {
    if (!entry[field] || (typeof entry[field] === 'string' && entry[field].trim() === '')) {
      missingFields.push(`  Entry #${i} (id=${entry.id || 'MISSING'}): missing '${field}'`);
    }
  }
}

if (missingFields.length > 0) {
  errors.push(`Missing required fields:\n${missingFields.join('\n')}`);
} else {
  console.log('✓ All entries have required fields (id, title, full_prompt, image)');
}

// ─── 5. 重複 ID 檢查 ───
const ids = new Set();
const duplicates = [];
for (const entry of data) {
  if (ids.has(entry.id)) {
    duplicates.push(entry.id);
  }
  ids.add(entry.id);
}

if (duplicates.length > 0) {
  errors.push(`Duplicate IDs found: ${duplicates.join(', ')}`);
} else {
  console.log('✓ No duplicate IDs');
}

// ─── 6. 圖片物理存在性（可選，僅檢查本地圖片） ───
let missingImages = 0;
for (const entry of data) {
  if (entry.image && entry.image.startsWith('/images/')) {
    const imgPath = path.join(root, 'public', entry.image);
    if (!fs.existsSync(imgPath)) {
      if (missingImages < 5) { // 只報前 5 個
        warnings.push(`Image not found: ${entry.image} (id=${entry.id})`);
      }
      missingImages++;
    }
  }
}
if (missingImages > 0) {
  warnings.push(`${missingImages} image(s) referenced but not found on disk`);
} else {
  console.log('✓ All local images exist on disk');
}

// ─── 結果 ───
console.log('');
if (warnings.length > 0) {
  console.log('⚠ Warnings:');
  warnings.forEach(w => console.log(`  ${w}`));
}

if (errors.length > 0) {
  console.error(`\n❌ VALIDATION FAILED (${errors.length} errors):`);
  errors.forEach(e => console.error(e));
  console.error('\n🛑 Commit blocked. Fix the errors above and try again.');
  process.exit(1);
}

console.log('✅ All checks passed');
process.exit(0);
