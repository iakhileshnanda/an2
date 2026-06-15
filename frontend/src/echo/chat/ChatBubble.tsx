import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ChatMessage, EchoIntent } from './chatService'
import ThunderField from './ThunderField'
import ThunderInput from './ThunderInput'
import GlitchText from './GlitchText'
import styles from './ChatBubble.module.css'

function Acc({ c }: { c: string }) {
  return <span className={styles.acc}>{c}</span>
}

/* Short labels for side-by-side horizontal row */
const INTENTS: Array<{ key: EchoIntent; label: string }> = [
  { key: 'recruiting',    label: 'HIRE'    },
  { key: 'collaborating', label: 'COLLAB'  },
  { key: 'curious',       label: 'CURIOUS' },
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

          {/* ── Flow 1: Intent — side by side ─────────── */}
          {!isChat && (
            <div className={styles.stack}>
              <p className={styles.p5Head}>
                WH<Acc c="O" />&nbsp;R&nbsp;U
              </p>

              {/* Horizontal row — three glitch labels, no thunder container */}
              <div className={styles.intentRow}>
                {INTENTS.map((opt, i) => (
                  <motion.button
                    key={opt.key}
                    className={styles.intentBtn}
                    onClick={() => onIntentSelect(opt.key)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <GlitchText
                      speed={1.2 + i * 0.3}
                     
                      enableOnHover
                      className={styles.intentGlitch}
                    >
                      {opt.label}
                    </GlitchText>
                  </motion.button>
                ))}
              </div>

              <button className={styles.roamLink} onClick={() => onIntentSelect('roaming')}>
                just roaming →
              </button>
            </div>
          )}

          {/* ── Flow 2: Chat ──────────────────────────── */}
          {isChat && (
            <div className={styles.stack}>
              <button className={styles.closeBtn} onClick={onClose}>× CLOSE</button>

              {/* Echo's reply inside transparent ThunderField */}
              <ThunderField delay={0}>
                {isLoading ? (
                  <GlitchText speed={0.6} className={styles.echoGlitch}>
                    PROCESSING...
                  </GlitchText>
                ) : (
                  <GlitchText speed={2} enableOnHover className={styles.echoGlitch}>
                    {lastEchoMsg?.text ?? ''}
                  </GlitchText>
                )}
              </ThunderField>

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
