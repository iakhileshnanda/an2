import { useCallback, useEffect, useRef, useState } from 'react'
import { useEchoStore } from '../store/echoStore'
import { pickHint } from '../content/hints'
import { ANIMATIONS } from './types'
import {
  MARGIN, ROAM_DELAY_MIN, ROAM_DELAY_MAX,
  IDLE_HINT_DELAY, HINT_AUTODISMISS,
  LEAVE_DURATION, CLICK_WINDOW, SECTION_IDS, SPEED_DURATION,
} from './constants'

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function getDisplaySize() {
  return window.innerWidth < 480 ? 120 : 200
}

function getInitPos(displaySize: number) {
  const x = Math.round(window.innerWidth * 0.72 - displaySize / 2)
  return {
    x: clamp(x, MARGIN, window.innerWidth - displaySize - MARGIN),
    y: window.innerHeight - displaySize - 32,
  }
}

export function useEcho() {
  const dispatch   = useEchoStore((s) => s.dispatch)
  const fsm        = useEchoStore((s) => s.fsm)
  const activeSection    = useEchoStore((s) => s.activeSection)
  const setActiveSection = useEchoStore((s) => s.setActiveSection)
  const setHint    = useEchoStore((s) => s.setHint)
  const clearHint  = useEchoStore((s) => s.clearHint)

  const [displaySize, setDisplaySize] = useState(() =>
    typeof window !== 'undefined' ? getDisplaySize() : 128
  )
  const [pos, setPos] = useState(() =>
    typeof window !== 'undefined' ? getInitPos(getDisplaySize()) : { x: 120, y: 600 }
  )

  const fsmRef           = useRef(fsm)
  const posRef           = useRef(pos)
  const activeSectionRef = useRef(activeSection)
  const roamTimer        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animDoneTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const returnTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleHintTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hintDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clickCount       = useRef(0)
  const clickWindowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  fsmRef.current           = fsm
  posRef.current           = pos
  activeSectionRef.current = activeSection

  // viewport resize
  useEffect(() => {
    function onResize() {
      const newSize = getDisplaySize()
      setDisplaySize(newSize)
      setPos((p) => ({
        x: clamp(p.x, MARGIN, window.innerWidth - newSize - MARGIN),
        y: window.innerHeight - newSize - 32,
      }))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // roam tick
  const scheduleRoam = useCallback(() => {
    if (roamTimer.current) clearTimeout(roamTimer.current)
    const delay = ROAM_DELAY_MIN + Math.random() * (ROAM_DELAY_MAX - ROAM_DELAY_MIN)
    roamTimer.current = setTimeout(() => {
      dispatch({ type: 'ROAM_TICK' })
      scheduleRoam()
    }, delay)
  }, [dispatch])

  useEffect(() => {
    scheduleRoam()
    return () => { if (roamTimer.current) clearTimeout(roamTimer.current) }
  }, [scheduleRoam])

  // movement on ROAMING
  useEffect(() => {
    if (fsm.state !== 'ROAMING') return
    const roamMinX = Math.max(MARGIN, Math.round(window.innerWidth * 0.10))
    const roamMaxX = Math.min(
      window.innerWidth - displaySize - MARGIN,
      Math.round(window.innerWidth * 0.90 - displaySize)
    )
    const maxDist = Math.floor(window.innerWidth * 0.30)
    const dist = Math.min(
      fsm.speed === 'fast' ? 120 + Math.random() * 80 :
      fsm.speed === 'slow' ? 20  + Math.random() * 40 :
      50 + Math.random() * 80,
      maxDist
    )
    const targetX = clamp(
      posRef.current.x + (fsm.facingLeft ? -1 : 1) * dist,
      roamMinX, roamMaxX
    )
    setPos((p) => ({ ...p, x: targetX }))
  }, [fsm.state, fsm.facingLeft, fsm.speed, displaySize])

  // one-shot animations (JUMPING, SQUISH)
  useEffect(() => {
    if (fsm.state !== 'JUMPING' && fsm.state !== 'SQUISH') return
    if (animDoneTimer.current) clearTimeout(animDoneTimer.current)
    const anim = ANIMATIONS[fsm.state]
    const duration = (anim.frameCount / anim.fps) * 1000
    animDoneTimer.current = setTimeout(() => dispatch({ type: 'ANIM_DONE' }), duration)
    return () => { if (animDoneTimer.current) clearTimeout(animDoneTimer.current) }
  }, [fsm.state, dispatch])

  // LEAVING — slide off-screen, then slide back in at a random spot. Both
  // legs stay in the LEAVING state so they share its fixed, slow
  // moveDuration (1.6s) rather than snapping in at ROAMING's variable speed.
  useEffect(() => {
    if (fsm.state !== 'LEAVING') return
    const targetX = fsm.facingLeft ? -displaySize - 40 : window.innerWidth + 40
    setPos((p) => ({ ...p, x: targetX }))

    leaveTimer.current = setTimeout(() => {
      const roamMinX = Math.max(MARGIN, Math.round(window.innerWidth * 0.10))
      const roamMaxX = Math.min(
        window.innerWidth - displaySize - MARGIN,
        Math.round(window.innerWidth * 0.90 - displaySize)
      )
      const reentryX = roamMinX + Math.random() * (roamMaxX - roamMinX)
      setPos((p) => ({ ...p, x: reentryX }))

      returnTimer.current = setTimeout(() => {
        dispatch({ type: 'LEAVE_DONE' })
      }, LEAVE_DURATION)
    }, LEAVE_DURATION)

    return () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current)
      if (returnTimer.current) clearTimeout(returnTimer.current)
    }
  }, [fsm.state, fsm.facingLeft, displaySize, dispatch])

  // IntersectionObserver for section hints
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.3 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [setActiveSection])

  // clear hint when chat opens
  useEffect(() => {
    const chatOpen = ['TALKING', 'THINKING'].includes(fsm.state)
    if (chatOpen) {
      clearHint()
      if (hintDismissTimer.current) clearTimeout(hintDismissTimer.current)
    }
  }, [fsm.state, clearHint])

  // proactive idle hints
  const scheduleIdleHint = useCallback(() => {
    if (idleHintTimer.current) clearTimeout(idleHintTimer.current)
    idleHintTimer.current = setTimeout(() => {
      const state = fsmRef.current.state
      if (['TALKING', 'THINKING', 'LEAVING'].includes(state)) return
      setHint(pickHint(activeSectionRef.current))
      if (hintDismissTimer.current) clearTimeout(hintDismissTimer.current)
      hintDismissTimer.current = setTimeout(clearHint, HINT_AUTODISMISS)
    }, IDLE_HINT_DELAY)
  }, [setHint, clearHint])

  useEffect(() => {
    scheduleIdleHint()
    return () => {
      if (idleHintTimer.current) clearTimeout(idleHintTimer.current)
      if (hintDismissTimer.current) clearTimeout(hintDismissTimer.current)
    }
  }, [scheduleIdleHint])

  const dismissHint = useCallback(() => {
    clearHint()
    if (hintDismissTimer.current) clearTimeout(hintDismissTimer.current)
  }, [clearHint])

  // click handler — 350ms window for single/double click
  const handleClick = useCallback(() => {
    if (['LEAVING', 'THINKING'].includes(fsmRef.current.state)) return
    dismissHint()
    scheduleIdleHint()

    clickCount.current += 1
    if (clickWindowTimer.current) clearTimeout(clickWindowTimer.current)

    clickWindowTimer.current = setTimeout(() => {
      const count = clickCount.current
      clickCount.current = 0
      const state = fsmRef.current.state

      if (['JUMPING', 'SQUISH', 'LEAVING'].includes(state)) return

      if (count >= 2) {
        if (!['TALKING', 'THINKING'].includes(state)) {
          dispatch({ type: 'DOUBLE_CLICK' })
        }
      } else {
        if (state === 'TALKING') {
          dispatch({ type: 'CLOSE' })
        } else {
          dispatch({ type: 'CLICK' })
        }
      }
    }, CLICK_WINDOW)
  }, [dismissHint, scheduleIdleHint, dispatch])

  const handleClose = useCallback(() => {
    dispatch({ type: 'CLOSE' })
    scheduleIdleHint()
  }, [dispatch, scheduleIdleHint])

  // clicking anywhere outside the droid (and outside the overlay terminal)
  // closes the talk state so the droid resumes roaming as usual.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!['TALKING', 'THINKING'].includes(fsmRef.current.state)) return
      const target = e.target as Element
      if (target.closest?.('[aria-label="Echo"]')) return
      if (target.closest?.('#echo-overlay-root')) return
      dispatch({ type: 'CLOSE' })
      scheduleIdleHint()
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [dispatch, scheduleIdleHint])

  const moveDuration =
    fsm.state === 'LEAVING' ? 1.6 :
    fsm.state === 'ROAMING' ? SPEED_DURATION[fsm.speed] :
    0

  return {
    pos,
    displaySize,
    moveDuration,
    handleClick,
    handleClose,
    dismissHint,
  }
}
