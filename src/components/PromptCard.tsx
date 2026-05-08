'use client';
import React, { useState } from 'react';
import Link from 'next/link';

interface PromptCardProps {
  id: string | number;
  image: string;
  title: string;
  tags?: string[];
  /** Featured card: 2x width, larger image, shows prompt preview */
  featured?: boolean;
  /** Mini card: compact for bento row */
  mini?: boolean;
  /** Stagger animation index */
  index?: number;
  /** Quick-view callback (opens lightbox) */
  onQuickView?: (id: string | number) => void;
}

const BASE_PATH = '/prompt-gallery-saas';

export const PromptCard = ({ id, image, title, tags = [], featured, mini, index = 0, onQuickView }: PromptCardProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const hasImage = image && image.trim() !== '';

  if (!hasImage || imgFailed) return null;

  const resolvedSrc = image.startsWith('/') ? `${BASE_PATH}${image}` : image;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(title);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {}
  };

  // ── Featured card: 2x wide, large text overlay, row layout ──
  if (featured) {
    return (
      <div className="group relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 cursor-pointer animate-fade-up shine-effect">
        <Link href={`/prompt/${id}`} className="block">
          <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-zinc-800">
            <img
              src={resolvedSrc}
              alt=""
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            
            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Editor&apos;s Pick
                </span>
                {tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-xl md:text-3xl font-bold tracking-tight text-white leading-tight mb-2 line-clamp-1">
                {title}
              </h3>
              <p className="text-sm text-zinc-400 line-clamp-1 max-w-xl hidden md:block">
                Click to view full prompt & details →
              </p>
            </div>

            {/* Copy button on hover */}
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-xs text-zinc-300 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 duration-200"
            >
              {isCopied ? '✓ Copied' : 'Copy Title'}
            </button>
          </div>
        </Link>
      </div>
    );
  }

  // ── Mini card: compact for bento row ──
  if (mini) {
    return (
      <div className="group relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 cursor-pointer animate-fade-up shine-effect">
        <Link href={`/prompt/${id}`} className="block">
          <div className="aspect-[4/5] overflow-hidden bg-zinc-800">
            <img
              src={resolvedSrc}
              alt=""
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-xs font-medium text-white leading-tight line-clamp-2">{title}</h3>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // ── Standard card: image-first, overlay on hover ──
  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 cursor-pointer animate-fade-up shine-effect"
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
    >
      <Link href={`/prompt/${id}`} className="block">
        <div className="aspect-[3/4] overflow-hidden bg-zinc-800 relative">
          <img
            src={resolvedSrc}
            alt=""
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Always-visible bottom gradient + title */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <h3 className="text-sm font-medium text-white leading-tight line-clamp-2">{title}</h3>
          </div>

          {/* Hover-reveal overlay: rises from bottom on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map(tag => (
                <span key={tag} className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-zinc-300 border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
            
            {/* Quick action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={`flex-1 text-[11px] font-bold uppercase tracking-wider py-2 rounded-lg transition-all ${
                  isCopied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isCopied ? '✓ Copied' : 'Copy'}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView?.(id);
                }}
                className="flex-1 text-[11px] font-bold uppercase tracking-wider py-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/20 transition-all"
              >
                Quick View
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
