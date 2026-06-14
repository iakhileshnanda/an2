# Migration Report — Old Portfolio → newakhilesh

> Source: `/frontend/src/`  
> Target: `/newakhilesh/frontend/src/`  
> Status: Architecture phase — no code migrated yet

---

## What Was Copied (foundation)

The `newakhilesh/frontend/` directory was initially seeded as a direct copy of the live portfolio. The following are the modules worth keeping and migrating cleanly into the new section-based architecture.

### KEEP — Design System (copy as-is)

| File | Destination | Notes |
|---|---|---|
| `styles/tokens.css` | `src/styles/tokens.css` | Copy verbatim. Entire visual language. |
| `styles/fonts.css` | `src/styles/fonts.css` | Copy verbatim. Font-face + Google Fonts. |
| `styles/global.css` | `src/styles/global.css` | Copy verbatim. Base reset + utility classes. |
| `assets/fonts/Pastor_of_Muppets.TTF` | `src/assets/fonts/` | Copy verbatim. Custom display font. |

**Why:** The token system is the single biggest architectural asset in the existing portfolio. It enables consistent theming across all sections. The custom font (`PastorOfMuppets`) is the core visual identity of the Hero section.

---

### KEEP — State (copy and extend)

| File | Destination | Notes |
|---|---|---|
| `store/useStore.js` | `src/store/useStore.js` | Copy, then extend for new features |

**What to extend:**
- Remove `scrollY` (unused)
- Remove `chatOpen` (unused — MayaChat unwired)
- Keep: `mode`, `isTransitioning`, `showPasswordGate`, `isAuthenticated`, `terminalOpen`, `currentChapter`
- Add: `nanobotVisible`, `adminMode`, `dashboardRefreshAt`

---

### KEEP — Utility Components (copy as-is)

| Component | Destination | Notes |
|---|---|---|
| `components/FilmGrain.jsx` | `src/components/shared/FilmGrain.jsx` | No changes needed |
| `components/transition/WorldTransition.jsx` | `src/components/shared/WorldTransition.jsx` | No changes needed |
| `components/password/PasswordGate.jsx` | `src/components/shared/PasswordGate.jsx` | No changes needed |
| `components/nav/Nav.jsx` | `src/components/layout/Nav.jsx` | Adapt for new page/section structure |

---

### KEEP — Data (migrate to content JSON)

| Old File | New Location | Migration Action |
|---|---|---|
| `constants/chapters.js` | `content/human-chapters.json` | Extract CHAPTER_DATA to JSON |
| `constants/siteConfig.js` | Keep as `src/config/site.js` | Not content — remains as code config |
| `constants/liveData.js` | `content/stats.json` (done) | Replaced by content JSON |
| WorkScene `PROJECTS` array | `content/projects.json` (done) | Extracted to JSON |
| OriginScene year blocks | `content/experience.json` (done) | Extracted to JSON |

---

### KEEP — Maya / AI Integration

| File | Destination | Notes |
|---|---|---|
| `lib/adminCommands.ts` | `src/services/adminCommands.ts` | Keep — Maya admin command parser |
| `lib/parseAboutMe.ts` | `src/services/parseAboutMe.ts` | Keep — Maya context loader |
| `components/maya/MayaChat.tsx` | `src/components/shared/MayaChat.tsx` | **Wire it in** — currently unused |

**Why MayaChat over AiTerminal:** MayaChat.tsx appears to be the intended replacement for AiTerminal. It should be wired into App once NanoBot architecture is finalized.

---

## What Was Intentionally Excluded

### EXCLUDE — Dead Code

| File | Reason |
|---|---|
| `system/scenes/OpeningScene/` | Particle scatter animation — commented out in SystemWorld.jsx, has never shipped. Remove entirely. |
| `components/terminal/AiTerminal.jsx` | Being replaced by NanoBot interaction model. Will NOT be in new architecture. |
| `components/terminal/AiTerminal.module.css` | Same as above. |
| `components/gesture/GestureZones.jsx` | Invisible swipe zones confuse users and add complexity. The new architecture will use visible UI for world switching. Evaluate in Phase 3. |
| `human/chapters/ChapterLetter/AnimatedSignature1.jsx` | Duplicate of AnimatedSignature.jsx. Not imported anywhere. |
| `constants/scenes.js` | Content unclear — was likely a scaffold for the old scene system. New architecture uses sections. |

---

### EXCLUDE — Unused Dependencies

| Package | Reason |
|---|---|
| `@react-three/fiber` | Only used in OpeningScene (dead). Three.js is ~600kb — removing saves significant bundle size. |
| `three` | Same as above. |
| `react-router-dom` | Installed but zero usage. New architecture will use React Router properly for Home/Human/Admin pages. |

**Action for Phase 2:** Clean `package.json` before rebuilding. Run `npm uninstall three @react-three/fiber` then re-add react-router-dom with intentional usage.

---

### EXCLUDE — Architectural Patterns Not Carried Forward

| Pattern | New Approach |
|---|---|
| Hardcoded content in JSX | All section content comes from `content/*.json` files |
| `system/` + `human/` world folders | New: `pages/` for routing targets, `sections/` for portfolio sections |
| Scene-based layout (one scene = one file) | New: Section-based, data-driven (`<Projects data={projects} />`) |
| Mixed Tailwind + CSS Modules | New: Tailwind-first with CSS Modules only for complex animations |
| Single flat Zustand store | New: Zustand slices — one per domain (ui, nanobot, dashboard, admin) |
| AiTerminal (full-screen modal) | New: NanoBot roaming sprite with chat bubble (from nanobot-playground) |

---

## Human Chapters — Handling

The Human world chapters (`ChapterChild`, `ChapterCollege`, etc.) contain personal narrative that is high-effort to rewrite. **Do not migrate chapter JSX during Phase 2.**

Recommended approach:
- In Phase 2 (portfolio clone), copy `human/` directory as-is into `pages/Human/chapters/`
- Keep chapter content unchanged for now
- Migrate chapter content to `content/human-chapters.json` in Phase 5 (dedicated chapter redesign phase)

---

## Summary

| Category | Count | Action |
|---|---|---|
| Files to keep verbatim | 6 | Copy directly |
| Files to adapt/extend | 4 | Modify during migration |
| Content to extract to JSON | 5 sources | Done — `content/` folder complete |
| Dead files to delete | 7 | Remove in Phase 2 cleanup |
| Dead dependencies to remove | 3 | Remove in Phase 2 |
| Architectural patterns deprecated | 5 | Do not replicate in new structure |
