# Portfolio V2 — newakhilesh/

Independent sandbox for redesigning akhileshnanda.maya-ai.dev.

The production portfolio continues to run untouched at `../` (root).
This directory is a complete, decoupled clone.

---

## Structure

```
newakhilesh/
├── frontend/          React 19 + Vite + TailwindCSS
│   ├── src/
│   │   ├── system/    6-scene System World (AI/terminal mode)
│   │   ├── human/     7-chapter Human World (story mode)
│   │   ├── components/
│   │   ├── nanobot/   NanoBot prep (sprites, hooks, state — not wired yet)
│   │   ├── styles/    tokens.css, global.css, fonts.css
│   │   └── store/     Zustand global state
│   └── public/        favicon, icons, OG image
├── server/
│   └── portfolio-api/ Express API (port 3002 in V2)
│       ├── routes/    chat, maya, recruiterChat, about, stats, jobs, resume, contact
│       ├── middleware/ cors, rateLimit, errorHandler
│       ├── prompts/   portfolio.js, lab.js
│       └── utils/     parseAboutMe.js, aboutStore.js
├── nginx/
│   └── portfolio-v2.conf   (v2.akhileshnanda.maya-ai.dev, port 3002)
├── deploy/
│   ├── deploy.sh      git pull → build → pm2 restart → nginx reload
│   └── install.sh     first-time server setup
├── content/           editorial JSON + knowledge.md (not wired yet)
│   ├── hero.json
│   ├── projects.json
│   ├── experience.json
│   ├── stats.json
│   ├── contact.json
│   └── knowledge.md
├── docs/
│   ├── current-system-audit.md   complete audit of production system
│   ├── current-architecture.md
│   ├── roadmap.md
│   └── ...
├── assets/            global static assets
├── about-me.md        V2 content source of truth (copy of production)
└── droid_00_32x32/    original droid sprite source files
```

---

## Key Differences from Production

| Setting | Production | V2 |
|---------|-----------|-----|
| PM2 name | `portfolio-api` | `portfolio-api-v2` |
| API port | 3001 | 3002 |
| Domain | `akhileshnanda.maya-ai.dev` | `v2.akhileshnanda.maya-ai.dev` |
| Nginx config | `portfolio.conf` | `portfolio-v2.conf` |
| about-me path | `akhileshnanda/about-me.md` | `newakhilesh/about-me.md` |

---

## Local Dev

```bash
# Frontend
cd frontend
npm install
npm run dev        # http://localhost:5173

# Backend
cd server/portfolio-api
cp .env.example .env
# fill in API keys
node index.js      # http://localhost:3002
```

Frontend dev proxy already configured in `vite.config.js` to forward `/api` to `:3001`.
Change to `:3002` for V2 standalone dev.

---

## NanoBot (Prepared, Not Wired)

Sprite assets live at `frontend/src/nanobot/sprites/`.
Scaffold directories created at `frontend/src/nanobot/`:
- `components/` — React components
- `hooks/` — custom hooks
- `sprites/` — all droid image assets
- `animations/` — animation definitions
- `state/` — FSM and state management

Implementation starts after V2 design is approved.

---

## Content System (Prepared, Not Wired)

`content/` holds JSON files for each section and `knowledge.md` as editorial source.
Not yet wired into components — will be connected during V2 development.

---

## Production Safety

Nothing in this directory is referenced by or affects:
- `../frontend/` (production frontend)
- `../server/` (production API)
- `../nginx/` (production nginx)
- `../deploy.sh` (production deploy)

The production site continues running exactly as-is.
