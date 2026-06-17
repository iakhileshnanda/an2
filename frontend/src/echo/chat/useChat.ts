import { useState, useCallback, useRef } from 'react'
import { useEchoStore } from '../store/echoStore'
import { sendToEcho } from './chatService'
import type { ChatMessage, HistoryItem } from './chatService'

const uid = () => Math.random().toString(36).slice(2, 9)

const OFFLINE_MSG = 'Offline right now. Reach Akhilesh directly: theakhileshnanda@gmail.com'

export function useChat() {
  const dispatch = useEchoStore((s) => s.dispatch)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const history = useRef<HistoryItem[]>([])

  const pushEcho = (text: string): ChatMessage => {
    const msg: ChatMessage = { id: uid(), role: 'echo', text }
    setMessages((p) => [...p, msg])
    history.current = [...history.current, { role: 'assistant', content: text }]
    return msg
  }

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { id: uid(), role: 'user', text }
    setMessages((p) => [...p, userMsg])

    const prevHistory = [...history.current]
    history.current = [...prevHistory, { role: 'user', content: text }]

    setIsLoading(true)
    dispatch({ type: 'MESSAGE_SENT' })

    try {
      const { reply } = await sendToEcho(text, prevHistory)
      pushEcho(reply)
      dispatch({ type: 'REPLY_RECEIVED' })
    } catch {
      pushEcho(OFFLINE_MSG)
      dispatch({ type: 'REPLY_RECEIVED' })
    } finally {
      setIsLoading(false)
    }
  }, [dispatch])

  const reset = useCallback(() => {
    if (history.current.length > 0) {
      sendToEcho('', history.current, { trigger: 'leaving' }).catch(() => {})
    }
    setMessages([])
    setIsLoading(false)
    history.current = []
  }, [])

  return { messages, isLoading, sendMessage, reset }
}
