# Current Portfolio — Architecture Audit

> Live at: akhileshnanda.maya-ai.dev  
> Source: `/frontend/src/`  
> Audited: 2026-06-14

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 19.2 |
| Build Tool | Vite | 8.0 |
| Styling | Tailwind CSS + CSS Modules | 3.4 |
| State | Zustand | 5.0 |
| Animation | Framer Motion | 12.x |
| Number Animation | animejs | 3.2 |
| Font | Google Fonts (Spectral, JetBrains Mono, Cormorant Garamond, Potta One) + Custom TTF |
| Server | Node.js API at `/api/*` |

---

## Folder Structure

```
frontend/src/
├── App.jsx               — root component, world switching logic
├── main.jsx              — entry point
├── assets/
│   └── fonts/
│       └── Pastor_of_Muppets.TTF    ← custom display font
├── components/
│   ├── CurrentlyBuilding/index.jsx  — "currently building" status badge
│   ├── FilmGrain.jsx                — CSS noise overlay (system mode only)
│   ├── gesture/
│   │   ├── GestureZones.jsx         — swipe zones to trigger world switch
│   │   └── GestureZones.module.css
│   ├── maya/
│   │   └── MayaChat.tsx             ← UNUSED — newer Maya chat (not wired in App.jsx)
│   ├── nav/
│   │   ├── Nav.jsx                  — top navigation
│   │   └── Nav.module.css
│   ├── password/
│   │   ├── PasswordGate.jsx         — password gate for Human world
│   │   └── PasswordGate.module.css
│   ├── terminal/
│   │   ├── AiTerminal.jsx           — AI chat terminal (POST /api/maya)
│   │   └── AiTerminal.module.css
│   └── transition/
│       ├── WorldTransition.jsx      — glitch-bar animation between worlds
│       └── WorldTransition.module.css
├── constants/
│   ├── chapters.js      — human chapter order + metadata
│   ├── liveData.js      — fallback stats for LiveScene
│   ├── scenes.js        — scene config (likely unused or minimal)
│   └── siteConfig.js    — SITE url, githubUser, fallback repo
├── hooks/
│   └── .gitkeep         — no custom hooks exist yet
├── human/
│   ├── HumanWorld.jsx   — assembles all human chapters
│   └── chapters/
│       ├── ChapterChild/      — childhood story
│       ├── ChapterCollege/    — college story
│       ├── ChapterLove/       — love story
│       ├── ChapterPlaces/     — places lived
│       ├── ChapterMusic/      — music chapter
│       ├── ChapterBeliefs/    — beliefs chapter
│       └── ChapterLetter/     — closing letter (has abandoned AnimatedSignature1.jsx)
├── lib/
│   ├── adminCommands.ts — Maya admin command parser
│   └── parseAboutMe.ts  — parses about-me.md (likely for Maya context)
├── store/
│   └── useStore.js      — global Zustand store
├── styles/
│   ├── tokens.css       — ALL design tokens (colors, fonts, spacing, z-index, animation)
│   ├── fonts.css        — @font-face declarations
│   └── global.css       — base reset, utility classes, imports tokens + fonts
└── system/
    ├── SystemWorld.jsx  — assembles all portfolio scenes
    └── Hero/
        ├── index.jsx    — hero section with scroll-zoom
        └── Hero.module.css
    └── scenes/
        ├── OpeningScene/    ← DEAD CODE — particle scatter, commented out in SystemWorld
        ├── OriginScene/     — experience timeline (2018→2024)
        ├── WorkScene/       — projects grid
        ├── AwakeningScene/  — terminal aesthetic section
        ├── LiveScene/       — live stats dashboard
        └── AskScene/        — contact section
```

---

## World System

The portfolio has two "worlds" with a dramatic transition between them.

```
mode: 'system'  →  SystemWorld  (portfolio, black/white, film grain)
mode: 'human'   →  HumanWorld   (personal story, chapter colors)
```

**Toggle triggers (3 ways):**
1. Nav buttons (SYSTEM / HUMAN labels)
2. Typing `system.human` anywhere on the page (keyboard easter egg)
3. GestureZones — side swipe bars

