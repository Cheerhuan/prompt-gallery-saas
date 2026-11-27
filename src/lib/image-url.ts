import thumbManifestRaw from '@/data/thumb-manifest.json';

export interface ThumbEntry {
  w?: number;
  h?: number;
  bytes?: number;
  hash?: string;
  thumb?: string;
  bad?: boolean;
  duplicateOf?: string;
  reason?: string;
}

const thumbManifest = thumbManifestRaw as Record<string, ThumbEntry>;

const BASE_PATH = '/prompt-gallery-saas';
const BAD_IMAGE_HOSTS = ['picsum.photos'];

export function isBadCardImage(id: string | number, image?: string | null): boolean {
  const raw = (image || '').trim();
  if (!raw) return true;
  if (BAD_IMAGE_HOSTS.some((h) => raw.includes(h))) return true;
  const entry = thumbManifest[String(id)];
  return Boolean(entry?.bad);
}

export function isDuplicateCard(id: string | number): boolean {
  return Boolean(thumbManifest[String(id)]?.duplicateOf);
}

export function canonicalImageKey(image?: string | null): string {
  return String(image || '')
    .trim()
    .split('?')[0]
    .replace(/^https?:\/\/images\.meigen\.ai\/cdn-cgi\/image\/[^/]+\//, 'https://images.meigen.ai/');
}

/**
 * Filters out bad/placeholder images and removes duplicate cards using both
 * precomputed manifest duplicate links (`duplicateOf` via MD5/URL/title+prompt)
 * and runtime canonical image URL deduplication (for newly ingested prompts).
 */
export function deduplicateGalleryPrompts<
  T extends { id: string | number; image?: string | null; title?: string; full_prompt?: string }
>(items: T[]): T[] {
  const seenImg = new Set<string>();
  const seenHash = new Set<string>();
  const out: T[] = [];

  for (const item of items) {
    if (isBadCardImage(item.id, item.image)) continue;
    const entry = thumbManifest[String(item.id)];
    if (entry?.duplicateOf) continue;

    const imgKey = canonicalImageKey(item.image);
    const hashKey = entry?.hash || '';

    if (imgKey && seenImg.has(imgKey)) continue;
    if (hashKey && seenHash.has(hashKey)) continue;

    if (imgKey) seenImg.add(imgKey);
    if (hashKey) seenHash.add(hashKey);
    out.push(item);
  }

  return out;
}

/**
 * Resolves the optimal image URL + fallback thumbnail + intrinsic dimensions
 * for gallery cards (`variant='card'`) or full-resolution previews (`variant='detail'`).
 */
export function resolvePromptImage(
  id: string | number,
  image: string,
  variant: 'card' | 'detail' = 'card'
): { src: string; fallbackSrc: string; thumbSrc?: string; width?: number; height?: number } {
  const raw = (image || '').trim();
  const fallbackSrc = raw.startsWith('/') ? `${BASE_PATH}${raw}` : raw;
  const entry = thumbManifest[String(id)];
  const thumbSrc = entry && !entry.bad && entry.thumb ? `${BASE_PATH}${entry.thumb}` : undefined;

  if (variant === 'card' && thumbSrc) {
    return {
      src: thumbSrc,
      fallbackSrc,
      thumbSrc,
      width: entry.w,
      height: entry.h,
    };
  }

  let optimized = fallbackSrc;
  if (variant === 'card') {
    if (optimized.includes('images.meigen.ai/cdn-cgi/image/')) {
      optimized = optimized.replace(
        /\/cdn-cgi\/image\/[^/]+\//,
        '/cdn-cgi/image/format=auto,quality=75,width=480/'
      );
    } else if (optimized.includes('images.pexels.com/')) {
      optimized = optimized.replace(/([?&])w=\d+/i, '$1w=480');
    }
  }

  return {
    src: optimized,
    fallbackSrc,
    thumbSrc,
    width: entry?.w,
    height: entry?.h,
  };
}
