Here's the complete prompt you can use for any future conversation or AI session:

---

═══════════════════════════════════════════════════════════════
A.NANDA PORTFOLIO — COMPLETE PROJECT CONTEXT
═══════════════════════════════════════════════════════════════

WHAT THIS IS:
─────────────
A cinematic, scroll-driven, dual-world portfolio for Akhilesh Nanda
(Frontend Lead / AI Builder / Bangalore). NOT a typical portfolio.
It's a full-screen immersive experience with two parallel narratives:

    SYSTEM MODE (default) — Dark, cinematic, developer identity
      • Black background, white text, monospace typography
      • Particle animations (Three.js), scroll-driven reveals (Framer Motion)
      • Terminal aesthetics, film grain overlay
      • Shows: skills, projects, live data, AI terminal

    HUMAN MODE (hidden, password-protected) — Warm, editorial, personal
      • Colored chapter backgrounds, serif typography
      • 7 life chapters with Japanese calligraphy accents
      • Photo placeholders, animated signature
      • Shows: childhood, college, love, places, music, beliefs, a letter

    NAVIGATION — No traditional buttons or cursor
      • Gesture zones: invisible hover bars on left/right/bottom screen edges
      • Left edge: go back / refresh
      • Right edge: switch worlds
      • Bottom edge: open AI terminal
      • Easter egg: type "system.human" anywhere → password gate → human mode
      • Password: "akhilesh" (or VITE_HUMAN_PASSWORD env var)

═══════════════════════════════════════════════════════════════
TECH STACK:
═══════════════════════════════════════════════════════════════
React 19 — UI framework
Vite 8 — Build tool, path aliases
Three.js 0.183 — 3D particle animation (OpeningScene)
Framer Motion 12 — Scroll animations, transitions, page effects
anime.js 3.2 — Number counters, shake effects
Zustand 5 — Global state (mode, transitions, terminal)
Tailwind CSS 3.4 — Utility styling
CSS Modules — Component-scoped styles
CSS Custom Props — Design tokens (tokens.css)
Custom TTF font — "Pastor of Muppets" for hero display

═══════════════════════════════════════════════════════════════
FOLDER STRUCTURE (CURRENT):
═══════════════════════════════════════════════════════════════
src/
├── App.jsx — Root: mode switching, Easter egg listener
├── main.jsx — Entry point, imports global.css
├── styles/
│ ├── tokens.css — ALL design tokens (colors, fonts, spacing, z-index)
│ ├── fonts.css — @font-face (PastorOfMuppets + Google Fonts)
│ └── global.css — Reset, base styles, utility classes, animations
├── store/
│ └── useStore.js — Zustand store (mode, transitions, terminal, scroll)
├── hooks/ — Empty, reserved for extracted hooks
├── constants/
│ ├── scenes.js — System scene names & order
│ ├── chapters.js — Human chapter metadata (titles, Japanese text)
│ └── liveData.js — Live Now mock data
├── components/
│ ├── FilmGrain.jsx — SVG noise overlay (system mode only)
│ ├── gesture/
│ │ ├── GestureZones.jsx — Left/right/bottom hover navigation
│ │ └── GestureZones.module.css (mode-aware: dark on light, light on dark)
│ ├── terminal/
│ │ ├── AiTerminal.jsx — Full-screen AI chat (fetches POST /api/chat)
│ │ └── AiTerminal.module.css
│ ├── nav/
│ │ ├── Nav.jsx — Top bar (mode-aware text)
│ │ └── Nav.module.css
│ ├── transition/
│ │ ├── WorldTransition.jsx — Glitch bars → fragments → color flood → fade
│ │ └── WorldTransition.module.css
│ └── password/
│ ├── PasswordGate.jsx — Password input for human mode access
│ └── PasswordGate.module.css
├── system/
│ ├── SystemWorld.jsx — Layout, lazy-loads all scenes
│ ├── Hero/
│ │ ├── index.jsx — "AKHILESH / NANDA" in PastorOfMuppets font
│ │ └── Hero.module.css — Gold + muted gold, mirrored last letters
│ └── scenes/
│ ├── OpeningScene/ — Three.js particle explosion → text (COMMENTED OUT)
│ ├── OriginScene/ — "2019" origin story + anime.js day counter (0→1847)
│ ├── WorkScene/ — 5 project cards with scroll slide-in
│ ├── AwakeningScene/ — "One Night. Zero Backend. One Agent." + terminal sim
│ ├── LiveScene/ — 6 data cells with animated counters
│ └── AskScene/ — CTA: "TALK TO MY AI" / RESUME / CONTACT + Easter egg hint
├── human/
│ ├── HumanWorld.jsx — Renders all 7 chapters
│ └── chapters/
│ ├── ChapterChild/ — Ch 00: childhood, curiosity (始まり)
│ ├── ChapterCollege/ — Ch 01: college years, friendship (友情)
│ ├── ChapterLove/ — Ch 02: love, held in reserve (愛)
│ ├── ChapterPlaces/ — Ch 03: Hyderabad→Bangalore→Tokyo map (旅)
│ ├── ChapterMusic/ — Ch 04: Linkin Park→Tame Impala→Nujabes→Jai Paul (音楽)
│ ├── ChapterBeliefs/ — Ch 05: Build, Obsess, Empathize, Endure (信念)
│ └── ChapterLetter/ — Ch 06: personal letter + AnimatedSignature (手紙)
└── assets/fonts/
└── Pastor_of_Muppets.TTF

