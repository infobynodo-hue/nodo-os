import React from 'react'
import { Loader2 } from 'lucide-react'

interface NodoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export function NodoButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  disabled,
  className = '',
  ...props
}: NodoButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-150 cursor-pointer select-none'

  const sizes = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  }

  const variants = {
    primary: `
      text-[#1A1F2E] font-bold
      bg-[#C8F135]
      hover:bg-[#D4F53C] active:bg-[#BBE02A]
      active:scale-[0.98]
      disabled:opacity-40 disabled:cursor-not-allowed
    `,
    brand: `
      text-white font-bold
      bg-gradient-to-r from-[#c026a8] via-[#a21caf] to-[#7c3aed]
      hover:opacity-90 hover:-translate-y-px active:opacity-80
      active:scale-[0.98]
      shadow-[0_4px_20px_rgba(192,38,168,0.35)]
      disabled:opacity-40 disabled:cursor-not-allowed
    `,
    secondary: `
      text-[#3730a3] border border-[rgba(99,102,241,.3)]
      bg-[rgba(139,92,246,.1)] hover:bg-[rgba(139,92,246,.18)]
      backdrop-blur-sm
      active:scale-[0.98]
      disabled:opacity-40 disabled:cursor-not-allowed
    `,
    ghost: `
      text-[#6d7ab5] hover:text-[#1e1b4b] hover:bg-white/50
      active:scale-[0.98]
      disabled:opacity-40 disabled:cursor-not-allowed
    `,
    danger: `
      text-red-600 bg-red-50/80 border border-red-200
      hover:bg-red-100
      active:scale-[0.98]
      disabled:opacity-40 disabled:cursor-not-allowed
    `,
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="flex-shrink-0">{iconRight}</span>
      )}
    </button>
  )
}
