import { useEffect, useRef } from 'react'
import { ANIMATIONS, SPRITE_FRAME_W, SPRITE_FRAME_H, SPRITE_SHEET_COLS, DISPLAY_SCALE } from './types'
import type { BotState } from './types'

interface Props {
  state: BotState
  facingLeft: boolean
}

const DISPLAY_W = SPRITE_FRAME_W * DISPLAY_SCALE
const DISPLAY_H = SPRITE_FRAME_H * DISPLAY_SCALE

export default function SpriteAnimator({ state, facingLeft }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    const img = new Image()
    img.src = '/droid_00.png'
    img.onload = () => { imgRef.current = img }
  }, [])

  useEffect(() => {
    frameRef.current = 0
  }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    const anim = ANIMATIONS[state]
    const interval = 1000 / anim.fps

    function draw(now: number) {
      if (!ctx || !canvas) return
      if (now - lastTimeRef.current >= interval) {
        lastTimeRef.current = now
        frameRef.current = (frameRef.current + 1) % anim.frameCount

        const col = frameRef.current % SPRITE_SHEET_COLS
        const sx = col * SPRITE_FRAME_W
        const sy = anim.row * SPRITE_FRAME_H

        ctx.clearRect(0, 0, DISPLAY_W, DISPLAY_H)

        if (facingLeft) {
          ctx.save()
          ctx.translate(DISPLAY_W, 0)
          ctx.scale(-1, 1)
        }

        if (imgRef.current) {
          ctx.drawImage(
            imgRef.current,
            sx, sy, SPRITE_FRAME_W, SPRITE_FRAME_H,
            0, 0, DISPLAY_W, DISPLAY_H
          )
        }

        if (facingLeft) ctx.restore()
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [state, facingLeft])

  // vertical bounce offset for JUMPING state
  const jumpStyle = state === 'JUMPING'
    ? { animation: `nanobotJump ${ANIMATIONS.JUMPING.frameCount / ANIMATIONS.JUMPING.fps}s ease-in-out` }
    : {}

  return (
    <>
      <style>{`
        @keyframes nanobotJump {
          0%   { transform: translateY(0); }
          30%  { transform: translateY(-32px); }
          60%  { transform: translateY(-48px); }
          80%  { transform: translateY(-20px); }
          100% { transform: translateY(0); }
        }
        @keyframes nanobotSquish {
          0%   { transform: scaleY(1); }
          30%  { transform: scaleY(0.3) scaleX(1.4); }
          70%  { transform: scaleY(0.3) scaleX(1.4); }
          100% { transform: scaleY(1); }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        width={DISPLAY_W}
        height={DISPLAY_H}
        style={{
          imageRendering: 'pixelated',
          display: 'block',
          transformOrigin: 'bottom center',
          animation: state === 'JUMPING'
            ? `nanobotJump ${ANIMATIONS.JUMPING.frameCount / ANIMATIONS.JUMPING.fps}s ease-in-out`
            : state === 'SQUISH'
            ? `nanobotSquish ${ANIMATIONS.SQUISH.frameCount / ANIMATIONS.SQUISH.fps}s ease-in-out`
            : 'none',
          ...jumpStyle,
        }}
      />
    </>
  )
}
