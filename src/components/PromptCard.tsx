'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { isSaved, toggleSave } from '@/lib/vault';
import { motion } from 'framer-motion';
import { use3DTilt } from '@/hooks/use3DTilt';

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
  /** PRO tier flag */
  tier?: 'free' | 'pro';
  /** Creator name */
  creator?: string;
}

const BASE_PATH = '/prompt-gallery-saas';

export const PromptCard = ({ id, image, title, tags = [], featured, mini, index = 0, onQuickView, tier = 'free', creator }: PromptCardProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const hasImage = image && image.trim() !== '';
  const isPro = tier === 'pro';

  // 3D tilt — only for standard cards (not featured, not mini)
  const isStandardCard = !featured && !mini;
  const { ref: tiltRef, style: tiltStyle } = use3DTilt({
    maxTilt: 8,
    scale: 1.015,
    speed: 500,
  });

  // Sync saved state from localStorage + listen for cross-component updates
  useEffect(() => {
    setSaved(isSaved(id));
    const handler = () => setSaved(isSaved(id));
    window.addEventListener('vault-change', handler);
    return () => window.removeEventListener('vault-change', handler);
  }, [id]);

  if (!hasImage || imgFailed) return null;

  const resolvedSrc = image.startsWith('/') ? `${BASE_PATH}${image}` : image;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(title);
      setIsCopied(true);
      window.plausible?.('CopyPrompt', {props: {id: String(id)}});
      setTimeout(() => setIsCopied(false), 1500);
    } catch {}
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(id);
    setSaved(!saved);
    window.plausible?.('SavePrompt', {props: {id: String(id)}});
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const siteUrl = 'https://cheerhuan.github.io/prompt-gallery-saas';
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(siteUrl + '/prompt/' + id)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    window.plausible?.('SharePrompt', { props: { id: String(id), platform: 'twitter' } });
  };

  // ── Save Button (shared across all variants) ──
  const SaveBtn = () => (
    <button
      onClick={handleSave}
      className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md
        bg-black/30 hover:bg-black/60 border border-white/10 hover:border-white/30
        opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 ${isPro ? '!opacity-100' : ''}`}
      aria-label={saved ? 'Unsave' : 'Save'}
    >
      <svg
        className={`w-4 h-4 transition-colors ${saved ? 'text-pink-400 fill-pink-400' : 'text-white/70 fill-transparent'}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        fill={saved ? 'currentColor' : 'none'}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );

  // ── PRO Badge overlay ──
  const ProBadge = () => {
    if (!isPro) return null;
    return (
      <div className="absolute top-3 left-3 z-20">
        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[8px] font-extrabold uppercase tracking-wider text-black shadow-lg shadow-amber-500/30">
          ⭐ Pro
        </span>
      </div>
    );
  };

  // ── PRO Lock overlay (blur + gradient) ──
  const ProLock = () => {
    if (!isPro) return null;
    return (
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none">
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/30 flex items-center justify-center mb-2 shadow-lg shadow-amber-500/10"
          >
            <span className="text-amber-300 text-lg">🔒</span>
          </motion.div>
          <span className="text-[9px] text-amber-300/70 font-bold uppercase tracking-widest">PRO Exclusive</span>
        </div>
      </div>
    );
  };

  // ── Shared Gradient Border Wrapper ──
  const CardWrapper = ({ children, className = "", style, tiltEnabled, tiltRef, tiltStyle }: { children: React.ReactNode, className?: string, style?: React.CSSProperties, tiltEnabled?: boolean, tiltRef?: React.RefObject<HTMLDivElement | null>, tiltStyle?: { transform: string; transition: string } }) => {
    const combinedRef = tiltEnabled && tiltRef ? tiltRef : undefined;
    const combinedStyle = tiltEnabled && tiltStyle ? { ...style, ...tiltStyle } : style;
    return (
    <div ref={combinedRef as any} className={`group relative p-[1px] rounded-2xl transition-all duration-500 hover:scale-[1.02] active:scale-95 cursor-pointer animate-fade-up shine-effect ${className}`} style={combinedStyle}>
      {/* Hover Glow Border - gold for PRO, indigo for free */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px] ${
        isPro 
          ? 'from-amber-400 via-yellow-400 to-amber-600' 
          : 'from-indigo-500 via-purple-500 to-pink-500'
      }`} />
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-zinc-900">
        {children}
      </div>
    </div>
  );
  };

  // ── Featured card: cinematic 2x wide ──
  if (featured) {
    return (
      <CardWrapper className="h-full">
        <Link href={`/prompt/${id}`} className="block">
          <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-zinc-800 relative">
            <img
              src={resolvedSrc}
              alt=""
              onError={() => setImgFailed(true)}
              className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${isPro ? 'blur-sm' : ''}`}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            
            <ProBadge />
            {isPro && <ProLock />}
            <SaveBtn />

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
                  Vault Selection
                </span>
                {tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 border border-white/10 backdrop-blur-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-2xl md:text-4xl font-extrabold tracking-tighter text-white leading-tight mb-2 line-clamp-1">
                {title}
              </h3>
              {creator && (
                <p className="text-[10px] text-zinc-500 font-mono tracking-wide">by {creator}</p>
              )}
            </div>

            {!isPro && (
              <motion.button
                onClick={handleCopy}
                whileTap={{ scale: 0.9 }}
                animate={isCopied ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
                className="absolute top-4 right-14 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 text-xs text-zinc-300 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
              >
                {isCopied ? '✓ Copied' : 'Copy Prompt'}
              </motion.button>
            )}
          </div>
        </Link>
      </CardWrapper>
    );
  }

  // ── Mini card: compact ──
  if (mini) {
    return (
      <CardWrapper className="h-full">
        <Link href={`/prompt/${id}`} className="block">
          <div className="aspect-[4/5] overflow-hidden bg-zinc-800 relative">
            <img
              src={resolvedSrc}
              alt=""
              onError={() => setImgFailed(true)}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isPro ? 'blur-sm' : ''}`}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <ProBadge />
            {isPro && <ProLock />}
            <SaveBtn />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 tracking-tight">{title}</h3>
            </div>
          </div>
        </Link>
      </CardWrapper>
    );
  }

  // ── Standard card: Pure Visual Discovery ──
  return (
    <CardWrapper 
      className="h-full"
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms` } as any}
      tiltEnabled={isStandardCard}
      tiltRef={tiltRef}
      tiltStyle={tiltStyle}
    >
      <Link href={`/prompt/${id}`} className="block">
        <div className="aspect-[3/4] overflow-hidden bg-zinc-800 relative">
          <img
            src={resolvedSrc}
            alt=""
            onError={() => setImgFailed(true)}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isPro ? 'blur-[6px]' : ''}`}
            loading="lazy"
          />
          
          <ProBadge />
          {isPro && <ProLock />}
          <SaveBtn />

          <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${isPro ? '' : 'group-hover:opacity-0'}`}>
            <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 tracking-tight">{title}</h3>
            {creator && (
              <p className="text-[9px] text-zinc-500 mt-1 font-mono">by {creator}</p>
            )}
          </div>

          {!isPro && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 flex flex-col justify-end p-4">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tags.map(tag => (
                  <span key={tag} className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10 backdrop-blur-md">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex gap-1.5">
                <motion.button
                  onClick={handleCopy}
                  whileTap={{ scale: 0.9 }}
                  animate={isCopied ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className={`flex-1 text-[10px] font-extrabold uppercase tracking-widest py-2.5 rounded-xl transition-all duration-300 ${
                    isCopied
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  {isCopied ? '✓ Copied' : 'Copy'}
                </motion.button>
                <button
                  onClick={handleShare}
                  className="flex-1 text-[10px] font-extrabold uppercase tracking-widest py-2.5 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/20 backdrop-blur-md transition-all duration-300"
                >
                  Share
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onQuickView?.(id);
                  }}
                  className="flex-1 text-[10px] font-extrabold uppercase tracking-widest py-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/20 backdrop-blur-md transition-all duration-300"
                >
                  Vault View
                </button>
              </div>
            </div>
          )}
        </div>
      </Link>
    </CardWrapper>
  );
};
