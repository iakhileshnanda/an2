import { useEffect, useRef } from 'react'
import { ANIMATIONS, SPRITE_FRAME_W, SPRITE_FRAME_H, SPRITE_SHEET_COLS } from './types'
import type { BotState } from './types'

interface Props {
  state: BotState
  facingLeft: boolean
  displaySize?: number
}

export default function SpriteAnimator({ state, facingLeft, displaySize = 128 }: Props) {
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

        ctx.clearRect(0, 0, displaySize, displaySize)

        if (facingLeft) {
          ctx.save()
          ctx.translate(displaySize, 0)
          ctx.scale(-1, 1)
        }

        if (imgRef.current) {
          ctx.drawImage(
            imgRef.current,
            sx, sy, SPRITE_FRAME_W, SPRITE_FRAME_H,
            0, 0, displaySize, displaySize
          )
        }

        if (facingLeft) ctx.restore()
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [state, facingLeft, displaySize])

  const jumpDuration = `${ANIMATIONS.JUMPING.frameCount / ANIMATIONS.JUMPING.fps}s`
  const squishDuration = `${ANIMATIONS.SQUISH.frameCount / ANIMATIONS.SQUISH.fps}s`

  return (
    <>
      <style>{`
        @keyframes nanobotJump {
          0%   { transform: translateY(0); }
          30%  { transform: translateY(-24px); }
          60%  { transform: translateY(-40px); }
          80%  { transform: translateY(-12px); }
          100% { transform: translateY(0); }
        }
        @keyframes nanobotSquish {
          0%   { transform: scaleY(1) scaleX(1); }
          30%  { transform: scaleY(0.35) scaleX(1.4); }
          70%  { transform: scaleY(0.35) scaleX(1.4); }
          100% { transform: scaleY(1) scaleX(1); }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        width={displaySize}
        height={displaySize}
        style={{
          imageRendering: 'pixelated',
          display: 'block',
          transformOrigin: 'bottom center',
          animation:
            state === 'JUMPING' ? `nanobotJump ${jumpDuration} ease-in-out` :
            state === 'SQUISH'  ? `nanobotSquish ${squishDuration} ease-in-out` :
            'none',
        }}
      />
    </>
  )
}
