import styles from './EchoTransmission.module.css'

interface Props {
  children: React.ReactNode
}

export default function EchoTransmission({ children }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.shard1} />
      <div className={styles.shard2} />
      <div className={styles.body}>
        {children}
      </div>
      <div className={styles.ear} />
    </div>
  )
}
