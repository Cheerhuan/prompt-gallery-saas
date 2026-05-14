#!/usr/bin/env node
/**
 * Build-time embedding generator (TF-IDF)
 * Reads src/data/prompts.json, computes TF-IDF vectors for each prompt,
 * and writes src/data/embeddings.json
 *
 * No external API dependencies — pure JS TF-IDF with fallback.
 * Handles both English and Chinese text.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_PATH = path.resolve(__dirname, '../src/data/prompts.json');
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/embeddings.json');

// ─── Tokenization ──────────────────────────────────────────────

/**
 * Tokenize text into terms.
 * - Splits on whitespace and common punctuation
 * - Extracts individual Chinese characters (unigrams)
 * - Lowercases English tokens
 */
function tokenize(text) {
  const tokens = [];
  const str = String(text);

  // Extract alphanumeric tokens (English / numbers)
  const alphaTokens = str.toLowerCase().match(/[a-z0-9]+/g) || [];
  tokens.push(...alphaTokens);

  // Extract Chinese characters individually
  const chineseChars = str.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || [];
  tokens.push(...chineseChars);

  // Also extract Chinese bigrams for better semantics
  for (let i = 0; i < chineseChars.length - 1; i++) {
    tokens.push(chineseChars[i] + chineseChars[i + 1]);
  }

  return tokens;
}

// ─── TF-IDF Computation ────────────────────────────────────────

function computeTFIDF(documents) {
  const docCount = documents.length;
  const df = {}; // document frequency: how many docs contain each term
  const docTerms = []; // tokenized terms per document

  // First pass: tokenize and compute document frequency
  for (const doc of documents) {
    const terms = tokenize(doc.text);
    docTerms.push(terms);
    const uniqueTerms = new Set(terms);
    for (const term of uniqueTerms) {
      df[term] = (df[term] || 0) + 1;
    }
  }

  // Vocabulary: all terms that appear in at least 1 document
  const vocabulary = Object.keys(df);
  console.log(`Vocabulary size: ${vocabulary.length} terms across ${docCount} documents`);

  // Second pass: compute TF-IDF vectors
  const vectors = {};
  for (let i = 0; i < docCount; i++) {
    const terms = docTerms[i];
    const termCount = terms.length;
    const docId = documents[i]._id || String(documents[i].id);
    const vector = new Array(vocabulary.length).fill(0);

    // Term frequency within this document
    const tf = {};
    for (const term of terms) {
      tf[term] = (tf[term] || 0) + 1;
    }

    // Compute TF-IDF for each vocabulary term
    for (let j = 0; j < vocabulary.length; j++) {
      const term = vocabulary[j];
      const freq = tf[term] || 0;
      if (freq > 0) {
        // TF: log-normalized term frequency
        const tfValue = 1 + Math.log10(freq);
        // IDF: log of inverse document frequency
        const idfValue = Math.log10(docCount / (1 + (df[term] || 0)));
        vector[j] = tfValue * idfValue;
      }
    }

    // L2 normalize the vector
    let norm = 0;
    for (let j = 0; j < vector.length; j++) {
      norm += vector[j] * vector[j];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let j = 0; j < vector.length; j++) {
        vector[j] /= norm;
      }
    }

    vectors[docId] = vector;
  }

  return { vectors, vocabulary, df };
}

// ─── Main ──────────────────────────────────────────────────────

function main() {
  console.log('🔧 Generating embeddings from prompts...');

  if (!fs.existsSync(PROMPTS_PATH)) {
    console.error(`❌ prompts.json not found at ${PROMPTS_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(PROMPTS_PATH, 'utf-8');
  const prompts = JSON.parse(rawData);
  console.log(`📄 Loaded ${prompts.length} prompts`);

  // Build combined text for each prompt: title + full_prompt
  const documents = prompts.map(p => ({
    _id: String(p.id),
    text: `${p.title} ${p.full_prompt} ${p.model || ''} ${p._source || ''} ${p.creator || ''}`
  }));

  // computeTFIDF expects document objects with _id and text
  const { vectors, vocabulary, df } = computeTFIDF(documents);

  // Save vectors (only the vectors, not vocabulary/df)
  const output = {};
  for (const doc of documents) {
    output[doc._id] = vectors[doc._id];
  }

  // Save vocabulary and df alongside for query vectorization
  const outputWithMeta = {
    vectors: output,
    vocabulary: vocabulary,
    df: df,
    docCount: documents.length
  };

  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputWithMeta, null, 2), 'utf-8');
  console.log(`✅ embeddings.json written to ${OUTPUT_PATH}`);
  console.log(`   ${Object.keys(output).length} prompt vectors, ${vocabulary.length} vocabulary terms`);
}

main();
