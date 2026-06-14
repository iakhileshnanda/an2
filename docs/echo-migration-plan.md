# Echo Migration Plan

**Produced:** 2026-06-14  
**Depends on:** `docs/terminal-removal-audit.md`  
**Status:** Blueprint only — no implementation, no deletion.

---

## The Core Shift

V1 architecture:

```
User → Scene → Scene → Terminal → AI
```

V2 architecture:

```
User → Portfolio Page → Echo (Pixel Droid) → Chat Bubble → AI
```

The intelligence is identical. The delivery mechanism changes entirely.

---

## What Echo Is

Echo is the pixel droid (`droid_00.png`). It replaces every chat/terminal surface in the portfolio with a single, always-visible character.

**Why "Echo":** Echo remembers. Echo responds. Echo follows Akhilesh through the portfolio. One syllable, technical, memorable.

Echo operates in three modes. Each mode has a distinct system prompt and conversation goal.

| Mode | Who | Goal |
|---|---|---|
| Visitor | Anyone browsing | Answer questions about Akhilesh. Be curious, be quick. |
| Recruiter | Hiring managers | Every answer ends closer to resume + contact. |
| Admin | Akhilesh only | Mutate content without touching code. |

---

## What Stays

### Backend — Keep Unchanged

| Item | Location | Why |
|---|---|---|
| `GET /api/about` | `routes/about.js` | Parses `about-me.md` → JSON. Powers Echo's knowledge. |
| `POST /api/update` | `routes/about.js` | Admin content mutations. Echo admin mode calls this. |
| `GET /api/stats` | `routes/stats.js` | Live server metrics for dashboard. |
| `GET /api/jobs` | `routes/jobs.js` | Job bot data for dashboard. |
| `GET /api/resume` | `routes/resume.js` | Resume redirect. Echo recruiter mode triggers this. |
| `/ws` | `realtime.js` | WebSocket for live `about:update` events. Still needed for real-time admin. |
| `utils/parseAboutMe.js` | Backend utility | Single source of truth parser. |
| `utils/aboutStore.js` | Backend utility | `applyUpdate()` mutations (add_project, update_skill, etc.) |
| `middleware/rateLimit.js` | Middleware | `chatLimiter` applies to `/api/echo`. |
| `middleware/errorHandler.js` | Middleware | Global error handler. |
| `POST /api/contact` | `routes/contact.js` | Lead storage. Simplified (see below). |

### Frontend — Keep Unchanged

| Item | Location | Why |
|---|---|---|
| `lib/parseAboutMe.ts` | `frontend/src/lib/` | Type definitions used wherever frontend consumes `/api/about`. |
| `lib/adminCommands.ts` | `frontend/src/lib/` | Command parser. Adapts into Echo admin command layer. |
| NanoBot FSM | `src/nanobot/NanoBotFSM.ts` | Complete, production-ready. Migrates as-is. |
| `useNanoBot.ts` | `src/nanobot/useNanoBot.ts` | Movement, roaming, click — migrates as-is. |
| `SpriteAnimator.tsx` | `src/nanobot/SpriteAnimator.tsx` | Canvas sprite renderer — migrates as-is. |
| `types.ts` | `src/nanobot/types.ts` | BotState, ANIMATIONS config — migrates as-is. |
| Sprite assets | `public/droid_00.png`, `droid_00.gif` | Visual identity. |

---

## What Goes

### Remove from Backend

| Item | Location | Reason |
|---|---|---|
| `POST /api/chat` | `routes/chat.js` | AiTerminal-specific route. Replaced by `/api/echo`. |
| `POST /api/maya` | `routes/maya.js` | Redundant after Echo unification. Portfolio mode → Echo. Lab mode → not in V2. |
| `prompts/lab.js` | `prompts/lab.js` | Lab/system-manager persona. Not a V2 concern. |

### Remove from Frontend

