# Echo — Handoff / Continue Here

Status doc for the Echo AI-companion work. Source specs: `echo-droid-prd.md`
(product) and `echo-implementation-brief.md` (the build brief). Read those for
intent; read this for "where things are and what's left."

_Last updated: 2026-06-16._

---

## TL;DR

Echo (the portfolio droid) now has a real brain. A new, self-contained backend
service — `server/echo-api/` — gives it personality, per-visitor memory, real
GitHub + résumé tool use, and behavioral mode inference. The old generic
`/api/chat` route and its Kimi/Groq prompt are deleted. Frontend is wired to the
new contract. The droid's visual/animation/FSM layer was **not** touched.

Everything is built and locally verified **except the live Anthropic round-trip**,
which needs an API key set on the machine. That's the one thing left to run
end-to-end (the return-visit test).

---

## What's done

- **New backend service** `server/echo-api/` (Express, own port `3005`, own deps).
  Single route: `POST /api/echo`.
- **Personality** — fixed Echo system prompt (`src/systemPrompt.js`), dry/deadpan,
  per the brief, with per-request memory/session/mode context layered on.
- **Memory** — file-based, per `visitorId`, `data/visitors/<id>.json`
  (`src/memory.js`). Path-traversal-guarded, serialized writes. Returning visitors
  get prior context injected; the `trigger:"leaving"` call writes the visit summary.
- **Real tools** (`src/tools.js`, Anthropic tool-use loop in `src/echo.js`):
  - `get_github_activity` — live GitHub. **Authenticated** with `GITHUB_TOKEN`
    (reads private repos via `/user/repos`), or public fallback for
    `GITHUB_USERNAME`. Optional `query` searches/filters across **all** repos by
    name/description/language/topic. Token is header-only — never echoed/logged.
  - `get_resume` — reads `content/resume.json` fresh each call (edit it → answers
    change, no restart). `RESUME_URL` env injected into the payload.
- **Mode** — explicit `HIRE | COLLAB | CURIOUS`, or inferred from section dwell
  times when intent is null (`src/modeInference.js`); ambiguous → Echo asks.
- **Frontend integration** (data layer only, FSM untouched):
  - `frontend/src/echo/core/visitor.ts` — persistent `visitorId` (localStorage),
    per-load visit count, live `sectionDwellTimes`/`timeOnPage` from the store.
  - `frontend/src/echo/chat/chatService.ts` — sends the full contract; maps UI
    intents → `HIRE/COLLAB/CURIOUS`.
  - `frontend/src/echo/chat/useChat.ts` — consumes new response shape; fires the
    `leaving` visit-summary on close.
  - `frontend/vite.config.js` — dev proxy `/api/echo` → `:3005`.
- **Removals** — deleted `server/portfolio-api/routes/chat.js` (old prompt +
  Kimi/Groq) and unregistered it. (`maya.js` still has its own Groq fallback —
  separate recruiter-chat feature, intentionally left alone.)
- **Deploy** — `nginx/portfolio-v2.conf` has a `location /api/echo` block →
  `:3005` (longer prefix than `/api/` → nginx routes it there; 120s read timeout
  for LLM latency).

## Verified locally

- Backend unit tests: mode inference, new-vs-returning prompt building, memory
  round-trip (visit-count bump, section accumulation, summary persistence,
  traversal guard). All pass.
- Real tool data: GitHub tool returns live stats; résumé tool reads the file.
- Unauthenticated GitHub fallback + `query` filtering work.
- Frontend builds clean (`npm run build`).
- `.env` confirmed gitignored; token never logged.

## NOT yet done / pending

- **Live Anthropic call** — no `ANTHROPIC_API_KEY` was available in the build
  env, so `handleEcho` → model round-trip is wired but unrun. **This is the main
  open item** (see "Return-visit test" below).
- **`structuredPayload` / `toolStatus` are returned but not rendered.** The FSM
  `PRESENTING` state is locked/unused, so the real tool data currently lands in
  Echo's text `reply`. Wiring a PRESENTING UI card is deliberate future scope.
