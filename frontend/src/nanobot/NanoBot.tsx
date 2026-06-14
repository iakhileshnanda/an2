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
            boxShadow: '0 0 12px 3px rgba(163, 230, 53, 0.15)',
            pointerEvents: 'none',
          }} />
        )}
        <SpriteAnimator
          state={fsm.state}
          facingLeft={fsm.facingLeft}
          displaySize={displaySize}
        />
      </div>
    </motion.div>
  )
}
