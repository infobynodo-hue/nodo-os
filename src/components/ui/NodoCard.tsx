import React from 'react'

interface NodoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Dark panel variant — for tables / detail areas */
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
      <div className={`rounded-2xl ${paddings[padding]} bg-[#1E2433] ${className}`} {...props}>
        {children}
      </div>
    )
  }

  if (glass) {
    return (
      <div className={`rounded-2xl ${paddings[padding]} backdrop-blur-md bg-white/80 border border-white/60 ${className}`} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl ${paddings[padding]} bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
