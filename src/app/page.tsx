'use client';
import React, { useState, useEffect, useMemo, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { PromptCard } from '@/components/PromptCard';
import { GallerySkeleton } from '@/components/Skeleton';
import { useI18n } from '@/components/I18nProvider';
import { BeforeAfter } from '@/components/BeforeAfter';
import { CollectionRow } from '@/components/CollectionRow';
import promptsData from '@/data/prompts.json';
import embeddingsData from '@/data/embeddings.json';
import { searchPrompts } from '@/lib/semantic-search';
import type { SearchResult } from '@/lib/semantic-search';
import { translations, getCardTitle } from '@/lib/i18n';
import { motion } from 'framer-motion';

const CARDS_PER_PAGE = 20;

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
}) {
  if (totalPages <= 1) return null;

  // Generate visible page numbers
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className="flex flex-col items-center gap-4 pt-8 pb-4" aria-label="Pagination">
      <div className="flex items-center gap-1.5">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed
            enabled:hover:bg-zinc-800 enabled:text-zinc-400 enabled:hover:text-zinc-200"
          aria-label="Previous page"
        >
          ← Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 px-2">
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`dot-${i}`} className="px-1.5 text-zinc-600 text-xs select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-all duration-200
                  ${p === currentPage
                    ? 'bg-white text-black shadow-lg shadow-white/10'
                    : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                aria-label={`Page ${p}`}
                aria-current={p === currentPage ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed
            enabled:hover:bg-zinc-800 enabled:text-zinc-400 enabled:hover:text-zinc-200"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>

      <p className="text-[10px] text-zinc-600 font-mono tracking-wide">
        Page {currentPage} of {totalPages} · {totalCount} prompts total
      </p>
    </nav>
  );
}

