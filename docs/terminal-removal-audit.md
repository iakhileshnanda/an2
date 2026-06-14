# Terminal Removal Audit

**Produced:** 2026-06-14  
**Purpose:** Inventory every terminal/chat surface before migration to Echo.  
**Status:** Audit only — nothing deleted, nothing changed.

---

## Scope

Search covered:
- `frontend/src/` — React portfolio frontend
- `server/portfolio-api/` — Express backend
- `src/` — NanoBot playground (root)
- `frontend/src/lib/` — shared utilities

---

## 1. Frontend Terminal Components

### 1.1 `frontend/src/components/terminal/AiTerminal.jsx`

| Field | Detail |
|---|---|
| **Purpose** | Full-screen overlay AI chat terminal. The V1 primary AI interface. |
| **Trigger** | Opened via Zustand `terminalOpen` state (set by GestureZones bottom bar) |
| **API** | `POST /api/chat` (Kimi K2 → Groq fallback) |
| **Features** | Message history, typing animation, lead capture parsing (strips `%%LEAD%%` JSON from AI response, sends to `POST /api/contact`) |
| **Dependencies** | `useStore.js` (terminalOpen), `/api/chat`, `/api/contact` |
| **Replacement** | Entire interaction capability moves into Echo's chat bubble |
| **Action** | REMOVE |

---

### 1.2 `frontend/src/components/maya/MayaChat.tsx`

| Field | Detail |
|---|---|
| **Purpose** | Recruiter-facing Maya chat widget (TypeScript, no styling included). |
| **API** | `POST /api/recruiter-chat` (Claude Sonnet 4.6 with prompt caching) |
| **Features** | Recruiter mode (AI-backed), admin mode (typed commands mutate `about-me.md`), WebSocket listener for live `about:update` events, conversation history (last 8 turns) |
| **Dependencies** | `/api/recruiter-chat`, `/api/update`, `/ws`, `lib/adminCommands.ts`, `lib/parseAboutMe.ts` |
| **Replacement** | Recruiter mode → Echo recruiter flow. Admin mode → Echo admin mode (re-implemented as structured commands through Echo bubble). |
| **Action** | REMOVE — but all logic migrates into Echo |

---

### 1.3 `frontend/src/system/scenes/AwakeningScene/Terminal.jsx`

| Field | Detail |
|---|---|
| **Purpose** | Purely decorative. Scroll-triggered typing simulation that displays MCP server code (maya-miro). No actual AI or user input. |
| **API** | None |
| **Features** | `IntersectionObserver` → types tokens character by character. Static content — hardcoded `CODE_LINES` array. |
| **Dependencies** | `Terminal.module.css`, Tailwind |
| **Replacement** | None needed. This is visual storytelling in V1. V2 has no AwakeningScene. |
| **Action** | REMOVE (lives inside AwakeningScene which is removed with the entire scene system) |

---

### 1.4 `frontend/src/system/scenes/AskScene/index.jsx`

| Field | Detail |
|---|---|
| **Purpose** | The CTA scene that surfaces the "TALK TO MY AI" button and opens the AI terminal. |
| **API** | None directly — sets `terminalOpen` in Zustand which opens `AiTerminal.jsx` |
| **Features** | Easter egg hint text, "RESUME" link (currently `#`), "CONTACT" link, "TALK TO MY AI" button |
| **Dependencies** | `useStore.js` (chatOpen, terminalOpen), Framer Motion |
| **Replacement** | CTA intent (resume, contact, talk to AI) is fulfilled by Echo's recruiter flow. No dedicated scene needed. |
| **Action** | REMOVE (part of scene system removal) |

---

## 2. Frontend Utilities (Terminal-Adjacent)

### 2.1 `frontend/src/lib/adminCommands.ts`

| Field | Detail |
|---|---|
| **Purpose** | Parses text commands typed into MayaChat admin mode into structured `{ type, payload }` actions for `POST /api/update`. |
| **Commands** | `add project`, `update skill`, `set availability`, `set meta`, `add achievement` |
| **Dependencies** | Used only by `MayaChat.tsx` |
| **Replacement** | Echo admin mode will accept similar natural-language commands. This parser may be adapted (not deleted) into an Echo-specific command layer. |
| **Action** | KEEP / ADAPT — move to Echo's admin command layer |

---

### 2.2 `frontend/src/lib/parseAboutMe.ts`

| Field | Detail |
|---|---|
| **Purpose** | Client-side TypeScript types + parser for `about-me.md` grammar. Used for type-safety in MayaChat and admin mode. |
| **Dependencies** | Used by `MayaChat.tsx` |
| **Replacement** | Types (Identity, Role, Project, AboutMe, etc.) are needed anywhere the frontend consumes `/api/about`. Keep as a type library. |
| **Action** | KEEP — not terminal-specific, it's a shared type/parser library |

