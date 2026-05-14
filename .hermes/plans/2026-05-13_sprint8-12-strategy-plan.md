# Sprint 8-12: 邁向世界級 AI Prompt 平台

> Target: https://cheerhuan.github.io/prompt-gallery-saas/
> Working dir: `/Users/xiebinghuan/prompt-gallery-saas/`
> Framework: Next.js 16 (SSG + Turbopack), Tailwind v4, GitHub Pages

---

## 總策略

以 **Impact / Effort** 矩陣排序，先做高影響低成本的項目，逐步推進到高影響高成本的社群功能。

---

## Sprint 8: PWA 應用化（Web App）

**目標**：網站可安裝至主畫面、離線可用、LightHouse PWA badge。

### Implementation

**1. `public/manifest.json`**
```json
{
  "name": "Prompt Gallery",
  "short_name": "PromptVault",
  "description": "Curated AI prompt vault",
  "start_url": "/prompt-gallery-saas/",
  "display": "standalone",
  "background_color": "#030303",
  "theme_color": "#030303",
  "icons": [
    { "src": "/prompt-gallery-saas/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/prompt-gallery-saas/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**2. App icons** — 使用 Puppeteer 或 canvas 生成 192x192 + 512x512 icon（PG logo 風格）

**3. `layout.tsx` 注入 manifest link**:
```tsx
<link rel="manifest" href="/prompt-gallery-saas/manifest.json" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

**4. Service Worker** — `public/sw.js` 使用 Workbox 或手寫 cache-first 策略：
- 靜態資源（JS/CSS/fonts）→ Cache First
- 圖片 → Cache First (with network update)
- API/資料 → Network First (fallback to cache)

注意：GitHub Pages 不支援 Service Worker 的 scope 限制。需確保 sw.js 註冊路徑正確。

**5. Offline fallback page**

### 檔案影響
- `public/manifest.json` — 新增
- `public/sw.js` — 新增
- `public/icons/icon-192.png` — 新增
- `public/icons/icon-512.png` — 新增
- `src/app/layout.tsx` — 注入 meta + manifest link
- `next.config.ts` — 需確認靜態資源路徑

### 驗證
- [ ] `manifest.json` 可公開存取 (HTTP 200)
- [ ] Chrome DevTools → Application → Manifest 顯示正確
- [ ] Service Worker 成功註冊
- [ ] 離線模式仍可看到首頁內容
- [ ] 安裝提示出現在行動瀏覽器

### 預計時間：2h

---

## Sprint 9: AI 原生功能（Semantic Search）

**目標**：用向量相似度取代關鍵字搜尋，做到「風格相似搜尋」

### Implementation

**1. 建置時（build time）生成 embeddings**
- 使用 `src/scripts/generate-embeddings.ts`
- 對每個 prompt 的 `full_prompt` + `title` 生成 embedding（透過 NVIDIA API 或 HuggingFace Inference API）
- 儲存為 `src/data/embeddings.json`

**2. 客戶端相似度計算**
- 載入 embeddings.json
- 使用 `cosineSimilarity()` 計算用戶搜尋 query 與所有 prompt 的相似度
- Top-N 結果作為搜尋結果返回

**3. 搜尋 UI 更新**
- 搜尋欄觸發後：同時執行「關鍵字搜尋」+「語意搜尋」→ 合併結果
- 標示「AI 推薦」標籤在語意結果上

**4. AI Recommender**
- 在 Prompt 詳情頁底部加入「你可能也喜歡」區塊（基於向量相似度，替換現有同一 style bracket 的相關推薦）

### 檔案影響
- `src/scripts/generate-embeddings.ts` — 新增（建置用，不包含在最後產出）
- `src/data/embeddings.json` — 新增（~500KB for 92 prompts）
- `src/lib/semantic-search.ts` — 新增（客戶端 cosine similarity）
- `src/app/page.tsx` — 修改搜尋邏輯
- `src/app/prompt/[id]/DetailPageContent.tsx` — 修改 Related Prompts

### 驗證
- [ ] `npm run build` 前執行 generate-embeddings 腳本
- [ ] 搜尋「cinematic sunset」返回風格相關而非文字相關的結果
- [ ] AI Recommender 在詳情頁顯示正確的相似 prompt

### 預計時間：5h

---

## Sprint 10: 3D 視覺敘事（Scroll + Mouse Effects）

**目標**：Apple/Stripe 等級的沉浸式視覺體驗

### Implementation

**1. 3D Perspective Cards**
- 使用 `mousemove` 事件追蹤鼠標在卡片上的相對位置
- `transform: perspective(1000px) rotateX(Ydeg) rotateY(Xdeg)` — 範圍 ±10deg
- 使用 `requestAnimationFrame` 平滑處理
- 限制在桌面端（`matchMedia('(hover: hover)')`）

