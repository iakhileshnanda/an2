import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FSMContext } from './NanoBotFSM'
import type { UserRole } from './types'
import styles from './EchoBubble.module.css'

type BubbleView = 'main' | 'recruiter' | 'response' | 'admin'

interface MenuItem {
  label: string
  key: string
  arrow?: boolean
}

const MAIN_MENU: MenuItem[] = [
  { label: 'How are you?',   key: 'how_are_you' },
  { label: 'About Akhilesh', key: 'about' },
  { label: 'Projects',       key: 'projects' },
  { label: 'AI Experience',  key: 'ai' },
  { label: 'Leadership',     key: 'leadership' },
  { label: 'Recruiter Mode', key: 'recruiter', arrow: true },
]

const RECRUITER_MENU: MenuItem[] = [
  { label: 'Wing-Man',        key: 'wingman' },
  { label: 'Team Leadership', key: 'team_lead' },
  { label: 'AI Experience',   key: 'ai_rec' },
  { label: 'Resume',          key: 'resume' },
]

const RESPONSES: Record<string, { title: string; body: string }> = {
  how_are_you: {
    title: 'How are you?',
    body: "Fully operational.\n\nAkhilesh keeps me running on\ncoffee and half-finished\nside projects.\n\nWhat can I help with?",
  },
  about: {
    title: 'About Akhilesh',
    body: "Senior engineer. 6+ years.\n\nBuilds AI systems, multi-agent\nsims, and enterprise dashboards.\n\nCurrently deep in autonomous\nagents.",
  },
  projects: {
    title: 'Projects',
    body: "Wing-Man — AI interview coach.\nMaya MIRO — 500-agent market sim.\nOracle — real-time AI analytics.\n\nAll shipped. All his.",
  },
  ai: {
    title: 'AI Experience',
    body: "Multi-agent architectures.\nLLM integration + tool use.\nClaude, Groq, NVIDIA NIM.\n\nWing-Man is the latest proof.",
  },
  leadership: {
    title: 'Leadership',
    body: "Frontend Lead at Trustt.\nLed teams up to 8 engineers.\nAngular migration lead.\n\nMentored 3 devs into\nsenior roles.",
  },
  wingman: {
    title: 'Wing-Man',
    body: "Real-time AI interview coach.\n\nListens during live interviews,\nsurfaces talking points,\ntracks applications end-to-end.\n\nFull pipeline. No human\nin the loop.",
  },
  team_lead: {
    title: 'Team Leadership',
    body: "Frontend Lead across 2 orgs.\nArchitecture decisions.\nCode review culture.\nCross-team coordination.\n\nCut PR cycle time by 40%.",
  },
  ai_rec: {
    title: 'AI Experience',
    body: "3 years in production AI.\n\nWing-Man: end-to-end LLM\npipeline.\nMaya: multi-agent sim.\nOracle: Groq + React dashboards.\n\nNot tutorials — shipped products.",
  },
  resume: {
    title: 'Resume',
    body: "Available on request.\n\ntheakhileshnanda@gmail.com\nlinkedin.com/in/akhileshnanda\n\nCan join in 30 days.\nBangalore — remote or hybrid.",
  },
}

// keys that belong to the recruiter submenu (used for back navigation)
const RECRUITER_KEYS = new Set(['wingman', 'team_lead', 'ai_rec', 'resume'])

interface Props {
  fsm: FSMContext
  onRoleSelect: (role: UserRole) => void
  onClose: () => void
  onMessageSent: () => void
  onReplyReceived: () => void
  displaySize: number
}

