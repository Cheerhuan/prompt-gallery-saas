# MeiGen-Inspired Layout Redesign Plan

> **For Hermes:** Use subagent-driven-development to implement this plan task-by-task. Execute only after user confirms.

**Goal:** Restructure prompt-gallery-saas landing page to match meigen.ai's three-column layout — left sidebar navigation + top filter bar + masonry card grid as primary content — replacing the current hero-first layout.

**Architecture:** Three-column flex layout on desktop (sidebar | content | optional right panel), stacking on mobile. Replace SaaSNavbar with permanent Sidebar on landing page. Push hero/pack/collection sections down below or remove entirely so cards are the first thing users see.

**Design Constraint:** 2026 Editorial Minimalism — dark theme (`bg-black`), clean borders (`border-zinc-800`), active states via `border-b-2`, no glassmorphism, no framer-motion hero animations.

**Tech Stack:** Next.js 16 + Tailwind CSS + CSS Columns masonry (already done)

---

## Pre-Flight Verification

- [ ] Project PWD: `/Users/xiebinghuan/prompt-gallery-saas`
- [ ] Current layout: SaaSNavbar (top) → Hero section → Curated Collections → CollectionRow → Filter bar → Featured bento → Masonry grid → Pagination → Footer
- [ ] SaaSNavbar is used on ALL pages (profile, saved, prompt/[id], explore, trending, pricing, etc.)
- [ ] Sidebar will replace SaaSNavbar ONLY on landing page; keep SaaSNavbar for other pages
- [ ] Current grid is already CSS Columns masonry (from previous task) ✅
- [ ] PromptCard already has model badge + hover panel ✅

---

## Task 1: Create Sidebar Component

**Objective:** Build a fixed left sidebar (240px) for the landing page with navigation, categories, ecosystem links, and CTA.

**Files:**
- Create: `src/components/Sidebar.tsx`

**Specification:**

```
Layout (desktop):
┌──────────────────────┐
│ [Logo] PG            │
│                      │
│ ● Home               │  ← active state
│ ● Search             │
│ ● History            │
│ ● Favorites          │
│ ─────────────────    │
│ CATEGORIES           │  ← small label
│ ● Tags               │
│ ● Recent Updates     │
│ ─────────────────    │
│ ECOSYSTEM            │
│ ● MCP Server         │  ← external links
│ ● Hermes Skill       │
│ ● Figma Plugin       │
│                      │
│ [Publish & earn]     │  ← CTA card
│ [Get Started]        │  ← button
│                      │
│ Terms · Privacy · Git│  ← footer links
└──────────────────────┘
```

**States:**
- `activePage`: 'home' | 'search' | 'history' | 'favorites' — highlight active item
- Active item: `bg-zinc-800/50 text-white` with `border-l-2 border-white`
- Inactive: `text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30`
- Mobile: sidebar collapses to bottom nav bar or hidden with hamburger toggle

**Props:**
```typescript
interface SidebarProps {
  activePage?: 'home' | 'search' | 'history' | 'favorites';
}
```

