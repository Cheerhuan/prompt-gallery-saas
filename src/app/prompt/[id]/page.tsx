import React from 'react';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { PromptPlayground } from '@/components/PromptPlayground';
import { FeatureGate } from '@/components/FeatureGate';

export default function DetailPage({ params }: { params: { id: string } }) {
  const userTier = 'free'; // Mock user state
  
  const mockPrompt = {
    title: 'Cyberpunk Neon City',
    image: 'https://images.unsplash.com/photo-16051428596d?q=80&w=1000&auto=format&fit=crop',
    full_prompt: 'A futuristic neon city with flying cars, rainy streets, cinematic lighting, 8k resolution, cyberpunk style, wide angle lens',
    model: 'SDXL 1.0',
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SaaSNavbar userTier={userTier} />
      
      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        {/* Sticky Top CTA Bar */}
        <div className="fixed top-16 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3 hidden md:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-zinc-400">Prompt ID: {params.id}</span>
              <div className="w-px h-4 bg-zinc-800" />
              <span className="text-sm font-medium text-indigo-400">Model: {mockPrompt.model}</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium hover:bg-zinc-800 transition-colors">
                Copy Prompt
              </button>
              <button className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors">
                Generate Similar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-8">
          {/* Left: Image Visuals (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative group rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 aspect-[4/5]">
              <img src={mockPrompt.image} alt={mockPrompt.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold">Save to Collection</button>
                  <button className="px-4 py-2 bg-black/50 backdrop-blur-md text-white rounded-full text-xs font-medium border border-white/20">Share</button>
                </div>
              </div>
            </div>
            
            {/* Before/After - Now Gated for Pro */}
            <FeatureGate isProRequired={true} userTier={userTier}>
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-widest">Prompt Evolution</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase">Original</span>
                    <div className="aspect-square rounded-xl bg-zinc-800 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1514565131-f777f29557d1?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover opacity-50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-indigo-400 uppercase">Refined</span>
                    <div className="aspect-square rounded-xl bg-zinc-900 border-2 border-indigo-500 overflow-hidden">
                      <img src={mockPrompt.image} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            </FeatureGate>
          </div>

          {/* Right: The Playground (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tighter mb-2">{mockPrompt.title}</h1>
              <p className="text-zinc-500 text-sm">Engineered for high-fidelity cinematic realism.</p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Prompt Playground</h2>
                <span className="text-[10px] px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">v2.0 Beta</span>
              </div>
              
              {/* Playground gated for a specific part or fully for pro */}
              <PromptPlayground initialPrompt={mockPrompt.full_prompt} />
            </div>

            {/* Prompt Score - Now Gated for Pro */}
            <FeatureGate isProRequired={true} userTier={userTier}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Realism', score: 98, color: 'text-emerald-400' },
                  { label: 'Creative', score: 82, color: 'text-indigo-400' },
                  { label: 'Complexity', score: 75, color: 'text-amber-400' },
                ].map(stat => (
                  <div key={stat.label} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                    <div className={`text-xl font-bold ${stat.color}`}>{stat.score}%</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-tighter">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FeatureGate>
          </div>
        </div>
      </main>
    </div>
  );
}
