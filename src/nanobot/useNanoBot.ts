import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { createFSM, transition } from './NanoBotFSM'
import type { FSMContext, FSMEvent } from './NanoBotFSM'
import type { UserRole } from './types'
import { ANIMATIONS } from './types'

const DISPLAY_SIZE = 128
const MARGIN = 24

const SPEED_DURATION: Record<FSMContext['speed'], number> = {
  slow: 3.5,
  normal: 2.0,
  fast: 0.9,
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function fsmReducer(state: FSMContext, event: FSMEvent): FSMContext {
  return transition(state, event)
}

export function useNanoBot() {
  const [fsm, dispatch] = useReducer(fsmReducer, undefined, createFSM)
  const [pos, setPos] = useState({ x: 120, y: window.innerHeight - DISPLAY_SIZE - MARGIN })
  const posRef = useRef(pos)
  const fsmRef = useRef(fsm)
  const roamTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animDoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastClickTime = useRef(0)

  posRef.current = pos
  fsmRef.current = fsm

  // ── roam tick ──────────────────────────────────────────────────
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

  // ── move when ROAMING ──────────────────────────────────────────
  useEffect(() => {
    if (fsm.state !== 'ROAMING') return
    const maxX = window.innerWidth - DISPLAY_SIZE - MARGIN
    const dist = fsm.speed === 'fast' ? 180 + Math.random() * 120
      : fsm.speed === 'slow' ? 20 + Math.random() * 40
      : 60 + Math.random() * 100
    const targetX = clamp(
      posRef.current.x + (fsm.facingLeft ? -1 : 1) * dist,
      MARGIN,
      maxX
    )
    setPos(p => ({ ...p, x: targetX }))
  }, [fsm.state, fsm.facingLeft, fsm.speed])

  // ── one-shot animations: JUMPING & SQUISH ─────────────────────
  useEffect(() => {
    if (fsm.state !== 'JUMPING' && fsm.state !== 'SQUISH') return
    if (animDoneTimer.current) clearTimeout(animDoneTimer.current)
    const anim = ANIMATIONS[fsm.state]
    const duration = (anim.frameCount / anim.fps) * 1000
    animDoneTimer.current = setTimeout(() => {
      dispatch({ type: 'ANIM_DONE' })
    }, duration)
    return () => { if (animDoneTimer.current) clearTimeout(animDoneTimer.current) }
  }, [fsm.state])

  // ── LEAVING: slide off then reset ─────────────────────────────
  useEffect(() => {
    if (fsm.state !== 'LEAVING') return
    const targetX = fsm.facingLeft ? -DISPLAY_SIZE - 40 : window.innerWidth + 40
    setPos(p => ({ ...p, x: targetX }))
    leaveTimer.current = setTimeout(() => {
      dispatch({ type: 'LEAVE_DONE' })
      setPos({ x: 120, y: window.innerHeight - DISPLAY_SIZE - MARGIN })
    }, 1800)
    return () => { if (leaveTimer.current) clearTimeout(leaveTimer.current) }
  }, [fsm.state, fsm.facingLeft])

  // ── click / double-click ───────────────────────────────────────
  const handleClick = useCallback(() => {
    if (fsmRef.current.state === 'LEAVING') return
    const now = Date.now()
    const gap = now - lastClickTime.current
    lastClickTime.current = now

    if (gap < 300) {
      // double-click → jump (only when not already in conversation)
      if (
        fsmRef.current.state !== 'TALKING' &&
        fsmRef.current.state !== 'JUMPING' &&
        fsmRef.current.state !== 'SQUISH'
      ) {
        dispatch({ type: 'DOUBLE_CLICK' })
      }
      return
    }

    // single click — fire after short delay to avoid eating double-clicks
    setTimeout(() => {
      if (Date.now() - lastClickTime.current >= 280) {
        if (
          fsmRef.current.state !== 'JUMPING' &&
          fsmRef.current.state !== 'SQUISH' &&
          fsmRef.current.state !== 'LEAVING'
        ) {
          dispatch({ type: 'CLICK' })
        }
      }
    }, 300)
  }, [])

  const handleRoleSelect = useCallback((role: UserRole) => {
    dispatch({ type: 'ROLE_SELECTED', role })
  }, [])

  const handleConversationNext = useCallback(() => {
    dispatch({ type: 'CONVERSATION_DONE' })
  }, [])

  // ── movement duration based on speed ─────────────────────────
  const moveDuration =
    fsm.state === 'LEAVING' ? 1.6 :
    fsm.state === 'ROAMING' ? SPEED_DURATION[fsm.speed] :
    0

  return {
    fsm,
    pos,
    moveDuration,
    handleClick,
    handleRoleSelect,
    handleConversationNext,
  }
}
