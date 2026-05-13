'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { PromptCard } from '@/components/PromptCard';
import { getSavedIds } from '@/lib/vault';
import promptsData from '@/data/prompts.json';
import { getCardTitle } from '@/lib/i18n';
import { useI18n } from '@/components/I18nProvider';

export default function SavedPage() {
  const { locale } = useI18n();
  const [savedIds, setSavedIds] = useState<(string | number)[]>([]);

  useEffect(() => {
    setSavedIds(getSavedIds());
    const handler = () => setSavedIds(getSavedIds());
    window.addEventListener('vault-change', handler);
    return () => window.removeEventListener('vault-change', handler);
  }, []);

  const savedPrompts = promptsData
    .filter(p => p.image && p.image.trim() !== '' && savedIds.includes(String(p.id)))
    .reverse();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      <SaaSNavbar />
      <main className="pt-36 pb-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            My Vault
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            {savedPrompts.length > 0
              ? `${savedPrompts.length} saved prompt${savedPrompts.length > 1 ? 's' : ''} — ready to use anytime.`
              : 'Save prompts you love by tapping the ♡ icon on any card.'}
          </p>
        </div>

        {savedPrompts.length === 0 ? (
          <div className="text-center py-24">
            <span className="text-6xl block mb-4">💎</span>
            <h3 className="text-xl font-bold text-zinc-300 mb-2">Your vault is empty</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto mb-8">
              Start exploring and tap the heart icon to collect your favorite prompts.
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all"
            >
              Explore the Vault
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {savedPrompts.map((item) => (
              <PromptCard
                key={item.id}
                id={item.id}
                image={item.image}
                title={getCardTitle(item.id, item.title, locale)}
                tags={['High-Fidelity', 'Industrial']}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
