import { getVisitorId, getSessionContext } from '../core/visitor'

export type EchoIntent = 'recruiting' | 'collaborating' | 'curious' | 'roaming'

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

// UI intents map to the backend's mode contract.
const INTENT_WIRE: Record<EchoIntent, 'HIRE' | 'COLLAB' | 'CURIOUS' | null> = {
  recruiting: 'HIRE',
  collaborating: 'COLLAB',
  curious: 'CURIOUS',
  roaming: null,
}

interface SendOptions {
  trigger?: 'leaving'
}

export async function sendToEcho(
  message: string,
  history: HistoryItem[],
  intent: EchoIntent | null,
  opts: SendOptions = {},
): Promise<EchoResult> {
  const res = await fetch('/api/echo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      intent: intent ? INTENT_WIRE[intent] : null,
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
