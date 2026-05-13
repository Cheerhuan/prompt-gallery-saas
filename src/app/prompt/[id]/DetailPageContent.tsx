'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { PromptCard } from '@/components/PromptCard';
import { PromptPlayground } from '@/components/PromptPlayground';
import { FeatureGate } from '@/components/FeatureGate';
import { useI18n } from '@/components/I18nProvider';
import { getCardTitle } from '@/lib/i18n';
import { isSaved, toggleSave } from '@/lib/vault';
import promptsData from '@/data/prompts.json';
import embeddingsData from '@/data/embeddings.json';
import { getRelatedPrompts } from '@/lib/semantic-search';
import { motion } from 'framer-motion';

export default function DetailPageContent({ prompt, params }: { prompt: any, params: { id: string } }) {
  const { t, locale } = useI18n();
  const userTier = 'free'; 
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const isPro = prompt.tier === 'pro';

  useEffect(() => {
    setSaved(isSaved(prompt.id));
    const handler = () => setSaved(isSaved(prompt.id));
    window.addEventListener('vault-change', handler);
    return () => window.removeEventListener('vault-change', handler);
  }, [prompt.id]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(prompt.full_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // View counter (client-side only)
  const [viewCount, setViewCount] = useState(0);
  useEffect(() => {
    const key = `prompt-views-${prompt.id}`;
    const raw = localStorage.getItem(key);
    const count = raw ? parseInt(raw, 10) + 1 : 1;
    localStorage.setItem(key, String(count));
    setViewCount(count);
  }, [prompt.id]);

  const shareLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleSave = () => {
    toggleSave(prompt.id);
    setSaved(!saved);
  };

  // Related prompts: AI-powered semantic similarity recommender
  const relatedPrompts = useMemo(
    () => getRelatedPrompts(prompt.id, promptsData as any, embeddingsData as any, 4),
    [prompt.id]
  );

  // Tier badge config
  const tierKey = isPro ? 'pro' : 'free';

  const deconstructPrompt = (promptText: string) => {
    const parts = promptText.split('|')[0].split(',');
    return {
      subject: parts[0] || 'Unknown',
      style: parts.slice(1, 4).join(', ') || 'Standard',
      technical: parts.slice(4).join(', ') || 'Default',
    };
  };

  const anatomy = deconstructPrompt(prompt.full_prompt);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <SaaSNavbar userTier={userTier} />
      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        {/* ─── JSON-LD Structured Data ─── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CreativeWork",
              "name": prompt.title,
              "description": prompt.full_prompt?.slice(0, 200),
              "image": prompt.image?.startsWith('/') ? `https://cheerhuan.github.io/prompt-gallery-saas${prompt.image}` : prompt.image,
              "keywords": `AI prompt, ${prompt.model || 'GPT-Image'}, prompt engineering`,
              "creator": { "@type": "Person", "name": prompt.creator || "Prompt Gallery" },
            })
          }}
        />
        {/* ─── Sticky Action Bar ─── */}
        <div className="fixed top-16 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors">← Back</Link>
              <div className="w-px h-3 bg-zinc-800" />
              <span className="text-xs font-mono text-zinc-500">{t('detail.archiveId')} {params.id}</span>
              <div className="w-px h-3 bg-zinc-800" />
              <span className="text-xs font-mono text-indigo-400">{t('detail.engine')} {prompt.model || 'GPT-Image-2'}</span>
              <div className="w-px h-3 bg-zinc-800" />
              <span className="text-xs font-mono text-zinc-500">{viewCount} views</span>
              {/* Tier badge */}
              <div className="w-px h-3 bg-zinc-800" />
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isPro
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isPro ? '⭐ Pro' : 'Free'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Save Button */}
              <button
                onClick={handleSave}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                  saved
                    ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <svg className={`w-3.5 h-3.5 ${saved ? 'fill-pink-400' : 'fill-transparent'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {saved ? 'Saved' : 'Save'}
              </button>
              {/* Share Button */}
              <button
                onClick={shareLink}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
              >
                {shareCopied ? '✓ Link Copied' : 'Share'}
              </button>
              {/* Copy Prompt Button - hidden for PRO prompts */}
              {!isPro && (
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={copyToClipboard}
                  className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all"
                >
                  {copied ? '✓ Copied' : t('detail.copyPrompt')}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mt-8">
          {/* ─── LEFT COLUMN: Image ─── */}
          <div className="lg:col-span-7 space-y-10">
            <div className={`relative group rounded-3xl overflow-hidden bg-zinc-900 border shadow-2xl ${
              isPro ? 'border-amber-500/20' : 'border-zinc-800'
            }`}>
              <img 
                src={prompt.image?.startsWith('/') ? '/prompt-gallery-saas' + prompt.image : prompt.image} 
                alt={prompt.title}
                className={`w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 ${isPro ? 'blur-sm' : ''}`}
                loading="lazy"
              />
              {isPro && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 backdrop-blur-xl border border-amber-400/30 flex items-center justify-center mx-auto mb-4 shadow-2xl">
                      <span className="text-3xl">🔒</span>
                    </div>
                    <p className="text-sm font-bold text-amber-300 mb-1">Premium Prompt</p>
                    <p className="text-[10px] text-zinc-400">Upgrade to Pro to unlock full resolution</p>
                  </div>
                </div>
              )}
              <div className="absolute top-6 left-6 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-widest text-white font-medium">
                  {t('detail.highFidelity')}
                </span>
                {isPro && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-[10px] uppercase tracking-widest text-amber-300 font-bold">
                    ⭐ Pro
                  </span>
                )}
              </div>
            </div>

            <FeatureGate isProRequired={true} userTier={userTier}>
              <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-sm">
                <h3 className="text-xs font-bold text-zinc-500 mb-6 uppercase tracking-[0.2em]">{t('detail.evolution')}</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-tighter">{t('detail.baseline')}</span>
                    <div className="aspect-square rounded-2xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden flex items-center justify-center">
                      <span className="text-zinc-600 text-[10px] font-mono">{t('detail.noData')}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] text-indigo-400 uppercase tracking-tighter">{t('detail.refinedArchitecture')}</span>
                    <div className="aspect-square rounded-2xl bg-zinc-900 border-2 border-indigo-500/50 overflow-hidden">
                      <img src={prompt.image?.startsWith('/') ? '/prompt-gallery-saas' + prompt.image : prompt.image} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            </FeatureGate>
          </div>

          {/* ─── RIGHT COLUMN: Details ─── */}
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-3">
              <h1 className="text-5xl font-bold tracking-tighter leading-tight">{getCardTitle(prompt.id, prompt.title, locale)}</h1>
              {/* Creator attribution */}
              {prompt.creator && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">{prompt.creator.charAt(0)}</span>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    Curated by <span className="text-zinc-300">{prompt.creator}</span>
                  </span>
                </div>
              )}
              <p className="text-zinc-500 text-sm font-light leading-relaxed">{t('detail.titleSubtitle')}</p>
            </div>

            <div className="space-y-6">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">{t('detail.anatomyTitle')}</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 group hover:border-indigo-500/50 transition-all">
                  <span className="text-[10px] text-indigo-400 uppercase font-bold mb-2 block">{t('detail.subject')}</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{anatomy.subject}</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 group hover:border-emerald-500/50 transition-all">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold mb-2 block">{t('detail.style')}</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{anatomy.style}</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 group hover:border-zinc-600 transition-all">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold mb-2 block">{t('detail.technical')}</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{anatomy.technical}</p>
                </div>
              </div>
            </div>

            {/* ─── FULL PROMPT SECTION ─── */}
            {/* Free prompts show full prompt; PRO prompts gate it */}
            {isPro ? (
              <FeatureGate isProRequired={true} userTier={userTier}>
                <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">{t('detail.fullPromptTitle')}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider">
                      ⭐ Pro
                    </span>
                  </div>
                  <textarea
                    readOnly
                    value={prompt.full_prompt}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed outline-none resize-none font-mono"
                    rows={Math.min(12, prompt.full_prompt.split('\n').length + 2)}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                </div>
              </FeatureGate>
            ) : (
              <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">{t('detail.fullPromptTitle')}</h2>
                  <button onClick={copyToClipboard} className="text-[10px] px-3 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all">
                    {t('detail.copyShort')}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={prompt.full_prompt}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed outline-none resize-none font-mono"
                  rows={Math.min(12, prompt.full_prompt.split('\n').length + 2)}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
            )}

            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <span className="text-[10px] px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">BETA_v1</span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{t('detail.playgroundTitle')}</h2>
              </div>
              <PromptPlayground initialPrompt={prompt.full_prompt} />
            </div>

            <FeatureGate isProRequired={true} userTier={userTier}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'realism', score: 98, color: 'text-emerald-400' },
                  { label: 'creative', score: 82, color: 'text-indigo-400' },
                  { label: 'complexity', score: 75, color: 'text-zinc-500' },
                ].map(stat => (
                  <div key={stat.label} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center group hover:border-zinc-600 transition-all">
                    <div className={`text-xl font-bold ${stat.color}`}>{stat.score}%</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-tighter">{t('scores.' + stat.label)}</div>
                  </div>
                ))}
              </div>
            </FeatureGate>
          </div>
        </div>

        {/* ─── RELATED PROMPTS ─── */}
        {relatedPrompts.length > 0 && (
          <div className="mt-24 border-t border-zinc-800/50 pt-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white mb-2">
                Related <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Prompts</span>
              </h2>
              <p className="text-zinc-500 font-light max-w-md mx-auto">
                AI-powered recommendations based on semantic similarity.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedPrompts.map((item) => (
                <PromptCard
                  key={item.id}
                  id={item.id}
                  image={item.image || ''}
                  title={getCardTitle(item.id, item.title, locale)}
                  tags={['High-Fidelity', 'Industrial']}
                  tier={item.tier as 'free' | 'pro' || 'free'}
                  creator={item.creator}
                  onQuickView={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
