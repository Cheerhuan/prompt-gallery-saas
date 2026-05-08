'use client';
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/components/I18nProvider';
import promptsData from '@/data/prompts.json';

interface PromptEntry {
  id: string;
  title: string;
  image: string;
  full_prompt: string;
  model: string;
  _version?: string;
  _source?: string;
  _case_id?: string;
}

type TabKey = 'overview' | 'upload' | 'evoimport' | 'ghimport';

export default function AdminPanel() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [prompts, setPrompts] = useState<PromptEntry[]>(promptsData as PromptEntry[]);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const withImage = prompts.filter(p => p.image && p.image.trim() !== '');
  const withoutImage = prompts.filter(p => !p.image || p.image.trim() === '');
  const maxId = Math.max(...prompts.map(p => parseInt(p.id) || 0), 0);

  // ── Helpers ──
  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`✅ Downloaded: ${filename}`);
  };

  const promptFromStore = (id: string) => prompts.find(p => p.id === id);

  // ════════════════════════════════════════════
  // TAB 1: GALLERY OVERVIEW + EDIT / DELETE
  // ════════════════════════════════════════════
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PromptEntry | null>(null);

  const openEdit = (id: string) => {
    const p = promptFromStore(id);
    if (p) {
      setEditForm({ ...p });
      setEditingId(id);
    }
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editForm) return;
    const editPatch = {
      action: 'edit',
      entries: [editForm],
      _instructions: 'Run: node scripts/apply-admin-patch.mjs --deploy <this-file>',
    };
    downloadJSON(editPatch, `gallery-edit-${editForm.id}-${Date.now()}.json`);
    closeEdit();
  };

  const confirmDelete = (id: string) => {
    const p = promptFromStore(id);
    if (!p) return;
    if (!window.confirm(`Delete "${p.title.slice(0, 50)}" (ID: ${id})? This will download a delete patch JSON.`)) return;
    const deletePatch = { action: 'delete', ids: [id], _instructions: 'Run: node scripts/apply-admin-patch.mjs --deploy <this-file>' };
    downloadJSON(deletePatch, `gallery-delete-${id}-${Date.now()}.json`);
  };

  // ════════════════════════════════════════════
  // TAB 2: MANUAL UPLOAD
  // ════════════════════════════════════════════
  const [uploadForm, setUploadForm] = useState({
    title: '',
    prompt: '',
    model: 'GPT-Image-2',
    image: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.prompt) {
      showToast('⚠️ Title and Prompt are required');
      return;
    }
    const entry: PromptEntry = {
      id: String(maxId + 1),
      title: uploadForm.title,
      image: uploadForm.image || '',
      full_prompt: uploadForm.prompt,
      model: uploadForm.model,
      _version: new Date().toISOString().slice(0, 10),
      _source: 'admin-manual',
    };
    const patch = {
      action: 'add',
      entries: [entry],
      _instructions: 'Run: node scripts/apply-admin-patch.mjs --deploy <this-file>',
    };
    downloadJSON(patch, `gallery-add-${Date.now()}.json`);
    setUploadForm({ title: '', prompt: '', model: 'GPT-Image-2', image: '' });
    setImagePreview(null);
  };

  // ════════════════════════════════════════════
  // TAB 3: IMPORT FROM EVOLINKAI (GitHub)
  // ════════════════════════════════════════════
  const [evoCases, setEvoCases] = useState<any[]>([]);
  const [evoLoading, setEvoLoading] = useState(false);
  const [evoSelected, setEvoSelected] = useState<Set<string>>(new Set());
  const [evoStatus, setEvoStatus] = useState('');

  const CASE_FILES = {
    portrait: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/portrait.md',
    character: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/character.md',
    'ad-creative': 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/ad-creative.md',
    ecommerce: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/ecommerce.md',
    poster: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/poster.md',
    comparison: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/comparison.md',
    ui: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/ui.md',
  };

  const CATEGORY_LABELS: Record<string, string> = {
    portrait: '人像攝影', character: '角色設計', 'ad-creative': '廣告創意',
    ecommerce: '電商產品', poster: '海報插畫', comparison: '對比展示', ui: '介面設計',
  };

  const fetchEvoCases = async () => {
    setEvoLoading(true);
    setEvoStatus('Fetching from EvoLinkAI repo...');
    setEvoCases([]);
    const all: any[] = [];
    const usedIds = new Set<string>();

    for (const [cat, url] of Object.entries(CASE_FILES)) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const text = await resp.text();
        const blocks = text.split(/(?=### Case \d+:)/g);
        for (const block of blocks) {
          if (!block.startsWith('### Case')) continue;
          const titleM = block.match(/### Case \d+:\s*\[([^\]]+)\]/);
          const imgM = block.match(/src="([^"]+)"/);
          const promptM = block.match(/```\n?([\s\S]*?)```/);
          const caseNumM = block.match(/### Case (\d+):/);
          if (!titleM || !imgM || !promptM) continue;
          const caseNum = caseNumM ? parseInt(caseNumM[1]) : 0;
          const id = `${cat}-${caseNum}`;
          if (usedIds.has(id)) continue;
          usedIds.add(id);
          all.push({
            id,
            title: titleM[1].trim(),
            image: imgM[1].trim(),
            prompt: promptM[1].trim(),
            category: cat,
            categoryLabel: CATEGORY_LABELS[cat] || cat,
            caseNum,
          });
        }
      } catch (err: any) {
        setEvoStatus(prev => prev + `\n⚠️ ${cat}: ${err.message}`);
      }
    }

    setEvoCases(all);
    setEvoLoading(false);
    setEvoStatus(`✅ Found ${all.length} cases across 7 categories`);
  };

  const toggleEvoSelect = (id: string) => {
    setEvoSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllEvo = () => {
    setEvoSelected(new Set(evoCases.map(c => c.id)));
  };
  const deselectAllEvo = () => setEvoSelected(new Set());
  const selectRandomEvo = (n: number) => {
    const shuffled = [...evoCases].sort(() => Math.random() - 0.5);
    setEvoSelected(new Set(shuffled.slice(0, n).map(c => c.id)));
  };

  const downloadEvoJSON = () => {
    const selected = evoCases.filter(c => evoSelected.has(c.id));
    if (selected.length === 0) { showToast('⚠️ Select at least one case'); return; }
    const entries = selected.map((c, i) => ({
      title: `${c.title} [${c.categoryLabel}]`,
      image: c.image,
      full_prompt: c.prompt,
      model: 'GPT-Image-2',
      _version: new Date().toISOString().slice(0, 10),
      _source: 'admin-evoimport',
      _case_id: c.id,
    }));
    const patch = { action: 'add', entries, _instructions: 'Run: node scripts/apply-admin-patch.mjs --deploy <this-file>' };
    downloadJSON(patch, `gallery-evo-${Date.now()}.json`);
  };

  // ════════════════════════════════════════════
  // TAB 4: IMPORT FROM GENERIC GITHUB
  // ════════════════════════════════════════════
  const [ghForm, setGhForm] = useState({ owner: 'EvoLinkAI', repo: 'awesome-gpt-image-2-API-and-Prompts', path: 'cases/portrait.md' });
  const [ghCases, setGhCases] = useState<any[]>([]);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghSelected, setGhSelected] = useState<Set<string>>(new Set());
  const [ghStatus, setGhStatus] = useState('');

  const fetchGHCases = async () => {
    const { owner, repo, path: filePath } = ghForm;
    if (!owner || !repo || !filePath) { showToast('⚠️ Fill in owner, repo, and path'); return; }
    setGhLoading(true);
    setGhStatus(`Fetching github.com/${owner}/${repo}/${filePath}...`);
    setGhCases([]);
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      const blocks = text.split(/(?=### Case \d+:)/g);
      const cases: any[] = [];
      for (const block of blocks) {
        if (!block.startsWith('### Case')) continue;
        const titleM = block.match(/### Case \d+:\s*\[([^\]]+)\]/);
        const imgM = block.match(/src="([^"]+)"/);
        const promptM = block.match(/```\n?([\s\S]*?)```/);
        const caseNumM = block.match(/### Case (\d+):/);
        if (!titleM || !imgM || !promptM) continue;
        cases.push({
          id: `gh-${filePath.split('/').pop()}-${caseNumM ? caseNumM[1] : cases.length}`,
          title: titleM[1].trim(),
          image: imgM[1].trim(),
          prompt: promptM[1].trim(),
          caseNum: caseNumM ? parseInt(caseNumM[1]) : 0,
        });
      }
      if (cases.length === 0) {
        // Fallback: try generic markdown parsing
        const headingM = text.match(/^###\s+(.+)/gm);
        if (headingM) {
          headingM.forEach((h, i) => {
            const content = text.split('### ')[i + 1] || '';
            cases.push({
              id: `gh-${i + 1}`,
              title: h.replace('### ', '').trim(),
              image: '',
              prompt: content.trim().slice(0, 500),
              caseNum: i + 1,
            });
          });
        }
      }
      setGhCases(cases);
      setGhStatus(`✅ Found ${cases.length} entries from ${filePath}`);
    } catch (err: any) {
      setGhStatus(`❌ Error: ${err.message}`);
    }
    setGhLoading(false);
  };

  const toggleGHSelect = (id: string) => {
    setGhSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const downloadGHJSON = () => {
    const selected = ghCases.filter(c => ghSelected.has(c.id));
    if (selected.length === 0) { showToast('⚠️ Select at least one entry'); return; }
    const entries = selected.map(c => ({
      title: c.title,
      image: c.image || '',
      full_prompt: c.prompt,
      model: 'GPT-Image-2',
      _version: new Date().toISOString().slice(0, 10),
      _source: `admin-ghimport-${ghForm.owner}/${ghForm.repo}`,
    }));
    const patch = { action: 'add', entries, _instructions: 'Run: node scripts/apply-admin-patch.mjs --deploy <this-file>' };
    downloadJSON(patch, `gallery-gh-${Date.now()}.json`);
  };

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'upload', label: '✏️ Manual Add' },
    { key: 'evoimport', label: '📥 EvoLinkAI' },
    { key: 'ghimport', label: '📥 GitHub Import' },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tighter mb-2">{t('admin.pageTitle')}</h1>
          <p className="text-zinc-500 text-sm">{t('admin.pageDesc')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-zinc-800 pb-4 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl text-sm text-white animate-fade-up">
            {toast}
          </div>
        )}

        {/* ══════ TAB 1: OVERVIEW ══════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="text-3xl font-bold text-white">{prompts.length}</div>
                <div className="text-zinc-500 text-xs mt-1">Total Prompts</div>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-900/20 border border-emerald-800/30">
                <div className="text-3xl font-bold text-emerald-400">{withImage.length}</div>
                <div className="text-zinc-500 text-xs mt-1">With Images ✅</div>
              </div>
              <div className="p-5 rounded-2xl bg-amber-900/20 border border-amber-800/30">
                <div className="text-3xl font-bold text-amber-400">{withoutImage.length}</div>
                <div className="text-zinc-500 text-xs mt-1">Missing Images ⚠️</div>
              </div>
            </div>

            {/* All prompts with edit/delete */}
            <div>
              <h3 className="text-lg font-bold mb-4">All Prompts ({prompts.length})</h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {prompts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700 transition-all group">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.image && p.image.trim() !== '' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {/* Image thumb */}
                    {p.image && (
                      <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-zinc-800 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{p.title}</div>
                      <div className="text-zinc-500 text-xs truncate">{p.full_prompt.slice(0, 60)}...</div>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono flex-shrink-0 mr-2">ID:{p.id}</span>
                    {/* Actions */}
                    <button onClick={() => openEdit(p.id)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-500/20 hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100">
                      ✏️ Edit
                    </button>
                    <button onClick={() => confirmDelete(p.id)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 leading-relaxed">
              <strong className="text-zinc-300">How to apply edits:</strong><br />
              1. Click ✏️ Edit → modify fields → downloads a .json patch file<br />
              2. Tell the AI: <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">apply ~/Downloads/gallery-edit-*.json --deploy</code><br />
              3. Or run manually: <code className="text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">node scripts/apply-admin-patch.mjs --deploy ~/Downloads/gallery-edit-*.json</code>
            </div>
          </div>
        )}

        {/* ══════ TAB 2: MANUAL UPLOAD ══════ */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">✏️ Add New Prompt</h3>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Title *</label>
                  <input type="text" value={uploadForm.title}
                    onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Neon Cyberpunk Portrait" required />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Full Prompt *</label>
                  <textarea value={uploadForm.prompt}
                    onChange={e => setUploadForm({ ...uploadForm, prompt: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-28"
                    placeholder="Paste the full prompt text here..." required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Model</label>
                    <input type="text" value={uploadForm.model}
                      onChange={e => setUploadForm({ ...uploadForm, model: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Image URL</label>
                    <input type="url" value={uploadForm.image}
                      onChange={e => {
                        setUploadForm({ ...uploadForm, image: e.target.value });
                        setImagePreview(e.target.value || null);
                      }}
                      className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="https://images.pexels.com/..." />
                  </div>
                </div>

                {/* Image preview */}
                {imagePreview && (
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover"
                      onError={() => setImagePreview(null)} />
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all flex-1">
                    ⬇ Generate JSON & Download
                  </button>
                </div>
              </form>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 leading-relaxed">
              <strong className="text-zinc-300">After downloading:</strong><br />
              1. Tell me: <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">apply the gallery-add-xxx.json I just downloaded</code><br />
              2. Or run: <code className="text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">node scripts/apply-admin-patch.mjs --deploy ~/Downloads/gallery-add-*.json</code>
            </div>
          </div>
        )}

        {/* ══════ TAB 3: EVOLINKAI IMPORT ══════ */}
        {activeTab === 'evoimport' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">📥 Import from EvoLinkAI / GPT-Image-2</h3>
              <p className="text-zinc-500 text-sm mb-6">
                Fetch 415+ GPT-Image-2 prompt cases from the awesome-gpt-image-2-API-and-Prompts repo (7 categories).
                Select the ones you want and download as a ready-to-merge JSON patch.
              </p>

              <button onClick={fetchEvoCases} disabled={evoLoading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50">
                {evoLoading ? '⏳ Fetching...' : '🔄 Fetch from EvoLinkAI'}
              </button>

              {evoStatus && (
                <div className="mt-3 text-sm text-zinc-400">{evoStatus}</div>
              )}

              {/* Results */}
              {evoCases.length > 0 && (
                <>
                  {/* Bulk actions */}
                  <div className="flex items-center gap-2 mt-6 mb-4">
                    <span className="text-xs text-zinc-500 font-mono">{evoCases.length} cases</span>
                    <span className="w-px h-3 bg-zinc-800" />
                    <span className="text-xs text-zinc-500 font-mono">{evoSelected.size} selected</span>
                    <div className="flex-1" />
                    <button onClick={selectAllEvo} className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white transition-all">Select All</button>
                    <button onClick={deselectAllEvo} className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white transition-all">Deselect</button>
                    <button onClick={() => selectRandomEvo(10)} className="text-[10px] px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all">Random 10</button>
                    <button onClick={() => selectRandomEvo(5)} className="text-[10px] px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all">Random 5</button>
                    <button onClick={downloadEvoJSON} className="text-[10px] px-3 py-1 rounded bg-white text-black font-bold hover:bg-zinc-200 transition-all">⬇ Download</button>
                  </div>

                  {/* Cases grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-2">
                    {evoCases.map(c => (
                      <div key={c.id}
                        onClick={() => toggleEvoSelect(c.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          evoSelected.has(c.id)
                            ? 'bg-indigo-500/10 border-indigo-500/40'
                            : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3 h-3 rounded-full border ${evoSelected.has(c.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'}`} />
                          <span className="text-[10px] text-zinc-500 font-mono">{c.categoryLabel}</span>
                        </div>
                        <div className="text-xs text-white font-medium line-clamp-2 leading-tight">{c.title}</div>
                        <div className="text-[10px] text-zinc-600 mt-1 font-mono">Case #{c.caseNum}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══════ TAB 4: GENERIC GITHUB IMPORT ══════ */}
        {activeTab === 'ghimport' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">📥 Import from Any GitHub Repo</h3>
              <p className="text-zinc-500 text-sm mb-6">
                Enter a GitHub repository path to a markdown/.md file containing prompt cases
                and import them into the gallery.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Owner</label>
                  <input type="text" value={ghForm.owner}
                    onChange={e => setGhForm({ ...ghForm, owner: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Repo</label>
                  <input type="text" value={ghForm.repo}
                    onChange={e => setGhForm({ ...ghForm, repo: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">File Path</label>
                  <input type="text" value={ghForm.path}
                    onChange={e => setGhForm({ ...ghForm, path: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <button onClick={fetchGHCases} disabled={ghLoading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50">
                {ghLoading ? '⏳ Fetching...' : '🔍 Fetch from GitHub'}
              </button>

              {ghStatus && (
                <div className="mt-3 text-sm text-zinc-400">{ghStatus}</div>
              )}

              {/* Results */}
              {ghCases.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-6 mb-4">
                    <span className="text-xs text-zinc-500 font-mono">{ghCases.length} entries</span>
                    <span className="w-px h-3 bg-zinc-800" />
                    <span className="text-xs text-zinc-500 font-mono">{ghSelected.size} selected</span>
                    <div className="flex-1" />
                    <button onClick={() => setGhSelected(new Set(ghCases.map(c => c.id)))}
                      className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white transition-all">Select All</button>
                    <button onClick={() => setGhSelected(new Set())}
                      className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white transition-all">Deselect</button>
                    <button onClick={downloadGHJSON}
                      className="text-[10px] px-3 py-1 rounded bg-white text-black font-bold hover:bg-zinc-200 transition-all">⬇ Download</button>
                  </div>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                    {ghCases.map(c => (
                      <div key={c.id}
                        onClick={() => toggleGHSelect(c.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          ghSelected.has(c.id)
                            ? 'bg-indigo-500/10 border border-indigo-500/40'
                            : 'bg-zinc-800/30 border border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 border ${ghSelected.has(c.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium truncate">{c.title}</div>
                          <div className="text-xs text-zinc-500 truncate">{c.prompt?.slice(0, 80)}...</div>
                        </div>
                        <span className="text-[10px] text-zinc-600 font-mono">#{c.caseNum}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Preset quick buttons */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Quick Presets</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'portrait', owner: 'EvoLinkAI', repo: 'awesome-gpt-image-2-API-and-Prompts', path: 'cases/portrait.md' },
                    { label: 'character', owner: 'EvoLinkAI', repo: 'awesome-gpt-image-2-API-and-Prompts', path: 'cases/character.md' },
                    { label: 'poster', owner: 'EvoLinkAI', repo: 'awesome-gpt-image-2-API-and-Prompts', path: 'cases/poster.md' },
                    { label: 'ad-creative', owner: 'EvoLinkAI', repo: 'awesome-gpt-image-2-API-and-Prompts', path: 'cases/ad-creative.md' },
                    { label: 'ecommerce', owner: 'EvoLinkAI', repo: 'awesome-gpt-image-2-API-and-Prompts', path: 'cases/ecommerce.md' },
                    { label: 'comparison', owner: 'EvoLinkAI', repo: 'awesome-gpt-image-2-API-and-Prompts', path: 'cases/comparison.md' },
                    { label: 'ui', owner: 'EvoLinkAI', repo: 'awesome-gpt-image-2-API-and-Prompts', path: 'cases/ui.md' },
                  ].map(p => (
                    <button key={p.label}
                      onClick={() => { setGhForm(p); }}
                      className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${
                        ghForm.path === p.path
                          ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════ EDIT MODAL ══════ */}
        {editingId && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={closeEdit}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 animate-fade-up"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-6">✏️ Edit Prompt #{editingId}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Title</label>
                  <input type="text" value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Full Prompt</label>
                  <textarea value={editForm.full_prompt}
                    onChange={e => setEditForm({ ...editForm, full_prompt: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-24" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Model</label>
                    <input type="text" value={editForm.model}
                      onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Image URL</label>
                    <input type="text" value={editForm.image}
                      onChange={e => setEditForm({ ...editForm, image: e.target.value })}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                {/* Image preview */}
                {editForm.image && (
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                    <img src={editForm.image} alt="preview" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={closeEdit}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-all">
                  Cancel
                </button>
                <button onClick={saveEdit}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-all">
                  💾 Save & Download Patch
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
