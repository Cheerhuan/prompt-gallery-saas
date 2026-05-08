'use client';
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { AdminUpload } from '@/components/AdminUpload';
import promptsData from '@/data/prompts.json';

interface PromptEntry {
  id: string;
  title: string;
  image: string;
  full_prompt: string;
  model: string;
  _version?: string;
  _source?: string;
}

export default function AdminPanel() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery' | 'curator'>('gallery');
  const [prompts, setPrompts] = useState<PromptEntry[]>(promptsData as PromptEntry[]);

  const withImage = prompts.filter(p => p.image && p.image.trim() !== '');
  const withoutImage = prompts.filter(p => !p.image || p.image.trim() === '');

  // ── Gallery Manager ──
  const renderGalleryView = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="text-3xl font-bold text-white">{prompts.length}</div>
          <div className="text-zinc-500 text-sm mt-1">Total Prompts</div>
        </div>
        <div className="p-6 rounded-2xl bg-emerald-900/20 border border-emerald-800/30">
          <div className="text-3xl font-bold text-emerald-400">{withImage.length}</div>
          <div className="text-zinc-500 text-sm mt-1">With Example Images ✅</div>
        </div>
        <div className="p-6 rounded-2xl bg-amber-900/20 border border-amber-800/30">
          <div className="text-3xl font-bold text-amber-400">{withoutImage.length}</div>
          <div className="text-zinc-500 text-sm mt-1">Missing Images ⚠️</div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white">All Prompts</h3>
        <div className="space-y-2">
          {prompts.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${p.image && p.image.trim() !== '' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{p.title}</div>
                <div className="text-zinc-500 text-xs truncate">{p.full_prompt.slice(0, 80)}...</div>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono flex-shrink-0">ID: {p.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Trending Curator ──
  const [curatorCount, setCuratorCount] = useState(5);
  const [curatedEntries, setCuratedEntries] = useState<PromptEntry[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  const generateBatch = () => {
    const STYLES = [
      { style: 'Cinematic', lighting: 'Volumetric, Golden Hour', camera: '35mm, f/1.8', mood: 'Epic' },
      { style: 'Cyberpunk', lighting: 'Neon Glow, Volumetric Fog', camera: 'Wide Angle, 8K', mood: 'Gritty' },
      { style: 'Fantasy', lighting: 'Ethereal, Magical Glow', camera: 'Panoramic', mood: 'Dreamy' },
      { style: 'Minimalist', lighting: 'Soft Diffuse, Studio', camera: '85mm, Macro', mood: 'Serene' },
      { style: 'Anime', lighting: 'Cel Shaded, Soft', camera: 'Close-up', mood: 'Whimsical' },
      { style: 'Photorealistic', lighting: 'Natural, HDR', camera: '50mm, f/2.8', mood: 'Authentic' },
    ];
    const SUBJECTS = [
      'A futuristic metropolis with holographic advertisements at twilight',
      'An ancient forest spirit emerging from glowing moss-covered ruins',
      'A cyberpunk samurai on a rain-soaked rooftop overlooking neon city',
      'A hyperrealistic portrait with intricate mechanical face components',
      'A colossal dragon coiled around a crystalline mountain peak under aurora',
      'A deserted space station orbiting a dying star with floating debris',
      'A steampunk inventor workshop filled with brass gears and copper pipes',
      'An ethereal goddess made of flowing water and light in a cosmic void',
      'A post-apocalyptic city reclaimed by nature with bioluminescent vines',
      'A medieval alchemist laboratory with glowing potions and ancient manuscripts',
    ];

    const now = Date.now();
    const used = new Set<number>();
    const batch: PromptEntry[] = [];

    for (let i = 0; i < curatorCount; i++) {
      let si: number;
      do { si = Math.floor(Math.random() * SUBJECTS.length); } while (used.has(si));
      used.add(si);

      const s = STYLES[si % STYLES.length];
      const subj = SUBJECTS[si];
      const en = `${subj}, ${s.style}, ${s.lighting}, ${s.camera}, ${s.mood}, 8k, highly detailed`;
      const zh = `${subj}，${s.style}風格，${s.lighting}光影，${s.camera}鏡頭，${s.mood}氛圍，8k，極致細節`;

      batch.push({
        id: `new-${now}-${i}`,
        title: `Trending #${now.toString(36).slice(-4).toUpperCase()}-${i + 1}`,
        image: '',
        full_prompt: `${en} | ${zh}`,
        model: 'SDXL 1.0',
        _version: new Date().toISOString().slice(0, 10) + '-curated',
        _source: 'admin-curator',
      });
    }

    setCuratedEntries(batch);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(curatedEntries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trending-prompts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMsg(`✅ Downloaded ${curatedEntries.length} entries as JSON`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const renderCuratorView = () => (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h3 className="text-lg font-bold text-white mb-4">🎯 Trending Prompt Generator</h3>
        <p className="text-zinc-500 text-sm mb-6">
          Generate a batch of curated trending prompt entries with bilingual (EN/ZH) content.
          Download the JSON and merge into <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-xs">src/data/prompts.json</code>.
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <label className="text-zinc-400 text-sm">Count:</label>
          <input
            type="number"
            min={1}
            max={20}
            value={curatorCount}
            onChange={(e) => setCuratorCount(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 5)))}
            className="w-20 px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-white text-center"
          />
          <button
            onClick={generateBatch}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-500 transition-colors"
          >
            ✨ Generate
          </button>
        </div>

        {curatedEntries.length > 0 && (
          <>
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {curatedEntries.map((entry, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-white text-sm font-bold">{entry.title}</span>
                    <span className="text-[10px] text-zinc-500">{entry.model}</span>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">{entry.full_prompt}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadJSON}
                className="px-5 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"
              >
                ⬇ Download JSON
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(curatedEntries, null, 2));
                  setSuccessMsg('✅ Copied to clipboard!');
                  setTimeout(() => setSuccessMsg(''), 3000);
                }}
                className="px-5 py-2 bg-zinc-800 text-white rounded-lg text-sm font-medium border border-zinc-700 hover:bg-zinc-700 transition-colors"
              >
                📋 Copy JSON
              </button>
            </div>
          </>
        )}

        {successMsg && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 text-sm">
            {successMsg}
          </div>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h3 className="text-lg font-bold text-white mb-4">🧩 Quick Merge Instructions</h3>
        <ol className="space-y-2 text-zinc-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 font-bold">1.</span>
            <span>Generate prompts above</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 font-bold">2.</span>
            <span>Download the JSON file</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 font-bold">3.</span>
            <span>Run: <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs">node scripts/merge-prompts.mjs --input ./trending-prompts-xxx.json</code></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 font-bold">4.</span>
            <span>Verify with <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs">npm run build</code> and git push</span>
          </li>
        </ol>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-2">{t('admin.pageTitle')}</h1>
            <p className="text-zinc-500">{t('admin.pageDesc')}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-zinc-800 pb-4">
          {[
            { key: 'gallery', label: '📊 Gallery Overview' },
            { key: 'curator', label: '🎯 Trending Curator' },
            { key: 'upload', label: '📤 Manual Upload' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'gallery' && renderGalleryView()}
        {activeTab === 'curator' && renderCuratorView()}
        {activeTab === 'upload' && (
          <AdminUpload onUpload={(data) => {
            console.log('Uploading prompt:', data);
            alert('Prompt uploaded successfully! (Mock)');
          }} />
        )}
      </div>
    </div>
  );
}
