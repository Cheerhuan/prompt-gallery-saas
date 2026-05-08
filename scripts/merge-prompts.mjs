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

  // Find max existing ID
  const maxId = existing.reduce((max: number, p: any) => Math.max(max, parseInt(p.id, 10) || 0), 0);

  // Assign sequential IDs and merge
  const merged = [
    ...existing,
    ...newEntries.map((e: any, i: number) => ({
      ...e,
      id: String(maxId + i + 1),
      _version: new Date().toISOString().slice(0, 10) + '-merged',
    })),
  ];

  if (dryRun) {
    console.log(`\n📊 Merge Preview:
  Existing entries: ${existing.length}
  New entries:      ${newEntries.length}
  Total:            ${merged.length}
`);
    console.log(JSON.stringify(newEntries, null, 2));
    return;
  }

  // Write
  writeFileSync(promptsPath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`✅ Merge complete!
  File:      ${promptsPath}
  Added:     ${newEntries.length}
  Total:     ${merged.length}
  Next step: npm run build && git add -A && git commit -m "feat: add trending prompts" && git push
`);
}

main();
