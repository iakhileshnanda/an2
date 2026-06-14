import { motion } from 'framer-motion'
import SpriteAnimator from './nanobot/SpriteAnimator'
import ChatBubble from './nanobot/ChatBubble'
import DebugPanel from './DebugPanel'
import { useNanoBot } from './nanobot/useNanoBot'

type BotHook = ReturnType<typeof useNanoBot>

function NanoBotWithHook({ bot }: { bot: BotHook }) {
  const { fsm, pos, moveDuration, handleClick, handleRoleSelect, handleConversationNext } = bot
  const isMoving = fsm.state === 'ROAMING' || fsm.state === 'LEAVING'

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
        cursor: fsm.state !== 'LEAVING' ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={handleClick}
      title="Click · Double-click to jump"
    >
      <div style={{ position: 'relative' }}>
        <ChatBubble fsm={fsm} onRoleSelect={handleRoleSelect} onNext={handleConversationNext} />
        <SpriteAnimator state={fsm.state} facingLeft={fsm.facingLeft} />
      </div>
    </motion.div>
  )
}

function Inner() {
  const bot = useNanoBot()

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        fontFamily: 'monospace',
      }}>
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
          NanoBot Playground
        </h1>
        <p style={{ color: '#555', fontSize: 14, marginTop: 12, letterSpacing: '0.04em' }}>
          Testing sprite animation and roaming behavior.
        </p>
        <p style={{ color: '#333', fontSize: 12, marginTop: 48, letterSpacing: '0.06em' }}>
          Click to talk · Double-click to jump
        </p>
      </div>

      <NanoBotWithHook bot={bot} />
      <DebugPanel fsm={bot.fsm} pos={bot.pos} />
    </>
  )
}

export default function App() {
  return <Inner />
}
