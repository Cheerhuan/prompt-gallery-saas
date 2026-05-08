#!/usr/bin/env node
/**
 * apply-admin-patch.mjs — 應用 Admin 面板下載的 JSON patch
 *
 * Admin 面板下載的 JSON patch 格式：
 *
 *   // 新增
 *   { "action": "add", "entries": [...] }
 *
 *   // 編輯
 *   { "action": "edit", "entries": [{ "id": "5", "title": "New Title", ... }] }
 *
 *   // 刪除
 *   { "action": "delete", "ids": ["5", "10"] }
 *
 * 用法：
 *   node scripts/apply-admin-patch.mjs ~/Downloads/gallery-patch-xxx.json
 *   node scripts/apply-admin-patch.mjs --deploy ~/Downloads/gallery-patch-xxx.json
 *
 * 選項：
 *   --deploy  合併後自動執行 npm run build + git push
 *   --dry-run 僅顯示結果，不寫入
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const DATA_FILE = path.join(root, 'src/data/prompts.json');

function loadPrompts() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function savePrompts(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n');
  console.log(`  ✓  prompts.json saved (${data.length} total)`);
}

function getMaxId(prompts) {
  return Math.max(...prompts.map(p => parseInt(p.id) || 0), 0);
}

function log(msg) {
  console.log(`  ${msg}`);
}

async function main() {
  const args = process.argv.slice(2);
  const deploy = args.includes('--deploy');
  const dryRun = args.includes('--dry-run');

  // 找 JSON 檔案路徑
  const fileArg = args.find(a => !a.startsWith('--'));
  if (!fileArg) {
    console.error('❌ Usage: node scripts/apply-admin-patch.mjs [--deploy] [--dry-run] <patch-file.json>');
    process.exit(1);
  }

  const patchPath = path.resolve(root, fileArg);
  if (!fs.existsSync(patchPath)) {
    console.error(`❌ File not found: ${patchPath}`);
    process.exit(1);
  }

  const patch = JSON.parse(fs.readFileSync(patchPath, 'utf-8'));
  const { action, entries, ids } = patch;

  if (!action) {
    console.error('❌ Patch file must have an "action" field (add / edit / delete)');
    process.exit(1);
  }

  const prompts = loadPrompts();
  const maxId = getMaxId(prompts);

  // ── ADD ──
  if (action === 'add') {
    if (!entries || entries.length === 0) {
      console.error('❌ "add" action requires "entries" array');
      process.exit(1);
    }
    const newEntries = entries.map((e, i) => ({
      id: String(maxId + i + 1),
      title: e.title || 'Untitled',
      image: e.image || '',
      full_prompt: e.full_prompt || e.prompt || '',
      model: e.model || 'GPT-Image-2',
      _version: new Date().toISOString().slice(0, 10),
      _source: e._source || 'admin-manual',
      ...e,
      id: String(maxId + i + 1),
    }));

    log(`📥 Adding ${newEntries.length} entries:`);
    newEntries.forEach(e => log(`  #${e.id}: ${e.title.slice(0, 60)}`));

    if (!dryRun) {
      prompts.push(...newEntries);
      savePrompts(prompts);
    }
  }

  // ── EDIT ──
  else if (action === 'edit') {
    if (!entries || entries.length === 0) {
      console.error('❌ "edit" action requires "entries" array with { id, ...fields }');
      process.exit(1);
    }
    log(`✏️  Editing ${entries.length} entries:`);
    entries.forEach(e => {
      const idx = prompts.findIndex(p => p.id === e.id);
      if (idx === -1) {
        log(`  ⚠️  ID ${e.id} not found, skipping`);
        return;
      }
      const oldTitle = prompts[idx].title;
      Object.assign(prompts[idx], e);
      log(`  #${e.id}: ${oldTitle.slice(0, 40)} → ${e.title ? e.title.slice(0, 40) : '(fields updated)'}`);
    });

    if (!dryRun) savePrompts(prompts);
  }

  // ── DELETE ──
  else if (action === 'delete') {
    if (!ids || ids.length === 0) {
      console.error('❌ "delete" action requires "ids" array');
      process.exit(1);
    }
    log(`🗑️  Deleting ${ids.length} entries: ${ids.join(', ')}`);
    const filtered = prompts.filter(p => !ids.includes(p.id));
    const removed = prompts.length - filtered.length;

    if (!dryRun) {
      savePrompts(filtered);
    }
    log(`  Removed ${removed} entries, ${filtered.length} remaining`);
  }

  else {
    console.error(`❌ Unknown action: "${action}". Use: add, edit, delete`);
    process.exit(1);
  }

  console.log(`\n  ✅ Patch applied successfully!`);

  // ── Deploy ──
  if (deploy && !dryRun) {
    console.log(`\n  🚀 Deploying...`);
    execSync('npm run build', { cwd: root, stdio: 'inherit' });
    execSync('git add -A', { cwd: root, stdio: 'inherit' });
    execSync('git commit -m "feat: apply admin patch"', { cwd: root, stdio: 'inherit' });
    execSync('git push origin main', { cwd: root, stdio: 'inherit' });
    console.log(`\n  ✅ Deployed!`);
    console.log(`  🌐 https://cheerhuan.github.io/prompt-gallery-saas/`);
  }

  if (!dryRun) {
    console.log(`\n  📝 Next step:`);
    if (!deploy) {
      console.log(`     Run: node scripts/apply-admin-patch.mjs --deploy "${fileArg}"`);
    }
    console.log(`     Or run deploy manually: node scripts/deploy.mjs "apply admin patch"`);
  }
}

main().catch(err => {
  console.error(`\n  ❌ Error: ${err.message}`);
  process.exit(1);
});
