import { AnimatePresence, motion } from 'framer-motion'
import SpriteAnimator from './SpriteAnimator'
import EchoBubble from './EchoBubble'
import { useNanoBot } from './useNanoBot'

export default function NanoBot() {
  const {
    fsm, pos, displaySize, moveDuration,
    handleClick, handleRoleSelect, handleClose,
    handleMessageSent, handleReplyReceived,
    hint, dismissHint,
  } = useNanoBot()

  const isMoving = fsm.state === 'ROAMING' || fsm.state === 'LEAVING'
  const isChatOpen = fsm.state === 'TALKING' || fsm.state === 'THINKING'

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
      aria-label="Echo — click to chat"
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
    >
      <div style={{ position: 'relative' }}>
        <EchoBubble
          fsm={fsm}
          onRoleSelect={handleRoleSelect}
          onClose={handleClose}
          onMessageSent={handleMessageSent}
          onReplyReceived={handleReplyReceived}
          displaySize={displaySize}
        />

        {/* proactive hint tooltip */}
        <AnimatePresence>
          {hint && !isChatOpen && (
            <motion.div
              key="hint"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              onClick={e => { e.stopPropagation(); dismissHint() }}
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 10px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(27,23,22,0.9)',
                color: '#EDEBDE',
                fontFamily: 'monospace',
                fontSize: 11,
                padding: '5px 10px',
                borderRadius: 5,
                whiteSpace: 'nowrap',
                pointerEvents: 'all',
                cursor: 'pointer',
                border: '1px solid rgba(129,1,0,0.4)',
                letterSpacing: '0.03em',
              }}
            >
              {hint}
              <div style={{
                position: 'absolute',
                bottom: -5,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid rgba(27,23,22,0.9)',
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <SpriteAnimator
            state={fsm.state}
            facingLeft={fsm.facingLeft}
            displaySize={displaySize}
          />
          {/* Cherry Red indicator dot */}
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
