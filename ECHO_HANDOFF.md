# Echo — Handoff / Continue Here

Status doc for the Echo AI-companion work. Source specs: `echo-droid-prd.md`
(product) and `echo-implementation-brief.md` (the build brief). Read those for
intent; read this for "where things are and what's left."

_Last updated: 2026-06-16._

---

## TL;DR

Echo is **fully live in production** at `https://deal.maya-ai.dev` and
`https://v2.akhileshnanda.maya-ai.dev`. The backend runs on `:3005` under PM2,
responses are working end-to-end via Groq. The only pending items are wiring
`GITHUB_TOKEN` + `ANTHROPIC_API_KEY` into the env, and the return-visit memory
test.

---

## What's done

### Backend — `server/echo-api/`
- Express service on port `3005`. Single route: `POST /api/echo`. Health: `GET /health`.
- **LLM provider chain: Groq → Anthropic haiku fallback.**
  - Primary: `llama-3.3-70b-versatile` via Groq (~700ms end-to-end, 33ms model compute).
  - Fallback: `claude-haiku-4-5-20251001` via Anthropic (fires only if Groq errors).
  - Two separate tool loops: Groq uses OpenAI format, Anthropic uses its own — both in `src/echo.js`.
- **Personality** — fixed system prompt (`src/systemPrompt.js`), dry/deadpan per the brief.
- **Memory** — file-based per `visitorId` at `data/visitors/<id>.json` (`src/memory.js`).
  Returning visitors get prior context injected; `trigger:"leaving"` writes the visit summary.
- **Tools** (`src/tools.js`):
  - `get_github_activity` — live GitHub, authenticated with `GITHUB_TOKEN` (private repos) or
    public fallback. Token is header-only, never logged or returned.
  - `get_resume` — reads `content/resume.json` fresh every call (edit → live, no restart).
- **Mode inference** — `HIRE | COLLAB | CURIOUS` from explicit intent or section dwell times.

### Infrastructure
- **PM2**: `echo-api` (id 7) running, state persisted with `pm2 save`.
- **nginx**: `portfolio-v2` site enabled, serves `deal.maya-ai.dev` + `v2.akhileshnanda.maya-ai.dev`.
  `location /api/echo → :3005` with 120s read timeout for LLM latency.
- **Deploy script**: `./deploy.sh` from repo root — pulls, installs, builds, copies nginx conf,
  reloads nginx, restarts PM2, runs health checks. One command to ship.
- **ALLOWED_ORIGINS**: both prod domains set in `server/echo-api/.env`.
- **NVIDIA_API_KEY** stored in `/home/ubuntu/apps/.env` for future use (inference is blocked
  from Oracle Cloud egress — works fine from local machines).

### Frontend
- Built and serving from `frontend/dist/`.
- `visitor.ts` — persistent `visitorId`, visit count, dwell times.
- `chatService.ts` — sends full contract to `/api/echo`.
- `useChat.ts` — handles response shape, fires `leaving` summary on chat close.
- Vite dev proxy: `/api/echo → :3005`.

### Domains
| Domain | Serves |
|---|---|
| `deal.maya-ai.dev` | v2 portfolio + Echo (primary) |
| `v2.akhileshnanda.maya-ai.dev` | same |
| `akhileshnanda.maya-ai.dev` | original v1 portfolio — untouched |

---

## Pending / What's left

### Must-do
1. **`GITHUB_TOKEN`** — add a classic PAT (`repo` scope) to `server/echo-api/.env`.
   Without it Echo can only see public repos. With it, private repo names/descriptions
   become reachable via Echo's replies — intentional, just be aware.
2. **`ANTHROPIC_API_KEY`** — add to `server/echo-api/.env` for the Groq fallback.
   Groq handles all load; this only fires if Groq goes down.
3. **Return-visit memory test** — open the site, chat with Echo, close (fires `leaving`
   summary → writes `data/visitors/<id>.json`), reload the page, open Echo again.
   Its opening line must reference the prior visit. That's PRD done-criterion #2.
   Currently unverified because GITHUB_TOKEN isn't set yet.

### Future scope (deliberate deferrals)
- **PRESENTING tool-card UI** — `structuredPayload` and `toolStatus` are returned by the
  API but not rendered in the frontend. Real GitHub/resume data shows up in Echo's text
  reply for now. Wiring a card requires an FSM transition into `PRESENTING` — coordinate
  before touching the FSM.
- **NVIDIA NIM** — key stored, but Oracle Cloud blocks outbound POST to NVIDIA's inference
  backend. Would work from any non-Oracle host. Add as a third provider tier when needed.

---

## Deploy

```bash
cd ~/apps/newakhilesh
./deploy.sh        # pull → install → build → nginx reload → pm2 restart → health check
```

For env-only changes (new key, model swap) — no rebuild needed:
```bash
pm2 restart echo-api --update-env
```

---

## Env reference — `server/echo-api/.env`

| Key | Status | Notes |
|---|---|---|
| `GROQ_API_KEY` | ✅ set | Primary LLM. From `/home/ubuntu/apps/.env`. |
| `GROQ_MODEL` | ✅ set | `llama-3.3-70b-versatile` |
| `ECHO_MODEL` | ✅ set | `claude-haiku-4-5-20251001` (Anthropic fallback) |
| `ANTHROPIC_API_KEY` | ⚠ placeholder | Add when available |
| `GITHUB_TOKEN` | ⚠ empty | Add classic PAT with `repo` scope |
| `GITHUB_USERNAME` | ✅ set | `iakhileshnanda` |
| `PORT` | ✅ set | `3005` |
| `NODE_ENV` | ✅ set | `production` |
| `ALLOWED_ORIGINS` | ✅ set | Both prod domains |

---

## File map

```
newakhilesh/
├── deploy.sh                   # one-command deploy
├── nginx/portfolio-v2.conf     # /api/echo -> :3005, /api/ -> :3002
│
├── server/echo-api/
│   ├── index.js                # express app, CORS, rate limit
│   ├── src/echo.js             # Groq-primary + Anthropic-fallback tool loops
│   ├── src/systemPrompt.js     # Echo persona + dynamic context builder
│   ├── src/tools.js            # get_github_activity, get_resume
│   ├── src/memory.js           # per-visitor JSON store
│   ├── src/modeInference.js    # dwell-based mode inference
│   ├── content/resume.json     # hot-read résumé (edit freely)
│   ├── .env                    # secrets — gitignored
│   └── data/visitors/          # runtime memory — gitignored
│
└── frontend/
    ├── dist/                   # built output served by nginx
    └── src/echo/
        ├── core/visitor.ts     # visitorId + session context
        ├── chat/chatService.ts # API contract
        └── chat/useChat.ts     # response handler + leaving summary
```

## Hard rules (don't break these)

- Do **not** touch `echo/core/EchoFSM.ts` or `echo/character/*` — FSM and sprite
  layer are locked.
- Do **not** touch `~/apps/nanobot` — Telegram bot, separate system, working fine.
- `server/portfolio-api/routes/maya.js` has its own Groq-based recruiter chat ("Maya").
  Separate feature, leave it alone unless explicitly retiring it.
