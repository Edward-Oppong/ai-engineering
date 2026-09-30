# AI Engineering Study Companion — System Documentation

> **Living Document** — Update this file whenever any source file is modified.  
> Last Updated: 2026-09-30  
> Version: 1.2.0  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [System Architecture](#4-system-architecture)
5. [Multi-Learner Profiles & Progress Isolation](#5-multi-learner-profiles--progress-isolation)
6. [Build Pipeline](#6-build-pipeline)
7. [Data Layer](#7-data-layer)
8. [IndexedDB Schema](#8-indexeddb-schema)
9. [Spaced Repetition Engine (SM-2)](#9-spaced-repetition-engine-sm-2)
10. [Research Papers & Daily Reading Gate](#10-research-papers--daily-reading-gate)
11. [AI Integration (Groq)](#11-ai-integration-groq)
12. [In-Browser Python Execution (Pyodide)](#12-in-browser-python-execution-pyodide)
13. [Design System](#13-design-system)
14. [Component Reference](#14-component-reference)
15. [View Reference](#15-view-reference)
16. [Known Thresholds & Risk Areas](#16-known-thresholds--risk-areas)
17. [What Could Crash & How to Recover](#17-what-could-crash--how-to-recover)
18. [Development Workflow](#18-development-workflow)
19. [File Change Log](#19-file-change-log)

---

## 1. Project Overview

A **local-first, multi-learner web and desktop application** for self-paced study of the [AI Engineering from Scratch](https://github.com/rohitg00/ai-engineering-from-scratch) curriculum (**523 chapters across 20 tracks**).

### Core Principles
- **Daily research habit** — recommended 4–5 seminal AI research papers daily to connect theory with production code; non-blocking so students can learn completely offline anytime.
- **AI-powered analysis** — Groq LLaMA-3.3-70B provides instant deep-dive synthesis and trend briefings when online.
- **Zero runtime network calls for lessons** — all 590 lessons and bundled papers work with Wi-Fi completely disconnected.
- **Isolated per-learner persistence** — individual progress, notes, quiz attempts, streaks, and SR decks are fully isolated per account.
- **Durable browser IndexedDB** — resilient, queryable, survives page refreshes and browser restarts.
- **Static deployment** — a single `dist/` folder, deployable on Vercel, GitHub Pages, Netlify, or as a standalone Windows `.exe`.
- **590 lessons across 20 phases** indexed at build time into static JSON chunks.

### Feature Matrix
| Feature | Implementation | Multi-Learner Isolation |
|---|---|---|
| Daily research habit | 4–5 papers/day target (non-blocking), tracked in `localStorage` | Per-user `ai_eng_daily_reading_YYYY-MM-DD` key |
| Research papers (catalogue) | 12+ seminal AI papers bundled in `groq-papers.ts` (100% offline) | Shared static catalogue |
| AI paper analysis | Groq LLaMA-3.3-70B via `/chat/completions` (when online) | On-demand per paper |
| AI trend feed | Groq-generated 6-item AI news feed | Fresh per session |
| Read lessons | Markdown rendered via `react-markdown` | Shared static assets |
| Track progress | IndexedDB `lessons` store | Isolated per `userId` DB |
| Take notes | Auto-saved per-lesson to IndexedDB | Isolated per `userId` DB |
| Knowledge checks | Multiple-choice quiz per lesson | Isolated per `userId` DB |
| Spaced repetition | Missed questions via SM-2 | Isolated per `userId` DB |
| Hands-on projects | 48 projects with milestones & starter code | Isolated per `userId` DB |
| Certifications | MCPA exam prep track | Shared static content |
| In-browser Python | Sandboxed Pyodide WebAssembly | Client-side sandbox |
| Multi-user login | Client-side profile switcher + SHA-256 PIN | User registry & DB routing |
| Offline search | `fuse.js` fuzzy search | Shared static index |
| Desktop App | Standalone Electron `.exe` for Windows | Local storage & IDB |

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | ^18.3.1 | UI component tree |
| Language | TypeScript | ^5.7.3 | Type safety |
| Bundler | Vite | ^6.1.0 | Dev server, production build |
| Desktop Shell | Electron + electron-builder | ^43.x / ^26.x | Standalone Windows `.exe` |
| AI Backend | Groq Cloud API | LLaMA-3.3-70B | Paper analysis & AI trends |
| Styling | Tailwind CSS | ^3.4.17 | Utility classes |
| CSS | Vanilla CSS (`index.css`) | — | Design tokens, typography |
| Fonts | Inter, Newsreader | — | Typographic system |
| Markdown | react-markdown + remark-gfm | ^9.0.3 / ^4.0.0 | Render lesson `.md` files |
| Diagrams | Mermaid | ^11.4.1 | Architecture diagrams |
| Code highlight | prism-react-renderer | ^2.4.1 | Syntax highlighting |
| Python Runtime | Pyodide (WebAssembly) | CDN/WASM | In-browser Python execution |
| Icons | lucide-react | ^1.16.0 | UI icons |
| Search | fuse.js | ^7.1.0 | Client-side fuzzy search |
| Storage | Native IndexedDB | Browser API | Multi-database durable data |
| Test Suite | Vitest | ^4.1.11 | Automated tests |

---

## 3. Directory Structure

```
ai-engineering/
├── curriculum/              # Git submodule — upstream content repo
│   ├── phases/              # 20 phases × N lessons (.md + quiz.json + code/)
│   ├── projects/            # 48 hands-on projects + roadmap.json
│   └── certifications/      # MCPA + Claude certification tracks
├── scripts/
│   └── index-curriculum.mjs # Build-time: generates src/data/*.json
├── electron/
│   └── main.cjs             # Electron main process
├── src/
│   ├── App.tsx              # Root — routing, daily gate, state
│   ├── components/
│   │   ├── Navbar.tsx       # Top nav (6 tabs + Research + controls)
│   │   ├── AuthModal.tsx    # Multi-learner profile switcher
│   │   ├── SettingsModal.tsx
│   │   ├── SearchModal.tsx
│   │   ├── LearningPathsModal.tsx
│   │   ├── QuizView.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   ├── CodeViewer.tsx
│   │   └── ReadingControls.tsx
│   ├── views/
│   │   ├── DashboardView.tsx
│   │   ├── PhasesView.tsx
│   │   ├── LessonView.tsx
│   │   ├── ReviewQueueView.tsx
│   │   ├── ProjectsView.tsx
│   │   ├── CertificationsView.tsx
│   │   └── ResearchPaperView.tsx  ← NEW
│   ├── lib/
│   │   ├── curriculum-loader.ts
│   │   ├── db.ts            # IndexedDB multi-user store
│   │   ├── sm2.ts           # SuperMemo-2 algorithm
│   │   ├── auth.ts          # Profile management
│   │   └── groq-papers.ts   ← NEW: Groq API + paper catalogue + gate logic
│   ├── types/
│   │   └── index.ts         # All TypeScript interfaces
│   └── data/                # Build-time generated static JSON
│       ├── curriculum-index.json
│       ├── projects-data.json
│       ├── certifications-data.json
│       └── learning-paths.json
├── tests/
│   └── curriculum-data.test.ts
├── SYSTEM_DOCS.md           # ← This file
├── README.md
├── package.json
└── vite.config.ts
```

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Electron Shell (optional)  or  Browser (Vite SPA)              │
│  ─────────────────────────────────────────────────────────────  │
│  App.tsx  ←  hash router, daily gate (isDailyReadingGoalMet)    │
│     │                                                           │
│     ├── ResearchPaperView  ──► groq-papers.ts                  │
│     │      ├── Groq LLaMA-3.3-70B (paper analysis, trends)     │
│     │      └── localStorage (daily reading keys)               │
│     │                                                           │
│     ├── DashboardView / PhasesView / LessonView                │
│     │      └── [gated: requires daily gate met]                │
│     │                                                           │
│     ├── ProjectsView / CertificationsView                      │
│     └── ReviewQueueView                                        │
│                                                                 │
│  Shared Services:                                               │
│    db.ts ────────────────► IndexedDB (per-user database)        │
│    curriculum-loader.ts ──► src/data/*.json (build-time)        │
│    auth.ts ───────────────► localStorage (profile registry)     │
│    groq-papers.ts ────────► Groq Cloud API (internet required)  │
│                             localStorage (daily gate tracking)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Multi-Learner Profiles & Progress Isolation

- Each user gets their own IndexedDB: `ai_engineering_study_db_{userId}`
- Each user's daily reading gate is stored in `localStorage` under `ai_eng_daily_reading_YYYY-MM-DD` (shared but date-scoped key; for multi-user machines, gate is shared per device day)
- Profile PIN is SHA-256 hashed client-side; never leaves the device
- `auth.ts` manages the profile registry in `localStorage`

---

## 6. Build Pipeline

```
npm run build
  │
  ├─ 1. node scripts/index-curriculum.mjs
  │      Scans curriculum/ → emits src/data/*.json
  │
  ├─ 2. tsc -b
  │      TypeScript type-checking
  │
  └─ 3. vite build
         Bundles React SPA → dist/

npm run electron:build
  ├─ npm run build (above)
  └─ electron-builder --win
       Packages dist/ + electron/ → release/
         AI Engineering Study Companion Setup.exe
         AI Engineering Study Companion Portable.exe
```

---

## 7. Data Layer

### Static (build-time)
| File | Generator | Contents |
|---|---|---|
| `src/data/curriculum-index.json` | `index-curriculum.mjs` | Phase metadata + lesson summaries |
| `src/data/phase-{N}-lessons.json` | `index-curriculum.mjs` | Per-phase full lesson content |
| `src/data/projects-data.json` | `index-curriculum.mjs` | 48 projects with stages & code |
| `src/data/certifications-data.json` | `index-curriculum.mjs` | MCPA + Claude cert content |
| `src/data/learning-paths.json` | `index-curriculum.mjs` | Career route definitions |

### Runtime (localStorage)
| Key pattern | Contents |
|---|---|
| `ai_eng_active_user_id` | Current active profile ID |
| `ai_eng_users` | JSON registry of all profiles |
| `ai_eng_daily_reading_YYYY-MM-DD` | Array of paper IDs read today |
| `ai_eng_bookmarks` / `ai_eng_bookmarks_{userId}` | Bookmarked lesson IDs |
| `ai_eng_reading_prefs` / `ai_eng_reading_prefs_{userId}` | Font size, family, width, focus mode |

### Runtime (IndexedDB, per userId)
See §8.

---

## 8. IndexedDB Schema

DB name: `ai_engineering_study_db` (default) or `ai_engineering_study_db_{userId}`  
DB version: **3**

| Store | Key | Indices | Purpose |
|---|---|---|---|
| `lessons` | `id` | `phaseId`, `status`, `completedAt` | Lesson progress & notes |
| `quizAttempts` | `id` | `lessonId`, `answeredAt` | Quiz attempt history |
| `reviewQueue` | `id` | `dueDate`, `lessonId`, `questionId` | SM-2 spaced repetition |
| `activityLog` | `date` | — | Daily streak tracking |
| `bookmarks` | `lessonId` | — | Bookmarked lessons |
| `projects` | `id` | `status` | Hands-on project progress |

---

## 9. Spaced Repetition Engine (SM-2)

Implemented in `src/lib/sm2.ts`. Follows original SuperMemo-2 specification:

- **Quality ratings**: 0 (Forgot) → 5 (Easy)
- **Interval progression**: 1 day → 6 days → `interval × easeFactor`
- **Ease factor**: starts 2.5, clamped to [1.3, 2.5]
- **Trigger**: wrong quiz answers automatically enter the review queue

---

## 10. Research Papers & Daily Reading Habit

**File**: `src/lib/groq-papers.ts`  
**View**: `src/views/ResearchPaperView.tsx`

### How the daily reading habit works

1. Learners are encouraged to read **4–5 seminal AI research papers** each day to ground hands-on code in original academic discoveries.
2. Progress is tracked via `localStorage` under key `ai_eng_daily_reading_YYYY-MM-DD`.
3. Reading is **non-blocking**: students can access and complete lessons anytime without restriction, ensuring 100% offline autonomy.
4. Each paper card includes key takeaways, phase alignments, and direct arXiv links.
5. Marking papers as read increments the daily progress ring and goal tracker.
6. The daily counter resets automatically each day at midnight (new date key).

### Paper Catalogue (12 seminal papers, bundled offline)
- Attention Is All You Need (Transformer)
- GPT-3 (Few-Shot Learners)
- InstructGPT / RLHF
- RAG (Lewis et al.)
- ReAct (Yao et al.)
- Chain-of-Thought (Wei et al.)
- LoRA
- Model Context Protocol (MCP)
- FlashAttention
- PagedAttention / vLLM
- Scaling Laws (Kaplan et al.)
- GPT-4 Technical Report

### Groq AI Features
- **AI Deep-Dive**: On-demand Groq LLaMA-3.3-70B analysis of any paper (Why it matters, core contribution, engineering implications, limitations, discussion questions)
- **AI Trends Feed**: 6-item AI trend briefing generated by Groq; cached per session, refreshable

---

## 11. AI Integration (Groq)

**Endpoint**: `https://api.groq.com/openai/v1/chat/completions`  
**Model**: `llama-3.3-70b-versatile`  
**API Key**: stored in `src/lib/groq-papers.ts` (rotate if compromised)

> ⚠️ The API key is embedded in the frontend bundle. For production, move to an environment variable or a BFF proxy. Current use is acceptable for local/desktop deployment.

Network calls only happen when the user explicitly clicks:
- "AI Deep-Dive" button on a paper card
- "AI Trends" tab + "Refresh" button

All other functionality (lesson reading, quiz, review, projects) is fully offline.

---

## 12. In-Browser Python Execution (Pyodide)

- Loaded lazily from CDN on first Python code block encounter
- Sandboxed within browser tab; no filesystem access
- stdout/stderr captured and displayed in terminal UI
- Execution time shown in milliseconds

---

## 13. Design System

**Color palette**:
- Background: `#f5f2eb` (light) / `#1c1b1a` (dark)
- Primary text: stone-900 / stone-100
- Accent: amber-700 / amber-400
- Projects: emerald-600
- Certifications: blue-600
- Research/AI: violet-700

**Typography**:
- `Inter` — UI and sans body
- `Newsreader` — serif reading mode

**Border radius**: `xl` / `2xl` for cards  
**Transition**: 200ms colors, 700ms progress rings

---

## 14. Component Reference

| Component | File | Purpose |
|---|---|---|
| `Navbar` | `components/Navbar.tsx` | 7-tab nav: Overview, Syllabus, Projects, Certs, Review, **Research**, controls |
| `AuthModal` | `components/AuthModal.tsx` | Multi-learner profile switcher & creation |
| `SettingsModal` | `components/SettingsModal.tsx` | Data export/import, reset |
| `SearchModal` | `components/SearchModal.tsx` | Fuzzy search (Ctrl+K) |
| `LearningPathsModal` | `components/LearningPathsModal.tsx` | Career route viewer |
| `QuizView` | `components/QuizView.tsx` | In-lesson quiz (pre/post) |
| `MarkdownRenderer` | `components/MarkdownRenderer.tsx` | MDX renderer with Mermaid + Pyodide |
| `CodeViewer` | `components/CodeViewer.tsx` | Syntax-highlighted code viewer |
| `ReadingControls` | `components/ReadingControls.tsx` | Font size, family, focus mode HUD |
| `StorageWarningBanner` | `components/StorageWarningBanner.tsx` | IDB unavailable warning |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | Per-view React error boundary |

---

## 15. View Reference

| View | File | Tab | Gate? |
|---|---|---|---|
| `DashboardView` | `views/DashboardView.tsx` | Study Overview | No |
| `PhasesView` | `views/PhasesView.tsx` | Syllabus | No |
| `LessonView` | `views/LessonView.tsx` | (from Syllabus) | **Yes — daily reading gate** |
| `ProjectsView` | `views/ProjectsView.tsx` | Projects | No |
| `CertificationsView` | `views/CertificationsView.tsx` | Certifications | No |
| `ReviewQueueView` | `views/ReviewQueueView.tsx` | Review Deck | No |
| `ResearchPaperView` | `views/ResearchPaperView.tsx` | **Research** | — (this IS the gate) |

---

## 16. Known Thresholds & Risk Areas

| Risk | Threshold | Mitigation |
|---|---|---|
| Groq API rate limit | 30 req/min for free tier | On-demand only; fallback to offline content |
| Groq API key exposure | Bundle visible in DevTools | Acceptable for local/desktop; use BFF proxy for public deployment |
| Daily gate per device | Gate is device-scoped, not user-scoped | Acceptable for single-device use; extend to per-userId key if needed |
| IDB unavailable | Safari Private, strict containers | `StorageWarningBanner` shown; UI still functions read-only |
| Large data files | `phase-XX-lessons.json` can be 2-5 MB | Vite code-split; lazy loaded per phase |
| Curriculum submodule | `curriculum/` is a separate git repo | `git -C curriculum pull origin main` to update |

---

## 17. What Could Crash & How to Recover

| Symptom | Likely Cause | Fix |
|---|---|---|
| "AI Deep-Dive" returns error | Groq API key expired or rate-limited | Wait 60s or rotate key in `groq-papers.ts` |
| Lessons still locked after reading 4 papers | Browser localStorage blocked | Check browser privacy settings; use non-private mode |
| Blank screen on lesson open | Lesson JSON not found (build stale) | Run `npm run build:data` |
| Quiz/review data lost | IDB wiped (browser clear data) | Import from `.json` backup via Settings |
| Electron app won't start | `dist/` missing | Run `npm run build` before `electron .` |

---

## 18. Development Workflow

```bash
# Start dev server
npm run dev

# Rebuild curriculum data
npm run build:data

# Run tests
npm test

# Start Electron in dev mode
npm run electron:dev

# Build full desktop installer
npm run electron:build
# Output: release/AI Engineering Study Companion Setup.exe
#         release/AI Engineering Study Companion Portable.exe
```

---

## 19. File Change Log

| Date | Version | Files Changed | Summary |
|---|---|---|---|
| 2026-09-30 | 1.2.0 | `src/lib/groq-papers.ts` (new), `src/views/ResearchPaperView.tsx` (new), `src/App.tsx`, `src/components/Navbar.tsx`, `src/types/index.ts`, `SYSTEM_DOCS.md`, `README.md` | Added Research Papers section with Groq AI analysis + daily reading gate (4 papers/day required to unlock lessons) |
| 2026-09-30 | 1.1.1 | `src/views/ProjectsView.tsx`, `src/views/CertificationsView.tsx`, `src/lib/curriculum-loader.ts` | Pulled 134 upstream commits (523 lessons, 48 projects, MCPA certs); re-indexed curriculum |
| 2026-08-21 | 1.1.0 | All | Initial multi-learner release |
