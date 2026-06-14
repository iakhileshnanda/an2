# Implementation Roadmap — newakhilesh Portfolio

> Created: 2026-06-14  
> Status: Active planning document

---

## Overview

```
Phase 1  ─ Project organization          ← THIS PHASE (complete)
Phase 2  ─ Portfolio clone & cleanup
Phase 3  ─ Hero redesign
Phase 4  ─ Numbers section
Phase 5  ─ Projects section
Phase 6  ─ NanoBot integration
Phase 7  ─ Dashboard integration
Phase 8  ─ Admin mode
```

---

## Phase 1 — Project Organization

**Status: Complete**

### What was done
- Audited existing live portfolio (`/frontend/src/`)
- Created `newakhilesh/` monorepo structure: `frontend/`, `server/`, `docs/`, `shared/`, `assets/`
- Created new `frontend/src/` folder scaffold: `pages/`, `sections/`, `components/`, `nanobot/`, `dashboard/`, `services/`, `store/`
- Extracted all hardcoded content to `content/` JSON files: `hero.json`, `projects.json`, `experience.json`, `skills.json`, `stats.json`, `contact.json`
- Documented current architecture in `docs/current-architecture.md`
- Designed dashboard architecture in `docs/dashboard-architecture.md`
- Designed admin mode architecture in `docs/admin-architecture.md`
- Produced migration report in `docs/migration-report.md`

### Success Criteria ✓
- [x] Folder structure matches spec
- [x] All content extractable from JSX without looking at component files
- [x] Architecture documented
- [x] No existing code modified

---

## Phase 2 — Portfolio Clone & Cleanup

**Dependencies:** Phase 1 complete  
**Estimated Effort:** 1–2 days  
**Risk:** Low — no new features, pure migration

### What to do
1. Remove dead code from `newakhilesh/frontend/src/`:
   - Delete `system/scenes/OpeningScene/`
   - Delete `components/terminal/AiTerminal.jsx` + `AiTerminal.module.css`
   - Delete `human/chapters/ChapterLetter/AnimatedSignature1.jsx`
2. Clean `package.json`:
   - Remove: `three`, `@react-three/fiber` (unused, heavy)
   - Keep: `react-router-dom` (will be used for routing in Phase 2)
   - Update: `animejs` to v4 if stable (check breaking changes)
3. Set up React Router:
   - Wrap app in `<BrowserRouter>`
   - Route `/` → `pages/Home/` (SystemWorld + all sections)
   - Route `/human` → `pages/Human/` (chapter scroll)
   - Route `/admin` → `pages/Admin/` (future)
4. Migrate `human/` folder into `pages/Human/chapters/`
5. Move `system/` content into `sections/` (but keep existing code, just reorganize)
6. Wire `content/*.json` into sections that currently hardcode data:
   - `WorkScene` reads from `content/projects.json`
   - `LiveScene` reads from `content/stats.json` (fallback)
   - `OriginScene` reads from `content/experience.json`
7. Fix Zustand store: remove unused `chatOpen`, `scrollY` state
8. Update path aliases in `vite.config.js` to match new folder structure

### Success Criteria
- [ ] App runs in `newakhilesh/frontend/` with no broken imports
- [ ] No dead code in src/
- [ ] Dead deps removed from package.json (bundle measurably smaller)
- [ ] React Router routes `/` and `/human` work
- [ ] All sections render from `content/*.json` — no hardcoded content in JSX

---

## Phase 3 — Hero Redesign

**Dependencies:** Phase 2 complete  
**Estimated Effort:** 2–3 days  
**Risk:** Medium — new design decisions, animation work

### What to do
1. Rebuild `sections/Hero/` from scratch (do not carry forward old Hero scroll-zoom)
2. Render content from `content/hero.json`
3. New Hero must include:
   - Name display (keep PastorOfMuppets font)
   - Role / tagline
   - Live availability status
   - Immediate visual hierarchy — recruiter understands the person in 3 seconds
4. Remove `OpeningScene` permanently (already done in Phase 2)
5. Design scroll behavior (new approach — TBD in Phase 3 design session)

### Success Criteria
- [ ] Hero renders from `hero.json`
- [ ] No hardcoded name/tagline in JSX
- [ ] Looks correct on mobile (375px) and desktop (1440px)
- [ ] Lighthouse performance score ≥ 90

---

## Phase 4 — Numbers Section

**Dependencies:** Phase 3 complete  
**Estimated Effort:** 1–2 days  
**Risk:** Low — migrating existing LiveScene

### What to do
1. Build `sections/Numbers/` (replaces `LiveScene`)
2. Data from `content/stats.json` (fallback) + `GET /api/stats` (live)
3. Count-up animation on viewport entry (keep animejs pattern from LiveScene)
4. Add `CurrentlyBuilding` widget
5. Add manual refresh button (keep from old LiveScene)

### Success Criteria
- [ ] Section renders all 6 stat cells from JSON
- [ ] Count-up animation fires once per page load
- [ ] Falls back to `stats.json` values if `/api/stats` fails
- [ ] `lastUpdated` timestamp shown

---

## Phase 5 — Projects Section

**Dependencies:** Phase 4 complete  
**Estimated Effort:** 2–3 days  
**Risk:** Low — redesign of existing WorkScene

### What to do
1. Build `sections/Projects/` (replaces `WorkScene`)
2. Render from `content/projects.json`
3. Support `featured: true` filtering vs full list toggle
4. Support `status` badge: `active` / `building` / `shipped`
5. Redesign card layout (old alternating-side cards → new design TBD)
6. Tags rendered from JSON array
7. Optional: filter by tag

