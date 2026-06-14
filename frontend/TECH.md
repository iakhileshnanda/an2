<!--
═══════════════════════════════════════════════════════════════
PRE-REFACTOR AUDIT (Task 1)
Performed before any changes were made.
═══════════════════════════════════════════════════════════════

INLINE STYLES FOUND:
────────────────────
1. GestureZones.jsx — BAR style object (fontFamily, fontSize, letterSpacing,
   textTransform, color, fontWeight), BG/TRANSITION constants, position/layout
   on left/right/bottom bars, opacity, zIndex, cursor, flex, gap
2. AiTerminal.jsx — Every element had inline styles: fontFamily, fontSize,
   color, letterSpacing, textTransform, margins, flex layout, padding,
   background, border, outline, caretColor, cursor, gap, lineHeight,
   whiteSpace, fontStyle
3. OpeningScene.jsx — h1 fontSize clamp, h2 fontSize/letterSpacing/opacity,
   p fontSize clamp
4. OriginScene.jsx — span fontSize clamp, letterSpacing, WebkitTextStroke,
   WebkitTextFillColor
5. WorkScene.jsx — h2 fontSize clamp, letterSpacing
6. AwakeningScene.jsx — 3x h2 fontSize clamp, letterSpacing
7. LiveScene.jsx — h2 fontSize clamp, letterSpacing, DataCell color
8. AskScene.jsx — h2 fontSize/letterSpacing, p fontSize
9. Terminal.jsx — wrapper fontFamily, span color #00FF41
10. Nav.jsx — nav background, backdropFilter, pointerEvents
11. PasswordGate.jsx — input fontFamily, span color #FF3333
12. WorldTransition.jsx — fragment border, bar top/height/background
13. All 7 Chapter components — section background/color, watermark fontSize/
    color/opacity, title fontSize/color, divider background, photo placeholder
    gradients, Japanese text color/opacity, translation text color/opacity

HARDCODED COLORS FOUND:
───────────────────────
- #000000 / #000 — index.css body, Hero.css .hero, multiple components
- #FFFFFF / #FFF / white — index.css selection, glitch-bar, AiTerminal, etc.
- #c8a96e — Hero.css .first (gold)
- #d4af37 — GestureZones.jsx BAR (gold variant — INCONSISTENCY)
- #3a3a3a — Hero.css .last (gold muted)
- #00FF41 — Terminal.jsx, LiveScene.jsx (terminal green)
- #FF3333 — AiTerminal.jsx, PasswordGate.jsx (red)
- #555 / #555555 — AiTerminal.jsx, scrollbar hover
- #888 / #888888 — AiTerminal.jsx, Hero.css tagline
- #444 — AiTerminal.jsx
- #333333 — index.css scrollbar thumb
- rgba(255,255,255,0.08) — GestureZones.jsx BG
- rgba(255,255,255,0.15) — GestureZones.jsx borders
- rgba(255,255,255,0.1) — WorldTransition.jsx fragment border
- #FFF3E0, #FF6B35, #1A0A00 — ChapterChild (and WorldTransition flood)
- #E8F4FD, #1565C0, #0A1628 — ChapterCollege
- #FCE4EC, #C2185B, #1A0010 — ChapterLove
- #E8F5E9, #2E7D32, #001A00 — ChapterPlaces
- #F3E5F5, #7B1FA2, #1A0028 — ChapterMusic
- #FFF8E1, #E65100, #1A0800 — ChapterBeliefs
- #FAFAFA, #5D4037, #1C1008 — ChapterLetter

HARDCODED FONT SIZES FOUND:
────────────────────────────
- 18px — GestureZones BAR
- 14px — GestureZones bottom label
- 0.6rem, 0.7rem, 0.72rem, 1rem, 1.1rem, 1.25rem — AiTerminal various
- 10px — AskScene easter egg hint
- 11px — Hero.css tagline
- clamp(3rem,15vw,16rem) — OpeningScene h1
- clamp(2rem,8vw,8rem) — OpeningScene h2, WorkScene, AskScene, AwakeningScene
- clamp(0.6rem,1.2vw,1rem) — OpeningScene subtitle
- clamp(4rem,15vw,18rem) — OriginScene year
- clamp(2.5rem,10vw,10rem) — AwakeningScene lines
- clamp(2rem,6vw,6rem) — LiveScene title
- clamp(52px,12vw,85px) — Hero.css .first
- clamp(46px,9vw,60px) — Hero.css .last
- clamp(6rem,20vw,22rem) — all chapter watermarks
- clamp(3rem,10vw,10rem) — all chapter titles