**2. Scroll-triggered Parallax**
- Hero 背景的 gradient orbs：`translateY` 速度 = scroll * 0.3
- 使用 `useScroll` + `useTransform` from framer-motion

**3. Hero 背景浮動粒子**
- Canvas 或 CSS 動畫，微小粒子漂浮
- 鼠標移動時粒子受到「推力」產生互動感

**4. Magnetic Button**
- CTA 按鈕（"Explore the Vault"）在鼠標靠近時往鼠標方向偏移
- 使用 `useMotionValue` + `useSpring` from framer-motion

### 檔案影響
- `src/hooks/useMousePosition.ts` — 新增滑鼠座標 hook
- `src/hooks/use3DTilt.ts` — 新增 3D tilt hook
- `src/components/MagneticButton.tsx` — 新增磁吸按鈕
- `src/components/HeroParticles.tsx` — 新增粒子背景（可選）
- `src/app/globals.css` — 新增 3D 相關 utility
- `src/app/page.tsx` — 修改 Hero + 卡片包裝

### 驗證
- [ ] 卡片在桌面 hover 時有 3D 傾斜效果
- [ ] Hero 背景 scroll parallax 流暢
- [ ] CTA 按鈕磁吸效果
- [ ] 行動端無干擾（hover 效果自動停用）
- [ ] 幀率 > 55 fps（使用 Chrome Performance tab）

### 預計時間：3h

---

## Sprint 11: Growth Engine（增長飛輪）

**目標**：從「展示網站」變為「流量獲取引擎」

### Implementation

**1. Twitter/X Share Card**
- 在 Prompt 詳情頁 + PromptCard hover 加入「Share to X」按鈕
- URL 格式：`https://twitter.com/intent/tweet?text=...&url=...`
- 文字包含 prompt 標題 + 網站連結

**2. Newsletter CTA**（0 成本方案 — Buttondown 或直接 Airtable）
- 在 Hero 下方或 Footer 加入 Email 輸入欄位
- 使用 Airtable API 記錄 subscriptions（GitHub Pages 可 call client-side）
- 或使用 Buttondown embed（免費方案）

**3. "Copy Prompt" 分享追蹤**
- 現有 Plausible 事件 `CopyPrompt` 加上 `props: { id, source: 'card'|'detail' }`

### 檔案影響
- `src/components/PromptCard.tsx` — 加入 Share 按鈕
- `src/app/prompt/[id]/DetailPageContent.tsx` — 加強 Share 功能
- `src/components/NewsletterForm.tsx` — 新增
- `src/app/page.tsx` — 插入 Newsletter 區塊

### 驗證
- [ ] Share to X 按鈕一鍵推文正常
- [ ] Newsletter 輸入欄位可提交
- [ ] 無需後端（全 client-side 或第三方 embed）

### 預計時間：3h

---

## Sprint 12: Accessibility + Core Web Vitals

**目標**：Lighthouse ≥ 90/95

### Implementation

**1. Contrast & Color**
- 確保所有文字對比度 ≥ 4.5:1（WCAG AA）
- 特別是 badge/subtitle 等小字

**2. ARIA Labels**
- 搜尋欄：`aria-label="Search prompts"`
- Filter pills：`aria-pressed`
- 卡片：`role="article"` + `aria-label`
- Infinite scroll sentinel：`aria-hidden="true"`

**3. Keyboard Navigation**
- 所有可點擊元素 focusable + visible focus ring
- 自定義 `focus-visible` 樣式（取代預設 outline）
- 搜尋結果上下方向鍵導航

**4. Performance Optimization**
- 字體 preload 已做，確認生效
- Image 尺寸明確指定（避免 CLS）
- 骨架載入狀態完善

**5. 執行 Lighthouse CI**
- 使用 `lighthouse-ci` 或直接在 Chrome DevTools 跑
- 記錄分數並逐一修復

### 檔案影響
- 多處修改，以 patch 為主

### 驗證
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Lighthouse Best Practices ≥ 90
- [ ] Lighthouse SEO ≥ 95
- [ ] Tab 鍵可完整導航所有功能
- [ ] Screen Reader 可正確讀取卡片內容

### 預計時間：4h

---

## 執行順序摘要

| Sprint | 主題 | 時長 | 累積 |
|:------|:-----|:----|:----:|
| **8** | PWA（manifest + SW + offline） | 2h | 2h |
| **9** | Semantic Search + AI Recommender | 5h | 7h |
| **10** | 3D Perspective + Scroll Storytelling | 3h | 10h |
| **11** | Growth Engine（Share + Newsletter） | 3h | 13h |
| **12** | Accessibility + Core Web Vitals | 4h | 17h |