### Success Criteria
- [ ] All 6 projects render from `projects.json`
- [ ] No project data in JSX
- [ ] Featured projects visible above fold
- [ ] Adding a project = edit `projects.json` only

---

## Phase 6 — NanoBot Integration

**Dependencies:** Phase 5 complete, NanoBot playground (`newakhilesh/src/`) ready  
**Estimated Effort:** 4–6 days  
**Risk:** Medium — sprite/FSM already built in playground, main work is Maya API integration and admin mode  
**Architecture:** See `docs/nanobot-architecture.md`

### Core Concept Change

NanoBot is NOT a feature — it IS the portfolio's primary interface. It replaces the AI terminal entirely. There is no other AI interaction surface. Everything happens through the droid.

### Three Modes

**Visitor** — short discovery Q&A. Goal: answer questions quickly.  
**Recruiter** — targeted hiring conversation. Goal: always end with resume + contact.  
**Admin** — content editing via conversation. Goal: update `content/*.json` without touching code.

### What to do

1. Migrate NanoBot from playground (`newakhilesh/src/nanobot/`) into `frontend/src/nanobot/`
2. Add **mode selector** to chat bubble: [General] [Recruiter] [Admin]
3. Wire all three modes to `/api/maya` with mode-specific system prompts
4. Admin auth: password prompt in bubble → `POST /api/admin/login` → JWT in sessionStorage
5. Server: add admin content write endpoint (`POST /api/admin/content/:section`)
6. Server: after approved edit → validate JSON → write file → `npm run build` → git commit + push
7. NanoBot communicates build status ("Rebuilding — live in ~20s")
8. Delete `AiTerminal.jsx` permanently in this phase

### Folder structure
```
src/nanobot/
├── components/
│   ├── NanoBotSprite.jsx    — sprite renderer (from playground SpriteAnimator)
│   ├── ChatBubble.jsx       — chat bubble with mode selector
│   └── RoleSelect.jsx       — visitor / recruiter / admin picker
├── sprites/
│   └── droid_00_32x32/      — sprite sheet assets
├── hooks/
│   └── useNanoBot.js        — FSM + movement (from playground)
├── state/
│   └── nanobotStore.js      — mode, adminAuthenticated, conversationHistory
└── animations/
    └── spriteConfig.js      — frame definitions per FSM state
```

### Success Criteria
- [ ] NanoBot visible on all pages, roams without interrupting scroll
- [ ] Click to open chat bubble with role selector
- [ ] Visitor and Recruiter modes respond via Maya with appropriate context
- [ ] Recruiter mode ends every substantive exchange with resume/LinkedIn/email
- [ ] Admin mode requires password before activating
- [ ] Admin can say "update hero status" and NanoBot proposes then applies the change
- [ ] Content change is live within 30 seconds of admin approval
- [ ] Change appears in git log with `[nanobot]` suffix
- [ ] `AiTerminal.jsx` deleted — no other AI surface exists

---

## Phase 7 — Dashboard Integration

**Dependencies:** Phase 6 complete, server SSE endpoint built  
**Estimated Effort:** 3–4 days  
**Risk:** Medium — requires server work + frontend real-time

### What to do
1. Build `sections/Numbers/` SSE upgrade (Phase 4 built REST polling; this adds SSE)
2. Implement `GET /api/dashboard/stream` on server (see `docs/dashboard-architecture.md`)
3. Build `useDashboard()` hook with EventSource
4. Add new widgets: GitHub activity, agents running, build status
5. Add `<ConnectionIndicator>` — green dot when SSE live, yellow when polling

### Success Criteria
- [ ] Dashboard updates without manual refresh
- [ ] SSE reconnects automatically after disconnect
- [ ] Falls back to REST polling if SSE unavailable
- [ ] New data appears within 30 seconds of change on server

---

## Phase 8 — Admin Mode

**Dependencies:** Phase 7 complete, all sections built  
**Estimated Effort:** 4–5 days  
**Risk:** Medium — security-sensitive, new server routes

### What to do
1. Build `/admin` route and `pages/Admin/` (see `docs/admin-architecture.md`)
2. Implement server admin routes: login, content GET, content POST
3. Build content editors for each section: Hero, Projects, Experience, Stats, Contact
4. Implement atomic file write on server
5. JWT auth with 24-hour expiry
6. Rate-limit login endpoint

### Success Criteria
- [ ] Admin can update project list without touching code
- [ ] Portfolio reflects changes on next page load
- [ ] Invalid JSON is rejected with a clear error before writing
- [ ] Admin route is not linked from public portfolio
- [ ] JWT secret not in source code (env var only)

---

## Risk Register

| Risk | Phase | Mitigation |
|---|---|---|
| NanoBot FSM complexity increases scope | 6 | Cap FSM to 5 states for v1. No new states without a design session. |
| SSE requires nginx reconfiguration on Oracle server | 7 | Test SSE behind nginx in staging first. See dashboard-architecture.md for nginx config. |
| Admin content validation too loose → corrupt JSON | 8 | Zod schema per content type. Never write without validation. |
| Three.js bundle size lingers | 2 | Verify with `vite build --report` that three.js is not in output. |
| React Router breaks human world transition | 2 | World switch (system↔human) becomes a route change. Test history push behavior. |

---

## Dependency Map

```
Phase 1 (done)
    └── Phase 2
            ├── Phase 3
            │       └── Phase 4
            │               └── Phase 5
            │                       └── Phase 6
            │                               └── Phase 7
            │                                       └── Phase 8
            └── (server work can start here independently)
```

Each phase gates the next. Server work (API endpoints, SSE) can be built in parallel from Phase 2 onward but frontend integration waits for the section to exist.
