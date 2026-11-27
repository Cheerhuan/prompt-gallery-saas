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
