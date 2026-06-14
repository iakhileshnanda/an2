# NanoBot ↔ Droid Integration Audit
_Generated: 2026-06-14_

---

## 1. System Inventory

### NanoBot (`/home/ubuntu/apps/nanobot/`)
| Property | Value |
|---|---|
| Runtime | Python 3.12, virtualenv |
| Process Manager | PM2 (`ecosystem.config.js`) |
| Entry Command | `nanobot gateway` |
| Gateway Port | 18790 (localhost only) |
| Serve Port | 8900 (OpenAI-compat HTTP server, separate command) |
| LLM Provider | Groq (`meta-llama/llama-4-scout-17b-16e-instruct`) |
| Telegram | Enabled, polling, admin-only (ID 851273358) |
| Config | `/home/ubuntu/apps/nanobot/config/config.json` |
| Secrets | `/home/ubuntu/apps/.env` (master) |

**NanoBot has two modes:**
- `nanobot gateway` — Multi-channel daemon (Telegram + WebSocket hub). Currently running via PM2.
- `nanobot serve` — Standalone OpenAI-compatible REST API. Not currently running.

**NanoBot `serve` endpoints:**
```
POST /v1/chat/completions   ← main chat endpoint
GET  /v1/models
GET  /health
```

**Request shape (`/v1/chat/completions`):**
```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "stream": false,
  "session_id": "droid:visitor:abc123"
}
```

**Response shape:**
```json
{
  "choices": [{ "message": { "role": "assistant", "content": "..." } }]
}
```

---

### Droid / Portfolio (`/home/ubuntu/apps/newakhilesh/`)
| Property | Value |
|---|---|
| Frontend | React 19 + Vite, port 5173 |
| Backend | Express.js, port 3002 |
| PM2 name | `portfolio-api-v2` |
| Current `/api/maya` | Calls NVIDIA NIM → Groq fallback directly |
| NanoBot Droid | Fully built (`frontend/src/nanobot/`), NOT wired into main UI |
| Sprite | `public/droid_00.png` (608×224, 7 rows × 19 cols, 32×32 frames) |

**Droid component files:**
```
frontend/src/nanobot/
├── NanoBot.tsx          ← main component (fixed-position, clickable)
├── NanoBotFSM.ts        ← FSM: IDLE, ROAMING, SLEEPING, TALKING, JUMPING, SQUISH, LEAVING
├── useNanoBot.ts        ← hook: FSM dispatch, position, timers
├── ChatBubble.tsx       ← dialog above sprite (has visitor/recruiter role picker)
├── SpriteAnimator.tsx   ← canvas sprite renderer
└── types.ts             ← animation row/frame/fps definitions
```

**ChatBubble current state:**
- Shows role picker: `visitor` / `recruiter`
- After selection: shows pre-written static text lines (NOT live API)
- No admin mode yet
- No API integration yet

---

## 2. Communication Layer Decision

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| `nanobot gateway` WebSocket (port 18790) | Single process | Complex protocol, token auth needed, WS overkill for request/response |
| `nanobot serve` REST (port 8900) | OpenAI-compatible, simple HTTP, stateless | Requires second PM2 process |
| Direct Groq from portfolio-api | Simpler | Violates architecture: Droid must not know Groq |
| Local bridge file | No network overhead | Polling-based, fragile |

**Decision: `nanobot serve` REST on port 8900.**

Reasons:
- Clean OpenAI-compatible interface — no custom protocol
- Stateless HTTP fits request/response chat perfectly
- Portfolio-api already makes HTTP calls (to NVIDIA NIM, Groq) — same pattern
- Telegram channel continues unaffected on gateway (port 18790)
- Simple to health-check and restart independently

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   USER BROWSER                      │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │         Droid UI  (React, port 5173)         │  │
│  │                                              │  │
│  │  NanoBot.tsx  →  ChatBubble.tsx              │  │
│  │       ↓                                      │  │
│  │  nanobot.service.ts                          │  │
│  │       ↓  POST /api/maya                      │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────┐
│         Portfolio API  (Express, port 3002)         │
│                                                     │
│  routes/maya.js                                     │
│  ├── validates request                              │
│  ├── injects mode system prompt                     │
│  ├── rate limits (10/min)                           │
│  └── POST http://127.0.0.1:8900/v1/chat/completions │
└─────────────────────────────────────────────────────┘
                        │ localhost only
                        ▼
