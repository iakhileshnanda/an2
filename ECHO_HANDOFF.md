# Echo — Handoff / Continue Here

Status doc for the Echo AI-companion work. Source spec: `echo-droid-prd.md`.

_Last updated: 2026-06-17._

---

## TL;DR

Echo is **fully live in production** at `https://deal.maya-ai.dev` and
`https://v2.akhileshnanda.maya-ai.dev`. Backend runs on `:3005` under PM2,
responses working end-to-end via Groq. Pending: wire `GITHUB_TOKEN` +
`ANTHROPIC_API_KEY` into env, and verify return-visit memory.

---

## What's done

### Backend — `server/echo-api/`
- Express service on port `3005`. Route: `POST /api/echo`. Health: `GET /health`.
- **LLM provider chain: Groq → Anthropic haiku fallback.**
  - Primary: `llama-3.3-70b-versatile` via Groq (~700ms end-to-end).
  - Fallback: `claude-haiku-4-5-20251001` via Anthropic (fires only if Groq errors).
  - Two separate tool loops: Groq uses OpenAI format, Anthropic uses its own — both in `src/echo.js`.
- **Personality** — fixed system prompt (`src/systemPrompt.js`), dry/deadpan per the brief. No mode/intent layering — Echo reads the room from conversation, not a label.
- **Memory** — file-based per `visitorId` at `data/visitors/<id>.json` (`src/memory.js`).
  Returning visitors get prior context injected; `trigger:"leaving"` writes the visit summary.
- **Tools** (`src/tools.js`):
  - `get_github_activity` — live GitHub, authenticated with `GITHUB_TOKEN` (private repos) or public fallback.
  - `get_resume` — reads `content/resume.json` fresh every call (edit → live, no restart).

### Infrastructure
- **PM2**: `echo-api` (id 7) running, state persisted with `pm2 save`.
- **nginx**: `portfolio-v2` site, serves both prod domains. `/api/echo → :3005` with 120s read timeout.
- **Deploy script**: `./deploy.sh` — pull → install → build → nginx reload → pm2 restart → health check.
- **ALLOWED_ORIGINS**: both prod domains set in `server/echo-api/.env`.

### Frontend — `frontend/src/echo/`
- Built and serving from `frontend/dist/`.
- `core/visitor.ts` — persistent `visitorId`, visit count, section dwell times.
- `chat/chatService.ts` — sends message + history + sessionContext to `/api/echo`. No intent/mode field.
- `chat/useChat.ts` — fires `leaving` summary trigger on chat close (fire-and-forget).
- `echo/echo-overlay.ts` — framework-free green terminal layer tracking the droid:
  - **Idle text** — rotating one-liners below the droid, opacity cross-fade every 3s.
  - **Input** — clicking the droid opens a bare `>` prompt with blinking cursor. Enter → `/api/echo`. Esc/re-click closes. Additive — coexists with the FSM's own click handler.
  - **Response bubble** — CSS-only pixel speech bubble above the droid (stepped box-shadow border, no image assets). Auto-dismisses after 8s or on next Enter.
- **Chat bubble** (`chat/ChatBubble.tsx`) — opens directly to input on droid click. No intent/mode selection screen.

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
   Without it Echo can only see public repos. With it, private repo names/descriptions are reachable — intentional, just be aware.
2. **`ANTHROPIC_API_KEY`** — add to `server/echo-api/.env` for the Groq fallback.
   Groq handles all load; this only fires if Groq goes down.
3. **Return-visit memory test** — open the site, chat with Echo, close (fires `leaving`
   summary → writes `data/visitors/<id>.json`), reload, open Echo again.
   Its opening line must reference the prior visit. That's PRD done-criterion #2.
   Currently unverified because GITHUB_TOKEN isn't set yet.

### Future scope (deliberate deferrals)
- **PRESENTING tool-card UI** — `structuredPayload` and `toolStatus` are returned by the
  API but not rendered. Real GitHub/resume data shows in Echo's text reply for now.
  Wiring a card requires an FSM transition into `PRESENTING` — coordinate before touching the FSM.
- **NVIDIA NIM** — key stored, but Oracle Cloud blocks outbound POST to NVIDIA's inference
  backend. Add as a third provider tier when needed.

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
| `GROQ_API_KEY` | ✅ set | Primary LLM. |
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
│   ├── content/resume.json     # hot-read résumé (edit freely)
│   ├── .env                    # secrets — gitignored
│   └── data/visitors/          # runtime memory — gitignored
│
└── frontend/
    ├── dist/                   # built output served by nginx
    └── src/echo/
        ├── echo-overlay.ts     # framework-free green terminal overlay (idle text, input, bubble)
        ├── EchoRoot.tsx        # mounts Echo character + overlay
        ├── core/visitor.ts     # visitorId + session context
        ├── chat/chatService.ts # API contract — sendToEcho(message, history, opts?)
        ├── chat/useChat.ts     # response handler + leaving summary
        └── chat/ChatBubble.tsx # chat UI (opens directly to input, no intent screen)
```

## Hard rules (don't break these)

- Do **not** touch `echo/core/EchoFSM.ts` or `echo/character/*` — FSM and sprite layer are locked.
- Do **not** touch `~/apps/nanobot` — Telegram bot, separate system, working fine.
- `server/portfolio-api/routes/maya.js` has its own Groq-based recruiter chat ("Maya"). Leave it alone unless explicitly retiring it.
- `src/modeInference.js` exists in the backend but is unused — the HIRE/COLLAB/CURIOUS intent system was removed. Do not re-introduce it.
