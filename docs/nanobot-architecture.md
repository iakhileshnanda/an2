# NanoBot — System Architecture

> Status: Design only — not implemented  
> Replaces: AiTerminal, GestureZones, all previous AI interaction concepts  
> NanoBot IS the portfolio interface. Everything flows through it.

---

## 1. System Architecture

### Overview

NanoBot is a pixel-art droid that roams the portfolio viewport. It is always visible. It is the only way to interact with AI on the portfolio. There is no AI terminal, no separate chat widget, no FAQ section.

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER                                │
│                                                             │
│  ┌──────────────────┐      ┌──────────────────────────────┐ │
│  │  Portfolio Page  │      │         NanoBot              │ │
│  │  (sections)      │      │  ┌──────────────────────┐    │ │
│  │                  │      │  │  Roaming Sprite      │    │ │
│  │  Hero            │      │  │  (always visible)    │    │ │
│  │  Experience      │      │  └──────────────────────┘    │ │
│  │  Projects        │      │  ┌──────────────────────┐    │ │
│  │  Numbers         │      │  │  Chat Bubble         │    │ │
│  │  Contact         │      │  │  (on click)          │    │ │
│  │                  │      │  └──────────────────────┘    │ │
│  └──────────────────┘      │  ┌──────────────────────┐    │ │
│                             │  │  Mode: visitor       │    │ │
│                             │  │       recruiter      │    │ │
│                             │  │       admin          │    │ │
│                             │  └──────────────────────┘    │ │
│                             └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
          │  POST /api/maya  │  POST /api/admin/*
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVER (Oracle VPS)                     │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │  Maya API       │    │  Admin API                   │   │
│  │  /api/maya      │    │  /api/admin/login             │   │
│  │                 │    │  /api/admin/content/:section  │   │
│  │  Groq LLM       │    │  /api/admin/deploy            │   │
│  │  Mode-aware     │    │                              │   │
│  │  prompts        │    │  Writes content/*.json       │   │
│  └─────────────────┘    │  Runs git commit + push      │   │
│                          │  Rebuilds frontend           │   │
│                          └──────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  content/                                           │   │
│  │  ├── hero.json                                      │   │
│  │  ├── projects.json                                  │   │
│  │  ├── experience.json                                │   │
│  │  ├── stats.json                                     │   │
│  │  └── contact.json                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │  git push origin main
          ▼
┌─────────────────────────┐
│  GitHub (backup + log)  │
└─────────────────────────┘
```

### Key Principle: One Surface

NanoBot is the only entry point for:
- Questions about Akhilesh
- Recruiter interactions
- Admin content editing

There is no other chat, no terminal, no contact form that competes with it.

---

## 2. Content Architecture

Content lives in `newakhilesh/content/`. Portfolio sections render from these files. No section has hardcoded copy.

### Files

```
content/
├── hero.json        — name, tagline, status, headline, availability
├── projects.json    — project list with tags, status, links
├── experience.json  — career timeline entries
├── skills.json      — skill categories and levels
├── stats.json       — dashboard cells (fallback values + API key mapping)
└── contact.json     — CTAs, social links, availability text
```

### Rendering Model

Each portfolio section receives its data as a prop. The section component is pure — it renders what it receives.

```
App bootstrap:
  fetch('content/hero.json') → <Hero data={hero} />
  fetch('content/projects.json') → <Projects data={projects} />
  fetch('content/experience.json') → <Experience data={experience} />
  ...
```

**Why static files served by nginx, not an API:**
- Content files are committed to the repo and served as static assets
- No database. No CMS. No API needed to read them.
- After admin edits and deploy, the new files are on disk and nginx serves them immediately.

### Update Cycle

```
Admin edits via NanoBot
    ↓
Server writes content/<file>.json to disk
    ↓
Server runs: npm run build (builds React app with new JSON)
    ↓
nginx serves new build
    ↓
Visitor sees updated content on next page load
```

Changes take effect within ~30 seconds of admin approval (build time).

---

## 3. NanoBot Modes

NanoBot operates in one of three modes. The mode determines:
- What system prompt Maya receives
- What UI the chat bubble shows
- What actions NanoBot can take

### Mode Detection

```
Initial state: VISITOR
    ↓
User opens chat
    ↓
NanoBot shows role selector:
  [  General  ]  [  Recruiter  ]  [  Admin  ]
    ↓
User picks → mode is set for the session
Admin → shows password prompt before activating
```

Mode persists for the browser session. Refreshing resets to VISITOR.

---

### 3a. Visitor Mode

**Goal:** Short discovery conversations. Answer questions, not long monologues.

**NanoBot behavior:**
- Answers questions about Akhilesh, projects, skills, experience
- Keeps responses short (3–5 sentences max)
- Offers to switch to Recruiter mode if the visitor seems professional

**System prompt context includes:**
- Contents of all `content/*.json` files
- `about-me.md` (existing file in repo root)

**Example flow:**
```
Visitor: What does Akhilesh build?
NanoBot: AI systems that actually work in production. Multi-agent
         simulations (Maya MIRO), autonomous job agents (Oracle),
         and enterprise Angular dashboards. Currently building
         NanoBot — you're talking to it.
```

---

### 3b. Recruiter Mode

**Goal:** Convert interest into contact. Every conversation ends with an action.

**NanoBot behavior:**
- Focuses on hiring value proposition
- Answers: skills, experience, availability, salary, leadership, AI work
- Always closes with contact options: resume, LinkedIn, email
- Never just says "good luck" — always gives a next step

**System prompt context includes:**
- All `content/*.json` files
- A recruiter-specific instruction: "You are a professional representative. Speak confidently about Akhilesh's value. Never be vague about availability or experience. Always end with contact options."
- `VITE_RESUME_URL` — if the message mentions resume, open the URL

**End-of-conversation pattern:**
```
After any substantive recruiter exchange, NanoBot automatically appends:

"Want to take next steps?
  → Resume: [link]
  → LinkedIn: [link]  
  → Email: theakhilesh.m@gmail.com"
```

**Lead capture:**
When a recruiter shows strong interest (Maya detects via `%%LEAD%%` markers, same pattern already in AiTerminal), silently POST to `/api/contact` with name/company/intent if available.

---

### 3c. Admin Mode

**Goal:** Let Akhilesh update portfolio content through conversation.

**Authentication:** Admin selects Admin mode → NanoBot shows password prompt inline in the chat bubble → password POSTed to `/api/admin/login` → returns JWT → stored in sessionStorage.

**NanoBot behavior in admin mode:**
- Knows the current content of each `content/*.json` file (server provides it)
- Understands natural language edit requests
- Always proposes the change before applying it
- Never modifies anything without explicit approval ("yes" / "apply" / "do it")
- Reports success or failure after each operation

**Admin capabilities:**
- Read current content of any section
- Propose edits to any field in `content/*.json`
- Apply approved changes (write file + rebuild + push)
- Ask "what changed recently" (git log on content/ files)

**Admin constraints (hard limits, enforced server-side):**
- Can ONLY write to `content/*.json`
- Cannot touch any `.jsx`, `.tsx`, `.js` (non-content), `.css`, `.sh`, `.json` outside `content/`
- Server path validation: reject any write path that does not match `content/<allowed-section>.json`

---

## 4. GitHub Workflow

### Purpose

Git history is the audit log for content changes. Every NanoBot edit is a commit.

### Flow

```
Admin approves change in NanoBot chat
    ↓
Server:
  1. Validate JSON schema for the section
  2. Write to content/<section>.json (atomic: write tmp → rename)
  3. npm run build  (rebuild frontend with new content)
  4. Move build output to nginx serve directory
  5. git -C <repo_root> add content/<section>.json
  6. git -C <repo_root> commit -m "content(<section>): <description> [nanobot]"
  7. git -C <repo_root> push origin main
    ↓
GitHub receives push
  → Backup/history preserved
  → No CI/CD triggered (build already happened in step 3)
```

### Why Build Before Push

Build happens on the server immediately (step 3), not triggered by the GitHub push. This means:

- Visitors see the change in ~30 seconds (local build time)
- GitHub push is asynchronous backup — happens after the site is already live
- No dependency on GitHub Actions or external CI

### Commit Format

```
content(hero): update availability status [nanobot]
content(projects): add maya-miro GitHub link [nanobot]
content(experience): update 2024 highlights [nanobot]
```

The `[nanobot]` suffix makes admin commits easily identifiable in git log.

### Git Configuration on Server

The server process needs:
- Git user name and email configured: `git config user.name "NanoBot"` + `git config user.email "nanobot@akhileshnanda.maya-ai.dev"`
- GitHub credentials: SSH deploy key with write access to the repo (preferred over HTTPS token)
- SSH deploy key stored at `~/.ssh/nanobot_deploy_key`, loaded via SSH agent

---

## 5. Security Model

### Authentication

| Surface | Mechanism | Expiry |
|---|---|---|
| Admin mode | Single password → JWT | 24h, sessionStorage only |
| Visitor/Recruiter | No auth | — |

Password is stored as `ADMIN_PASSWORD` environment variable on the server. Never in source code. Never in `content/` files.

### Rate Limiting

| Endpoint | Limit |
|---|---|
| `POST /api/maya` (visitor/recruiter) | 20 requests / minute / IP |
| `POST /api/admin/login` | 5 attempts / 15 minutes / IP |
| `POST /api/admin/content/*` | 10 requests / minute / IP (per authenticated session) |
| `POST /api/admin/deploy` | 2 requests / minute / IP |

### Content Write Protection

Server-side validation before any write:

```
1. Is the requester authenticated? (valid JWT)
2. Is the target file in the allowed list?
   allowed = ['hero', 'projects', 'experience', 'skills', 'stats', 'contact']
   if not allowed: reject 403
3. Does the updated JSON match the schema for that section?
   if invalid: reject 400 with validation error
4. Atomic write: write to <section>.json.tmp, then rename
   if rename fails: keep original, return 500
```

Path traversal is impossible because the server maps `sectionName` to a hardcoded file path — no user-provided paths reach the filesystem.

### NanoBot Cannot

- Run arbitrary shell commands
- Read server environment variables
- Access files outside `content/`
- Modify any non-content file
- Access the admin JWT from the frontend (it stays in sessionStorage, never logged)

### What Happens If Maya Goes Down

- Visitor and Recruiter modes: NanoBot shows "OFFLINE" state in chat bubble. Sprite continues roaming.
- Admin mode: NanoBot shows "OFFLINE — content edits unavailable". No data loss (no partial writes).

---

## 6. Deployment Flow

### Baseline (Current Setup)

Oracle server runs:
- Node.js API server (Express) on port 3001
- nginx proxies `/api/*` to port 3001
- nginx serves static frontend build from `/var/www/portfolio/dist/`

### After NanoBot Admin Edit

```
Server process (Node.js):
  ├── Writes content/<section>.json to disk
  ├── Runs: cd /path/to/newakhilesh/frontend && npm run build
  ├── Copies dist/ to /var/www/portfolio/dist/ (or builds in-place)
  ├── Runs: git add content/<section>.json && git commit && git push
  └── Returns success to NanoBot chat

nginx:
  → Already serving /var/www/portfolio/dist/
  → No nginx reload needed (static files update on disk)

Visitor:
  → Sees new content on next page load (hard reload clears cache)
```

### Build Time

Vite build of the portfolio: ~15–25 seconds. This is the delay between admin approval and content going live.

NanoBot should communicate this:
```
NanoBot: "Applied. Rebuilding — live in ~20 seconds."
        [progress indicator]
        "Done. 🤖 /projects updated."
```

### Manual Deployment (No NanoBot)

For code changes (components, not content), deployment remains manual:
```bash
git push origin main
# SSH to server:
git pull && npm run build
```

NanoBot never touches this path.

---

## 7. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Build fails during admin session | Medium | Catch build error, report to NanoBot, keep old dist/, do not commit |
| Git push fails (network, auth) | Low | Report to NanoBot "saved locally, push failed — will retry". Content is already live (local build succeeded). |
| Maya API misunderstands edit intent | Medium | NanoBot always shows a diff preview before applying. Admin must explicitly confirm. |
| Admin password brute force | High | Rate limit login to 5 attempts / 15 min / IP. Lockout after 10 total failed attempts. |
| Content JSON corrupted | Medium | Schema validation before write. Atomic write (tmp → rename). Git history allows rollback. |
| Recruiter lead capture fails | Low | Lead POST is fire-and-forget. Chat continues regardless. Log failures server-side. |
| NanoBot roaming interferes with section interaction | Medium | NanoBot collision detection with interactive elements. Pause roaming when user is scrolling fast or when an interactive element has focus. |
| Build blocks API responses | Medium | Run build in a child process. API remains responsive during build. Report status via polling or SSE. |

---

## 8. Future Enhancements

These are not in scope for any current phase. Document for later consideration.

**Conversational memory**  
NanoBot remembers what a recruiter asked earlier in the same session. Currently each message is stateless. A simple in-memory conversation history (last 10 turns) sent with each Maya request would make the chat feel more natural.

**NanoBot personality evolution**  
The droid's animation state could reflect the conversation — confused when it doesn't know an answer, excited when talking about Maya MIRO, professional when in recruiter mode. Currently FSM states are roaming/idle/talking.

**Admin diff view**  
Before approving a content change, show a readable diff (not raw JSON). "You're changing 'Open to work' → 'Actively interviewing'" is clearer than showing the full JSON.

**Content rollback via NanoBot**  
Admin can ask "undo the last change" and NanoBot runs `git revert HEAD` on the content file. Since all content changes are commits, rollback is always possible.

**Scheduled content updates**  
Admin can say "update oracle uptime every hour" — NanoBot sets a cron job to refresh `stats.json` from the live Oracle API. Currently stats only update when admin edits or `/api/stats` is polled by the frontend.

**NanoBot explains sections**  
When a visitor scrolls to Projects, NanoBot proactively wanders closer and shows a hint bubble: "Ask me about any of these." Triggered by scroll position. Opt-in — does not interrupt reading.

---

## Implementation Notes

When building (Phase 6+), the smallest viable NanoBot system is:

1. **Sprite + FSM** — already working in `newakhilesh/src/` playground
2. **Chat bubble with role selector** — already working in playground
3. **Maya API call** — already exists at `/api/maya`, just needs mode parameter added to prompt routing
4. **Admin auth** — new: `POST /api/admin/login` returns JWT, stored in sessionStorage
5. **Content write** — new: `POST /api/admin/content/:section`, validates + writes + builds + commits
6. **Roaming integration** — mount NanoBot as a fixed overlay in App.jsx, same as AiTerminal was

That is the entire system. No new frameworks. No new databases. No agent orchestration. One LLM call per message, one server endpoint per action.
