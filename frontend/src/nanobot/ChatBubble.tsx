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

// Palette — light Cotton base
const C = {
  bg:       '#EDEBDE',              // Cotton
  bgInput:  'rgba(27,23,22,0.05)', // Noir subtle for inputs
  bgMsg:    'rgba(27,23,22,0.06)', // Noir subtle for user messages
  border:   'rgba(27,23,22,0.15)',
  borderDim:'rgba(27,23,22,0.08)',
  text:     '#1B1716',             // Noir Black
  textMid:  'rgba(27,23,22,0.6)',
  textDim:  'rgba(27,23,22,0.38)',
  textGhost:'rgba(27,23,22,0.22)',
  cherry:   '#810100',             // Cherry Red
  cherryMid:'rgba(129,1,0,0.55)',
  error:    '#810100',
}

const ROLE_INTROS: Record<Exclude<UserRole, 'none'>, string> = {
  visitor: "Hey! I'm Echo. Ask me anything about Akhilesh or just explore.",
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

  useEffect(() => {
    if (fsm.role === null) {
      setMessages([])
      setInput('')
      setAdminInput('')
      setAdminError(false)
      setAdminDone(false)
    }
  }, [fsm.role])

  useEffect(() => {
    if (fsm.role && fsm.role !== 'none' && messages.length === 0) {
      setMessages([{ role: 'assistant', content: ROLE_INTROS[fsm.role] }])
      if (fsm.role !== 'admin') {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }, [fsm.role])

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
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
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
            borderTop: `8px solid ${C.border}`,
          }} />

          {/* header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px 8px',
            borderBottom: fsm.role ? `1px solid ${C.borderDim}` : 'none',
          }}>
            <span style={{ color: C.textGhost, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {fsm.role ? `${fsm.role} mode` : 'echo'}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: C.textGhost,
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                padding: '2px 4px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = C.textMid)}
              onMouseLeave={e => (e.currentTarget.style.color = C.textGhost)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* role selection */}
          {fsm.state === 'TALKING' && fsm.role === null && (
            <RoleSelect onSelect={onRoleSelect} />
          )}

          {/* chat area */}
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

          {fsm.role === 'admin' && adminDone && (
            <div style={{ padding: '14px 16px' }}>
              <p style={{ color: C.cherry, fontSize: 13, margin: 0 }}>Admin authenticated.</p>
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
      <p style={{ color: C.text, fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>
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
              border: `1px solid ${highlight ? C.cherry : C.borderDim}`,
              borderRadius: 6,
              color: highlight ? C.text : C.textMid,
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
              e.currentTarget.style.borderColor = highlight ? '#a01010' : C.textGhost
              e.currentTarget.style.background = highlight ? 'rgba(129,1,0,0.12)' : 'rgba(237,235,190,0.04)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = highlight ? C.cherry : C.borderDim
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <span style={{ letterSpacing: '0.05em' }}>{label}</span>
            <span style={{ color: C.textGhost, fontSize: 10 }}>{sub}</span>
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
            background: msg.role === 'user' ? C.bgMsg : 'transparent',
            border: msg.role === 'user' ? `1px solid ${C.borderDim}` : 'none',
            borderRadius: 6,
            padding: msg.role === 'user' ? '6px 10px' : '0',
            fontSize: 12,
            lineHeight: 1.6,
            color: msg.role === 'user' ? C.textMid : C.text,
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
                background: C.textGhost,
                display: 'inline-block',
                animation: `echoDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      )}
      <div ref={messagesEndRef} />
      <style>{`
        @keyframes echoDot {
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
  const active = value.trim() && !disabled
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '8px 10px 10px',
      borderTop: `1px solid ${C.borderDim}`,
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
          background: C.bgInput,
          border: `1px solid ${C.borderDim}`,
          borderRadius: 5,
          color: C.text,
          fontFamily: 'monospace',
          fontSize: 12,
          padding: '7px 10px',
          outline: 'none',
          minWidth: 0,
        }}
      />
      <button
        onClick={onSend}
        disabled={!active}
        style={{
          background: active ? C.cherry : C.bgInput,
          border: 'none',
          borderRadius: 5,
          color: active ? C.text : C.textGhost,
          cursor: active ? 'pointer' : 'default',
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
      <p style={{ color: C.textMid, fontSize: 12, margin: '0 0 10px' }}>
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
            background: C.bgInput,
            border: `1px solid ${error ? C.error : C.borderDim}`,
            borderRadius: 5,
            color: C.text,
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
            background: C.cherry,
            border: 'none',
            borderRadius: 5,
            color: C.text,
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
        <p style={{ color: C.error, fontSize: 11, margin: '6px 0 0' }}>Access denied.</p>
      )}
    </div>
  )
}
