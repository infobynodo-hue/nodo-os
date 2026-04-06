import React from 'react'

interface NodoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Subtle tinted card — for chat bubbles / secondary panels */
  dark?: boolean
  glass?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** @deprecated use dark instead */
  glow?: boolean
}

export function NodoCard({
  children,
  dark = false,
  glass = false,
  padding = 'md',
  className = '',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  glow: _glow,
  ...props
}: NodoCardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  if (dark) {
    return (
      <div
        className={`rounded-2xl ${paddings[padding]} bg-white/50 backdrop-blur-md border border-white/50 ${className}`}
        style={{ boxShadow: '0 2px 16px rgba(99,102,241,.08), inset 0 1px 0 rgba(255,255,255,.8)' }}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (glass) {
    return (
      <div className={`lg ${paddings[padding]} ${className}`} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl ${paddings[padding]} bg-white/70 backdrop-blur-lg border border-white/60 ${className}`}
      style={{ boxShadow: '0 4px 24px rgba(99,102,241,.1), inset 0 1.5px 0 rgba(255,255,255,.9)' }}
      {...props}
    >
      {children}
    </div>
  )
}
