import React from 'react'

type BadgeStatus = 'active' | 'pending' | 'paused' | 'completed' | 'cancelled' | 'error' | 'overdue' | 'in_progress' | 'paid' | 'resolved' | 'not_started'

interface NodoBadgeProps {
  status?: BadgeStatus
  label?: string
  children?: React.ReactNode
  size?: 'sm' | 'md'
  dot?: boolean
  /** Use on dark backgrounds */
  dark?: boolean
}

type StatusConfig = {
  label: string
  light: string
  lightDot: string
  dark: string
  darkDot: string
}

const STATUS_CONFIG: Record<BadgeStatus, StatusConfig> = {
  active: {
    label: 'Activo',
    light: 'bg-emerald-50 text-emerald-700',
    lightDot: 'bg-emerald-500',
    dark: 'bg-emerald-500/20 text-emerald-400',
    darkDot: 'bg-emerald-400',
  },
  pending: {
    label: 'Pendiente',
    light: 'bg-[#F4F6F9] text-[#6B7280]',
    lightDot: 'bg-[#9CA3AF]',
    dark: 'bg-white/10 text-white/50',
    darkDot: 'bg-white/30',
  },
  paused: {
    label: 'Pausado',
    light: 'bg-[#F4F6F9] text-[#6B7280]',
    lightDot: 'bg-[#9CA3AF]',
    dark: 'bg-white/10 text-white/50',
    darkDot: 'bg-white/30',
  },
  completed: {
    label: 'Completado',
    light: 'bg-[#F4F6F9] text-[#6B7280]',
    lightDot: 'bg-[#C8F135]',
    dark: 'bg-white/10 text-white/50',
    darkDot: 'bg-[#C8F135]',
  },
  error: {
    label: 'Error',
    light: 'bg-red-50 text-red-600',
    lightDot: 'bg-red-500',
    dark: 'bg-red-500/20 text-red-400',
    darkDot: 'bg-red-400',
  },
  overdue: {
    label: 'Vencido',
    light: 'bg-red-50 text-red-600',
    lightDot: 'bg-red-500',
    dark: 'bg-red-500/20 text-red-400',
    darkDot: 'bg-red-400',
  },
  in_progress: {
    label: 'En Proceso',
    light: 'bg-[#F4F6F9] text-[#6B7280]',
    lightDot: 'bg-[#C8F135]',
    dark: 'bg-white/10 text-white/50',
    darkDot: 'bg-[#C8F135]',
  },
  paid: {
    label: 'Pagado',
    light: 'bg-emerald-50 text-emerald-700',
    lightDot: 'bg-emerald-500',
    dark: 'bg-emerald-500/20 text-emerald-400',
    darkDot: 'bg-emerald-400',
  },
  resolved: {
    label: 'Resuelto',
    light: 'bg-emerald-50 text-emerald-700',
    lightDot: 'bg-emerald-500',
    dark: 'bg-emerald-500/20 text-emerald-400',
    darkDot: 'bg-emerald-400',
  },
  not_started: {
    label: 'No Iniciado',
    light: 'bg-[#F4F6F9] text-[#9CA3AF]',
    lightDot: 'bg-[#D1D5DB]',
    dark: 'bg-white/8 text-white/30',
    darkDot: 'bg-white/20',
  },
  cancelled: {
    label: 'Cancelado',
    light: 'bg-red-50 text-red-400',
    lightDot: 'bg-red-400',
    dark: 'bg-red-500/15 text-red-400',
    darkDot: 'bg-red-400',
  },
}

export function NodoBadge({ status, label, children, size = 'md', dot = true, dark = false }: NodoBadgeProps) {
  const config = status ? STATUS_CONFIG[status] : null
  const displayLabel = label || config?.label || children

  const className = config
    ? (dark ? config.dark : config.light)
    : (dark ? 'bg-white/10 text-white/50' : 'bg-[#F4F6F9] text-[#6B7280]')

  const dotClass = config
    ? (dark ? config.darkDot : config.lightDot)
    : (dark ? 'bg-white/30' : 'bg-[#9CA3AF]')

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${className}`}>
      {dot && status && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
      )}
      {displayLabel}
    </span>
  )
}
