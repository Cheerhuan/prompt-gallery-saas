'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { useI18n } from '@/components/I18nProvider';
import { CHECKOUT_CONFIG } from '@/lib/monetization';

type ModalPlan = 'pro' | 'enterprise' | 'vault' | null;

export default function PricingPage() {
  const { t, locale } = useI18n();
  const isZh = locale === 'zh';
  const [modalPlan, setModalPlan] = useState<ModalPlan>(null);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const plans = [
    {
      key: 'free' as const,
      price: '0',
      highlight: false,
      featureKeys: ['credits', 'gallery', 'support'],
    },
    {
      key: 'pro' as const,
      price: '5',
      highlight: true,
      featureKeys: ['credits', 'gallery', 'breakdown', 'export', 'queue', 'collections', 'models'],
    },
    {
      key: 'enterprise' as const,
      price: '29',
      highlight: false,
      featureKeys: ['credits', 'gallery', 'breakdown', 'export', 'queue', 'collections', 'models'],
    },
  ];

  const handlePlanAction = (key: 'free' | 'pro' | 'enterprise' | 'vault') => {
    if (key === 'free') return;
    const urlMap = {
      pro: CHECKOUT_CONFIG.proUrl,
      enterprise: CHECKOUT_CONFIG.enterpriseUrl,
      vault: CHECKOUT_CONFIG.vaultUrl,
    };
    const targetUrl = urlMap[key];
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setSubmitted(false);
    setModalPlan(key);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      `[Prompt Gallery] Request access: ${modalPlan?.toUpperCase() || 'PRO'}`
    );
    const body = encodeURIComponent(
      `Hi Casper,\n\nI would like to unlock Prompt Gallery (${modalPlan}) or order the Top 100 Prompt Vault.\nMy email: ${buyerEmail || '(please reply to this email)'}\n`
    );
    window.location.href = `mailto:${CHECKOUT_CONFIG.contactEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SaaSNavbar />

      <main id="main-content" className="pt-32 pb-20 px-4 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 mb-6">
          <span>{t('pricing.badge')}</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          {t('pricing.title')}
        </h1>
        <p className="text-zinc-400 text-lg mb-16 max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative p-8 rounded-3xl border transition-all duration-300 flex flex-col ${
                plan.highlight
                  ? 'bg-zinc-900 border-indigo-500 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]'
                  : 'bg-black border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest">
                  {t('pricing.pro.popular')}
                </div>
              )}

              <div className="mb-8 text-left">
                <h3 className="text-2xl font-bold mb-2">{t(`pricing.${plan.key}.name`)}</h3>
                <p className="text-zinc-500 text-sm">{t(`pricing.${plan.key}.desc`)}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1 justify-center md:justify-start">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-zinc-500 text-sm">{t('pricing.monthLabel')}</span>
              </div>

              <div className="space-y-4 mb-10 text-left flex-1">
                {plan.featureKeys.map((featureKey, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <span className="text-indigo-400">✓</span>
                    <span className="text-zinc-300">
                      {featureKey === 'credits'
                        ? `${plan.key === 'free' ? '10' : plan.key === 'pro' ? '100' : t('pricing.unlimited')} ${t(`pricing.features.${featureKey}`)}`
                        : t(`pricing.features.${featureKey}`)}
                    </span>
                  </div>
                ))}
              </div>

              {plan.key === 'free' ? (
                <Link
                  href="/explore"
                  className="w-full py-4 rounded-xl font-bold transition-all bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 text-center block"
                >
                  {isZh ? '免費開始探索' : 'Start Exploring Free'}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePlanAction(plan.key)}
                  className={`w-full py-4 rounded-xl font-bold transition-all cursor-pointer ${
                    plan.highlight
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  {t(`pricing.${plan.key}.cta`)}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* One-time Digital Product Pack + Free 10-Prompt Sample */}
        <section className="mt-16 p-8 md:p-10 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-zinc-900 via-black to-indigo-950/30 text-left flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-3">
              <span>{isZh ? '一次性買斷數位包 · 免月費' : 'One-Time Digital Pack · No Subscription'}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              {isZh
                ? 'AI Visual Prompt Vault — Top 100 商業級視覺提示詞庫（$9 / NT$299）'
                : 'AI Visual Prompt Vault — Top 100 Production Prompts ($9 One-Time)'}
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {isZh
                ? '精選自 564+ 實戰庫中最完整的 100 組長篇結構化 Prompt（含 Markdown + Notion/Excel 可匯入 CSV）。先下載免費 10 組試用包確認品質，滿意再解鎖完整版。'
                : 'Curated from 564+ verified prompts with full lighting, camera, and layout structure (Markdown + Notion-ready CSV). Try the free 10-prompt sample pack before unlocking all 100.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => handlePlanAction('vault')}
              className="px-6 py-3.5 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition-all cursor-pointer text-center"
            >
              {isZh ? '🚀 解鎖 Top 100 完整包 ($9)' : '🚀 Get Top 100 Vault ($9)'}
            </button>
            <div className="flex gap-2">
              <a
                href={`${CHECKOUT_CONFIG.basePath}/downloads/prompt-vault-sample-10.md`}
                download="prompt-vault-sample-10.md"
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-center transition-all"
              >
                {isZh ? '⬇ 免費試用 10 組 (.md)' : '⬇ Free Sample (.md)'}
              </a>
              <a
                href={`${CHECKOUT_CONFIG.basePath}/downloads/prompt-vault-sample-10.csv`}
                download="prompt-vault-sample-10.csv"
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-center transition-all"
              >
                {isZh ? '⬇ 免費試用 (.csv)' : '⬇ Free Sample (.csv)'}
              </a>
            </div>
          </div>
        </section>
      </main>

      {modalPlan && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalPlan(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-left shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {modalPlan === 'vault'
                  ? isZh ? '解鎖 Top 100 提示詞庫 ($9)' : 'Unlock Top 100 Vault ($9)'
                  : modalPlan === 'pro'
                  ? isZh ? '申請升級 Pro ($5/月)' : 'Upgrade to Pro ($5/mo)'
                  : isZh ? '企業 / 客製自動化方案 ($29/月+)' : 'Enterprise / Custom Inquiry'}
              </h3>
              <button
                type="button"
                onClick={() => setModalPlan(null)}
                className="text-zinc-500 hover:text-white text-lg cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-zinc-400 mb-4">
              {isZh
                ? '留下你的 Email 並透過信件聯繫取得專屬付款連結與檔案授權；也可先下載免費 10 組試用包！'
                : 'Enter your email to open a direct order request for your checkout link & instant access, or grab the free 10-prompt sample below.'}
            </p>

            {submitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
                {isZh
                  ? `已為你開啟郵件請求（收件人：${CHECKOUT_CONFIG.contactEmail}），我們會盡快回傳結帳與下載連結！`
                  : `Order email opened to ${CHECKOUT_CONFIG.contactEmail}. We will reply with your checkout & download link shortly!`}
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3 mb-4">
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-400 text-white text-sm cursor-pointer transition-all"
                >
                  {isZh ? '發送購買 / 授權請求' : 'Request Checkout Link'}
                </button>
              </form>
            )}

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span>{isZh ? '想先測試提示詞品質？' : 'Want to test quality first?'}</span>
              <a
                href={`${CHECKOUT_CONFIG.basePath}/downloads/prompt-vault-sample-10.md`}
                download="prompt-vault-sample-10.md"
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {isZh ? '下載 10 組免費試用 →' : 'Download 10 Free →'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
