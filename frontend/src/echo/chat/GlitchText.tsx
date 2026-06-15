import './GlitchText.css'

interface Props {
  children: string
  speed?: number
  enableShadows?: boolean
  enableOnHover?: boolean
  className?: string
}

export default function GlitchText({
  children,
  speed = 1,
  enableShadows = true,
  enableOnHover = false,
  className = '',
}: Props) {
  const style = {
    '--after-duration':  `${speed * 3}s`,
    '--before-duration': `${speed * 2}s`,
    '--after-shadow':  enableShadows ? '-2px 0 #810100' : 'none',
    '--before-shadow': enableShadows ? '2px 0 #0D1B2A'  : 'none',
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
