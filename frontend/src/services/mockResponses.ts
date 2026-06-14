export type ChatMode = 'visitor' | 'recruiter' | 'admin'

const ADMIN_PASSWORD = 'akhilesh2025'

const CONTACT_FOOTER = `\n\n— Resume · LinkedIn · theakhileshnanda@gmail.com`

function match(msg: string, ...keywords: string[]): boolean {
  return keywords.some(k => msg.includes(k))
}

function visitorResponse(msg: string): string {
  if (match(msg, 'who', 'akhilesh', 'about')) {
    return "Akhilesh is a Senior Frontend Engineer and AI Builder based in Bangalore. 6+ years shipping production software, lately obsessed with building AI systems that actually work. This portfolio is his playground."
  }
  if (match(msg, 'wing', 'wingman', 'wing-man')) {
    return "Wing-Man is his AI interview coaching tool — it listens during live interviews and surfaces relevant talking points in real time. Pretty bold idea."
  }
  if (match(msg, 'maya', 'nanobot', 'droid', 'bot', 'ai')) {
    return "Maya / NanoBot is the AI system powering this site. Multi-agent, long-term memory, Telegram interface, and now... me, the Droid. That's the fun part."
  }
  if (match(msg, 'portfolio', 'site', 'built this', 'made this')) {
    return "He built it from scratch — React 19, custom sprite animations, a full backend, and an AI agent underneath. Nothing off the shelf."
  }
  if (match(msg, 'contact', 'email', 'reach', 'hire', 'talk to')) {
    return "Best way is email: theakhileshnanda@gmail.com. Or if you're a recruiter, switch to Recruiter mode and I'll give you the proper pitch."
  }
  if (match(msg, 'work', 'job', 'experience', 'company')) {
    return "Currently SDE II / Frontend Lead at Trustt. Before that, Transtech Solutions. 6 years of building things people actually use."
  }
  if (match(msg, 'skill', 'tech', 'stack', 'angular', 'react')) {
    return "Angular v9–20, React, TypeScript, Node.js, and a growing toolkit of AI stuff — Claude, Groq, LangChain, NVIDIA NIM. Mostly frontend, increasingly AI."
  }
  if (match(msg, 'hello', 'hi', 'hey', 'sup', 'hiya')) {
    return "Hey! Nice to see you here. Ask me anything about Akhilesh, his projects, or just poke around the site."
  }
  if (match(msg, 'bye', 'goodbye', 'later', 'cya', 'see you')) {
    return "Catch you later! I'll be roaming around if you need me. 👋"
  }
  return "I'm just a droid — ask me about Akhilesh, his projects, or what he's been building. I know the good stuff."
}

function recruiterResponse(msg: string): string {
  let reply = ''

  if (match(msg, 'who', 'akhilesh', 'about', 'background', 'summary', 'introduce')) {
    reply = "Akhilesh Nanda is a Senior Frontend Engineer and Tech Lead with 6+ years of production experience. Currently SDE II / Frontend Lead at Trustt. Strong in Angular (v9–20), React, TypeScript, and Node.js. He's also actively building with AI — Claude, Groq, multi-agent systems. Not a side-project guy; he ships."
  }
  else if (match(msg, 'wing', 'wingman', 'wing-man')) {
    reply = "Wing-Man is a real-time AI interview coaching platform. During a live interview, it listens and surfaces relevant context — experience, talking points, project specifics. Built on React + NLP pipelines, shipped to early users. It's the kind of tool that didn't exist, so he built it."
  }
  else if (match(msg, 'maya', 'nanobot', 'multi-agent', 'ai system')) {
    reply = "Maya / NanoBot is a multi-agent AI system he built from scratch. Persistent memory, Groq-backed LLM, Telegram interface, scheduled tasks, and this very portfolio integration. It's a personal AI that actually works day-to-day — not a demo."
  }
  else if (match(msg, 'ai', 'llm', 'machine learning', 'claude', 'groq', 'nvidia')) {
    reply = "He's shipped AI features in production: Claude API integration, NVIDIA NIM, Groq inference, multi-agent orchestration with long-term memory. Wing-Man, Maya, AI Loan Discovery, LLM Job Intelligence — these are shipped products, not tutorials."
  }
  else if (match(msg, 'lead', 'leadership', 'team', 'manage', 'senior')) {
    reply = "At Trustt, he's Frontend Lead — architecture decisions, code reviews, cross-team coordination, junior mentorship. He makes the team faster, not just the codebase bigger. Has run sprints, defined tech standards, and shipped under deadline pressure."
  }
  else if (match(msg, 'experience', 'work', 'history', 'year', 'role')) {
    reply = "6+ years total. Current: SDE II / Frontend Lead at Trustt. Previous: Transtech Solutions (2019–2023). Angular, React, TypeScript throughout. Increasingly AI-focused. Can join in 30 days."
  }
  else if (match(msg, 'resume', 'cv', 'download')) {
    reply = "Resume is available — reach out directly and I'll get it to you. Or check the links below."
  }
  else if (match(msg, 'salary', 'ctc', 'compensation', 'package', 'expect')) {
    reply = "He's targeting 18–30 LPA depending on the role, scope, and team. Open to the right conversation."
  }
  else if (match(msg, 'available', 'join', 'notice', 'start')) {
    reply = "Actively looking. Can join in 30 days notice. Based in Bangalore, open to remote or hybrid."
  }
  else if (match(msg, 'angular', 'react', 'typescript', 'frontend', 'stack')) {
    reply = "Deep Angular expertise (v9 through v20), production React, TypeScript-first, Node.js backend, plus the AI layer. 6 years of real usage, not tutorials."
  }
  else if (match(msg, 'project', 'built', 'ship', 'portfolio')) {
    reply = "Wing-Man, Maya/NanoBot, Ghost, DevBrain/Engram, AI Loan Discovery, LLM Job Intelligence, this portfolio. All shipped. All his."
  }
  else if (match(msg, 'hello', 'hi', 'hey')) {
    reply = "Hey! You've got good taste — Akhilesh is worth a closer look. Ask me anything: experience, projects, AI work, leadership, or just go straight for the resume."
  }
  else {
    reply = "Good question. Akhilesh is a Senior Frontend Engineer with a growing AI background — 6 years production experience, shipped multiple AI-powered products. Worth a conversation."
  }

  return reply + CONTACT_FOOTER
}

export function getMockResponse(mode: ChatMode, message: string): string {
  const msg = message.toLowerCase().trim()
  if (mode === 'visitor') return visitorResponse(msg)
  if (mode === 'recruiter') return recruiterResponse(msg)
  return ''
}

export function validateAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}
