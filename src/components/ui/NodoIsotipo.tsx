interface NodoIsotipoProps {
  size?: number
  className?: string
}

export function NodoIsotipo({ size = 32, className = '' }: NodoIsotipoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="nodo-grad-fill" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E040A0" />
          <stop offset="100%" stopColor="#8B22E8" />
        </linearGradient>
        <linearGradient id="nodo-grad-stroke" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E040A0" />
          <stop offset="100%" stopColor="#8B22E8" />
        </linearGradient>
        <clipPath id="nodo-left">
          <rect x="0" y="0" width="20" height="40" />
        </clipPath>
        <clipPath id="nodo-right">
          <rect x="20" y="0" width="20" height="40" />
        </clipPath>
      </defs>

      {/* Left half – filled */}
      <circle cx="20" cy="20" r="18" fill="url(#nodo-grad-fill)" clipPath="url(#nodo-left)" />

      {/* Right half – outlined */}
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="none"
        stroke="url(#nodo-grad-stroke)"
        strokeWidth="2.5"
        clipPath="url(#nodo-right)"
      />

      {/* Center divider */}
      <line x1="20" y1="2" x2="20" y2="38" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
