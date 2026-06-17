import { getVisitorId, getSessionContext } from '../core/visitor'

export interface ChatMessage {
  id: string
  role: 'echo' | 'user'
  text: string
}

export type HistoryItem = { role: 'user' | 'assistant'; content: string }

export interface EchoResult {
  reply: string
  nextState?: string
  toolStatus?: string
  structuredPayload?: unknown
}

interface SendOptions {
  trigger?: 'leaving'
}

export async function sendToEcho(
  message: string,
  history: HistoryItem[],
  opts: SendOptions = {},
): Promise<EchoResult> {
  const res = await fetch('/api/echo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      visitorId: getVisitorId(),
      sessionContext: getSessionContext(),
      ...(opts.trigger ? { trigger: opts.trigger } : {}),
    }),
  })

  if (!res.ok) throw new Error(`${res.status}`)

  const data = await res.json()
  const reply: string =
    data.reply ?? data.message ?? data.response ?? data.content ?? (typeof data === 'string' ? data : '')

  if (!reply && !opts.trigger) throw new Error('empty')

  return {
    reply,
    nextState: data.nextState,
    toolStatus: data.toolStatus,
    structuredPayload: data.structuredPayload,
  }
}
