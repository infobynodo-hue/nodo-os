import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import type { UserRole } from '../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, initialized, originalUser } = useAuthStore()

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#08070F]">
        <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // superadmin impersonando: acceso total a cualquier ruta
  if (originalUser?.role === 'superadmin') {
    return <>{children}</>
  }

  // superadmin tiene acceso a todas las rutas internas
  const effectiveRole = user.role === 'superadmin' && allowedRoles.includes('admin')
    ? 'admin'
    : user.role

  if (!allowedRoles.includes(effectiveRole) && !allowedRoles.includes(user.role)) {
    // Redirigir al dashboard correspondiente
    if (user.role === 'client') {
      return <Navigate to="/client/dashboard" replace />
    }
    return <Navigate to="/internal/dashboard" replace />
  }

  return <>{children}</>
}
