# Echo — Droid Architecture
_Last updated: 2026-06-15_

---

## What Echo Is

Echo is a pixel-art droid that lives on the portfolio. She roams the viewport autonomously, reacts to clicks, and serves as the only conversational surface on the site. She is not a chat widget. She is not a support bot. She is a tiny pixel companion with a personality.

---

## Files

```
frontend/src/nanobot/
├── NanoBot.tsx          — root component, mounts Echo as a fixed overlay
├── NanoBotFSM.ts        — finite state machine (all state logic lives here)
├── useNanoBot.ts        — hook: FSM wiring, roaming, clicks, scroll hints, idle hints
├── EchoBubble.tsx       — Pokémon/Animal Crossing style conversation UI
├── EchoBubble.module.css — pixel border styling, menu, response, tail
├── SpriteAnimator.tsx   — canvas sprite sheet renderer
├── types.ts             — BotState, UserRole, ANIMATIONS map
└── sprites/             — droid_00.png sprite sheet + source .aseprite
```

---

## FSM States

| State      | What Echo looks like         | When it happens                          |
|------------|------------------------------|------------------------------------------|
| `ROAMING`  | Walking animation (row 1)    | Default — moves around the bottom bar   |
| `IDLE`     | Idle loop (row 0)            | Random pause between roams               |
| `SLEEPING` | Doze loop (row 3)            | Random — she falls asleep mid-roam       |
| `JUMPING`  | Jump arc (row 2)             | Double-click, or random chance from roam |
| `SQUISH`   | Squish on landing (row 5)    | 50% chance after a jump                 |
| `TALKING`  | Talking animation (row 4)    | Any click that opens the bubble          |
| `THINKING` | Same row as TALKING, 7fps    | Message sent, waiting for API response   |
| `LEAVING`  | Walk-off animation (row 6)   | Bubble closed — she exits the screen     |

### Transitions

```
ROAMING / IDLE / SLEEPING
  ├── single click      → TALKING (role = null, shows main menu)
  ├── double click      → JUMPING (jumpReason = 'click')
  └── triple click      → TALKING (role = 'admin', shows admin placeholder)

JUMPING
  ├── ANIM_DONE + jumpReason='click'  → TALKING (role = 'visitor', skips menu)
  └── ANIM_DONE + jumpReason='roam'  → SQUISH (50%) or back to prev state

SQUISH
  └── ANIM_DONE → IDLE

TALKING
  ├── MESSAGE_SENT → THINKING
  └── CLOSE        → LEAVING

THINKING
  ├── REPLY_RECEIVED → TALKING
  └── CLOSE          → LEAVING

LEAVING
  └── LEAVE_DONE → ROAMING (resets position)
```

---

## Click Interactions

All three click types are detected inside a **350ms accumulation window** in `useNanoBot.ts`. Clicks are counted and resolved once the window closes.

| Interaction   | Behaviour                                                      |
|---------------|----------------------------------------------------------------|
| Single click  | Opens bubble → main menu ("What would you like to know?")     |
| Double click  | Echo jumps → lands → bubble opens directly in visitor topics  |
| Triple click  | Opens bubble with admin placeholder ("Admin mode coming soon") |

---

## Conversation UI — EchoBubble

Styled after Pokémon dialogue boxes and Animal Crossing speech bubbles. Not a chat widget.

### Views

**Main menu** (single click):
```
╔══════════════════════════╗
║ ECHO                   × ║
╠══════════════════════════╣
  What would you like to
  know?
══════════════════════════
  ► How are you?
    About Akhilesh
    Projects
    AI Experience
    Leadership
    Recruiter Mode       →
```

**Recruiter submenu** (select "Recruiter Mode"):
```
╔══════════════════════════╗
║ RECRUITER MODE         × ║
╠══════════════════════════╣
  What are you hiring for?
══════════════════════════
  ► Wing-Man
    Team Leadership
    AI Experience
    Resume
◄ Back
```

**Response view** (after selecting any topic):
```
╔══════════════════════════╗
║ Projects               × ║
╠══════════════════════════╣
══════════════════════════
  Wing-Man — AI interview
  coach.
  Maya MIRO — 500-agent
  market sim.
  ...
══════════════════════════
◄ Back
```

