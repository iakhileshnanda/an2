import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ChatMessage, EchoIntent } from './chatService'
import ThunderField from './ThunderField'
import ThunderInput from './ThunderInput'
import styles from './ChatBubble.module.css'

/* P5 reversed-square accent: one character gets an inverted colour block */
function Acc({ c }: { c: string }) {
  return <span className={styles.acc}>{c}</span>
}

const INTENTS: Array<{ key: EchoIntent; label: string }> = [
  { key: 'recruiting',    label: 'RECRUITING / HIRING'  },
  { key: 'collaborating', label: 'COLLABORATE'          },
  { key: 'curious',       label: 'CURIOUS PROJECT'      },
]

interface Props {
  visible: boolean
  intent: EchoIntent | null
  messages: ChatMessage[]
  isLoading: boolean
  onIntentSelect: (i: EchoIntent) => void
  onSend: (text: string) => void
  onClose: () => void
}

export default function ChatBubble({
  visible, intent, messages, isLoading,
  onIntentSelect, onSend, onClose,
}: Props) {
  const [input, setInput] = useState('')

  const isChat     = intent !== null
  const isFarewell = intent === 'roaming'

  const lastUserMsg = messages.filter((m) => m.role === 'user').at(-1)
  const lastEchoMsg = messages.filter((m) => m.role === 'echo').at(-1)

  function submit() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    onSend(text)
  }

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={isChat ? 'chat' : 'intent'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.11 }}
          style={{ width: 310 }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── Flow 1: Intent picker ─────────────────── */}
          {!isChat && (
            <div className={styles.stack}>
              {/* P5 header — irregular letter casing + accent char */}
              <p className={styles.p5Head}>
                WH<Acc c="O" />&nbsp;R&nbsp;U
              </p>

              {INTENTS.map((opt, i) => (
                <ThunderField
                  key={opt.key}
                  onClick={() => onIntentSelect(opt.key)}
                  delay={i * 65}
                >
                  <span className={styles.arrow}>►</span>
                  {opt.label}
                </ThunderField>
              ))}

              <button
                className={styles.roamLink}
                onClick={() => onIntentSelect('roaming')}
              >
                just roaming →
              </button>
            </div>
          )}

          {/* ── Flow 2: Chat conversation ─────────────── */}
          {isChat && (
            <div className={styles.stack}>
              <button className={styles.closeBtn} onClick={onClose}>
                × CLOSE
              </button>

              {/* Field A — user context (dim) */}
              <ThunderField dim delay={0}>
                {lastUserMsg
                  ? <><span className={styles.youLabel}>YOU</span>{lastUserMsg.text}</>
                  : intent.toUpperCase()
                }
              </ThunderField>

              {/* Field B — Echo's reply */}
              <ThunderField delay={80}>
                {isLoading ? (
                  <div className={styles.dots}>
                    <div className={styles.dot} />
                    <div className={styles.dot} />
                    <div className={styles.dot} />
                  </div>
                ) : (
                  <><span className={styles.echoIcon}>◈</span>{lastEchoMsg?.text ?? ''}</>
                )}
              </ThunderField>

              {/* Thunder-shaped input — replaces rectangular chat panel */}
              {!isFarewell && (
                <ThunderInput
                  value={input}
                  onChange={setInput}
                  onSubmit={submit}
                  disabled={isLoading}
                  placeholder="Ask anything…"
                  autoFocus
                />
              )}
            </div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  )
}
