import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEchoStore } from '../store/echoStore'
import { useEcho } from '../core/useEcho'
import { useChat } from '../chat/useChat'
import SpriteAnimator from './SpriteAnimator'
import ChatBubble from '../chat/ChatBubble'

export default function Echo() {
  const fsm  = useEchoStore((s) => s.fsm)
  const hint = useEchoStore((s) => s.hint)

  const { pos, displaySize, moveDuration, handleClick, handleClose, dismissHint } = useEcho()
  const { intent, messages, isLoading, selectIntent, sendMessage, reset } = useChat()

  const chatVisible  = ['TALKING', 'THINKING'].includes(fsm.state)
  const [showIntro, setShowIntro] = useState(true)

  function onSpriteClick() {
    setShowIntro(false)
    handleClick()
  }

  function onClose() {
    reset()
    handleClose()
  }

  return (
    <motion.div
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
      {/* Chat bubble */}
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          marginBottom: 4,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9001,
        }}
      >
        <ChatBubble
          visible={chatVisible}
          intent={intent}
          messages={messages}
          isLoading={isLoading}
          onIntentSelect={selectIntent}
          onSend={sendMessage}
          onClose={onClose}
        />
      </div>

      {/* Intro label — floats above droid until first click */}
      <AnimatePresence>
        {showIntro && !chatVisible && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 6 }}
            animate={{
              opacity: 1,
              y: [0, -5, 0],
            }}
            transition={{
              opacity: { duration: 0.4 },
              y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
            }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.15 } }}
            onClick={onSpriteClick}
            style={{
              position: 'absolute',
              bottom: '100%',
              marginBottom: 6,
              left: '50%',
              transform: 'translateX(-50%) skewX(-7deg)',
              background: '#1B1716',
              border: '1.5px solid #EDEBDE',
              boxShadow: '2px 2px 0 rgba(27,23,22,0.35)',
              padding: '5px 16px 6px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              whiteSpace: 'nowrap',
              zIndex: 9002,
            }}
          >
            {/* Counter-skew the text so it reads straight */}
            <div style={{ transform: 'skewX(7deg)', textAlign: 'center' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                fontWeight: 700,
                color: '#EDEBDE',
                letterSpacing: '0.14em',
              }}>
                CLICK ME
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 7.5,
                color: 'rgba(237,235,222,0.42)',
                letterSpacing: '0.07em',
                marginTop: 2,
              }}>
                to know akhilesh
              </div>
            </div>
            {/* Downward pointer */}
            <div style={{
              position: 'absolute',
              bottom: -5,
              left: '50%',
              transform: 'translateX(-50%) skewX(7deg)',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #EDEBDE',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contextual hint — only after intro is gone */}
      <AnimatePresence>
        {hint && !chatVisible && !showIntro && (
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
