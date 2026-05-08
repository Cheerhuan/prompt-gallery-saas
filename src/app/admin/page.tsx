'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/components/I18nProvider';
import promptsData from '@/data/prompts.json';

const GH_OWNER = 'Cheerhuan';
const GH_REPO = 'prompt-gallery-saas';
const GH_PATH = 'src/data/prompts.json';
const GH_BRANCH = 'main';

interface PromptEntry {
  id: string; title: string; image: string; full_prompt: string; model: string;
  _version?: string; _source?: string; _case_id?: string;
}
type TabKey = 'overview' | 'upload' | 'evoimport' | 'ghimport';

// ── GitHub API Helpers ──
async function ghFetch(url: string, token: string, method = 'GET', body?: any) {
  const resp = await fetch(`https://api.github.com${url}`, {
    method, headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'prompt-gallery-admin',
    }, body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`GitHub API ${resp.status}: ${err.slice(0, 200)}`);
  }
  return resp.json();
}

async function getCurrentPrompts(token: string): Promise<{ data: PromptEntry[], sha: string }> {
  const resp = await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`, token);
  const content = atob(resp.content.replace(/\n/g, ''));
  return { data: JSON.parse(content), sha: resp.sha };
}

async function commitPrompts(data: PromptEntry[], sha: string, token: string, message: string) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2) + '\n')));
  const newResp = await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`, token, 'PUT', {
    message, content, sha, branch: GH_BRANCH,
  });
  return newResp;
}