═══════════════════════════════════════════════════════════════
DESIGN SYSTEM (tokens.css):
═══════════════════════════════════════════════════════════════
COLORS:
--color-black: #000000 --color-white: #ffffff
--color-gold: #c8a96e --color-gold-muted: #3a3a3a
--color-green-terminal: #00FF41
--color-red-terminal: #FF3333
--color-surface-subtle: rgba(255,255,255,0.04)
--color-border-subtle: rgba(255,255,255,0.08)
--color-text-primary/secondary/tertiary/dim/ghost

CHAPTER COLORS (7 chapters, each with --chapter-{name}-bg/accent/text):
child: #FFF3E0 / #FF6B35 / #1A0A00
college: #E8F4FD / #1565C0 / #0A1628
love: #FCE4EC / #C2185B / #1A0010
places: #E8F5E9 / #2E7D32 / #001A00
music: #F3E5F5 / #7B1FA2 / #1A0028
beliefs: #FFF8E1 / #E65100 / #1A0800
letter: #FAFAFA / #5D4037 / #1C1008

FONTS:
--font-display: 'PastorOfMuppets', serif (hero only)
--font-mono: 'JetBrains Mono', monospace (terminal, labels)
--font-editorial: 'Cormorant Garamond', serif (human chapters)
--font-system: 'Space Grotesk', sans-serif (system headings)

Z-INDEX SCALE:
--z-base: 1 → --z-content: 10 → --z-overlay: 100
→ --z-gesture: 9999 → --z-terminal: 99999

═══════════════════════════════════════════════════════════════
STATE MANAGEMENT (Zustand):
═══════════════════════════════════════════════════════════════
mode: 'system' | 'human' — which world is active
isTransitioning: boolean — world transition animation playing
showPasswordGate: boolean — password input visible
isAuthenticated: boolean — passed password check
chatOpen: boolean — (unused, for future chat widget)
terminalOpen: boolean — AI terminal fullscreen overlay
scrollY: number — (unused, reserved)
currentChapter: 0-6 — which human chapter is in viewport

═══════════════════════════════════════════════════════════════
WHAT IS BUILT (✅ DONE):
═══════════════════════════════════════════════════════════════

SYSTEM MODE:
✅ Hero section — PastorOfMuppets font, gold "AKHILESH", muted "NANDA",
mirrored H and A letters
✅ OpeningScene — Three.js particle scatter → text formation (currently
commented out in SystemWorld.jsx, can re-enable)
✅ OriginScene — "2019" with outline text, origin story paragraphs,
anime.js counter 0→1847 days
✅ WorkScene — 5 project cards (ORACLE, NANOBOT, PORTAL, FORGE, ATLAS)
with scroll-driven slide-in, hover invert effect
✅ AwakeningScene — "ONE NIGHT. ZERO BACKEND. ONE AGENT." cinematic text + simulated terminal typing animation
✅ LiveScene — 6 data cells with animated counters (Oracle uptime, Nanobot
status, jobs scraped, best match, MCP tools, Angular version)
✅ AskScene — CTA section with 3 buttons (Talk to AI, Resume, Contact) + Easter egg hint text at bottom

