export const SECTION_HINTS: Record<string, string[]> = {
  hero:       ['i watch this page. ask me anything on it.', 'i know things about this guy.', 'type /help — i list what i do.'],
  experience: ['ask me about the angular 9-to-20 migration. nobody does.', 'want the career highlights?', 'i can pull availability and contact details. just ask.'],
  projects:   ['i have a file on every one of these.', 'ask which one to read first. i have opinions.', 'i can tell you what those actually do.'],
  numbers:    ['the stats update live. ask me what they mean.', 'i pull his github as it happens.'],
}

export const IDLE_HINTS = [
  'i answer with live data, not canned text.',
  'resume? i hand those out.',
  'still here. i remember visitors, you know.',
]

export function pickHint(section: string | null): string {
  const pool = section && SECTION_HINTS[section] ? SECTION_HINTS[section] : IDLE_HINTS
  return pool[Math.floor(Math.random() * pool.length)]
}
