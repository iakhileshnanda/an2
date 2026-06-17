import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ChatMessage } from './chatService'
import ThunderField from './ThunderField'
import ThunderInput from './ThunderInput'
import GlitchText from './GlitchText'
import styles from './ChatBubble.module.css'

interface Props {
  visible: boolean
  messages: ChatMessage[]
  isLoading: boolean
  onSend: (text: string) => void
  onClose: () => void
}

export default function ChatBubble({
  visible, messages, isLoading, onSend, onClose,
}: Props) {
  const [input, setInput] = useState('')

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
          key="chat"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.11 }}
          style={{ width: 310 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.stack}>
            <button className={styles.closeBtn} onClick={onClose}>× CLOSE</button>

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

            <ThunderInput
              value={input}
              onChange={setInput}
              onSubmit={submit}
              disabled={isLoading}
              placeholder="Ask anything…"
              autoFocus
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