HUMAN MODE:
✅ Password gate — shake animation on wrong password
✅ World transition — 4-phase: glitch bars → fragment grid → color flood → fade
✅ 7 chapters with unique color palettes, Japanese calligraphy accents
✅ Chapter 06 (Letter) — AnimatedSignature component with real vectorized
signature SVG, stroke-dashoffset animation
✅ IntersectionObserver on each chapter to track currentChapter

SHARED COMPONENTS:
✅ GestureZones — mode-aware (dark tint on light bg, light tint on dark bg)
✅ AiTerminal — full-screen terminal UI with typewriter response effect,
left panel (chat) + right panel (usage guide + warnings)
✅ Nav — mode-aware (system: "A.NANDA" monospace / human: "Akhilesh" serif)
✅ FilmGrain — SVG noise overlay, system mode only
✅ WorldTransition — glitch + fragment + flood animation

INFRASTRUCTURE:
✅ Design token system (tokens.css) — 80+ CSS custom properties
✅ CSS Modules for every component — zero inline styles
✅ Organized folder structure (system/, human/, components/, constants/)
✅ Vite path aliases (@store, @components, @system, @human, etc.)
✅ Constants extracted (scenes.js, chapters.js, liveData.js)
✅ TECH.md documentation
✅ Production build passes with zero errors

═══════════════════════════════════════════════════════════════
WHAT IS PENDING (❌ NOT DONE):
═══════════════════════════════════════════════════════════════

BACKEND (Phase 2):
❌ Real AI API for terminal — currently fetches POST /api/chat which
doesn't exist, shows "CONNECTION ERROR — backend is offline"
Needs: NestJS/Express backend + LLM integration (Nanobot)
❌ Live Oracle data — LiveScene uses hardcoded mock data in constants/liveData.js
Needs: real API polling Oracle server stats
❌ Resume download — AskScene "RESUME" button links to "#"
Needs: PDF generation or hosted file
❌ Contact form — AskScene "CONTACT" links to mailto:akhilesh@example.com
Needs: real email or form backend
❌ Analytics — no tracking installed

UI INCOMPLETE:
❌ OpeningScene disabled — particle animation commented out in SystemWorld.jsx
(was causing performance issues or needed refinement)
❌ Photo placeholders — ChapterChild has "memory 01/02/03" placeholder divs,
ChapterCollege has 6 numbered placeholders. Need real photos.
❌ ChapterPlaces map — uses crude SVG ellipses as "continents", needs real
map or better visualization
❌ Mobile responsiveness — gesture zones use 5cm width (physical units),
may not work well on touch devices. No touch/swipe gestures implemented.
❌ Custom cursor — AiTerminal sets cursor:none but no custom cursor component
❌ chatOpen state — set by AskScene "TALK TO MY AI" button but nothing reads it
(the button should probably open the terminal instead)

HOOKS EXTRACTION (reserved):
❌ useGestureZone.js — gesture logic still inline in GestureZones.jsx
❌ useScrollScene.js — scroll animation logic repeated in each scene
❌ useTerminal.js — terminal state/logic still inline in AiTerminal.jsx
❌ useChapterObserver.js — identical IntersectionObserver in all 7 chapters

CLEANUP:
❌ react-router-dom installed but unused (no routing)
❌ @react-three/drei and @react-three/fiber installed but unused
(OpeningScene uses raw Three.js, not React Three Fiber)
❌ scrollY state in Zustand never written to
❌ AnimatedSignature1.jsx — appears to be a duplicate/backup file
❌ FreeSample-Vectorizer-io-Transparent Sign.svg — source file in src/ root,
should be in assets/ or removed

═══════════════════════════════════════════════════════════════
RULES FOR WORKING ON THIS PROJECT:
═══════════════════════════════════════════════════════════════
• Use CSS Modules for all component styles — no inline styles
• Reference design tokens via var(--token-name) — never hardcode colors/fonts
• Keep Framer Motion style props for animated values (y, opacity, x, scale)
• Tailwind for layout utilities, CSS Modules for component-specific styles
• Every scene/chapter gets its own folder with index.jsx + .module.css
• Constants go in src/constants/, not inline in components
• Test with `npm run build` — must pass with zero errors
• Zero visual regressions unless explicitly requested
• GestureZones must be mode-aware (dark on light, light on dark)

---

This prompt gives any AI (or future-you) full context to pick up exactly where you left off.