| Item | Location | Reason |
|---|---|---|
| `AiTerminal.jsx` | `frontend/src/components/terminal/` | The V1 primary AI interface. Replaced by Echo bubble. |
| `AiTerminal.module.css` | `frontend/src/components/terminal/` | Styles for the above. |
| `MayaChat.tsx` | `frontend/src/components/maya/` | Recruiter chat widget. Logic migrates into Echo. |
| `GestureZones.jsx` | `frontend/src/components/gesture/` | Navigation system removed in V2. |
| `GestureZones.module.css` | `frontend/src/components/gesture/` | Styles for the above. |
| `WorldTransition.jsx` | `frontend/src/components/transition/` | Dual-world transition. V2 has one world. |
| `WorldTransition.module.css` | `frontend/src/components/transition/` | Styles for the above. |
| `PasswordGate.jsx` | `frontend/src/components/password/` | Human mode password gate. No dual-world in V2. |
| `PasswordGate.module.css` | `frontend/src/components/password/` | Styles for the above. |
| `FilmGrain.jsx` | `frontend/src/components/` | System mode aesthetic overlay. Not in V2. |
| `system/scenes/AskScene/` | Scene directory | Terminal CTA scene. Removed with scene system. |
| `system/scenes/AwakeningScene/Terminal.jsx` | Scene file | Decorative typing simulation. Removed with scenes. |
| `App.tsx` (root) | `src/App.tsx` | Playground shell. Not the portfolio app. |

### Remove from Zustand Store

All V1 dual-world and terminal state:
- `mode` (system/human)
- `terminalOpen`
- `chatOpen`
- `showPasswordGate`
- `isAuthenticated`
- `isTransitioning`
- `scrollY` (never written)
- `currentChapter`

---

## What Gets Embedded into Echo

### From `routes/recruiterChat.js` → `/api/echo`

The `recruiterChat.js` route is the best AI implementation in the codebase. It becomes the foundation of `/api/echo`.

Carry forward:
- `buildSystemPrompt()` pattern — reads live `about-me.md` via `aboutStore`, builds prompt dynamically
- Anthropic Claude Sonnet 4.6 as the model
- Prompt caching via `cache_control: { type: 'ephemeral' }` on the stable system prefix
- Conversation history (last 8 turns, filtered for valid roles)
- 429 graceful handling

Extend with:
- Mode parameter (`visitor` | `recruiter` | `admin`)
- Mode-specific system prompt sections appended to the base `about-me.md` prompt
- Server-side lead extraction (strips `%%LEAD%%` server-side, not client-side)
- Admin action detection and routing to `aboutStore.applyUpdate()`

### From `prompts/portfolio.js` → Echo Prompt Layer

Carry forward:
- Category detection logic (greeting, about, skills, hiring, salary, contact, personal, off-topic, jailbreak)
- Lead capture format (`%%LEAD%%{...}%%LEAD%%`)
- Style rules: 3 sentences max, no "rockstar/ninja/guru", real-person tone

Replace:
- Hardcoded `about` const → `about-me.md` via `aboutStore.read()`
- Hardcoded categories string → mode-specific prompt sections

### From `MayaChat.tsx` → Echo Chat Bubble

Carry forward:
- `sendToMaya()` pattern → becomes `sendToEcho(mode, message, history)`
- WebSocket listener for `about:update` events (admin mode live feedback)
- Admin command flow: passphrase → unlock → command → `POST /api/update`
- `sendAdminUpdate()` function (calls `/api/update` with Bearer token)

Replace:
- Generic Maya identity → Echo identity (the droid, not a text chat widget)
- Passphrase logic → role selection via bubble UI (visitor/recruiter/admin)
- Full-size chat textarea → compact chat bubble above the droid sprite

### From `lib/adminCommands.ts` → Echo Admin Command Layer

Carry forward:
- `parseAdminCommand()` function
- `AdminAction` type union
- All five command types: `add_project`, `update_skill`, `set_availability`, `set_meta`, `add_achievement`
- `ADMIN_COMMAND_HELP` string (surfaced in Echo bubble when admin mode is active)

Extend:
- Add natural-language passthrough: if input doesn't match a command pattern, send to Claude with admin-mode prompt and let Claude parse intent
- Return structured commands from Claude → validate with `parseAdminCommand()` → apply

### From `routes/chat.js` → Lead Capture Logic

The `%%LEAD%%` extraction currently happens on the client (AiTerminal parses AI response, sends to `/api/contact`). This is fragile.

In Echo: lead extraction moves server-side.

```
POST /api/echo
  → AI responds with %%LEAD%%{...}%%LEAD%%
  → Server strips it before responding
  → Server calls saveToFile() internally
  → Client receives clean reply only
```

The `contact.js` route becomes a plain form-submission endpoint (no lead parsing, just write to file).

### From `ChatBubble.tsx` → Echo Chat Bubble

Carry forward:
- Role selection UI (visitor / recruiter / admin)
- Conversation step counter (turn X / max Y)
- "Next →" button pattern
- Leaving state message
- FSM integration (`fsm.state === 'TALKING'`, `fsm.role`)

