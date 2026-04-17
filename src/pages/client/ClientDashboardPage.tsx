import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  ChevronRight,
  CheckSquare,
  ArrowRight,
  Bell,
  FileText,
  Link2,
  Video,
  Key,
  Package,
  Calendar,
  Folder,
  X,
  CheckCheck,
  AlertTriangle,
  Info,
  Zap,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { DEMO_CLIENTS, DEMO_PROJECTS, DEMO_TASKS, DEMO_BILLING } from '../../lib/demo'
import { NodoProgressBar } from '../../components/ui/NodoProgressBar'
import { NodoBadge } from '../../components/ui/NodoBadge'
import { SERVICE_LABELS } from '../../types'
import type {
  Project,
  Client,
  Task,
  BillingRecord,
  ClientNotification,
  ProjectDeliverable,
} from '../../types'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

// Demo notifications
const DEMO_NOTIFICATIONS: ClientNotification[] = [
  {
    id: 'n1',
    client_id: 'demo',
    title: 'Tu agente está listo',
    body: 'El equipo de NODO ONE ha finalizado la configuración de tu empleado digital.',
    type: 'success',
    action_url: '/client/bot',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'n2',
    client_id: 'demo',
    title: 'Nueva factura disponible',
    body: 'Tu mensualidad de marzo ya está disponible en el apartado de facturación.',
    type: 'action',
    action_url: '/client/billing',
    is_read: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'n3',
    client_id: 'demo',
    title: 'Actualización de conocimiento',
    body: 'Hemos actualizado la base de conocimiento de tu agente con los nuevos precios.',
    type: 'info',
    is_read: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
]

// Demo deliverables
const DEMO_DELIVERABLES: ProjectDeliverable[] = [
  {
    id: 'd1',
    project_id: 'demo',
    phase_number: 1,
    title: 'Propuesta comercial firmada',
    type: 'documento',
    published: true,
    created_at: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: 'd2',
    project_id: 'demo',
    phase_number: 2,
    title: 'Acceso al panel de WhatsApp Business',
    type: 'acceso',
    published: true,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'd3',
    project_id: 'demo',
    phase_number: 3,
    title: 'Video tutorial del agente',
    type: 'video',
    published: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

function deliverableIcon(type: ProjectDeliverable['type']) {
  switch (type) {
    case 'documento': return <FileText size={14} className="text-[#C026A8]" />
    case 'link': return <Link2 size={14} className="text-blue-400" />
    case 'video': return <Video size={14} className="text-violet-400" />
    case 'acceso': return <Key size={14} className="text-amber-400" />
    default: return <Package size={14} className="text-[#6B6B80]" />
  }
}

function notificationIcon(type: ClientNotification['type']) {
  switch (type) {
    case 'success': return <CheckSquare size={13} className="text-emerald-400" />
    case 'warning': return <AlertTriangle size={13} className="text-amber-400" />
    case 'action': return <Zap size={13} className="text-[#C026A8]" />
    default: return <Info size={13} className="text-blue-400" />
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

interface DashboardData {
  client: Client | null
  project: Project | null
  pendingTasks: Task[]
  nextBilling: BillingRecord | null
  notifications: ClientNotification[]
  deliverables: ProjectDeliverable[]
  unreadCount: number
}

export function ClientDashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData>({
    client: null,
    project: null,
    pendingTasks: [],
    nextBilling: null,
    notifications: [],
    deliverables: [],
    unreadCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [markingRead, setMarkingRead] = useState(false)

  useEffect(() => {
    loadData()
  }, [user?.id])

  async function loadData() {
    setLoading(true)
    try {
      if (IS_DEMO) {
        const demoClient = DEMO_CLIENTS[0]
        const demoProject = DEMO_PROJECTS[0]
        const pendingTasks = DEMO_TASKS.filter(t => t.assigned_to === 'client' && !t.is_completed)
        const nextBilling = DEMO_BILLING.find(b => b.status === 'pending') || null
        setData({
          client: demoClient,
          project: demoProject,
          pendingTasks,
          nextBilling,
          notifications: DEMO_NOTIFICATIONS,
          deliverables: DEMO_DELIVERABLES,
          unreadCount: DEMO_NOTIFICATIONS.filter(n => !n.is_read).length,
        })
        setLoading(false)
        return
      }
      if (!user?.clientId || !user?.projectId) { setLoading(false); return }
      const [clientRes, projectRes, tasksRes, billingRes, notifRes, delivRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', user.clientId).single(),
        supabase.from('projects').select('*').eq('id', user.projectId).single(),
        supabase.from('tasks').select('*').eq('project_id', user.projectId).eq('assigned_to', 'client').eq('is_enabled', true).eq('is_completed', false).order('order_index'),
        supabase.from('billing_records').select('*').eq('project_id', user.projectId).eq('status', 'pending').order('due_date').limit(1).single(),
        supabase.from('client_notifications').select('*').eq('client_id', user.clientId).order('created_at', { ascending: false }).limit(10),
        supabase.from('project_deliverables').select('*').eq('project_id', user.projectId).eq('published', true).order('created_at', { ascending: false }).limit(3),
      ])
      const notifs: ClientNotification[] = notifRes.data || []
      setData({
        client: clientRes.data,
        project: projectRes.data,
        pendingTasks: tasksRes.data || [],
        nextBilling: billingRes.data || null,
        notifications: notifs,
        deliverables: delivRes.data || [],
        unreadCount: notifs.filter(n => !n.is_read).length,
      })
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    if (IS_DEMO) {
      setData(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0,
      }))
      return
    }
    if (!user?.clientId) return
    setMarkingRead(true)
    await supabase
      .from('client_notifications')
      .update({ is_read: true })
      .eq('client_id', user.clientId)
      .eq('is_read', false)
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
    setMarkingRead(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { client, project, pendingTasks, nextBilling, notifications, deliverables, unreadCount } = data
  const agentName = project?.service_type === 'bpo_lucia' ? 'Lucía' : 'Claudia'
  const totalPhases = project?.service_type === 'bpo_claudia' ? 7 : project?.service_type === 'bpo_lucia' ? 6 : 5

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 fade-in w-full">

      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-widest">Bienvenido</p>
          <h1 className="text-xl font-bold text-[#1A1827] leading-tight">
            Hola, {client?.business_name || 'Cliente'}
          </h1>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="relative w-10 h-10 rounded-xl bg-white border border-[#E8E6F0] flex items-center justify-center text-[#6B6B80] hover:text-[#1A1827] hover:border-[#C026A8]/40 transition-all"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C026A8] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-[#E8E6F0] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6F0]">
                <p className="text-sm font-semibold text-[#1A1827]">Notificaciones</p>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      disabled={markingRead}
                      className="flex items-center gap-1 text-[10px] text-[#C026A8] hover:text-[#E040A0] transition-colors font-medium"
                    >
                      <CheckCheck size={11} />
                      Marcar todas leídas
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-[#6B6B80] hover:text-[#1A1827]">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#6B6B80] text-center py-8">Sin notificaciones</p>
                ) : (
                  notifications.slice(0, 8).map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        setShowNotifications(false)
                        if (notif.action_url) navigate(notif.action_url)
                      }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-[#E8E6F0] last:border-0 transition-colors hover:bg-[#F4F3F9] ${!notif.is_read ? 'bg-[#C026A8]/5' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        notif.type === 'success' ? 'bg-emerald-500/10'
                        : notif.type === 'warning' ? 'bg-amber-500/10'
                        : notif.type === 'action' ? 'bg-[#C026A8]/10'
                        : 'bg-blue-500/10'
                      }`}>
                        {notificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-semibold truncate ${!notif.is_read ? 'text-[#1A1827]' : 'text-[#4D4B60]'}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C026A8] flex-shrink-0" />
                          )}
                        </div>
                        {notif.body && (
                          <p className="text-[11px] text-[#6B6B80] mt-0.5 line-clamp-2">{notif.body}</p>
                        )}
                        <p className="text-[10px] text-[#6B6B80]/60 mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      {project && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* Progreso */}
          <div className="bg-white border border-[#E8E6F0] rounded-xl p-3">
            <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Progreso</p>
            <p className="text-2xl font-bold gradient-text">{project.progress_pct}%</p>
            <p className="text-[10px] text-[#6B6B80] mt-0.5">del proyecto</p>
          </div>
          {/* Fase actual */}
          <div className="bg-white border border-[#E8E6F0] rounded-xl p-3">
            <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Fase actual</p>
            <p className="text-2xl font-bold text-[#1A1827]">
              <span className="gradient-text">{project.current_phase}</span>
              <span className="text-base text-[#6B6B80]">/{totalPhases}</span>
            </p>
            <p className="text-[10px] text-[#6B6B80] mt-0.5">en progreso</p>
          </div>
          {/* Agente */}
          <div className="bg-white border border-[#E8E6F0] rounded-xl p-3">
            <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Agente</p>
            <p className="text-sm font-bold text-[#1A1827] truncate">{agentName}</p>
            <NodoBadge status={project.status} size="sm" />
          </div>
          {/* Próxima factura */}
          <div className="bg-white border border-[#E8E6F0] rounded-xl p-3">
            <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Próxima factura</p>
            {nextBilling ? (
              <>
                <p className="text-lg font-bold text-amber-400">€{nextBilling.amount.toLocaleString()}</p>
                <p className="text-[10px] text-[#6B6B80] mt-0.5">
                  {new Date(nextBilling.due_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-emerald-400">Al día ✓</p>
                <p className="text-[10px] text-[#6B6B80] mt-0.5">sin pendientes</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Progress bar (inline, no card duplicado) ────────────────────────── */}
      {project && (
        <div className="rounded-2xl border border-[#E8E6F0] bg-white p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#6B6B80]">{SERVICE_LABELS[project.service_type]} · Fase {project.current_phase} de {totalPhases}</p>
            <button onClick={() => navigate('/client/project')} className="flex items-center gap-1 text-[10px] text-[#C026A8] hover:text-[#E040A0] transition-colors font-medium">
              Ver fases <ChevronRight size={11} />
            </button>
          </div>
          <NodoProgressBar value={project.progress_pct} size="md" />
        </div>
      )}

      {/* ── Últimos entregables ─────────────────────────────────────────────── */}
      {deliverables.length > 0 && (
        <div className="rounded-2xl border border-[#E8E6F0] bg-white p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <Folder size={13} className="text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-[#1A1827]">Últimos entregables</p>
            </div>
            <button
              onClick={() => navigate('/client/docs')}
              className="flex items-center gap-1 text-[10px] text-[#C026A8] hover:text-[#E040A0] transition-colors font-medium"
            >
              Ver todos <ArrowRight size={10} />
            </button>
          </div>
          <div className="space-y-2">
            {deliverables.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-center gap-3 py-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#F4F3F9] border border-[#E8E6F0] flex items-center justify-center flex-shrink-0">
                  {deliverableIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1A1827] truncate">{item.title}</p>
                  {item.phase_number && (
                    <p className="text-[10px] text-[#6B6B80]">Fase {item.phase_number} · {timeAgo(item.created_at)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Acciones rápidas (2 únicamente) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => navigate('/client/chat')}
          className="rounded-2xl border border-[#C026A8]/25 p-4 text-left transition-all hover:border-[#C026A8]/50 hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, #F0EEF8 0%, #F7F6FC 100%)' }}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E040A0] to-[#8B22E8] flex items-center justify-center mb-3 shadow-lg shadow-[#C026A8]/30">
            <MessageSquare size={19} className="text-white" />
          </div>
          <p className="text-sm font-bold text-[#1A1827]">Gestionar a {agentName}</p>
          <p className="text-xs text-[#6B6B80] mt-0.5 leading-snug">Añade información, corrige respuestas o solicita cambios</p>
        </button>

        <button
          onClick={() => window.open('https://wa.link/nbrnmq', '_blank')}
          className="rounded-2xl border border-blue-500/20 p-4 text-left transition-all hover:border-blue-500/40 hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, #EEF2F8 0%, #F7F6FC 100%)' }}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/25">
            <Calendar size={19} className="text-white" />
          </div>
          <p className="text-sm font-bold text-[#1A1827]">Hablar con tu gestor</p>
          <p className="text-xs text-[#6B6B80] mt-0.5 leading-snug">Resuelve dudas o coordina cambios con NODO ONE</p>
        </button>
      </div>

      {/* ── Tareas pendientes ───────────────────────────────────────────────── */}
      {pendingTasks.length > 0 && (
        <div className="rounded-2xl border border-[#E8E6F0] bg-white p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#C026A8]/15 flex items-center justify-center">
                <CheckSquare size={13} className="text-[#C026A8]" />
              </div>
              <p className="text-sm font-semibold text-[#1A1827]">Tareas pendientes</p>
            </div>
            <span className="text-xs font-bold text-[#C026A8] bg-[#C026A8]/12 border border-[#C026A8]/25 px-2.5 py-0.5 rounded-full">
              {pendingTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-1.5">
                <div className="w-4 h-4 rounded border border-[#C026A8]/30 flex-shrink-0" />
                <p className="text-sm text-[#B8B6C8] flex-1">{task.title}</p>
              </div>
            ))}
          </div>
          {pendingTasks.length > 3 && (
            <button
              onClick={() => navigate('/client/project')}
              className="flex items-center gap-1 text-xs text-[#C026A8] hover:text-[#E040A0] mt-2 transition-colors"
            >
              +{pendingTasks.length - 3} más <ArrowRight size={11} />
            </button>
          )}
        </div>
      )}

    </div>
  )
}