REPEATED PATTERNS FOUND:
─────────────────────────
1. IntersectionObserver setup — identical in all 7 chapters (observe element,
   call setCurrentChapter on intersecting, threshold 0.3)
2. Chapter structure — every chapter: section > watermark div > title >
   divider > content > Japanese text > romaji translation
3. Scene section pattern — scene-section min-h-screen bg-black flex
   items-center with scroll-driven animations
4. fontFamily: '"JetBrains Mono", monospace' — repeated in GestureZones,
   AiTerminal, Terminal, PasswordGate (all should use token)
5. Motion animation config — initial/whileInView/viewport/transition
   with similar values across all chapters
6. font-code/font-monument/font-human classes — used consistently but
   fonts also set inline in some components

INCONSISTENCIES FOUND:
──────────────────────
1. Gold color mismatch: #c8a96e (Hero) vs #d4af37 (GestureZones)
2. Tagline font: bare 'monospace' in Hero.css vs "JetBrains Mono" elsewhere
3. Selection color: white bg / black text — should be gold per design intent
4. z-index chaos: 9500 (PasswordGate), 10001/10002 (AiTerminal/GestureZones),
   9000 (Nav), 8000 (WorldTransition), 9999 (FilmGrain) — no consistent scale
5. Mixed styling: some components use only Tailwind, some only inline styles,
   some both — no consistency
6. Font declaration: fontFamily set inline in JSX duplicating CSS classes

═══════════════════════════════════════════════════════════════
-->

# A.NANDA PORTFOLIO — TECHNICAL DOCUMENTATION

## What This Is

This is not a traditional portfolio. It is a **cinematic, scroll-driven, dual-world experience** that presents two narratives:

- **System Mode** — A dark, cinematic, developer-focused experience. Black backgrounds, white text, particle animations, terminal aesthetics, monospace typography. Presents the professional identity: skills, projects, live data, and an AI terminal.

- **Human Mode** — A warm, editorial, personal experience. Colored backgrounds, serif typography, photo placeholders, and 7 life chapters. Presents the human story behind the developer.

Users navigate between worlds using **gesture zones** (invisible hover areas on screen edges) instead of traditional buttons. Typing the Easter egg phrase `system.human` triggers a password gate → world transition. The transition features glitch bars, fragmenting rectangles, and a color flood animation.

---

## Tech Stack

| Technology | Version | Why Used | Where Used |
|---|---|---|---|
| React | 19.2 | UI framework, component architecture | Everywhere |
| Vite | 8.0 | Build tool, dev server, path aliases | Build pipeline |
| Three.js | 0.183 | 3D particle animation | OpeningScene (particle text) |
| Framer Motion | 12.36 | Scroll-driven animations, transitions | All scenes, chapters, WorldTransition |
| anime.js | 3.2 | Number counters, shake effects | OriginScene, LiveScene, PasswordGate |
| Zustand | 5.0 | Global state management | Mode, transitions, terminal, scroll |
| Tailwind CSS | 3.4 | Utility-first styling | Layout, spacing, responsive |
| CSS Modules | — | Component-scoped styles | All components (post-refactor) |
| CSS Custom Properties | — | Design tokens | tokens.css → all modules |
| React Router | 7.13 | Installed but unused | — |

---

## Folder Structure