**Admin placeholder** (triple click):
```
╔══════════════════════════╗
║ ADMIN                  × ║
╠══════════════════════════╣
══════════════════════════
  Restricted access
  Admin mode coming soon.
══════════════════════════
◄ Close
```

### Keyboard Navigation

| Key         | Action                           |
|-------------|----------------------------------|
| ↑ / ↓       | Move `►` cursor through menu     |
| Enter       | Select highlighted item          |
| Escape      | Go back one level / close        |
| Backspace   | Go back (response view only)     |

### Current Responses (hardcoded — pre-API)

| Key           | Menu location       | Topic                          |
|---------------|---------------------|--------------------------------|
| `how_are_you` | Main                | Personality intro              |
| `about`       | Main                | Who Akhilesh is                |
| `projects`    | Main                | Wing-Man, Maya MIRO, Oracle    |
| `ai`          | Main                | AI/LLM production experience  |
| `leadership`  | Main                | Team lead at Trustt            |
| `wingman`     | Recruiter           | Wing-Man deep dive             |
| `team_lead`   | Recruiter           | Leadership details             |
| `ai_rec`      | Recruiter           | AI for recruiters              |
| `resume`      | Recruiter           | Contact + availability         |

---

## Proactive Hints

When Echo has been idle for **60 seconds** and no bubble is open, she shows a small dark tooltip above her head. It auto-dismisses after 5 seconds.

Hints are **section-aware** via IntersectionObserver on `#hero`, `#experience`, `#projects`, `#numbers`:

| Section      | Example hints                                      |
|--------------|----------------------------------------------------|
| `#hero`      | "psst. ask me something." / "i know things about this guy." |
| `#experience`| "7 years of work. ask me to break it down."        |
| `#projects`  | "any of these catch your eye?"                     |
| `#numbers`   | "the stats update live. ask me what they mean."    |

---

## Roaming Behaviour

- Constrained to the **center 60%** of the viewport width (avoids corners)
- Pinned to the **bottom** of the viewport
- Movement speed: `slow` (3.5s), `normal` (2.0s), `fast` (0.9s) — chosen randomly
- Roam tick fires every **3–8 seconds**
- On each tick: 50% roam, 20% idle, 15% sleep, 10% jump, 5% squish

---

## Sprite Sheet

File: `frontend/src/nanobot/sprites/droid_00.png`  
Dimensions: 608 × 224px  
Frame size: 32 × 32px  
Grid: 19 columns × 7 rows

| Row | State    | Frames | FPS |
|-----|----------|--------|-----|
| 0   | IDLE     | 12     | 10  |
| 1   | ROAMING  | 7      | 10  |
| 2   | JUMPING  | 8      | 12  |
| 3   | SLEEPING | 6      | 6   |
| 4   | TALKING  | 19     | 12  |
| 4   | THINKING | 19     | 7   |
| 5   | SQUISH   | 8      | 14  |
| 6   | LEAVING  | 12     | 10  |

THINKING reuses row 4 at a lower FPS to signal "processing" without a separate sprite row.

---

## What Is NOT Connected Yet

- **No API calls** — all responses are hardcoded in `EchoBubble.tsx`
- **Admin mode** — placeholder only, no auth or content editing
- **THINKING state** — wired in FSM but never fires until API is connected
- **NanoBot serve** (port 8900) — not started; `routes/maya.js` still calls old provider

## What Needs to Happen Next (API Phase)

1. Start `nanobot serve` on port 8900 (PM2)
2. Rewrite `server/portfolio-api/routes/maya.js` to proxy to `http://127.0.0.1:8900/v1/chat/completions`
3. Create `frontend/src/services/nanobot.service.ts` — `sendMessage(text, mode, history)`
4. Replace hardcoded responses in `EchoBubble.tsx` with live API calls
5. Dispatch `MESSAGE_SENT` / `REPLY_RECEIVED` to FSM around the API call
6. Add streaming (`stream: true`) for word-by-word response rendering
