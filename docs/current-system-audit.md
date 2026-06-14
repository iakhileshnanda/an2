# Current System Audit — akhileshnanda (Production)

**Audited:** 2026-06-14  
**Purpose:** V2 baseline — document everything before redesign

---

## Repository Overview

| Item | Value |
|------|-------|
| Type | Monorepo (Frontend + Backend) |
| Live URL | https://akhileshnanda.maya-ai.dev |
| Stack | React 19 + Express.js + Nginx |
| Deployment | Oracle Cloud (Ubuntu) + PM2 |
| Domain | Cloudflare proxied, Cloudflare origin cert |

---

## 1. Frontend (`frontend/`)

### Build & Config

| File | Purpose |
|------|---------|
| `package.json` | React 19, Vite 8, Three.js, Framer Motion, Zustand, TailwindCSS |
| `vite.config.js` | Path aliases: @store, @hooks, @constants, @components, @system, @human, @styles, @assets |
| `tailwind.config.js` | Custom chapter color palette |
| `postcss.config.js` | Tailwind + Autoprefixer |
| `eslint.config.js` | React Hooks + React Refresh, flat config |
| `index.html` | HTML entry, meta tags, preconnect fonts, OG image |

### Build Commands

```
npm run dev      → vite dev server on :5173
npm run build    → output to frontend/dist/
npm run preview  → preview production build
npm run gen:og   → generate OG image (satori + resvg)
```

### Public Assets (`public/`)

| File | Purpose |
|------|---------|
| `favicon.svg` | Site favicon |
| `icons.svg` | Icon sprite sheet |
| `og-image.png` | OpenGraph preview (38KB) |

### Styles (`src/styles/`)

| File | Purpose |
|------|---------|
| `global.css` | Base reset, layout utilities, animations (film grain, glitch, cursor blink) |
| `fonts.css` | @font-face for PastorOfMuppets TTF |
| `tokens.css` | Design tokens: colors, typography, spacing, z-index, animation timings |

### Custom Font

| Font | File | Usage |
|------|------|-------|
| Pastor of Muppets | `src/assets/fonts/Pastor_of_Muppets.TTF` | Hero section display |

### Google Fonts (loaded via CDN)

| Font | Weights | Usage |
|------|---------|-------|
| Spectral | 300, 400, 500, 600 | Headings, body (system mode) |
| Cormorant Garamond | 300, 400, 600 | Human mode chapters |
| JetBrains Mono | 400, 700 | Terminal, code, labels |
| Potta One | 400 | Hover glimpse effect |

### State Management (`src/store/useStore.js`)

Zustand store tracking:
- `mode` — system / human
- chat state, terminal state
- authentication (password gate)
- scroll position, chapter index

### Constants (`src/constants/`)

| File | Content |
|------|---------|
| `chapters.js` | 7 chapters with Japanese meaning labels |
| `scenes.js` | 6 system world scenes |
| `siteConfig.js` | Site URL, GitHub fallback data |
| `liveData.js` | Live data references |

### Components (`src/components/`)

| Component | Purpose |
|-----------|---------|
| `nav/Nav.jsx` | Top navigation (mode-aware) |
| `gesture/GestureZones.jsx` | Gesture-based navigation |
| `password/PasswordGate.jsx` | Password auth for world-switching |
| `terminal/AiTerminal.jsx` | Interactive AI terminal + lead capture |
| `FilmGrain.jsx` | Film grain overlay (system mode only) |
| `transition/WorldTransition.jsx` | System ↔ Human transition animation |
| `maya/MayaChat.tsx` | Maya recruiter chat (TypeScript) |

### System World (`src/system/`) — 6 Scenes

| Scene | File | Purpose |
|-------|------|---------|
| Hero | `Hero/index.jsx` | Landing section |
| Opening | `scenes/OpeningScene/index.jsx` | Intro sequence |
| Origin | `scenes/OriginScene/index.jsx` | Background story |
| Work | `scenes/WorkScene/index.jsx` | Projects |
| Awakening | `scenes/AwakeningScene/index.jsx` | AI terminal scene |
| Live | `scenes/LiveScene/index.jsx` | Live stats |
| Ask | `scenes/AskScene/index.jsx` | Maya chat scene |

