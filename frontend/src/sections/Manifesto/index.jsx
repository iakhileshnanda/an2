import { motion } from 'framer-motion'

// Syntax tokens
const KW  = 'kw'
const STR = 'str'
const PL  = 'pl'
const CMT = 'cmt'
function t(type, text) { return { type, text } }

const CODE_LINES = [
  [t(KW,'import'), t(PL,' { Server } '), t(KW,'from'), t(STR," '@modelcontextprotocol/sdk'"), t(PL,';')],
  [t(KW,'import'), t(PL,' { PersonaEngine } '), t(KW,'from'), t(STR," './agents/persona'"), t(PL,';')],
  [],
  [t(KW,'const'), t(PL,' server = '), t(KW,'new'), t(PL,' Server({ name: '), t(STR,"'maya-miro'"), t(PL,' });')],
  [t(PL,'server.tool('), t(STR,"'run_debate'"), t(PL,', '), t(KW,'async'), t(PL,' ({ ticker, count }) => {')],
  [t(PL,'  '), t(KW,'const'), t(PL,' personas = '), t(KW,'await'), t(PL,' PersonaEngine.spawn(count);')],
  [t(PL,'  '), t(KW,'const'), t(PL,' result = '), t(KW,'await'), t(PL,' personas.debate(ticker);')],
  [t(PL,'  '), t(KW,'return'), t(PL,' { signal: result.signal, confidence: result.score };')],
  [t(PL,'});')],
  [t(PL,'server.listen(3000);')],
  [t(CMT,'// MCP Server')],
]

const TOKEN_COLOR = {
  kw:  '#810100',
  str: 'rgba(129,1,0,0.75)',
  pl:  '#EDEBDE',
  cmt: 'rgba(237,235,190,0.32)',
}

function CodeToken({ type, text }) {
  return <span style={{ color: TOKEN_COLOR[type] }}>{text}</span>
}

export default function Manifesto() {
  return (
    <section style={{ background: '#1B1716' }}>

      {/* ── Panel 1: LET'S BUILD SOMETHING THAT MATTERS. ── */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(3rem,7vw,6rem) clamp(1.5rem,6vw,5rem)',
      }}>
        <motion.h2
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 400,
            fontSize: 'clamp(3.2rem, 14vw, 15rem)',
            lineHeight: 0.95,
            color: '#EDEBDE',
            letterSpacing: '-0.01em',
            margin: 0,
          }}
        >
          LET'S BUILD<br />
          SOMETHING<br />
          THAT<br />
          MATTERS.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(0.85rem, 1.4vw, 1rem)',
            color: 'rgba(237,235,190,0.38)',
            marginTop: 'clamp(2rem,4vw,3rem)',
            letterSpacing: '0.06em',
          }}
        >
          「大切なものを、一緒に作ろう」
        </motion.p>
      </div>

      {/* ── Panel 2: ONE NIGHT. ZERO BACKEND. ONE AGENT. + code ── */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(2rem,5vw,5rem)',
        padding: 'clamp(3rem,7vw,6rem) clamp(1.5rem,6vw,5rem)',
        flexWrap: 'wrap',
      }}>

        {/* Left — huge sub-taglines */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: '0 1 auto' }}
        >
          {['ONE', 'NIGHT.', 'ZERO', 'BACKEND.', 'ONE', 'AGENT.'].map((word, i) => (
            <div
              key={i}
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 400,
                fontSize: 'clamp(2.4rem, 9vw, 10rem)',
                lineHeight: 0.95,
                color: '#EDEBDE',
                letterSpacing: '-0.01em',
              }}
            >
              {word}
            </div>
          ))}
        </motion.div>

        {/* Right — code block */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            flex: '1 1 320px',
            maxWidth: 480,
            background: '#110b0b',
            border: '1px solid rgba(237,235,190,0.07)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {/* file tab */}
          <div style={{
            padding: '9px 16px',
            borderBottom: '1px solid rgba(237,235,190,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {['#810100', '#630102', 'rgba(237,235,190,0.18)'].map((c, i) => (
                <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'rgba(237,235,190,0.38)',
              letterSpacing: '0.06em',
            }}>
              maya-miro / index.ts
            </span>
          </div>

          {/* code */}
          <pre style={{
            padding: '18px 20px 22px',
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(10px, 1.2vw, 12.5px)',
            lineHeight: 1.8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}>
            {CODE_LINES.map((line, i) => (
              <div key={i} style={{ minHeight: line.length === 0 ? '1.8em' : undefined }}>
                {line.map((tok, j) => (
                  <CodeToken key={j} type={tok.type} text={tok.text} />
                ))}
              </div>
            ))}
          </pre>
        </motion.div>

      </div>

    </section>
  )
}
