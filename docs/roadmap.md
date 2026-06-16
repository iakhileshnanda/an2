# Implementation Roadmap — newakhilesh Portfolio

> Created: 2026-06-14 | Last updated: 2026-06-16

---

## Overview

```
Phase 1  ─ Project organization          ✅ done
Phase 2  ─ Portfolio clone & cleanup     ✅ done
Phase 3  ─ Hero redesign                 ✅ done
Phase 4  ─ Numbers section               ✅ done
Phase 5  ─ Projects section              ✅ done
Phase 6  ─ Echo AI companion             ✅ done (shipped — deal.maya-ai.dev)
Phase 7  ─ Dashboard / real-time         🔲 future
Phase 8  ─ Admin mode                    🔲 future
```

---

## Phase 6 — Echo AI Companion

**Status: Complete and live in production.**

Echo replaced the originally planned NanoBot integration. Instead of a generic AI terminal, Echo is a pixel-art droid with:
- Autonomous roaming + FSM animation (frontend, `src/echo/`)
- A dedicated backend service (`server/echo-api/`, port 3005)
- Groq-primary + Anthropic-fallback LLM with tool use
- File-based per-visitor memory (returning visitor context)
- Mode inference from section dwell times (HIRE / COLLAB / CURIOUS)
- Live tools: `get_github_activity` and `get_resume`

See `ECHO_HANDOFF.md` for full status and pending items.

---

## Phase 7 — Dashboard / Real-Time

**Status: Design only. See `docs/dashboard-architecture.md`.**

- SSE endpoint `GET /api/dashboard/stream`
- Live GitHub activity, build status, agents-running widgets
- `<ConnectionIndicator>` — green dot live, yellow polling fallback

---

## Phase 8 — Admin Mode

**Status: Design only. See `docs/admin-architecture.md`.**

- `/admin` route, JWT auth, 24-hour expiry
- Content editors for Hero, Projects, Experience, Stats, Contact
- Atomic file write on server, invalid JSON rejected before write
- Rate-limited login endpoint