### Human World (`src/human/`) — 7 Chapters

| Chapter | File | Japanese |
|---------|------|---------|
| 00: Child | `ChapterChild/` | 子 |
| 01: College | `ChapterCollege/` | 大学 |
| 02: Love | `ChapterLove/` | 愛 |
| 03: Places | `ChapterPlaces/` | 場所 |
| 04: Music | `ChapterMusic/` | 音楽 |
| 05: Beliefs | `ChapterBeliefs/` | 信念 |
| 06: Letter | `ChapterLetter/` | 手紙 |

### Utilities (`src/lib/`)

| File | Purpose |
|------|---------|
| `parseAboutMe.ts` | Client-side parser for about-me.md |
| `adminCommands.ts` | Admin command utilities |

### Entry Points

| File | Purpose |
|------|---------|
| `App.jsx` | Root: mode switching, world transitions, password gate, easter eggs |
| `main.jsx` | ReactDOM.createRoot |

### Easter Egg

Typing `system.human` anywhere:
- System mode → opens password gate
- Human mode → triggers world transition

---

## 2. Backend (`server/portfolio-api/`)

### Entry & Config

| File | Purpose |
|------|---------|
| `index.js` | Express app, route mounting, WebSocket init |
| `package.json` | Express 4, Helmet, CORS, rate-limit, Anthropic SDK, ws, node-fetch, dotenv |
| `ecosystem.config.js` | PM2 config: name `portfolio-api`, port 3001, logs at `/home/ubuntu/logs/` |

### API Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/health` | GET | Health check + uptime | None |
| `/api/chat` | POST | AI chat (Kimi K2 → Groq fallback) | chatLimiter (10/min) |
| `/api/maya` | POST | Maya chat (lab / portfolio modes, NIM → Groq) | chatLimiter (10/min) |
| `/api/recruiter-chat` | POST | Maya recruiter chat (Anthropic Claude) | chatLimiter (10/min) |
| `/api/about` | GET | Parsed about-me.md JSON | Public |
| `/api/update` | POST | Admin mutations to about-me.md | Bearer token |
| `/api/stats` | GET | Server metrics, RAM, job bot data | Public |
| `/api/jobs` | GET | Applied jobs tracking | Public |
| `/api/resume` | GET | Resume PDF redirect | Public |
| `/api/contact` | POST | Lead/contact capture | None |
| `/api/contact/leads` | GET | View captured leads | Token query param |
| `/ws` | WebSocket | Live dashboard channel | None |

### Middleware

| File | Purpose |
|------|---------|
| `middleware/cors.js` | Allowlist: localhost, maya-ai.dev, akhileshnanda.com, Oracle IP |
| `middleware/rateLimit.js` | apiLimiter: 20/min; chatLimiter: 10/min |
| `middleware/errorHandler.js` | Global error handler; stack only in dev |

### Prompts

| File | Mode | Tone |
|------|------|------|
| `prompts/portfolio.js` | Portfolio mode | Witty, hiring-aware, lead capture, 3 sentences max |
| `prompts/lab.js` | Lab mode | Calm, minimal, mysterious, 2 sentences max |

### Utilities

| File | Purpose |
|------|---------|
| `utils/parseAboutMe.js` | Markdown → JSON (identity, skills, experience, projects, education, meta) |
| `utils/aboutStore.js` | File I/O + mutations for about-me.md (add_project, update_skill, set_availability, set_meta, add_achievement) |
| `realtime.js` | WebSocket server: broadcasts `about:update` events to dashboards |

### AI Models

| Model | Provider | Usage |
|-------|----------|-------|
| Kimi K2 | NVIDIA NIM | Primary chat |
| Llama 3.3 70B | Groq | Chat fallback |
| Llama 3.3 70B | NVIDIA NIM | Maya inference |
| Claude Sonnet 4.6 | Anthropic | Recruiter chat (with prompt caching) |

### Lead Capture System

Silent extraction from chat — appended as `%%LEAD%%{...}%%LEAD%%` in AI responses.

Captures: email, phone, name, company, role, location, linkedin, github, social, intent, budget, timeline, urgency, sensitive_warning.

Stored at: `~/contacts/leads.json` on the server.

---