function GalleryContent() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [quickViewId, setQuickViewId] = useState<string | number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  // Pagination — no infinite scroll (better performance)
  useEffect(() => {
    // Read collection param from URL to auto-apply filter (no fake loading delay)
    const collection = searchParams.get('collection');
    if (collection) {
      const filterMap: Record<string, string> = {
        cinematic: 'cinematic',
        cyberpunk: 'cyberpunk',
        hyperreal: 'hyperreal',
        spatial: 'spatial',
      };
      const keyword = filterMap[collection];
      if (keyword) {
        setSearchQuery(keyword);
        setTimeout(() => {
          const el = document.getElementById('gallery-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 600);
      }
    }
  }, [searchParams]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  // Only show prompts that have an example image — latest first
  const promptsWithImages = useMemo(() =>
    promptsData
      .filter(p => p.image && p.image.trim() !== '')
      .reverse(),
  []);

  const filteredPrompts = useMemo(() => {
    const q = searchQuery.trim();
    if (q) {
      const results: SearchResult[] = searchPrompts(q, promptsWithImages, embeddingsData as any);

      return results
        .filter(r => {
          if (activeFilter === 'all') return true;
          const p = r.prompt;
          return (
            p.title.toLowerCase().includes(activeFilter.toLowerCase()) ||
            p.full_prompt.toLowerCase().includes(activeFilter.toLowerCase())
          );
        })
        .map(r => r.prompt);
    } else {
      // ── No search query: standard filtering ──
      return promptsWithImages.filter(prompt => {
        const matchesFilter =
          activeFilter === 'all' ||
          prompt.title.toLowerCase().includes(activeFilter.toLowerCase()) ||
          prompt.full_prompt.toLowerCase().includes(activeFilter.toLowerCase());
        return matchesFilter;
      });
    }
  }, [promptsWithImages, searchQuery, activeFilter]);

  // Sort: featured first (latest), then rest
  const featuredPrompts = filteredPrompts.slice(0, 3);
  const gridPrompts = filteredPrompts.slice(3);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(gridPrompts.length / CARDS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * CARDS_PER_PAGE;
  const visibleGridPrompts = gridPrompts.slice(startIdx, startIdx + CARDS_PER_PAGE);

  // Quick-view modal: find prompt by ID
  const quickViewPrompt = quickViewId
    ? promptsWithImages.find(p => p.id === quickViewId)
    : null;

  const scrollToGallery = useCallback(() => {
    const element = document.getElementById('gallery-section');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const el = document.getElementById('gallery-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Search autocomplete suggestions
  const suggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return promptsWithImages
      .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5)
      .map(p => ({ id: p.id, title: p.title }));
  }, [searchQuery, promptsWithImages]);

  // Click outside to close suggestions
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const totalCount = filteredPrompts.length;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:text-sm focus:font-bold">
        Skip to main content
      </a>
      <SaaSNavbar />

      {/* ─── HERO — compact editorial ─── */}
      <section id="main-content" className="pt-28 pb-16 px-4 text-center max-w-4xl mx-auto relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/4 blur-[140px] pointer-events-none" />

        <div
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500">
            <span className="w-1 h-1 rounded-full bg-zinc-500" />
            {t('hero.badge')}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            {t('hero.title')}
          </h1>

          <p className="text-base text-zinc-500 max-w-lg mx-auto leading-relaxed font-light">
            {t('hero.subtitle')}
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={scrollToGallery}
              className="px-8 py-3 bg-white text-black rounded-lg font-medium text-sm hover:bg-zinc-200 transition-all"
            >
              {t('hero.ctaPrimary')}
            </button>
            <Link
              href="/pricing"
              className="px-6 py-3 text-zinc-400 rounded-lg font-medium text-sm border border-zinc-800 hover:border-zinc-600 hover:text-white transition-all"
            >
              {t('hero.ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PROMPT PACKS ─── */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-bold mb-2 block">Curated Collections</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tighter text-white">
              Prompt <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Packs</span>
            </h2>
          </div>
          <Link href="/pricing" className="text-[10px] uppercase tracking-wider text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1">
            View All →
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory">
          {[
            { title: 'Cinematic Mastery', desc: '15 prompts · Hollywood-grade visual storytelling', icon: '🎬', color: 'from-indigo-500/20 to-purple-600/20', border: 'border-indigo-500/20', badge: 'Free' },
            { title: 'Cyberpunk Collection', desc: '12 prompts · Neon-drenched dystopian aesthetics', icon: '🌆', color: 'from-rose-500/20 to-orange-600/20', border: 'border-rose-500/20', badge: 'Free' },
            { title: 'Pro Architecture Pack', desc: '20 prompts · Industrial precision & spatial mastery', icon: '🏛️', color: 'from-amber-500/20 to-yellow-600/20', border: 'border-amber-500/20', badge: 'Pro' },
            { title: 'Hyper-Realism Vault', desc: '18 prompts · Texture-perfect, light-accurate', icon: '🔬', color: 'from-emerald-500/20 to-teal-600/20', border: 'border-emerald-500/20', badge: 'Free' },
            { title: 'Character Design Studio', desc: '10 prompts · Next-gen character & portrait craft', icon: '👤', color: 'from-violet-500/20 to-pink-600/20', border: 'border-violet-500/20', badge: 'Pro' },
          ].map((pack) => (
            <Link
              key={pack.title}
              href={pack.badge === 'Pro' ? '/pricing' : '/'}
              className="flex-shrink-0 w-[260px] snap-start group relative p-[1px] rounded-2xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${pack.color} opacity-60 group-hover:opacity-100 transition-opacity duration-300 blur-[2px]`} />
              <div className={`relative h-full rounded-2xl bg-zinc-900/90 backdrop-blur-md border ${pack.border} p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{pack.icon}</span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    pack.badge === 'Pro'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {pack.badge === 'Pro' ? '⭐ Pro' : pack.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{pack.title}</h3>
                <p className="text-[10px] text-zinc-500 leading-relaxed">{pack.desc}</p>
                {pack.badge === 'Pro' && (
                  <div className="mt-3 flex items-center gap-1.5 text-[9px] text-amber-400/70 font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-dot" />
                    Unlock with Pro
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── COLLECTIONS ROW ─── */}
      <CollectionRow
        collections={[
          { id: 'cinematic', title: 'Cinematic Masters', description: 'Hollywood-grade visual storytelling prompts engineered for maximum emotional impact.', image: '/images/uploads/character-design.jpg', count: 12 },
          { id: 'cyberpunk', title: 'Cyberpunk Vault', description: 'Neon-drenched dystopian aesthetics blending organic forms with digital decay.', image: '/images/uploads/cyber-organic-botany.jpg', count: 8 },
          { id: 'hyperreal', title: 'Hyper-Realistic', description: 'Texture-perfect, light-accurate prompts that blur the line between AI and photography.', image: '/images/uploads/hyper-tactile-surrealism.jpg', count: 15 },
          { id: 'spatial', title: 'Spatial Visions', description: 'Futuristic architecture and impossible geometries rendered with industrial precision.', image: '/images/uploads/surreal-floating-islands.jpg', count: 10 },
        ]}
      />

      {/* ─── GALLERY ─── */}
      <section id="gallery-section" className="max-w-7xl mx-auto px-4 mb-8">
        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            {totalCount} prompts
          </span>
          <span className="w-px h-3 bg-zinc-800" />
          <span>7 styles</span>
          <span className="w-px h-3 bg-zinc-800" />
          <span>Updated daily</span>
        </div>

        {/* ─── FILTER BAR — flat, no glassmorphism ─── */}
        <div className="border-b border-zinc-800 pb-4 mb-8 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0" ref={searchRef}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs leading-none z-10">⌘</span>
            <input
              type="text"
              placeholder={t('gallery.searchPlaceholder')}
              aria-label="Search prompts"
              className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-zinc-800 text-sm focus:border-zinc-500 outline-none transition-all placeholder:text-zinc-600"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {/* Autocomplete */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
                {suggestions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/prompt/${s.id}`}
                    className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all border-b border-zinc-800 last:border-0"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <span className="text-indigo-400 mr-2">→</span>
                    {s.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar flex-shrink-0">
            {Object.entries(translations.en.gallery.filters).map(([key, value]) => {
              const count = key === 'all'
                ? promptsWithImages.length
                : promptsWithImages.filter(p =>
                    p.title.toLowerCase().includes(key.toLowerCase()) ||
                    p.full_prompt.toLowerCase().includes(key.toLowerCase())
                  ).length;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  aria-pressed={activeFilter === key}
                  className={`text-xs transition-all whitespace-nowrap py-1 ${
                    activeFilter === key
                      ? 'text-white font-medium border-b-2 border-white'
                      : 'text-zinc-500 hover:text-zinc-300 font-normal border-b-2 border-transparent'
                  }`}
                >
                  {t(`gallery.filters.${key}`)}
                  <span className={`ml-1.5 text-[10px] ${activeFilter === key ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <select aria-label="Sort" className="bg-transparent border border-zinc-800 text-xs rounded-md px-2.5 py-1 outline-none text-zinc-500 cursor-pointer hover:border-zinc-600 transition-all flex-shrink-0">
            <option>{t('gallery.sortTrending')}</option>
            <option>{t('gallery.sortNewest')}</option>
            <option>{t('gallery.sortSaved')}</option>
          </select>
        </div>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <section className="max-w-7xl mx-auto px-4 pb-32">
        {filteredPrompts.length === 0 ? (
          <div className="py-24 text-center">
            {searchQuery || activeFilter !== 'all' ? (
              <>
                <span className="text-5xl block mb-4">🔍</span>
                <h3 className="text-xl font-bold text-zinc-300 mb-2">No matches found</h3>
                <p className="text-zinc-500 text-sm max-w-md mx-auto mb-8">
                  Try a different search term or{' '}
                  <button onClick={() => { setSearchQuery(''); setActiveFilter('all'); }} aria-label="Reset all filters" className="text-indigo-400 hover:underline">
                    reset all filters
                  </button>
                </p>
                <div className="max-w-4xl mx-auto">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">You might like these</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {promptsWithImages.slice(0, 4).map((item) => (
                      <PromptCard
                        key={item.id}
                        id={item.id}
                        image={item.image || ''}
                        title={getCardTitle(item.id, item.title, locale)}
                        tags={[]}
                        index={0}
                        tier={item.tier as 'free' | 'pro' || 'free'}
                        creator={item.creator}
                        onQuickView={setQuickViewId}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <span className="text-5xl block mb-4">🎨</span>
                <h3 className="text-xl font-bold text-zinc-300 mb-2">{t('gallery.comingSoon')}</h3>
                <p className="text-zinc-500 text-sm max-w-md mx-auto">{t('gallery.comingSoonDesc')}</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* ─── FEATURED BENTO ─── */}
            {featuredPrompts.length > 0 && (
              <div className="mb-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Featured card — 2x wide */}
                  <div className="md:col-span-2 md:row-span-2 relative">
                    <PromptCard
                      id={featuredPrompts[0].id}
                      image={featuredPrompts[0].image || ''}
                      title={getCardTitle(featuredPrompts[0].id, featuredPrompts[0].title, locale)}
                      tags={['High-Fidelity', 'Industrial']}
                      featured
                      tier={featuredPrompts[0].tier as 'free' | 'pro' || 'free'}
                      creator={featuredPrompts[0].creator}
                      onQuickView={setQuickViewId}
                    />
                  </div>
                  {/* Mini cards */}
                  {featuredPrompts.slice(1, 3).map((item) => (
                    <div key={item.id} className="md:col-span-1 md:row-span-1 relative">
                      <PromptCard
                        id={item.id}
                        image={item.image || ''}
                        title={getCardTitle(item.id, item.title, locale)}
                        tags={['High-Fidelity', 'Industrial']}
                        mini
                        index={1}
                        tier={item.tier as 'free' | 'pro' || 'free'}
                        creator={item.creator}
                        onQuickView={setQuickViewId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── MAIN GRID: 4 columns desktop, 5 on ultra-wide ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {visibleGridPrompts.map((item, idx) => (
                <div key={item.id} className="relative">
                  <PromptCard
                    id={item.id}
                    image={item.image || ''}
                    title={getCardTitle(item.id, item.title, locale)}
                    tags={['High-Fidelity', 'Industrial']}
                    index={idx}
                    tier={item.tier as 'free' | 'pro' || 'free'}
                    creator={item.creator}
                    onQuickView={setQuickViewId}
                  />
                </div>
              ))}
            </div>

            {/* ─── PAGINATION ─── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10 mb-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-xs hover:text-white hover:border-zinc-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const page = totalPages <= 7 ? i + 1 : (() => {
                    const half = 3;
                    let start = Math.max(1, currentPage - half);
                    let end = Math.min(totalPages, start + 6);
                    if (end - start < 6) start = Math.max(1, end - 6);
                    return i + start;
                  })();
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-zinc-800/30 border border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-xs hover:text-white hover:border-zinc-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Footer count */}
            {gridPrompts.length > 0 && (
              <p className="text-center text-[10px] text-zinc-500 mt-4 mb-8 font-mono">
                Page {safePage} of {totalPages} · {totalCount} prompts total
              </p>
            )}
          </>
        )}
      </section>

      {/* ─── BEFORE/AFTER ─── */}
      <section className="border-t border-zinc-800/50 py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-bold mb-4 block">Proof of Quality</span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-white mb-4">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Prompt Gap</span>
          </h2>
          <p className="text-zinc-500 font-light max-w-xl mx-auto">
            See the difference between a generic prompt and an engineered architecture. Drag the slider to compare.
          </p>
        </div>
        <BeforeAfter
          beforeImage="/prompt-gallery-saas/images/attack-on-titan.jpg"
          afterImage="/prompt-gallery-saas/images/zenitsu-50lan-collab.jpg"
          beforeLabel="Generic Prompt"
          afterLabel="Engineered Vault Prompt"
        />
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-zinc-800/30 mt-24">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8">
              <h2 className="text-6xl md:text-8xl lg:text-9xl font-serif italic font-bold leading-[0.9] tracking-tighter text-white/10 hover:text-white/20 transition-colors duration-1000 select-none">
                Prompt<br />Gallery
              </h2>
              <p className="text-sm text-zinc-600 mt-8 max-w-md leading-relaxed font-light">
                A curated ecosystem of high-conversion prompts engineered for cinematic results. 
                Every prompt, tested. Every result, guaranteed.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-medium">Resources</span>
                  <div className="flex flex-col gap-1.5">
                    {['Explore', 'Trending', 'Leaderboard'].map(link => (
                      <Link key={link} href={`/${link.toLowerCase()}`} className="text-sm text-zinc-400 hover:text-white transition-colors w-fit">
                        {link}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-medium">Community</span>
                  <div className="flex flex-col gap-1.5">
                    {['Submit Prompt', 'My Vault', 'Pricing'].map(link => (
                      <Link key={link} href={`/${link.toLowerCase().replace(' ', '-')}`} className="text-sm text-zinc-400 hover:text-white transition-colors w-fit">
                        {link}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-12 lg:mt-0">
                <p className="text-[10px] text-zinc-700 font-mono">
                  © 2026 Prompt Gallery · Engineered with intent
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── QUICK VIEW MODAL ─── */}
      {quickViewPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setQuickViewId(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col md:flex-row animate-fade-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:w-1/2 bg-zinc-800">
              <img
                src={quickViewPrompt.image}
                alt={quickViewPrompt.title}
                className="w-full h-full object-cover max-h-[50vh] md:max-h-[70vh]"
              />
            </div>
            <div className="md:w-1/2 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Quick View
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">#{quickViewPrompt.id}</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-4 line-clamp-2">{getCardTitle(quickViewPrompt.id, quickViewPrompt.title, locale)}</h2>
                <p className="text-sm text-zinc-400 leading-relaxed line-clamp-8 mb-4">
                  {quickViewPrompt.full_prompt}
                </p>
                <span className="text-[10px] text-zinc-500 font-mono">Model: {quickViewPrompt.model || 'GPT-Image-2'}</span>
              </div>
              <Link
                href={`/prompt/${quickViewPrompt.id}`}
                className="mt-6 w-full block text-center px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
              >
                View Full Details →
              </Link>
            </div>
          </div>
          <button
            onClick={() => setQuickViewId(null)}
            aria-label="Close quick view"
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-800/60 backdrop-blur-md border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <GalleryContent />
    </Suspense>
  );
}
