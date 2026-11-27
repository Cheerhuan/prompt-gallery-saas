'use client';
import React, { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { PromptCard } from '@/components/PromptCard';
import {
  exportPromptsToCsv,
  exportPromptsToMarkdown,
  triggerTextDownload,
} from '@/lib/monetization';
import promptsData from '@/data/prompts.json';
import { getCardTitle } from '@/lib/i18n';
import { useI18n } from '@/components/I18nProvider';

const VAULT_STORAGE_KEY = 'prompt-gallery-vault';

function subscribeVault(callback: () => void): () => void {
  window.addEventListener('vault-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('vault-change', callback);
    window.removeEventListener('storage', callback);
  };
}

function getVaultSnapshot(): string {
  return localStorage.getItem(VAULT_STORAGE_KEY) || '[]';
}

function getVaultServerSnapshot(): string {
  return '[]';
}

export default function SavedPage() {
  const { locale } = useI18n();
  const isZh = locale === 'zh';
  const vaultRaw = useSyncExternalStore(
    subscribeVault,
    getVaultSnapshot,
    getVaultServerSnapshot
  );

  const savedIds = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(vaultRaw);
      return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
    } catch {
      return [];
    }
  }, [vaultRaw]);

  const savedPrompts = promptsData
    .filter(p => p.image && p.image.trim() !== '' && savedIds.includes(String(p.id)))
    .reverse();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      <SaaSNavbar />
      <main id="main-content" className="pt-36 pb-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            My Vault
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-6">
            {savedPrompts.length > 0
              ? `${savedPrompts.length} saved prompt${savedPrompts.length > 1 ? 's' : ''} — ready to use anytime.`
              : 'Save prompts you love by tapping the ♡ icon on any card.'}
          </p>

          {savedPrompts.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  triggerTextDownload(
                    'my-prompt-vault.md',
                    exportPromptsToMarkdown(savedPrompts),
                    'text/markdown;charset=utf-8'
                  )
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 cursor-pointer transition-all"
              >
                {isZh ? '⬇ 匯出 Markdown' : '⬇ Export Markdown'}
              </button>
              <button
                type="button"
                onClick={() =>
                  triggerTextDownload(
                    'my-prompt-vault.csv',
                    exportPromptsToCsv(savedPrompts),
                    'text/csv;charset=utf-8'
                  )
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 cursor-pointer transition-all"
              >
                {isZh ? '⬇ 匯出 CSV (Notion/Excel)' : '⬇ Export CSV (Notion/Excel)'}
              </button>
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 transition-all"
              >
                {isZh ? '📦 解鎖 Top 100 完整版' : '📦 Unlock Top 100 Vault'}
              </Link>
            </div>
          )}
        </div>

        {savedPrompts.length === 0 ? (
          <div className="text-center py-24">
            <span className="text-6xl block mb-4">💎</span>
            <h3 className="text-xl font-bold text-zinc-300 mb-2">Your vault is empty</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto mb-8">
              Start exploring and tap the heart icon to collect your favorite prompts.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all"
              >
                Explore the Vault
              </Link>
              <Link
                href="/pricing"
                className="inline-block px-6 py-3 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-full font-semibold hover:bg-zinc-800 transition-all"
              >
                {isZh ? '免費試用 Top 10' : 'Free 10-Prompt Sample'}
              </Link>
            </div>
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
                creator={item.creator}
                model={item.model}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
