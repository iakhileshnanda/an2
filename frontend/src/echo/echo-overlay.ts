import { sendToEchoStream, sendLeaving } from './chat/chatService'
import type { HistoryItem } from './chat/chatService'
// @ts-ignore — editorial JSON lives outside src/; resolved by the @content alias
import changelogJson from '@content/changelog.json'

const changelog: Array<{ date: string; month: string; items: string[] }> = Array.isArray(
  changelogJson,
)
  ? changelogJson
  : []

/* ============================================================================
   ECHO OVERLAY — green terminal UI layer around the roaming droid
   ----------------------------------------------------------------------------
   Self-contained, framework-free. Creates its own DOM, tracks the droid via
   getBoundingClientRect() every animation frame, and NEVER touches the droid
   sprite, its FSM, or its movement logic. Purely additive — does not intercept
   the droid's own click handlers.

   Three features:
     1. IDLE TEXT       rotating one-liners below the droid, fading every 3s.
     2. INPUT           bare `>` prompt + blinking cursor on droid click,
                        Enter -> existing /api/echo endpoint via chatService.
     3. RESPONSE BUBBLE Echo's reply in a CSS-only pixel speech bubble above
                        the droid (stepped box-shadow border, tail points down).

   Colors reuse the codebase tokens where the palette allows. The brief and the
   reference art are explicitly *green* monospace, but the project's
   --color-green-terminal token has been repurposed to Cherry Red, so the green
   lives in a local --echo-ov-green custom property that is trivial to retheme.
   Font reuses the existing --font-mono token. Bubble background reuses
   --color-white (Cotton).
   ============================================================================ */

// The droid sprite wrapper carries aria-label="Echo" (see character/Echo.tsx).
const DROID_SELECTOR = '[aria-label="Echo"]'

// Where, as a fraction of the droid's bounding box height, the visible art's
// "head" (bubble anchor) and "feet" (idle/trail/input anchor) sit. The 32px
// sprite is scaled to fill a square canvas with transparent padding, so these
// pull the UI in toward the actual pixels. Tune if the droid art shifts.
const HEAD_INSET = 0.3
const FEET_INSET = 0.72

const IDLE_GAP = 8 // px below the feet for idle text / input
const BUBBLE_GAP = 6 // px above the head for the bubble tail tip

const IDLE_ROTATE_MS = 3000
const IDLE_FADE_MS = 450

const BUBBLE_DISMISS_MS = 8000

const IDLE_LINES = [
  'i pull his github live. ask.',
  'i know every project here.',
  'resume? i hand those out.',
  'i remember return visitors.',
  'type /help to see what i do.',
  "i'll tell you what he ships.",
]

const OFFLINE_REPLY = 'offline. reach akhilesh: theakhileshnanda@gmail.com'

// What Echo actually does — shown on first visit and via /help. Kept honest:
// every line maps to a real capability (tools, memory, resume link).
const CAPABILITIES =
  "i'm echo. akhilesh built me.\n" +
  'i can:\n' +
  '• pull his live github activity\n' +
  '• walk you through any project\n' +
  '• hand over the resume\n' +
  '• answer salary + availability\n' +
  '• remember you next visit\n' +
  'click me, then just ask.'

const STYLE_ID = 'echo-overlay-style'
const ROOT_ID = 'echo-overlay-root'

// Session conversation memory — survives refresh via sessionStorage, dies with
// the tab (a new tab is a new conversation). Only the last 8 turns are kept.
const HISTORY_KEY = 'echo_chat_history'
const HISTORY_MAX = 8

function loadHistory(): HistoryItem[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    const arr = raw ? JSON.parse(raw) : []
    if (!Array.isArray(arr)) return []
    return arr
      .filter(
        (m) =>
          m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
      )
      .slice(-HISTORY_MAX)
  } catch {
    return []
  }
}

function saveHistory(history: HistoryItem[]): void {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    /* private mode — in-memory history still works */
  }
}