## 3. Nginx (`nginx/portfolio.conf`)

| Setting | Value |
|---------|-------|
| Domain | akhileshnanda.maya-ai.dev |
| SSL | Cloudflare origin cert (`/etc/ssl/cloudflare/origin.pem`) |
| Root | `/home/ubuntu/apps/akhileshnanda/frontend/dist/` |
| Port | 443 (HTTPS) + 80 (redirect) |
| API proxy | `/api/*` + `/health` → `localhost:3001` |
| WebSocket | `/ws` → `localhost:3001` (3600s timeout) |
| Static caching | 1 year, `Cache-Control: public, immutable` |
| Compression | gzip for text/json/js/css |

---

## 4. Environment Variables

### Frontend (`.env.example`)

| Variable | Purpose |
|----------|---------|
| `VITE_HUMAN_PASSWORD` | Password to unlock Human mode |
| `VITE_CHAT_API_URL` | API endpoint for chat |

### Backend (`.env.example`)

| Variable | Purpose |
|----------|---------|
| `API_KEY` | Kimi K2 / NVIDIA NIM key |
| `GROQ_API_KEY` | Groq fallback key |
| `ANTHROPIC_API_KEY` | Claude for recruiter chat |
| `RECRUITER_MODEL` | Model override (default: claude-sonnet-4-6) |
| `ADMIN_TOKEN` | Bearer token for POST /api/update |
| `ABOUT_ME_PATH` | Override about-me.md path (optional) |
| `RESUME_URL` | Resume PDF URL |
| `PORT` | Server port (default: 3001) |
| `NODE_ENV` | production / development |
| `ALLOWED_ORIGIN` | Extra CORS origin |

---

## 5. PM2 Configuration

| Setting | Value |
|---------|-------|
| App name | portfolio-api |
| Port | 3001 |
| CWD | `/home/ubuntu/apps/akhileshnanda/server/portfolio-api` |
| Instances | 1 |
| Max memory | 200MB (auto-restart) |
| Error log | `/home/ubuntu/logs/api-error.log` |
| Out log | `/home/ubuntu/logs/api-out.log` |

---

## 6. Deployment (`deploy.sh`)

Steps:
1. `git pull origin main`
2. `cd frontend && npm install && npm run build`
3. `cd server/portfolio-api && npm install --production && pm2 restart portfolio-api`
4. `sudo cp nginx/portfolio.conf /etc/nginx/sites-available/portfolio && sudo systemctl reload nginx`

---

## 7. Content Source of Truth

`about-me.md` at repo root — single file drives:
- `/api/about` endpoint (parsed JSON)
- Maya recruiter chat system prompt (live read on each request)
- Admin mutations via `/api/update` (WebSocket broadcast on change)

### Markdown Grammar

```
# SECTION              top-level header
## Sub heading         project / experience entry
- key: value           field line
- **Category:** a, b   skill category
- bullet               plain bullet
```

---

## 8. Architecture Notes

### Dual-World Design

Two entirely separate UI modes in one React app:
- **System World** — cinematic AI/terminal experience, 6 sequential scenes
- **Human World** — intimate story mode, 7 chapters

World-switching via password gate (VITE_HUMAN_PASSWORD).

### Real-time Pipeline

`about-me.md` → `parseAboutMe.js` → `/api/about` JSON → dashboard  
Admin edit → `POST /api/update` → file mutation → `broadcast()` → WebSocket → dashboards refresh

### Port Map

| Service | Port | Protocol |
|---------|------|----------|
| Frontend dev | 5173 | HTTP |
| API (prod) | 3001 | HTTP (Nginx proxied) |
| Nginx HTTPS | 443 | HTTPS (Cloudflare) |
| Nginx HTTP | 80 | HTTP (→443 redirect) |

---

## 9. File Count Summary

| Category | Count |
|----------|-------|
| Frontend JSX/TSX/JS source files | 31 |
| Frontend CSS module files | 16 |
| Backend route files | 8 |
| Backend middleware | 3 |
| Backend prompts | 2 |
| Backend utilities | 3 |
| Config files | 8 |
| Assets (font + images) | 4 |
| Deploy scripts | 3 |
| Documentation | 5 |
| **Total (excl. node_modules)** | **~90** |
