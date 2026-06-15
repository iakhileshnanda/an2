export type EchoIntent = 'recruiting' | 'collaborating' | 'curious' | 'roaming'

export interface ChatMessage {
  id: string
  role: 'echo' | 'user'
  text: string
}

export type HistoryItem = { role: 'user' | 'assistant'; content: string }

// Adjust field names to match your NanoBot response shape
export async function sendToEcho(
  message: string,
  history: HistoryItem[],
  intent: EchoIntent | null,
): Promise<string> {
  const res = await fetch('/api/echo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, intent }),
  })

  if (!res.ok) throw new Error(`${res.status}`)

  const data = await res.json()
  const text =
    data.reply ??
    data.message ??
    data.response ??
    data.content ??
    (typeof data === 'string' ? data : '')

  if (!text) throw new Error('empty')
  return text
}
