# Admin Mode Architecture

> Status: Design only — not implemented  
> Target phase: Phase 8

---

## Goal

Akhilesh can update portfolio content — projects, hero status, stats, experience — without touching code or redeploying.

The Admin page provides a JSON editor backed by the `content/` files. Changes are saved to the server, which writes to disk. The portfolio re-reads the content on next load (or hot-reloads via SSE if implemented).

---

## User Flow

```
1. Visit /admin
2. Enter admin password (separate from Human world password)
3. See content editor with tabs: Hero | Projects | Experience | Skills | Stats | Contact
4. Edit JSON fields via form UI (not raw JSON)
5. Click Save
6. API writes to content/*.json on disk
7. Portfolio reflects changes on next page load
```

---

## Access Control

**Authentication model:** Single admin password stored as environment variable on the server. No user accounts, no OAuth. This is a personal portfolio — admin is one person.

```
POST /api/admin/login
Body: { password: "..." }
Response: { token: "JWT" }  ← 24-hour expiry

All /api/admin/* routes require:
Authorization: Bearer <token>
```

**Frontend:** Admin token stored in sessionStorage (not localStorage — clears on browser close). Admin page checks for token on mount; redirects to login if missing or expired.

---

## Content Editing Flow

```
Admin Page (/admin)
│
├── Tab: Hero
│   ├── Input: name, tagline, status, headline
│   └── [Save] → POST /api/admin/content/hero
│
├── Tab: Projects
│   ├── List of project cards (reorder via drag)
│   ├── Edit modal per project
│   └── [Save] → POST /api/admin/content/projects
│
├── Tab: Experience
│   ├── Timeline entries (add / edit / reorder)
│   └── [Save] → POST /api/admin/content/experience
│
├── Tab: Stats
│   ├── Override fallback values for each cell
│   └── [Save] → POST /api/admin/content/stats
│
└── Tab: Contact
    ├── Headline, subheadline, CTA labels, availability text
    └── [Save] → POST /api/admin/content/contact
```

---

## API Design

```
POST /api/admin/login
  Body: { password }
  Response: { token }

GET  /api/admin/content/:section
  Returns current content JSON for the section
  Sections: hero | projects | experience | skills | stats | contact

POST /api/admin/content/:section
  Body: updated JSON
  Server validates schema, writes to content/<section>.json
  Response: { ok: true, updatedAt: "ISO8601" }
```

---

## Server Architecture

```
server/
└── admin/
    ├── adminRouter.js       — mounts /api/admin/* routes
    ├── adminAuth.js         — login endpoint + JWT middleware
    ├── contentController.js — GET/POST for each content section
    ├── contentValidator.js  — validates JSON shape before writing
    └── contentWriter.js     — atomic file write (write to tmp, rename)
```

**Atomic write pattern (important):** Never write directly to `content/*.json`. Write to `content/*.json.tmp`, validate it loads correctly, then rename to `content/*.json`. This prevents corrupted files from a failed mid-write.

---

## Frontend Architecture

```
src/pages/Admin/
├── index.jsx               — route: /admin
├── AdminLogin.jsx          — password form + token storage
├── AdminDashboard.jsx      — tab layout
├── editors/
│   ├── HeroEditor.jsx      — hero fields
│   ├── ProjectEditor.jsx   — projects list + modal
│   ├── ExperienceEditor.jsx— timeline entries
│   ├── StatsEditor.jsx     — stat cells
│   └── ContactEditor.jsx   — contact fields
└── hooks/
    ├── useAdminAuth.js     — token management, auto-logout
    └── useContentEditor.js — GET/POST content, optimistic UI
```

---

## Routing

Admin page requires React Router to be set up. Route: `/admin`.

```jsx
// Route is not in the public nav — access by direct URL only
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/human" element={<Human />} />
  <Route path="/admin" element={<AdminPage />} />
</Routes>
```

The admin route is not linked anywhere visible on the portfolio. It is accessed by typing the URL directly.

---

## Security Notes

1. **Never expose the admin password in frontend code.** It is a server-side environment variable only.
2. **JWT secret** must be a strong random string in the server `.env` file. Never commit it.
3. **Rate limit** the `/api/admin/login` endpoint (max 5 attempts per IP per 15 minutes). Use `express-rate-limit`.
4. **Content validation** on the server — never write arbitrary user-submitted JSON without schema checking. Use `zod` or `joi` for schema validation on each content type.
5. **CORS** — Admin API should only accept requests from the portfolio domain and localhost.

---

## Content Reload Strategy

**Option A (Simplest): Page refresh.** After saving, show a "Saved — refresh portfolio to see changes" message. No real-time magic.

**Option B (Better): SSE invalidation.** Server sends a `content-updated` SSE event. Portfolio reloads the relevant section's data. No full page refresh needed. Pairs with the dashboard SSE stream.

**Recommendation:** Start with Option A. Add Option B when SSE is implemented in Phase 7.

---

## Implementation Notes for Phase 8

1. **Admin is the last phase** — all content sections must be built before admin can edit them.
2. **Build editors from the same JSON schemas** used in `content/` files — they are already the source of truth.
3. **Don't build a CMS.** This is a single-user editor for one person. Keep it simple: forms that map directly to JSON fields.
4. **Validation must mirror the shape** expected by each section component. If the Hero component expects `name.first`, the editor must write `name.first`.
