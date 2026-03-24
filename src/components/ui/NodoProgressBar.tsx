interface NodoProgressBarProps {
  value: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Use on dark backgrounds */
  dark?: boolean
}

export function NodoProgressBar({
  value,
  showLabel = false,
  size = 'md',
  className = '',
  dark = false,
}: NodoProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  const heights = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  }

  const trackBg = dark ? 'bg-white/10' : 'bg-[#E9EBF0]'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex-1 ${trackBg} rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedValue}%`, background: '#C8F135' }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-mono w-8 text-right flex-shrink-0 ${dark ? 'text-white/40' : 'text-[#9CA3AF]'}`}>
          {clampedValue}%
        </span>
      )}
    </div>
  )
}
