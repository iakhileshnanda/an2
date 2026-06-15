import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { createFSM, transition } from './NanoBotFSM'
import type { FSMContext, FSMEvent } from './NanoBotFSM'
import type { UserRole } from './types'
import { ANIMATIONS } from './types'

const MARGIN = 16

const SPEED_DURATION: Record<FSMContext['speed'], number> = {
  slow: 3.5,
  normal: 2.0,
  fast: 0.9,
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function getDisplaySize() {
  return window.innerWidth < 480 ? 96 : 160
}

function getInitPos(displaySize: number) {
  const x = Math.round(window.innerWidth * 0.72 - displaySize / 2)
  return {
    x: clamp(x, MARGIN, window.innerWidth - displaySize - MARGIN),
    y: window.innerHeight - displaySize - MARGIN,
  }
}

function fsmReducer(state: FSMContext, event: FSMEvent): FSMContext {
  return transition(state, event)
}

const SECTION_HINTS: Record<string, string[]> = {
  hero:       ['psst. ask me something.', 'i know things about this guy.', 'curious? just click me.'],
  experience: ['7 years of work. ask me to break it down.', 'want the career highlights?'],
  projects:   ['any of these catch your eye?', 'i can tell you what those actually do.'],
  numbers:    ['the stats update live. ask me what they mean.', 'go ahead, ask about the numbers.'],
}

const IDLE_HINTS = ['psst. click me.', 'still here if you have questions.', 'ask me anything.']

function pickHint(section: string | null): string {
  const pool = section && SECTION_HINTS[section] ? SECTION_HINTS[section] : IDLE_HINTS
  return pool[Math.floor(Math.random() * pool.length)]
}

export function useNanoBot() {
  const [displaySize, setDisplaySize] = useState(() =>
    typeof window !== 'undefined' ? getDisplaySize() : 128
  )
  const [fsm, dispatch] = useReducer(fsmReducer, undefined, createFSM)
  const [pos, setPos] = useState(() =>
    typeof window !== 'undefined'
      ? getInitPos(getDisplaySize())
      : { x: 120, y: 600 }
  )
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  const posRef = useRef(pos)
  const fsmRef = useRef(fsm)
  const activeSectionRef = useRef(activeSection)
  const roamTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animDoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clickCount = useRef(0)
  const clickWindowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hintDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  posRef.current = pos
  fsmRef.current = fsm
  activeSectionRef.current = activeSection

  // viewport resize
  useEffect(() => {
    function onResize() {
      const newSize = getDisplaySize()
      setDisplaySize(newSize)
      setPos(p => ({
        x: clamp(p.x, MARGIN, window.innerWidth - newSize - MARGIN),
        y: window.innerHeight - newSize - MARGIN,
      }))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // roam tick
  const scheduleRoam = useCallback(() => {
    if (roamTimer.current) clearTimeout(roamTimer.current)
    const delay = 3000 + Math.random() * 5000
    roamTimer.current = setTimeout(() => {
      dispatch({ type: 'ROAM_TICK' })
      scheduleRoam()
    }, delay)
  }, [])

  useEffect(() => {
    scheduleRoam()
    return () => { if (roamTimer.current) clearTimeout(roamTimer.current) }
  }, [scheduleRoam])

  // movement when ROAMING — constrained to center 60% of viewport
  useEffect(() => {
    if (fsm.state !== 'ROAMING') return
    const roamMinX = Math.max(MARGIN, Math.round(window.innerWidth * 0.20))
    const roamMaxX = Math.min(
      window.innerWidth - displaySize - MARGIN,
      Math.round(window.innerWidth * 0.80 - displaySize)
    )
    const dist =
      fsm.speed === 'fast' ? 120 + Math.random() * 80 :
      fsm.speed === 'slow' ? 20 + Math.random() * 40 :
      50 + Math.random() * 80
    const targetX = clamp(
      posRef.current.x + (fsm.facingLeft ? -1 : 1) * dist,
      roamMinX,
      roamMaxX
    )
    setPos(p => ({ ...p, x: targetX }))
  }, [fsm.state, fsm.facingLeft, fsm.speed, displaySize])

  // one-shot animations: JUMPING & SQUISH
  useEffect(() => {
    if (fsm.state !== 'JUMPING' && fsm.state !== 'SQUISH') return
    if (animDoneTimer.current) clearTimeout(animDoneTimer.current)
    const anim = ANIMATIONS[fsm.state]
    const duration = (anim.frameCount / anim.fps) * 1000
    animDoneTimer.current = setTimeout(() => dispatch({ type: 'ANIM_DONE' }), duration)
    return () => { if (animDoneTimer.current) clearTimeout(animDoneTimer.current) }
  }, [fsm.state])

  // LEAVING: slide off screen then reset
  useEffect(() => {
    if (fsm.state !== 'LEAVING') return
    const targetX = fsm.facingLeft
      ? -displaySize - 40
      : window.innerWidth + 40
    setPos(p => ({ ...p, x: targetX }))
    leaveTimer.current = setTimeout(() => {
      dispatch({ type: 'LEAVE_DONE' })
      setPos(getInitPos(displaySize))
    }, 1800)
    return () => { if (leaveTimer.current) clearTimeout(leaveTimer.current) }
  }, [fsm.state, fsm.facingLeft, displaySize])

  // IntersectionObserver — track which section is in view
  useEffect(() => {
    const SECTIONS = ['hero', 'experience', 'projects', 'numbers']
    const observers: IntersectionObserver[] = []

    SECTIONS.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.3 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [])

  // dismiss hint when section changes
  useEffect(() => {
    setHint(null)
    if (hintDismissTimer.current) clearTimeout(hintDismissTimer.current)
  }, [activeSection])

  // dismiss hint when chat opens
  useEffect(() => {
    const chatOpen = fsm.state === 'TALKING' || fsm.state === 'THINKING'
    if (chatOpen) {
      setHint(null)
      if (hintDismissTimer.current) clearTimeout(hintDismissTimer.current)
    }
  }, [fsm.state])

  // proactive idle hint — fires after 60s of no interaction
  const scheduleIdleHint = useCallback(() => {
    if (idleHintTimer.current) clearTimeout(idleHintTimer.current)
    idleHintTimer.current = setTimeout(() => {
      const state = fsmRef.current.state
      if (state === 'TALKING' || state === 'THINKING' || state === 'LEAVING') return
      setHint(pickHint(activeSectionRef.current))
      if (hintDismissTimer.current) clearTimeout(hintDismissTimer.current)
      hintDismissTimer.current = setTimeout(() => setHint(null), 5000)
    }, 60_000)
  }, [])

  useEffect(() => {
    scheduleIdleHint()
    return () => {
      if (idleHintTimer.current) clearTimeout(idleHintTimer.current)
      if (hintDismissTimer.current) clearTimeout(hintDismissTimer.current)
    }
  }, [scheduleIdleHint])

  const dismissHint = useCallback(() => {
    setHint(null)
    if (hintDismissTimer.current) clearTimeout(hintDismissTimer.current)
  }, [])

  // click handler — accumulates clicks in a 350ms window, then resolves
  const handleClick = useCallback(() => {
    if (fsmRef.current.state === 'LEAVING') return

    dismissHint()
    scheduleIdleHint()

    clickCount.current += 1
    if (clickWindowTimer.current) clearTimeout(clickWindowTimer.current)

    clickWindowTimer.current = setTimeout(() => {
      const count = clickCount.current
      clickCount.current = 0

      const state = fsmRef.current.state
      if (state === 'JUMPING' || state === 'SQUISH' || state === 'LEAVING') return

      if (count >= 3) {
        if (state !== 'TALKING' && state !== 'THINKING') {
          dispatch({ type: 'TRIPLE_CLICK' })
        }
      } else if (count === 2) {
        if (state !== 'TALKING' && state !== 'THINKING') {
          dispatch({ type: 'DOUBLE_CLICK' })
        }
      } else {
        if (state !== 'THINKING') {
          dispatch({ type: 'CLICK' })
        }
      }
    }, 350)
  }, [dismissHint, scheduleIdleHint])

  const handleRoleSelect = useCallback((role: UserRole) => {
    dispatch({ type: 'ROLE_SELECTED', role })
  }, [])

  const handleClose = useCallback(() => {
    dispatch({ type: 'CLOSE' })
    scheduleIdleHint()
  }, [scheduleIdleHint])

  const handleMessageSent = useCallback(() => {
    dispatch({ type: 'MESSAGE_SENT' })
  }, [])

  const handleReplyReceived = useCallback(() => {
    dispatch({ type: 'REPLY_RECEIVED' })
  }, [])

  const moveDuration =
    fsm.state === 'LEAVING' ? 1.6 :
    fsm.state === 'ROAMING' ? SPEED_DURATION[fsm.speed] :
    0

  return {
    fsm,
    pos,
    displaySize,
    moveDuration,
    handleClick,
    handleRoleSelect,
    handleClose,
    handleMessageSent,
    handleReplyReceived,
    hint,
    dismissHint,
  }
}
