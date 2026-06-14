# Phase 2 Handoff — Droid Local Integration
_Completed: 2026-06-14_

---

## What Was Done

### Droid integrated into portfolio

The NanoBot Droid sprite has been moved out of the root playground and wired into the main portfolio homepage (`/`).

**Files created in `frontend/src/nanobot/`:**

| File | Purpose |
|---|---|
| `types.ts` | Animation definitions, sprite constants, UserRole type (visitor / recruiter / admin / none) |
| `NanoBotFSM.ts` | Finite state machine — IDLE, ROAMING, SLEEPING, TALKING, JUMPING, SQUISH, LEAVING |
| `useNanoBot.ts` | Hook — FSM dispatch, position, roam timers, responsive display size |
| `SpriteAnimator.tsx` | Canvas-based sprite renderer, pixel-perfect, 4× scale desktop / 2× mobile |
| `ChatBubble.tsx` | Full chat UI — role selector, message list, text input, admin gate, loading dots |
| `NanoBot.tsx` | Root component — fixed-positioned, animated movement, wraps everything |

**Files created in `frontend/src/services/`:**

| File | Purpose |
|---|---|
| `mockResponses.ts` | Keyword-based mock response lookup by mode. No API calls. Covers ~15 topics per mode. |

**Files modified:**

| File | Change |
|---|---|
| `frontend/src/pages/Home/index.jsx` | Added `<NanoBot />` outside Suspense (fixed-position overlay) |
| `frontend/public/droid_00.png` | Sprite sheet copied from root `public/` into frontend's public dir |

---

## Current Experience

### Flow

```
User arrives on portfolio → Droid roams the bottom of the screen

Click Droid
  → ChatBubble opens: "Hey! Who are you?"
  → [ Visitor ]  [ Recruiter ]  [ Admin ]  [ None / just passing by ]

None selected → Droid walks off screen, resets

Visitor selected
  → "Hey! I'm NanoBot. Ask me anything..."
  → Text input appears
  → Type a question → mock response in ~400ms
  → Supports: who/about, wing-man, maya/droid, portfolio, contact, work, skills, etc.
  → Close (×) → Droid walks off screen

Recruiter selected
  → "Recruiter mode. Good call. What do you want to know?"
  → Text input appears
  → All responses end with: Resume · LinkedIn · Email
  → Supports: background, Wing-Man, AI experience, leadership, salary, availability, etc.
  → Close (×) → Droid walks off screen

Admin selected
  → Password field only (no chat input)
  → Correct password → "Admin authenticated." (green)
  → Wrong password → "Access denied." (red)
  → Close (×) → Droid walks off screen
```

### Droid Behaviors

- Roams the bottom of the screen autonomously (left/right, random speed)
- Can be sleeping, idle, or in full roam
- Double-click → JUMPING animation (with optional SQUISH on landing)
- Click while TALKING → no interference (bubble stays open)
- Subtle green glow ring when chat is open
- Walks off screen after conversation ends, reappears at left

### Responsiveness

| Viewport | Sprite size | Bubble width |
|---|---|---|
| Desktop (≥480px) | 128×128 (4× sprite) | 272px |
| Mobile (<480px) | 64×64 (2× sprite) | Up to calc(100vw - 24px) |

---

## Mock Response Topics

### Visitor mode (short, 2–3 sentences)
- Who is Akhilesh / about
- Wing-Man
- Maya / NanoBot / droid
- Portfolio / site / built this
- Contact / email / hire
- Work / job / experience
- Skills / tech / stack
- Greetings (hi/hello/hey)
- Goodbyes (bye/later)
- Default fallback

### Recruiter mode (detailed + contact footer)
- Who is Akhilesh / about / background
- Wing-Man
- Maya / NanoBot / multi-agent
- AI / LLM experience
- Leadership / team / senior
- Work history / experience / years
- Resume / CV
- Salary / CTC / compensation
- Availability / join / notice period
- Angular / React / tech stack
- Projects / built / shipped
- Greetings
- Default fallback

---

## Server Structure (for reference before pushing)

