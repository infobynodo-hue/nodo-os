import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, LayoutDashboard, GitBranch, MessageSquare,
  Brain, Send, CreditCard, Puzzle, MoreVertical, Pencil, Power,
  Upload, Loader2, Sparkles, FileDown,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { DEMO_CLIENTS, DEMO_PROJECTS, DEMO_PHASES, DEMO_TASKS, DEMO_BILLING, DEMO_BOT_KNOWLEDGE } from '../../lib/demo'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL
import { NodoCard } from '../../components/ui/NodoCard'
import { NodoBadge } from '../../components/ui/NodoBadge'
import { NodoProgressBar } from '../../components/ui/NodoProgressBar'
import { NodoAvatar } from '../../components/ui/NodoAvatar'
import { SERVICE_LABELS, PLUGS, KNOWLEDGE_CATEGORY_LABELS } from '../../types'
import type {
  Client, Project, ProjectPhase, Task, BillingRecord,
  BotKnowledge, PlugRequest, ProjectPlug, KnowledgeCategory
} from '../../types'

type Tab = 'resumen' | 'fases' | 'onboarding' | 'bot' | 'solicitudes' | 'facturacion' | 'plugs'

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('resumen')
  const [loading, setLoading] = useState(true)

  // Data
  const [client, setClient] = useState<Client | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<ProjectPhase[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [billing, setBilling] = useState<BillingRecord[]>([])
  const [knowledge, setKnowledge] = useState<BotKnowledge[]>([])
  const [requests, setRequests] = useState<PlugRequest[]>([])
  const [plugs, setPlugs] = useState<ProjectPlug[]>([])
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [healthScore, setHealthScore] = useState<{
    score: number
    score_progress: number
    score_activity: number
    score_response: number
    score_billing: number
    score_nps: number
    trend: string
    overdue_tasks: number
    pending_requests_48h: number
  } | null>(null)

  useEffect(() => {
    if (id) loadAll()
  }, [id])

  async function loadAll() {
    if (!id) return
    setLoading(true)

    if (IS_DEMO) {
      const demoClient = DEMO_CLIENTS.find(c => c.id === id) || DEMO_CLIENTS[0]
      const demoProject = DEMO_PROJECTS.find(p => p.client_id === demoClient.id) || DEMO_PROJECTS[0]
      setClient(demoClient)
      setProject(demoProject)
      setPhases(DEMO_PHASES.filter(p => p.project_id === demoProject.id))
      setTasks(DEMO_TASKS.filter(t => t.project_id === demoProject.id))
      setBilling(DEMO_BILLING.filter(b => b.project_id === demoProject.id))
      setKnowledge(DEMO_BOT_KNOWLEDGE.filter(k => k.project_id === demoProject.id))
      setRequests([])
      setPlugs([])
      setLoading(false)
      return
    }

    const [clientRes, projectRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('projects').select('*').eq('client_id', id).single(),
    ])
    setClient(clientRes.data)
    setProject(projectRes.data)

    if (projectRes.data?.id) {
      const pid = projectRes.data.id
      const [phasesRes, tasksRes, billingRes, knowledgeRes, requestsRes, plugsRes] = await Promise.all([
        supabase.from('project_phases').select('*').eq('project_id', pid).order('phase_number'),
        supabase.from('tasks').select('*').eq('project_id', pid).order('phase_number').order('order_index'),
        supabase.from('billing_records').select('*').eq('project_id', pid).order('period_month'),
        supabase.from('bot_knowledge').select('*').eq('project_id', pid).order('order_index'),
        supabase.from('plug_requests').select('*').eq('project_id', pid).order('created_at', { ascending: false }),
        supabase.from('project_plugs').select('*').eq('project_id', pid),
      ])
      setPhases(phasesRes.data || [])
      setTasks(tasksRes.data || [])
      setBilling(billingRes.data || [])
      setKnowledge(knowledgeRes.data || [])
      setRequests(requestsRes.data || [])
      setPlugs(plugsRes.data || [])

      // Health Score
      const { data: hs } = await supabase
        .from('client_health_scores')
        .select('score, score_progress, score_activity, score_response, score_billing, score_nps, trend, overdue_tasks, pending_requests_48h')
        .eq('project_id', pid)
        .single()
      if (hs) setHealthScore(hs)
    }
    setLoading(false)
  }

  async function toggleTask(taskId: string, field: 'is_enabled' | 'is_completed', value: boolean) {
    await supabase.from('tasks').update({ [field]: value }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t))
    if (field === 'is_completed' && project) {
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, is_completed: value } : t)
      const enabled = updatedTasks.filter(t => t.is_enabled)
      const completed = enabled.filter(t => t.is_completed)
      const pct = enabled.length > 0 ? Math.round((completed.length / enabled.length) * 100) : 0
      await supabase.from('projects').update({ progress_pct: pct }).eq('id', project.id)
      setProject(prev => prev ? { ...prev, progress_pct: pct } : prev)
    }
  }

  async function togglePlug(plugId: string, isEnabled: boolean) {
    const existing = plugs.find(p => p.plug_id === plugId)
    if (existing) {
      await supabase.from('project_plugs').update({ is_enabled: isEnabled }).eq('id', existing.id)
      setPlugs(prev => prev.map(p => p.plug_id === plugId ? { ...p, is_enabled: isEnabled } : p))
    } else if (project) {
      const { data } = await supabase.from('project_plugs').insert({
        project_id: project.id, plug_id: plugId, is_enabled: isEnabled, enabled_by: user?.id,
      }).select().single()
      if (data) setPlugs(prev => [...prev, data])
    }
  }

  async function updateBillingStatus(recordId: string, status: 'pending' | 'paid' | 'overdue') {
    await supabase.from('billing_records').update({
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
    }).eq('id', recordId)
    setBilling(prev => prev.map(r => r.id === recordId ? { ...r, status } : r))
  }

  async function updateRequestStatus(reqId: string, status: 'pending' | 'in_progress' | 'resolved') {
    await supabase.from('plug_requests').update({ status, resolved_by: user?.id, resolved_at: status === 'resolved' ? new Date().toISOString() : null }).eq('id', reqId)
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status } : r))
  }

  async function sendResponse(reqId: string) {
    if (!responseText.trim()) return
    await supabase.from('plug_requests').update({
      admin_response: responseText.trim(),
      status: 'resolved',
      resolved_by: user?.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', reqId)
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, admin_response: responseText.trim(), status: 'resolved' } : r))
    setRespondingTo(null)
    setResponseText('')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-[#C8F135] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!client) return <div className="p-6 text-[#9CA3AF]">Cliente no encontrado.</div>

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { id: 'fases', label: 'Fases y Tareas', icon: GitBranch },
    { id: 'onboarding', label: 'Onboarding', icon: MessageSquare },
    { id: 'bot', label: 'Base del Bot', icon: Brain },
    { id: 'solicitudes', label: `Solicitudes${requests.filter(r => r.status === 'pending').length > 0 ? ` (${requests.filter(r => r.status === 'pending').length})` : ''}`, icon: Send },
    { id: 'facturacion', label: 'Facturación', icon: CreditCard },
    { id: 'plugs', label: 'Plugs', icon: Puzzle },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[#E5E8EF] flex-shrink-0 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => navigate('/internal/clients')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#1A1F2E] hover:bg-[#F4F6F9] transition-all flex-shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <NodoAvatar name={client.business_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-[#1A1F2E] truncate">{client.business_name}</h1>
            {project && <NodoBadge status={project.status} />}
          </div>
          <p className="text-xs text-[#9CA3AF]">{client.sector} · {client.contact_name}</p>
        </div>
        {project && (
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[#9CA3AF]">{SERVICE_LABELS[project.service_type]}</p>
              <p className="text-xs text-[#9CA3AF]">Fase {project.current_phase}</p>
            </div>
            <div className="w-28">
              <NodoProgressBar value={project.progress_pct} size="sm" showLabel />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E8EF] overflow-x-auto flex-shrink-0 px-2 md:px-4 scrollbar-none bg-white">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs md:text-sm whitespace-nowrap border-b-2 transition-all ${
              tab === t.id
                ? 'border-[#1A1F2E] text-[#1A1F2E] font-semibold'
                : 'border-transparent text-[#9CA3AF] hover:text-[#374151]'
            }`}
          >
            <t.icon size={13} />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* RESUMEN */}
        {tab === 'resumen' && (
          <div className="space-y-4 fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NodoCard>
                <p className="text-xs text-[#9CA3AF] mb-1.5">Progreso</p>
                <p className="text-2xl font-black text-[#1A1F2E] leading-none">{project?.progress_pct ?? 0}%</p>
              </NodoCard>
              <NodoCard>
                <p className="text-xs text-[#9CA3AF] mb-1.5">Fase actual</p>
                <p className="text-2xl font-black text-[#1A1F2E] leading-none">{project?.current_phase ?? '-'}</p>
              </NodoCard>
              <NodoCard>
                <p className="text-xs text-[#9CA3AF] mb-1.5">Tareas activas</p>
                <p className="text-2xl font-black text-[#1A1F2E] leading-none">{tasks.filter(t => t.is_enabled && !t.is_completed).length}</p>
              </NodoCard>
              <NodoCard>
                <p className="text-xs text-[#9CA3AF] mb-1.5">Solicitudes</p>
                <p className="text-2xl font-black text-amber-500 leading-none">{requests.filter(r => r.status === 'pending').length}</p>
              </NodoCard>
            </div>

            {project && (
              <NodoCard>
                <p className="text-sm font-bold text-[#1A1F2E] mb-3">Progreso del proyecto</p>
                <NodoProgressBar value={project.progress_pct} size="lg" showLabel />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Servicio</p>
                    <p className="text-sm text-[#1A1F2E] font-semibold mt-0.5">{SERVICE_LABELS[project.service_type]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Duración</p>
                    <p className="text-sm text-[#1A1F2E] font-semibold mt-0.5">{project.duration_months} meses</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Inicio</p>
                    <p className="text-sm text-[#1A1F2E] font-semibold mt-0.5">{new Date(project.start_date).toLocaleDateString('es')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Precio/mes</p>
                    <p className="text-sm text-[#1A1F2E] font-semibold mt-0.5">${project.monthly_price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Total contrato</p>
                    <p className="text-sm text-[#1A1F2E] font-semibold mt-0.5">${project.total_price.toLocaleString()}</p>
                  </div>
                </div>
              </NodoCard>
            )}

            {healthScore && (
              <NodoCard>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-[#1A1F2E]">Health Score</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Índice de salud del cliente (0–100)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-black leading-none ${
                      healthScore.score >= 75 ? 'text-emerald-600' :
                      healthScore.score >= 50 ? 'text-yellow-500' : 'text-red-500'
                    }`}>{healthScore.score}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      healthScore.trend === 'up' ? 'bg-emerald-50 text-emerald-600' :
                      healthScore.trend === 'down' ? 'bg-red-50 text-red-500' :
                      'bg-[#F4F6F9] text-[#9CA3AF]'
                    }`}>
                      {healthScore.trend === 'up' ? '↑ Subiendo' : healthScore.trend === 'down' ? '↓ Bajando' : '→ Estable'}
                    </span>
                  </div>
                </div>

                {/* Sub-scores */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[
                    { label: 'Progreso', value: healthScore.score_progress, max: 30, icon: '📈' },
                    { label: 'Actividad', value: healthScore.score_activity, max: 15, icon: '💬' },
                    { label: 'Respuesta', value: healthScore.score_response, max: 15, icon: '⚡' },
                    { label: 'Pagos', value: healthScore.score_billing, max: 20, icon: '💳' },
                    { label: 'NPS', value: healthScore.score_nps, max: 20, icon: '⭐' },
                  ].map(({ label, value, max, icon }) => {
                    const pct = Math.round((value / max) * 100)
                    return (
                      <div key={label} className="bg-[#F8F9FC] rounded-xl p-3 text-center">
                        <p className="text-base mb-0.5">{icon}</p>
                        <p className={`text-lg font-black leading-none ${
                          pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'
                        }`}>{value}<span className="text-[10px] text-[#9CA3AF] font-normal">/{max}</span></p>
                        <p className="text-[10px] text-[#9CA3AF] font-medium mt-1 uppercase tracking-wide leading-tight">{label}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Alertas */}
                {(healthScore.overdue_tasks > 0 || healthScore.pending_requests_48h > 0) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {healthScore.overdue_tasks > 0 && (
                      <span className="text-xs bg-red-50 text-red-500 px-2.5 py-1 rounded-full font-medium">
                        ⚠ {healthScore.overdue_tasks} tarea{healthScore.overdue_tasks > 1 ? 's' : ''} vencida{healthScore.overdue_tasks > 1 ? 's' : ''}
                      </span>
                    )}
                    {healthScore.pending_requests_48h > 0 && (
                      <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-medium">
                        ⏱ {healthScore.pending_requests_48h} solicitud{healthScore.pending_requests_48h > 1 ? 'es' : ''} sin responder +48h
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-[#F4F6F9]">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>≥75 Excelente</span>
                  <span className="flex items-center gap-1.5 text-xs text-yellow-500"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"/>50–74 Atención</span>
                  <span className="flex items-center gap-1.5 text-xs text-red-500"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>&lt;50 Crítico</span>
                </div>
              </NodoCard>
            )}

            <NodoCard>
              <p className="text-sm font-bold text-[#1A1F2E] mb-3">Datos de contacto</p>
              <div className="space-y-2">
                {[
                  ['Email', client.contact_email],
                  ['Teléfono', client.contact_phone],
                  ['País', client.country],
                  ['Sector', client.sector],
                ].map(([label, value]) => value && (
                  <div key={label} className="flex items-center justify-between py-1 border-b border-[#F4F6F9] last:border-0">
                    <span className="text-xs text-[#9CA3AF]">{label}</span>
                    <span className="text-xs text-[#374151] font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </NodoCard>
          </div>
        )}

        {/* FASES Y TAREAS */}
        {tab === 'fases' && (
          <div className="space-y-4 fade-in">
            {phases.map((phase) => {
              const phaseTasks = tasks.filter(t => t.phase_number === phase.phase_number)
              return (
                <NodoCard key={phase.id} padding="none">
                  <div className="flex items-center justify-between p-4 border-b border-[#F4F6F9]">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        phase.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        phase.status === 'in_progress' ? 'bg-[#C8F135]/20 text-[#4B5563]' :
                        'bg-[#F4F6F9] text-[#9CA3AF]'
                      }`}>{phase.phase_number}</div>
                      <div>
                        <p className="text-sm font-semibold text-[#1A1F2E]">{phase.phase_name}</p>
                        <p className="text-xs text-[#9CA3AF]">{phaseTasks.filter(t => t.is_completed).length}/{phaseTasks.length} tareas</p>
                      </div>
                    </div>
                    <NodoBadge status={phase.status} size="sm" />
                  </div>
                  <div className="divide-y divide-[#F4F6F9]">
                    {phaseTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                          task.assigned_to === 'client' ? 'bg-violet-100 text-violet-600' : 'bg-[#F4F6F9] text-[#6B7280]'
                        }`}>
                          {task.assigned_to === 'client' ? 'Cliente' : 'Interno'}
                        </div>
                        <p className={`flex-1 text-sm ${task.is_completed ? 'line-through text-[#9CA3AF]' : 'text-[#374151]'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleTask(task.id, 'is_enabled', !task.is_enabled)}
                            className={`text-xs px-2 py-1 rounded transition-colors border ${
                              task.is_enabled
                                ? 'bg-[#C8F135]/10 text-[#4B5563] border-[#C8F135]/40 hover:bg-[#C8F135]/20'
                                : 'bg-white text-[#9CA3AF] border-[#E5E8EF] hover:border-[#C8F135]/40'
                            }`}
                            title={task.is_enabled ? 'Desactivar tarea' : 'Activar tarea'}
                          >
                            <Power size={12} />
                          </button>
                          {task.is_enabled && (
                            <button
                              onClick={() => toggleTask(task.id, 'is_completed', !task.is_completed)}
                              className={`text-xs px-2 py-1 rounded transition-colors border ${
                                task.is_completed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-white text-[#6B7280] border-[#E5E8EF] hover:border-[#C8F135]/40'
                              }`}
                            >
                              {task.is_completed ? '✓ Hecha' : 'Marcar'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </NodoCard>
              )
            })}
          </div>
        )}

        {/* ONBOARDING */}
        {tab === 'onboarding' && (
          <div className="fade-in">
            <OnboardingTab
              projectId={project?.id}
              businessName={client?.business_name}
              contactName={client?.contact_name}
            />
          </div>
        )}

        {/* BASE DEL BOT */}
        {tab === 'bot' && (
          <div className="fade-in">
            <BotKnowledgeTab
              knowledge={knowledge}
              projectId={project?.id}
              onUpdate={(items) => setKnowledge(items)}
            />
          </div>
        )}

        {/* SOLICITUDES */}
        {tab === 'solicitudes' && (
          <div className="space-y-3 fade-in">
            <p className="text-sm text-[#9CA3AF]">{requests.length} solicitud{requests.length !== 1 ? 'es' : ''} · {requests.filter(r => r.status === 'pending').length} pendiente{requests.filter(r => r.status === 'pending').length !== 1 ? 's' : ''}</p>
            {requests.length === 0 ? (
              <NodoCard className="text-center py-8">
                <p className="text-sm text-[#9CA3AF]">No hay solicitudes todavía.</p>
              </NodoCard>
            ) : requests.map((req) => (
              <NodoCard key={req.id} padding="md">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <NodoBadge status={req.status} size="sm" />
                      <p className="text-sm font-semibold text-[#1A1F2E]">{req.plug_label}</p>
                    </div>
                    <p className="text-xs text-[#9CA3AF]">
                      {new Date(req.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })} · {new Date(req.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* Quick status */}
                  {req.status !== 'resolved' && respondingTo !== req.id && (
                    <div className="flex gap-1 flex-shrink-0">
                      {req.status === 'pending' && (
                        <button
                          onClick={() => updateRequestStatus(req.id, 'in_progress')}
                          className="text-xs px-2 py-1 bg-[#F4F6F9] text-[#374151] border border-[#E5E8EF] rounded-lg hover:border-[#C8F135]/40 transition-colors whitespace-nowrap"
                        >
                          En proceso
                        </button>
                      )}
                      <button
                        onClick={() => { setRespondingTo(req.id); setResponseText('') }}
                        className="text-xs px-2 py-1 bg-[#1E2433] text-white rounded-lg hover:bg-[#252D3D] transition-colors whitespace-nowrap"
                      >
                        Responder
                      </button>
                    </div>
                  )}
                </div>

                {/* Summary del cliente */}
                {req.summary && (
                  <pre className="text-xs text-[#374151] bg-[#F4F6F9] border border-[#E5E8EF] rounded-xl p-3 overflow-auto max-h-36 font-mono mb-2">
                    {JSON.stringify(req.summary, null, 2)}
                  </pre>
                )}

                {/* Respuesta ya enviada */}
                {req.admin_response && respondingTo !== req.id && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-2">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Tu respuesta</p>
                    <p className="text-xs text-emerald-800">{req.admin_response}</p>
                  </div>
                )}

                {/* Formulario de respuesta */}
                {respondingTo === req.id && (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      rows={3}
                      placeholder="Escribe tu respuesta al cliente..."
                      autoFocus
                      className="w-full bg-white border border-[#E5E8EF] rounded-xl px-3 py-2.5 text-sm text-[#1A1F2E] placeholder-[#9CA3AF] outline-none focus:border-[#C8F135] focus:ring-2 focus:ring-[#C8F135]/15 resize-none transition-all"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setRespondingTo(null); setResponseText('') }}
                        className="text-xs px-3 py-1.5 text-[#6B7280] border border-[#E5E8EF] rounded-lg hover:bg-[#F4F6F9] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => sendResponse(req.id)}
                        disabled={!responseText.trim()}
                        className="text-xs px-3 py-1.5 bg-[#C8F135] text-[#1A1F2E] font-semibold rounded-lg hover:bg-[#D4F53C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Enviar y resolver
                      </button>
                    </div>
                  </div>
                )}
              </NodoCard>
            ))}
          </div>
        )}

        {/* FACTURACIÓN */}
        {tab === 'facturacion' && (
          <div className="space-y-2 fade-in">
            {billing.map((record) => (
              <NodoCard key={record.id} padding="md">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1A1F2E]">Mes {record.period_month}</p>
                    <p className="text-xs text-[#9CA3AF]">Vence: {new Date(record.due_date).toLocaleDateString('es')}</p>
                  </div>
                  <p className="font-mono text-sm font-bold text-[#1A1F2E]">${record.amount.toLocaleString()}</p>
                  <NodoBadge status={record.status} size="sm" />
                  {record.status !== 'paid' && user?.role === 'admin' && (
                    <button
                      onClick={() => updateBillingStatus(record.id, 'paid')}
                      className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                    >
                      Marcar pagado
                    </button>
                  )}
                </div>
              </NodoCard>
            ))}
          </div>
        )}

        {/* PLUGS */}
        {tab === 'plugs' && (
          <div className="space-y-3 fade-in">
            <p className="text-sm text-[#9CA3AF]">Gestiona qué plugs puede usar este cliente</p>
            {PLUGS.map((plug) => {
              const projectPlug = plugs.find(p => p.plug_id === plug.id)
              const isEnabled = projectPlug?.is_enabled ?? false
              return (
                <NodoCard key={plug.id} padding="md">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl flex-shrink-0">{plug.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1A1F2E]">{plug.label}</p>
                      <p className="text-xs text-[#9CA3AF]">{plug.description}</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">Disponible desde fase {plug.available_from_phase}</p>
                    </div>
                    <button
                      onClick={() => togglePlug(plug.id, !isEnabled)}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                        isEnabled ? 'bg-[#C8F135]' : 'bg-[#D1D5DB]'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        isEnabled ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                </NodoCard>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Sub-component: Onboarding tab
function OnboardingTab({
  projectId, businessName, contactName,
}: {
  projectId?: string
  businessName?: string
  contactName?: string
}) {
  const [messages, setMessages] = useState<{ role: string; content: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)
  const [summarizing, setSummarizing] = useState(false)

  useEffect(() => {
    if (projectId) {
      supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('project_id', projectId)
        .eq('session_type', 'onboarding')
        .order('created_at')
        .then(({ data }) => {
          setMessages(data || [])
          setLoading(false)
        })
    }
  }, [projectId])

  async function generateSummary() {
    if (!messages.length) return
    setSummarizing(true)
    try {
      const transcript = messages
        .map(m => `${m.role === 'user' ? 'CLIENTE' : 'ASISTENTE'}: ${m.content}`)
        .join('\n\n')

      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: `Eres un asistente de NODO ONE. Analiza la siguiente conversación de onboarding entre un cliente y el asistente de IA, y genera un resumen ejecutivo estructurado en español con la siguiente información:

1. DATOS DEL NEGOCIO — nombre, sector, descripción, ubicación, horarios
2. PRODUCTO / SERVICIO — qué vende o ofrece, precios si se mencionan
3. PÚBLICO OBJETIVO — a quién va dirigido
4. PERSONALIDAD DEL AGENTE — tono, estilo de comunicación deseado
5. PREGUNTAS FRECUENTES IDENTIFICADAS — las que el cliente mencionó o el agente detectó
6. INSTRUCCIONES ESPECIALES — prohibiciones, alertas, protocolos
7. ESTADO DEL ONBOARDING — qué información falta, qué está completo
8. PRÓXIMOS PASOS RECOMENDADOS

Sé conciso pero completo. Usa formato claro con secciones y bullets.`,
          messages: [{ role: 'user', content: `Conversación de onboarding de ${businessName || 'el cliente'}:\n\n${transcript}` }],
        }),
      })
      const data = await res.json() as { content: Array<{ text: string }> }
      setSummary(data.content[0].text)
    } catch (e) {
      console.error(e)
    } finally {
      setSummarizing(false)
    }
  }

  function exportPDF() {
    if (!summary) return
    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Resumen Onboarding — ${businessName || 'Cliente'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1827; background: white; padding: 48px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #C026A8; margin-bottom: 32px; }
    .brand { font-size: 22px; font-weight: 800; color: #1a1827; letter-spacing: 1px; }
    .brand span { color: #C026A8; }
    .meta { text-align: right; font-size: 12px; color: #6b6b80; }
    .meta strong { display: block; font-size: 14px; color: #1a1827; margin-bottom: 2px; }
    h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #C026A8; margin: 24px 0 10px; }
    p { font-size: 13px; line-height: 1.7; color: #374151; }
    ul { margin: 6px 0 0 16px; }
    li { font-size: 13px; line-height: 1.7; color: #374151; margin-bottom: 2px; }
    .section { background: #f9f8ff; border-left: 3px solid #C026A8; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 8px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e8e6f0; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">NODO <span>ONE</span></div>
      <div style="font-size:12px;color:#6b6b80;margin-top:4px">Plataforma de gestión de servicios</div>
    </div>
    <div class="meta">
      <strong>Resumen de Onboarding</strong>
      ${businessName ? `<div>${businessName}</div>` : ''}
      ${contactName ? `<div>${contactName}</div>` : ''}
      <div>${date}</div>
    </div>
  </div>
  <div class="content">
    ${summary
      .split('\n')
      .map(line => {
        if (/^\d+\.\s+[A-ZÁÉÍÓÚÑ\s/]+$/.test(line.trim()) || /^#+\s/.test(line.trim())) {
          return `<h2>${line.replace(/^#+\s/, '').replace(/^\d+\.\s+/, '')}</h2>`
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return `<li>${line.replace(/^[-•]\s+/, '')}</li>`
        }
        if (line.trim() === '') return '<br/>'
        return `<p>${line}</p>`
      })
      .join('\n')}
  </div>
  <div class="footer">Generado por NODO ONE · ${date} · Documento confidencial</div>
</body>
</html>`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  if (loading) return (
    <div className="h-20 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#C8F135] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (messages.length === 0) {
    return (
      <NodoCard className="text-center py-10">
        <p className="text-sm text-[#9CA3AF]">El cliente aún no ha iniciado el onboarding.</p>
      </NodoCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">{messages.length} mensajes · {messages.filter(m => m.role === 'user').length} del cliente</p>
        <div className="flex gap-2">
          <button
            onClick={generateSummary}
            disabled={summarizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E2433] text-[#C8F135] text-xs font-medium hover:bg-[#252d3f] transition-colors disabled:opacity-50"
          >
            {summarizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {summarizing ? 'Analizando...' : 'Generar resumen IA'}
          </button>
          {summary && (
            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C026A8] text-white text-xs font-medium hover:bg-[#A01E8E] transition-colors"
            >
              <FileDown size={12} />
              Exportar PDF
            </button>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <NodoCard className="border border-[#C8F135]/20 bg-[#0f1623]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-[#C8F135]" />
            <span className="text-xs font-semibold text-[#C8F135] uppercase tracking-wider">Resumen IA</span>
          </div>
          <div className="text-sm text-[#D1D5DB] whitespace-pre-wrap leading-relaxed">{summary}</div>
        </NodoCard>
      )}

      {/* Chat transcript */}
      <div className="space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-[#1E2433] text-white'
                : 'bg-white border border-[#E5E8EF] text-[#374151] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-[#9CA3AF]'}`}>
                {new Date(msg.created_at).toLocaleString('es')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Sub-component: Bot knowledge tab
function BotKnowledgeTab({
  knowledge, projectId, onUpdate
}: {
  knowledge: BotKnowledge[]
  projectId?: string
  onUpdate: (items: BotKnowledge[]) => void
}) {
  const { user } = useAuthStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [addingCategory, setAddingCategory] = useState<KnowledgeCategory | null>(null)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemContent, setNewItemContent] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const importInputRef = { current: null as HTMLInputElement | null }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !projectId) return
    setImporting(true)
    setImportError(null)
    try {
      // Read file as base64
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      bytes.forEach(b => { binary += String.fromCharCode(b) })
      const base64 = btoa(binary)

      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('API key no configurada')

      const isPdf = file.type === 'application/pdf'
      const messageContent = isPdf
        ? [
            { type: 'text', text: 'Este documento es el system prompt o información de negocio de un cliente. Extrae y estructura toda la información relevante para la base de conocimiento de un agente IA. Devuelve ÚNICAMENTE un JSON array con objetos {category, title, content}. Las categorías válidas son: descripcion_general, personalidad_tono, preguntas_frecuentes, servicios_activos, horarios_disponibilidad, prohibiciones, alertas_escalamiento, indicaciones_operativas, otra. Extrae tantas entradas como sea necesario para cubrir todo el documento. No añadas markdown, solo JSON puro.' },
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          ]
        : `Este documento es el system prompt o información de negocio de un cliente:\n\n${await file.text()}\n\nExtrae y estructura toda la información en un JSON array con objetos {category, title, content}. Las categorías válidas son: descripcion_general, personalidad_tono, preguntas_frecuentes, servicios_activos, horarios_disponibilidad, prohibiciones, alertas_escalamiento, indicaciones_operativas, otra. Devuelve ÚNICAMENTE JSON puro, sin markdown.`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          messages: [{ role: 'user', content: messageContent }],
        }),
      })
      if (!res.ok) throw new Error(`Error API: ${res.status}`)
      const data = await res.json() as { content: Array<{ text: string }> }
      const raw = data.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed: Array<{ category: string; title: string; content: string }> = JSON.parse(raw)

      // Save all entries to DB
      const inserts = parsed.map((item, i) => ({
        project_id: projectId,
        category: item.category as KnowledgeCategory,
        title: item.title,
        content: item.content,
        is_visible_to_client: true,
        order_index: knowledge.length + i,
        updated_by: user?.id,
      }))
      const { data: inserted } = await supabase.from('bot_knowledge').insert(inserts).select()
      if (inserted) onUpdate([...knowledge, ...inserted])
    } catch (err: any) {
      setImportError('Error al importar: ' + (err.message ?? 'desconocido'))
    } finally {
      setImporting(false)
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  async function saveEdit(item: BotKnowledge) {
    await supabase.from('bot_knowledge').update({
      title: newTitle,
      content: newContent,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    }).eq('id', item.id)
    onUpdate(knowledge.map(k => k.id === item.id ? { ...k, title: newTitle, content: newContent } : k))
    setEditing(null)
  }

  async function addItem() {
    if (!projectId || !addingCategory || !newItemTitle || !newItemContent) return
    const { data } = await supabase.from('bot_knowledge').insert({
      project_id: projectId,
      category: addingCategory,
      title: newItemTitle,
      content: newItemContent,
      is_visible_to_client: true,
      order_index: knowledge.filter(k => k.category === addingCategory).length,
      updated_by: user?.id,
    }).select().single()
    if (data) onUpdate([...knowledge, data])
    setAddingCategory(null)
    setNewItemTitle('')
    setNewItemContent('')
  }

  const grouped = knowledge.reduce<Partial<Record<KnowledgeCategory, BotKnowledge[]>>>((acc, item) => {
    const cat = item.category as KnowledgeCategory
    if (!acc[cat]) acc[cat] = []
    acc[cat]!.push(item)
    return acc
  }, {})

  const categories = Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[]

  return (
    <div className="space-y-6">
      {/* Import document button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">{knowledge.length} entradas en la base de conocimiento</p>
        <div>
          <input
            ref={el => { importInputRef.current = el }}
            type="file"
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#374151] border border-[#E5E8EF] px-3 py-1.5 rounded-lg hover:border-[#C8F135]/50 hover:bg-[#C8F135]/5 transition-colors disabled:opacity-50"
          >
            {importing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {importing ? 'Importando...' : 'Importar documento'}
          </button>
        </div>
      </div>
      {importError && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">{importError}</div>
      )}
      {categories.map((cat) => {
        const items = grouped[cat] || []
        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                {KNOWLEDGE_CATEGORY_LABELS[cat]}
              </p>
              <button
                onClick={() => setAddingCategory(addingCategory === cat ? null : cat)}
                className="text-xs text-[#9CA3AF] hover:text-[#1A1F2E] transition-colors flex items-center gap-1"
              >
                <Pencil size={11} /> Añadir
              </button>
            </div>

            {addingCategory === cat && (
              <NodoCard className="mb-2 border border-[#C8F135]/30">
                <input
                  placeholder="Título"
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#1A1F2E] placeholder-[#9CA3AF] outline-none mb-2 border-b border-[#E5E8EF] pb-2"
                />
                <textarea
                  placeholder="Contenido..."
                  value={newItemContent}
                  onChange={e => setNewItemContent(e.target.value)}
                  className="w-full bg-[#F4F6F9] border border-[#E5E8EF] rounded-lg p-2 text-sm text-[#374151] placeholder-[#9CA3AF] outline-none resize-none focus:border-[#C8F135]/50 transition-colors"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={addItem} className="text-xs px-3 py-1 bg-[#C8F135] text-[#1A1F2E] font-semibold rounded hover:bg-[#D4F53C] transition-colors">Guardar</button>
                  <button onClick={() => setAddingCategory(null)} className="text-xs px-3 py-1 text-[#6B7280] hover:text-[#1A1F2E] transition-colors">Cancelar</button>
                </div>
              </NodoCard>
            )}

            {items.length === 0 && addingCategory !== cat && (
              <p className="text-xs text-[#9CA3AF] italic">Sin contenido en esta categoría</p>
            )}

            {items.map((item) => (
              <NodoCard key={item.id} padding="sm" className="mb-2">
                {editing === item.id ? (
                  <div>
                    <input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-[#1A1F2E] outline-none mb-1 border-b border-[#E5E8EF] pb-1"
                    />
                    <textarea
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                      className="w-full bg-[#F4F6F9] border border-[#E5E8EF] rounded p-2 text-sm text-[#374151] outline-none resize-none focus:border-[#C8F135]/50 transition-colors"
                      rows={4}
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => saveEdit(item)} className="text-xs px-2 py-1 bg-[#C8F135] text-[#1A1F2E] font-semibold rounded hover:bg-[#D4F53C] transition-colors">Guardar</button>
                      <button onClick={() => setEditing(null)} className="text-xs px-2 py-1 text-[#6B7280] hover:text-[#1A1F2E] transition-colors rounded">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1A1F2E]">{item.title}</p>
                      <p className="text-xs text-[#374151] mt-0.5 whitespace-pre-wrap">{item.content}</p>
                    </div>
                    <button
                      onClick={() => { setEditing(item.id); setNewTitle(item.title); setNewContent(item.content) }}
                      className="text-[#9CA3AF] hover:text-[#1A1F2E] p-1 transition-colors flex-shrink-0"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                )}
              </NodoCard>
            ))}
          </div>
        )
      })}
    </div>
  )
}
