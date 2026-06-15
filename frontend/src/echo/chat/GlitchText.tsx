import './GlitchText.css'

interface Props {
  children: string
  speed?: number
  enableOnHover?: boolean
  className?: string
}

export default function GlitchText({
  children,
  speed = 1,
  enableOnHover = false,
  className = '',
}: Props) {
  const style = {
    '--after-duration':  `${speed * 3}s`,
    '--before-duration': `${speed * 2}s`,
  } as React.CSSProperties

  return (
    <div
      className={`glitch ${enableOnHover ? 'enable-on-hover' : ''} ${className}`}
      style={style}
      data-text={children}
    >
      {children}
    </div>
  )
}
