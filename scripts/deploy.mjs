#!/usr/bin/env node
/**
 * deploy.mjs — 一鍵 Build → Commit → Push
 *
 * 用法：
 *   node scripts/deploy.mjs "feat: add 5 new prompt cards"
 *   node scripts/deploy.mjs                         # 自動生成 commit message
 *
 * 自動流程：
 *   1. npm run build (SSG 驗證)
 *   2. git add -A
 *   3. git commit (時間戳 + 成功訊息)
 *   4. git push origin main
 *   5. 提示 GitHub Actions 部署等待 (~10min CDN)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function run(cmd, opts = {}) {
  console.log(`\n  $ ${cmd}`);
  const result = execSync(cmd, { cwd: root, encoding: 'utf-8', ...opts });
  if (result.trim()) console.log(result.trim());
  return result;
}

function getPromptCount() {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/prompts.json'), 'utf-8'));
    const withImg = data.filter(p => p.image && p.image.trim() !== '').length;
    return withImg;
  } catch {
    return '?';
  }
}

async function main() {
  const userMsg = process.argv[2];
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const count = getPromptCount();
  const msg = userMsg || `chore: deploy ${timestamp} (${count} prompts)`;

  console.log(`\n═══════════════════════════════════`);
  console.log(`  🚀  Deploy: prompt-gallery-saas`);
  console.log(`  📝  Message: ${msg}`);
  console.log(`  📊  ${count} prompts in gallery`);
  console.log(`═══════════════════════════════════\n`);

  // Step 1: Build
  console.log(`  ⚡  Step 1/3 — Build`);
  run('npm run build');

  // Step 2: Add + Commit
  console.log(`\n  ⚡  Step 2/3 — Commit`);
  run('git add -A');
  const status = execSync('git status --porcelain', { cwd: root, encoding: 'utf-8' });
  if (!status.trim()) {
    console.log('  ✓  Nothing to commit — already up to date.');
    process.exit(0);
  }
  run(`git commit -m "${msg.replace(/"/g, '\\"')}"`);

  // Step 3: Push
  console.log(`\n  ⚡  Step 3/3 — Push`);
  run('git push origin main');

  // Done
  console.log(`\n═══════════════════════════════════`);
  console.log(`  ✅  Deploy complete!`);
  console.log(`  🌐  https://github.com/Cheerhuan/prompt-gallery-saas/actions`);
  console.log(`  ⏳  CDN cache: ~10 min`);
  console.log(`  🔗  https://cheerhuan.github.io/prompt-gallery-saas/`);
  console.log(`═══════════════════════════════════\n`);
}

main().catch(err => {
  console.error(`\n  ❌  Deploy failed: ${err.message}`);
  process.exit(1);
});