**Styling:**
- `w-[240px] shrink-0 h-screen sticky top-0`
- `bg-zinc-950 border-r border-zinc-800`
- `flex flex-col justify-between py-6 px-4`
- Logo: same as current SaaSNavbar logo (PG icon + "PROMPT GALLERY")
- Category label: `text-[10px] uppercase tracking-[0.2em] text-zinc-600`
- Nav items: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all`
- CTA card: `bg-zinc-900 border border-zinc-800 rounded-xl p-4`
- Button: `w-full bg-white text-black rounded-lg py-2 text-xs font-semibold`

**Responsive:**
- `md:flex hidden` — sidebar visible only on desktop
- On mobile (`<md`): show bottom nav bar instead

---

## Task 2: Create ModelTabs Component

**Objective:** Build the top filter bar with model tabs (All, GPT Image, Midjourney, etc.) and sort buttons (Featured, Newest, Popular).

**Files:**
- Create: `src/components/ModelTabs.tsx`

**Specification:**

```
┌──────────────────────────────────────────────────────────────┐
│ [All] [GPT Image] [Midjourney] [Nano Banana] [Seedance 2.0] │  ← model tabs
│                                            [Featured] [Newest] [Popular] │  ← sort buttons
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Search prompts...                   ⌘K                   │ │  ← search input
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface ModelTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  sortBy: 'featured' | 'newest' | 'popular';
  onSortChange: (sort: 'featured' | 'newest' | 'popular') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
}
```

**Tabs mapping (hardcoded):**
```
all → "All"
gptimage → "GPT Image"
midjourney → "Midjourney"
nanobanana → "Nano Banana"
seedance → "Seedance 2.0"
```

**Styling:**
- No background container, just `flex items-center gap-2 mb-4`
- Tabs: `px-3 py-1.5 text-xs font-medium rounded-lg transition-all`
  - Active: `bg-zinc-800 text-white`
  - Inactive: `text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50`
- Sort buttons on right side (ml-auto): `text-xs text-zinc-500 transition-all`
  - Active: `text-white border-b-2 border-white`
  - Inactive: `text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent`
- Search: underline style (current implementation), moved below tabs

---

## Task 3: Restructure page.tsx — Three-Column Layout

**Objective:** Rewrite the landing page to use sidebar + top tabs + masonry grid layout, removing hero/pack/collection sections.

**Files:**
- Modify: `src/app/page.tsx` (major rewrite, ~690 lines → ~350 lines)

**New Layout Structure:**

```
┌─────────────┬────────────────────────────────────────────┐
│             │  [ModelTabs]                                 │
│  Sidebar    │  ┌────────────────────────────────────┐    │
│  (240px)    │  │ Masonry Grid (columns-3 lg:columns-4)│    │
│             │  │ ┌───┐ ┌───┐ ┌───┐ ┌───┐          │    │
│             │  │ │Img│ │Img│ │Img│ │Img│          │    │
│             │  │ └───┘ └───┘ └───┘ └───┘          │    │
│             │  └────────────────────────────────────┘    │
│             │  ── Pagination ──                           │
│             │  ── Simple Footer ──                        │
└─────────────┴────────────────────────────────────────────┘
```

**Changes:**

### Remove (delete from JSX):
- Hero section (lines 244-280)
- Curated Collections / Prompt Packs section (lines 282-333)
- CollectionRow component (line 335-343)
- Stats bar (lines 348-357)
- Big footer (lines 582+, replace with simplified version)

### Keep:
- `SaaSNavbar` import → remove from page.tsx (keep import for other pages)
- Filter/search logic (relocated into ModelTabs)
- Masonry grid + Pagination (same as current)
- QuickView modal (kept)
- `GalleryContent` component wrapper

### Modify:
- Wrap entire page in `flex` with sidebar + main content
- Move search/filter logic from inline to ModelTabs
- Add scroll-margin to gallery section for tab navigation
- Simplify footer to just: `Terms · Privacy · GitHub`

### Add:
- Import `Sidebar` component
- Import `ModelTabs` component
- Three-column container:
  ```tsx
  <div className="flex min-h-screen">
    <Sidebar activePage="home" />
    <main className="flex-1 min-w-0">
      <ModelTabs ... />
      <section className="max-w-7xl mx-auto px-4 pb-12">
        {masonry grid}
        {pagination}
      </section>
      {simple footer}
    </main>
  </div>
  ```

**Filter logic integration:**
- Currently `activeFilter` is a string ('all', 'cinematic', etc.)
- Change to `modelFilter` ('all', 'gptimage', 'midjourney', etc.)
- Map model filter to title/keyword search (same logic as current activeFilter)
- Search is still semantic using `searchPrompts()`

---

## Task 4: Simplify Footer

**Objective:** Replace the large footer with a minimal meigen.ai-style footer.

**Files:**
- Modify: `src/app/page.tsx` (the footer section)

**Current footer (~100 lines of JSX):** big text, multiple columns, newsletter form
**New footer:**
```tsx
<footer className="border-t border-zinc-800/30 mt-16">
  <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-between">
    <p className="text-[10px] text-zinc-600 font-mono">
      Prompt Gallery · {totalCount} prompts · Updated daily
    </p>
    <div className="flex items-center gap-4 text-[10px] text-zinc-600">
      <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
      <span>·</span>
      <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
      <span>·</span>
      <a href="https://github.com/Cheerhuan/prompt-gallery-saas" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">GitHub</a>
    </div>
  </div>