const CSS = `
#${ROOT_ID} {
  position: fixed;
  inset: 0;
  z-index: 9002;            /* above the droid (9000/9001), below gesture (9999) */
  pointer-events: none;
  --echo-ov-green: #5e9c3a; /* terminal green — retheme here */
  --echo-ov-border: #1B1716;
  --echo-ov-bg: var(--color-white, #edebde);
  --echo-ov-font: var(--font-mono, 'JetBrains Mono', monospace);
  --echo-ov-px: 4px;        /* one "pixel" unit for the bubble border/tail */
  font-family: var(--echo-ov-font);
  color: var(--echo-ov-green);
}

#${ROOT_ID} .eo-layer {
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
}

/* ── idle text ── */
#${ROOT_ID} .eo-idle {
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  text-align: center;
  opacity: 0;
  transition: opacity ${IDLE_FADE_MS}ms ease;
  text-shadow: 0 0 1px var(--echo-ov-bg);
}

/* ── input ── */
#${ROOT_ID} .eo-input {
  display: none;
  align-items: center;
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  pointer-events: auto;
  cursor: text;
}
#${ROOT_ID} .eo-input.eo-on { display: inline-flex; }
#${ROOT_ID} .eo-input .eo-prompt { margin-right: 6px; }
#${ROOT_ID} .eo-input .eo-mirror { min-width: 1px; }
#${ROOT_ID} .eo-input .eo-cursor {
  display: inline-block;
  width: 7px;
  height: 14px;
  margin-left: 1px;
  background: var(--echo-ov-green);
  animation: eo-blink 1s step-end infinite;
}
#${ROOT_ID} .eo-input .eo-real {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: transparent;
  caret-color: transparent;
  font: inherit;
  pointer-events: auto;
}
@keyframes eo-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }

/* ── dotted terminal speech bubble ── */
#${ROOT_ID} .eo-bubble {
  display: inline-block;
  min-width: 96px;
  max-width: 240px;
  padding: 10px 16px;
  background: var(--echo-ov-bg);
  color: var(--echo-ov-green);
  font-size: 13px;
  line-height: 1.7;
  text-align: left;
  white-space: pre-line;
  border: 1px dotted var(--echo-ov-border);
  transform: translate(-50%, -100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}
#${ROOT_ID} .eo-bubble.eo-on { opacity: 1; }

/* downward dotted tail connecting the bubble to the droid's head */
#${ROOT_ID} .eo-bubble .eo-tail {
  position: absolute;
  left: 50%;
  top: 100%;
  width: 0;
  height: ${BUBBLE_GAP}px;
  margin-left: -1px;
  border-left: 1px dotted var(--echo-ov-border);
}
`

export interface EchoOverlayHandle {
  destroy: () => void
}

let active: EchoOverlayHandle | null = null
let askImpl: ((prompt: string) => void) | null = null

/**
 * Programmatically ask Echo something — used by the "ask echo →" actions on
 * the timeline. Sends immediately (no typing needed); the reply shows in the
 * usual speech bubble. No-op if the overlay isn't mounted.
 */
export function askEcho(prompt: string): void {
  askImpl?.(prompt)
}

/**
 * Mount the overlay. Idempotent — a second call returns the existing handle.
 * Returns a handle with destroy() for teardown (e.g. React effect cleanup).
 */
