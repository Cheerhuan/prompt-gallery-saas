# Sprint 7: Analytics + SEO 國際化 + UI Polish

> Target: https://cheerhuan.github.io/prompt-gallery-saas/
> Working dir: `/Users/xiebinghuan/prompt-gallery-saas/`
> Framework: Next.js 16 (SSG + Turbopack), Tailwind v4, GitHub Pages

---

## Overview

Three workstreams in parallel, sequenced by dependency:

1. **A — Analytics (Plausible)** → 輕量無 Cookie 分析
2. **B — SEO 國際化 (hreflang + sitemap 補全)** → 搜尋引擎優化
3. **C — UI Polish (入場動畫 + 微交互相饋)** → 視覺品質

---

## A. 📊 Plausible Analytics

### Goal
植入 Plausible Analytics 腳本，追蹤：
- 頁面瀏覽 (PV)
- 自定義事件：`Copy Prompt`, `Save to Vault`, `PRO Click`
- 跳出率、停留時間

### Implementation

**1. 環境變數控制**
- 建立 `.env.local` 開發環境自動忽略
- 只在生產環境 (`NODE_ENV=production`) 載入

**2. `layout.tsx` 植入**
```tsx
// 在 <head> 中加入（僅生產環境）
{process.env.NODE_ENV === 'production' && (
  <script defer data-domain="cheerhuan.github.io/prompt-gallery-saas" src="https://plausible.io/js/script.js" />
)}
```

**3. 自定義事件**
- `PromptCard.tsx` → 複製 Prompt 時 `plausible('CopyPrompt', {props: {id}})` 
- `PromptCard.tsx` → 收藏時 `plausible('SavePrompt', {props: {id}})` 
- `FeatureGate.tsx` → 點擊升級時 `plausible('UpgradeClick')`

**4. 全域 Plausible 函數**
```typescript
declare global {
  interface Window { plausible?: (event: string, opts?: any) => void }
}
```

### Files to change
- `src/app/layout.tsx` — script injection
- `src/components/PromptCard.tsx` — copy/save events
- `src/components/FeatureGate.tsx` — upgrade click event

---

## B. 🌐 SEO 國際化 (hreflang + Sitemap)

### Goal
- 每個頁面輸出 `<link rel="alternate" hreflang="zh/ja/ko/en">`
- Sitemap 補全 92 個 prompt 詳情頁
- 社群分享卡片 (OpenGraph) 強化

### Implementation

**1. `layout.tsx` 添加 hreflang**
所有靜態頁面輸出語言替代標籤：
```tsx
<link rel="alternate" hreflang="en" href="https://cheerhuan.github.io/prompt-gallery-saas/" />
<link rel="alternate" hreflang="zh" href="https://cheerhuan.github.io/prompt-gallery-saas/zh/" />
<link rel="alternate" hreflang="ja" href="https://cheerhuan.github.io/prompt-gallery-saas/ja/" />
<link rel="alternate" hreflang="ko" href="https://cheerhuan.github.io/prompt-gallery-saas/ko/" />
<link rel="alternate" hreflang="x-default" href="https://cheerhuan.github.io/prompt-gallery-saas/" />
```

注意：目前 i18n 是 client-side (透過 I18nProvider 切換語系)，沒有實際 `/zh/ /ja/ /ko/` 路由。hreflang 需配合真實路由存在才有效。

*選項 A（低成本）*：僅保留 `x-default` + `en`，待未來真多路由時再擴充。
*選項 B（完整）*：建立 `/zh/page.tsx`、`/ja/page.tsx`、`/ko/page.tsx` 作為獨立路由，每個路由硬編碼對應 locale 的 I18nProvider。

**推薦：選項 A** — 現階段 client-side i18n 無法提供真正獨立語言路由，虛假 hreflang 會傷害 SEO。

**2. Sitemap 強化 （`src/app/sitemap.ts` 建立）**
目前的 `out/sitemap.xml` 只有 5 個靜態頁面。需要補全：
- 所有 92 個 `/prompt/{id}` 頁面
- 每個 prompt 使用其 `lastmod` (來自 `_version` 欄位)

