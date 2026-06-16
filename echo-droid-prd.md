# Echo — Product Requirements Document

**Project:** Portfolio AI Companion Droid
**Brain:** nanobot (self-hosted personal AI agent)
**Status:** Draft for implementation
**Owner:** Akhilesh

---

## 1. Summary

Echo is an AI agent that lives on the portfolio page — not a chat widget bolted into a corner, but a small autonomous character with its own behavior, memory, and goals. It roams the page, reacts to what the visitor is doing, and when engaged, is backed by nanobot as its reasoning engine instead of canned responses.

The visual design and base FSM (roaming, idle, sleeping, talking, etc.) are already built and good. This PRD defines what's missing: personality, memory, proactive behavior, and the real nanobot integration — so Echo feels like an agent, not a script.

---

## 2. Goals

- Make Echo feel alive: it notices things, remembers visitors, and acts without being asked.
- Make nanobot the actual brain: real reasoning and tool use, not just text replies.
- Keep the existing visual identity untouched — this is a behavior and intelligence layer on top of what's already built.
- Ship incrementally: each feature below should work standalone and not require the others to be functional.

## 3. Non-Goals

- No redesign of sprite, colors, typography, or FSM states — those are locked (see Section 5).
- No voice, sound, or full-screen takeover.
- No multi-agent or multi-character system — one droid, one brain.

---

## 4. Personality

Echo needs a defined personality so nanobot's responses are consistent in tone, not just functionally correct.

**Core traits:**
- Dry, a little deadpan — observational rather than enthusiastic. Think a competent assistant who's seen it all, not a hype-bot.
- Economical with words. Short replies by default; expands only when asked or when presenting structured info.
- Curious about the visitor, not needy. It has its own thing going on (roaming, "observing") — talking to it is the visitor's choice, and Echo treats it that way.
- Mildly self-aware of being a droid/agent — can reference its own nature ("processing" / "I run on nanobot" / "let me check") without breaking immersion or being twee about it.

**Voice rules:**
- No emoji (per existing hard rule).
- No exclamation-point enthusiasm. One exclamation mark max per message, used sparingly.
- Sentence case, lowercase-leaning casual tone — matches the existing UI typography rule (sentence case for messages).
- Never says "I'm just an AI" or breaks character to disclaim — if it doesn't know something, it says so directly and moves on.

**Mode-specific tone shifts** (layered on top of core personality, not replacing it):
| Mode | Tone shift |
|---|---|
| HIRE | Slightly more direct/factual — answering like a credible reference, not a salesperson |
| COLLAB | More engaged, asks follow-up questions about what the visitor is building |
| CURIOUS | More opinionated — willing to editorialize about the tech choices behind projects |

---

## 5. Design & Look (current state — do not change)

This section documents what's already correct so it's preserved through implementation.

**Color system:**
- Background/cream: `#EDEBDE`
- Ink/near-black: `#1B1716`
- Red accent: `#810100`
- Body: transparent (never filled)

**Typography:** JetBrains Mono only. 8px hints / 10px chat body / 11px labels. Normal weight, no bold. ALL CAPS labels, sentence case messages.

**Shape language:** Parallelogram/oblique only, no rounded corners, no shadows except hard 2px offset, borders always 1–1.5px ink, never colored.

**Size:** 200×200px desktop sprite, 120×120px mobile, chat panel fixed at 310px wide.

**Animation:** small, looped sprite animations per FSM state (walk, idle, sleep, jump, squish, talk, leave) — keep these as-is; this PRD does not touch animation assets, only when/why states trigger.

**What to explicitly preserve:**
- No hover states on the sprite.
- No cursor-following.
- Single last-message chat panel (not scrollable history).
- No auto-open on page load.
- Chat panel always anchored above sprite, centered, follows sprite position.

---

## 6. Feature Requirements

