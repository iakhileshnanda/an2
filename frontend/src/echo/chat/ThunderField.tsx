import styles from './ThunderField.module.css'

interface Props {
  children: React.ReactNode
  dim?: boolean
  onClick?: () => void
  delay?: number
}

export default function ThunderField({ children, dim, onClick, delay = 0 }: Props) {
  return (
    <div
      className={`${styles.root} ${dim ? styles.dim : ''} ${onClick ? styles.clickable : ''}`}
      style={{ '--delay': `${delay}ms` } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
    >
      <svg
        className={styles.svg}
        viewBox="0 0 308 38"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Cotton outer frame — stroke animates in (P5 draw-in) */}
        <polygon
          className={styles.frame}
          points="24,0 296,0 289,38 3,38"
          fill="#EDEBDE"
          stroke="#1B1716"
          strokeWidth="1.5"
        />
        {/* Noir inner body */}
        <polygon points="28,2.5 292,2.5 285,35.5 7,35.5" fill="#1B1716" />
        {/* Left thunder — upper wing */}
        <polygon
          className={styles.wingTop}
          points="0,2 50,2 42,19 0,19"
          fill="#EDEBDE"
          stroke="#1B1716"
          strokeWidth="1"
        />
        {/* Left thunder — lower wing */}
        <polygon
          className={styles.wingBot}
          points="3,19 42,19 34,36 3,36"
          fill="#EDEBDE"
          stroke="#1B1716"
          strokeWidth="1"
        />
        {/* Right arrow tick */}
        <polygon
          className={styles.tick}
          points="285,10 304,19 285,29"
          fill="#EDEBDE"
          stroke="#1B1716"
          strokeWidth="1"
        />
      </svg>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
