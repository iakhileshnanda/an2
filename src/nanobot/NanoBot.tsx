import { motion } from 'framer-motion'
import SpriteAnimator from './SpriteAnimator'
import ChatBubble from './ChatBubble'
import { useNanoBot } from './useNanoBot'

export default function NanoBot() {
  const { fsm, pos, handleClick, handleRoleSelect, handleConversationNext } = useNanoBot()

  const isMoving = fsm.state === 'ROAMING' || fsm.state === 'LEAVING'

  return (
    <motion.div
      animate={{ x: pos.x, y: pos.y }}
      transition={
        isMoving
          ? { type: 'tween', duration: fsm.state === 'LEAVING' ? 1.6 : 2.2, ease: 'easeInOut' }
          : { duration: 0 }
      }
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        cursor: fsm.state !== 'LEAVING' ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={handleClick}
      title="Click to talk"
    >
      <div style={{ position: 'relative' }}>
        <ChatBubble
          fsm={fsm}
          onRoleSelect={handleRoleSelect}
          onNext={handleConversationNext}
        />
        <SpriteAnimator state={fsm.state} facingLeft={fsm.facingLeft} />
      </div>
    </motion.div>
  )
}
