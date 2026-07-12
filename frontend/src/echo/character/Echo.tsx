import { AnimatePresence, motion } from 'framer-motion'
import { useEchoStore } from '../store/echoStore'
import { useEcho } from '../core/useEcho'
import SpriteAnimator from './SpriteAnimator'

export default function Echo() {
  const fsm  = useEchoStore((s) => s.fsm)
  const hint = useEchoStore((s) => s.hint)

  const { pos, displaySize, moveDuration, handleClick, dismissHint } = useEcho()

  function onSpriteClick() {
    handleClick()
  }

  return (
    <motion.div
      // initial={false}: first paint snaps straight to the spawn position —
      // without it framer-motion animates from (0,0) and the droid visibly
      // flies in from the top-left corner on page load.
      initial={false}
      animate={{ x: pos.x, y: pos.y }}
      transition={
        moveDuration > 0 ? { duration: moveDuration, ease: 'linear' } : { duration: 0 }
      }
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: displaySize,
        zIndex: 9000,
        userSelect: 'none',
        willChange: 'transform',
      }}
    >
      {/* Contextual hint */}
      <AnimatePresence>
        {hint && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              marginBottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#EDEBDE',
              border: '2px solid #1B1716',
              boxShadow: '2px 2px 0 #1B1716',
              padding: '5px 9px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8,
              color: '#1B1716',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
            onClick={dismissHint}
          >
            {hint}
            <div style={{
              position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
              borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
              borderTop: '5px solid #1B1716',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sprite */}
      <div
        style={{ cursor: 'pointer' }}
        onClick={onSpriteClick}
        role="button"
        aria-label="Echo"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSpriteClick() }}
      >
        <SpriteAnimator
          state={fsm.state}
          facingLeft={fsm.facingLeft}
          displaySize={displaySize}
        />
      </div>
    </motion.div>
  )
}