export default function EchoBubble({ fsm, onClose, displaySize }: Props) {
  const [view, setView] = useState<BubbleView>('main')
  const [cursor, setCursor] = useState(0)
  const [response, setResponse] = useState<{ title: string; body: string; fromRecruiter: boolean } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const visible = fsm.state === 'TALKING' || fsm.state === 'THINKING' || fsm.state === 'LEAVING'
  const isLeaving = fsm.state === 'LEAVING'

  const currentMenu = view === 'recruiter' ? RECRUITER_MENU : MAIN_MENU

  // open: set admin view if triple-clicked; reset on close
  useEffect(() => {
    if (visible && fsm.role === 'admin') {
      setView('admin')
    } else if (!visible) {
      setView('main')
      setCursor(0)
      setResponse(null)
    }
  }, [visible, fsm.role])

  // reset cursor when switching menus
  useEffect(() => {
    setCursor(0)
  }, [view])

  // keyboard navigation
  useEffect(() => {
    if (!visible || view === 'response' || view === 'admin') return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor(c => (c + 1) % currentMenu.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor(c => (c - 1 + currentMenu.length) % currentMenu.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        select(currentMenu[cursor])
      } else if (e.key === 'Escape') {
        if (view === 'recruiter') setView('main')
        else onClose()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, view, cursor, currentMenu, onClose])

  // response view: Escape to go back
  useEffect(() => {
    if (!visible || view !== 'response') return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault()
        goBack()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, view, response])

  function select(item: MenuItem) {
    if (item.key === 'recruiter') {
      setView('recruiter')
      return
    }
    const resp = RESPONSES[item.key]
    if (resp) {
      setResponse({ ...resp, fromRecruiter: RECRUITER_KEYS.has(item.key) })
      setView('response')
    }
  }

  function goBack() {
    setResponse(null)
    setView(response?.fromRecruiter ? 'recruiter' : 'main')
  }

  const bubbleLeft = displaySize / 2

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="echo-bubble"
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.92, y: 6 }}
          animate={{
            opacity: isLeaving ? 0 : 1,
            scale: isLeaving ? 0.92 : 1,
            y: isLeaving ? 6 : 0,
          }}
          exit={{ opacity: 0, scale: 0.92, y: 6 }}
          transition={{ duration: 0.15 }}
          className={styles.bubble}
          style={{ left: bubbleLeft, transform: 'translateX(-50%)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* header */}
          <div className={styles.header}>
            <span className={styles.headerText}>
              {view === 'main'      && 'ECHO'}
              {view === 'recruiter' && 'RECRUITER MODE'}
              {view === 'response'  && response?.title}
              {view === 'admin'     && 'ADMIN'}
            </span>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
          </div>

          {/* main menu */}
          {view === 'main' && (
            <>
              <div className={styles.prompt}>What would you like to know?</div>
              <div className={styles.divider} />
              <div className={styles.menu} role="menu">
                {MAIN_MENU.map((item, i) => (
                  <button
                    key={item.key}
                    role="menuitem"
                    className={`${styles.menuItem} ${i === cursor ? styles.menuItemActive : ''}`}
                    onClick={() => { setCursor(i); select(item) }}
                    onMouseEnter={() => setCursor(i)}
                  >
                    <span className={styles.menuCursor}>{i === cursor ? '►' : ''}</span>
                    <span className={styles.menuLabel}>{item.label}</span>
                    {item.arrow && <span className={styles.menuArrow}>→</span>}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* recruiter submenu */}
          {view === 'recruiter' && (
            <>
              <div className={styles.prompt}>What are you hiring for?</div>
              <div className={styles.divider} />
              <div className={styles.menu} role="menu">
                {RECRUITER_MENU.map((item, i) => (
                  <button
                    key={item.key}
                    role="menuitem"
                    className={`${styles.menuItem} ${i === cursor ? styles.menuItemActive : ''}`}
                    onClick={() => { setCursor(i); select(item) }}
                    onMouseEnter={() => setCursor(i)}
                  >
                    <span className={styles.menuCursor}>{i === cursor ? '►' : ''}</span>
                    <span className={styles.menuLabel}>{item.label}</span>
                  </button>
                ))}
              </div>
              <button className={styles.backBtn} onClick={() => setView('main')}>◄ Back</button>
            </>
          )}

          {/* response */}
          {view === 'response' && response && (
            <>
              <div className={styles.divider} />
              <div className={styles.responseBody}>
                {response.body.split('\n').map((line, i) => (
                  <p key={i} className={styles.responseLine}>{line || ' '}</p>
                ))}
              </div>
              <div className={styles.divider} />
              <button className={styles.backBtn} onClick={goBack}>◄ Back</button>
            </>
          )}

          {/* admin placeholder */}
          {view === 'admin' && (
            <>
              <div className={styles.divider} />
              <div className={styles.adminBody}>
                <span className={styles.adminTitle}>Restricted access</span>
                <p className={styles.adminText}>Admin mode coming soon.</p>
              </div>
              <div className={styles.divider} />
              <button className={styles.backBtn} onClick={onClose}>◄ Close</button>
            </>
          )}

          {/* bubble tail */}
          <div className={styles.tail} />
          <div className={styles.tailInner} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