┌─────────────────────────────────────────────────────┐
│         NanoBot Serve  (Python, port 8900)          │
│                                                     │
│  POST /v1/chat/completions                          │
│  ├── agent loop                                     │
│  ├── session management                             │
│  ├── memory + knowledge base                        │
│  └── Groq API call                                  │
└─────────────────────────────────────────────────────┘
                        │ HTTPS
                        ▼
                   Groq Cloud API

(Separate, unaffected)
┌─────────────────────────────────────────────────────┐
│         NanoBot Gateway  (Python, port 18790)       │
│         Telegram polling channel                    │
└─────────────────────────────────────────────────────┘
```

---

## 4. API Contract

### Frontend → Portfolio API

**Endpoint:** `POST /api/maya`

**Request:**
```json
{
  "message": "Tell me about Akhilesh",
  "mode": "visitor" | "recruiter" | "admin",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "adminToken": "..." // only when mode === "admin"
}
```

**Response (success):**
```json
{
  "reply": "Akhilesh is a Senior Frontend Engineer...",
  "mode": "recruiter"
}
```

**Response (NanoBot offline):**
```json
{
  "error": "NanoBot is currently offline. Please try again later.",
  "offline": true
}
```
HTTP status: 503

**Response (admin auth):**
```json
{
  "reply": "Admin authenticated.",
  "mode": "admin"
}
```

---

### Portfolio API → NanoBot Serve

**Endpoint:** `POST http://127.0.0.1:8900/v1/chat/completions`

**Request (visitor mode):**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are NanoBot, Akhilesh Nanda's personal AI assistant on his portfolio website. The user is a VISITOR — a curious person exploring the site. Keep responses short: 3–5 sentences max. Be friendly and conversational."
    },
    { "role": "user", "content": "Tell me about Akhilesh" }
  ],
  "stream": false,
  "session_id": "droid:visitor:web"
}
```

**Request (recruiter mode):**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are NanoBot, Akhilesh Nanda's personal AI. The user is a RECRUITER. Provide detailed, professional answers about Akhilesh's experience, skills, and projects. Always end your response with: Resume: https://... | LinkedIn: https://... | Email: theakhileshnanda@gmail.com"
    },
    { "role": "user", "content": "Tell me about Wing-Man" }
  ],
  "stream": false,
  "session_id": "droid:recruiter:web"
}
```

---

## 5. Required Changes

### Backend (`server/portfolio-api/`)

| File | Change |
|---|---|
| `routes/maya.js` | **Rewrite** — proxy to `http://127.0.0.1:8900/v1/chat/completions` instead of NVIDIA NIM |
| `index.js` | Add `/api/maya` health fallback response when NanoBot is down |
| `.env` | Add `NANOBOT_SERVE_URL=http://127.0.0.1:8900` and `ADMIN_DROID_TOKEN=<secret>` |

### Frontend (`frontend/src/`)

| File | Change |
|---|---|
| `services/nanobot.service.ts` | **Create** — `sendMessage(msg, mode, history)`, error handling |
| `nanobot/ChatBubble.tsx` | **Extend** — add admin mode button, replace static lines with live API calls |
| `nanobot/NanoBot.tsx` | **Minor** — pass `onSendMessage` prop from parent |
| `pages/Home/index.jsx` | **Wire** — import and render `<NanoBot />` |

### NanoBot / Infrastructure

| Action | Detail |
|---|---|
| Start `nanobot serve` | New PM2 entry or `ecosystem.config.js` addition |
| Configure port 8900 | `--port 8900 --host 127.0.0.1` |
| Firewall | Port 8900 must stay internal (localhost only) — never expose to public |

---

## 6. Security Review

| Risk | Mitigation |
|---|---|
| API keys exposed to browser | Portfolio-api holds all keys; browser only ever hits `/api/maya` |
| Admin token brute force | Rate-limited (10/min), constant-time compare, never returned in responses |
| NanoBot port 8900 exposed | Bind to `127.0.0.1` only; Nginx never proxies it |
| Stack traces leaking | `errorHandler.js` already strips traces; add specific 503 for NanoBot down |
| Session bleed between users | Use separate `session_id` per mode: `droid:visitor:web`, `droid:recruiter:web` |
| Prompt injection via message field | Portfolio-api sanitizes `message` length (max 500 chars) before forwarding |

