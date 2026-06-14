import type { FSMContext } from './nanobot/NanoBotFSM'

interface Props {
  fsm: FSMContext
  pos: { x: number; y: number }
}

const STATE_COLOR: Record<string, string> = {
  IDLE:     '#888',
  ROAMING:  '#60a5fa',
  SLEEPING: '#a78bfa',
  TALKING:  '#34d399',
  LEAVING:  '#f87171',
  JUMPING:  '#fbbf24',
  SQUISH:   '#fb923c',
}

export default function DebugPanel({ fsm, pos }: Props) {
  const color = STATE_COLOR[fsm.state] ?? '#888'

  const rows: [string, string][] = [
    ['State',   fsm.state],
    ['Role',    fsm.role ?? '—'],
    ['Turn',    fsm.role ? `${fsm.turnCount} / ${fsm.maxTurns}` : '—'],
    ['Speed',   fsm.speed],
    ['X',       Math.round(pos.x).toString()],
    ['Y',       Math.round(pos.y).toString()],
    ['Facing',  fsm.facingLeft ? '← left' : '→ right'],
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      right: 16,
      background: '#0a0a0a',
      border: `1px solid ${color}33`,
      borderRadius: 6,
      padding: '10px 14px',
      fontFamily: 'monospace',
      fontSize: 11,
      color: '#555',
      zIndex: 10000,
      minWidth: 190,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        <span style={{ color, letterSpacing: '0.1em', fontSize: 10 }}>{fsm.state}</span>
      </div>
      {rows.map(([label, val]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ color: '#444' }}>{label}</span>
          <span style={{ color: '#777' }}>{val}</span>
        </div>
      ))}
      <div style={{ marginTop: 10, borderTop: '1px solid #1a1a1a', paddingTop: 8, color: '#333', fontSize: 10 }}>
        click = talk · dbl-click = jump
      </div>
    </div>
  )
}
