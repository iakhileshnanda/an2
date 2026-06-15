export type BotState = 'IDLE' | 'ROAMING' | 'SLEEPING' | 'TALKING' | 'THINKING' | 'LEAVING' | 'JUMPING' | 'SQUISH'

export type UserRole = 'visitor' | 'recruiter' | 'admin' | 'none'

export interface AnimationDef {
  row: number
  frameCount: number
  fps: number
}

// Sprite sheet: 608x224, each frame 32x32 → 19 cols × 7 rows
export const ANIMATIONS: Record<BotState, AnimationDef> = {
  IDLE:     { row: 0, frameCount: 12, fps: 10 },
  ROAMING:  { row: 1, frameCount: 7,  fps: 10 },
  JUMPING:  { row: 2, frameCount: 8,  fps: 12 },
  SLEEPING: { row: 3, frameCount: 6,  fps: 6  },
  TALKING:  { row: 4, frameCount: 19, fps: 12 },
  THINKING: { row: 4, frameCount: 19, fps: 7  }, // same row as TALKING, slower = "processing" feel
  SQUISH:   { row: 5, frameCount: 8,  fps: 14 },
  LEAVING:  { row: 6, frameCount: 12, fps: 10 },
}

export const SPRITE_FRAME_W = 32
export const SPRITE_FRAME_H = 32
export const SPRITE_SHEET_COLS = 19
