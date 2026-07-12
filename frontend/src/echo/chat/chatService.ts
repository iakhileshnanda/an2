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

/**
 * Fire-and-forget "leaving" ping so the backend writes its one-line visit
 * summary for next time. keepalive lets the request survive page unload.
 */
export function sendLeaving(history: HistoryItem[]): void {
  try {
    void fetch('/api/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        message: '',
        history,
        visitorId: getVisitorId(),
        sessionContext: getSessionContext(),
        trigger: 'leaving',
      }),
    }).catch(() => {})
  } catch {
    /* best-effort — the page is going away */
  }
}

export interface StreamHandlers {
  /** Text chunk as the model generates it. Cosmetic — the resolved EchoResult.reply is authoritative. */
  onDelta?: (text: string) => void
  /** A tool is running server-side (e.g. "SEARCHING GITHUB..."). Resets any accumulated delta text. */
  onStatus?: (status: string) => void
}

/**
 * Streaming variant of sendToEcho — SSE over POST. Deltas and tool statuses
 * arrive via handlers while the model runs; resolves with the same EchoResult
 * as sendToEcho (from the final `done` event). Falls back to the JSON endpoint
 * if the stream can't be established.
 */
export async function sendToEchoStream(
  message: string,
  history: HistoryItem[],
  handlers: StreamHandlers = {},
): Promise<EchoResult> {
  let res: Response
  try {
    res = await fetch('/api/echo/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        visitorId: getVisitorId(),
        sessionContext: getSessionContext(),
      }),
    })
  } catch {
    return sendToEcho(message, history)
  }
  if (!res.ok || !res.body) {
    if (res.status === 404 || res.status === 405) return sendToEcho(message, history)
    throw new Error(`${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let done: EchoResult | null = null

  const handleEvent = (event: string, raw: string) => {
    let data: any
    try {
      data = JSON.parse(raw)
    } catch {
      return
    }
    if (event === 'delta' && typeof data.text === 'string') handlers.onDelta?.(data.text)
    else if (event === 'status' && typeof data.status === 'string') handlers.onStatus?.(data.status)
    else if (event === 'done') done = data
    else if (event === 'error') throw new Error(data.error || 'stream error')
  }

  for (;;) {
    const { value, done: eof } = await reader.read()
    if (eof) break
    buffer += decoder.decode(value, { stream: true })

    // SSE frames are separated by a blank line
    let sep: number
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      let event = 'message'
      let data = ''
      for (const line of frame.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7).trim()
        else if (line.startsWith('data: ')) data += line.slice(6)
      }
      if (data) handleEvent(event, data)
    }
  }

  if (!done) throw new Error('stream ended without done')
  const result = done as EchoResult
  if (!result.reply) throw new Error('empty')
  return result
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