```
src/
├── App.jsx                          ← Root component, mode switching, Easter egg listener
├── main.jsx                         ← React entry point, imports global.css
│
├── styles/
│   ├── tokens.css                   ← ALL design tokens (colors, fonts, spacing, z-index, animation)
│   ├── fonts.css                    ← @font-face declarations (PastorOfMuppets + Google Fonts)
│   └── global.css                   ← CSS reset, base styles, utility classes, animations
│
├── store/
│   └── useStore.js                  ← Zustand store (mode, transitions, terminal, scroll, chapter)
│
├── hooks/
│   └── .gitkeep                     ← Reserved for extracted hooks (Phase 2)
│
├── constants/
│   ├── scenes.js                    ← System mode scene names and order
│   ├── chapters.js                  ← Human mode chapter metadata (titles, Japanese text)
│   └── liveData.js                  ← Live Now section mock data (Oracle, Nanobot stats)
│
├── components/
│   ├── FilmGrain.jsx                ← SVG noise overlay for System mode
│   ├── gesture/
│   │   ├── GestureZones.jsx         ← Left/right/bottom hover navigation bars
│   │   └── GestureZones.module.css
│   ├── terminal/
│   │   ├── AiTerminal.jsx           ← Full-screen AI chat terminal (fetches /api/chat)
│   │   └── AiTerminal.module.css
│   ├── nav/
│   │   ├── Nav.jsx                  ← Top navigation bar (mode-aware)
│   │   └── Nav.module.css
│   ├── transition/
│   │   ├── WorldTransition.jsx      ← Glitch + fragment + flood transition between worlds
│   │   └── WorldTransition.module.css
│   └── password/
│       ├── PasswordGate.jsx         ← Password input to enter Human mode
│       └── PasswordGate.module.css
│
├── system/
│   ├── SystemWorld.jsx              ← System mode layout, lazy-loads all scenes
│   ├── Hero/
│   │   ├── index.jsx                ← PastorOfMuppets font hero with mirrored letters
│   │   └── Hero.module.css
│   └── scenes/
│       ├── OpeningScene/
│       │   ├── index.jsx            ← Three.js particle explosion → text formation
│       │   └── OpeningScene.module.css
│       ├── OriginScene/
│       │   ├── index.jsx            ← "2019" origin story with day counter (anime.js)
│       │   └── OriginScene.module.css
│       ├── WorkScene/
│       │   ├── index.jsx            ← Project cards with scroll-driven slide-in
│       │   └── WorkScene.module.css
│       ├── AwakeningScene/
│       │   ├── index.jsx            ← "One Night. Zero Backend. One Agent." + terminal
│       │   ├── AwakeningScene.module.css
│       │   ├── Terminal.jsx          ← Animated terminal typing simulation
│       │   └── Terminal.module.css
│       ├── LiveScene/
│       │   ├── index.jsx            ← Live data grid with animated counters
│       │   └── LiveScene.module.css
│       └── AskScene/
│           ├── index.jsx            ← CTA section with "TALK TO MY AI" + Easter egg hint
│           └── AskScene.module.css
│
├── human/
│   ├── HumanWorld.jsx               ← Human mode layout, renders all 7 chapters
│   └── chapters/
│       ├── ChapterChild/
│       │   ├── index.jsx            ← Chapter 00: childhood, curiosity, photo placeholders
│       │   └── ChapterChild.module.css
│       ├── ChapterCollege/
│       │   ├── index.jsx            ← Chapter 01: college years, friendship
│       │   └── ChapterCollege.module.css
│       ├── ChapterLove/
│       │   ├── index.jsx            ← Chapter 02: love (held in reserve)
│       │   └── ChapterLove.module.css
│       ├── ChapterPlaces/
│       │   ├── index.jsx            ← Chapter 03: Hyderabad, Bangalore, Tokyo map
│       │   └── ChapterPlaces.module.css
│       ├── ChapterMusic/
│       │   ├── index.jsx            ← Chapter 04: music timeline cards
│       │   └── ChapterMusic.module.css
│       ├── ChapterBeliefs/
│       │   ├── index.jsx            ← Chapter 05: Build, Obsess, Empathize, Endure
│       │   └── ChapterBeliefs.module.css
│       └── ChapterLetter/
│           ├── index.jsx            ← Chapter 06: personal letter with SVG signature
│           └── ChapterLetter.module.css
│
└── assets/
    └── fonts/
        └── Pastor_of_Muppets.TTF    ← Custom display font for hero section
```

---

## Design System

All visual decisions live in `src/styles/tokens.css` as CSS custom properties.

### Colors

