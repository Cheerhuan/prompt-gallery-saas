import thumbManifestRaw from '@/data/thumb-manifest.json';

export interface ThumbEntry {
  w?: number;
  h?: number;
  bytes?: number;
  thumb?: string;
  bad?: boolean;
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

/**
 * Resolves the optimal image URL + intrinsic dimensions for gallery cards (`variant='card'`)
 * or full-resolution previews (`variant='detail'`).
 * - Stage 3: Uses pre-generated local 480px WebP thumbnails (`/images/thumbs/<id>.webp`)
 *   cached CacheFirst by sw.js when available.
 * - Stage 2: Rewrites external CDN URLs (`images.meigen.ai`, `images.pexels.com`) to compact
 *   480px widths when a local thumbnail isn't present yet (e.g. newly curated prompts).
 */
export function resolvePromptImage(
  id: string | number,
  image: string,
  variant: 'card' | 'detail' = 'card'
): { src: string; fallbackSrc: string; width?: number; height?: number } {
  const raw = (image || '').trim();
  const fallbackSrc = raw.startsWith('/') ? `${BASE_PATH}${raw}` : raw;
  const entry = thumbManifest[String(id)];

  if (variant === 'card' && entry && !entry.bad && entry.thumb) {
    return {
      src: `${BASE_PATH}${entry.thumb}`,
      fallbackSrc,
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
    width: entry?.w,
    height: entry?.h,
  };
}