**Human world gate:** Protected by PasswordGate component. Users must enter a password before entering human mode for the first time. Once authenticated (`isAuthenticated` in store), gate does not re-show.

---

## State Management (Zustand)

```js
// useStore.js — single flat store
{
  mode: 'system' | 'human',
  isTransitioning: boolean,
  showPasswordGate: boolean,
  isAuthenticated: boolean,
  chatOpen: boolean,
  terminalOpen: boolean,
  scrollY: number,
  currentChapter: number,   // for human mode chapter cursor color
}
```

**Observations:**
- `chatOpen` exists but no component uses it (MayaChat.tsx is unwired)
- `scrollY` is stored but no component reads it from the store
- `terminalOpen` drives AiTerminal visibility

---

## Routing

**There is no routing.** react-router-dom is installed as a dependency but no `<Router>`, no routes, no navigation history. World switching is purely Zustand state. Browser back/forward does not work between worlds.

---

## Scenes (SystemWorld)

| Scene | Section Content | Data Source |
|---|---|---|
| Hero | Name stamp + scroll zoom | Hardcoded JSX |
| OpeningScene | Particle scatter intro | **DEAD** — commented out |
| OriginScene | Experience timeline 2018→2024 | Hardcoded JSX |
| WorkScene | 6 projects grid | Hardcoded PROJECTS array in file |
| AwakeningScene | Terminal aesthetic + animated text | Hardcoded JSX |
| LiveScene | Live stats grid (6 cells) | GET /api/stats + liveData.js fallback |
| AskScene | Contact CTA | Hardcoded JSX |

---

## Human Chapters (HumanWorld)

| Chapter | Background | Accent | Content |
|---|---|---|---|
| ChapterChild | #FFF3E0 | #FF6B35 | Childhood story |
| ChapterCollege | #E8F4FD | #1565C0 | College story |
| ChapterLove | #FCE4EC | #C2185B | Love |
| ChapterPlaces | #E8F5E9 | #2E7D32 | Places lived |
| ChapterMusic | #F3E5F5 | #7B1FA2 | Music |
| ChapterBeliefs | #FFF8E1 | #E65100 | Beliefs |
| ChapterLetter | #FAFAFA | #5D4037 | Closing letter |

All chapter colors are CSS custom properties in `tokens.css` — the actual theming is a strength.

---

## API Endpoints (consumed by frontend)

| Endpoint | Method | Used by | Purpose |
|---|---|---|---|
| `/api/stats` | GET | LiveScene | Live stats data |
| `/api/maya` | POST | AiTerminal | AI chat (Maya) |
| `/api/contact` | POST | AiTerminal | Auto-submit lead when Maya detects interest |

---

## Design Tokens (tokens.css)

**Colors:** black, white, gold (`#c8a96e`), terminal green (`#00FF41`), terminal red (`#FF3333`), surface/border subtle overlays, text hierarchy (primary → ghost).

**Typography — semantic font stack:**
- `--font-display` → PastorOfMuppets (custom TTF) — Hero only
- `--font-heading` → Spectral — section titles
- `--font-body` → Spectral — body text
- `--font-hover` → Potta One — playful hover glimpse
- `--font-mono` → JetBrains Mono — code, labels, terminal
- `--font-editorial` → Cormorant Garamond — Human mode chapters

**Font sizes:** clamp-based responsive (`--text-hero`, `--text-scene-xl`, etc.)

**Spacing:** 8-point scale (`--space-xs` through `--space-3xl`), plus `--space-section: 100vh`

**Z-index scale:** base(1) → content(10) → overlay(100) → gesture(9999) → terminal(99999)

**Animation:** duration tokens (150ms → 1000ms) + named easing curves

---

## Animation System

| Library | Used for |
|---|---|
| Framer Motion | Scroll-linked transforms (scale, x, opacity, width), `whileInView` reveals, world transition |
| animejs | Number counting animations (LiveScene, OriginScene dayCount) |
| CSS Animations | Film grain noise, glitch bars, cursor blink, scroll hint line |

