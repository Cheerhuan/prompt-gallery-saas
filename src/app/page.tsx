'use client';
import React, { useState, useEffect } from 'react';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { PromptCard } from '@/components/PromptCard';
import { GallerySkeleton } from '@/components/Skeleton';
import { useI18n } from '@/components/I18nProvider';
import promptsData from '@/data/prompts.json';
import { translations } from '@/lib/i18n';

export default function LandingPage() {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const filteredPrompts = promptsData.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prompt.full_prompt.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || 
                          prompt.title.toLowerCase().includes(activeFilter.toLowerCase()) ||
                          prompt.full_prompt.toLowerCase().includes(activeFilter.toLowerCase());
                          
    return matchesSearch && matchesFilter;
  });

  const scrollToGallery = () => {
    const element = document.getElementById('gallery-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      <SaaSNavbar />
      
      <section className="pt-40 pb-24 px-4 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-400 mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          The Curator's Archive v1.0
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent leading-[1.1]">
          The Prompt <br /> Architect's Archive
        </h1>
        
        <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
          A curated collection of high-fidelity AI generative prompts, <br className="hidden md:block" /> 
          engineered for industrial precision and cinematic output.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button 
            onClick={scrollToGallery}
            className="w-full sm:w-auto px-10 py-4 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
          >
            {t('hero.ctaPrimary')}
          </button>
          <a 
            href="/pricing"
            className="w-full sm:w-auto px-10 py-4 bg-zinc-900 text-white rounded-full font-bold border border-zinc-800 hover:bg-zinc-800 transition-all text-center active:scale-95"
          >
            {t('hero.ctaSecondary')}
          </a>
        </div>
      </section>

      <section id="gallery-section" className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-md">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder={t('gallery.searchPlaceholder')} 
              className="w-full pl-10 pr-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-3 top-3 text-zinc-500 text-sm">🔍</span>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {Object.entries(translations.en.gallery.filters).map(([key, value]) => (
              <button 
                key={key} 
                onClick={() => setActiveFilter(key)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === key ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
              >
                {t(`gallery.filters.${key}`)}
              </button>
            ))}
            <div className="w-px h-4 bg-zinc-800 mx-2" />
            <select className="bg-black border border-zinc-800 text-xs rounded-full px-3 py-1.5 outline-none text-zinc-400 font-medium cursor-pointer hover:border-zinc-600 transition-all">
              <option>{t('gallery.sortTrending')}</option>
              <option>{t('gallery.sortNewest')}</option>
              <option>{t('gallery.sortSaved')}</option>
            </select>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-32">
        {isLoading ? (
          <GallerySkeleton />
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {filteredPrompts.map((item) => (
              <PromptCard 
                key={item.id} 
                id={item.id} 
                image={item.image} 
                title={item.title} 
                tags={['High-Fidelity', 'Industrial']} 
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