Replace:
- `VISITOR_LINES` / `RECRUITER_LINES` hardcoded arrays → live AI responses from `/api/echo`
- Static scripted turns → real conversation with history
- No "next" button for AI responses (streaming or settled text, no manual advance)

---

## New Endpoint: `/api/echo`

This is the single new backend route. It replaces `/api/chat`, `/api/maya`, and `/api/recruiter-chat`.

```
POST /api/echo
Body: {
  mode: 'visitor' | 'recruiter' | 'admin',
  message: string,
  history?: { role: 'user' | 'assistant', content: string }[]
}

Response: {
  reply: string,
  model: string,
  action?: AdminAction   // only in admin mode, if an action was parsed
}
```

**Model:** Claude Sonnet 4.6 (all modes — no Kimi/Groq/NIM for portfolio V2).

**Rate limit:** `chatLimiter` (10/min) applied to all modes.

**System prompt structure:**

```
[BASE — always]
You are Echo, the AI assistant embedded in Akhilesh Nanda's portfolio.
You speak ABOUT Akhilesh — you are his representative, not him.
[about-me.md content injected here — cached]

[MODE SECTION — appended based on mode param]
Visitor:    Be curious, be brief. 2-3 sentences. Help them discover.
Recruiter:  Every answer moves toward resume + contact. Close the loop.
Admin:      Parse the user's intent. If it maps to a known action, extract
            it as structured JSON. Otherwise confirm what you understood.
```

---

## New Frontend: Echo Module

Location: `frontend/src/nanobot/` (migrated from `src/nanobot/`)

```
frontend/src/nanobot/
├── Echo.tsx                 ← top-level component (replaces NanoBot.tsx)
├── EchoBubble.tsx           ← chat bubble (replaces ChatBubble.tsx)
├── SpriteAnimator.tsx       ← migrated unchanged
├── NanoBotFSM.ts            ← migrated unchanged
├── useNanoBot.ts            ← migrated unchanged
├── types.ts                 ← migrated unchanged
├── useEchoChat.ts           ← NEW: API call layer (sendToEcho, history mgmt)
├── useAdminMode.ts          ← NEW: admin passphrase, command parsing, /api/update calls
└── sprites/
    └── droid_00.png
```

### `useEchoChat.ts` (new)

Handles all communication with `/api/echo`.

- `sendMessage(mode, text, history)` → returns `{ reply, action? }`
- Manages conversation history per mode (visitor/recruiter have separate histories)
- Handles 429, 503 gracefully with in-bubble error messages

### `useAdminMode.ts` (new)

Extracted from `MayaChat.tsx` admin logic.

- Admin passphrase entry (token stored in `sessionStorage` — not `useRef`)
- On unlock: `ADMIN_COMMAND_HELP` shown in bubble
- `executeAdminCommand(text)` → tries `parseAdminCommand()` first → falls back to Echo AI parsing → then `POST /api/update`
- WebSocket listener for `about:update` → shows "Content updated — live in ~2s" in bubble

---

## Lead Capture: Server-Side Move

| V1 | V2 |
|---|---|
| AI appends `%%LEAD%%` JSON to response | AI still appends `%%LEAD%%` JSON |
| Client JavaScript parses it out | Server parses it out |
| Client `POST /api/contact` with extracted data | Server writes lead internally, strips tag before responding |
| Two round trips for one message | One round trip total |
| Lead capture can be blocked by client-side errors | Lead capture is reliable |

`routes/contact.js` survives as a manual contact form endpoint only.

---

## Admin Mode: From MayaChat to Echo

V1 admin path:
```
User types in MayaChat → passphrase detected → admin mode → typed commands → POST /api/update
```

V2 admin path:
```
User clicks Echo → selects Admin → passphrase in bubble → admin mode →
  typed or natural-language commands →
  parseAdminCommand() OR Echo AI parse →
  POST /api/update →
  WebSocket broadcast →
  "Updated live ✓" in bubble
```

The capability is identical. The surface changes from a standalone chat widget to Echo's bubble.

---

## FSM Extension for AI Conversations

The current FSM is scripted: fixed `maxTurns`, hardcoded lines. AI conversations are open-ended.

Two options for V2:

**Option A — Bounded AI (recommended for V1 Echo):**  
Keep `maxTurns` concept. AI responds per turn. After N turns (e.g., 6 for recruiter), Echo says goodbye and leaves. Keeps the droid feeling alive and purposeful, not infinite.

