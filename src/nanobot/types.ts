export type BotState = 'IDLE' | 'ROAMING' | 'SLEEPING' | 'TALKING' | 'LEAVING' | 'JUMPING' | 'SQUISH'

export type UserRole = 'visitor' | 'recruiter' | 'none'

export interface AnimationDef {
  row: number
  frameCount: number
  fps: number
}

// Sprite sheet: 608x224, each frame 32x32 → 19 cols × 7 rows
//   Row 0 → 12 frames  IDLE    — standing, breathing
//   Row 1 → 7  frames  ROAMING — walk cycle
//   Row 2 → 8  frames  JUMPING — body bobs up/down, eye flickers
//   Row 3 → 6  frames  SLEEPING— fewest frames, slowest
//   Row 4 → 19 frames  TALKING — long expressive action
//   Row 5 → 8  frames  SQUISH  — flattened, only base/feet visible
//   Row 6 → 12 frames  LEAVING — walk off screen
export const ANIMATIONS: Record<BotState, AnimationDef> = {
  IDLE:    { row: 0, frameCount: 12, fps: 10 },
  ROAMING: { row: 1, frameCount: 7,  fps: 10 },
  JUMPING: { row: 2, frameCount: 8,  fps: 12 },
  SLEEPING:{ row: 3, frameCount: 6,  fps: 6  },
  TALKING: { row: 4, frameCount: 19, fps: 12 },
  SQUISH:  { row: 5, frameCount: 8,  fps: 14 },
  LEAVING: { row: 6, frameCount: 12, fps: 10 },
}

export const SPRITE_FRAME_W = 32
export const SPRITE_FRAME_H = 32
export const SPRITE_SHEET_COLS = 19
export const DISPLAY_SCALE = 4  // render at 128x128
