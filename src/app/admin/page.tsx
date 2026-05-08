'use client';
import React, { useState, useCallback } from 'react';
import { useI18n } from '@/components/I18nProvider';
import promptsData from '@/data/prompts.json';

const GH_RAW = 'https://raw.githubusercontent.com/Cheerhuan/prompt-gallery-saas/main';
const PROJ = '/Users/xiebinghuan/rescue_build';

interface PromptEntry {
  id: string; title: string; image: string; full_prompt: string; model: string;
  _version?: string; _source?: string; _case_id?: string;
}
type TabKey = 'overview' | 'upload' | 'evoimport' | 'ghimport' | 'mobile';

// ── Shell command generator ──
function genScript(body: string, commitMsg: string): string {
  const safe = commitMsg.replace(/'/g, "'\\''");
  return [
    `# ── Copy the line below, paste into Terminal, press Enter ──`,
    `cd ${PROJ} && git pull origin main && \\`,
    `node -e '${body.replace(/'/g, "'\\''").replace(/\n/g, '\\n')}' && \\`,
    `npm run build && \\`,
    `git add -A && git commit -m "${safe}" && git push origin main`,
    `# ✅ Done! Check https://cheerhuan.github.io/prompt-gallery-saas/ in ~2 min`,
  ].join('\n');
}

function genAddScript(entries: PromptEntry[], msg: string): string {
  const json = JSON.stringify(entries);
  const body = `const fs=require("fs");const p=JSON.parse(fs.readFileSync("src/data/prompts.json","utf8"));const n=${json};let m=Math.max(...p.map(x=>parseInt(x.id)||0),0);n.forEach((e,i)=>{e.id=String(m+i+1)});p.push(...n);fs.writeFileSync("src/data/prompts.json",JSON.stringify(p,null,2)+"\\n");console.log("✅ Added "+n.length+" prompts, total: "+p.length)`;
  return genScript(body, msg);
}

function genEditScript(id: string, fields: Partial<PromptEntry>, msg: string): string {
  const f = JSON.stringify(fields);
  const body = `const fs=require("fs");const p=JSON.parse(fs.readFileSync("src/data/prompts.json","utf8"));const idx=p.findIndex(x=>x.id===${JSON.stringify(id)});if(idx>-1){Object.assign(p[idx],${f});fs.writeFileSync("src/data/prompts.json",JSON.stringify(p,null,2)+"\\n");console.log("✅ Edited prompt #"+id)}else{console.log("❌ Prompt #"+id+" not found")}`;
  return genScript(body, msg);
}

function genDeleteScript(ids: string[], msg: string): string {
  const idsJson = JSON.stringify(ids);
  const body = `const fs=require("fs");const p=JSON.parse(fs.readFileSync("src/data/prompts.json","utf8"));const ids=${idsJson};const f=p.filter(x=>!ids.includes(x.id));fs.writeFileSync("src/data/prompts.json",JSON.stringify(f,null,2)+"\\n");console.log("✅ Deleted "+ids.length+" prompts, remaining: "+f.length)`;
  return genScript(body, msg);
}

function genImageScript(b64: string, filename: string): string {
  const body = `const fs=require("fs");const b="${b64}";const buf=Buffer.from(b,"base64");fs.writeFileSync("public/images/uploads/${filename}",buf);console.log("✅ Image saved: public/images/uploads/${filename}")`;
  return body;
}

// ── Component ──
export default function AdminPanel() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [prompts, setPrompts] = useState<PromptEntry[]>(promptsData as PromptEntry[]);
  const [toast, setToast] = useState('');
  const [shellCmd, setShellCmd] = useState('');
  const [copied, setCopied] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const maxId = Math.max(...prompts.map(p => parseInt(p.id) || 0), 0);
  const promptFromStore = (id: string) => prompts.find(p => p.id === id);

  const withImage = prompts.filter(p => p.image && p.image.trim() !== '');
  const withoutImage = prompts.filter(p => !p.image || p.image.trim() === '');

  // ── Helper: Show command + copy ──
  const showCommand = (cmd: string) => {
    setShellCmd(cmd);
    setCopied(false);
    // Auto-scroll to command block
    setTimeout(() => {
      document.getElementById('cmd-block')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(shellCmd);
      setCopied(true);
      showToast('✅ Command copied! Paste in Terminal and press Enter.');
    } catch {
      // Fallback: select text manually
      const el = document.getElementById('cmd-text');
      if (el) { const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(el); sel?.removeAllRanges(); sel?.addRange(range); }
    }
  };

  // ══════ TAB 1: OVERVIEW ══════
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PromptEntry | null>(null);
  const [editImageB64, setEditImageB64] = useState<string | null>(null);

  const openEdit = (id: string) => {
    const p = promptFromStore(id);
    if (p) { setEditForm({ ...p }); setEditingId(id); setEditImageB64(null); }
  };
  const closeEdit = () => { setEditingId(null); setEditForm(null); setEditImageB64(null); };

  const handleEditFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1];
      setEditImageB64(b64);
      setEditForm(p => p ? { ...p, image: URL.createObjectURL(f) } : null);
    };
    reader.readAsDataURL(f);
  };

  const saveEdit = () => {
    if (!editForm) return;
    let cmd = '';
    const ts = Date.now();
    if (editImageB64) {
      const ext = 'png';
      const filename = `upload-${ts}.${ext}`;
      const imgPath = `/images/uploads/${filename}`;
      const imgScript = genImageScript(editImageB64, filename);
      const editScript = genEditScript(editingId!, { ...editForm, image: imgPath }, `feat: edit prompt #${editingId} [${editForm.title.slice(0, 30)}]`);
      cmd = imgScript + '\n' + editScript;
    } else {
      cmd = genEditScript(editingId!, editForm, `feat: edit prompt #${editingId} [${editForm.title.slice(0, 30)}]`);
    }
    showCommand(cmd);
    closeEdit();
  };

  const confirmDelete = (id: string) => {
    const p = promptFromStore(id);
    if (!p || !window.confirm(`Delete "${p.title.slice(0, 50)}"?`)) return;
    showCommand(genDeleteScript([id], `feat: delete prompt #${id}`));
  };

  // ══════ TAB 2: MANUAL UPLOAD (file + paste) ══════
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadPrompt, setUploadPrompt] = useState('');
  const [uploadModel, setUploadModel] = useState('GPT-Image-2');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadPrompt) { showToast('⚠️ Title and Prompt required'); return; }
    const ts = Date.now();
    const entry: PromptEntry = {
      id: String(maxId + 1), title: uploadTitle, image: '',
      full_prompt: uploadPrompt, model: uploadModel,
      _version: new Date().toISOString().slice(0, 10), _source: 'admin-manual',
    };

    let cmd = '';
    if (uploadFile) {
      const ext = uploadFile.name.split('.').pop() || 'png';
      const filename = `upload-${ts}.${ext}`;
      entry.image = `/images/uploads/${filename}`;
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = (reader.result as string).split(',')[1];
        const imgCmd = genImageScript(b64, filename);
        const addCmd = genAddScript([entry], `feat: add prompt "${uploadTitle.slice(0, 40)}"`);
        showCommand(imgCmd + '\n' + addCmd);
      };
      reader.readAsDataURL(uploadFile);
      return;
    }

    cmd = genAddScript([entry], `feat: add prompt "${uploadTitle.slice(0, 40)}"`);
    showCommand(cmd);
    setUploadTitle(''); setUploadPrompt(''); setUploadModel('GPT-Image-2');
    setUploadFile(null); setUploadPreview(null);
  };

  // ══════ TAB 3: EVOLINKAI ══════
  const [evoCases, setEvoCases] = useState<any[]>([]);
  const [evoLoading, setEvoLoading] = useState(false);
  const [evoSelected, setEvoSelected] = useState<Set<string>>(new Set());
  const [evoStatus, setEvoStatus] = useState('');

  const CASE_FILES: Record<string, string> = { portrait: `${GH_RAW}/cases/portrait.md`, character: `${GH_RAW}/cases/character.md`, 'ad-creative': `${GH_RAW}/cases/ad-creative.md`, ecommerce: `${GH_RAW}/cases/ecommerce.md`, poster: `${GH_RAW}/cases/poster.md`, comparison: `${GH_RAW}/cases/comparison.md`, ui: `${GH_RAW}/cases/ui.md` };
  const CAT_LABEL: Record<string, string> = { portrait: '人像攝影', character: '角色設計', 'ad-creative': '廣告創意', ecommerce: '電商產品', poster: '海報插畫', comparison: '對比展示', ui: '介面設計' };

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
    setEvoCases(all); setEvoLoading(false); setEvoStatus(`✅ ${all.length} cases`);
  };

  const deployEvoSelected = () => {
    const selected = evoCases.filter(c => evoSelected.has(c.id));
    if (!selected.length) { showToast('Select cases first'); return; }
    const entries: PromptEntry[] = selected.map((c, i) => ({
      id: String(maxId + i + 1), title: `${c.title} [${c.catLabel}]`, image: c.image,
      full_prompt: c.prompt, model: 'GPT-Image-2',
      _version: new Date().toISOString().slice(0, 10), _source: 'admin-evoimport', _case_id: c.id,
    }));
    showCommand(genAddScript(entries, `feat: import ${entries.length} EvoLinkAI cases`));
    setEvoSelected(new Set());
  };

  // ══════ TAB 4: GENERIC GITHUB IMPORT ══════
  const [ghForm, setGhForm] = useState({ owner: 'Cheerhuan', repo: 'prompt-gallery-saas', path: 'src/data/prompts.json' });
  const [ghCases, setGhCases] = useState<any[]>([]);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghSelected, setGhSelected] = useState<Set<string>>(new Set());
  const [ghStatus, setGhStatus] = useState('');

  const fetchGHCases = async () => {
    const { owner, repo, path } = ghForm;
    if (!owner || !repo || !path) return;
    setGhLoading(true); setGhStatus(`Fetching ${owner}/${repo}/${path}...`);
    try {
      const resp = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`);
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

  const deployGHSelected = () => {
    const selected = ghCases.filter(c => ghSelected.has(c.id));
    if (!selected.length) { showToast('Select entries first'); return; }
    const entries: PromptEntry[] = selected.map((c, i) => ({
      id: String(maxId + i + 1), title: c.title, image: c.image || '',
      full_prompt: c.prompt, model: 'GPT-Image-2',
      _version: new Date().toISOString().slice(0, 10), _source: `admin-ghimport-${ghForm.owner}/${ghForm.repo}`,
    }));
    showCommand(genAddScript(entries, `feat: import ${entries.length} from ${ghForm.owner}/${ghForm.repo}`));
    setGhSelected(new Set());
  };

  // ══════ RENDER ══════
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'upload', label: '✏️ New Prompt' },
    { key: 'evoimport', label: '📥 EvoLinkAI' },
    { key: 'ghimport', label: '📥 GitHub Import' },
    { key: 'mobile', label: '📱 Mobile' },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter">{t('admin.pageTitle')}</h1>
            <p className="text-zinc-500 text-sm mt-1">{t('admin.pageDesc')} — no AI needed 🚀</p>
          </div>
          <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            Copy → Terminal → Enter
          </span>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-2 border-b border-zinc-800 pb-4 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.key ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>{t.label}</button>
          ))}
        </div>

        {/* Toast */}
        {toast && <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl text-sm animate-fade-up">{toast}</div>}

        {/* ══════ COMMAND OUTPUT ══════ */}
        {shellCmd && (
          <div id="cmd-block" className="mb-8 p-5 rounded-2xl bg-zinc-900 border border-indigo-500/30 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-indigo-400">🚀 Copy this command → paste in Terminal</h3>
              <button onClick={copyCommand}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'}`}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
            <pre id="cmd-text" className="text-xs text-zinc-300 bg-black rounded-xl p-4 overflow-x-auto leading-relaxed select-all whitespace-pre-wrap font-mono"
              style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {shellCmd}
            </pre>
            <p className="text-[10px] text-zinc-600 mt-2">
              Open Terminal.app (Cmd+Space → "Terminal"), paste the command, press Enter.
              Git creds in your Terminal handle authentication automatically.
            </p>
          </div>
        )}

        {/* ══════ TAB 1: OVERVIEW ══════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="text-3xl font-bold">{prompts.length}</div>
                <div className="text-zinc-500 text-xs mt-1">Total</div>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-900/20 border border-emerald-800/30">
                <div className="text-3xl font-bold text-emerald-400">{withImage.length}</div>
                <div className="text-zinc-500 text-xs mt-1">With Image ✅</div>
              </div>
              <div className="p-5 rounded-2xl bg-amber-900/20 border border-amber-800/30">
                <div className="text-3xl font-bold text-amber-400">{withoutImage.length}</div>
                <div className="text-zinc-500 text-xs mt-1">No Image</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">All Prompts ({prompts.length})</h3>
              <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-2">
                {prompts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700 transition-all group">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.image ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {p.image && <img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover bg-zinc-800 flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.title}</div>
                      <div className="text-zinc-500 text-xs truncate">{p.full_prompt.slice(0, 50)}...</div>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono flex-shrink-0 mr-1">#{p.id}</span>
                    <button onClick={() => openEdit(p.id)} className="px-2.5 py-1 rounded-lg bg-zinc-800/50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-500/20 hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100">✏️</button>
                    <button onClick={() => confirmDelete(p.id)} className="px-2.5 py-1 rounded-lg bg-zinc-800/50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════ TAB 2: NEW PROMPT ══════ */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">✏️ New Prompt</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image upload area */}
                <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) { setUploadFile(f); setUploadPreview(URL.createObjectURL(f)); } }}
                  onClick={() => document.getElementById('img-input')?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${uploadPreview ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/20'}`}>
                  <input id="img-input" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setUploadFile(f); setUploadPreview(URL.createObjectURL(f)); }}} />
                  {uploadPreview ? (
                    <div><img src={uploadPreview} alt="" className="max-h-40 mx-auto rounded-lg object-contain" /><p className="text-xs text-zinc-500 mt-1">{uploadFile?.name}</p></div>
                  ) : (
                    <div className="space-y-2"><span className="text-3xl block">🖼️</span><p className="text-sm text-zinc-400">Drop image or <span className="text-indigo-400 underline">click</span></p><p className="text-[10px] text-zinc-600">Stored in repo as <code className="text-indigo-400">public/images/uploads/</code></p></div>
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
                <button type="submit" className="w-full px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all">
                  🚀 Generate Command
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ══════ TAB 3: EVOLINKAI ══════ */}
        {activeTab === 'evoimport' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">📥 EvoLinkAI Import</h3>
              <p className="text-zinc-500 text-sm mb-6">Fetch GPT-Image-2 cases, select, get a Terminal command.</p>
              <button onClick={fetchEvoCases} disabled={evoLoading}
                className="px-6 py-3 bg-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50">
                {evoLoading ? '⏳ Fetching...' : '🔄 Fetch'}
              </button>
              {evoStatus && <div className="mt-3 text-sm text-zinc-400">{evoStatus}</div>}
              {evoCases.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-6 mb-4 flex-wrap">
                    <span className="text-xs font-mono text-zinc-500">{evoCases.length} cases</span>
                    <span className="text-xs font-mono text-zinc-500">{evoSelected.size} selected</span>
                    <div className="flex-1 min-w-4" />
                    <button onClick={() => setEvoSelected(new Set(evoCases.map(c => c.id)))} className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white">All</button>
                    <button onClick={() => setEvoSelected(new Set())} className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white">None</button>
                    <button onClick={() => { const s = [...evoCases].sort(() => Math.random() - 0.5).slice(0, 10); setEvoSelected(new Set(s.map(c => c.id))); }} className="text-[10px] px-2 py-1 rounded bg-indigo-500/20 text-indigo-400">Random 10</button>
                    <button onClick={() => { const s = [...evoCases].sort(() => Math.random() - 0.5).slice(0, 5); setEvoSelected(new Set(s.map(c => c.id))); }} className="text-[10px] px-2 py-1 rounded bg-indigo-500/20 text-indigo-400">Random 5</button>
                    <button onClick={deployEvoSelected} disabled={!evoSelected.size}
                      className="text-xs px-4 py-1.5 rounded bg-white text-black font-bold hover:bg-zinc-200 transition-all">🚀 Gen Cmd</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[45vh] overflow-y-auto pr-2">
                    {evoCases.map(c => (
                      <div key={c.id} onClick={() => { setEvoSelected(p => { const n = new Set(p); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; }); }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${evoSelected.has(c.id) ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-600'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-2.5 h-2.5 rounded-full border ${evoSelected.has(c.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'}`} />
                          <span className="text-[9px] text-zinc-500 font-mono">{c.catLabel}</span>
                        </div>
                        <div className="text-xs font-medium line-clamp-2 leading-tight">{c.title}</div>
                        <div className="text-[9px] text-zinc-600 mt-0.5 font-mono">#{c.caseNum}</div>
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
              <h3 className="text-lg font-bold mb-4">📥 GitHub Repo Import</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Owner</label>
                  <input type="text" value={ghForm.owner} onChange={e => setGhForm({ ...ghForm, owner: e.target.value })} className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Repo</label>
                  <input type="text" value={ghForm.repo} onChange={e => setGhForm({ ...ghForm, repo: e.target.value })} className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">File Path</label>
                  <input type="text" value={ghForm.path} onChange={e => setGhForm({ ...ghForm, path: e.target.value })} className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div className="flex gap-2 flex-wrap mb-4">
                {[['portrait','cases/portrait.md'],['character','cases/character.md'],['poster','cases/poster.md'],['ad-creative','cases/ad-creative.md'],['ecommerce','cases/ecommerce.md'],['comparison','cases/comparison.md'],['ui','cases/ui.md']].map(([l,p]) => (
                  <button key={l} onClick={() => setGhForm({ ...ghForm, path: p })}
                    className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${ghForm.path === p ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white'}`}>{l}</button>
                ))}
              </div>
              <button onClick={fetchGHCases} disabled={ghLoading} className="px-6 py-3 bg-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50">
                {ghLoading ? '⏳ Fetching...' : '🔍 Fetch'}
              </button>
              {ghStatus && <div className="mt-3 text-sm text-zinc-400">{ghStatus}</div>}
              {ghCases.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-6 mb-4">
                    <span className="text-xs text-zinc-500 font-mono">{ghCases.length}</span>
                    <span className="text-xs text-zinc-500 font-mono">{ghSelected.size} selected</span>
                    <div className="flex-1" />
                    <button onClick={() => setGhSelected(new Set(ghCases.map(c => c.id)))} className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white">All</button>
                    <button onClick={() => setGhSelected(new Set())} className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white">None</button>
                    <button onClick={deployGHSelected} disabled={!ghSelected.size}
                      className="text-xs px-4 py-1.5 rounded bg-white text-black font-bold hover:bg-zinc-200 transition-all">🚀 Gen Cmd</button>
                  </div>
                  <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-2">
                    {ghCases.map(c => (
                      <div key={c.id} onClick={() => { setGhSelected(p => { const n = new Set(p); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; }); }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${ghSelected.has(c.id) ? 'bg-indigo-500/10 border border-indigo-500/40' : 'bg-zinc-800/30 border border-zinc-800 hover:border-zinc-600'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border ${ghSelected.has(c.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'}`} />
                        <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{c.title}</div><div className="text-xs text-zinc-500 truncate">{c.prompt?.slice(0, 70)}...</div></div>
                        <span className="text-[10px] text-zinc-600 font-mono">#{c.caseNum}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══════ TAB 5: MOBILE ══════ */}
        {activeTab === 'mobile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-lg font-bold mb-4">📱 Mobile — Add Prompts from Your Phone</h3>
              <p className="text-zinc-400 text-sm mb-6">No Terminal needed. Works on any phone browser.</p>

              <div className="space-y-6">
                {/* Method 1: GitHub Actions (recommended) */}
                <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🚀</span>
                    <span className="text-sm font-bold text-indigo-300">Method 1: GitHub Actions Form</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">Recommended</span>
                  </div>
                  <ol className="text-sm text-zinc-300 space-y-2 ml-4 list-decimal">
                    <li>Open this link on your phone:</li>
                    <li>
                      <a href="https://github.com/Cheerhuan/prompt-gallery-saas/actions/workflows/mobile-add.yml"
                        target="_blank"
                        className="text-indigo-400 underline break-all">
                        github.com/Cheerhuan/prompt-gallery-saas/actions/workflows/mobile-add.yml
                      </a>
                    </li>
                    <li>Tap <strong className="text-white">Run workflow</strong> (dropdown on right)</li>
                    <li>Fill in:
                      <ul className="ml-4 mt-1 space-y-0.5 text-zinc-400">
                        <li><strong className="text-zinc-200">Title</strong> — e.g. Neon Cyberpunk Portrait</li>
                        <li><strong className="text-zinc-200">Prompt</strong> — paste the full prompt text</li>
                        <li><strong className="text-zinc-200">Model</strong> — optional, defaults to GPT-Image-2</li>
                        <li><strong className="text-zinc-200">Image URL</strong> — optional, paste a Pexels/GitHub raw URL</li>
                      </ul>
                    </li>
                    <li>Tap <strong className="text-white">Run workflow</strong> (green button)</li>
                    <li>Done! Wait ~2 min for deploy.</li>
                  </ol>
                </div>

                {/* Method 2: GitHub Web Edit */}
                <div className="p-5 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🌐</span>
                    <span className="text-sm font-bold text-zinc-300">Method 2: Edit JSON Directly on GitHub</span>
                  </div>
                  <ol className="text-sm text-zinc-300 space-y-2 ml-4 list-decimal">
                    <li>Open prompts.json on your phone:</li>
                    <li>
                      <a href="https://github.com/Cheerhuan/prompt-gallery-saas/blob/main/src/data/prompts.json"
                        target="_blank"
                        className="text-indigo-400 underline break-all">
                        github.com/Cheerhuan/prompt-gallery-saas/blob/main/src/data/prompts.json
                      </a>
                    </li>
                    <li>Tap the <strong className="text-white">✏️ (pencil)</strong> icon in the top-right</li>
                    <li>Scroll to the bottom, add a new entry before the closing <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">]</code>:
                      <pre className="text-[10px] text-zinc-400 bg-black rounded-lg p-3 mt-2 overflow-x-auto">{`  {
    "id": "26",
    "title": "Your Prompt Title",
    "image": "https://images.pexels.com/...",
    "full_prompt": "Your complete prompt text here...",
    "model": "GPT-Image-2",
    "_version": "2026-05-09",
    "_source": "mobile-edit"
  }`}</pre>
                    </li>
                    <li>Make sure the entry before it has a <code className="text-zinc-400">,</code> (comma)</li>
                    <li>Scroll down, tap <strong className="text-white">Commit changes</strong></li>
                    <li>Done! Wait ~2 min for deploy.</li>
                  </ol>
                </div>

                {/* Method 3: Upload image via GitHub */}
                <div className="p-5 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🖼️</span>
                    <span className="text-sm font-bold text-zinc-300">Upload Images from Phone</span>
                  </div>
                  <ol className="text-sm text-zinc-300 space-y-2 ml-4 list-decimal">
                    <li>Open the uploads folder:</li>
                    <li>
                      <a href="https://github.com/Cheerhuan/prompt-gallery-saas/tree/main/public/images/uploads"
                        target="_blank"
                        className="text-indigo-400 underline break-all">
                        github.com/Cheerhuan/prompt-gallery-saas/tree/main/public/images/uploads
                      </a>
                    </li>
                    <li>Tap <strong className="text-white">Add file</strong> → <strong className="text-white">Upload files</strong></li>
                    <li>Select the image from your phone gallery</li>
                    <li>Tap <strong className="text-white">Commit changes</strong></li>
                    <li>Now use that path: <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">/images/uploads/your-image.jpg</code></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════ EDIT MODAL ══════ */}
        {editingId && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeEdit}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 animate-fade-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-6">✏️ Edit #{editingId}</h3>
              <div className="space-y-4">
                <div onClick={() => document.getElementById('edit-img')?.click()} className="border-2 border-dashed border-zinc-700 rounded-xl p-4 text-center cursor-pointer hover:border-zinc-500 transition-all">
                  <input id="edit-img" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleEditFile(f); }} />
                  {editForm.image ? <div><img src={editForm.image} alt="" className="max-h-24 mx-auto rounded-lg object-contain" /><p className="text-[10px] text-zinc-500 mt-1">Click to replace</p></div> : <span className="text-sm text-zinc-400">🖼️ Upload image</span>}
                </div>
                <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Title</label>
                  <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Prompt</label>
                  <textarea value={editForm.full_prompt} onChange={e => setEditForm({ ...editForm, full_prompt: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-20" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Model</label>
                    <input type="text" value={editForm.model} onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={closeEdit} className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700">Cancel</button>
                <button onClick={saveEdit} className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200">🚀 Gen Command</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
