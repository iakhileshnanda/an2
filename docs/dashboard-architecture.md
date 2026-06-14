# Dashboard Architecture — Real-Time Status Section

> Status: Design only — not implemented  
> Target phase: Phase 7

---

## Goal

A live dashboard section visible in the middle of the portfolio that updates automatically. It shows the real-time state of Akhilesh's AI systems, agents, and activity without user interaction.

Visitors get a live window into what is actually running.

---

## Widgets (Future)

| Widget ID | Label | Data Source | Update Frequency |
|---|---|---|---|
| `oracle-uptime` | ORACLE UPTIME | Server ping / Oracle agent status | 60s |
| `nanobot-status` | NANOBOT STATUS | NanoBot service health | 30s |
| `maya-status` | MAYA STATUS | /api/maya health | 60s |
| `jobs-scraped` | JOBS SCRAPED | Oracle DB count | 5 min |
| `best-match` | BEST MATCH | Oracle DB best score | 5 min |
| `agents-running` | AGENTS RUNNING | Process list / PM2 status | 30s |
| `github-activity` | LAST COMMIT | GitHub API | 5 min |
| `build-status` | BUILD STATUS | CI webhook or polling | on event |
| `mcp-tools` | MCP TOOLS | Static config | manual update |

---

## Transport Recommendation: Server-Sent Events (SSE)

### Options Compared

**REST polling**
- Simple. Universally supported. Works behind any proxy.
- Cons: Wasteful. Each client polls independently. Data is stale between polls.
- When to use: For low-frequency, non-real-time data (jobs scraped, build status).

**WebSocket**
- True bidirectional real-time. Best for interactive systems (chat, collaborative editing).
- Cons: More complex server setup. Requires connection management. Not needed here — dashboard is read-only.
- When to use: NanoBot chat, Maya conversation.

**Server-Sent Events (SSE) ← Recommended for dashboard**
- One-directional push from server to browser over HTTP.
- Persistent connection. Automatic reconnection built into the browser.
- Works through nginx with correct headers. No special protocol.
- Simpler than WebSocket for read-only data streams.
- Native browser support (`EventSource` API). No library needed.
- When to use: Live dashboard. Any server-push that the browser only reads.

### Decision

Use **SSE for live dashboard updates**. Use **REST polling** for low-frequency data. Reserve WebSocket for NanoBot/Maya chat when that is implemented.

---

## Architecture Diagram

```
Browser
│
│  EventSource('/api/dashboard/stream')
│  ─────────────────────────────────────►  Server (Node.js)
│                                          │
│  ◄─────────────────────────────────────  │  event: stats-update
│  data: { oracleUptime: 99.9, ... }       │
│                                          │  Collects from:
│  [auto-reconnect on drop]                │  ├── Oracle agent (REST)
│                                          │  ├── System metrics (os module)
│  REST polling (5 min interval)           │  ├── PM2 process list
│  ─────────────────────────────────────►  │  ├── GitHub API (cached 5min)
│  GET /api/stats                          │  └── NanoBot health endpoint
│  ◄─────────────────────────────────────
│  { jobsScraped, bestMatch, ... }
│
▼
DashboardSection component
├── useDashboard() hook
│   ├── manages EventSource connection
│   ├── merges REST + SSE data
│   └── exposes { cells, connected, lastUpdated }
├── <DataCell> per widget
└── <ConnectionIndicator> (green dot / reconnecting)
```

---

## Frontend Module Structure

```
src/dashboard/
├── widgets/
│   ├── DataCell.jsx          — individual stat cell with count-up animation
│   ├── StatusBadge.jsx       — ONLINE / OFFLINE / BUILDING badge
│   ├── GithubActivity.jsx    — last commit display
│   └── BuildStatus.jsx       — CI pass/fail indicator
├── realtime/
│   ├── useDashboard.js       — main hook: SSE + REST merge + reconnect logic
│   ├── useSSE.js             — raw EventSource wrapper (auto-reconnect, cleanup)
│   └── useStatsPolling.js    — REST polling hook for low-frequency data
└── services/
    ├── dashboardApi.js       — GET /api/stats, GET /api/dashboard/health
    └── eventSourceClient.js  — EventSource factory with auth header support
```

---

## Server Module Structure

```
server/
└── dashboard/
    ├── dashboardRouter.js      — mounts all dashboard routes
    ├── sseHandler.js           — manages SSE client connections + broadcasts
    ├── collectors/
    │   ├── oracleCollector.js  — polls Oracle agent for status
    │   ├── systemCollector.js  — CPU, memory, process list (PM2)
    │   ├── githubCollector.js  — GitHub API with 5-min cache
    │   └── nanobotCollector.js — pings NanoBot health endpoint
    └── broadcaster.js          — aggregates collectors, pushes SSE events
```

---

## API Contract

### SSE Stream
```
GET /api/dashboard/stream
Content-Type: text/event-stream
Cache-Control: no-cache

Events:
  event: stats-update
  data: {
    "oracleUptime": 99.9,
    "nanobotStatus": "ONLINE",
    "jobsScraped": 47,
    "bestMatch": 91,
    "mcpTools": 6,
    "agentsRunning": 3,
    "lastCommit": { "message": "...", "repo": "...", "at": "ISO8601" },
    "buildStatus": "passing"
  }

  event: heartbeat
  data: { "at": "ISO8601" }
```

### REST Fallback
```
GET /api/stats
Response: same shape as SSE stats-update data
```

---

## Scalability

**Current scale:** 1 server (Oracle on the same VPS). SSE connections are lightweight — 1000 concurrent connections use ~100MB RAM. No concern at portfolio traffic levels.

**If traffic grows:**
- Add Redis pub/sub between collectors and SSE broadcaster
- Multiple Node processes can all subscribe to the same Redis channel
- SSE clients connect to any process; they all receive the same broadcast

**Nginx configuration required for SSE:**
```nginx
location /api/dashboard/stream {
    proxy_pass http://localhost:3001;
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding on;
}
```

---

## Implementation Notes for Phase 7

1. **Start with REST polling.** Ship the section with `GET /api/stats` polling every 30s. Works immediately, no new server code.
2. **Add SSE in Phase 7b.** Once the section is designed and working, layer SSE on top by switching `useDashboard` from polling to EventSource.
3. **Graceful degradation.** If SSE connection drops, fall back to REST polling. If REST fails, show last known values with a stale indicator.
4. **No WebSocket.** The portfolio dashboard is read-only. WebSocket is overkill.