async function uploadImageToRepo(file: File, token: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const imgPath = `public/images/uploads/${filename}`;
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // remove data:image/xxx;base64,
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${imgPath}`, token, 'PUT', {
    message: `feat: upload image ${filename}`,
    content: base64,
    branch: GH_BRANCH,
  });
  return `/images/uploads/${filename}`;
}

// ── Component ──
export default function AdminPanel() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [prompts, setPrompts] = useState<PromptEntry[]>(promptsData as PromptEntry[]);
  const [toast, setToast] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployMsg, setDeployMsg] = useState('');

  // GitHub token (persisted in localStorage)
  const [ghToken, setGhToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [ghConnected, setGhConnected] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gh_token');
    if (saved) { setGhToken(saved); setGhConnected(true); }
  }, []);

  const saveToken = () => {
    localStorage.setItem('gh_token', ghToken);
    setGhConnected(true);
    setShowTokenInput(false);
    showToast('✅ Token saved! Now you can deploy directly.');
  };
  const clearToken = () => {
    localStorage.removeItem('gh_token');
    setGhToken('');
    setGhConnected(false);
    showToast('Token cleared');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const withImage = prompts.filter(p => p.image && p.image.trim() !== '');
  const maxId = Math.max(...prompts.map(p => parseInt(p.id) || 0), 0);
  const promptFromStore = (id: string) => prompts.find(p => p.id === id);

  // ── Core: commit changes directly to GitHub ──
  const commitChanges = useCallback(async (newData: PromptEntry[], customMsg?: string) => {
    if (!ghToken) { showToast('⚠️ Please set your GitHub token first'); return; }
    setDeploying(true);
    setDeployMsg('Fetching current data from GitHub...');
    try {
      const { sha } = await getCurrentPrompts(ghToken);
      setDeployMsg('Committing changes...');
      const msg = customMsg || `feat: update gallery (${newData.length} prompts)`;
      await commitPrompts(newData, sha, ghToken, msg);
      setDeployMsg('✅ Committed! Deploying via GitHub Actions...');
      await new Promise(r => setTimeout(r, 1500));
      setPrompts(newData);
      showToast('✅ Changes deployed! (~2 min for CDN)');
    } catch (err: any) {
      showToast(`❌ Deploy failed: ${err.message.slice(0, 80)}`);
    }
    setDeploying(false);
  }, [ghToken]);

  // ══════ TAB 1: OVERVIEW ══════
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PromptEntry | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  const openEdit = (id: string) => {
    const p = promptFromStore(id);
    if (p) { setEditForm({ ...p }); setEditingId(id); setEditImageFile(null); }
  };
  const closeEdit = () => { setEditingId(null); setEditForm(null); setEditImageFile(null); };

  const saveEdit = async () => {
    if (!editForm) return;
    let finalImage = editForm.image;
    if (editImageFile) {
      setDeployMsg('Uploading image...');
      finalImage = await uploadImageToRepo(editImageFile, ghToken);
    }
    const updated = prompts.map(p => p.id === editingId ? { ...editForm, image: finalImage } : p);
    await commitChanges(updated, `feat: edit prompt #${editingId}`);
    closeEdit();
  };

  const confirmDelete = async (id: string) => {
    const p = promptFromStore(id);
    if (!p) return;
    if (!window.confirm(`Delete "${p.title.slice(0, 50)}"?`)) return;
    const updated = prompts.filter(p => p.id !== id);
    const name = p.title.slice(0, 40);
    await commitChanges(updated, `feat: delete prompt #${id} "${name}"`);
  };

  // ══════ TAB 2: MANUAL UPLOAD ══════
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadPrompt, setUploadPrompt] = useState('');
  const [uploadModel, setUploadModel] = useState('GPT-Image-2');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setUploadFile(file); setUploadPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadPrompt) { showToast('⚠️ Title and Prompt are required'); return; }
    if (!ghToken) { showToast('⚠️ Set GitHub token first (⚙️ in top-right)'); return; }
    setDeploying(true);
    setDeployMsg('Uploading image...');
    try {
      let imageUrl = '';
      if (uploadFile) imageUrl = await uploadImageToRepo(uploadFile, ghToken);
      const newPrompt: PromptEntry = {
        id: String(maxId + 1), title: uploadTitle, image: imageUrl,
        full_prompt: uploadPrompt, model: uploadModel,
        _version: new Date().toISOString().slice(0, 10), _source: 'admin-manual',
      };
      await commitChanges([...prompts, newPrompt], `feat: add prompt #${maxId + 1} "${uploadTitle.slice(0, 40)}"`);
      setUploadTitle(''); setUploadPrompt(''); setUploadModel('GPT-Image-2');
      setUploadFile(null); setUploadPreview(null);
    } catch (err: any) {
      showToast(`❌ ${err.message.slice(0, 80)}`);
    }
    setDeploying(false);
  };

  // ══════ TAB 3: EVOLINKAI IMPORT ══════
  const [evoCases, setEvoCases] = useState<any[]>([]);
  const [evoLoading, setEvoLoading] = useState(false);
  const [evoSelected, setEvoSelected] = useState<Set<string>>(new Set());
  const [evoStatus, setEvoStatus] = useState('');

  const CASE_FILES: Record<string, string> = {
    portrait: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/portrait.md',
    character: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/character.md',
    'ad-creative': 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/ad-creative.md',
    ecommerce: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/ecommerce.md',
    poster: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/poster.md',
    comparison: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/comparison.md',
    ui: 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/ui.md',
  };
  const CAT_LABEL: Record<string, string> = {
    portrait: '人像攝影', character: '角色設計', 'ad-creative': '廣告創意',
    ecommerce: '電商產品', poster: '海報插畫', comparison: '對比展示', ui: '介面設計',
  };

  const fetchEvoCases = async () => {
    setEvoLoading(true); setEvoStatus('Fetching...'); setEvoCases([]);
    const all: any[] = []; const usedIds = new Set<string>();
    for (const [cat, url] of Object.entries(CASE_FILES)) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const text = await resp.text();
        const blocks = text.split(/(?=### Case \d+:)/g);
        for (const block of blocks) {
          if (!block.startsWith('### Case')) continue;
          const t = block.match(/### Case \d+:\s*\[([^\]]+)\]/);
          const img = block.match(/src="([^"]+)"/);
          const p = block.match(/```\n?([\s\S]*?)```/);
          const n = block.match(/### Case (\d+):/);
          if (!t || !img || !p) continue;
          const id = `${cat}-${n ? n[1] : 0}`;
          if (usedIds.has(id)) continue; usedIds.add(id);
          all.push({ id, title: t[1].trim(), image: img[1].trim(), prompt: p[1].trim(), category: cat, catLabel: CAT_LABEL[cat] || cat, caseNum: n ? parseInt(n[1]) : 0 });
        }
      } catch (err: any) { setEvoStatus(s => s + `\n⚠️ ${cat}: ${err.message}`); }
    }
    setEvoCases(all); setEvoLoading(false); setEvoStatus(`✅ Found ${all.length} cases`);
  };

  const deployEvoSelected = async () => {
    const selected = evoCases.filter(c => evoSelected.has(c.id));
    if (!selected.length) { showToast('Select cases first'); return; }
    if (!ghToken) { showToast('Set GitHub token first'); return; }
    setDeploying(true); setDeployMsg(`Importing ${selected.length} cases...`);
    try {
      const entries: PromptEntry[] = selected.map((c, i) => ({
        id: String(maxId + i + 1), title: `${c.title} [${c.catLabel}]`, image: c.image,
        full_prompt: c.prompt, model: 'GPT-Image-2',
        _version: new Date().toISOString().slice(0, 10), _source: 'admin-evoimport', _case_id: c.id,
      }));
      await commitChanges([...prompts, ...entries], `feat: import ${entries.length} EvoLinkAI cases`);
      setEvoSelected(new Set());
    } catch (err: any) { showToast(`❌ ${err.message.slice(0, 80)}`); }
    setDeploying(false);
  };

  // ══════ TAB 4: GENERIC GITHUB IMPORT ══════
  const [ghForm, setGhForm] = useState({ owner: 'EvoLinkAI', repo: 'awesome-gpt-image-2-API-and-Prompts', path: 'cases/portrait.md' });
  const [ghCases, setGhCases] = useState<any[]>([]);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghSelected, setGhSelected] = useState<Set<string>>(new Set());
  const [ghStatus, setGhStatus] = useState('');

  const fetchGHCases = async () => {
    const { owner, repo, path } = ghForm;
    if (!owner || !repo || !path) return;
    setGhLoading(true); setGhStatus(`Fetching ${owner}/${repo}/${path}...`);
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      const blocks = text.split(/(?=### Case \d+:)/g);
      const cases: any[] = [];
      for (const block of blocks) {
        if (!block.startsWith('### Case')) continue;
        const t = block.match(/### Case \d+:\s*\[([^\]]+)\]/);
        const img = block.match(/src="([^"]+)"/);
        const p = block.match(/```\n?([\s\S]*?)```/);
        const n = block.match(/### Case (\d+):/);
        if (!t || !img || !p) continue;
        cases.push({ id: `gh-${n ? n[1] : cases.length}`, title: t[1].trim(), image: img[1].trim(), prompt: p[1].trim(), caseNum: n ? parseInt(n[1]) : 0 });
      }
      if (!cases.length) {
        const headings = text.match(/^###\s+(.+)/gm);
        if (headings) headings.forEach((h, i) => {
          const content = text.split('### ')[i + 1] || '';
          cases.push({ id: `gh-${i + 1}`, title: h.replace('### ', '').trim(), image: '', prompt: content.trim().slice(0, 500), caseNum: i + 1 });
        });
      }
      setGhCases(cases); setGhStatus(`✅ ${cases.length} entries`);
    } catch (err: any) { setGhStatus(`❌ ${err.message}`); }
    setGhLoading(false);
  };

  const deployGHSelected = async () => {
    const selected = ghCases.filter(c => ghSelected.has(c.id));
    if (!selected.length) { showToast('Select entries first'); return; }
    if (!ghToken) { showToast('Set GitHub token first'); return; }
    setDeploying(true); setDeployMsg(`Importing ${selected.length} entries...`);
    try {
      const entries: PromptEntry[] = selected.map((c, i) => ({
        id: String(maxId + i + 1), title: c.title, image: c.image || '',
        full_prompt: c.prompt, model: 'GPT-Image-2',
        _version: new Date().toISOString().slice(0, 10), _source: `admin-ghimport-${ghForm.owner}/${ghForm.repo}`,
      }));
      await commitChanges([...prompts, ...entries], `feat: import ${entries.length} entries from ${ghForm.owner}/${ghForm.repo}`);
      setGhSelected(new Set());
    } catch (err: any) { showToast(`❌ ${err.message.slice(0, 80)}`); }
    setDeploying(false);
  };

  // ══════ RENDER ══════
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'upload', label: '✏️ New Prompt' },
    { key: 'evoimport', label: '📥 EvoLinkAI' },
    { key: 'ghimport', label: '📥 GitHub Import' },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header + Token */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter">{t('admin.pageTitle')}</h1>
            <p className="text-zinc-500 text-sm mt-1">{t('admin.pageDesc')}</p>
          </div>
          <div className="flex items-center gap-2">
            {ghConnected ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                GitHub Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                No Token
              </span>
            )}
            <button onClick={() => setShowTokenInput(!showTokenInput)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-[10px] font-bold hover:text-white transition-all">⚙️</button>
          </div>
        </div>

        {/* Token input (collapsible) */}
        {showTokenInput && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-2">GitHub Personal Access Token (repo scope)</label>
            <div className="flex gap-2">
              <input type="password" value={ghToken} onChange={e => setGhToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="flex-1 px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
              <button onClick={saveToken} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-all">Save</button>
              {ghToken && <button onClick={clearToken} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-all">Clear</button>}
            </div>
            <p className="text-[10px] text-zinc-600 mt-2">Token is stored in your browser (localStorage). Needed to commit directly to GitHub.</p>
          </div>
        )}

        {/* Deploy overlay */}
        {deploying && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center animate-fade-up">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl animate-spin">⚡</span>
              </div>
              <p className="text-white font-bold mb-2">Deploying...</p>
              <p className="text-zinc-400 text-sm">{deployMsg}</p>
              <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Tab Nav */}
        <div className="flex gap-2 border-b border-zinc-800 pb-4 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.key ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>{t.label}</button>
          ))}
        </div>

        {/* Toast */}
        {toast && <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl text-sm text-white animate-fade-up">{toast}</div>}

        {/* ══════ TAB 1: OVERVIEW ══════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="text-3xl font-bold">{prompts.length}</div>
                <div className="text-zinc-500 text-xs mt-1">Total Prompts</div>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-900/20 border border-emerald-800/30">
                <div className="text-3xl font-bold text-emerald-400">{withImage.length}</div>
                <div className="text-zinc-500 text-xs mt-1">With Images ✅</div>
              </div>
              <div className="p-5 rounded-2xl bg-indigo-900/20 border border-indigo-800/30">
                <div className="text-3xl font-bold text-indigo-400">{maxId}</div>
                <div className="text-zinc-500 text-xs mt-1">Next ID</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">All Prompts ({prompts.length})</h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {prompts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700 transition-all group">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.image ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-zinc-800 flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.title}</div>
                      <div className="text-zinc-500 text-xs truncate">{p.full_prompt.slice(0, 60)}...</div>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono flex-shrink-0 mr-1">ID:{p.id}</span>
                    <button onClick={() => openEdit(p.id)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-500/20 hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100">✏️ Edit</button>
                    <button onClick={() => confirmDelete(p.id)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════ TAB 2: NEW PROMPT (File Upload + Paste) ══════ */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">✏️ New Prompt</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Drag & drop file upload */}
                <div
                  onDragOver={e => e.preventDefault()} onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${uploadPreview ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/20'}`}
                  onClick={() => document.getElementById('img-upload')?.click()}
                >
                  <input id="img-upload" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  {uploadPreview ? (
                    <div className="space-y-2">
                      <img src={uploadPreview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                      <p className="text-xs text-zinc-500">{uploadFile?.name} (click to change)</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-3xl block">🖼️</span>
                      <p className="text-sm text-zinc-400">Drop image here or <span className="text-indigo-400 underline">click to upload</span></p>
                      <p className="text-[10px] text-zinc-600">Image will be uploaded to repo automatically</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Title</label>
                  <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Neon Cyberpunk Portrait" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Prompt</label>
                  <textarea value={uploadPrompt} onChange={e => setUploadPrompt(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-28"
                    placeholder="Paste the full prompt text here..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Model</label>
                    <input type="text" value={uploadModel} onChange={e => setUploadModel(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
                <button type="submit" disabled={deploying}
                  className="w-full px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all disabled:opacity-50">
                  {deploying ? '🚀 Deploying...' : '🚀 Add & Deploy'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ══════ TAB 3: EVOLINKAI ══════ */}
        {activeTab === 'evoimport' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">📥 Import from EvoLinkAI</h3>
              <p className="text-zinc-500 text-sm mb-6">Fetch 415+ GPT-Image-2 cases (7 categories), select what you want, deploy directly.</p>
              <button onClick={fetchEvoCases} disabled={evoLoading}
                className="px-6 py-3 bg-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50">
                {evoLoading ? '⏳ Fetching...' : '🔄 Fetch Cases'}
              </button>
              {evoStatus && <div className="mt-3 text-sm text-zinc-400">{evoStatus}</div>}
              {evoCases.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-6 mb-4 flex-wrap">
                    <span className="text-xs text-zinc-500 font-mono">{evoCases.length} cases</span>
                    <span className="text-xs text-zinc-500 font-mono">{evoSelected.size} selected</span>
                    <div className="flex-1 min-w-4" />
                    <button onClick={() => setEvoSelected(new Set(evoCases.map(c => c.id)))} className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white">All</button>
                    <button onClick={() => setEvoSelected(new Set())} className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white">None</button>
                    <button onClick={() => { const s = [...evoCases].sort(() => Math.random() - 0.5).slice(0, 10); setEvoSelected(new Set(s.map(c => c.id))); }} className="text-[10px] px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30">Random 10</button>
                    <button onClick={deployEvoSelected} disabled={!evoSelected.size || deploying}
                      className="text-xs px-4 py-1.5 rounded bg-white text-black font-bold hover:bg-zinc-200 transition-all disabled:opacity-50">
                      🚀 Deploy {evoSelected.size} selected
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-2">
                    {evoCases.map(c => (
                      <div key={c.id} onClick={() => {
                        setEvoSelected(p => { const n = new Set(p); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; });
                      }} className={`p-3 rounded-xl border cursor-pointer transition-all ${evoSelected.has(c.id) ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-600'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3 h-3 rounded-full border ${evoSelected.has(c.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'}`} />
                          <span className="text-[10px] text-zinc-500 font-mono">{c.catLabel}</span>
                        </div>
                        <div className="text-xs text-white font-medium line-clamp-2 leading-tight">{c.title}</div>
                        <div className="text-[10px] text-zinc-600 mt-1 font-mono">#{c.caseNum}</div>
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
              <h3 className="text-lg font-bold mb-4">📥 Import from GitHub Repo</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Owner</label>
                  <input type="text" value={ghForm.owner} onChange={e => setGhForm({ ...ghForm, owner: e.target.value })} className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Repo</label>
                  <input type="text" value={ghForm.repo} onChange={e => setGhForm({ ...ghForm, repo: e.target.value })} className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">File Path</label>
                  <input type="text" value={ghForm.path} onChange={e => setGhForm({ ...ghForm, path: e.target.value })} className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div className="flex gap-2 flex-wrap mb-4">
                {[['portrait','cases/portrait.md'],['character','cases/character.md'],['poster','cases/poster.md'],['ad-creative','cases/ad-creative.md'],['ecommerce','cases/ecommerce.md'],['comparison','cases/comparison.md'],['ui','cases/ui.md']].map(([label, path]) => (
                  <button key={label} onClick={() => setGhForm({ ...ghForm, path })}
                    className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${ghForm.path === path ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white'}`}>{label}</button>
                ))}
              </div>
              <button onClick={fetchGHCases} disabled={ghLoading} className="px-6 py-3 bg-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50">
                {ghLoading ? '⏳ Fetching...' : '🔍 Fetch'}
              </button>
              {ghStatus && <div className="mt-3 text-sm text-zinc-400">{ghStatus}</div>}
              {ghCases.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-6 mb-4">
                    <span className="text-xs text-zinc-500 font-mono">{ghCases.length} entries</span>
                    <span className="text-xs text-zinc-500 font-mono">{ghSelected.size} selected</span>
                    <div className="flex-1" />
                    <button onClick={() => setGhSelected(new Set(ghCases.map(c => c.id)))} className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white">All</button>
                    <button onClick={() => setGhSelected(new Set())} className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white">None</button>
                    <button onClick={deployGHSelected} disabled={!ghSelected.size || deploying}
                      className="text-xs px-4 py-1.5 rounded bg-white text-black font-bold hover:bg-zinc-200 transition-all disabled:opacity-50">🚀 Deploy {ghSelected.size}</button>
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                    {ghCases.map(c => (
                      <div key={c.id} onClick={() => { setGhSelected(p => { const n = new Set(p); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; }); }}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${ghSelected.has(c.id) ? 'bg-indigo-500/10 border border-indigo-500/40' : 'bg-zinc-800/30 border border-zinc-800 hover:border-zinc-600'}`}>
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 border ${ghSelected.has(c.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'}`} />
                        <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{c.title}</div><div className="text-xs text-zinc-500 truncate">{c.prompt?.slice(0, 80)}...</div></div>
                        <span className="text-[10px] text-zinc-600 font-mono">#{c.caseNum}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══════ EDIT MODAL ══════ */}
        {editingId && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeEdit}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 animate-fade-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-6">✏️ Edit Prompt #{editingId}</h3>
              <div className="space-y-4">
                {/* Image upload for edit */}
                <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) { setEditImageFile(f); setEditForm(p => p ? { ...p, image: URL.createObjectURL(f) } : null); }}}
                  onClick={() => document.getElementById('edit-img-upload')?.click()}
                  className="border-2 border-dashed border-zinc-700 rounded-xl p-4 text-center cursor-pointer hover:border-zinc-500 transition-all">
                  <input id="edit-img-upload" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setEditImageFile(f); setEditForm(p => p ? { ...p, image: URL.createObjectURL(f) } : null); }}} />
                  {editForm.image ? (
                    <div><img src={editForm.image} alt="" className="max-h-28 mx-auto rounded-lg object-contain" /><p className="text-[10px] text-zinc-500 mt-1">Drop new image or click to replace</p></div>
                  ) : <span className="text-sm text-zinc-400">🖼️ Click to upload image</span>}
                </div>
                <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Title</label>
                  <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Full Prompt</label>
                  <textarea value={editForm.full_prompt} onChange={e => setEditForm({ ...editForm, full_prompt: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-20" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Model</label>
                    <input type="text" value={editForm.model} onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={closeEdit} className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={saveEdit} disabled={deploying}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-all disabled:opacity-50">
                  {deploying ? '⏳ Deploying...' : '🚀 Save & Deploy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