---

## Dead Code

| File/Feature | Status | Reason |
|---|---|---|
| `system/scenes/OpeningScene/` | Dead | Commented out in SystemWorld.jsx (particle scatter animation) |
| `components/maya/MayaChat.tsx` | Dead | Not imported in App.jsx — AiTerminal serves this role |
| `human/chapters/ChapterLetter/AnimatedSignature1.jsx` | Dead | Duplicate of AnimatedSignature.jsx, not imported |
| `store` → `chatOpen`, `scrollY` | Dead state | No component reads these |
| Dep: `@react-three/fiber` + `three` | Dead dep | Only used in OpeningScene (which is commented out) |
| Dep: `react-router-dom` | Dead dep | Installed but no Router component or routes exist |

---

## Reusable Modules

| Module | File | Why Reusable |
|---|---|---|
| Design Tokens | `styles/tokens.css` | Complete token system — entire visual language |
| Fonts CSS | `styles/fonts.css` | Font-face declarations, Google Fonts imports |
| Global CSS | `styles/global.css` | Reset, utility classes, font utility classes |
| Custom Font | `assets/fonts/Pastor_of_Muppets.TTF` | Display font, used in Hero |
| Zustand Store | `store/useStore.js` | Clean, well-structured — migrate with additions |
| FilmGrain | `components/FilmGrain.jsx` | Self-contained, no dependencies |
| WorldTransition | `components/transition/WorldTransition.jsx` | World switch animation, reusable |
| PasswordGate | `components/password/PasswordGate.jsx` | Human mode gate |
| Nav | `components/nav/Nav.jsx` | Top nav, adapt for new page structure |
| Chapter data | `constants/chapters.js` | Clean data — migrate to content JSON |
| Site config | `constants/siteConfig.js` | URL, GitHub user — keep as config |

---

## Strengths

1. **Token system** — `tokens.css` is the single source of truth for all visual decisions. Every color, font, spacing, z-index, and animation duration is a CSS variable.
2. **Semantic fonts** — Font roles are named by purpose (`--font-display`, `--font-heading`, `--font-editorial`). Swapping a font family is a one-line change.
3. **Chapter color system** — Human mode per-chapter colors are all in tokens.css. Adding a new chapter requires only adding its color tokens.
4. **Clean Zustand store** — Minimal, flat, easy to extend.
5. **Lazy loading** — SystemWorld and HumanWorld are both lazy-loaded with Suspense.
6. **Framer Motion scroll integration** — `useScroll` + `useTransform` for scroll-linked animations is idiomatic and performant.
7. **AnimatedSignature** — Custom handwriting animation using SVG path drawing is a genuinely unique detail.
8. **`/api/maya` lead detection** — AiTerminal silently captures leads via `%%LEAD%%` markers in Maya's response and POSTs to `/api/contact`. Clever pattern.

---

## Weaknesses

1. **Content hardcoded in JSX** — Projects, experience timeline, contact copy are all in component files. Any update requires a code change and redeploy.
2. **No routing** — Browser history does not reflect world state. Deep-linking is impossible. Admin page cannot be a separate route.
3. **AiTerminal not modular** — It reads from the Zustand store directly and is always mounted. Should be composable.
4. **Mixed styling** — Tailwind utility classes + CSS Modules used together inconsistently. Some components use one, some the other, some both.
5. **Dead dependencies inflating bundle** — Three.js and react-router-dom are in `dependencies` but not used. Three.js is a large library.
6. **No TypeScript** — Only `MayaChat.tsx` and `lib/*.ts` are TypeScript. Everything else is JSX.
7. **No testing** — No test setup, no test files.
8. **`constants/` is mixed** — `liveData.js` is data, `chapters.js` is data, `siteConfig.js` is config, `scenes.js` is uncertain. Should be split.
9. **GestureZones complexity** — Gesture/swipe zones are a clever UX idea but add invisible interactable areas that confuse new visitors.
10. **AwakeningScene content** — Its content is philosophical/atmospheric but provides little concrete portfolio value to a recruiter scanning the page.
