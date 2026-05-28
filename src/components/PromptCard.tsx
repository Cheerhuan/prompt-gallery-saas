'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { isSaved, toggleSave } from '@/lib/vault';
import { isLiked, toggleLike } from '@/lib/likes';
import { AuthModal } from './AuthModal';

interface PromptCardProps {
  id: string | number;
  image: string;
  title: string;
  tags?: string[];
  featured?: boolean;
  mini?: boolean;
  index?: number;
  onQuickView?: (id: string | number) => void;
  creator?: string;
  model?: string;
  likesCount?: number;
}

const BASE_PATH = '/prompt-gallery-saas';

export const PromptCard = ({ id, image, title, tags = [], featured, mini, index = 0, onQuickView, creator, model, likesCount }: PromptCardProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const hasImage = image && image.trim() !== '';

  useEffect(() => {
    setSaved(isSaved(id));
    setLiked(isLiked(id));
    const handler = () => {
      setSaved(isSaved(id));
      setLiked(isLiked(id));
    };
    window.addEventListener('vault-change', handler);
    window.addEventListener('likes-change', handler);
    return () => {
      window.removeEventListener('vault-change', handler);
      window.removeEventListener('likes-change', handler);
    };
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

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const storedUser = localStorage.getItem('supabase-mock-user');
    if (!storedUser) {
      setShowAuthModal(true);
      return;
    }
    const user = JSON.parse(storedUser);
    toggleLike(id, user.id);
    setLiked(!liked);
  };

  // ── Floating action buttons (top-right, hover reveal) ──
  const ActionButtons = () => (
    <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
      <button
        onClick={handleSave}
        className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md bg-black/40 hover:bg-black/70 border border-white/15 transition-all"
        aria-label={saved ? 'Remove from vault' : 'Save to vault'}
      >
        <svg className={`w-4 h-4 ${saved ? 'text-pink-400 fill-pink-400' : 'text-white/70 fill-transparent'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill={saved ? 'currentColor' : 'none'}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      <button
        onClick={handleLikeClick}
        className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md bg-black/40 hover:bg-black/70 border border-white/15 transition-all"
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        <svg className={`w-4 h-4 ${liked ? 'text-red-400 fill-red-400' : 'text-white/70 fill-transparent'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill={liked ? 'currentColor' : 'none'}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
    </div>
  );

  // ── Model Badge (top-left, hover reveal) ──
  const ModelBadge = () => {
    if (!model) return null;
    return (
      <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
        <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10 text-[9px] font-semibold uppercase tracking-wider text-zinc-200">
          {model}
        </span>
      </div>
    );
  };

  // ── Hover Info Panel (bottom, floating) ──
  const HoverInfoPanel = () => (
    <div className="absolute bottom-0 left-0 right-0 z-20 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
      <div className="rounded-lg bg-black/60 backdrop-blur-md border border-white/10 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 tracking-tight">{title}</h3>
            {creator && <p className="text-[9px] text-zinc-400 mt-1 font-mono truncate">by {creator}</p>}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button onClick={handleCopy} className="px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider rounded-md bg-white text-black hover:bg-zinc-200 transition-all whitespace-nowrap">
              {isCopied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView?.(id); }} className="px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider rounded-md bg-white/10 text-white border border-white/15 hover:bg-white/20 transition-all whitespace-nowrap">
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Card wrapper (2026 editorial style, subtle shadow on hover) ──
  const CardWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    return (
      <div className={`group relative rounded-xl overflow-hidden border border-zinc-800/0 hover:border-zinc-700/50 bg-zinc-900 transition-all duration-300 hover:shadow-lg hover:shadow-black/30 hover:scale-[1.02] cursor-pointer animate-fade-up ${className}`}>
        {children}
      </div>
    );
  };

  // ── Featured card: cinematic 2x wide ──
  if (featured) {
    return (
      <CardWrapper className="h-full">
        <Link href={`/prompt/${id}`} className="block" aria-label={title}>
          <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-zinc-800 relative">
            <img src={resolvedSrc} alt={title} onError={() => setImgFailed(true)} className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110`} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <ActionButtons />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="flex items-center gap-3 mb-3">
                {tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[3px] bg-white/10 text-zinc-400">{tag}</span>
                ))}
              </div>
              <h3 className="text-2xl md:text-4xl font-bold tracking-tight text-white leading-tight mb-2 line-clamp-1">{title}</h3>
              {creator && <p className="text-[10px] text-zinc-500 font-mono">by {creator}</p>}
            </div>
          </div>
        </Link>
        <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </CardWrapper>
    );
  }

  // ── Mini card: compact (kept as-is for bento row) ──
  if (mini) {
    return (
      <CardWrapper className="h-full">
        <Link href={`/prompt/${id}`} className="block" aria-label={title}>
          <div className="aspect-[4/5] overflow-hidden bg-zinc-800 relative">
            <img src={resolvedSrc} alt={title} onError={() => setImgFailed(true)} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110`} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <ActionButtons />
            <HoverInfoPanel />
          </div>
        </Link>
        <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </CardWrapper>
    );
  }

  // ── Standard card: MeiGen-inspired Pure Visual Discovery ──
  return (
    <CardWrapper>
      <Link href={`/prompt/${id}`} className="block" aria-label={title}>
        <div className="overflow-hidden bg-zinc-800 relative">
          <img src={resolvedSrc} alt={title} onError={() => setImgFailed(true)} className="w-full h-auto object-contain block" loading="lazy" />
          <ActionButtons />
          <ModelBadge />
          <HoverInfoPanel />
        </div>
      </Link>
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </CardWrapper>
  );
};