| Token | Value | Used In |
|---|---|---|
| `--color-black` | `#000000` | Body bg, scene backgrounds, terminal bg |
| `--color-white` | `#ffffff` | Primary text, borders, glitch bars |
| `--color-gold` | `#c8a96e` | Hero "AKHILESH" text, gesture zone labels, selection highlight |
| `--color-gold-muted` | `#3a3a3a` | Hero "NANDA" text |
| `--color-green-terminal` | `#00FF41` | Terminal output, live data "online" indicators |
| `--color-red-terminal` | `#FF3333` | Error messages, "DO NOT ASK" warning |
| `--color-surface-subtle` | `rgba(255,255,255,0.04)` | Gesture zone backgrounds |
| `--color-border-subtle` | `rgba(255,255,255,0.08)` | Subtle borders, zone edges |
| `--color-text-secondary` | `rgba(255,255,255,0.5)` | Muted text |
| `--color-text-tertiary` | `rgba(255,255,255,0.3)` | Dim text |

### Chapter Colors

Each chapter has `--chapter-{name}-bg`, `--chapter-{name}-accent`, `--chapter-{name}-text`:

| Chapter | Background | Accent | Text |
|---|---|---|---|
| Child | `#FFF3E0` (warm cream) | `#FF6B35` (orange) | `#1A0A00` |
| College | `#E8F4FD` (light blue) | `#1565C0` (blue) | `#0A1628` |
| Love | `#FCE4EC` (pink) | `#C2185B` (deep pink) | `#1A0010` |
| Places | `#E8F5E9` (light green) | `#2E7D32` (green) | `#001A00` |
| Music | `#F3E5F5` (lavender) | `#7B1FA2` (purple) | `#1A0028` |
| Beliefs | `#FFF8E1` (warm yellow) | `#E65100` (deep orange) | `#1A0800` |
| Letter | `#FAFAFA` (near white) | `#5D4037` (brown) | `#1C1008` |

### Typography

| Token | Value | Usage |
|---|---|---|
| `--font-display` | `'PastorOfMuppets', serif` | Hero section only |
| `--font-mono` | `'JetBrains Mono', monospace` | Terminal, code, labels, tags |
| `--font-editorial` | `'Cormorant Garamond', serif` | Human mode chapters |
| `--font-system` | `'Space Grotesk', sans-serif` | System mode headings, body |

### Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| `--z-base` | `1` | Default stacking |
| `--z-content` | `10` | Scene content layers |
| `--z-overlay` | `100` | Overlays |
| `--z-gesture` | `9999` | Gesture zones, film grain |
| `--z-terminal` | `99999` | AI terminal (above everything) |

---

## How To Change Things

### Change the gold color

File: `src/styles/tokens.css`
Variable: `--color-gold`
Current: `#c8a96e`

```css
--color-gold: #your-new-gold;
```

Used by: Hero "AKHILESH" text, gesture zone labels, text selection highlight.

### Change font sizes

File: `src/styles/tokens.css`
Variables: `--text-hero`, `--text-hero-last`, `--text-scene-xl`, `--text-scene-lg`, etc.

Scene headings use `clamp()` values defined in their CSS modules (e.g., `OpeningScene.module.css`). To change a specific scene's heading size, edit that module's font-size.

### Add a new scene to System mode

1. Create folder: `src/system/scenes/NewScene/`
2. Create `index.jsx` with your scene component (use `scene-section` class)
3. Create `NewScene.module.css` for component styles (reference tokens via `var(--xxx)`)
4. Add scene to `src/constants/scenes.js` SCENE_ORDER array
5. Import and render in `src/system/SystemWorld.jsx`:
   ```jsx
   const NewScene = lazy(() => import('./scenes/NewScene'));
   // Add <NewScene /> in the render order
   ```

### Add a new Human chapter

1. Create folder: `src/human/chapters/ChapterName/`
2. Create `index.jsx` following the chapter pattern:
   - Section with `chapter-section` class
   - Watermark number, title, divider, content, Japanese text
   - IntersectionObserver calling `setCurrentChapter(N)`
3. Create `ChapterName.module.css` using `var(--chapter-name-*)` tokens
4. Add chapter data to `src/constants/chapters.js`
5. Add color tokens to `src/styles/tokens.css`:
   ```css
   --chapter-name-bg: #...;
   --chapter-name-accent: #...;
   --chapter-name-text: #...;
   ```
6. Import and render in `src/human/HumanWorld.jsx`

### Change gesture zone behavior

