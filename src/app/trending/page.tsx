'use client';
import React from 'react';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { useI18n } from '@/components/I18nProvider';

export default function TrendingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-black text-white">
      <SaaSNavbar />
      <main id="main-content" className="pt-32 pb-20 px-4 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          {t('trending.title')}
        </h1>
        <p className="text-zinc-400 text-lg mb-16 max-w-2xl mx-auto">
          {t('trending.subtitle')}
        </p>
        <div className="py-20 text-zinc-500">
          <span className="text-6xl block mb-4">🔥</span>
          <p>{t('trending.empty')}</p>
        </div>
      </main>
    </div>
  );
}