</footer>
```

---

## Task 5: Remove CollectionRow from Imports & Verify No Dead Imports

**Objective:** Clean up unused imports after removing CollectionRow from page.tsx.

**Files:**
- Modify: `src/app/page.tsx` — remove `CollectionRow` import
- If `CollectionRow.tsx` is no longer used anywhere → optionally keep file (YAGNI: keep for now, don't delete)

**Verification:**
```bash
grep -rn "CollectionRow" src/app/  # should return 0
grep -rn "CollectionRow" src/components/  # should only show the component itself
```

---

## Task 6: Mobile Responsiveness

**Objective:** Ensure the new layout works on mobile devices.

**Changes:**
- Sidebar: `hidden md:flex` — hidden on mobile
- Mobile nav: Add bottom navigation bar with 5 icons (Home, Search, History, Favorites, Submit)
- ModelTabs: horizontal scroll on mobile (`overflow-x-auto no-scrollbar`)
- Masonry: `columns-2` on mobile → `columns-3 sm:columns-4`

**Mobile bottom nav component (inline in page.tsx or separate):**
```tsx
{/* Mobile Bottom Nav */}
<div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-950 border-t border-zinc-800">
  <div className="flex items-center justify-around py-2">
    {navItems.map(item => (
      <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1 px-3 py-1">
        <span className="text-lg">{item.icon}</span>
        <span className="text-[8px] text-zinc-500">{item.label}</span>
      </Link>
    ))}
  </div>
</div>
```

---

## Task 7: Build & Verify

**Objective:** Build the project and verify no errors.

**Steps:**
1. `cd /Users/xiebinghuan/prompt-gallery-saas`
2. `npm run build`
3. Verify: `✓ Compiled successfully`
4. Check: all 285+ pages generated
5. `cp -R out/* .`
6. `git add -A`
7. `git commit -m "feat: meigen-inspired three-column layout with sidebar + model tabs"`
8. `git -c http.postBuffer=524288000 push origin main`

**Verification:**
- Browser-navigate to deployment URL with `?v=timestamp` cache-buster
- Confirm: sidebar visible on desktop, hidden on mobile
- Confirm: cards load in masonry grid
- Confirm: model tabs filter correctly
- Confirm: search still works
- Confirm: pagination URL persistence works

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| SaaSNavbar removal breaks other pages | Medium | Keep SaaSNavbar in layout.tsx for non-landing pages |
| Sidebar + top navbar conflict | Medium | Remove SaaSNavbar from page.tsx only, keep it in other pages via layout |
| Mobile layout broken | Low | Use responsive Tailwind classes (`hidden md:flex`) |
| Filter logic regression | Low | Keep same searchPrompts() + activeFilter logic, just change UI |
| Dead import (CollectionRow) | Low | Grep verify before build |

---

## Open Questions

1. ~~Right generation panel?~~ → Skip for now (YAGNI), can add later
2. ~~Should Sidebar replace SaaSNavbar entirely?~~ → No, only on landing page
3. What about mobile bottom nav? → Include basic version, can iterate later

---

**Plan ready. Execute after user confirms.**"
