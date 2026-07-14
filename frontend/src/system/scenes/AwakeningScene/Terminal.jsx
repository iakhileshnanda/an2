import React, { useEffect, useState, useRef } from 'react';
import styles from './Terminal.module.css';

// Each token: [text, colorClass]
// Colors use Tailwind inline or direct hex — no external syntax lib needed.
const CODE_LINES = [
  [['import', 'kw'], [' { Server } ', 'dim'], ['from', 'kw'], [" '@modelcontextprotocol/sdk'", 'str'], [';', 'dim']],
  [['import', 'kw'], [' { PersonaEngine } ', 'dim'], ['from', 'kw'], [" './agents/persona'", 'str'], [';', 'dim']],
  [],
  [['const', 'kw'], [' server ', 'dim'], ['=', 'dim'], [' new', 'kw'], [' Server(', 'dim'], ['{ name:', 'dim'], [" 'maya-miro'", 'str'], [' })', 'dim'], [';', 'dim']],
  [],
  [['server', 'fn'], ['.tool(', 'dim'], ["'run_debate'", 'str'], [', async (', 'dim'], ['{ ticker, count }', 'param'], [') => {', 'dim']],
  [['  const', 'kw'], [' personas ', 'dim'], ['=', 'dim'], [' await', 'kw'], [' PersonaEngine', 'fn'], ['.spawn(count)', 'dim'], [';', 'dim']],
  [['  const', 'kw'], [' result ', 'dim'], ['=', 'dim'], [' await', 'kw'], [' personas', 'fn'], ['.debate(ticker)', 'dim'], [';', 'dim']],
  [['  return', 'kw'], [' { signal:', 'dim'], [' result.signal,', 'dim'], [' confidence:', 'dim'], [' result.score }', 'dim'], [';', 'dim']],
  [['});', 'dim']],
  [],
  [['server', 'fn'], ['.listen(', 'dim'], ['3000', 'num'], [')', 'dim'], [';', 'dim']],
  [['// MCP Server running · port 3000 ✓', 'comment']],
  [],
  [['// running debate: NVDA · 100 personas spawned...', 'comment']],
  [['// signal:', 'comment'], ['  BUY', 'str'], ['  confidence:', 'comment'], ['  0.91', 'num'], ['  consensus:', 'comment'], ['  78%', 'num']],
  [['// built in one night. no backend. just this.', 'comment']],
];

const COLOR = {
  kw:      '#79b8ff',
  str:     '#00FF41',
  fn:      '#e1e4e8',
  param:   '#ffab70',
  dim:     '#8b949e',
  num:     '#79c0ff',
  comment: '#3a3f47',
};

export default function Terminal() {
  const [visibleLines, setVisibleLines] = useState(0);
  const hasStarted = useRef(false);
  const termRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          let i = 0;
          const tick = () => {
            i++;
            setVisibleLines(i);
            if (i < CODE_LINES.length) setTimeout(tick, 90);
          };
          setTimeout(tick, 400);
        }
      },
      { threshold: 0.4 }
    );
    if (termRef.current) observer.observe(termRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={termRef} className={`border border-white bg-black w-full overflow-hidden ${styles.wrapper}`}>
      {/* Title bar */}
      <div className={styles.titleBar}>
        <div className={styles.dotRed} />
        <div className={styles.dotYellow} />
        <div className={styles.dotGreen} />
        <span className={styles.titleText}>maya-miro / index.ts</span>
      </div>

      {/* Code */}
      <div className={styles.content} style={{ gap: '0.1rem' }}>
        {CODE_LINES.slice(0, visibleLines).map((tokens, lineIdx) => (
          <div key={lineIdx} style={{ minHeight: '1.4rem', opacity: 1, transition: 'opacity 0.2s' }}>
            <span style={{ color: '#3a3f47', marginRight: '1.5rem', userSelect: 'none', fontSize: '0.7rem' }}>
              {String(lineIdx + 1).padStart(2, ' ')}
            </span>
            {tokens.map(([text, type], i) => (
              <span key={i} style={{ color: COLOR[type] || '#e1e4e8' }}>{text}</span>
            ))}
          </div>
        ))}
        {visibleLines < CODE_LINES.length && (
          <div style={{ minHeight: '1.4rem' }}>
            <span className="cursor-blink" style={{ color: '#00FF41' }}>█</span>
          </div>
        )}
      </div>
    </div>
  );
}
