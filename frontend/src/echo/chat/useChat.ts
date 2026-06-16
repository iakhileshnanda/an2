import { useState, useCallback, useRef, useEffect } from 'react'
import { useEchoStore } from '../store/echoStore'
import { sendToEcho } from './chatService'
import type { ChatMessage, EchoIntent, HistoryItem } from './chatService'

const uid = () => Math.random().toString(36).slice(2, 9)

const INTENT_SEED: Record<Exclude<EchoIntent, 'roaming'>, string> = {
  recruiting:    "I'm here as a recruiter evaluating Akhilesh for a role.",
  collaborating: "I'm looking to collaborate with Akhilesh on something.",
  curious:       "I'm curious about Akhilesh's projects and work.",
}

const OFFLINE_MSG = 'Offline right now. Reach Akhilesh directly: theakhileshnanda@gmail.com'

export function useChat() {
  const dispatch = useEchoStore((s) => s.dispatch)

  const [intent, setIntent] = useState<EchoIntent | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const history = useRef<HistoryItem[]>([])

  // Mirror intent in a ref so reset() can read it without being re-created.
  const intentRef = useRef<EchoIntent | null>(null)
  useEffect(() => { intentRef.current = intent }, [intent])

  const pushEcho = (text: string): ChatMessage => {
    const msg: ChatMessage = { id: uid(), role: 'echo', text }
    setMessages((p) => [...p, msg])
    history.current = [...history.current, { role: 'assistant', content: text }]
    return msg
  }

  const selectIntent = useCallback(async (chosen: EchoIntent) => {
    if (chosen === 'roaming') {
      setIntent('roaming')
      setMessages([{ id: uid(), role: 'echo', text: 'Good luck scrolling.' }])
      setTimeout(() => dispatch({ type: 'CLOSE' }), 2200)
      return
    }

    setIntent(chosen)
    setIsLoading(true)
    dispatch({ type: 'MESSAGE_SENT' })

    try {
      const seed = INTENT_SEED[chosen]
      history.current = [{ role: 'user', content: seed }]
      const { reply } = await sendToEcho(seed, [], chosen)
      pushEcho(reply)
      dispatch({ type: 'REPLY_RECEIVED' })
    } catch {
      pushEcho(OFFLINE_MSG)
      dispatch({ type: 'REPLY_RECEIVED' })
    } finally {
      setIsLoading(false)
    }
  }, [dispatch])

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { id: uid(), role: 'user', text }
    setMessages((p) => [...p, userMsg])

    const prevHistory = [...history.current]
    history.current = [...prevHistory, { role: 'user', content: text }]

    setIsLoading(true)
    dispatch({ type: 'MESSAGE_SENT' })

    try {
      const { reply } = await sendToEcho(text, prevHistory, intent)
      pushEcho(reply)
      dispatch({ type: 'REPLY_RECEIVED' })
    } catch {
      pushEcho(OFFLINE_MSG)
      dispatch({ type: 'REPLY_RECEIVED' })
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, intent])

  const reset = useCallback(() => {
    // On close, fire a one-line "visit summary" trigger. This is the proactive
    // LEAVING write: the backend produces a summary and stores it as memory for
    // the visitor's next session. Fire-and-forget — the panel is closing.
    const lastIntent = intentRef.current
    if (lastIntent && lastIntent !== 'roaming' && history.current.length > 0) {
      sendToEcho('', history.current, lastIntent, { trigger: 'leaving' }).catch(() => {})
    }
    setIntent(null)
    setMessages([])
    setIsLoading(false)
    history.current = []
  }, [])

  return { intent, messages, isLoading, selectIntent, sendMessage, reset }
}
