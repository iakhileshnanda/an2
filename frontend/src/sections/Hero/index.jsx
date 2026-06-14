import styles from './Hero.module.css'

// Pure scroll spacer. HeroMark (position: fixed) renders the actual name/logo.
// This section exists solely to create the vertical scroll space the
// HeroMark animation needs before the next section begins.
export default function Hero() {
  return <div className={styles.hero} />
}