export function initEchoOverlay(): EchoOverlayHandle {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { destroy: () => {} }
  }
  if (active) return active

  // ── styles ──
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    document.head.appendChild(style)
  }

  // ── root ──
  const root = document.createElement('div')
  root.id = ROOT_ID

  // idle text
  const idleEl = document.createElement('div')
  idleEl.className = 'eo-layer eo-idle'

  // input
  const inputEl = document.createElement('div')
  inputEl.className = 'eo-layer eo-input'
  const promptEl = document.createElement('span')
  promptEl.className = 'eo-prompt'
  promptEl.textContent = '>'
  const mirrorEl = document.createElement('span')
  mirrorEl.className = 'eo-mirror'
  const cursorEl = document.createElement('span')
  cursorEl.className = 'eo-cursor'
  const realInput = document.createElement('input')
  realInput.className = 'eo-real'
  realInput.type = 'text'
  realInput.setAttribute('aria-label', 'Ask Echo')
  realInput.autocomplete = 'off'
  realInput.spellcheck = false
  inputEl.append(promptEl, mirrorEl, cursorEl, realInput)

  // bubble
  const bubbleEl = document.createElement('div')
  bubbleEl.className = 'eo-layer eo-bubble'
  const bubbleText = document.createElement('span')
  const tailEl = document.createElement('span')
  tailEl.className = 'eo-tail'
  bubbleEl.append(bubbleText, tailEl)

  root.append(idleEl, inputEl, bubbleEl)
  document.body.appendChild(root)

  // ── state ──
  let droid: Element | null = null
  let rafId = 0
  let inputVisible = false
  let bubbleVisible = false
  let bubbleTimer: ReturnType<typeof setTimeout> | null = null

  let idleIdx = 0
  let idleTimer: ReturnType<typeof setTimeout> | null = null

  // conversation memory for this session
  let history: HistoryItem[] = loadHistory()
  let leavingSent = false

  function pushHistory(role: HistoryItem['role'], content: string) {
    history = [...history, { role, content }].slice(-HISTORY_MAX)
    saveHistory(history)
  }

  // ── idle rotation ──
  function showIdleLine() {
    idleEl.textContent = IDLE_LINES[idleIdx % IDLE_LINES.length]
    if (!inputVisible) idleEl.style.opacity = '1'
  }
  function rotateIdle() {
    idleEl.style.opacity = '0'
    idleTimer = setTimeout(() => {
      idleIdx += 1
      showIdleLine()
      idleTimer = setTimeout(rotateIdle, IDLE_ROTATE_MS)
    }, IDLE_FADE_MS)
  }
  showIdleLine()
  idleTimer = setTimeout(rotateIdle, IDLE_ROTATE_MS)

  // ── bubble ──
  function showBubble(text: string, dismissMs: number = BUBBLE_DISMISS_MS) {
    bubbleText.textContent = text
    bubbleVisible = true
    bubbleEl.classList.add('eo-on')
    if (bubbleTimer) clearTimeout(bubbleTimer)
    bubbleTimer = setTimeout(hideBubble, dismissMs)
  }
  function hideBubble() {
    bubbleVisible = false
    bubbleEl.classList.remove('eo-on')
    if (bubbleTimer) {
      clearTimeout(bubbleTimer)
      bubbleTimer = null
    }
  }

  // ── input ──
  function setInputVisible(on: boolean) {
    inputVisible = on
    inputEl.classList.toggle('eo-on', on)
    // idle text vacates the slot the input occupies
    idleEl.style.opacity = on ? '0' : '1'
    if (on) {
      realInput.focus()
    } else {
      realInput.value = ''
      mirrorEl.textContent = ''
      realInput.blur()
    }
  }

  function onRealInput() {
    mirrorEl.textContent = realInput.value
  }

  function submit(value: string) {
    // /help is answered locally — no API round-trip for a static list
    if (/^\/?help$/i.test(value.trim())) {
      showBubble(CAPABILITIES, 15000)
      return
    }
    hideBubble() // dismiss previous reply on next input
    showBubble('…')
    // send prior turns only — the backend appends the current message itself
    const past = history.slice()
    pushHistory('user', value)
    // streamed deltas render live in the bubble; the resolved reply is
    // authoritative and replaces whatever was streamed (they normally match)
    let streamed = ''
    sendToEchoStream(value, past, {
      onStatus: (status) => {
        streamed = '' // a tool round restarts the visible reply
        showBubble(status)
      },
      onDelta: (text) => {
        streamed += text
        showBubble(streamed)
      },
    })
      .then((r) => {
        if (r.reply) pushHistory('assistant', r.reply)
        showBubble(r.reply || OFFLINE_REPLY)
      })
      .catch(() => showBubble(OFFLINE_REPLY))
  }

  function onRealKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setInputVisible(false)
      return
    }
    if (e.key !== 'Enter') return
    e.preventDefault()
    const value = realInput.value.trim()
    if (!value) return
    realInput.value = ''
    mirrorEl.textContent = ''
    submit(value)
  }

  // clicking the droid toggles the input. We do NOT stopPropagation — the
  // droid's own FSM click handler keeps working (coexist, per brief).
  function onDroidClick() {
    setInputVisible(!inputVisible)
  }

  // clicking anywhere outside the droid/input closes the terminal so the
  // droid can resume roaming (the FSM side of "close" lives in useEcho.ts).
  function onDocClick(e: MouseEvent) {
    if (!inputVisible) return
    const target = e.target as Node
    if (droid && droid.contains(target)) return
    if (root.contains(target)) return
    setInputVisible(false)
  }

  // leaving trigger — lets the backend write its visit summary for next time.
  // Fires once, and only if there was an actual conversation to summarize.
  function onPageLeave() {
    if (leavingSent || history.length === 0) return
    leavingSent = true
    sendLeaving(history)
  }

  // ── greetings ──
  // First visit: Echo introduces itself once with its capability list.
  // Returning visit: if the changelog has entries newer than the visitor's
  // last visit, greet them once with what shipped since.
  const LAST_SEEN_KEY = 'echo_last_seen'
  const INTRO_KEY = 'echo_intro_shown'
  let greetTimer: ReturnType<typeof setTimeout> | null = null
  function scheduleReturningGreeting() {
    try {
      const visits = parseInt(localStorage.getItem('echo_visit_count') || '1', 10) || 1
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY)
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString())
      if (visits <= 1) {
        // introduce once, ever — a returning visitor already knows the drill
        if (!localStorage.getItem(INTRO_KEY)) {
          localStorage.setItem(INTRO_KEY, '1')
          greetTimer = setTimeout(() => {
            if (inputVisible || bubbleVisible) return // don't interrupt
            showBubble(CAPABILITIES, 15000)
          }, 4000)
        }
        return
      }

      // changelog dates are "YYYY-MM" — string compare works
      const fresh = lastSeen
        ? changelog.filter((c) => c.date > lastSeen.slice(0, 7))
        : changelog.slice(0, 1)
      const items = fresh.flatMap((c) => c.items).slice(0, 3)
      if (!items.length) return

      greetTimer = setTimeout(() => {
        if (inputVisible || bubbleVisible) return // don't interrupt
        showBubble(
          'welcome back.\nsince your last visit:\n' +
            items.map((i) => `• ${i.toLowerCase()}`).join('\n'),
        )
      }, 3500)
    } catch {
      /* localStorage unavailable — skip the greeting */
    }
  }
  scheduleReturningGreeting()

  realInput.addEventListener('input', onRealInput)
  realInput.addEventListener('keydown', onRealKeydown)
  // keep the native input under the visible cursor: focus when the group is clicked
  inputEl.addEventListener('mousedown', () => realInput.focus())
  document.addEventListener('click', onDocClick)
  window.addEventListener('pagehide', onPageLeave)
  window.addEventListener('beforeunload', onPageLeave)

  // ── frame loop: track the droid, position everything ──
  function frame() {
    rafId = requestAnimationFrame(frame)

    if (!droid || !droid.isConnected) {
      droid = document.querySelector(DROID_SELECTOR)
    }
    if (!droid) {
      idleEl.style.opacity = '0'
      return
    }

    const rect = droid.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return

    const cx = rect.left + rect.width / 2
    const headY = rect.top + rect.height * HEAD_INSET
    const feetY = rect.top + rect.height * FEET_INSET
    const belowY = feetY + IDLE_GAP

    // idle text / input share the slot just below the feet
    idleEl.style.transform = `translate(${cx}px, ${belowY}px) translateX(-50%)`
    inputEl.style.transform = `translate(${cx}px, ${belowY}px) translateX(-50%)`

    // bubble sits above the head, tail tip pointing down at headY
    bubbleEl.style.transform = `translate(${cx}px, ${headY - BUBBLE_GAP}px) translate(-50%, -100%)`
  }

  // attach the droid click listener once the element exists
  let clickBound: Element | null = null
  function bindDroidClick() {
    const el = document.querySelector(DROID_SELECTOR)
    if (el && el !== clickBound) {
      clickBound?.removeEventListener('click', onDroidClick)
      el.addEventListener('click', onDroidClick)
      clickBound = el
    }
  }
  bindDroidClick()
  // the droid wrapper persists, but re-check periodically in case it remounts
  const rebindTimer = setInterval(bindDroidClick, 2000)

  rafId = requestAnimationFrame(frame)

  // expose the programmatic ask for "ask echo →" timeline actions
  askImpl = (prompt: string) => {
    setInputVisible(false)
    submit(prompt)
  }

  // ── teardown ──
  const handle: EchoOverlayHandle = {
    destroy() {
      cancelAnimationFrame(rafId)
      clearInterval(rebindTimer)
      if (idleTimer) clearTimeout(idleTimer)
      if (bubbleTimer) clearTimeout(bubbleTimer)
      if (greetTimer) clearTimeout(greetTimer)
      askImpl = null
      clickBound?.removeEventListener('click', onDroidClick)
      realInput.removeEventListener('input', onRealInput)
      realInput.removeEventListener('keydown', onRealKeydown)
      document.removeEventListener('click', onDocClick)
      window.removeEventListener('pagehide', onPageLeave)
      window.removeEventListener('beforeunload', onPageLeave)
      root.remove()
      document.getElementById(STYLE_ID)?.remove()
      active = null
    },
  }
  active = handle
  return handle
}
