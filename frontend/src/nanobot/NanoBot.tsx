import { motion } from 'framer-motion'
import SpriteAnimator from './SpriteAnimator'
import ChatBubble from './ChatBubble'
import { useNanoBot } from './useNanoBot'

export default function NanoBot() {
  const { fsm, pos, displaySize, moveDuration, handleClick, handleRoleSelect, handleClose } = useNanoBot()

  const isMoving = fsm.state === 'ROAMING' || fsm.state === 'LEAVING'
  const isTalking = fsm.state === 'TALKING'

  return (
    <motion.div
      animate={{ x: pos.x, y: pos.y }}
      transition={
        isMoving
          ? { type: 'tween', duration: moveDuration, ease: 'easeInOut' }
          : { duration: 0 }
      }
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        cursor: fsm.state === 'LEAVING' ? 'default' : 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={handleClick}
      aria-label="NanoBot — click to chat"
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
    >
      <div style={{ position: 'relative' }}>
        <ChatBubble
          fsm={fsm}
          onRoleSelect={handleRoleSelect}
          onClose={handleClose}
          displaySize={displaySize}
        />
        {/* subtle glow ring when talking */}
        {isTalking && (
          <div style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            boxShadow: '0 0 14px 4px rgba(129, 1, 0, 0.35)',
            pointerEvents: 'none',
          }} />
        )}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <SpriteAnimator
            state={fsm.state}
            facingLeft={fsm.facingLeft}
            displaySize={displaySize}
          />
          {/* Cherry Red indicator dot — the droid's "eye" */}
          <div style={{
            position: 'absolute',
            top: Math.round(displaySize * 0.28),
            left: Math.round(displaySize * 0.58),
            width: Math.max(6, Math.round(displaySize * 0.07)),
            height: Math.max(6, Math.round(displaySize * 0.07)),
            borderRadius: '50%',
            background: '#810100',
            boxShadow: '0 0 6px 2px rgba(129,1,0,0.6)',
            pointerEvents: 'none',
          }} />
        </div>
        {/* ECHO name label */}
        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '0.22em',
          color: 'rgba(129, 1, 0, 0.75)',
          marginTop: 4,
          userSelect: 'none',
          pointerEvents: 'none',
          width: displaySize,
        }}>
          ECHO
        </div>
      </div>
    </motion.div>
  )
}
