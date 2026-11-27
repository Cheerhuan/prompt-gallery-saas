'use client';
import React, { useState } from 'react';
import { resolvePromptImage } from '@/lib/image-url';

interface ResilientImageProps {
  promptId: string | number;
  image: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'sync' | 'async';
  fetchPriority?: 'high' | 'low';
}

export function ResilientImage({
  promptId,
  image,
  alt,
  className = '',
  loading = 'eager',
  decoding = 'async',
  fetchPriority,
}: ResilientImageProps) {
  const { src, thumbSrc, width, height } = resolvePromptImage(promptId, image, 'detail');
  const [stage, setStage] = useState<'primary' | 'thumb' | 'failed'>(src ? 'primary' : 'failed');

  const activeSrc = stage === 'thumb' && thumbSrc ? thumbSrc : src;

  if (stage === 'failed' || !activeSrc) {
    return (
      <div className="w-full min-h-[260px] flex flex-col items-center justify-center bg-zinc-900/80 text-zinc-500 p-8 text-center">
        <span className="text-3xl mb-2" aria-hidden="true">🖼️</span>
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Preview Unavailable</p>
        <p className="text-[11px] text-zinc-600 mt-1">Original image source could not be reached.</p>
      </div>
    );
  }

  const priorityProps = fetchPriority ? { fetchPriority } : {};

  return (
    <img
      src={activeSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      referrerPolicy="no-referrer"
      className={className}
      {...priorityProps}
      onError={() => {
        if (stage === 'primary' && thumbSrc && thumbSrc !== src) {
          setStage('thumb');
        } else {
          setStage('failed');
        }
      }}
    />
  );
}
