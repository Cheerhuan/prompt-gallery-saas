/**
 * Semantic Search Library for Prompt Gallery
 * Uses TF-IDF vectors computed at build time for client-side semantic search.
 *
 * Provides:
 * - cosineSimilarity(vecA, vecB): compute cosine similarity between two vectors
 * - vectorizeQuery(query, vocabulary, df, docCount): convert a text query to a TF-IDF vector
 * - searchPrompts(query, allPrompts, embeddings): combined keyword + semantic search
 * - getRelatedPrompts(promptId, allPrompts, embeddings, count): AI recommender
 */

export interface Prompt {
  id: string | number;
  title: string;
  full_prompt: string;
  image?: string;
  model?: string;
  _source?: string;
  creator?: string;
  tier?: string;
  [key: string]: unknown;
}

export interface EmbeddingsData {
  vectors: Record<string, number[]>;
  vocabulary: string[];
  df: Record<string, number>;
  docCount: number;
}

export interface SearchResult {
  prompt: Prompt;
  score: number;
  isSemantic: boolean;
}

// ─── Tokenization ──────────────────────────────────────────────

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const str = String(text);

  // Extract alphanumeric tokens (English / numbers)
  const alphaTokens = str.toLowerCase().match(/[a-z0-9]+/g) || [];
  tokens.push(...alphaTokens);

  // Extract Chinese characters individually
  const chineseChars = str.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || [];
  tokens.push(...chineseChars);

  // Extract Chinese bigrams
  for (let i = 0; i < chineseChars.length - 1; i++) {
    tokens.push(chineseChars[i] + chineseChars[i + 1]);
  }

  return tokens;
}

// ─── Vector Operations ─────────────────────────────────────────

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

// ─── Query Vectorization ───────────────────────────────────────

/**
 * Convert a query string to a TF-IDF vector using the same vocabulary and IDF values
 * as the pre-computed embeddings.
 */
export function vectorizeQuery(
  query: string,
  vocabulary: string[],
  df: Record<string, number>,
  docCount: number
): number[] {
  const terms = tokenize(query);
  const termCount = terms.length;
  const vector = new Array(vocabulary.length).fill(0);

  // Term frequency within query
  const tf: Record<string, number> = {};
  for (const term of terms) {
    tf[term] = (tf[term] || 0) + 1;
  }

  // Compute TF-IDF for each vocabulary term
  for (let j = 0; j < vocabulary.length; j++) {
    const term = vocabulary[j];
    const freq = tf[term] || 0;
    if (freq > 0) {
      const tfValue = 1 + Math.log10(freq);
      const idfValue = Math.log10(docCount / (1 + (df[term] || 0)));
      vector[j] = tfValue * idfValue;
    }
  }

  // L2 normalize
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

  return vector;
}

// ─── Semantic Search ───────────────────────────────────────────

/**
 * Search prompts using both keyword matching and semantic search.
 * Semantic results are weighted 1.5x, keyword results 1.0x.
 * Results are merged, deduplicated, and sorted by combined score.
 */
export function searchPrompts(
  query: string,
  allPrompts: Prompt[],
  embeddings: EmbeddingsData
): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const keywordWeight = 1.0;
  const semanticWeight = 1.5;
  const resultsMap = new Map<string | number, SearchResult>();

  // ── 1. Keyword search ──
  for (const prompt of allPrompts) {
    const titleMatch = prompt.title.toLowerCase().includes(q);
    const promptMatch = prompt.full_prompt.toLowerCase().includes(q);
    if (titleMatch || promptMatch) {
      // Score: title match is stronger
      let score = 0.3;
      if (titleMatch) score += 0.4;
      if (promptMatch) score += 0.3;
      score *= keywordWeight;

      const existing = resultsMap.get(prompt.id);
      if (!existing || score > existing.score) {
        resultsMap.set(prompt.id, { prompt, score, isSemantic: false });
      }
    }
  }

  // ── 2. Semantic search ──
  const queryVector = vectorizeQuery(
    query,
    embeddings.vocabulary,
    embeddings.df,
    embeddings.docCount
  );

  // Compute semantic similarity with every prompt that has an embedding
  for (const prompt of allPrompts) {
    const promptVec = embeddings.vectors[String(prompt.id)];
    if (!promptVec) continue;

    const sim = cosineSimilarity(queryVector, promptVec);
    if (sim > 0.08) {
      // Threshold to filter noise
      const semanticScore = sim * semanticWeight;

      const existing = resultsMap.get(prompt.id);
      if (!existing || semanticScore > existing.score) {
        resultsMap.set(prompt.id, {
          prompt,
          score: semanticScore,
          isSemantic: true,
        });
      } else if (existing) {
        // Combine scores: keep the higher score, mark as semantic if either is
        const combinedScore = Math.max(existing.score, semanticScore);
        resultsMap.set(prompt.id, {
          prompt,
          score: combinedScore,
          isSemantic: existing.isSemantic || true,
        });
      }
    }
  }

  // Sort by score descending
  return Array.from(resultsMap.values()).sort((a, b) => b.score - a.score);
}

// ─── AI Recommender (Related Prompts) ──────────────────────────

/**
 * Find top-N most semantically similar prompts to a given prompt.
 * Used for the "Related Prompts" section on detail pages.
 */
export function getRelatedPrompts(
  promptId: string | number,
  allPrompts: Prompt[],
  embeddings: EmbeddingsData,
  count: number = 4
): Prompt[] {
  const id = String(promptId);
  const targetVec = embeddings.vectors[id];
  if (!targetVec) return [];

  // Compute similarity with all other prompts
  const similarities: { prompt: Prompt; sim: number }[] = [];
  for (const prompt of allPrompts) {
    const pid = String(prompt.id);
    if (pid === id) continue;

    const vec = embeddings.vectors[pid];
    if (!vec) continue;

    const sim = cosineSimilarity(targetVec, vec);
    similarities.push({ prompt, sim });
  }

  // Sort by similarity descending, take top N
  return similarities
    .sort((a, b) => b.sim - a.sim)
    .slice(0, count)
    .map((s) => s.prompt);
}
