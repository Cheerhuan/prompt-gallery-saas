import React from 'react';
import { parsePrompt, promptBreakdown } from '@/lib/prompt-parser';

interface PageProps {
  params: {
    id: string;
  };
}

export default function DetailPage({ params }: PageProps) {
  const mockPrompt = {
    title: 'Cyberpunk Neon City',
    image: 'https://images.unsplash.com/photo-16051428596d?q=80&w=1000&auto=format&fit=crop',
    full_prompt: 'A futuristic neon city with flying cars, rainy streets, cinematic lighting, 8k resolution, cyberpunk style, wide angle lens',
    negative_prompt: 'blurry, distorted, low quality, watermarks',
    model: 'SDXL 1.0',
    params: { steps: 30, cfg: 7.5, seed: 4294967295 }
  };

  const breakdown = parsePrompt(mockPrompt.full_prompt);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <a href="/" className="text-zinc-500 hover:text-white transition-colors mb-8 inline-block">
          ← Back to Gallery
        </a>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image Preview */}
          <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
            <img src={mockPrompt.image} alt={mockPrompt.title} className="w-full h-auto object-cover" />
          </div>
          
          {/* Right: Details & Prompt */}
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-4xl font-bold">{mockPrompt.title}</h1>
              <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-medium border border-zinc-700">
                  {mockPrompt.model}
                </span>
              </div>
            </div>
            
            <div className="space-y-6">
              <section>
                <label className="text-zinc-500 text-sm uppercase tracking-widest mb-2 block">Full Prompt</label>
                <div className="relative group">
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 leading-relaxed">
                    {mockPrompt.full_prompt}
                  </div>
                  <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-xs px-3 py-1 rounded-md font-medium">
                    Copy
                  </button>
                </div>
              </section>

              <section>
                <label className="text-zinc-500 text-sm uppercase tracking-widest mb-2 block">Structure Breakdown</label>
                <div className="grid grid-cols-1 gap-3">
                  {promptBreakdown.map(({ label, key }) => (
                    <div key={key} className="flex items-center gap-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                      <span className="text-zinc-500 text-xs w-20">{label}</span>
                      <input 
                        className="bg-transparent border-none focus:ring-0 text-zinc-300 text-sm w-full" 
                        defaultValue={breakdown[key]}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex gap-4">
                <button className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                  Generate Similar
                </button>
                <button className="px-6 py-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-colors">
                  Save to Favorites
                </button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