```
/home/ubuntu/apps/
├── .env                          ← master secrets (GROQ, TELEGRAM keys)
│
├── nanobot/                      ← AI brain (DO NOT MODIFY)
│   ├── ecosystem.config.js       ← PM2: nanobot-gateway + nanobot-serve
│   ├── scripts/
│   │   ├── start.sh              ← gateway startup
│   │   └── start-serve.sh        ← serve startup (new, Phase 1)
│   ├── config/config.json        ← Groq + Telegram config
│   ├── data/workspace/           ← sessions, memory, cron
│   ├── knowledge/                ← placeholder content files (populate before Phase 3)
│   │   ├── resume.md
│   │   ├── projects.md
│   │   ├── experience.md
│   │   ├── portfolio.md
│   │   └── faq.md
│   ├── prompts/                  ← mode system prompts (placeholder, Phase 3)
│   │   ├── visitor.md
│   │   ├── recruiter.md
│   │   └── admin.md
│   └── docs/                     ← Phase 1 audit docs
│       ├── serve-mode.md
│       ├── pm2-services.md
│       ├── api-verification.md
│       ├── security-review.md
│       ├── resource-usage.md
│       └── portfolio-contract.md
│
└── newakhilesh/                  ← portfolio (push this to GitHub)
    ├── frontend/
    │   ├── src/
    │   │   ├── nanobot/          ← Droid system (NEW in Phase 2)
    │   │   │   ├── NanoBot.tsx
    │   │   │   ├── NanoBotFSM.ts
    │   │   │   ├── useNanoBot.ts
    │   │   │   ├── SpriteAnimator.tsx
    │   │   │   ├── ChatBubble.tsx
    │   │   │   └── types.ts
    │   │   ├── services/
    │   │   │   └── mockResponses.ts  ← mock chat (NEW in Phase 2)
    │   │   └── pages/Home/index.jsx  ← Droid wired in (MODIFIED)
    │   └── public/
    │       └── droid_00.png          ← sprite sheet (COPIED)
    ├── server/portfolio-api/     ← Express backend (unchanged in Phase 2)
    └── docs/
        └── phase2-handoff.md     ← this file
```

---

## Running Locally

```bash
# Frontend dev server
cd /path/to/newakhilesh/frontend
npm install
npm run dev
# → http://localhost:5173

# Backend (optional for Phase 2 — mock responses don't need it)
cd /path/to/newakhilesh/server/portfolio-api
npm install
node index.js
```

---

## What Is NOT Done (Phase 3 scope)

| Task | Status |
|---|---|
| Real API calls to `/api/maya` | Not started — Phase 3 |
| NanoBot serve connection | Not started — Phase 3 |
| Populate `knowledge/` files | Not started — Phase 3 |
| Populate `prompts/` files | Not started — Phase 3 |
| Session management (per-user IDs) | Not started — Phase 3 |
| Admin content editing | Not started — future |
| Recruiter quick-action buttons | Not started — Phase 3 |

---

## Phase 3 Checklist (when ready)

1. Populate `nanobot/knowledge/*.md` with real content from about-me.md
2. Populate `nanobot/prompts/visitor.md` and `recruiter.md` with final system prompt text
3. Modify `server/portfolio-api/routes/maya.js` to proxy to `http://127.0.0.1:8900/v1/chat/completions`
4. Accept `{ message, mode }` in `/api/maya` — inject mode prefix before forwarding
5. Add env: `NANOBOT_SERVE_URL=http://127.0.0.1:8900` to portfolio-api `.env`
6. Replace `mockResponses.ts` calls in ChatBubble with real `fetch('/api/maya', ...)`
7. Handle 503 (NanoBot offline) gracefully in ChatBubble
8. Add recruiter quick-action preset buttons
9. Test all three modes end-to-end against live NanoBot

---

## Push to GitHub

```bash
cd /path/to/newakhilesh
git add .
git commit -m "Phase 2: integrate Droid into portfolio with mock responses"
git push origin main
```

**Only push `newakhilesh/` — the `nanobot/` directory stays on the server only.**
