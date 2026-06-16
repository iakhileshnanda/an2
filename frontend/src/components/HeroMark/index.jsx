import { useRef, useEffect, useCallback } from 'react'
import {
  motion,
  useScroll,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  animate,
} from 'framer-motion'
import styles from './HeroMark.module.css'

// Final resting position of the logo in the top-left corner
const LOGO_X = 52
const LOGO_Y = 48

function lerp(a, b, t) {
  return a + (b - a) * t
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

// easeInOutQuart — starts slow, accelerates, brakes to a precise stop
function ease(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

export default function HeroMark() {
  const markRef = useRef(null)
  // Stores calculated start/end positions after measurement
  const posRef = useRef(null)

  // Scroll-driven position + scale — imperative MotionValues so they react
  // to dynamically measured posRef (useTransform output range isn't reactive)
  const xMV = useMotionValue(0)
  const yMV = useMotionValue(0)
  const scrollScaleMV = useMotionValue(1)

  // Entry animation: scales from 8→1 on mount, independent of scroll
  const entryScaleMV = useMotionValue(8)
  const entryOpacityMV = useMotionValue(0)

  // Multiply entry + scroll scales so they compose cleanly
  const combinedScale = useTransform(
    [entryScaleMV, scrollScaleMV],
    ([e, s]) => e * s
  )

  const { scrollY } = useScroll()

  // Scroll range for the full transformation (0 → 70% of viewport height)
  const scrollEnd = typeof window !== 'undefined' ? window.innerHeight * 0.7 : 500

  // Tagline exits first — quickest to go
  const taglineOpacity = useTransform(scrollY, [0, scrollEnd * 0.22], [1, 0], { clamp: true })
  // Full name fades through the middle of the scroll
  const nameOpacity = useTransform(scrollY, [0, scrollEnd * 0.52], [1, 0], { clamp: true })
  // Monogram fades in overlapping the name fade-out (dissolve, not swap)
  const monogramOpacity = useTransform(
    scrollY,
    [scrollEnd * 0.28, scrollEnd * 0.72],
    [0, 1],
    { clamp: true }
  )

  // Measure the element's natural size and calculate start/end positions
  useEffect(() => {
    function measure() {
      const el = markRef.current
      if (!el) return

      const vw = window.innerWidth
      const vh = window.innerHeight

      // offsetWidth/offsetHeight return layout dimensions BEFORE CSS transforms
      // so they're correct regardless of current scale
      const W = el.offsetWidth
      const H = el.offsetHeight

      // Logo scale: we want ~22px visual height at the corner.
      // The first-line font is clamp(52px, 12vw, 85px).
      const fontSize = Math.max(52, Math.min(85, vw * 0.12))
      const targetLogoHeight = vw < 640 ? 26 : 36
      const logoScale = Math.max(0.20, targetLogoHeight / fontSize)

      // Logo position: (28, 32) on mobile, (52, 48) on desktop
      const logoX = vw < 640 ? 28 : LOGO_X
      const logoY = vw < 640 ? 32 : LOGO_Y

      // With transformOrigin: center (default):
      //   visual center = (x + W/2, y + H/2)
      //   start: visual center at viewport center → x = vw/2 - W/2, y = vh/2 - H/2
      //   end: visual top-left at (logoX, logoY)
      //     → visual center = (logoX + W*logoScale/2, logoY + H*logoScale/2)
      //     → x = logoX + W*logoScale/2 - W/2 = logoX - W*(1-logoScale)/2
      //     → y = logoY + H*logoScale/2 - H/2 = logoY - H*(1-logoScale)/2
      const startX = vw / 2 - W / 2
      const startY = vh / 2 - H / 2
      const endX = logoX - W * (1 - logoScale) / 2
      const endY = logoY - H * (1 - logoScale) / 2

      posRef.current = { startX, startY, endX, endY, logoScale }

      // Snap position to start if user hasn't scrolled yet
      if (scrollY.get() < 5) {
        xMV.set(startX)
        yMV.set(startY)
        scrollScaleMV.set(1)
      }
    }

    // Measure immediately so posRef is valid before any scroll fires.
    // The rAF below re-measures after fonts may have loaded (self-hosted
    // PastorOfMuppets is ready, but JetBrains Mono is now non-blocking).
    measure()

    const frameId = requestAnimationFrame(() => {
      measure()
      // Entry animation: scale 8→1, opacity 0→1
      animate(entryScaleMV, 1, { duration: 0.9, ease: [0.22, 1, 0.36, 1] })
      animate(entryOpacityMV, 1, { duration: 0.5, ease: 'easeOut', delay: 0.15 })
    })

    window.addEventListener('resize', measure)
    // Re-measure if fonts swap in after the initial rAF (non-blocking Google Fonts)
    document.fonts?.ready.then(measure)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', measure)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update position + scale on every scroll tick — useCallback so the reference is stable
  const onScroll = useCallback((latest) => {
    if (!posRef.current) return
    const { startX, startY, endX, endY, logoScale } = posRef.current
    const end = window.innerHeight * 0.7
    const progress = ease(clamp01(latest / end))

    xMV.set(lerp(startX, endX, progress))
    yMV.set(lerp(startY, endY, progress))
    scrollScaleMV.set(lerp(1, logoScale, progress))
  }, [xMV, yMV, scrollScaleMV])

  useMotionValueEvent(scrollY, 'change', onScroll)

  return (
    <div className={styles.root} aria-hidden="true">
      <motion.div
        ref={markRef}
        className={styles.mark}
        style={{
          x: xMV,
          y: yMV,
          scale: combinedScale,
          opacity: entryOpacityMV,
        }}
      >
        {/* ── Full name — exits as the user scrolls ── */}
        <motion.div className={styles.fullName} style={{ opacity: nameOpacity }}>
          <span className={styles.first}>
            Akhiles<span className={styles.mirror}>H</span>
          </span>
          <span className={styles.last}>
            Nand<span className={styles.mirror}>A</span>
          </span>
          <motion.span className={styles.tagline} style={{ opacity: taglineOpacity }}>
            Frontend Lead · AI Builder · Bangalore
          </motion.span>
        </motion.div>

        {/* ── AN monogram — arrives as the user scrolls ── */}
        <motion.div className={styles.monogram} style={{ opacity: monogramOpacity }}>
          <span className={styles.monA}>A</span>
          <span className={styles.monN}>N</span>
        </motion.div>
      </motion.div>
    </div>
  )
}
