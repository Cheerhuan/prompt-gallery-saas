'use client';
import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { isSaved, toggleSave } from '@/lib/vault';
import { isLiked, toggleLike } from '@/lib/likes';
import { resolvePromptImage } from '@/lib/image-url';
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

function subscribeCardPrefs(callback: () => void): () => void {
  window.addEventListener('vault-change', callback);
  window.addEventListener('likes-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('vault-change', callback);
    window.removeEventListener('likes-change', callback);
    window.removeEventListener('storage', callback);
  };
}

function getServerFalse(): boolean {
  return false;
}

function ActionButtons({
  saved,
  liked,
  onSave,
  onLike,
}: {
  saved: boolean;
  liked: boolean;
  onSave: (e: React.MouseEvent) => void;
  onLike: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      <button
        onClick={onSave}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/80 border border-white/15 transition-colors"
        aria-label={saved ? 'Remove from vault' : 'Save to vault'}
      >
        <svg className={`w-4 h-4 ${saved ? 'text-pink-400 fill-pink-400' : 'text-white/70 fill-transparent'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill={saved ? 'currentColor' : 'none'}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      <button
        onClick={onLike}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/80 border border-white/15 transition-colors"
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        <svg className={`w-4 h-4 ${liked ? 'text-red-400 fill-red-400' : 'text-white/70 fill-transparent'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill={liked ? 'currentColor' : 'none'}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
    </div>
  );
}

function ModelBadge({ model }: { model?: string }) {
  if (!model) return null;
  return (
    <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      <span className="px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-[9px] font-semibold uppercase tracking-wider text-zinc-200">
        {model}
      </span>
    </div>
  );
}

function HoverInfoPanel({
  title,
  creator,
  isCopied,
  onCopy,
  onView,
}: {
  title: string;
  creator?: string;
  isCopied: boolean;
  onCopy: (e: React.MouseEvent) => void;
  onView: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      <div className="rounded-lg bg-black/70 border border-white/10 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 tracking-tight">{title}</h3>
            {creator && <p className="text-[9px] text-zinc-400 mt-1 font-mono truncate">by {creator}</p>}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button onClick={onCopy} className="px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider rounded-md bg-white text-black hover:bg-zinc-200 transition-colors whitespace-nowrap">
              {isCopied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={onView} className="px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider rounded-md bg-white/10 text-white border border-white/15 hover:bg-white/20 transition-colors whitespace-nowrap">
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const PromptCard = ({
  id,
  image,
  title,
  tags = [],
  featured,
  mini,
  index = -1,
  onQuickView,
  creator,
  model,
}: PromptCardProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const saved = useSyncExternalStore(subscribeCardPrefs, () => isSaved(id), getServerFalse);
  const liked = useSyncExternalStore(subscribeCardPrefs, () => isLiked(id), getServerFalse);

  const hasImage = image && image.trim() !== '';
  if (!hasImage || imgFailed) return null;

  const { src, fallbackSrc, width, height } = resolvePromptImage(id, image, 'card');
  const activeSrc = triedFallback ? fallbackSrc : src;

  const isHeroCandidate = index >= 0 && index < 2;
  const isAboveFold = index >= 0 && index < 5;
  const deferRender = index >= 12;

  const estimatedIntrinsicHeight =
    width && height ? Math.max(160, Math.round(280 * (height / width))) : 350;

  const wrapperStyle = deferRender
    ? ({
        contentVisibility: 'auto',
        containIntrinsicSize: `auto ${estimatedIntrinsicHeight}px`,
      } as React.CSSProperties)
    : undefined;

  const handleImgError = () => {
    if (!triedFallback && fallbackSrc && src !== fallbackSrc) {
      setTriedFallback(true);
      return;
    }
    setImgFailed(true);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(title);
      setIsCopied(true);
      window.plausible?.('CopyPrompt', { props: { id: String(id) } });
      setTimeout(() => setIsCopied(false), 1500);
    } catch {}
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(id);
    window.plausible?.('SavePrompt', { props: { id: String(id) } });
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
  };

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(id);
  };

  const imgPriorityProps = isHeroCandidate ? { fetchPriority: 'high' as const } : {};
  const loadingAttr = isAboveFold ? 'eager' : 'lazy';
  const decodingAttr = isHeroCandidate ? 'sync' : 'async';

  // ── Featured card ──
  if (featured) {
    return (
      <div className="group relative rounded-xl overflow-hidden border border-zinc-800/0 hover:border-zinc-700/50 bg-zinc-900 transition-colors cursor-pointer animate-fade-up h-full">
        <Link href={`/prompt/${id}`} className="block" aria-label={title}>
          <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-zinc-800 relative">
            <img
              src={activeSrc}
              alt={title}
              width={width}
              height={height}
              referrerPolicy="no-referrer"
              onError={handleImgError}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading={loadingAttr}
              decoding={decodingAttr}
              {...imgPriorityProps}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <ActionButtons saved={saved} liked={liked} onSave={handleSave} onLike={handleLikeClick} />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              {tags.length > 0 && (
                <div className="flex items-center gap-3 mb-3">
                  {tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[3px] bg-white/10 text-zinc-400">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h3 className="text-2xl md:text-4xl font-bold tracking-tight text-white leading-tight mb-2 line-clamp-1">{title}</h3>
              {creator && <p className="text-[10px] text-zinc-500 font-mono">by {creator}</p>}
            </div>
          </div>
        </Link>
        <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  // ── Mini card ──
  if (mini) {
    return (
      <div
        style={wrapperStyle}
        className="group relative rounded-xl overflow-hidden border border-zinc-800/0 hover:border-zinc-700/50 bg-zinc-900 transition-colors cursor-pointer animate-fade-up h-full"
      >
        <Link href={`/prompt/${id}`} className="block" aria-label={title}>
          <div className="aspect-[4/5] overflow-hidden bg-zinc-800 relative">
            <img
              src={activeSrc}
              alt={title}
              width={width}
              height={height}
              referrerPolicy="no-referrer"
              onError={handleImgError}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading={loadingAttr}
              decoding={decodingAttr}
              {...imgPriorityProps}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <ActionButtons saved={saved} liked={liked} onSave={handleSave} onLike={handleLikeClick} />
            <HoverInfoPanel title={title} creator={creator} isCopied={isCopied} onCopy={handleCopy} onView={handleView} />
          </div>
        </Link>
        <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  // ── Standard card ──
  return (
    <div
      style={wrapperStyle}
      className="group relative rounded-xl overflow-hidden border border-zinc-800/0 hover:border-zinc-700/50 bg-zinc-900 transition-colors cursor-pointer animate-fade-up"
    >
      <Link href={`/prompt/${id}`} className="block" aria-label={title}>
        <div
          className="overflow-hidden bg-zinc-800/90 relative"
          style={{ aspectRatio: width && height ? `${width} / ${height}` : '4 / 5' }}
        >
          <img
            src={activeSrc}
            alt={title}
            width={width}
            height={height}
            referrerPolicy="no-referrer"
            onError={handleImgError}
            className="w-full h-full object-cover block"
            loading={loadingAttr}
            decoding={decodingAttr}
            {...imgPriorityProps}
          />
          <ActionButtons saved={saved} liked={liked} onSave={handleSave} onLike={handleLikeClick} />
          <ModelBadge model={model} />
          <HoverInfoPanel title={title} creator={creator} isCopied={isCopied} onCopy={handleCopy} onView={handleView} />
        </div>
      </Link>
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};
