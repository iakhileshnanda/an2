import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { UserRole } from './types'
import type { FSMContext } from './NanoBotFSM'

interface Props {
  fsm: FSMContext
  onRoleSelect: (role: UserRole) => void
  onNext: () => void
}

const VISITOR_LINES = [
  "Nice to meet you! I'm NanoBot — I help Akhilesh keep things running around here.",
  "He's a frontend lead and AI builder based in Bangalore. Built some cool stuff.",
  "Feel free to explore! Click around. I'll be roaming if you need me. 👋",
]

const RECRUITER_LINES = [
  "Oh, a recruiter! You came to the right place. Buckle up.",
  "Akhilesh has 5+ years building production frontends at scale. Angular, React, the works.",
  "He doesn't just write code — he ships AI-powered products. This whole site? Built by him.",
  "He built Maya, a multi-agent AI system, basically from scratch. That's not a side project, that's a statement.",
  "He's the kind of engineer who makes the team faster, not just the codebase bigger.",
  "Anyway — I have tasks Akhilesh assigned me. Go hire him already. See you! 🚀",
]

export default function ChatBubble({ fsm, onRoleSelect, onNext }: Props) {
  const [visitorStep, setVisitorStep] = useState(0)

  const visible = fsm.state === 'TALKING' || fsm.state === 'LEAVING'

  function handleNext() {
    if (fsm.role === 'visitor') {
      if (visitorStep < VISITOR_LINES.length - 1) {
        setVisitorStep(s => s + 1)
      }
    }
    onNext()
  }

  function handleRoleSelect(role: UserRole) {
    setVisitorStep(0)
    onRoleSelect(role)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="bubble"
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            bottom: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 260,
            background: '#0f0f0f',
            border: '1px solid #333',
            borderRadius: 8,
            padding: '14px 16px',
            zIndex: 100,
          }}
        >
          {/* tail */}
          <div style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #333',
          }} />

          {/* role selection */}
          {fsm.state === 'TALKING' && fsm.role === null && (
            <RoleSelect onSelect={handleRoleSelect} />
          )}

          {/* visitor flow */}
          {fsm.role === 'visitor' && fsm.state === 'TALKING' && (
            <ConvoLine
              line={VISITOR_LINES[Math.min(visitorStep, VISITOR_LINES.length - 1)]}
              turn={fsm.turnCount}
              max={fsm.maxTurns}
              onNext={handleNext}
            />
          )}

          {/* recruiter flow */}
          {fsm.role === 'recruiter' && fsm.state === 'TALKING' && (
            <ConvoLine
              line={RECRUITER_LINES[Math.min(fsm.turnCount, RECRUITER_LINES.length - 1)]}
              turn={fsm.turnCount}
              max={fsm.maxTurns}
              onNext={handleNext}
            />
          )}

          {/* leaving */}
          {fsm.state === 'LEAVING' && fsm.role !== 'none' && (
            <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>
              {fsm.role === 'recruiter'
                ? "I have work Akhilesh assigned me. Catch you later! 🚀"
                : "Alright, I'm back on patrol. See ya! 👋"}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function RoleSelect({ onSelect }: { onSelect: (r: UserRole) => void }) {
  return (
    <div>
      <p style={{ color: '#fff', fontSize: 13, margin: '0 0 12px', fontFamily: 'monospace' }}>
        Hey! Who are you?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(['visitor', 'recruiter', 'none'] as UserRole[]).map(role => (
          <button
            key={role}
            onClick={() => onSelect(role)}
            style={{
              background: 'transparent',
              border: '1px solid #444',
              color: role === 'recruiter' ? '#a3e635' : '#fff',
              padding: '6px 12px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 12,
              textTransform: 'capitalize',
              letterSpacing: '0.05em',
              borderRadius: 4,
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#888')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#444')}
          >
            {role === 'none' ? 'None / Just passing by' : role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}

function ConvoLine({
  line, turn, max, onNext,
}: {
  line: string
  turn: number
  max: number
  onNext: () => void
}) {
  const isLast = turn >= max - 1
  return (
    <div>
      <p style={{ color: '#fff', fontSize: 13, margin: '0 0 12px', fontFamily: 'monospace', lineHeight: 1.5 }}>
        {line}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#555', fontSize: 11, fontFamily: 'monospace' }}>
          {turn + 1} / {max}
        </span>
        {!isLast && (
          <button
            onClick={onNext}
            style={{
              background: 'transparent',
              border: '1px solid #444',
              color: '#fff',
              padding: '4px 10px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 11,
              borderRadius: 4,
            }}
          >
            next →
          </button>
        )}
      </div>
    </div>
  )
}
