import { useEchoStore } from '../store/echoStore'

// Persistent, anonymous visitor identity + live session context.
// This is the "who is this / what are they doing right now" layer that the
// backend needs for memory and behavioral mode inference. It tracks section
// dwell by subscribing to the existing echoStore — it does not touch the FSM.

const VISITOR_KEY = 'echo_visitor_id'
const VISITS_KEY = 'echo_visit_count'

export interface SessionContext {
  currentSection: string | null
  timeOnPage: number // seconds
  visitCount: number
  lastFsmState: string
  sectionDwellTimes: Record<string, number> // seconds per section
  focusedTimelineEntry: string | null // career era currently in view
}

function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch {
    /* fall through */
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const pageStart = Date.now()
const dwellMs: Record<string, number> = {}
let curSection: string | null = null
let curSince = Date.now()
let visitCount = 1
let initialized = false

function flushDwell() {
  if (curSection) {
    dwellMs[curSection] = (dwellMs[curSection] || 0) + (Date.now() - curSince)
    curSince = Date.now()
  }
}

function ensureInit() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  // Visit count: bumped once per page load.
  const prev = parseInt(localStorage.getItem(VISITS_KEY) || '0', 10) || 0
  visitCount = prev + 1
  try {
    localStorage.setItem(VISITS_KEY, String(visitCount))
  } catch {
    /* private mode — fine, count stays 1 */
  }

  // Start dwell tracking from whatever section is active now.
  curSection = useEchoStore.getState().activeSection
  curSince = Date.now()
  useEchoStore.subscribe((state) => {
    if (state.activeSection !== curSection) {
      flushDwell()
      curSection = state.activeSection
      curSince = Date.now()
    }
  })
}

export function getVisitorId(): string {
  ensureInit()
  let id: string | null = null
  try {
    id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = makeId()
      localStorage.setItem(VISITOR_KEY, id)
    }
  } catch {
    id = id || makeId()
  }
  return id
}

export function getSessionContext(): SessionContext {
  ensureInit()
  flushDwell()
  const toSeconds = (ms: number) => Math.round(ms / 1000)
  const dwell: Record<string, number> = {}
  for (const [k, v] of Object.entries(dwellMs)) dwell[k] = toSeconds(v)
  return {
    currentSection: curSection,
    timeOnPage: toSeconds(Date.now() - pageStart),
    visitCount,
    lastFsmState: useEchoStore.getState().fsm.state,
    sectionDwellTimes: dwell,
    focusedTimelineEntry: useEchoStore.getState().focusedTimeline,
  }
}

// Kick off tracking as soon as Echo's code loads, so we capture browsing that
// happens before the visitor ever opens the chat.
ensureInit()
