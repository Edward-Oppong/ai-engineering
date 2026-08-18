# AI Engineering Study Companion — System Documentation

> **Living Document** — Update this file whenever any source file is modified.  
> Last Updated: 2026-08-18  
> Version: 1.0.0  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [System Architecture](#4-system-architecture)
5. [Build Pipeline](#5-build-pipeline)
6. [Data Layer](#6-data-layer)
7. [IndexedDB Schema](#7-indexeddb-schema)
8. [Spaced Repetition Engine (SM-2)](#8-spaced-repetition-engine-sm-2)
9. [Design System](#9-design-system)
10. [Component Reference](#10-component-reference)
11. [View Reference](#11-view-reference)
12. [Known Thresholds & Risk Areas](#12-known-thresholds--risk-areas)
13. [What Could Crash & How to Recover](#13-what-could-crash--how-to-recover)
14. [Development Workflow](#14-development-workflow)
15. [File Change Log](#15-file-change-log)

---

## 1. Project Overview

A **fully offline, local-first web application** for self-paced study of the [AI Engineering from Scratch](https://github.com/rohitg00/ai-engineering-from-scratch) curriculum.

### Core Principles
- **Zero runtime network calls** — everything works with Wi-Fi off
- **All state in browser IndexedDB** — durable, queryable, survives page refreshes
- **Static deployment** — a single `dist/` folder, openable from any HTTP server or `file://`
- **503 lessons across 20 phases** indexed at build time, never fetched at runtime

### What It Does
| Feature | How |
|---|---|
| Read lessons | Markdown rendered client-side via `react-markdown` |
| Track progress | IndexedDB `lessons` store, per-lesson status |
| Take notes | Auto-saved per-lesson to IndexedDB |
| Knowledge checks | Multiple-choice quiz per lesson |
| Spaced repetition | Missed quiz questions scheduled via SM-2 algorithm |
| Offline search | `fuse.js` fuzzy search over all 503 lesson summaries |
| Mermaid diagrams | Rendered client-side, no CDN |
| Code syntax highlight | `prism-react-renderer`, no CDN |
| Dark/light mode | CSS variables + Tailwind `dark:` prefix, persisted in `localStorage` |

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | ^18.3.1 | UI component tree |
| Language | TypeScript | ^5.7.3 | Type safety |
| Bundler | Vite | ^6.1.0 | Dev server, production build, code splitting |
| Styling | Tailwind CSS | ^3.4.17 | Utility classes |
| CSS | Vanilla CSS (index.css) | — | Design tokens, markdown typography |
| Fonts | Inter, Newsreader (Google Fonts) | — | Via `index.html` `<link>` |
| Markdown | react-markdown + remark-gfm | ^9.0.3 / ^4.0.0 | Render lesson `.md` files |
| Diagrams | Mermaid | ^11.4.1 | Render architecture diagrams offline |
| Code highlight | prism-react-renderer | ^2.4.1 | Syntax highlighting, VS Dark theme |
| Icons | lucide-react | ^1.16.0 | All UI icons |
| Search | fuse.js | ^7.1.0 | Client-side fuzzy search |
| Storage | Native IndexedDB | Browser API | Durable local data |
| Build script | Node.js ESM | — | `scripts/index-curriculum.mjs` |

---

## 3. Directory Structure

```
Ai_engineering/
│
├── curriculum/                        # Source curriculum files (NOT bundled directly)
│   ├── ROADMAP.md                     # Master phase/lesson metadata
│   └── phases/
│       └── <phase-folder>/
│           └── <lesson-folder>/
│               ├── docs/en.md         # Lesson markdown content
│               ├── code/              # Runnable code examples
│               └── quiz.json          # Quiz questions (optional)
│
├── scripts/
│   └── index-curriculum.mjs           # BUILD-TIME ONLY: scans curriculum/ → writes src/data/
│
├── src/
│   ├── main.tsx                       # React entry point
│   ├── App.tsx                        # Root: routing, IndexedDB sync, dark mode
│   ├── index.css                      # Global styles, CSS tokens, markdown typography
│   ├── vite-env.d.ts                  # Vite type declarations (import.meta.glob)
│   │
│   ├── data/                          # GENERATED at build time — do NOT edit manually
│   │   ├── roadmap.json               # 20 phases metadata array
│   │   ├── lessons-summary.json       # All 503 lesson summaries (no markdown body)
│   │   └── phases/
│   │       ├── phase-00.json          # Full detail for Phase 0 (markdown + code + quiz)
│   │       ├── phase-01.json          # ...
│   │       └── phase-19.json
│   │
│   ├── types/
│   │   └── index.ts                   # ALL TypeScript interfaces and types
│   │
│   ├── lib/
│   │   ├── db.ts                      # IndexedDB data access layer (StudyDB class)
│   │   ├── sm2.ts                     # SuperMemo-2 spaced repetition algorithm
│   │   └── curriculum-loader.ts       # Lazy phase chunk loader + in-memory cache
│   │
│   ├── components/
│   │   ├── Navbar.tsx                 # Top navigation bar
│   │   ├── SearchModal.tsx            # Ctrl+K offline fuzzy search modal
│   │   ├── MarkdownRenderer.tsx       # Lesson markdown + Mermaid + code blocks
│   │   ├── CodeViewer.tsx             # Multi-file source code browser with tabs
│   │   └── QuizView.tsx               # Knowledge check quiz runner
│   │
│   └── views/
│       ├── DashboardView.tsx          # Study overview, stats, continue reading
│       ├── PhasesView.tsx             # Syllabus: phase selector + lesson directory
│       ├── LessonView.tsx             # Chapter reader with tabs and bottom nav
│       └── ReviewQueueView.tsx        # SM-2 spaced repetition flashcard deck
│
├── index.html                         # HTML shell (Google Fonts, meta tags)
├── tailwind.config.js                 # Tailwind theme extension
├── vite.config.ts                     # Vite config (base: './', React plugin)
├── tsconfig.json                      # TypeScript config (types: vite/client, node)
├── package.json                       # Dependencies and build scripts
├── SYSTEM_DOCS.md                     # ← THIS FILE
└── README.md                          # End-user setup and PowerShell instructions
```

---

## 4. System Architecture

### High-Level Data Flow

```
curriculum/phases/**/docs/en.md
          │
          ▼  (build time only)
scripts/index-curriculum.mjs
          │
          ├──► src/data/roadmap.json          (20 phase headers)
          ├──► src/data/lessons-summary.json  (503 lesson summaries, no body)
          └──► src/data/phases/phase-XX.json  (full lesson detail per phase)
                    │
                    ▼  (Vite bundles into dist/)
              Static dist/ folder
                    │
                    ▼  (browser loads)
              App.tsx (routing + state sync)
                    │
          ┌─────────┼──────────────────────────┐
          ▼         ▼                           ▼
   DashboardView  LessonView              ReviewQueueView
          │         │                           │
          │         ▼                           ▼
          │   curriculum-loader.ts         IndexedDB
          │   (lazy phase chunk)           reviewQueue store
          │         │
          │         ▼
          │   MarkdownRenderer.tsx
          │   CodeViewer.tsx
          │   QuizView.tsx
          │         │
          └─────────▼
                IndexedDB (db.ts)
                ├── lessons store
                ├── quizAttempts store
                ├── reviewQueue store
                └── activityLog store
```

### Routing
The app uses **hash-based routing** (`window.location.hash`), not React Router. Navigation is handled in `App.tsx` via `hashchange` event listener and `useState`:

| Hash | View |
|---|---|
| `#dashboard` or empty | DashboardView |
| `#phases` | PhasesView |
| `#phase-XX` | PhasesView (with that phase pre-selected) |
| `#lesson-<lessonId>` | LessonView |
| `#review` | ReviewQueueView |

### State Management
No Redux or Zustand. State lives in:
1. **React `useState`** — transient UI state (active tab, search query, loaded lesson)
2. **Browser IndexedDB** — all persistent user data
3. **`localStorage`** — only theme preference (`theme: 'dark' | 'light'`)
4. **In-memory Map** — `phaseCache` in `curriculum-loader.ts` for loaded phase JSON chunks

---

## 5. Build Pipeline

### Commands

| Command | What It Does |
|---|---|
| `npm run dev` | Vite dev server at `http://localhost:5173` with HMR |
| `npm run build` | Runs `build:data` → `tsc -b` → `vite build` |
| `npm run build:data` | Runs `scripts/index-curriculum.mjs` only |
| `npm run preview` | Serves `dist/` at `http://localhost:4173` |

### PowerShell Equivalents
```powershell
# Build (PowerShell)
npm run build

# Preview after build (PowerShell)
npm run preview
```

### Build Step 1 — Curriculum Indexer (`scripts/index-curriculum.mjs`)
- Reads `curriculum/ROADMAP.md` → parses phase metadata
- Walks all `curriculum/phases/<phase>/<lesson>/docs/en.md` files
- Reads `curriculum/phases/<phase>/<lesson>/quiz.json` if present
- Reads all files under `curriculum/phases/<phase>/<lesson>/code/`
- Extracts H2 "beats" (section headings) for in-chapter navigation
- Outputs:
  - `src/data/roadmap.json` — array of 20 `PhaseMetadata` objects
  - `src/data/lessons-summary.json` — array of 503 `LessonSummary` objects (no markdown body)
  - `src/data/phases/phase-00.json` through `phase-19.json` — full `PhaseChunk` per phase

### Build Step 2 — TypeScript Compile (`tsc -b`)
- Validates all TypeScript across `src/`
- Fails if type errors exist

### Build Step 3 — Vite Production Build (`vite build`)
- Tree-shakes, minifies, and code-splits into `dist/assets/`
- Phase JSON files become lazy-loaded JS chunks (dynamic `import()`)
- Output: `dist/index.html` + `dist/assets/*.{js,css}`

### Bundle Size Note
> ⚠️ Some phase chunks are large (phase-19 = ~2.5 MB minified). This is expected — they contain full lesson markdown, code file contents, and quiz data. These are loaded lazily on demand.

---

## 6. Data Layer

### `src/lib/curriculum-loader.ts`

Exports three things:

```typescript
export const roadmap: PhaseMetadata[]        // Eagerly loaded at startup
export const lessonsSummary: LessonSummary[] // Eagerly loaded at startup (~520 KB JSON)
export async function loadLessonDetail(lessonId: string): Promise<{lesson, phase} | null>
export function getAdjacentLessons(lessonId: string): { prev, next }
```

**Caching**: Phase chunks are cached in a module-level `Map<string, PhaseChunk>`. Once loaded, a phase is never re-fetched for the session lifetime.

### `src/data/lessons-summary.json`
- Size: ~520 KB
- Eagerly imported at module load — this is the search index
- Contains everything *except* the markdown body and code file content

---

## 7. IndexedDB Schema

**Database Name**: `ai_engineering_study_db`  
**Version**: `1`

> ⚠️ Incrementing `DB_VERSION` triggers `onupgradeneeded`. Structural changes to stores require a version bump or the old database must be deleted manually (DevTools → Application → IndexedDB).

### Object Stores

#### `lessons`
| Field | Type | Key |
|---|---|---|
| `id` | string | keyPath (primary) |
| `phaseId` | string | Index |
| `status` | `'not_started' \| 'in_progress' \| 'completed'` | Index |
| `notes` | string | — |
| `completedAt` | ISO string | Index |
| `lastViewedAt` | ISO string | — |
| `timeSpentSeconds` | number | — |

#### `quizAttempts`
| Field | Type | Key |
|---|---|---|
| `id` | string (lessonId + timestamp) | keyPath |
| `lessonId` | string | Index |
| `score` | number (0–100) | — |
| `totalQuestions` | number | — |
| `correctCount` | number | — |
| `answeredAt` | ISO string | Index |

#### `reviewQueue`
| Field | Type | Key |
|---|---|---|
| `id` | string (lessonId + questionIndex) | keyPath |
| `questionId` | string | Index |
| `lessonId` | string | Index |
| `dueDate` | YYYY-MM-DD string | Index |
| `repetitions` | number | — |
| `interval` | number (days) | — |
| `easeFactor` | number (≥ 1.3) | — |
| `lastQualityRating` | number (0–5) | — |

#### `activityLog`
| Field | Type | Key |
|---|---|---|
| `date` | YYYY-MM-DD string | keyPath (primary) |
| `count` | number | — |

### `db.ts` — Key Methods

| Method | Description |
|---|---|
| `db.markLessonViewed(info)` | Creates/updates lesson record → status `in_progress`, logs activity |
| `db.setLessonStatus(info, status)` | Sets `completed` or `in_progress` |
| `db.updateLessonNotes(info, notes)` | Debounced auto-save from textarea |
| `db.saveQuizAttempt(attempt)` | Persists full quiz attempt |
| `db.saveReviewItems(items[])` | Adds new SM-2 items to `reviewQueue` |
| `db.getDueReviewItems()` | Returns items where `dueDate <= today` |
| `db.calculateStreak()` | Counts consecutive days in `activityLog` |

---

## 8. Spaced Repetition Engine (SM-2)

File: `src/lib/sm2.ts`

### Algorithm

Implements the classic SuperMemo-2 algorithm:

```
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
EF' = max(1.3, EF')

If q >= 3 (correct):
  rep 0 → interval = 1 day
  rep 1 → interval = 6 days
  rep n → interval = round(previous_interval × EF')
  repetitions += 1

If q < 3 (incorrect):
  repetitions = 0
  interval = 1 day
```

### Quality Rating Scale (UI Labels)
| Button | Quality | SM-2 Meaning |
|---|---|---|
| Forgot | 1 | Complete failure — reset streak |
| Hard | 3 | Correct but significant difficulty |
| Good | 4 | Correct with some hesitation |
| Easy | 5 | Perfect recall, effortless |

### Thresholds
- **Ease Factor minimum**: 1.3 (clamped — prevents interval from collapsing to zero)
- **Initial Ease Factor**: 2.5
- **"Mastered" heuristic** (UI only): `repetitions >= 3`
- **New items**: Created only when a quiz answer is *wrong*
- **Due check**: `dueDate <= today` (YYYY-MM-DD string comparison)

---

## 9. Design System

File: `src/index.css`

### CSS Custom Properties (Tokens)

#### Light Mode (`:root`)
```css
--bg-page:             #faf9f6   /* Warm paper background */
--bg-surface:          #ffffff   /* Card surfaces */
--bg-surface-elevated: #f5f4ef   /* Hover states, nested containers */
--bg-surface-hover:    #edebe4
--border-color:        #e5e2da   /* Standard borders */
--border-subtle:       #eeece5   /* Dividers */
--text-primary:        #1c1917   /* Headings, strong text */
--text-secondary:      #57534e   /* Body text */
--text-muted:          #78716c   /* Labels, meta, captions */
--code-bg:             #f4f2ea   /* Inline code backgrounds */
--code-border:         #e2ded4
```

#### Dark Mode (`.dark`)
```css
--bg-page:             #0c0a09   /* Deep obsidian */
--bg-surface:          #171513   /* Card surfaces */
--bg-surface-elevated: #211e1b
--bg-surface-hover:    #2b2723
--border-color:        #2c2824
--border-subtle:       #211e1b
--text-primary:        #f5f5f4
--text-secondary:      #d6d3d1
--text-muted:          #a8a29e
--code-bg:             #141210
--code-border:         #282420
```

### Semantic Learning Color System

| State | Meaning | Light color | Dark color |
|---|---|---|---|
| Brand / Primary action | Amber | `#b45309` | `#d97706` |
| Mastered / Completed | Emerald green | `#15803d` | `#22c55e` |
| In Progress / Reading | Sky blue | `#0369a1` | `#38bdf8` |
| Practice / Knowledge Check | Indigo-purple | `#6d28d9` | `#c084fc` |
| Not Started / Unread | Stone muted | `#78716c` | `#a8a29e` |

These colors appear **only** in:
- Progress bars
- Lesson status badges (`.badge-mastered`, `.badge-inprogress`, `.badge-unread`, `.badge-practice`)
- Knowledge check headers and submit buttons
- Dashboard review deck card icon

### Typography Rules
| Element | Font | Usage |
|---|---|---|
| Lesson titles, chapter headings, motto quotes | `Newsreader` (serif) | All `h1`, `h2`, lesson title, motto, dashboard headings |
| UI chrome | `Inter` (sans-serif) | Navbar, buttons, labels, badges, metadata |
| Code | `Fira Code` / `JetBrains Mono` | All `<code>` and `<pre>` blocks |

### Dark Mode Toggle
- Controlled by `darkMode` state in `App.tsx`
- Adds/removes `class="dark"` on `<html>` element
- Persisted to `localStorage` key `theme` (`'dark'` or `'light'`)
- Default: dark mode (fallback if no saved preference)

---

## 10. Component Reference

### `Navbar.tsx`
**Props**: `currentTab`, `onSelectTab`, `onOpenSearch`, `streakCount`, `dueReviewCount`, `darkMode`, `onToggleDarkMode`  
**Renders**: Logo, tabs (Study Overview / Syllabus / Spaced Review), search button, streak badge, theme toggle  
**Mobile**: Separate bottom tab bar for small screens  

### `SearchModal.tsx`
**Props**: `isOpen`, `onClose`, `onSelectLesson`, `completedLessonIds`  
**Trigger**: `Ctrl+K` / `Cmd+K` keyboard shortcut  
**Search Engine**: `fuse.js` over `lessonsSummary` (loaded eagerly)  
**Fields searched**: `title` (weight 0.4), `motto` (0.2), `phaseTitle` (0.2), `tags` (0.1), `slug` (0.1)  
**Threshold**: `0.35` — lower = stricter match  
**Max results shown**: 50  
**Keyboard navigation**: `↑` / `↓` / `Enter` / `Esc`  

### `MarkdownRenderer.tsx`
**Props**: `content: string`  
**Renders**: All GFM markdown including tables, task lists, strikethrough  
**Special handling**:
- ` ```mermaid ` blocks → `MermaidBlock` component (client-side SVG render)
- All other code blocks → `CodeBlock` with `prism-react-renderer` (VS Dark theme, line numbers)
- Terminal blocks (`bash`, `sh`, `shell`) → labeled "Terminal (Bash / PowerShell)"
- `powershell` / `pwsh` / `ps1` → labeled "PowerShell"
- Headings → generate anchor `id` attributes for in-page navigation

### `CodeViewer.tsx`
**Props**: `files: CodeFile[]`  
**Renders**: Tabbed file viewer with VS Dark code display  
**Header**: "Practice Code Files" + file count badge  
**Tab indicator**: Active tab uses neutral stone top border (not amber)  
**Max height**: `550px` with vertical scroll  

### `QuizView.tsx`
**Props**: `quiz`, `lessonId`, `phaseId`, `lessonTitle`, `onQuizCompleted`  
**Header color**: Purple (semantic practice color)  
**Submit button**: Purple "Check Answers" → saves attempt + schedules wrong answers in SM-2 review queue  
**Score**: Shown in green if ≥ 70%, red if < 70%  
**On wrong answer**: Calls `createNewReviewItem()` → saved via `db.saveReviewItems()`  

---

## 11. View Reference

### `DashboardView.tsx`
Metric cards: Study Habit (streak), Completed, In Progress, Review Deck due count  
Progress bars on phase cards: green = mastered, sky = in-progress, stone = unread  
"Continue Chapter" card: last-viewed lesson by timestamp  

### `PhasesView.tsx`
Left sidebar: Phase selector (00–19). Active = stone border, completed = emerald icon badge  
Right panel: Lesson list with status badges (`.badge-mastered` etc.), filter tabs, in-phase search  
Status filter: All / Not Started / In Progress / Completed  

### `LessonView.tsx`
Top subnav: Phase breadcrumb → tab switcher  
**Tabs**:
- **Read** — markdown body + embedded code + embedded knowledge check
- **Practice Code (N)** — standalone code file viewer
- **Knowledge Check** — standalone quiz (purple accent)

Section nav: "In this chapter:" links to H2 anchors  
Notes area: Auto-saves to IndexedDB with 800ms debounce  
Bottom bar (fixed): Prev chapter | **Mark Lesson as Read** (amber) or **Lesson Complete — Click to Undo** (green) | Next chapter  

### `ReviewQueueView.tsx`
Two tabs: **Due Today (N)** / **All Cards (N)**  
Flashcard: Question → tap option → reveal explanation → rate recall (Forgot / Hard / Good / Easy)  
Each rating button previews the next interval in days  
All Cards table: shows dueDate, interval, repetition count per card  

---

## 12. Known Thresholds & Risk Areas

### Memory / Performance Thresholds

| Item | Current Size | Risk |
|---|---|---|
| `lessons-summary.json` | ~520 KB | Eagerly loaded — fine for modern browsers, slow on very old hardware |
| `phase-19.json` (largest chunk) | ~2.5 MB minified | Lazy loaded on demand — browser must parse ~2.5 MB of JS on first access |
| Fuse.js index | Built from all 503 summaries at runtime | ~1–3 ms to build, negligible |
| Mermaid render | Per diagram | Mermaid can freeze UI for complex diagrams (>50 nodes) — renders async |
| IndexedDB transactions | Unbounded lesson/quiz records | No enforced limit — browser typically allows 50–500 MB of IDB storage |

### IndexedDB Limits
- **Storage quota**: Browsers typically allow 50% of available disk or ~500 MB minimum
- **No cleanup is implemented** — `reviewQueue` and `quizAttempts` grow indefinitely
- **Safari private mode**: IndexedDB is disabled entirely — the app will fail to persist any progress

### Code Splitting Warning
Vite warns: *"Some chunks are larger than 1000 kB"* — this is expected and non-breaking. The chunks are lazy-loaded so initial page load is unaffected.

### Fuse.js Search Threshold
`threshold: 0.35` — if lowered toward 0, results become very strict and users may get no results. If raised toward 1.0, results become too broad and irrelevant. Current value is tuned for curriculum content.

### SM-2 Edge Cases
- **EaseFactor floor**: 1.3 — prevents intervals from ever reaching 0
- **All-wrong scenario**: A user who rates everything "Forgot" will have all items due daily — this is correct SM-2 behavior, not a bug
- **Clock skew**: If the system clock is wrong, due dates will be incorrect

---

## 13. What Could Crash & How to Recover

### 🔴 CRITICAL: `src/data/` files deleted or corrupted
**Symptom**: App loads with empty curriculum, no lessons visible  
**Cause**: `src/data/*.json` files are generated, not committed — if deleted without rebuilding  
**Fix**: Run `npm run build:data` to regenerate  
**Prevention**: Never `.gitignore` `src/data/` unless build step runs in CI

---

### 🔴 CRITICAL: `DB_VERSION` incremented without migration
**Symptom**: Users lose all progress, blank IndexedDB  
**Cause**: Bumping `DB_VERSION` in `db.ts` triggers `onupgradeneeded`. The current code creates new stores but does not migrate existing data.  
**Fix**: Add a data migration block inside `onupgradeneeded` before incrementing version  
**Current version**: `1`

---

### 🟠 HIGH: Mermaid fails to render a diagram
**Symptom**: Diagram shows "Diagram Note:" fallback with raw chart text  
**Cause**: Invalid Mermaid syntax in a lesson's markdown file  
**Fix**: The error is gracefully caught and displays the raw chart text — no crash  
**Prevention**: Validate `.md` files before committing to curriculum

---

### 🟠 HIGH: Phase chunk fails to load
**Symptom**: Lesson page shows "Lesson Not Found" state  
**Cause**: `curriculum-loader.ts` → `loadPhaseChunk()` returns `null` if the JSON is malformed or missing  
**Fix**: Re-run `npm run build:data && npm run build`

---

### 🟡 MEDIUM: `lessons-summary.json` grows too large
**Symptom**: Slow initial app load, high memory usage  
**Current size**: ~520 KB  
**Threshold**: Watch for > 2 MB — consider splitting into phase-level summary chunks  
**Trigger**: Adding many more lessons to the curriculum

---

### 🟡 MEDIUM: IndexedDB unavailable (Safari Private / Firefox strict mode)
**Symptom**: All progress lost, notes don't save, no streak, no review queue  
**Cause**: Browser blocks IndexedDB in certain privacy modes  
**Current behavior**: `db.ts` calls will fail silently (unhandled rejections in console)  
**Fix**: Add try/catch around all `db.*` calls in `App.tsx` with a user-visible warning banner  
**Status**: Not yet implemented

---

### 🟡 MEDIUM: `import.meta.glob` resolves zero modules
**Symptom**: All lessons 404, `phaseModules` is empty  
**Cause**: `src/data/phases/` is empty (no build was run)  
**Fix**: Run `npm run build:data` first  
**TypeScript note**: `tsconfig.json` must include `"types": ["vite/client", "node"]` for `import.meta.glob` to type-check

---

### 🟢 LOW: Fuse.js returns too many/few results
**Symptom**: Search feels inaccurate  
**Cause**: `threshold` value in `SearchModal.tsx` tuned incorrectly  
**Fix**: Adjust `threshold` between `0.2` (strict) and `0.5` (loose). Current: `0.35`

---

### 🟢 LOW: Theme doesn't persist across sessions
**Symptom**: App always starts in dark mode regardless of preference  
**Cause**: `localStorage` access failing or key mismatch  
**Current key**: `localStorage.getItem('theme')` checked in `App.tsx` initial state  
**Fix**: Verify key is `'theme'` and values are `'dark'` or `'light'`

---

## 14. Development Workflow

### First Time Setup

```powershell
# Install dependencies
npm install

# Build curriculum data index
npm run build:data

# Start dev server
npm run dev
```

### Making Code Changes (Dev Mode)
```powershell
npm run dev
# App at http://localhost:5173
# HMR updates automatically — no rebuild needed for component changes
```

### After Adding New Lessons to `curriculum/`
```powershell
# Re-index curriculum (must do this whenever markdown files change)
npm run build:data

# Then restart dev server or rebuild
npm run dev
```

### Production Build (Web / Static)
```powershell
npm run build
# Output: dist/

# Preview the production bundle locally
npm run preview
# App at http://localhost:4173
```

### Desktop Application (Electron)
```powershell
# Run the desktop app locally from the production build
npm run electron:start

# Package into a standalone Windows .exe (installer + portable)
npm run electron:build
# Output: release/AI Engineering Study Companion Setup 1.0.0.exe
```

### TypeScript Errors
```powershell
# Check types without building
npx tsc --noEmit
```

### Clear All User Progress (Development Reset)
Open browser DevTools → Application → IndexedDB → `ai_engineering_study_db` → Delete Database

---

## 15. File Change Log

> Update this section every time a file is modified. Format: `YYYY-MM-DD | file | summary of change`

| Date | File | Change |
|---|---|---|
| 2026-08-18 | `src/index.css` | Added semantic learning token system (mastered/inprogress/practice/unread CSS vars + badge utility classes). Refined markdown typography. Established warm editorial light/dark tokens. |
| 2026-08-18 | `src/components/Navbar.tsx` | Renamed tabs to Study Overview / Syllabus / Spaced Review. Removed all amber from nav chrome. |
| 2026-08-18 | `src/views/DashboardView.tsx` | Semantic progress bars (green=mastered, sky=in-progress, stone=unread). Phase card progression system. Review deck uses purple icon. Continue card uses purposeful button copy. |
| 2026-08-18 | `src/views/PhasesView.tsx` | Phase selector uses stone active state (not amber). Completed phases show green badge number. Lesson list uses `.badge-*` CSS classes. |
| 2026-08-18 | `src/views/LessonView.tsx` | Tabs renamed: Read / Practice Code / Knowledge Check. Knowledge Check tab uses purple icon. Section nav copy: "In this chapter:". Bottom bar: "Mark Lesson as Read" / "Lesson Complete — Click to Undo". |
| 2026-08-18 | `src/views/ReviewQueueView.tsx` | Clean light/dark theme pass. Recall rating buttons use semantic colors (red/amber/blue/green). |
| 2026-08-18 | `src/components/QuizView.tsx` | Header changed to "Knowledge Check" in purple. Submit button changed to purple "Check Answers". Score shown in green/red based on ≥70% threshold. |
| 2026-08-18 | `src/components/MarkdownRenderer.tsx` | Terminal icon neutralized to stone. "Copied" state changed to emerald green. |
| 2026-08-18 | `src/components/CodeViewer.tsx` | Header renamed to "Practice Code Files". Active tab indicator changed from amber to stone border. FileCode icon neutralized to stone. |
| 2026-08-18 | `src/components/SearchModal.tsx` | Full light/dark pass. Editorial layout with lesson phase/chapter metadata in results. |
| 2026-08-18 | `SYSTEM_DOCS.md` | **Initial creation** of this living documentation file. |
| 2026-08-18 | `src/components/ErrorBoundary.tsx` | Added React ErrorBoundary with graceful recovery UI. |
| 2026-08-18 | `src/components/StorageWarningBanner.tsx` | Added non-intrusive alert when IndexedDB is blocked. |
| 2026-08-18 | `vite.config.ts` | Added `vite-plugin-pwa` with Workbox offline cache. |
| 2026-08-18 | `src/lib/db.ts` | Added `StudyDB.isAvailable()` check, 50k character notes cap, and review activity streak logging. |
| 2026-08-18 | `tests/sm2.test.ts` | Added 16 unit tests for SM-2 algorithm edge cases. |
| 2026-08-18 | `src/index.css` | Complete overhaul to organic human editorial design (warm paper `#fbfbfa`, warm charcoal `#1c1b1a`, bookish typography, zero neon AI borders). |
| 2026-08-18 | `src/components/Navbar.tsx` | Typographic wordmark, clean text navigation, removed flame icon and glowing pills. |
| 2026-08-18 | `src/views/DashboardView.tsx` | Clean reading desk layout, removed glowing pill badge and chunky SaaS metric cards. |
| 2026-08-18 | `src/views/LessonView.tsx` | Clean distraction-free reading column, quiet breadcrumbs, and subtle action bar. |
| 2026-08-18 | `src/components/QuizView.tsx` | Removed purple glowing elements, clean assessment card with quiet buttons. |
| 2026-08-18 | `src/views/ReviewQueueView.tsx` | Minimalist study deck and flashcard recall interface. |
| 2026-08-18 | `src/components/SearchModal.tsx` | Compact, quiet search dialog matching the human editorial palette. |
| 2026-08-18 | `public/illustrations/` | Added 3 bespoke technical lithograph artworks (`monograph-cover.jpg`, `transformers.jpg`, `agents.jpg`) in MIT/Stripe Press academic monograph style. |
| 2026-08-18 | `src/views/DashboardView.tsx` | Added 5 connected curriculum milestones, domain color badges, and editorial split hero card with monograph illustration. |
| 2026-08-18 | `src/views/PhasesView.tsx` | Grouped 20 tracks into 5 connected milestones with domain badges and sequential track navigation. |
| 2026-08-18 | `src/views/LessonView.tsx` | Added domain milestone breadcrumb, ReadingControls, Focus Mode, Bookmarks, and Next Chapter connection card. |
| 2026-08-18 | `src/components/SettingsModal.tsx` | Added JSON backup export, file restore, storage stats, and database reset modal. |
| 2026-08-18 | `src/components/ReadingControls.tsx` | Added floating reading toolbar for font sizing (S/M/L/XL), font style (Serif/Sans), column width, and focus mode. |
| 2026-08-18 | `src/lib/pyodide-runner.ts` | Added Pyodide WebAssembly runner for in-browser Python execution with stdout/stderr capture. |
| 2026-08-18 | `src/components/CodeViewer.tsx` | Added 'Run in Browser' action for Python files with interactive terminal output console. |
| 2026-08-18 | `.github/workflows/deploy.yml` | Added GitHub Actions workflow for automated static GitHub Pages deployment. |
