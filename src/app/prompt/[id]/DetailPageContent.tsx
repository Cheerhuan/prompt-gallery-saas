'use client';
import React, { useState } from 'react';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { PromptPlayground } from '@/components/PromptPlayground';
import { FeatureGate } from '@/components/FeatureGate';
import { useI18n } from '@/components/I18nProvider';
import { getCardTitle } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

export default function DetailPageContent({ prompt, params }: { prompt: any, params: { id: string } }) {
  const { t, locale } = useI18n();
  const userTier = 'free'; 
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(prompt.full_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <div className="fixed top-16 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-800 px-4 py-3 hidden md:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-zinc-500">{t('detail.archiveId')} {params.id}</span>
              <div className="w-px h-3 bg-zinc-800" />
              <span className="text-xs font-mono text-indigo-400">{t('detail.engine')} {prompt.model}</span>
            </div>
            <div className="flex items-center gap-3">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={copyToClipboard}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium hover:bg-zinc-800 transition-all relative overflow-hidden group"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span 
                      key="copied"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="block text-emerald-400"
                    >
                      {t('detail.synced')}
                    </motion.span>
                  ) : (
                    <motion.span 
                      key="copy"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="block text-zinc-300"
                    >
                      {t('detail.copyPrompt')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <button className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all active:scale-95">
                {t('detail.generateSimilar')}
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mt-8">
          <div className="lg:col-span-7 space-y-10">
            <div className="relative group rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
              <img 
                src={prompt.image?.startsWith('/') ? '/prompt-gallery-saas' + prompt.image : prompt.image} 
                alt={prompt.title}
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-6 left-6">
                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-widest text-white font-medium">
                  {t('detail.highFidelity')}
                </span>
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
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-3">
              <h1 className="text-5xl font-bold tracking-tighter leading-tight">{getCardTitle(prompt.id, prompt.title, locale)}</h1>
              <p className="text-zinc-500 text-sm font-light leading-relaxed">{t('detail.titleSubtitle')}</p>
            </div>
            <div className="space-y-6">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">{t('detail.anatomyTitle')}</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 group hover:border-indigo-500/50 transition-all">
                  <span className="text-[10px] text-indigo-400 uppercase font-bold mb-2 block">{t('detail.subject')}</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{anatomy.subject}</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 group hover:border-indigo-500/50 transition-all">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold mb-2 block">{t('detail.style')}</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{anatomy.style}</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 group hover:border-indigo-500/50 transition-all">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold mb-2 block">{t('detail.technical')}</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{anatomy.technical}</p>
                </div>
              </div>
            </div>
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
                ))
              }
            </div>
            </FeatureGate>
          </div>
        </div>
      </main>
    </div>
  );
}