- **Zone layout/appearance**: `src/components/gesture/GestureZones.module.css`
- **Zone logic (click handlers, mode switching)**: `src/components/gesture/GestureZones.jsx`
- **Zone labels/icons**: Computed in `GestureZones.jsx` (`leftIcon`, `leftText`, `rightIcon`, `rightText`)

### Update Live Now data

File: `src/constants/liveData.js`

Each cell has: `label`, `value` (number or null), `suffix`, `text` (for non-numeric), `color`.

```js
{ label: 'YOUR METRIC', value: 42, suffix: '%', color: '#00FF41' }
```

### Connect real API to AI terminal

File: `src/components/terminal/AiTerminal.jsx`

The `sendMessage` function fetches `POST /api/chat` with `{ message }` body. Replace:

```jsx
const res = await fetch('/api/chat', { ... });
```

with your real API endpoint. The response should return `{ reply: "..." }` or `{ message: "..." }`.

---

## State Management

Zustand store at `src/store/useStore.js`. Single flat store, no middleware.

| State | Type | Default | Set By | Read By |
|---|---|---|---|---|
| `mode` | `'system' \| 'human'` | `'system'` | WorldTransition | App, Nav, GestureZones, FilmGrain |
| `isTransitioning` | `boolean` | `false` | GestureZones, PasswordGate | App, GestureZones |
| `showPasswordGate` | `boolean` | `false` | App (Easter egg), GestureZones | App, GestureZones |
| `isAuthenticated` | `boolean` | `false` | PasswordGate | — |
| `chatOpen` | `boolean` | `false` | AskScene | — |
| `terminalOpen` | `boolean` | `false` | GestureZones | AiTerminal, GestureZones |
| `scrollY` | `number` | `0` | — (unused currently) | — |
| `currentChapter` | `number` | `0` | Chapter components | — |

---

## Animation Architecture

### Scroll-Driven Animations (Framer Motion)
Every system scene uses `useScroll` + `useTransform` to tie element properties (opacity, x, y, width) to scroll progress. The `target` is the section ref, and `offset` defines the scroll range.

### Particle Animation (Three.js)
`OpeningScene` creates a Three.js scene with 800 particles. Phases: wait → explode outward → implode into letter shapes ("AKHILESH") → hold → scatter → drift. Uses `BufferGeometry` with manual position updates in `requestAnimationFrame`.

### Number Counters (anime.js)
`OriginScene` (day counter: 0→1847) and `LiveScene` (data cells) use anime.js to animate numeric values on intersection. Triggered by `IntersectionObserver`.

### World Transition (Framer Motion)
4-phase transition: glitch bars sweep → grid fragments fall → color flood circle → fade out. Mode switch happens at phase 3. Total duration ~1800ms.

### Terminal Typing Simulation
`Terminal.jsx` types out shell commands character-by-character using async/await with `setTimeout`. Triggered by `IntersectionObserver`.

---

## Known Issues

- `react-router-dom` is installed but unused (no routing in the app)
- `OpeningScene` is commented out in `SystemWorld.jsx` (particle animation disabled)
- `scrollY` state in Zustand store is defined but never written to
- `chatOpen` state is set by AskScene but never read (no chat component yet)
- AskScene "RESUME" link points to `#` (no resume download)
- AskScene "CONTACT" email is `akhilesh@example.com` (placeholder)
- Password defaults to `'akhilesh'` if `VITE_HUMAN_PASSWORD` env var not set
- OpeningScene chunk is ~500KB due to Three.js bundling (code-splitting warning)

---

## Phase Roadmap

### Phase 1 — UI (Current)
- Dual-world system with cinematic transitions
- 6 system scenes (Hero, Origin, Work, Awakening, Live, Ask)
- 7 human chapters with unique color palettes
- Gesture zone navigation
- AI terminal UI (frontend only)
- Design token system + CSS modules
- Organized folder structure

### Phase 2 — Backend
- Real API for AI terminal (replace mock `/api/chat`)
- Live Oracle server data (replace static `liveData.js`)
- Resume on demand (PDF generation or download)
- Contact form backend
- Analytics integration

---

## How To Deploy

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel dashboard
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variables:
   - `VITE_HUMAN_PASSWORD` — password for Human mode access (optional, defaults to `akhilesh`)

### Local Preview

```bash
npm install
npm run build
npm run preview
```

Dev server:
```bash
npm run dev
```
