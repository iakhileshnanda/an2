import styles from './ThunderInput.module.css'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}

/* Oblique parallelogram input — same P5 skew as ThunderField,
   red accent bar on left instead of lightning wings */
export default function ThunderInput({ value, onChange, onSubmit, disabled, placeholder, autoFocus }: Props) {
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() }
  }

  const active = !disabled && value.trim().length > 0

  return (
    <div className={styles.root}>
      <svg
        className={styles.svg}
        viewBox="0 0 308 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer frame — transparent body, just the outline */}
        <polygon
          className={styles.frame}
          points="22,0 296,0 289,48 1,48"
          fill="none"
          stroke="#1B1716"
          strokeWidth="1.5"
        />
        {/* Left red accent bar — P5 oblique stripe, keeps the thunder identity */}
        <polygon
          points="26,3.5 38,3.5 17,44.5 5,44.5"
          fill="#810100"
        />
        {/* Right send arrow */}
        <polygon
          className={active ? styles.arrowActive : styles.arrow}
          points="274,12 294,24 274,36"
          fill="#EDEBDE"
          stroke="#1B1716"
          strokeWidth="1"
        />
      </svg>

      <input
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? 'Ask anything…'}
        disabled={disabled}
        maxLength={500}
        autoComplete="off"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
      />

      <button
        className={`${styles.sendBtn} ${active ? styles.sendActive : ''}`}
        onClick={onSubmit}
        disabled={!active}
        aria-label="Send"
        tabIndex={-1}
      >
        →
      </button>
    </div>
  )
}