---

## 7. Chat Flow

```
User clicks Droid
  → NanoBot.tsx dispatches CLICK event to FSM
  → FSM: ROAMING → TALKING
  → ChatBubble opens

  "Who are you?"
  [ Visitor ]  [ Recruiter ]  [ Admin ]

User picks role
  → FSM dispatches ROLE_SELECTED
  → ChatBubble switches to chat input

User types message
  → nanobot.service.ts: POST /api/maya { message, mode, history }
  → Loading state: Droid shows TALKING animation
  → Response arrives
  → ChatBubble shows reply in speech bubble

NanoBot offline
  → 503 response
  → ChatBubble: "NanoBot is currently offline. Please try again later."
  → Droid stays in IDLE

User closes bubble
  → FSM: TALKING → LEAVING → ROAMING
```

### Recruiter mode — quick actions
Pre-filled buttons (no typing required):
- "Tell me about Akhilesh"
- "Tell me about Wing-Man"
- "AI Experience"
- "Leadership Experience"
- "Resume"

After every recruiter response, append links:
- Resume PDF link
- LinkedIn URL
- Email: theakhileshnanda@gmail.com

### Admin mode
- Show password field only (no chat input)
- Validate against `ADMIN_DROID_TOKEN` env var in portfolio-api
- Return `{ reply: "Admin authenticated.", mode: "admin" }`
- No content editing in this phase

---

## 8. Deployment Plan

### Phase 0 — Infrastructure (5 min)
1. Add `nanobot serve` to PM2 ecosystem or run as separate process
2. Verify `http://127.0.0.1:8900/health` returns `{"status": "ok"}`
3. Add env vars to `server/portfolio-api/.env`

### Phase 1 — Backend bridge (30 min)
1. Rewrite `routes/maya.js` to proxy to NanoBot serve
2. Add mode-specific system prompts
3. Add 503 fallback when NanoBot unreachable
4. Test with `curl -X POST http://localhost:3002/api/maya -d '{"message":"hi","mode":"visitor"}'`

### Phase 2 — Service layer (20 min)
1. Create `frontend/src/services/nanobot.service.ts`
2. Implement `sendMessage`, `checkHealth`, error types

### Phase 3 — ChatBubble wiring (45 min)
1. Add admin mode to role picker in `ChatBubble.tsx`
2. Replace static pre-written lines with live API calls via service
3. Add recruiter quick-action buttons
4. Add loading state (dots / spinner in bubble)
5. Add error display ("NanoBot offline")

### Phase 4 — Wire into portfolio (15 min)
1. Import `<NanoBot />` in `pages/Home/index.jsx`
2. Test all three modes end-to-end

### Phase 5 — QA
- Visitor: short answers ✓
- Recruiter: detailed + links appended ✓
- Admin: auth only ✓
- NanoBot down: graceful error ✓
- Rate limit: 10/min respected ✓
- No API keys in browser network tab ✓

---

## 9. Recommended Implementation Order

1. `Phase 0` — Start NanoBot serve, confirm health
2. `Phase 1` — Backend bridge (unblocks all testing)
3. `Phase 2` — Service layer
4. `Phase 3` — ChatBubble live wiring
5. `Phase 4` — Wire into main UI
6. `Phase 5` — QA all modes

Total estimated time: ~2 hours

---

## 10. Open Questions (Resolve Before Coding)

1. **Admin token** — Use existing `ADMIN_TOKEN` from `.env` or create a separate `ADMIN_DROID_TOKEN`?
2. **NanoBot serve sessions** — Use a single shared `droid:visitor:web` session (all visitors share history) or generate per-tab UUIDs?
3. **Recruiter links** — Confirm Resume PDF URL and LinkedIn URL to hardcode in system prompt.
4. **NanoBot serve PM2** — Add to existing `ecosystem.config.js` in nanobot dir, or add to portfolio-api ecosystem?
