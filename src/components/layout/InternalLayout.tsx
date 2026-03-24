import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCog, Puzzle, LogOut, Bot,
  Menu, X, ChevronLeft, ChevronRight, ShieldCheck, Flame,
  Eye, ArrowLeft, CheckSquare, CalendarDays, Workflow, Library, GraduationCap,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { NodoAvatar } from '../ui/NodoAvatar'

// ─── Nav structure ────────────────────────────────────────────────────────────
interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  adminOnly?: boolean
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/internal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/internal/clients',   icon: Users,           label: 'Clientes' },
    ],
  },
  {
    label: 'Ventas',
    items: [
      { to: '/internal/leads',     icon: Flame,    label: 'Pipeline',   adminOnly: true },
      { to: '/internal/sequences', icon: Workflow, label: 'Secuencias', adminOnly: true },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/internal/tasks',    icon: CheckSquare, label: 'Tareas' },
      { to: '/internal/calendar', icon: CalendarDays, label: 'Calendario' },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { to: '/internal/resources', icon: Library,      label: 'Recursos' },
      { to: '/internal/guias',     icon: GraduationCap, label: 'Guías de uso', adminOnly: true },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/internal/plugs', icon: Puzzle,  label: 'Plugs' },
      { to: '/internal/team',  icon: UserCog, label: 'Equipo', adminOnly: true },
    ],
  },
]

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  tecnico: 'Técnico',
}

export function InternalLayout() {
  const { user, originalUser, signOut, startImpersonation, stopImpersonation } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const isSuperAdmin = user?.role === 'superadmin' || originalUser?.role === 'superadmin'
  const isAdmin      = user?.role === 'admin' || user?.role === 'superadmin'
  const isTecnicoPreview = !!originalUser && user?.role === 'tecnico'

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 flex-shrink-0 ${collapsed && !mobile ? 'justify-center px-2' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-[#C8F135] flex items-center justify-center flex-shrink-0">
          <Bot size={17} className="text-[#1A1F2E]" />
        </div>
        {(!collapsed || mobile) && (
          <div className="flex-1">
            <p className="text-sm font-bold text-white leading-none tracking-wide">NODO OS</p>
            <p className="text-[10px] text-white/40 leading-none mt-0.5 font-medium">Panel Interno</p>
          </div>
        )}
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-white/40 hover:text-white p-1">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="h-px bg-white/8 mx-3 mb-2" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {NAV_GROUPS.map((group, gi) => {
          const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin)
          if (visibleItems.length === 0) return null

          return (
            <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
              {/* Group label */}
              {group.label && (!collapsed || mobile) && (
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-3 pt-3 pb-1">
                  {group.label}
                </p>
              )}
              {group.label && collapsed && !mobile && (
                <div className="h-px bg-white/8 mx-1 my-2" />
              )}

              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => mobile && setMobileOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 rounded-xl transition-all duration-150
                      ${collapsed && !mobile ? 'px-0 justify-center py-2.5' : 'px-3 py-2.5'}
                      ${isActive
                        ? 'bg-[#C8F135] text-[#1A1F2E] font-bold'
                        : 'text-white/50 hover:text-white hover:bg-white/6'
                      }
                    `}
                    title={collapsed && !mobile ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={15} className="flex-shrink-0" />
                        {(!collapsed || mobile) && (
                          <span className={`text-sm ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}

        {/* Super Admin section */}
        {(isSuperAdmin && !isTecnicoPreview) && (
          <div className="mt-3">
            <div className="h-px bg-white/8 mx-1 mb-2" />
            {(!collapsed || mobile) && (
              <p className="text-[9px] font-bold text-violet-400/40 uppercase tracking-widest px-3 pb-1">
                Super Admin
              </p>
            )}
            <NavLink
              to="/internal/superadmin"
              onClick={() => mobile && setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-xl transition-all duration-150
                ${collapsed && !mobile ? 'px-0 justify-center py-2.5' : 'px-3 py-2.5'}
                ${isActive
                  ? 'bg-violet-500/25 text-violet-300 font-bold border border-violet-500/25'
                  : 'text-violet-400/50 hover:text-violet-300 hover:bg-violet-500/10'
                }
              `}
              title={collapsed && !mobile ? 'Super Admin' : undefined}
            >
              {() => (
                <>
                  <ShieldCheck size={15} className="flex-shrink-0" />
                  {(!collapsed || mobile) && <span className="text-sm">Super Admin</span>}
                </>
              )}
            </NavLink>
            <button
              onClick={() => { startImpersonation('tecnico'); mobile && setMobileOpen(false) }}
              className={`
                flex items-center gap-3 rounded-xl transition-all duration-150 w-full mt-0.5
                ${collapsed && !mobile ? 'px-0 justify-center py-2.5' : 'px-3 py-2.5'}
                text-amber-400/50 hover:text-amber-300 hover:bg-amber-500/10
              `}
              title={collapsed && !mobile ? 'Ver como técnico' : undefined}
            >
              <Eye size={15} className="flex-shrink-0" />
              {(!collapsed || mobile) && <span className="text-sm">Ver como técnico</span>}
            </button>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 p-2">
        <div className="h-px bg-white/8 mb-2" />

        {(!collapsed || mobile) && user?.profile && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1">
            <NodoAvatar name={user.profile.full_name} src={user.profile.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.profile.full_name}</p>
              <p className="text-[10px] capitalize" style={{ color: isSuperAdmin ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
                {ROLE_LABELS[user.profile.role] ?? user.profile.role}
              </p>
            </div>
          </div>
        )}

        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-2 text-white/40 hover:text-white transition-colors rounded-xl hover:bg-white/6 w-full text-xs
              ${collapsed ? 'justify-center p-2.5' : 'px-2 py-2'}
            `}
          >
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Colapsar</span></>}
          </button>
        )}

        <button
          onClick={handleSignOut}
          className={`flex items-center gap-2 text-white/40 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/8 w-full mt-0.5 text-xs
            ${collapsed && !mobile ? 'justify-center p-2.5' : 'px-2 py-2'}
          `}
        >
          <LogOut size={14} />
          {(!collapsed || mobile) && <span>Cerrar sesión</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-[#F4F6F9] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-[#1E2433] transition-all duration-200 flex-shrink-0 ${collapsed ? 'w-14' : 'w-56'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#1E2433] transition-transform duration-250 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent mobile />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#1E2433] flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-white/50 hover:text-white transition-colors p-1 rounded-lg">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#C8F135] flex items-center justify-center">
              <Bot size={12} className="text-[#1A1F2E]" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">NODO OS</span>
          </div>
          <div className="w-8" />
        </header>

        {/* Banner modo técnico */}
        {isTecnicoPreview && (
          <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/25 flex-shrink-0">
            <div className="flex items-center gap-2 text-amber-400 text-xs">
              <Eye size={13} />
              <span>Vista previa como <strong>Técnico</strong> — las opciones de admin están ocultas</span>
            </div>
            <button onClick={stopImpersonation} className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors">
              <ArrowLeft size={12} /> Volver a Superadmin
            </button>
          </div>
        )}

        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
