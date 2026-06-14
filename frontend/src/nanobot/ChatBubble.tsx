import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { UserRole } from './types'
import type { FSMContext } from './NanoBotFSM'
import { getMockResponse, validateAdminPassword } from '../services/mockResponses'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  fsm: FSMContext
  onRoleSelect: (role: UserRole) => void
  onClose: () => void
  displaySize: number
}

const BUBBLE_WIDTH = 272

const ROLE_INTROS: Record<Exclude<UserRole, 'none'>, string> = {
  visitor: "Hey! I'm NanoBot. Ask me anything about Akhilesh or just explore.",
  recruiter: "Recruiter mode. Good call. What do you want to know?",
  admin: "Admin access required.",
}

export default function ChatBubble({ fsm, onRoleSelect, onClose, displaySize }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminInput, setAdminInput] = useState('')
  const [adminError, setAdminError] = useState(false)
  const [adminDone, setAdminDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const visible = fsm.state === 'TALKING' || fsm.state === 'LEAVING'
  const isLeaving = fsm.state === 'LEAVING'

  // reset internal state when role is re-selected
  useEffect(() => {
    if (fsm.role === null) {
      setMessages([])
      setInput('')
      setAdminInput('')
      setAdminError(false)
      setAdminDone(false)
    }
  }, [fsm.role])

  // seed the intro message when role is first selected
  useEffect(() => {
    if (fsm.role && fsm.role !== 'none' && messages.length === 0) {
      setMessages([{ role: 'assistant', content: ROLE_INTROS[fsm.role] }])
      if (fsm.role !== 'admin') {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }, [fsm.role])

  // auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleSend() {
    const text = input.trim()
    if (!text || loading || !fsm.role || fsm.role === 'admin') return

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    setTimeout(() => {
      const reply = getMockResponse(fsm.role as 'visitor' | 'recruiter', text)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setLoading(false)
    }, 350 + Math.random() * 250)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleAdminSubmit() {
    if (validateAdminPassword(adminInput)) {
      setAdminDone(true)
      setAdminError(false)
      setMessages([{ role: 'assistant', content: 'Admin authenticated.' }])
    } else {
      setAdminError(true)
      setAdminInput('')
    }
  }

  function handleAdminKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdminSubmit()
  }

  // bubble positioning: above the sprite, centered
  const bubbleLeft = displaySize / 2

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="bubble"
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: isLeaving ? 0 : 1, y: isLeaving ? 8 : 0, scale: isLeaving ? 0.95 : 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'absolute',
            bottom: `calc(100% + 10px)`,
            left: bubbleLeft,
            transform: 'translateX(-50%)',
            width: BUBBLE_WIDTH,
            maxWidth: `calc(100vw - 24px)`,
            background: '#0a0a0a',
            border: '1px solid #2a2a2a',
            borderRadius: 10,
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            fontFamily: 'monospace',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* bubble tail */}
          <div style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '8px solid #2a2a2a',
          }} />

          {/* header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px 8px',
            borderBottom: fsm.role ? '1px solid #1a1a1a' : 'none',
          }}>
            <span style={{ color: '#555', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {fsm.role ? `${fsm.role} mode` : 'nanobot'}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#444',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                padding: '2px 4px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#aaa')}
              onMouseLeave={e => (e.currentTarget.style.color = '#444')}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* role selection */}
          {fsm.state === 'TALKING' && fsm.role === null && (
            <RoleSelect onSelect={onRoleSelect} />
          )}

          {/* chat area (visitor / recruiter) */}
          {fsm.role && fsm.role !== 'none' && fsm.role !== 'admin' && (
            <>
              <MessageList messages={messages} loading={loading} messagesEndRef={messagesEndRef} />
              <ChatInput
                value={input}
                inputRef={inputRef}
                onChange={setInput}
                onKeyDown={handleKeyDown}
                onSend={handleSend}
                disabled={loading}
              />
            </>
          )}

          {/* admin flow */}
          {fsm.role === 'admin' && !adminDone && (
            <AdminGate
              value={adminInput}
              onChange={setAdminInput}
              onSubmit={handleAdminSubmit}
              onKeyDown={handleAdminKeyDown}
              error={adminError}
            />
          )}

          {/* admin authenticated */}
          {fsm.role === 'admin' && adminDone && (
            <div style={{ padding: '14px 16px' }}>
              <p style={{ color: '#a3e635', fontSize: 13, margin: 0 }}>Admin authenticated.</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function RoleSelect({ onSelect }: { onSelect: (r: UserRole) => void }) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <p style={{ color: '#ccc', fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>
        Hey! Who are you?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { role: 'visitor' as UserRole, label: 'Visitor', sub: 'just exploring' },
          { role: 'recruiter' as UserRole, label: 'Recruiter', sub: 'looking to hire', highlight: true },
          { role: 'admin' as UserRole, label: 'Admin', sub: 'restricted access' },
          { role: 'none' as UserRole, label: 'None', sub: 'just passing by' },
        ].map(({ role, label, sub, highlight }) => (
          <button
            key={role}
            onClick={() => onSelect(role)}
            style={{
              background: 'transparent',
              border: `1px solid ${highlight ? '#a3e635' : '#333'}`,
              borderRadius: 6,
              color: highlight ? '#a3e635' : '#ccc',
              padding: '8px 12px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 12,
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = highlight ? '#c4f466' : '#666'
              e.currentTarget.style.background = '#111'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = highlight ? '#a3e635' : '#333'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <span style={{ letterSpacing: '0.05em' }}>{label}</span>
            <span style={{ color: '#444', fontSize: 10 }}>{sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageList({
  messages,
  loading,
  messagesEndRef,
}: {
  messages: Message[]
  loading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement>
}) {
  return (
    <div style={{
      maxHeight: 220,
      overflowY: 'auto',
      padding: '10px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      scrollbarWidth: 'none',
    }}>
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}
        >
          <div style={{
            maxWidth: '85%',
            background: msg.role === 'user' ? '#1a1a1a' : 'transparent',
            border: msg.role === 'user' ? '1px solid #2a2a2a' : 'none',
            borderRadius: 6,
            padding: msg.role === 'user' ? '6px 10px' : '0',
            fontSize: 12,
            lineHeight: 1.6,
            color: msg.role === 'user' ? '#bbb' : '#ccc',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {msg.content}
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ display: 'flex', gap: 4, paddingLeft: 2 }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#555',
                display: 'inline-block',
                animation: `nanobotDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      )}
      <div ref={messagesEndRef} />
      <style>{`
        @keyframes nanobotDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

function ChatInput({
  value,
  inputRef,
  onChange,
  onKeyDown,
  onSend,
  disabled,
}: {
  value: string
  inputRef: React.RefObject<HTMLInputElement>
  onChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onSend: () => void
  disabled: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '8px 10px 10px',
      borderTop: '1px solid #1a1a1a',
    }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask anything..."
        disabled={disabled}
        style={{
          flex: 1,
          background: '#111',
          border: '1px solid #2a2a2a',
          borderRadius: 5,
          color: '#ccc',
          fontFamily: 'monospace',
          fontSize: 12,
          padding: '7px 10px',
          outline: 'none',
          minWidth: 0,
        }}
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        style={{
          background: value.trim() && !disabled ? '#a3e635' : '#1a1a1a',
          border: 'none',
          borderRadius: 5,
          color: value.trim() && !disabled ? '#000' : '#444',
          cursor: value.trim() && !disabled ? 'pointer' : 'default',
          fontFamily: 'monospace',
          fontSize: 12,
          padding: '7px 12px',
          flexShrink: 0,
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        →
      </button>
    </div>
  )
}

function AdminGate({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  error,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  error: boolean
}) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <p style={{ color: '#888', fontSize: 12, margin: '0 0 10px' }}>
        Enter admin password:
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="password"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          placeholder="••••••••"
          style={{
            flex: 1,
            background: '#111',
            border: `1px solid ${error ? '#ef4444' : '#2a2a2a'}`,
            borderRadius: 5,
            color: '#ccc',
            fontFamily: 'monospace',
            fontSize: 12,
            padding: '7px 10px',
            outline: 'none',
            minWidth: 0,
          }}
        />
        <button
          onClick={onSubmit}
          style={{
            background: '#a3e635',
            border: 'none',
            borderRadius: 5,
            color: '#000',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: 12,
            padding: '7px 12px',
            flexShrink: 0,
          }}
        >
          →
        </button>
      </div>
      {error && (
        <p style={{ color: '#ef4444', fontSize: 11, margin: '6px 0 0' }}>Access denied.</p>
      )}
    </div>
  )
}
