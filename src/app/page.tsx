'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { PromptCard } from '@/components/PromptCard';
import { GallerySkeleton } from '@/components/Skeleton';
import { useI18n } from '@/components/I18nProvider';
import promptsData from '@/data/prompts.json';
import { translations, getCardTitle } from '@/lib/i18n';

const CARDS_PER_PAGE = 20;

export default function LandingPage() {
  const { t, locale } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);
  const [quickViewId, setQuickViewId] = useState<string | number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Only show prompts that have an example image — 最新的在前
  const promptsWithImages = useMemo(() =>
    promptsData
      .filter(p => p.image && p.image.trim() !== '')
      .reverse(),
  []);

  const filteredPrompts = useMemo(() =>
    promptsWithImages.filter(prompt => {
      const matchesSearch =
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.full_prompt.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === 'all' ||
        prompt.title.toLowerCase().includes(activeFilter.toLowerCase()) ||
        prompt.full_prompt.toLowerCase().includes(activeFilter.toLowerCase());

      return matchesSearch && matchesFilter;
    }),
  [promptsWithImages, searchQuery, activeFilter]);

  // Sort: featured first (latest), then rest
  const featuredPrompts = filteredPrompts.slice(0, 3);
  const gridPrompts = filteredPrompts.slice(3);

  const visibleGridPrompts = gridPrompts.slice(0, visibleCount);
  const hasMore = visibleCount < gridPrompts.length;

  const loadMore = () => {
    setVisibleCount(prev => prev + CARDS_PER_PAGE);
  };

  // Quick-view modal: find prompt by ID
  const quickViewPrompt = quickViewId
    ? promptsWithImages.find(p => p.id === quickViewId)
    : null;

  const scrollToGallery = () => {
    const element = document.getElementById('gallery-section');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const totalCount = filteredPrompts.length;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      <SaaSNavbar />

      {/* ─── HERO SECTION (unchanged) ─── */}
      <section className="pt-36 pb-20 px-4 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-400 mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-dot" />
          {t('hero.badge')}
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent leading-[1.1]">
          {t('hero.title')}
        </h1>

        <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
          {t('hero.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={scrollToGallery}
            className="w-full sm:w-auto px-10 py-4 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
          >
            {t('hero.ctaPrimary')}
          </button>
          <Link
            href="/pricing"
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white rounded-full font-bold border border-zinc-800 hover:bg-zinc-800 transition-all text-center"
          >
            {t('hero.ctaSecondary')}
          </Link>
        </div>
      </section>

      {/* ─── GALLERY SECTION ─── */}
      <section id="gallery-section" className="max-w-7xl mx-auto px-4 mb-8">
        {/* Stats bar — contextual info */}
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

        {/* ─── FILTER BAR (glass morphism) ─── */}
        <div className="glass-panel rounded-2xl p-2 mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm leading-none">🔍</span>
            <input
              type="text"
              placeholder={t('gallery.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category pills (horizontal scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
            {Object.entries(translations.en.gallery.filters).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === key
                    ? 'bg-white text-black shadow-lg shadow-white/10'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
                }`}
              >
                {t(`gallery.filters.${key}`)}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <select className="bg-zinc-800/50 border border-zinc-700/50 text-[10px] rounded-lg px-3 py-1.5 outline-none text-zinc-400 font-bold uppercase tracking-wider cursor-pointer hover:border-zinc-500 transition-all flex-shrink-0">
            <option>{t('gallery.sortTrending')}</option>
            <option>{t('gallery.sortNewest')}</option>
            <option>{t('gallery.sortSaved')}</option>
          </select>
        </div>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <section className="max-w-7xl mx-auto px-4 pb-32">
        {isLoading ? (
          <GallerySkeleton />
        ) : filteredPrompts.length === 0 ? (
          <div className="py-24 text-center">
            <span className="text-5xl block mb-4">🎨</span>
            <h3 className="text-xl font-bold text-zinc-300 mb-2">{t('gallery.comingSoon')}</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">{t('gallery.comingSoonDesc')}</p>
          </div>
        ) : (
          <>
            {/* ─── FEATURED BENTO SECTION ─── */}
            {featuredPrompts.length > 0 && (
              <div className="mb-8">
                {/* First 3 as bento row: 1 featured (2 cols) + 2 mini */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Featured card — 2x wide, 2x tall */}
                  <div className="md:col-span-2 md:row-span-2">
                    <PromptCard
                      id={featuredPrompts[0].id}
                      image={featuredPrompts[0].image}
                      title={getCardTitle(featuredPrompts[0].id, featuredPrompts[0].title, locale)}
                      tags={['High-Fidelity', 'Industrial']}
                      featured
                      onQuickView={setQuickViewId}
                    />
                  </div>
                  {/* Mini cards */}
                  {featuredPrompts.slice(1, 3).map((item) => (
                    <div key={item.id} className="md:col-span-1 md:row-span-1">
                      <PromptCard
                        id={item.id}
                        image={item.image}
                        title={getCardTitle(item.id, item.title, locale)}
                        tags={['High-Fidelity', 'Industrial']}
                        mini
                        index={1}
                        onQuickView={setQuickViewId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── MAIN GRID ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {visibleGridPrompts.map((item, idx) => (
                <PromptCard
                  key={item.id}
                  id={item.id}
                  image={item.image}
                  title={getCardTitle(item.id, item.title, locale)}
                  tags={['High-Fidelity', 'Industrial']}
                  index={idx}
                  onQuickView={setQuickViewId}
                />
              ))}
            </div>

            {/* ─── LOAD MORE ─── */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={loadMore}
                  className="load-more-btn px-12 py-3.5 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-bold text-zinc-300 hover:text-white transition-all hover:scale-105 active:scale-95"
                >
                  Load {Math.min(CARDS_PER_PAGE, gridPrompts.length - visibleCount)} More ↓
                </button>
              </div>
            )}

            {/* Footer count */}
            {gridPrompts.length > 0 && (
              <p className="text-center text-[10px] text-zinc-600 mt-6 font-mono">
                Showing {Math.min(visibleCount + (featuredPrompts.length > 0 ? 3 : 0), totalCount)} of {totalCount} prompts
              </p>
            )}
          </>
        )}
      </section>

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
            {/* Image */}
            <div className="md:w-1/2 bg-zinc-800">
              <img
                src={quickViewPrompt.image}
                alt={quickViewPrompt.title}
                className="w-full h-full object-cover max-h-[50vh] md:max-h-[70vh]"
              />
            </div>
            {/* Info */}
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
          {/* Close button */}
          <button
            onClick={() => setQuickViewId(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-800/60 backdrop-blur-md border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
