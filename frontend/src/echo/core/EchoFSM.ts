import type { BotState } from './types'

export type FSMEvent =
  | { type: 'CLICK' }
  | { type: 'DOUBLE_CLICK' }
  | { type: 'MESSAGE_SENT' }
  | { type: 'REPLY_RECEIVED' }
  | { type: 'CLOSE' }
  | { type: 'LEAVE_DONE' }
  | { type: 'ROAM_TICK' }
  | { type: 'ANIM_DONE' }

export interface FSMContext {
  state: BotState
  facingLeft: boolean
  speed: 'slow' | 'normal' | 'fast'
  prevState: BotState
  jumpReason: 'click' | 'roam'
}

export function createFSM(): FSMContext {
  return {
    state: 'ROAMING',
    facingLeft: false,
    speed: 'normal',
    prevState: 'ROAMING',
    jumpReason: 'roam',
  }
}

export function transition(ctx: FSMContext, event: FSMEvent): FSMContext {
  switch (ctx.state) {

    case 'ROAMING':
    case 'IDLE':
    case 'SLEEPING': {
      if (event.type === 'CLICK') {
        return { ...ctx, state: 'TALKING', prevState: ctx.state }
      }
      if (event.type === 'DOUBLE_CLICK') {
        return { ...ctx, state: 'JUMPING', prevState: ctx.state, jumpReason: 'click' }
      }
      if (event.type === 'ROAM_TICK') {
        const { next, facing, speed } = roamNext(ctx.state)
        return { ...ctx, state: next, facingLeft: facing, speed, prevState: ctx.state }
      }
      return ctx
    }

    case 'JUMPING': {
      if (event.type === 'ANIM_DONE') {
        if (ctx.jumpReason === 'click') {
          return { ...ctx, state: 'TALKING', jumpReason: 'roam' }
        }
        const squish = Math.random() < 0.5
        if (squish) return { ...ctx, state: 'SQUISH' }
        return { ...ctx, state: ctx.prevState === 'SLEEPING' ? 'IDLE' : ctx.prevState }
      }
      return ctx
    }

    case 'SQUISH': {
      if (event.type === 'ANIM_DONE') return { ...ctx, state: 'IDLE' }
      return ctx
    }

    case 'TALKING': {
      if (event.type === 'MESSAGE_SENT') return { ...ctx, state: 'THINKING' }
      if (event.type === 'CLOSE') return { ...ctx, state: 'LEAVING' }
      return ctx
    }

    case 'THINKING': {
      if (event.type === 'REPLY_RECEIVED') return { ...ctx, state: 'TALKING' }
      if (event.type === 'CLOSE') return { ...ctx, state: 'LEAVING' }
      return ctx
    }

    case 'LEAVING': {
      if (event.type === 'LEAVE_DONE') return { ...ctx, state: 'ROAMING' }
      return ctx
    }

    default:
      return ctx
  }
}

// Calm distribution: mostly walk or stand, occasionally doze. Jump/squish are
// rare punctuation (~1 in 17 ticks — a few minutes apart at the roam cadence),
// not a constant tic.
function roamNext(current: BotState): { next: BotState; facing: boolean; speed: FSMContext['speed'] } {
  const roll = Math.random()
  const facing = Math.random() > 0.5
  if (current === 'SLEEPING') return { next: 'IDLE', facing, speed: 'slow' }
  if (roll < 0.45) return { next: 'ROAMING',  facing, speed: randomSpeed() }
  if (roll < 0.80) return { next: 'IDLE',     facing, speed: 'normal' }
  if (roll < 0.94) return { next: 'SLEEPING', facing, speed: 'slow' }
  if (roll < 0.98) return { next: 'JUMPING',  facing, speed: 'normal' }
  return { next: 'SQUISH', facing, speed: 'normal' }
}

function randomSpeed(): FSMContext['speed'] {
  const r = Math.random()
  if (r < 0.2) return 'slow'
  if (r < 0.8) return 'normal'
  return 'fast'
}
