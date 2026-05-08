#!/usr/bin/env node

/**
 * Merge trending prompts into prompts.json
 *
 * Usage:
 *   node scripts/merge-prompts.mjs --input ./trending-xxx.json
 *   node scripts/merge-prompts.mjs --input ./trending-xxx.json --dry-run
 *   node scripts/merge-prompts.mjs --input ./trending-xxx.json --output ./src/data/prompts.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function usage() {
  console.log(`
Usage:
  node scripts/merge-prompts.mjs --input <file> [options]

Options:
  --input <file>   Path to the new entries JSON (required)
  --output <file>  Output path (default: src/data/prompts.json)
  --dry-run        Preview merge without writing
  --help           Show this help
`);
  process.exit(0);
}

function deduplicate(newEntries, existing) {
  const existingPrompts = new Set(
    existing.map(e => e.full_prompt?.trim()?.toLowerCase() || '')
  );
  const existingTitles = new Set(
    existing.map(e => e.title?.trim()?.toLowerCase() || '')
  );

  const unique = [];
  const seenInBatch = new Set();

  for (const entry of newEntries) {
    const promptKey = (entry.full_prompt || '').trim().toLowerCase();
    const titleKey = (entry.title || '').trim().toLowerCase();

    if (promptKey && existingPrompts.has(promptKey)) {
      console.log(`  🔁 Skip (existing prompt): ${(entry.title || '').slice(0, 40)}`);
      continue;
    }
    if (titleKey && existingTitles.has(titleKey)) {
      console.log(`  🔁 Skip (existing title): ${(entry.title || '').slice(0, 40)}`);
      continue;
    }
    if (promptKey && seenInBatch.has(promptKey)) {
      console.log(`  🔁 Skip (batch dup): ${(entry.title || '').slice(0, 40)}`);
      continue;
    }

    seenInBatch.add(promptKey);
    unique.push(entry);
  }

  return unique;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) usage();

  const inputIdx = args.indexOf('--input');
  const inputPath = inputIdx >= 0 ? args[inputIdx + 1] : null;
  const outputIdx = args.indexOf('--output');
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : null;
  const dryRun = args.includes('--dry-run');

  if (!inputPath) {
    console.error('❌ Missing --input <file>');
    usage();
  }

  const cwd = process.cwd();
  const newEntriesPath = resolve(cwd, inputPath);
  const promptsPath = outputPath ? resolve(cwd, outputPath) : resolve(cwd, 'src/data/prompts.json');

  if (!existsSync(newEntriesPath)) {
    console.error(`❌ Input file not found: ${newEntriesPath}`);
    process.exit(1);
  }

  // Read existing
  let existing = [];
  if (existsSync(promptsPath)) {
    try {
      existing = JSON.parse(readFileSync(promptsPath, 'utf-8'));
    } catch {
      console.warn('⚠️ Could not parse existing prompts.json, starting fresh');
    }
  }

  // Read new entries
  let newEntries;
  try {
    newEntries = JSON.parse(readFileSync(newEntriesPath, 'utf-8'));
  } catch {
    console.error(`❌ Could not parse input file: ${newEntriesPath}`);
    process.exit(1);
  }

  if (!Array.isArray(newEntries)) {
    console.error('❌ Input must be a JSON array');
    process.exit(1);
  }

  // Deduplicate
  const unique = deduplicate(newEntries, existing);

  if (unique.length === 0) {
    console.log('\n✅ All entries already exist. Nothing to merge.');
    process.exit(0);
  }

  // Find max existing ID
  const maxId = existing.reduce((max, p) => Math.max(max, parseInt(p.id, 10) || 0), 0);

  // Assign sequential IDs and merge
  const merged = [
    ...existing,
    ...unique.map((e, i) => ({
      ...e,
      id: String(maxId + i + 1),
      _version: new Date().toISOString().slice(0, 10) + '-merged',
    })),
  ];

  if (dryRun) {
    console.log(`\n📊 Merge Preview:
  Existing entries: ${existing.length}
  Duplicates removed: ${newEntries.length - unique.length}
  New entries:      ${unique.length}
  Total:            ${merged.length}\n`);
    console.log(JSON.stringify(unique, null, 2));
    return;
  }

  // Write
  writeFileSync(promptsPath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`\n✅ Merge complete!
  File:      ${promptsPath}
  Added:     ${unique.length} (${newEntries.length - unique.length} duplicates skipped)
  Total:     ${merged.length}\n
🚀 Next step:
   npm run build && git add -A && git commit -m "feat: add trending prompts $(date +%F)" && git push\n`);
}

main();
