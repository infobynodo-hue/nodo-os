interface NodoAvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

function getInitials(name: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getColor(name: string) {
  const colors = [
    'from-[#E040A0] to-[#C026A8]',
    'from-[#C026A8] to-[#8B22E8]',
    'from-[#8B22E8] to-[#6366f1]',
    'from-[#E040A0] to-[#8B22E8]',
  ]
  if (!name) return colors[0]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export function NodoAvatar({ name, src, size = 'md', className = '' }: NodoAvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover flex-shrink-0 ${sizes[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 bg-gradient-to-br ${getColor(name)} ${sizes[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}
