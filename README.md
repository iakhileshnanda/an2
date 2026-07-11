# newakhilesh — Portfolio V2

Live at `deal.maya-ai.dev` and `v2.akhileshnanda.maya-ai.dev`.

---

## Update log — 2026-07-11

One big working session; everything below shipped today.

### Echo memory
- **Session memory** — the overlay keeps conversation history (last 8 turns) in
  `sessionStorage`, so "tell me more" follow-ups work. Survives refresh, dies with the tab.
- **Persistent visitor memory** — `memory.js` now extracts topics, recent questions
  (last 5), interests, and an inferred reply style (concise/detailed) per visitor —
  keyword heuristics, still plain JSON files, no DB.
- **Leaving trigger wired** — `pagehide`/`beforeunload` fires a keepalive request so
  Echo writes its one-line visit summary; returning visitors get recognized.
- **Memory context block** — system prompt gains a `KNOWN ABOUT THIS VISITOR` section
  (topics, questions, style, last-visit summary), omitted when empty.

### Live "Now" dashboard
- **`GET /api/echo/now`** — new echo-api endpoint reusing the GitHub tool: building /
  latestCommit / currentFocus, summarized server-side, 5-min cache, stale-over-empty.
- **NowCard** replaces the old CurrentlyBuilding widget in Experience — renders
  editorial fallback (`content/now.json`) instantly, upgrades to live GitHub data.
- **Current Mission** block + **Recent Updates** shipping log (`content/changelog.json`).
- **Returning-visitor greeting** — droid bubble shows "since your last visit: …" from
  changelog entries newer than the visitor's last visit.
- **Ask Echo →** on every timeline era (auto-sends a tailored prompt), and the
  focused timeline entry rides along in `sessionContext` so Echo knows what "this" means.

### Content refresh (from the real résumé)
- Experience timeline corrected: Trustt (2023–now, Frontend Lead) and Transtech
  Solutions (2019–2023) replace the placeholder ValueLabs entries; skills and Echo's
  `resume.json` updated to match. `resumeUrl` points at `/resume.pdf`, served
  from `frontend/public/resume.pdf` — Echo hands out the link when asked for the CV.

### Visual overhaul
- **Dark act** — the closing scenes (ONE NIGHT / LET'S BUILD / HIRE·ME) share one
  continuous warm-ink backdrop (`.dark-act`: #141110 + grain + single cherry vignette)
  instead of three seamed `bg-black` sections.
- **WORK section rebuilt as a glass scroll stack** — React Bits `ScrollStack` (Lenis
  smooth scroll, window mode) + `GlassSurface` cards over a cherry aurora backdrop.
  Cards arrive one at a time and stack as you scroll.
- **Stability fix ported into ScrollStack** — the original's window-scroll mode
  measures cards with `getBoundingClientRect()`, which includes its own transform and
  makes pinned cards shake; ours walks the `offsetParent` chain (layout-based, stable).

### Performance (made every frame cheaper)
- Glass cards run the frosted `backdrop-filter` fallback (`forceFallback`) instead of
  the per-pixel SVG displacement filter — dozens of times cheaper with 6 cards on screen.
- Removed the live `blur(48px)` on the aurora backdrop (gradients are already soft);
  glass was re-sampling that blur every frame.
- Lenis tuned tighter than React Bits defaults (duration 0.85, lerp 0.16) — less float.

---

## Structure

```
newakhilesh/
├── frontend/               React 19 + Vite + TailwindCSS
│   ├── src/
│   │   ├── echo/           Echo AI companion (FSM, chat, store, visitor tracking)
│   │   │   ├── core/       EchoFSM.ts, useEcho.ts, visitor.ts, types.ts, constants.ts
│   │   │   ├── chat/       chatService.ts (session history + leaving trigger)
│   │   │   ├── store/      echoStore.ts (+ focusedTimeline)
│   │   │   ├── content/    hints.ts
│   │   │   └── echo-overlay.ts  terminal UI, askEcho(), returning-visitor greeting
│   │   ├── components/
│   │   │   ├── ScrollStack/     React Bits stack (adapted: stable window-scroll pin)
│   │   │   └── GlassSurface/    React Bits glass (+ forceFallback perf mode)
│   │   ├── sections/
│   │   │   ├── Projects/        glass scroll-stack WORK section
│   │   │   └── Experience/      timeline + NowCard + RecentUpdates
│   │   ├── store/          Zustand global state
│   │   └── lib/            parseAboutMe.ts
│   └── public/             favicon, icons, OG image, droid sprite (put resume.pdf here)
│
├── server/
│   ├── echo-api/           Echo brain — port 3005, PM2 name: echo-api
│   │   ├── index.js        Express, CORS, rate limit, GET /api/echo/now
│   │   ├── src/
│   │   │   ├── echo.js     Groq-primary + Anthropic-fallback tool loops
│   │   │   ├── systemPrompt.js  Echo persona + memory/session context builder
│   │   │   ├── tools.js    get_github_activity, get_resume
│   │   │   ├── memory.js   per-visitor JSON store + topic/preference extraction
│   │   │   ├── now.js      cached "now" summary for the live dashboard card
│   │   │   └── modeInference.js  dwell-based HIRE/CURIOUS inference (unused)
│   │   ├── content/
│   │   │   └── resume.json  hot-read résumé (edit = live, no restart needed)
│   │   └── data/visitors/  runtime memory, gitignored
│   │
│   └── portfolio-api/      Legacy API — port 3002, PM2 name: portfolio-api-v2
│       └── routes/         about, contact, stats, maya (recruiter chat)
│
├── nginx/
│   └── portfolio-v2.conf   /api/echo → :3005, /api/ → :3002, frontend dist
├── deploy/
│   ├── deploy.sh           git pull → install → build → nginx reload → pm2 restart
│   └── install.sh          first-time server setup
├── deploy.sh               root-level shortcut (calls deploy/)
├── content/                editorial JSON (hero, projects, experience, skills, stats,
│                           contact, now, changelog)
├── about-me.md             content source of truth
└── docs/                   architecture and planning docs
```

---

## Domains

| Domain | Serves |
|--------|--------|
| `deal.maya-ai.dev` | V2 portfolio + Echo (primary) |
| `v2.akhileshnanda.maya-ai.dev` | same |
| `akhileshnanda.maya-ai.dev` | original V1 portfolio — untouched |

---

## Services

| Service | PM2 name | Port | What it does |
|---------|----------|------|--------------|
| Echo API | `echo-api` | 3005 | Echo's brain — LLM, memory, tools |
| Portfolio API | `portfolio-api-v2` | 3002 | Stats, contact, Maya recruiter chat |

---

## Local Dev

```bash
# Frontend
cd frontend
npm install
npm run dev        # http://localhost:5173 — /api/echo proxies to :3005

# Echo API
cd server/echo-api
cp .env.example .env   # set GROQ_API_KEY + ANTHROPIC_API_KEY
npm install
npm start              # http://localhost:3005
```

---

## Deploy

```bash
cd ~/apps/newakhilesh
./deploy.sh   # pull → install → build → nginx reload → pm2 restart → health check
```

Env-only changes (new key, model swap):
```bash
pm2 restart echo-api --update-env
```

---

## Key docs

- `ECHO_HANDOFF.md` — Echo status, pending items, hard rules
- `server/echo-api/README.md` — Echo API contract reference
- `docs/admin-architecture.md` — Admin mode design (future)
- `docs/dashboard-architecture.md` — Real-time dashboard design (future)
