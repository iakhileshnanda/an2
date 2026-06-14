import type { BotState, UserRole } from './types'

export type FSMEvent =
  | { type: 'CLICK' }
  | { type: 'DOUBLE_CLICK' }
  | { type: 'ROLE_SELECTED'; role: UserRole }
  | { type: 'CONVERSATION_DONE' }
  | { type: 'LEAVE_DONE' }
  | { type: 'ROAM_TICK' }
  | { type: 'ANIM_DONE' }   // one-shot animations finished

export interface FSMContext {
  state: BotState
  role: UserRole | null
  turnCount: number
  maxTurns: number
  facingLeft: boolean
  speed: 'slow' | 'normal' | 'fast'
  prevState: BotState  // where to return after one-shot anims
}

export function createFSM(): FSMContext {
  return {
    state: 'ROAMING',
    role: null,
    turnCount: 0,
    maxTurns: 0,
    facingLeft: false,
    speed: 'normal',
    prevState: 'ROAMING',
  }
}

export function transition(ctx: FSMContext, event: FSMEvent): FSMContext {
  switch (ctx.state) {

    case 'ROAMING':
    case 'IDLE':
    case 'SLEEPING': {
      if (event.type === 'CLICK') {
        return { ...ctx, state: 'TALKING', role: null, turnCount: 0, prevState: ctx.state }
      }
      if (event.type === 'DOUBLE_CLICK') {
        return { ...ctx, state: 'JUMPING', prevState: ctx.state }
      }
      if (event.type === 'ROAM_TICK') {
        const { next, facing, speed } = roamNext(ctx.state)
        return { ...ctx, state: next, facingLeft: facing, speed, prevState: ctx.state }
      }
      return ctx
    }

    case 'JUMPING': {
      if (event.type === 'ANIM_DONE') {
        // after jump, maybe squish on landing
        const squish = Math.random() < 0.5
        if (squish) return { ...ctx, state: 'SQUISH' }
        return { ...ctx, state: ctx.prevState === 'SLEEPING' ? 'IDLE' : ctx.prevState }
      }
      return ctx
    }

    case 'SQUISH': {
      if (event.type === 'ANIM_DONE') {
        return { ...ctx, state: 'IDLE' }
      }
      return ctx
    }

    case 'TALKING': {
      if (event.type === 'ROLE_SELECTED') {
        if (event.role === 'none') {
          return { ...ctx, role: 'none', state: 'LEAVING' }
        }
        const maxTurns = event.role === 'recruiter' ? 6 : 3
        return { ...ctx, role: event.role, turnCount: 0, maxTurns }
      }
      if (event.type === 'CONVERSATION_DONE') {
        const next = ctx.turnCount + 1
        if (next >= ctx.maxTurns) {
          return { ...ctx, turnCount: next, state: 'LEAVING' }
        }
        return { ...ctx, turnCount: next }
      }
      return ctx
    }

    case 'LEAVING': {
      if (event.type === 'LEAVE_DONE') {
        return { ...ctx, state: 'ROAMING', role: null, turnCount: 0, maxTurns: 0 }
      }
      return ctx
    }

    default:
      return ctx
  }
}

function roamNext(current: BotState): { next: BotState; facing: boolean; speed: FSMContext['speed'] } {
  const roll = Math.random()
  const facing = Math.random() > 0.5

  if (current === 'SLEEPING') {
    return { next: 'IDLE', facing, speed: 'slow' }
  }

  // weighted: roam 50%, idle 20%, sleep 15%, jump 10%, squish 5%
  if (roll < 0.50) return { next: 'ROAMING', facing, speed: randomSpeed() }
  if (roll < 0.70) return { next: 'IDLE',    facing, speed: 'normal' }
  if (roll < 0.85) return { next: 'SLEEPING', facing, speed: 'slow' }
  if (roll < 0.95) return { next: 'JUMPING',  facing, speed: 'normal' }
  return { next: 'SQUISH', facing, speed: 'normal' }
}

function randomSpeed(): FSMContext['speed'] {
  const r = Math.random()
  if (r < 0.2) return 'slow'
  if (r < 0.8) return 'normal'
  return 'fast'
}
