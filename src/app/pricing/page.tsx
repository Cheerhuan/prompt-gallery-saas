'use client';
import React from 'react';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { useI18n } from '@/components/I18nProvider';

export default function PricingPage() {
  const { t } = useI18n();

  const PLANS = [
    {
      name: t('pricing.plans.free.name'),
      price: '0',
      description: t('pricing.plans.free.description'),
      features: [
        t('pricing.plans.free.f1'),
        t('pricing.plans.free.f2'),
        t('pricing.plans.free.f3'),
        t('pricing.plans.free.f4'),
        t('pricing.plans.free.f5'),
        t('pricing.plans.free.f6'),
      ],
      cta: t('pricing.plans.free.cta'),
      highlight: false,
    },
    {
      name: t('pricing.plans.pro.name'),
      price: '5',
      description: t('pricing.plans.pro.description'),
      features: [
        t('pricing.plans.pro.f1'),
        t('pricing.plans.pro.f2'),
        t('pricing.plans.pro.f3'),
        t('pricing.plans.pro.f4'),
        t('pricing.plans.pro.f5'),
        t('pricing.plans.pro.f6'),
      ],
      cta: t('pricing.plans.pro.cta'),
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <SaaSNavbar />
      
      <main className="pt-32 pb-20 px-4 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 mb-6">
          <span>{t('pricing.badge')}</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          {t('pricing.title')}
        </h1>
        <p className="text-zinc-400 text-lg mb-16 max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div 
              key={plan.name} 
              className={`relative p-8 rounded-3xl border transition-all duration-300 ${
                plan.highlight 
                ? 'bg-zinc-900 border-indigo-500 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]' 
                : 'bg-black border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest">
                  {t('pricing.mostPopular')}
                </div>
              )}
              
              <div className="mb-8 text-left">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-zinc-500 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1 justify-center md:justify-start">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-zinc-500 text-sm">{t('pricing.perMonth')}</span>
              </div>

              <div className="space-y-4 mb-10 text-left">
                {plan.features.map((feature, idx) => {
                  const isChecked = feature.startsWith('✓') || feature.startsWith('✅');
                  return (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <span className={isChecked ? 'text-indigo-400' : 'text-zinc-600'}>
                        {isChecked ? '✓' : '✕'}
                      </span>
                      <span className={isChecked ? 'text-zinc-300' : 'text-zinc-600'}>
                        {feature.replace(/^✓\s*|✕\s*|✅\s*$/, '')}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button className={`w-full py-4 rounded-xl font-bold transition-all ${
                plan.highlight 
                ? 'bg-white text-black hover:bg-zinc-200' 
                : 'bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800'
              }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