```typescript
import { MetadataRoute } from 'next'
import promptsData from '@/data/prompts.json'

const BASE = 'https://cheerhuan.github.io/prompt-gallery-saas'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE, lastModified: '2026-05-13', changeFrequency: 'daily' as const, priority: 1.0 },
    // ... explore, trending, saved, pricing
  ]
  
  const promptPages = promptsData.map(p => ({
    url: `${BASE}/prompt/${p.id}`,
    lastModified: p._version?.slice(0, 10) || '2026-05-13',
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...promptPages]
}
```

**3. OpenGraph 強化 (`layout.tsx`)**
- 加入 `og:locale` 
- 確保 `og:image` 使用絕對 URL
- 加入 `article:tag` 關鍵字

### Files to change
- `src/app/sitemap.ts` — create with all 92 prompt URLs
- `src/app/layout.tsx` — add hreflang links + OG locale

---

## C. 🎨 UI Polish (微動畫 + 交互優化)

### Goal
提升視覺品質到「頂級 SaaS 感」：
- Framer Motion 入場過渡
- 載入序列微調
- Hover 狀態一致性
- 滾動觸發動畫

### Implementation

**1. Hero 區塊 Framer Motion**
```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
>
```

**2. Prompt Packs 卡片浮現**
水平滾動卡片在視窗內時，由透明度 0 → 1 漸入：
```tsx
<motion.div
  initial={{ opacity: 0, x: -20 }}
  whileInView={{ opacity: 1, x: 0 }}
  viewport={{ once: true, margin: "-50px" }}
>
```

**3. Gallery Cards 交錯延遲**
目前的 CSS `animate-fade-up` 使用 nth-child 硬編碼延遲。改為 Framer Motion `staggerChildren`：
```tsx
<motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}>
  {cards.map(card => (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
```

但注意：這會增加 bundle size (~15KB)。如果用戶在意包體大小，保留 CSS 方案即可。

**4. Copy Prompt 視覺回饋強化**
目前「Copied!」只是文字變綠。加入：
- 背景輕微放大動畫
- 成功圖示 (Checkmark) 旋轉彈出

**5. PRO 卡片提示動畫**
PRO 鎖定卡片 hover 時，鎖頭圖示輕微搖晃 (shake animation) 提示可升級。

### Files to change
- `src/app/page.tsx` — Hero entrance, card stagger, Prompt Packs animation
- `src/components/PromptCard.tsx` — Copy success animation, PRO shake
- `src/components/PromptPlayground.tsx` — if needs polish

---

## Files Summary

| File | Change Type | Workstream |
|:----|:-----------|:-----------|
| `src/app/layout.tsx` | Edit | A (Plausible injection), B (hreflang) |
| `src/app/sitemap.ts` | **Create** | B (full sitemap with prompt URLs) |
| `src/components/PromptCard.tsx` | Edit | A (tracking events), C (animations) |
| `src/components/FeatureGate.tsx` | Edit | A (upgrade click tracking) |
| `src/app/page.tsx` | Edit | C (Hero/Packs/Gallery entrance) |

## Risks & Tradeoffs

1. **Framer Motion vs CSS** — 使用 Framer Motion 增加 bundle size (~15KB gzipped)，但提供更流暢的動畫控制。選項：只對 Hero 和 Packs 使用 Framer Motion，Gallery 保留 CSS stagger。
2. **hreflang 真實性** — 無真正 `/zh/` 路由時，hreflang 會誤導 Google。選項 A (僅 x-default + en) 較安全。
3. **Plausible 自託管 vs Cloud** — 此處使用 Plausible Cloud (免費方案)，若需自託管需額外設定。

## Validation

- [ ] Plausible 腳本在生產環境載入，開發環境不載入
- [ ] 自定義事件觸發時 console.log 正常（可用開發者工具 Network 面板驗證）
- [ ] Sitemap 生成後包含全部 92+5 個 URLs
- [ ] Sitemap `/sitemap.xml` 可公開訪問
- [ ] Hero 入場動畫流暢、無閃爍
- [ ] PRO 鎖定卡片 hover 動畫正常
- [ ] Copy Prompt 成功反饋清晰
- [ ] `npm run build` 無 TypeScript 錯誤
- [ ] 部署後瀏覽器驗證所有功能正常
