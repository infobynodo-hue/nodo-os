import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, FolderKanban,
  CreditCard, LogOut, Eye, ArrowLeft, Folder,
  ChevronLeft, ChevronRight, Menu, X, GraduationCap,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { NodoIsotipo } from '../ui/NodoIsotipo'

const NAV_ITEMS = [
  { to: '/client/dashboard', icon: LayoutDashboard,  label: 'Inicio' },
  { to: '/client/chat',      icon: MessageSquare,    label: 'Chat con el agente' },
  { to: '/client/project',   icon: FolderKanban,     label: 'Mi proyecto' },
  { to: '/client/academia',  icon: GraduationCap,    label: 'Guías de uso' },
  { to: '/client/docs',      icon: Folder,           label: 'Documentos' },
  { to: '/client/billing',   icon: CreditCard,       label: 'Facturación' },
]

export function ClientLayout() {
  const { user, originalUser, signOut, stopImpersonation } = useAuthStore()
  const navigate = useNavigate()
  const isImpersonating = !!originalUser
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => { await signOut(); navigate('/login') }
  const handleStopImpersonation = () => { stopImpersonation(); navigate('/internal/dashboard') }

  return (
    <div className="flex h-screen bg-[#F7F6FC] overflow-hidden">

      {/* ── Sidebar desktop ─────────────────────────────── */}
      <aside className={`hidden md:flex flex-col flex-shrink-0 border-r border-[#E8E6F0] bg-white transition-all duration-200 ${collapsed ? 'w-[64px]' : 'w-[220px]'}`}>
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-[#E8E6F0] ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <NodoIsotipo size={28} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#1A1827] leading-none tracking-wide">NODO ONE</p>
              <p className="text-[10px] text-[#6B6B80] leading-none mt-0.5">Portal Cliente</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-[#C026A8]/12 to-[#8B22E8]/8 text-[#C026A8] border border-[#C026A8]/20'
                    : 'text-[#6B6B80] hover:text-[#1A1827] hover:bg-[#F4F3F9]'
                }`
              }
            >
              <item.icon size={16} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-4 space-y-1 border-t border-[#E8E6F0] pt-3">
          {!collapsed && (
            <div className="px-3 py-1.5">
              <p className="text-[10px] text-[#6B6B80] truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6B6B80] hover:text-red-400 hover:bg-red-500/5 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={15} className="flex-shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#6B6B80] hover:text-[#1A1827] hover:bg-[#F4F3F9] transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Colapsar</span></>}
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ───────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-white border-r border-[#E8E6F0]">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#E8E6F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center">
                  <NodoIsotipo size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1827]">NODO ONE</p>
                  <p className="text-[10px] text-[#6B6B80]">Portal Cliente</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-[#6B6B80] hover:text-[#1A1827]">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isActive ? 'bg-[#C026A8]/12 text-[#C026A8] border border-[#C026A8]/20' : 'text-[#6B6B80] hover:text-[#1A1827] hover:bg-[#F4F3F9]'
                    }`
                  }
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="px-2 pb-4 border-t border-[#E8E6F0] pt-3">
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6B6B80] hover:text-red-400 hover:bg-red-500/5 transition-colors">
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Impersonation banner */}
        {isImpersonating && (
          <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/25 flex-shrink-0">
            <div className="flex items-center gap-2 text-amber-400 text-xs">
              <Eye size={13} />
              <span>Vista previa del portal de cliente</span>
            </div>
            <button onClick={handleStopImpersonation} className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs font-medium">
              <ArrowLeft size={12} /> Volver a Superadmin
            </button>
          </div>
        )}

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#E8E6F0] bg-white flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-[#6B6B80] hover:text-[#1A1827]">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <NodoIsotipo size={22} />
            <span className="text-sm font-bold text-[#1A1827]">NODO ONE</span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
