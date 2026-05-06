import React from 'react';
import { SaaSNavbar } from '@/components/SaaSNavbar';

const PLANS = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for beginners exploring AI art.',
    features: [
      '✓ 10 Generation Credits / mo',
      '✓ Basic Prompt Gallery Access',
      '✓ Community Support',
      '✕ Advanced Prompt Breakdown',
      '✕ HD Image Export',
      '✕ Priority Queue',
    ],
    cta: 'Current Plan',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '5',
    description: 'For power users and prompt engineers.',
    features: [
      '✓ Unlimited Generation Credits',
      '✓ Full Prompt Playground Access',
      '✓ HD Image Export (4K)',
      '✓ Priority API Queue',
      '✓ Private Collections',
      '✓ Early Access to New Models',
    ],
    cta: 'Upgrade Now',
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SaaSNavbar />
      
      <main className="pt-32 pb-20 px-4 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 mb-6">
          <span>Simple, transparent pricing</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          Unlock Your Creative Potential
        </h1>
        <p className="text-zinc-400 text-lg mb-16 max-w-2xl mx-auto">
          Choose the plan that fits your workflow. Scale your AI art production with professional tools.
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
                  Most Popular
                </div>
              )}
              
              <div className="mb-8 text-left">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-zinc-500 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1 justify-center md:justify-start">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-zinc-500 text-sm">/month</span>
              </div>

              <div className="space-y-4 mb-10 text-left">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <span className={feature.startsWith('✓') ? 'text-indigo-400' : 'text-zinc-600'}>
                      {feature.startsWith('✓') ? '✓' : '✕'}
                    </span>
                    <span className={feature.startsWith('✓') ? 'text-zinc-300' : 'text-zinc-600'}>
                      {feature.replace(/^✓\s*|✕\s*/, '')}
                    </span>
                  </div>
                ))}
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
