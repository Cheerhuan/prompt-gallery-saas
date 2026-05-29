'use client';
import React, { useState, useEffect, useMemo, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ModelTabs from '@/components/ModelTabs';
import { PromptCard } from '@/components/PromptCard';
import { GallerySkeleton } from '@/components/Skeleton';
import { useI18n } from '@/components/I18nProvider';
import { AuthModal } from '@/components/AuthModal';
import promptsData from '@/data/prompts.json';
import type { SearchResult } from '@/lib/semantic-search';
import { translations, getCardTitle } from '@/lib/i18n';

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
    <nav className="flex flex-col items-center gap-2 pt-4 pb-2" aria-label="Pagination">
      <div className="flex items-center gap-1.5">
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeModel, setActiveModel] = useState('all');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'popular'>('featured');
  const initialPage = useMemo(() => {
    const p = searchParams.get('page');
    return p ? parseInt(p, 10) || 1 : 1;
  }, []);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [visibleCount, setVisibleCount] = useState(40);
  const ITEMS_PER_BATCH = 40;
  const [quickViewId, setQuickViewId] = useState<string | number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const showMoreRef = React.useRef<HTMLDivElement>(null);
  const BASE_PATH = '/prompt-gallery-saas';
  const embeddingsRef = useRef<any>(null);
  const [embeddingsReady, setEmbeddingsReady] = useState(false);
  const searchModuleRef = useRef<any>(null);

  // Dynamically load embeddings + search module when user types
  useEffect(() => {
    if (searchQuery.trim().length >= 2 && !embeddingsRef.current) {
      (async () => {
        try {
          const [emb, mod] = await Promise.all([
            fetch(`${BASE_PATH}/embeddings.json`).then(r => r.json()),
            import('@/lib/semantic-search'),
          ]);
          embeddingsRef.current = emb;
          searchModuleRef.current = mod.searchPrompts;
          setEmbeddingsReady(true);
        } catch (e) {
          console.warn('Semantic search unavailable, falling back to text filter');
        }
      })();
    }
  }, [searchQuery]);

  // Read collection param from URL
  useEffect(() => {
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

  // Reset page when filters change & clear URL page param
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(40);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    router.replace(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeFilter]);

  const promptsWithImages = useMemo(() =>
    promptsData
      .filter(p => p.image && p.image.trim() !== '')
      .reverse(),
  []);

  const filteredPrompts = useMemo(() => {
    const q = searchQuery.trim();
    if (q) {
      // If semantic search module is loaded, use it
      if (embeddingsRef.current && searchModuleRef.current) {
        const results: SearchResult[] = searchModuleRef.current(q, promptsWithImages, embeddingsRef.current);
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
      }
      // Fallback: text-only search (instant, no 10MB download)
      return promptsWithImages.filter(prompt => {
        const matchesQuery =
          prompt.title.toLowerCase().includes(q) ||
          prompt.full_prompt.toLowerCase().includes(q);
        if (!matchesQuery) return false;
        const matchesFilter =
          activeFilter === 'all' ||
          prompt.title.toLowerCase().includes(activeFilter.toLowerCase()) ||
          prompt.full_prompt.toLowerCase().includes(activeFilter.toLowerCase());
        return matchesFilter;
      });
    } else {
      return promptsWithImages.filter(prompt => {
        const matchesFilter =
          activeFilter === 'all' ||
          prompt.title.toLowerCase().includes(activeFilter.toLowerCase()) ||
          prompt.full_prompt.toLowerCase().includes(activeFilter.toLowerCase());
        return matchesFilter;
      });
    }
  }, [promptsWithImages, searchQuery, activeFilter, embeddingsReady]);

  // Model filter
  const modelFilteredPrompts = useMemo(() => {
    if (activeModel === 'all') return filteredPrompts;
    return filteredPrompts.filter(p => (p as any).model === activeModel);
  }, [filteredPrompts, activeModel]);

  // Sort logic
  const sortedPrompts = useMemo(() => {
    const list = [...modelFilteredPrompts];
    if (sortBy === 'newest') {
      // Already reversed (latest first), no change needed
    } else if (sortBy === 'popular') {
      // Random/placeholder sort - keep as-is for now
    }
    // 'featured' = default order
    return list;
  }, [filteredPrompts, sortBy]);

  const gridPrompts = sortedPrompts;

  const quickViewPrompt = quickViewId
    ? promptsWithImages.find(p => p.id === quickViewId)
    : null;

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.replace(`?${params.toString()}`, { scroll: false });
    const el = document.getElementById('gallery-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [router, searchParams]);

  const suggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return promptsWithImages
      .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5)
      .map(p => ({ id: p.id, title: p.title }));
  }, [searchQuery, promptsWithImages]);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const totalCount = modelFilteredPrompts.length;

  const handleSuggestionClick = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  // Mobile bottom nav items
  const mobileNavItems = [
    { href: '/', label: 'Home', icon: '⌂', active: true },
    { href: '/explore', label: 'Search', icon: '⌕', active: false },
    { href: '/saved', label: 'Saved', icon: '♡', active: false },
    { href: '/submit', label: 'Submit', icon: '+', active: false },
    { href: '/profile', label: 'Profile', icon: '●', active: false },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:text-sm focus:font-bold">
        Skip to main content
      </a>

      {/* ─── THREE-COLUMN LAYOUT ─── */}
      <div className="flex min-h-screen">
        {/* Left Sidebar (desktop only) */}
        <Sidebar activePage="home" onGetStarted={() => setShowAuthModal(true)} />

        {/* Main Content */}
        <main id="main-content" className="flex-1 min-w-0 px-4 md:px-6 pb-24 md:pb-12 pt-0">
          {/* Model Tabs + Search */}
          <ModelTabs
            activeModel={activeModel}
            onModelChange={setActiveModel}
            activeTab={activeFilter}
            onTabChange={setActiveFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            searchQuery={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); setShowSuggestions(true); }}
            totalCount={totalCount}
            searchSuggestions={suggestions}
            showSuggestions={showSuggestions}
            onSuggestionClick={handleSuggestionClick}
            searchRef={searchRef}
            filterOptions={Object.entries(translations[locale].gallery.filters).map(([key, label]) => ({
              value: key,
              label: String(label),
            }))}
          />

          {/* ─── GALLERY ─── */}
          <section id="gallery-section" className="scroll-mt-6">
            {modelFilteredPrompts.length === 0 ? (
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
                            creator={item.creator}
                            model={item.model}
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
                {/* ─── MASONRY COLUMNS (CSS columns for natural flow) ─── */}
                <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 [&>*]:break-inside-avoid space-y-4">
                  {gridPrompts.slice(0, visibleCount).map((item, idx) => (
                    <div key={item.id} className="break-inside-avoid">
                      <PromptCard
                        id={item.id}
                        image={item.image || ''}
                        title={getCardTitle(item.id, item.title, locale)}
                        tags={[]}
                        index={idx}
                        creator={item.creator}
                        model={item.model}
                        onQuickView={setQuickViewId}
                      />
                    </div>
                  ))}
                </div>

                {/* ─── SHOW MORE ─── */}
                {visibleCount < gridPrompts.length && (
                  <div ref={showMoreRef} className="flex justify-center pt-6 pb-2 scroll-mt-32">
                    <button
                      onClick={() => {
                        // Save scroll Y before columns reflow
                        const savedY = window.scrollY;

                        setVisibleCount(prev => prev + ITEMS_PER_BATCH);

                        // Restore scroll position after columns redistribute
                        requestAnimationFrame(() => {
                          // Re-read scrollY after columns reflow
                          const newY = window.scrollY;
                          // If columns pushed content up/down, compensate
                          if (Math.abs(newY - savedY) > 10) {
                            window.scrollTo({ top: savedY, behavior: 'instant' });
                          }
                          // Then smooth-scroll button into view
                          requestAnimationFrame(() => {
                            showMoreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          });
                        });
                      }}
                      className="px-8 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all"
                    >
                      Show More ({gridPrompts.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ─── SIMPLE FOOTER ─── */}
          <footer className="border-t border-zinc-800/30 mt-16">
            <div className="py-6 flex items-center justify-between">
              <p className="text-[10px] text-zinc-600 font-mono">
                Prompt Gallery · {totalCount} prompts · Updated daily
              </p>
              <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
                <span>·</span>
                <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
                <span>·</span>
                <a href="https://github.com/Cheerhuan/prompt-gallery-saas" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">GitHub</a>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-950 border-t border-zinc-800">
        <div className="flex items-center justify-around py-2">
          {mobileNavItems.map(item => (
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-0.5 px-3 py-1">
              <span className={`text-lg ${item.active ? 'text-white' : 'text-zinc-500'}`}>{item.icon}</span>
              <span className={`text-[8px] ${item.active ? 'text-white' : 'text-zinc-500'}`}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── AUTH MODAL (rendered at page level, outside Sidebar stacking context) ─── */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* ─── QUICK VIEW MODAL ─── */}
      {quickViewPrompt && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setQuickViewId(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row relative"
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
