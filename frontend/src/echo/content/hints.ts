export const SECTION_HINTS: Record<string, string[]> = {
  hero:       ['psst. ask me something.', 'i know things about this guy.', 'curious? just click me.'],
  experience: ['7 years of work. ask me to break it down.', 'want the career highlights?'],
  projects:   ['any of these catch your eye?', 'i can tell you what those actually do.'],
  numbers:    ['the stats update live. ask me what they mean.', 'go ahead, ask about the numbers.'],
}

export const IDLE_HINTS = [
  'psst. click me.',
  'still here if you have questions.',
  'ask me anything.',
]

export function pickHint(section: string | null): string {
  const pool = section && SECTION_HINTS[section] ? SECTION_HINTS[section] : IDLE_HINTS
  return pool[Math.floor(Math.random() * pool.length)]
}