- **Production process management** — no PM2/systemd entry added for echo-api yet
  (see Deploy).

---

## Run it

```bash
# 1. Backend brain
cd server/echo-api
cp .env.example .env          # set ANTHROPIC_API_KEY (required) and GITHUB_TOKEN (for private repos)
npm install
npm run dev                   # listens on :3005

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev                   # vite proxies /api/echo -> :3005, rest -> :3001
```

Required env (see `server/echo-api/.env.example`): `ANTHROPIC_API_KEY`.
Useful: `ECHO_MODEL` (default `claude-opus-4-8`; `claude-sonnet-4-6` is
faster/cheaper), `GITHUB_TOKEN` (classic PAT w/ `repo` scope → private repos),
`GITHUB_USERNAME`, `RESUME_URL`, `PORT`, `ALLOWED_ORIGINS`.

> Heads-up: with `GITHUB_TOKEN` set, private repo **names/descriptions/topics**
> become reachable through Echo's replies to site visitors. That's the requested
> behavior — just be aware anything in those fields is effectively public via Echo.

## Return-visit test (the end-to-end check that's left)

1. Set `ANTHROPIC_API_KEY` (and optionally `GITHUB_TOKEN`) in `server/echo-api/.env`.
2. Run backend + frontend. Open the site, click Echo, pick an intent, chat,
   ask "what's he building lately?" (should trigger the GitHub tool with real data).
3. Close the chat (fires the `leaving` summary → writes
   `server/echo-api/data/visitors/<id>.json`).
4. Reload the page (same browser = same `visitorId`, `visit_count` increments)
   and open Echo again. Its opening line should reference the prior visit —
   **demonstrably different from the first-time greeting.** That's PRD done-criterion #2.

## Contract (`POST /api/echo`)

Request: `{ message, history, intent, visitorId, sessionContext, trigger? }`
Response: `{ reply, nextState, toolStatus?, structuredPayload? }`
Full shape in `server/echo-api/README.md`.

---

## Deploy notes

- nginx block is in place (`nginx/portfolio-v2.conf`, `location /api/echo` →
  `localhost:3005`). Reload nginx after deploying.
- **Still needed in prod:** run echo-api under a process manager. The repo uses
  PM2 elsewhere (`server/portfolio-api/ecosystem.config.js`) — add an app entry
  (`cwd: server/echo-api`, `script: index.js`) or a standalone PM2 start, and set
  its env (`ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `ALLOWED_ORIGINS=https://v2...`).
- Prod portfolio-api runs on `:3002` in this config; echo-api is `:3005` — no clash.

## File map

```
server/echo-api/
├── index.js                # express app, /api/echo, /health, CORS, rate limit
├── src/echo.js             # orchestrator: memory + Anthropic tool loop
├── src/systemPrompt.js     # Echo persona + dynamic context builder
├── src/tools.js            # get_github_activity (auth + private + search), get_resume
├── src/memory.js           # per-visitor JSON store
├── src/modeInference.js    # dwell-based HIRE/CURIOUS inference
├── content/resume.json     # structured résumé (edit freely, hot-read)
├── .env.example  .gitignore  README.md  package.json
└── data/visitors/          # runtime, gitignored

frontend/src/echo/
├── core/visitor.ts         # visitorId + session-context tracker (NEW)
├── chat/chatService.ts     # new contract (MODIFIED)
└── chat/useChat.ts         # new response shape + leaving summary (MODIFIED)

nginx/portfolio-v2.conf     # /api/echo -> :3005 (MODIFIED)
```

## Notes for whoever continues

- Do **not** edit the droid's FSM/animation/visual layer (`echo/core/EchoFSM.ts`,
  `echo/character/*`, sprite logic) — locked by the brief.
- To make the PRESENTING tool-card real: it needs an FSM transition into
  `PRESENTING` plus a render path for `structuredPayload`. Both are intentionally
  deferred (FSM is locked) — coordinate before touching the FSM.
- `server/portfolio-api/routes/maya.js` still contains Kimi/Groq fallback code for
  the separate "Maya" recruiter chat. Out of Echo's scope; leave unless that
  feature is being retired too.
