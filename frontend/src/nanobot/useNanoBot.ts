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
  // Start near the right side, bottom of screen
  const x = Math.round(window.innerWidth * 0.72 - displaySize / 2)
  return {
    x: clamp(x, MARGIN, window.innerWidth - displaySize - MARGIN),
    y: window.innerHeight - displaySize - MARGIN,
  }
}

function fsmReducer(state: FSMContext, event: FSMEvent): FSMContext {
  return transition(state, event)
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

  const posRef = useRef(pos)
  const fsmRef = useRef(fsm)
  const roamTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animDoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastClickTime = useRef(0)

  posRef.current = pos
  fsmRef.current = fsm

  // handle viewport resize
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

  // movement when ROAMING — constrained to center 60% of viewport so Echo stays off corners
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

  // one-shot: JUMPING & SQUISH
  useEffect(() => {
    if (fsm.state !== 'JUMPING' && fsm.state !== 'SQUISH') return
    if (animDoneTimer.current) clearTimeout(animDoneTimer.current)
    const anim = ANIMATIONS[fsm.state]
    const duration = (anim.frameCount / anim.fps) * 1000
    animDoneTimer.current = setTimeout(() => dispatch({ type: 'ANIM_DONE' }), duration)
    return () => { if (animDoneTimer.current) clearTimeout(animDoneTimer.current) }
  }, [fsm.state])

  // LEAVING: slide off then reset
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

  // click / double-click
  const handleClick = useCallback(() => {
    if (fsmRef.current.state === 'LEAVING') return
    const now = Date.now()
    const gap = now - lastClickTime.current
    lastClickTime.current = now

    if (gap < 300) {
      if (
        fsmRef.current.state !== 'TALKING' &&
        fsmRef.current.state !== 'JUMPING' &&
        fsmRef.current.state !== 'SQUISH'
      ) {
        dispatch({ type: 'DOUBLE_CLICK' })
      }
      return
    }

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

  const handleClose = useCallback(() => {
    dispatch({ type: 'CLOSE' })
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
  }
}