---

## 3. Backend Routes

### 3.1 `server/portfolio-api/routes/chat.js` → `POST /api/chat`

| Field | Detail |
|---|---|
| **Purpose** | Primary chat endpoint for V1 AI terminal (AiTerminal.jsx). |
| **AI chain** | Kimi K2 (NVIDIA NIM) → Groq Llama 3.3 70B fallback |
| **Features** | Lead capture via `%%LEAD%%` JSON injected into system prompt, resume detection (`RESUME_REQUEST` shortcut), conversation history (last 6 messages) |
| **System prompt** | Hardcoded 170-line prompt in `chat.js` itself. Persona: "A.N AI". Rules: witty when casual, professional for recruiter signals. |
| **Lead capture** | Silent extraction — AI appends structured JSON at end of response. Client parses and `POST /api/contact`. |
| **Dependencies** | `chatLimiter`, `node-fetch`, `KIMI_API_KEY`, `GROQ_API_KEY`, `RESUME_URL` |
| **Replacement** | AI capability → `/api/echo` (new unified endpoint). Lead capture logic → preserved in Echo's server route. |
| **Action** | REPLACE with `/api/echo` |

---

### 3.2 `server/portfolio-api/routes/maya.js` → `POST /api/maya`

| Field | Detail |
|---|---|
| **Purpose** | Maya AI endpoint supporting two modes: `lab` (calm system persona) and `portfolio` (witty recruiter assistant). |
| **AI chain** | NIM Llama 3.3 70B → Groq fallback |
| **Features** | Mode-based prompt routing, short responses (max 220 tokens), basic lead capture in portfolio prompt |
| **Prompt files** | `prompts/portfolio.js` — witty, hiring-aware, 3 sentences max, lead capture. `prompts/lab.js` — calm, minimal, system persona. |
| **Dependencies** | `chatLimiter`, `node-fetch`, `KIMI_API_KEY`, `NVIDIA_API_KEY`, `GROQ_API_KEY` |
| **Replacement** | Portfolio mode → absorbs into `/api/echo` (Echo's visitor + recruiter flows). Lab mode → not needed in V2 (lab is not a public-facing surface). |
| **Action** | CONSOLIDATE into `/api/echo`. Remove lab mode. |

---

### 3.3 `server/portfolio-api/routes/recruiterChat.js` → `POST /api/recruiter-chat`

| Field | Detail |
|---|---|
| **Purpose** | High-quality recruiter chat powered by Claude Sonnet 4.6. The most capable chat route. |
| **AI** | Anthropic Claude Sonnet 4.6, prompt caching enabled on system prompt |
| **Features** | System prompt built fresh from `about-me.md` on every call (but cached by Anthropic), last 8 turns of history, graceful 429 handling |
| **System prompt** | Dynamically built via `buildSystemPrompt()` — reads live `about-me.md`, injects tone and meta from `aboutStore`. Maya persona. |
| **Dependencies** | `chatLimiter`, `@anthropic-ai/sdk`, `aboutStore`, `ANTHROPIC_API_KEY`, `RECRUITER_MODEL` |
| **Replacement** | This is the best route — it becomes the foundation of `/api/echo`. The `buildSystemPrompt()` pattern carries forward directly. |
| **Action** | RENAME / EVOLVE into `/api/echo` |

---

### 3.4 `server/portfolio-api/routes/contact.js` → `POST /api/contact`

| Field | Detail |
|---|---|
| **Purpose** | Receives extracted lead data from the frontend (parsed out of `%%LEAD%%` blocks). Persists to `~/contacts/leads.json` and `~/contacts/sensitive_alerts.json`. |
| **Features** | Saves 14 lead fields, sensitive data alerting, admin view at `GET /api/contact/leads` (token-protected) |
| **Dependencies** | `ADMIN_TOKEN` (for leads view), file system at `~/contacts/` |
| **Replacement** | Lead capture moves server-side into Echo's route (AI response parsed on the server, not client). `/api/contact` may be simplified to a plain contact form endpoint. |
| **Action** | KEEP but simplify. Lead capture moves to server side. |

---

## 4. Backend Prompts

### 4.1 `server/portfolio-api/prompts/portfolio.js`

| Field | Detail |
|---|---|
| **Purpose** | System prompt for `/api/maya` portfolio mode. Witty, 3-sentence max, lead capture instructions. |
| **Hardcoded** | Yes — Akhilesh's profile is a static `about` const inside this file (stale, not linked to `about-me.md`). |
| **Replacement** | Prompt philosophy (tone, categories, lead capture format) carries into Echo's prompt. But data must come from `about-me.md` not hardcoded. |
| **Action** | REPLACE — content absorbed into Echo prompt, hardcoding removed |

---

### 4.2 `server/portfolio-api/prompts/lab.js`

| Field | Detail |
|---|---|
| **Purpose** | System prompt for `/api/maya` lab mode. Calm, system-persona, 2 sentences. |
| **Replacement** | Lab mode (akhileshnanda.maya-ai.dev as a standalone AI platform) is a separate product concern. Not part of NewAkhilesh portfolio. |
| **Action** | REMOVE from NewAkhilesh scope |

---

## 5. NanoBot Playground (Root `src/`)

The root `src/` is a **standalone playground** (`package.json` name: `nanobot-playground`). Not the portfolio. Not deployed. Pure FSM and sprite testing.

### Files

| File | Purpose | Action |
|---|---|---|
| `src/nanobot/NanoBot.tsx` | Playground-wired NanoBot component | MIGRATE to `frontend/src/nanobot/` |
| `src/nanobot/ChatBubble.tsx` | Chat bubble with hardcoded scripted lines | MIGRATE + EXTEND with real AI |
| `src/nanobot/NanoBotFSM.ts` | Full FSM — 7 states, transition logic | MIGRATE unchanged |
| `src/nanobot/useNanoBot.ts` | Movement, roaming, click handling | MIGRATE unchanged |
| `src/nanobot/SpriteAnimator.tsx` | Canvas-based sprite renderer | MIGRATE unchanged |
| `src/nanobot/types.ts` | BotState, UserRole, ANIMATIONS config | MIGRATE unchanged |
| `src/App.tsx` | Playground shell with debug panel | DISCARD — playground only |

**Key observation:** The NanoBot FSM is complete and production-ready. The sprite system is complete. What's missing is AI integration — `ChatBubble.tsx` currently uses hardcoded `VISITOR_LINES` and `RECRUITER_LINES` arrays. There is no API call anywhere in the NanoBot playground.

---

## 6. Zustand Store (Terminal State)

`frontend/src/store/useStore.js` currently tracks:

| State | Set By | Purpose | Action |
|---|---|---|---|
| `terminalOpen` | GestureZones | Opens AiTerminal overlay | REMOVE |
| `chatOpen` | AskScene | Set but never read | REMOVE |
| `showPasswordGate` | App easter egg | Triggers world switch | REMOVE (no dual-world in V2) |
| `isAuthenticated` | PasswordGate | Password gate auth | REMOVE |
| `mode` | WorldTransition | system/human | REMOVE |
| `isTransitioning` | GestureZones | Transition animation | REMOVE |
| `scrollY` | Never written | Dead state | REMOVE |
| `currentChapter` | Chapter components | Human mode chapter | REMOVE |

All terminal-related state is removed in V2. Echo's open/closed state lives in its own Zustand slice.

---

## 7. API Endpoints — Disposition Summary

| Endpoint | V1 Purpose | V2 Action |
|---|---|---|
| `POST /api/chat` | AiTerminal chat (Kimi/Groq) | REMOVE |
| `POST /api/maya` | Maya lab + portfolio modes | CONSOLIDATE into `/api/echo` |
| `POST /api/recruiter-chat` | Claude-backed recruiter chat | EVOLVE into `/api/echo` |
| `POST /api/contact` | Lead storage | KEEP / SIMPLIFY |
| `GET /api/about` | Parsed about-me.md | KEEP — drives Echo's knowledge |
| `POST /api/update` | Admin mutations | KEEP — Echo admin mode uses this |
| `GET /api/stats` | Live server metrics | KEEP — drives dashboard |
| `GET /api/jobs` | Job bot data | KEEP — drives dashboard |
| `GET /api/resume` | Resume redirect | KEEP |
| `/ws` | Live dashboard WebSocket | KEEP |

---

## 8. What Has No Replacement

The following V1 features have no equivalent in V2 and are cleanly dropped:

- Full-screen terminal overlay experience
- GestureZones navigation (left/right/bottom bars)
- WorldTransition animation (glitch/fragment/flood)
- PasswordGate (Human mode password)
- Dual-world system (System + Human)
- AwakeningScene decorative Terminal.jsx typing simulation
- `prompts/lab.js` (Maya as a system-manager persona)
- AskScene (terminal CTA section)
- FilmGrain overlay

These are V1 cinematic storytelling choices. V2 is a recruiter-conversion product. They serve different purposes.