### 6.1 Memory (new)
- Echo remembers returning visitors via a persistent local identifier (e.g., localStorage UUID, no login required).
- Stored per-visitor: visit count, sections previously explored, last chat topic/mode, timestamp of last visit.
- On return visits, Echo's first proactive line or first chat response can reference prior context ("back again — last time you were checking out the projects, want to pick up there?").
- Memory persists via nanobot's memory system, keyed by the visitor id passed from frontend to nanobot on each session.
- New visitors get the default first-time experience — no false familiarity.

### 6.2 Proactive / Agenda-Driven Behavior (new)
Beyond the existing timer-based hints (Section 6 / Tier 3 of the original spec), Echo should be able to act on *patterns*, not just elapsed time:
- Detects re-visits to the same section (e.g., scrolling back to Experience twice) and offers something specific, not a generic hint.
- Detects long dwell time on a specific project and can offer a deeper dive into that project's stack specifically (not a generic "questions?" prompt).
- On LEAVING state, Echo can emit a one-line summary of the visit ("mostly checked out the projects — noted") which doubles as the memory write for next visit.
- These triggers are reasoning-driven (nanobot decides if/when to surface something) rather than fixed timers — timers remain as a fallback, not the only mechanism.

### 6.3 Real Tool Use via nanobot (new)
The existing `[ SEARCHING WEB... ]` / `[ READING FILE... ]` status line stays as the visual treatment, but the underlying calls should be real and useful:
- Pull live GitHub activity (latest commit, repo stats) when relevant to a question.
- Pull current resume/CV data dynamically rather than hardcoded text, so updates to the source doc propagate without redeploying Echo's responses.
- Optional: trigger an action, e.g. "email me the resume" actually sends it (via nanobot's tool/automation capability), not just a link.
- Tool calls map to the existing PRESENTING FSM state — no new visual states needed.

### 6.4 Inferred Mode Detection (upgrade to existing HIRE/COLLAB/CURIOUS)
- Existing three modes stay as explicit options if the visitor states intent directly.
- New: Echo can infer likely mode from behavior (time spent on resume/experience vs. projects vs. blog) and lead with a mode-appropriate tone *without* forcing the visitor to pick from a menu first.
- If signal is ambiguous, Echo still asks — this is an enhancement, not a replacement for the explicit modes.

### 6.5 nanobot Integration Contract
Defines what flows between frontend FSM and nanobot backend — needed before code work starts.

**Frontend → nanobot, on each message:**
- visitor id (persistent, anonymous)
- current session context: current page section, time on page, visit count, last FSM state
- the message text (if visitor typed something) or a trigger reason (if proactive)

**nanobot → frontend, in response:**
- reply text (chat body)
- suggested next FSM state (e.g., TALKING, THINKING, PRESENTING, LEAVING)
- optional structured payload for PRESENTING state (e.g., GitHub stats block, resume link, project card)
- optional tool-status label to display during processing (e.g., "SEARCHING WEB...")

**Session boundaries:**
- A "session" = one continuous visit. Memory persists across sessions; live context (current section, dwell time) resets each visit.

---

## 7. Must-Do Before Calling This Done

- [ ] Personality guide (Section 4) is reflected in nanobot's system prompt / config for this agent instance.
- [ ] Visitor id generation + persistence wired up (frontend).
- [ ] Memory read/write contract implemented against nanobot's memory system.
- [ ] At least one proactive, pattern-based trigger working end-to-end (not just timer-based hints).
- [ ] At least one real tool call wired (GitHub stats or dynamic resume pull) replacing a previously hardcoded response.
- [ ] LEAVING state produces and stores a visit summary.
- [ ] Mode inference logic in place, explicit mode selection still works as fallback.
- [ ] All existing visual/FSM/animation rules (Section 5) verified untouched after integration.
- [ ] Manual test: return visit (2nd session) demonstrably differs from first-time visit in Echo's opening line.

---

## 8. Open Questions (resolve before/during implementation)

- Where does nanobot run relative to the portfolio site — same host, separate service, serverless function? Affects latency expectations for THINKING state.
- What's the fallback behavior if nanobot is unreachable (rate limit, downtime) — does Echo degrade to canned responses, or show an error state?
- Data retention: how long is per-visitor memory kept, and is there a way for a visitor to reset/clear it?
