# 🎨 Prompt Gallery SaaS: Architecting a High-Performance AI Prompt Ecosystem

![Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop)

## 📌 Executive Summary
Prompt Gallery is a high-performance, Pinterest-inspired SaaS platform designed for AI artists and prompt engineers. It transforms raw, unstructured AI prompts into a structured, discoverable, and monetizable asset library. 

Unlike simple galleries, this project implements a **Structured Prompt Breakdown** engine, allowing users to decompose a complex prompt into its core architectural components: Subject, Style, Details, Lighting, and Camera.

### 🛠️ Technical Stack
- **Frontend**: `Next.js 15` (App Router) + `TypeScript` + `Tailwind CSS`
- **Deployment**: `GitHub Pages` via `GitHub Actions` (CI/CD)
- **Backend Architecture**: `Supabase` (PostgreSQL + Auth + Storage)
- **Build Strategy**: `Static Site Generation (SSG)` with `output: 'export'`

---

## 📐 System Architecture

### 1. The "Static-First" Performance Strategy
To achieve near-zero latency and eliminate server costs, the project utilizes a **Static Export** strategy. 
- **Challenge**: Handling dynamic routes (`/prompt/[id]`) in a static environment.
- **Solution**: Implemented `generateStaticParams()` to pre-render the entire prompt library at build time, ensuring that every gallery item is delivered as a pure HTML file.

### 2. Structured Prompt Engine
The core value proposition is the **Parsing Logic**. The system doesn't just store a string; it analyzes the prompt structure:
`Raw Prompt` $\rightarrow$ `Regex-based Parser` $\rightarrow$ `Structured UI Fields` $\rightarrow$ `User Refinement`.

### 3. Industrial-Grade Database Schema
Designed for scale, the Supabase schema includes:
- **Profiles**: User metadata with tiered subscription levels (`Free`, `Pro`, `Enterprise`).
- **Prompts**: Indexed fields for subjects and styles to enable fast filtering.
- **RLS (Row Level Security)**: Strict policies ensuring that private prompts remain private while public galleries are globally accessible.

---

## 🚀 Architect's Log: Technical Hurdles & Resolutions

| Challenge | Root Cause | Resolution |
| :--- | :--- | :--- |
| **CI/CD Pipeline Failure** | Missing `package-lock.json` causing dependency resolution errors in GitHub Actions. | Implemented `npm install --package-lock-only` to ensure deterministic builds. |
| **Production Build Crash** | Implicit `any` types in TypeScript causing `next build` to fail. | Enforced strict typing across all components and implemented `Interface` definitions for all Props. |
| **Dynamic Route 404** | Static export cannot resolve dynamic IDs without a manifest. | Implemented `generateStaticParams` to pre-generate all static paths during the build phase. |
| **Deployment 404** | GitHub Pages source misconfigured as "Branch" instead of "Actions". | Migrated deployment source to `GitHub Actions` for direct artifact upload. |

---

## 💰 Monetization Logic (SaaS Ready)
The system is built with a **Feature Gating** architecture:

- **Free Tier**: Basic browsing, limited favorites (5), standard uploads.
- **Pro Tier**: Unlimited favorites, advanced prompt breakdown tools, early access to model presets.
- **Enterprise Tier**: Private galleries, API access for bulk prompt management, priority support.

---

## 🛠️ Quick Start

### Local Development
```bash
git clone https://github.com/Cheerhuan/prompt-gallery-saas.git
cd prompt-gallery-saas
npm install
npm run dev
```

### Deployment
This project is configured for automatic deployment. Simply push to `main` and the GitHub Actions pipeline will handle the rest:
`Push` $\rightarrow$ `Build` $\rightarrow$ `Type Check` $\rightarrow$ `Static Export` $\rightarrow$ `Deploy to Pages`.

---

## ⚖️ License
MIT License - Feel free to use this architecture for your own AI SaaS projects.