**Option B — Unbounded AI:**  
Remove maxTurns. User closes bubble or droid stays until user clicks away. Simpler but loses the "droid has tasks to do" personality.

Recommendation: Option A. The bounded conversation matches Echo's character — it visits, it helps, it leaves. Aligns with "Echo has work to do."

New FSM state needed: `THINKING` — while waiting for `/api/echo` response. Shows thinking animation (if sprite has one) or idle with ellipsis in bubble.

---

## Migration Sequence (Phases)

This is sequencing only. Not a schedule.

```
Step 1 — Migrate NanoBot files
  src/nanobot/* → frontend/src/nanobot/*
  No changes to logic.

Step 2 — Build useEchoChat.ts
  Wire to POST /api/echo.
  POST /api/echo can be a stub (returns "Echo coming soon") until Step 4.

Step 3 — Build EchoBubble.tsx
  Replace hardcoded lines with useEchoChat() calls.
  Keep role selector as-is.

Step 4 — Build POST /api/echo
  Base: recruiterChat.js logic.
  Add mode routing.
  Add server-side lead extraction.
  Claude Sonnet 4.6 for all modes.

Step 5 — Admin mode
  Extract MayaChat admin logic → useAdminMode.ts
  Wire Echo admin role → useAdminMode.
  WebSocket listener in useAdminMode.

Step 6 — Remove dead code
  Delete routes: /api/chat, /api/maya
  Delete frontend: AiTerminal, MayaChat, GestureZones, WorldTransition, PasswordGate, FilmGrain
  Delete scenes: AskScene, AwakeningScene/Terminal
  Clean Zustand store.

Step 7 — Prompts/portfolio.js content
  Absorb category logic and tone rules into /api/echo system prompt.
  Delete prompts/ folder (lab.js removed in Step 6, portfolio.js absorbed here).
```

---

## Environment Variables — Changes

### Remove

```
VITE_HUMAN_PASSWORD     # no dual-world
KIMI_API_KEY            # Kimi/NIM not used in Echo
NVIDIA_API_KEY          # same
GROQ_API_KEY            # Groq not used in Echo
MAYA_MODEL              # obsolete
```

### Keep

```
ANTHROPIC_API_KEY       # Echo uses Claude
RECRUITER_MODEL         # rename to ECHO_MODEL (optional)
ADMIN_TOKEN             # Echo admin mode
RESUME_URL              # Echo recruiter flow
ABOUT_ME_PATH           # optional override
PORT
NODE_ENV
ALLOWED_ORIGIN
```

---

## What Gets Removed Entirely

No replacement. No migration. Just gone.

- Dual-world system (System + Human modes)
- Scene navigation (GestureZones, WorldTransition)
- PasswordGate
- AwakeningScene decorative Terminal
- AskScene (terminal CTA)
- FilmGrain overlay
- Maya lab mode and `prompts/lab.js`
- `/api/chat` (Kimi/Groq raw terminal route)
- `/api/maya` (lab + portfolio route)
- `prompts/portfolio.js` (absorbed, not preserved)
- All Zustand state related to mode/terminal/world
- `src/App.tsx` (playground shell)

---

## Risk Notes

**Lead capture reliability:** Moving server-side is strictly better. No risk.

**Prompt quality regression:** `recruiterChat.js` (Claude) is the best V1 route. Echo inherits it directly. No regression expected.

**FSM THINKING state:** Requires one new sprite row or a simple CSS overlay (ellipsis animation). Low effort, needed for UX coherence.

**Admin mode security:** V1 used passphrase-as-token pattern (passphrase === ADMIN_TOKEN). This is fragile. V2 should use a separate passphrase (UI-only, entered in bubble) and a separate `ADMIN_TOKEN` (server-only, never in browser). The UI passphrase just unlocks the admin role in Echo; the `Authorization: Bearer` header always carries `ADMIN_TOKEN` from an env var or injected config — never the typed passphrase.

**Content-type coverage:** `content/*.json` files exist (hero.json, projects.json, etc.) but are separate from `about-me.md`. In V2, Echo's AI knowledge comes from `about-me.md` (dynamic, admin-editable). The `content/*.json` files drive section rendering (static build-time). These are parallel systems, not competing. Echo mutates `about-me.md`; section edits may update `content/*.json` separately — this needs a decision before Phase 6.
