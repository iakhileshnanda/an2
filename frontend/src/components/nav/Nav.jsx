import { useLocation } from 'react-router-dom'
import styles from './Nav.module.css'

// On the homepage, HeroMark (position: fixed) owns the brand identity entirely.
// Nav only renders a logo on non-homepage routes (/admin, /human, etc.)
export default function Nav() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  if (isHome) return null

  return (
    <nav className={styles.nav}>
      <span className={styles.logo}>AN</span>
    </nav>
  )
}
