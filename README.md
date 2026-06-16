# newakhilesh — Portfolio V2

Live at `deal.maya-ai.dev` and `v2.akhileshnanda.maya-ai.dev`.

---

## Structure

```
newakhilesh/
├── frontend/               React 19 + Vite + TailwindCSS
│   ├── src/
│   │   ├── echo/           Echo AI companion (FSM, chat, store, visitor tracking)
│   │   │   ├── core/       EchoFSM.ts, useEcho.ts, visitor.ts, types.ts, constants.ts
│   │   │   ├── chat/       chatService.ts, useChat.ts
│   │   │   ├── store/      echoStore.ts
│   │   │   └── content/    hints.ts
│   │   ├── store/          Zustand global state
│   │   └── lib/            parseAboutMe.ts
│   └── public/             favicon, icons, OG image, droid sprite
│
├── server/
│   ├── echo-api/           Echo brain — port 3005, PM2 name: echo-api
│   │   ├── index.js        Express, CORS, rate limit
│   │   ├── src/
│   │   │   ├── echo.js     Groq-primary + Anthropic-fallback tool loops
│   │   │   ├── systemPrompt.js  Echo persona + dynamic context builder
│   │   │   ├── tools.js    get_github_activity, get_resume
│   │   │   ├── memory.js   per-visitor JSON store
│   │   │   └── modeInference.js  dwell-based HIRE/CURIOUS inference
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
├── content/                editorial JSON (hero, projects, experience, skills, stats, contact)
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
