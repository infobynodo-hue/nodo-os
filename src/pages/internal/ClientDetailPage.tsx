import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, LayoutDashboard, GitBranch, MessageSquare,
  Brain, Send, CreditCard, Puzzle, MoreVertical, Pencil, Power,
  Upload, Loader2, Sparkles, FileDown, CheckCircle,
  Key, Plus, Trash2, Eye, EyeOff, Copy, Check, Activity, LogIn, Clock, TrendingUp,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore, IS_DEMO } from '../../store/auth'
import { DEMO_CLIENTS, DEMO_PROJECTS, DEMO_PHASES, DEMO_TASKS, DEMO_BILLING, DEMO_BOT_KNOWLEDGE } from '../../lib/demo'
import { NodoCard } from '../../components/ui/NodoCard'
import { NodoBadge } from '../../components/ui/NodoBadge'
import { NodoProgressBar } from '../../components/ui/NodoProgressBar'
import { NodoAvatar } from '../../components/ui/NodoAvatar'
import { SERVICE_LABELS, PLUGS, KNOWLEDGE_CATEGORY_LABELS } from '../../types'
import type {
  Client, Project, ProjectPhase, Task, BillingRecord,
  BotKnowledge, PlugRequest, ProjectPlug, KnowledgeCategory, ClientCredential, ProjectDeliverable
} from '../../types'

type Tab = 'resumen' | 'fases' | 'onboarding' | 'bot' | 'solicitudes' | 'facturacion' | 'plugs' | 'accesos' | 'actividad' | 'documentos'

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
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([])
  const [credentials, setCredentials] = useState<ClientCredential[]>([])
  const [logins, setLogins] = useState<{ id: string; logged_at: string }[]>([])
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

    // Load credentials y logins por client_id
    if (clientRes.data?.id) {
      const [{ data: credsData }, { data: loginsData }] = await Promise.all([
        supabase.from('client_credentials').select('*').eq('client_id', clientRes.data.id).order('created_at', { ascending: false }),
        supabase.from('client_portal_logins').select('id, logged_at').eq('client_id', clientRes.data.id).order('logged_at', { ascending: false }).limit(100),
      ])
      setCredentials(credsData || [])
      setLogins(loginsData || [])
    }

    if (projectRes.data?.id) {
      const pid = projectRes.data.id
      const [phasesRes, tasksRes, billingRes, knowledgeRes, requestsRes, plugsRes, deliverablesRes] = await Promise.all([
        supabase.from('project_phases').select('*').eq('project_id', pid).order('phase_number'),
        supabase.from('tasks').select('*').eq('project_id', pid).order('phase_number').order('order_index'),
        supabase.from('billing_records').select('*').eq('project_id', pid).order('period_month'),
        supabase.from('bot_knowledge').select('*').eq('project_id', pid).order('order_index'),
        supabase.from('plug_requests').select('*').eq('project_id', pid).order('created_at', { ascending: false }),
        supabase.from('project_plugs').select('*').eq('project_id', pid),
        supabase.from('project_deliverables').select('*').eq('project_id', pid).order('created_at', { ascending: false }),
      ])
      setPhases(phasesRes.data || [])
      setTasks(tasksRes.data || [])
      setBilling(billingRes.data || [])
      setKnowledge(knowledgeRes.data || [])
      setRequests(requestsRes.data || [])
      setPlugs(plugsRes.data || [])
      setDeliverables(deliverablesRes.data || [])

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

  async function addTask(phaseNumber: number) {
    if (!project) return
    const title = prompt('Nombre de la tarea:')
    if (!title?.trim()) return
    const assignedTo = confirm('¿Es tarea del cliente? (Aceptar = Cliente, Cancelar = Interno)') ? 'client' : 'internal'
    const maxOrder = Math.max(0, ...tasks.filter(t => t.phase_number === phaseNumber).map(t => t.order_index))
    const { data } = await supabase.from('tasks').insert({
      project_id: project.id,
      phase_number: phaseNumber,
      title: title.trim(),
      assigned_to: assignedTo,
      is_enabled: true,
      is_completed: false,
      order_index: maxOrder + 1,
    }).select().single()
    if (data) setTasks(prev => [...prev, data])
  }

  async function completeOnboarding(phaseId: string, isCompleted: boolean) {
    const newStatus = isCompleted ? 'in_progress' : 'completed'
    await supabase.from('project_phases').update({ status: newStatus }).eq('id', phaseId)
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, status: newStatus } : p))
    // Actualizar onboarding_sessions si existe
    if (project?.id) {
      await supabase.from('onboarding_sessions')
        .update({ status: newStatus === 'completed' ? 'completed' : 'in_progress' })
        .eq('project_id', project.id)
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
    { id: 'onboarding', label: 'Conversaciones', icon: MessageSquare },
    { id: 'bot', label: 'Base del Bot', icon: Brain },
    { id: 'solicitudes', label: `Solicitudes${requests.filter(r => r.status === 'pending').length > 0 ? ` (${requests.filter(r => r.status === 'pending').length})` : ''}`, icon: Send },
    { id: 'facturacion', label: 'Facturación', icon: CreditCard },
    { id: 'plugs', label: 'Plugs', icon: Puzzle },
    { id: 'accesos', label: 'Accesos', icon: Key },
    { id: 'actividad', label: 'Actividad', icon: Activity },
    { id: 'documentos', label: 'Documentos', icon: Upload },
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
                    <div className="flex items-center gap-2">
                      <NodoBadge status={phase.status} size="sm" />
                      <button
                        onClick={() => addTask(phase.phase_number)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-[#F4F6F9] text-[#6B7280] hover:bg-[#C8F135]/15 hover:text-[#4B5563] border border-transparent hover:border-[#C8F135]/40 transition-all"
                        title="Añadir tarea"
                      >
                        <Plus size={12} /> Tarea
                      </button>
                    </div>
                  </div>
                  {/* Botón onboarding completado — solo en fase 1 */}
                  {phase.phase_number === 1 && (
                    <div className="px-4 py-2.5 bg-[#F9FFF0] border-b border-[#E5E8EF] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#4B5563]">
                          {phase.status === 'completed' ? '✅ Onboarding marcado como completado' : '¿El cliente completó el onboarding?'}
                        </span>
                      </div>
                      <button
                        onClick={() => completeOnboarding(phase.id, phase.status === 'completed')}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
                          phase.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-white'
                            : 'bg-[#C8F135] text-[#1A1F2E] border-[#C8F135] hover:bg-[#b8e020]'
                        }`}
                      >
                        {phase.status === 'completed' ? 'Desmarcar' : '✓ Onboarding completado'}
                      </button>
                    </div>
                  )}
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
            <ConversationsTab
              projectId={project?.id}
              businessName={client?.business_name}
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

        {/* ACCESOS */}
        {tab === 'accesos' && (
          <AccesosTab
            clientId={client.id}
            credentials={credentials}
            setCredentials={setCredentials}
          />
        )}

        {/* ACTIVIDAD */}
        {tab === 'actividad' && (
          <ActividadTab logins={logins} />
        )}

        {/* DOCUMENTOS */}
        {tab === 'documentos' && (
          <DocumentosTab
            projectId={project?.id}
            clientId={client?.id}
            deliverables={deliverables}
            onDeliverableAdded={(d) => setDeliverables(prev => [d, ...prev])}
            onDeliverableDeleted={(id) => setDeliverables(prev => prev.filter(d => d.id !== id))}
          />
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
const PLUG_TABS = [
  { id: 'onboarding',      label: '🚀 Onboarding' },
  { id: 'report_error',    label: '🐛 Errores' },
  { id: 'request_change',  label: '✏️ Cambios' },
  { id: 'new_info',        label: '➕ Nueva info' },
  { id: 'schedule_meeting','label': '📅 Reuniones' },
  { id: 'general_review',  label: '📊 Revisiones' },
] as const
type PlugTab = typeof PLUG_TABS[number]['id']

function ConversationsTab({
  projectId, businessName,
}: {
  projectId?: string
  businessName?: string
}) {
  const [selectedPlug, setSelectedPlug] = useState<PlugTab>('onboarding')
  const [messages, setMessages] = useState<{ id: string; role: string; content: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)
  const [summarizing, setSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [savedDoc, setSavedDoc] = useState(false)
  const [savedDocs, setSavedDocs] = useState<{ id: string; title: string; file_path: string; created_at: string }[]>([])
  const [msgCounts, setMsgCounts] = useState<Record<string, number>>({})
  // Bot knowledge extraction
  const [pendingKnowledge, setPendingKnowledge] = useState<Array<{
    category: string; title: string; content: string
    existing: { id: string; title: string; content: string } | null
    action: 'add' | 'replace' | 'skip'
  }>>([])
  const [extracting, setExtracting] = useState(false)
  const [savingKnowledge, setSavingKnowledge] = useState(false)
  const [knowledgeSaved, setKnowledgeSaved] = useState(false)

  // Load message counts for all plugs (badge)
  useEffect(() => {
    if (!projectId) return
    supabase
      .from('chat_messages')
      .select('session_type')
      .eq('project_id', projectId)
      .then(({ data }) => {
        const counts: Record<string, number> = {}
        ;(data || []).forEach((m: { session_type: string }) => {
          counts[m.session_type] = (counts[m.session_type] || 0) + 1
        })
        setMsgCounts(counts)
      })
  }, [projectId])

  // Load messages for selected plug
  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    setSummary(null)
    setSummaryError(null)
    setSavedDoc(false)
    // Cargar mensajes
    supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('project_id', projectId)
      .eq('session_type', selectedPlug)
      .order('created_at')
      .then(({ data }) => {
        setMessages(data || [])
        setLoading(false)
      })
    // Cargar documentos guardados de este plug
    supabase
      .from('project_deliverables')
      .select('id, title, file_path, created_at')
      .eq('project_id', projectId)
      .ilike('file_path', `%resumen-${selectedPlug}%`)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setSavedDocs(data || []))
  }, [projectId, selectedPlug])

  const SUMMARY_PROMPTS: Record<PlugTab, { system: string; maxTokens: number; docTitle: string }> = {
    onboarding: {
      docTitle: 'Documento de Onboarding',
      maxTokens: 4096,
      system: `Eres un especialista de NODO ONE en configuración de agentes de IA. Analiza esta conversación de onboarding y genera un documento ejecutivo completo en español.

INSTRUCCIÓN CRÍTICA: Solo incluye las secciones que tengan información real mencionada en la conversación. Si una sección no tiene datos, omítela completamente — no escribas "no especificado" ni dejes secciones vacías.

Estructura (incluir solo si hay datos):

## DATOS DEL NEGOCIO
Nombre comercial, sector, descripción del negocio, ubicación, horarios de atención.

## PRODUCTO / SERVICIO
Qué ofrece exactamente, catálogo, precios, planes, tarifas, condiciones.

## PÚBLICO OBJETIVO
Perfil del cliente ideal, rango de edad, necesidades, características principales.

## PERSONALIDAD DEL AGENTE
Nombre del agente, tono de comunicación, estilo, cómo debe presentarse, qué transmitir.

## PREGUNTAS FRECUENTES
Lista de preguntas frecuentes identificadas con su respuesta correcta.

## INSTRUCCIONES OPERATIVAS
Procesos internos, cómo gestionar leads, pasos de atención, flujos de trabajo.

## PROHIBICIONES Y RESTRICCIONES
Qué no debe hacer ni decir el agente bajo ninguna circunstancia.

## ALERTAS Y ESCALAMIENTO
Cuándo derivar a humano, casos que requieren atención manual, protocolos de urgencia.

## ESTADO DEL ONBOARDING
Qué información se ha recopilado correctamente y qué falta completar.

## PRÓXIMOS PASOS
Acciones concretas pendientes para el equipo NODO ONE.

Sé exhaustivo y detallado en cada sección que incluyas. El documento debe ser profesional y listo para usar como referencia de configuración.`,
    },
    report_error: {
      docTitle: 'Informe de Errores del Agente',
      maxTokens: 2048,
      system: `Eres un analista de NODO ONE. Analiza esta conversación donde el cliente reportó errores de su agente de IA y genera un informe estructurado en español.

Extrae ÚNICAMENTE los errores que el cliente confirmó o describió. Ignora los errores que el cliente descartó o que resultaron no ser errores.

## ERRORES CONFIRMADOS
Lista numerada. Por cada error incluye:
- **Descripción**: qué respondió mal el agente
- **Contexto**: en qué situación ocurrió
- **Impacto**: cómo afectó al cliente o al usuario final
- **Frecuencia**: si mencionó si ocurre a menudo o fue puntual

## PATRÓN GENERAL
Si hay un patrón común entre los errores, descríbelo brevemente.

## ACCIONES RECOMENDADAS
Qué debe corregirse en la base de conocimiento o configuración del agente.

Solo incluye secciones con información real de la conversación.`,
    },
    request_change: {
      docTitle: 'Solicitudes de Cambio',
      maxTokens: 2048,
      system: `Eres un gestor de proyectos de NODO ONE. Analiza esta conversación donde el cliente solicitó cambios en su agente de IA.

## CAMBIOS SOLICITADOS
Lista numerada. Por cada cambio:
- **Qué cambiar**: descripción clara del cambio pedido
- **Motivo**: por qué lo solicita (si lo mencionó)
- **Prioridad percibida**: urgente / normal / cuando se pueda
- **Estado**: pendiente de aplicar / ya confirmado

## CONTEXTO ADICIONAL
Información relevante que el cliente aportó para entender mejor los cambios.

## ACCIONES PARA EL EQUIPO
Qué hay que modificar concretamente en el sistema.

Solo incluye secciones con información real.`,
    },
    new_info: {
      docTitle: 'Nueva Información para el Agente',
      maxTokens: 2048,
      system: `Eres un gestor de conocimiento de NODO ONE. Analiza esta conversación donde el cliente quiso añadir nueva información a su agente.

## INFORMACIÓN NUEVA APORTADA
Resumen del contenido que el cliente quiere que aprenda el agente. Organízalo por categorías si aplica (servicios, precios, horarios, FAQs, etc.)

## CATEGORÍA SUGERIDA
A qué categoría de la base de conocimiento pertenece esta información.

## INSTRUCCIONES DE IMPLEMENTACIÓN
Cómo debería integrarse esta información en el agente (si el cliente dio indicaciones).

Solo incluye lo que realmente aportó el cliente en la conversación.`,
    },
    schedule_meeting: {
      docTitle: 'Solicitud de Reunión',
      maxTokens: 1024,
      system: `Analiza esta conversación donde el cliente solicitó una reunión con el equipo NODO ONE y extrae:

## DETALLES DE LA REUNIÓN
- Fecha y hora acordada (o propuesta)
- Formato: llamada / videollamada / presencial
- Duración estimada si se mencionó
- Plataforma preferida (Zoom, Meet, Teams, etc.)

## MOTIVO
Por qué solicita la reunión, qué quiere tratar.

## PARTICIPANTES
Quién debe asistir por parte de NODO ONE si lo especificó.

## NOTAS PREVIAS
Información o materiales que el cliente quiere revisar en la reunión.

Solo incluye lo que se mencionó en la conversación.`,
    },
    general_review: {
      docTitle: 'Revisión Mensual',
      maxTokens: 2048,
      system: `Eres un analista de NODO ONE. Analiza esta conversación de revisión mensual del cliente y genera un informe ejecutivo.

## VALORACIÓN DEL CLIENTE
Cómo evalúa el desempeño del agente este mes, puntuación si la dio, comentarios generales.

## PUNTOS POSITIVOS
Qué está funcionando bien según el cliente.

## PUNTOS DE MEJORA
Qué no está funcionando o podría mejorar.

## ACUERDOS DEL MES
Cambios, ajustes o acciones acordadas durante esta revisión.

## MÉTRICAS MENCIONADAS
Si el cliente hizo referencia a datos de rendimiento, conversaciones, etc.

## PRÓXIMOS PASOS
Compromisos concretos del equipo NODO ONE para el próximo período.

Solo incluye secciones con información real de la conversación.`,
    },
  }

  async function generateSummary() {
    if (!messages.length || !projectId) return
    setSummarizing(true)
    setSavedDoc(false)
    setSummaryError(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120_000) // 2 min timeout

    try {
      const cfg = SUMMARY_PROMPTS[selectedPlug]
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('API key no configurada')

      // Enviar toda la conversación — Claude soporta contextos largos sin problema
      const transcript = messages
        .map(m => `${m.role === 'user' ? 'CLIENTE' : 'ASISTENTE'}: ${m.content}`)
        .join('\n\n')

      const body = JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8192,
        system: cfg.system,
        messages: [{ role: 'user', content: `Conversación de ${businessName || 'el cliente'}:\n\n${transcript}` }],
      })

      // Reintento automático si la API está sobrecargada (529)
      let res: Response | null = null
      for (let attempt = 1; attempt <= 3; attempt++) {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body,
        })
        if (res.status !== 529) break
        if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 8000)) // 8s, 16s
      }
      if (!res) throw new Error('No se pudo conectar con la API')

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        if (res.status === 529) throw new Error('Los servidores de Anthropic están saturados. Espera 1-2 minutos e inténtalo de nuevo.')
        throw new Error(`Error API ${res.status}: ${errBody}`)
      }

      const data = await res.json() as { content: Array<{ text: string }>; stop_reason?: string }
      if (!data.content?.[0]?.text) throw new Error('Respuesta vacía de la API')

      const generatedSummary = data.content[0].text
      setSummary(generatedSummary)

      // ✅ Resumen listo — liberar el botón ya, el guardado sigue en segundo plano
      clearTimeout(timeoutId)
      setSummarizing(false)

      // Lanzar extracción a Base del Bot automáticamente (solo en onboarding)
      if (selectedPlug === 'onboarding') {
        extractKnowledge(generatedSummary)
      }

      // Guardar HTML en storage + project_deliverables (no bloquea la UI)
      const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
      const htmlContent = buildSummaryHTML(cfg.docTitle, businessName || 'Cliente', date, generatedSummary)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const ts = Date.now()
      const filePath = `onboarding-summaries/${projectId}/${ts}-resumen-${selectedPlug}.html`

      supabase.storage
        .from('client-documents')
        .upload(filePath, blob, { contentType: 'text/html' })
        .then(({ error: storageErr }) => {
          if (!storageErr) {
            supabase.from('project_deliverables').insert({
              project_id: projectId,
              title: `${cfg.docTitle} — ${businessName || 'Cliente'}`,
              description: `Generado el ${date}`,
              file_path: filePath,
              file_name: `resumen-${selectedPlug}-${ts}.html`,
              type: 'documento',
              published: true,
            }).select('id, title, file_path, created_at').single()
              .then(({ data: newDoc }) => {
                setSavedDoc(true)
                if (newDoc) setSavedDocs(prev => [newDoc, ...prev])
              })
          }
        })
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        setSummaryError('La generación tardó demasiado (más de 2 min). Inténtalo de nuevo.')
      } else {
        setSummaryError(e instanceof Error ? e.message : 'Error desconocido al generar el resumen.')
      }
      console.error(e)
    } finally {
      clearTimeout(timeoutId)
      setSummarizing(false)
    }
  }


  function buildSummaryHTML(docTitle: string, clientName: string, date: string, content: string): string {
    const contentHtml = content
      .split('\n')
      .map(line => {
        if (/^##\s/.test(line.trim())) return `<h2>${line.replace(/^##\s/, '')}</h2>`
        if (/^###\s/.test(line.trim())) return `<h3>${line.replace(/^###\s/, '')}</h3>`
        if (/^\*\*(.+)\*\*:?$/.test(line.trim())) return `<h3>${line.replace(/\*\*/g, '')}</h3>`
        if (line.startsWith('- ') || line.startsWith('• ')) return `<li>${line.replace(/^[-•]\s+/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`
        if (/^\d+\.\s/.test(line.trim())) return `<li class="numbered">${line.replace(/^\d+\.\s/, '')}</li>`
        if (line.trim() === '') return '<div class="spacer"></div>'
        return `<p>${line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`
      })
      .join('\n')
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<title>${docTitle} — ${clientName}</title>
<style>
* { margin:0;padding:0;box-sizing:border-box }
body { font-family:'Segoe UI',Arial,sans-serif;color:#1a1827;background:white;padding:48px;max-width:820px;margin:0 auto }
.header { display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #C026A8;margin-bottom:36px }
.brand { font-size:24px;font-weight:900;color:#1a1827;letter-spacing:2px }
.brand span { color:#C026A8 }
.meta { text-align:right }
.meta-title { font-size:15px;font-weight:700;color:#1a1827;margin-bottom:4px }
.meta-client { font-size:13px;color:#C026A8;font-weight:600 }
.meta-date { font-size:11px;color:#9ca3af;margin-top:2px }
h2 { font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#C026A8;margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid #f0eefa }
h3 { font-size:13px;font-weight:700;color:#1a1827;margin:12px 0 4px }
p { font-size:13px;line-height:1.75;color:#374151;margin-bottom:4px }
li { font-size:13px;line-height:1.75;color:#374151;margin:3px 0 3px 20px }
li.numbered { list-style:decimal } li:not(.numbered) { list-style:disc }
strong { color:#1a1827;font-weight:600 }
.spacer { height:8px }
@media print { body { padding:32px } }
</style></head><body>
<div class="header">
  <div><div class="brand">NODO<span> ONE</span></div><div style="font-size:11px;color:#9ca3af;margin-top:3px">Panel Interno</div></div>
  <div class="meta"><div class="meta-title">${docTitle}</div><div class="meta-client">${clientName}</div><div class="meta-date">${date}</div></div>
</div>
${contentHtml}
</body></html>`
  }

  function exportPDF() {
    if (!summary) return
    const cfg = SUMMARY_PROMPTS[selectedPlug]
    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    const html = buildSummaryHTML(cfg.docTitle, businessName || 'Cliente', date, summary)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  async function extractKnowledge(summaryText: string) {
    if (!projectId) return
    setExtracting(true)
    setPendingKnowledge([])
    setKnowledgeSaved(false)
    try {
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
          max_tokens: 4096,
          system: `Eres un extractor de datos. A partir de un documento ejecutivo de onboarding, extrae la información en un array JSON.
Devuelve ÚNICAMENTE el array JSON sin markdown ni texto extra.
Cada objeto debe tener: { "category": string, "title": string, "content": string }
Categorías válidas (usa EXACTAMENTE estas):
- descripcion_general
- personalidad_tono
- servicios_activos
- horarios_disponibilidad
- preguntas_frecuentes
- indicaciones_operativas
- prohibiciones
- alertas_escalamiento
Crea tantas entradas como haya información. Sé exhaustivo y detallado en el content.`,
          messages: [{ role: 'user', content: summaryText }],
        }),
      })
      if (!res.ok) return
      const data = await res.json() as { content: Array<{ text: string }> }
      const raw = data.content[0]?.text?.trim() ?? ''
      const jsonStr = raw.startsWith('[') ? raw : raw.replace(/^```json\n?/, '').replace(/\n?```$/, '')
      const extracted: Array<{ category: string; title: string; content: string }> = JSON.parse(jsonStr)

      // Cargar bot_knowledge existente para este proyecto
      const { data: existing } = await supabase
        .from('bot_knowledge')
        .select('id, category, title, content')
        .eq('project_id', projectId)

      const existingMap: Record<string, { id: string; title: string; content: string }> = {}
      for (const e of existing || []) {
        existingMap[e.category] = { id: e.id, title: e.title, content: e.content }
      }

      const pending = extracted.map(item => ({
        category: item.category,
        title: item.title,
        content: item.content,
        existing: existingMap[item.category] ?? null,
        action: (existingMap[item.category] ? 'replace' : 'add') as 'add' | 'replace' | 'skip',
      }))
      setPendingKnowledge(pending)
    } catch (e) {
      console.error('Error extrayendo knowledge:', e)
    } finally {
      setExtracting(false)
    }
  }

  async function saveKnowledge() {
    if (!projectId || !pendingKnowledge.length) return
    setSavingKnowledge(true)
    try {
      for (const item of pendingKnowledge) {
        if (item.action === 'skip') continue
        if (item.action === 'replace' && item.existing) {
          await supabase.from('bot_knowledge').update({
            title: item.title,
            content: item.content,
          }).eq('id', item.existing.id)
        } else if (item.action === 'add') {
          await supabase.from('bot_knowledge').insert({
            project_id: projectId,
            category: item.category,
            title: item.title,
            content: item.content,
            is_visible_to_client: true,
            order_index: 0,
          })
        }
      }
      setKnowledgeSaved(true)
      setPendingKnowledge([])
    } catch (e) {
      console.error('Error guardando knowledge:', e)
    } finally {
      setSavingKnowledge(false)
    }
  }

  const plugLabel = PLUG_TABS.find(p => p.id === selectedPlug)?.label ?? selectedPlug

  return (
    <div className="space-y-4">
      {/* Plug selector pills */}
      <div className="flex gap-2 flex-wrap">
        {PLUG_TABS.map(plug => {
          const count = msgCounts[plug.id] || 0
          const isActive = selectedPlug === plug.id
          return (
            <button
              key={plug.id}
              onClick={() => setSelectedPlug(plug.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? 'bg-[#1E2433] text-[#C8F135] border-[#C8F135]/30'
                  : 'bg-[#F4F6F9] text-[#6B7280] border-[#E5E8EF] hover:border-[#C8F135]/40 hover:text-[#1A1F2E]'
              }`}
            >
              {plug.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  isActive ? 'bg-[#C8F135]/20 text-[#C8F135]' : 'bg-[#E5E8EF] text-[#9CA3AF]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="h-20 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#C8F135] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <NodoCard className="text-center py-10">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-sm text-[#9CA3AF]">Sin conversaciones en {plugLabel}</p>
        </NodoCard>
      ) : (
        <div className="space-y-4">
          {/* Action bar — disponible en todos los plugs */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#9CA3AF]">
              {messages.length} mensajes · {messages.filter(m => m.role === 'user').length} del cliente
            </p>
            <div className="flex items-center gap-2">
              {savedDoc && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <CheckCircle size={12} />
                  Guardado en documentos
                </span>
              )}
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
                  Descargar PDF
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {summaryError && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <span className="mt-0.5">⚠️</span>
              <span>{summaryError}</span>
            </div>
          )}

          {/* Documentos guardados anteriormente */}
          {savedDocs.length > 0 && !summary && (
            <NodoCard className="border border-white/8 bg-[#141921]">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Resúmenes anteriores</p>
              <div className="space-y-1.5">
                {savedDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate">{doc.title}</p>
                      <p className="text-[10px] text-[#6B7280]">{new Date(doc.created_at).toLocaleString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const { data } = await supabase.storage.from('client-documents').createSignedUrl(doc.file_path, 3600)
                        if (data?.signedUrl) window.open(data.signedUrl, '_blank')
                      }}
                      className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-[#1E2433] text-[#9CA3AF] hover:text-white text-xs transition-colors"
                    >
                      <FileDown size={11} /> Ver
                    </button>
                  </div>
                ))}
              </div>
            </NodoCard>
          )}

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

          {/* Extracción Base del Bot */}
          {extracting && (
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF] px-1">
              <Loader2 size={12} className="animate-spin text-[#C8F135]" />
              Extrayendo información para la Base del Bot...
            </div>
          )}
          {knowledgeSaved && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 px-1">
              <CheckCircle size={12} />
              Base del Bot actualizada correctamente
            </div>
          )}
          {pendingKnowledge.length > 0 && (
            <NodoCard className="border border-violet-500/20 bg-[#0f1623]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-violet-400" />
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Guardar en Base del Bot</span>
                </div>
                <button
                  onClick={saveKnowledge}
                  disabled={savingKnowledge}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {savingKnowledge ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  {savingKnowledge ? 'Guardando...' : 'Aplicar selección'}
                </button>
              </div>
              <div className="space-y-3">
                {pendingKnowledge.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-white/8 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-white/4">
                      <div>
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">{item.category.replace(/_/g, ' ')}</span>
                        <p className="text-xs font-medium text-white mt-0.5">{item.title}</p>
                      </div>
                      <div className="flex gap-1">
                        {(['add', 'replace', 'skip'] as const).map(a => (
                          <button
                            key={a}
                            onClick={() => setPendingKnowledge(prev => prev.map((p, i) => i === idx ? { ...p, action: a } : p))}
                            className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                              item.action === a
                                ? a === 'skip' ? 'bg-[#6B7280] text-white' : a === 'replace' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                                : 'bg-white/8 text-[#9CA3AF] hover:bg-white/15'
                            }`}
                          >
                            {a === 'add' ? 'Añadir' : a === 'replace' ? 'Reemplazar' : 'Saltar'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {item.existing && item.action === 'replace' && (
                      <div className="grid grid-cols-2 divide-x divide-white/8">
                        <div className="px-3 py-2">
                          <p className="text-[9px] text-[#9CA3AF] uppercase font-bold mb-1">Actual</p>
                          <p className="text-[11px] text-[#9CA3AF] leading-relaxed line-clamp-3">{item.existing.content}</p>
                        </div>
                        <div className="px-3 py-2">
                          <p className="text-[9px] text-emerald-400 uppercase font-bold mb-1">Nuevo</p>
                          <p className="text-[11px] text-[#D1D5DB] leading-relaxed line-clamp-3">{item.content}</p>
                        </div>
                      </div>
                    )}
                    {item.action === 'add' && (
                      <div className="px-3 py-2">
                        <p className="text-[11px] text-[#D1D5DB] leading-relaxed line-clamp-3">{item.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </NodoCard>
          )}

          {/* Chat transcript */}
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
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
      )}
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

// Sub-component: Accesos tab
function AccesosTab({
  clientId,
  credentials,
  setCredentials,
}: {
  clientId: string
  credentials: ClientCredential[]
  setCredentials: React.Dispatch<React.SetStateAction<ClientCredential[]>>
}) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    label: '',
    platform: 'otro',
    username: '',
    password: '',
    url: '',
    notes: '',
    is_visible_to_client: true,
  })

  const PLATFORM_OPTIONS = [
    { value: 'whatsapp_business', label: 'WhatsApp Business' },
    { value: 'nodo_bot', label: 'Panel NODO Bot' },
    { value: 'crm', label: 'CRM' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook / Meta' },
    { value: 'google', label: 'Google' },
    { value: 'email', label: 'Email / Correo' },
    { value: 'web', label: 'Sitio web' },
    { value: 'otro', label: 'Otro' },
  ]

  async function saveCredential() {
    if (!form.label.trim()) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('client_credentials')
        .insert({
          client_id: clientId,
          platform: form.platform,
          label: form.label.trim(),
          username: form.username.trim() || null,
          password: form.password.trim() || null,
          url: form.url.trim() || null,
          notes: form.notes.trim() || null,
          is_visible_to_client: form.is_visible_to_client,
        })
        .select()
        .single()
      if (!error && data) {
        setCredentials(prev => [data, ...prev])
        setForm({ label: '', platform: 'otro', username: '', password: '', url: '', notes: '', is_visible_to_client: true })
        setShowForm(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteCredential(credId: string) {
    if (!confirm('¿Eliminar este acceso?')) return
    await supabase.from('client_credentials').delete().eq('id', credId)
    setCredentials(prev => prev.filter(c => c.id !== credId))
  }

  async function toggleVisibility(cred: ClientCredential) {
    const newVal = !cred.is_visible_to_client
    await supabase.from('client_credentials').update({ is_visible_to_client: newVal }).eq('id', cred.id)
    setCredentials(prev => prev.map(c => c.id === cred.id ? { ...c, is_visible_to_client: newVal } : c))
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1A1F2E]">Accesos del cliente</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Credenciales y contraseñas gestionadas por NODO. Puedes decidir cuáles ve el cliente.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#1A1F2E] text-white text-xs font-semibold rounded-xl hover:bg-[#2A2F3E] transition-colors"
        >
          <Plus size={13} />
          Nuevo acceso
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-[#C026A8]/20 bg-[#C026A8]/3 p-4 space-y-3">
          <p className="text-xs font-bold text-[#1A1F2E] uppercase tracking-wider">Nuevo acceso</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Nombre *</label>
              <input
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="ej: Panel de control, Meta Business…"
                className="w-full text-sm border border-[#E5E8EF] rounded-xl px-3 py-2 outline-none focus:border-[#C026A8]/50 bg-white text-[#1A1F2E] placeholder:text-[#9CA3AF]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Plataforma</label>
              <select
                value={form.platform}
                onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                className="w-full text-sm border border-[#E5E8EF] rounded-xl px-3 py-2 outline-none focus:border-[#C026A8]/50 bg-white text-[#1A1F2E]"
              >
                {PLATFORM_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Usuario / Email / Teléfono</label>
              <input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="usuario@email.com o +34 600…"
                className="w-full text-sm border border-[#E5E8EF] rounded-xl px-3 py-2 outline-none focus:border-[#C026A8]/50 bg-white text-[#1A1F2E] placeholder:text-[#9CA3AF]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Contraseña</label>
              <input
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Contraseña o PIN"
                className="w-full text-sm border border-[#E5E8EF] rounded-xl px-3 py-2 outline-none focus:border-[#C026A8]/50 bg-white text-[#1A1F2E] placeholder:text-[#9CA3AF] font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">URL (opcional)</label>
              <input
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://…"
                className="w-full text-sm border border-[#E5E8EF] rounded-xl px-3 py-2 outline-none focus:border-[#C026A8]/50 bg-white text-[#1A1F2E] placeholder:text-[#9CA3AF]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1 block">Notas (opcional)</label>
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observaciones…"
                className="w-full text-sm border border-[#E5E8EF] rounded-xl px-3 py-2 outline-none focus:border-[#C026A8]/50 bg-white text-[#1A1F2E] placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>
          {/* Visibility toggle */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-semibold text-[#1A1F2E]">Visible para el cliente</p>
              <p className="text-[10px] text-[#9CA3AF]">Si está activo, el cliente lo verá en su portal</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, is_visible_to_client: !f.is_visible_to_client }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.is_visible_to_client ? 'bg-[#C8F135]' : 'bg-[#D1D5DB]'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_visible_to_client ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={saveCredential}
              disabled={saving || !form.label.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1F2E] text-white text-xs font-semibold rounded-xl hover:bg-[#2A2F3E] transition-colors disabled:opacity-50"
            >
              {saving ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Check size={12} />}
              Guardar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-semibold text-[#9CA3AF] hover:text-[#1A1F2E] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Credentials list */}
      {credentials.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E8EF] bg-white p-10 text-center">
          <Key size={32} className="text-[#D1D5DB] mx-auto mb-2" />
          <p className="text-sm text-[#9CA3AF] font-medium">Sin accesos registrados</p>
          <p className="text-xs text-[#9CA3AF]/70 mt-1">Pulsa "Nuevo acceso" para añadir credenciales para este cliente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {credentials.map(cred => (
            <InternalCredentialCard
              key={cred.id}
              cred={cred}
              onDelete={() => deleteCredential(cred.id)}
              onToggleVisibility={() => toggleVisibility(cred)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function InternalCredentialCard({
  cred,
  onDelete,
  onToggleVisibility,
}: {
  cred: ClientCredential
  onDelete: () => void
  onToggleVisibility: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copyPassword() {
    if (!cred.password) return
    await navigator.clipboard.writeText(cred.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-[#E5E8EF] bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C026A8]/10 to-[#8B22E8]/10 border border-[#C026A8]/15 flex items-center justify-center flex-shrink-0">
          <Key size={14} className="text-[#C026A8]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1F2E] truncate">{cred.label}</p>
          <p className="text-[10px] text-[#9CA3AF]">{cred.platform}</p>
        </div>
        {/* Visibility badge */}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          cred.is_visible_to_client
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-[#F4F6F9] text-[#9CA3AF]'
        }`}>
          {cred.is_visible_to_client ? 'Cliente ve' : 'Solo NODO'}
        </span>
      </div>
      <div className="border-t border-[#E5E8EF]" />
      <div className="px-4 py-3 space-y-2">
        {cred.username && (
          <div>
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-0.5">Usuario</p>
            <p className="text-xs font-mono text-[#1A1F2E] bg-[#F4F6F9] rounded-lg px-2.5 py-1.5 truncate">{cred.username}</p>
          </div>
        )}
        {cred.password && (
          <div>
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-0.5">Contraseña</p>
            <div className="flex gap-1.5">
              <div className="flex-1 flex items-center bg-[#F4F6F9] rounded-lg px-2.5 py-1.5">
                <p className="text-xs font-mono text-[#1A1F2E] flex-1 truncate">
                  {showPassword ? cred.password : '••••••••'}
                </p>
              </div>
              <button onClick={() => setShowPassword(v => !v)} className="w-7 h-7 rounded-lg bg-[#F4F6F9] flex items-center justify-center text-[#9CA3AF] hover:text-[#1A1F2E] transition-colors">
                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <button onClick={copyPassword} className="w-7 h-7 rounded-lg bg-[#F4F6F9] flex items-center justify-center text-[#9CA3AF] hover:text-[#1A1F2E] transition-colors">
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        )}
        {cred.notes && <p className="text-[10px] text-[#9CA3AF] leading-relaxed">{cred.notes}</p>}
      </div>
      {/* Actions */}
      <div className="border-t border-[#E5E8EF] px-4 py-2 flex items-center gap-2">
        <button
          onClick={onToggleVisibility}
          className="text-[10px] text-[#9CA3AF] hover:text-[#C026A8] transition-colors font-medium"
        >
          {cred.is_visible_to_client ? 'Ocultar al cliente' : 'Mostrar al cliente'}
        </button>
        <div className="flex-1" />
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

// ─── DOCUMENTOS TAB ──────────────────────────────────────────────────────────
function DocumentosTab({
  projectId, clientId, deliverables, onDeliverableAdded, onDeliverableDeleted,
}: {
  projectId?: string
  clientId?: string
  deliverables: ProjectDeliverable[]
  onDeliverableAdded: (d: ProjectDeliverable) => void
  onDeliverableDeleted: (id: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleUpload(files: FileList | null) {
    if (!files || !projectId || !clientId) return
    const file = files[0]
    setError(null)
    setUploading(true)
    try {
      const slug = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `internal-uploads/${projectId}/${Date.now()}_${slug}`
      const { error: upErr } = await supabase.storage.from('client-documents').upload(path, file)
      if (upErr) { setError('Error al subir el archivo.'); return }
      const fileType: ProjectDeliverable['type'] = file.name.match(/\.(pdf)$/i) ? 'documento'
        : file.name.match(/\.(mp4|mov|avi|webm)$/i) ? 'video'
        : 'documento'
      const { data, error: dbErr } = await supabase
        .from('project_deliverables')
        .insert({
          project_id: projectId,
          title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
          description: 'Subido por el equipo NODO ONE',
          file_path: path,
          file_name: file.name,
          type: fileType,
          published: true,
        })
        .select()
        .single()
      if (!dbErr && data) onDeliverableAdded(data)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(doc: ProjectDeliverable) {
    if (!confirm(`¿Eliminar "${doc.title}"?`)) return
    setDeleting(doc.id)
    if (doc.file_path) await supabase.storage.from('client-documents').remove([doc.file_path])
    await supabase.from('project_deliverables').delete().eq('id', doc.id)
    onDeliverableDeleted(doc.id)
    setDeleting(null)
  }

  async function openDoc(doc: ProjectDeliverable) {
    if (doc.external_url) { window.open(doc.external_url, '_blank'); return }
    if (doc.file_path) {
      const { data } = await supabase.storage.from('client-documents').createSignedUrl(doc.file_path, 3600)
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    }
  }

  const typeIcon: Record<string, string> = { documento: '📄', video: '🎬', link: '🔗', acceso: '🔑', otro: '📦' }

  return (
    <div className="space-y-4 fade-in">
      {/* Upload area */}
      <NodoCard>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#E5E8EF] rounded-xl p-6 text-center cursor-pointer hover:border-[#C8F135]/60 hover:bg-[#F9FFF0] transition-all"
        >
          <Upload size={20} className="mx-auto mb-2 text-[#9CA3AF]" />
          <p className="text-sm font-medium text-[#374151]">Subir documento</p>
          <p className="text-xs text-[#9CA3AF] mt-1">PDF, Word, imágenes, vídeos — máx. 50 MB</p>
          {uploading && <p className="text-xs text-[#C8F135] mt-2 font-medium">Subiendo...</p>}
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={e => handleUpload(e.target.files)} />
      </NodoCard>

      {/* List */}
      {deliverables.length === 0 ? (
        <NodoCard className="text-center py-10">
          <p className="text-2xl mb-2">📁</p>
          <p className="text-sm text-[#9CA3AF]">No hay documentos todavía</p>
        </NodoCard>
      ) : (
        <div className="space-y-2">
          {deliverables.map(doc => (
            <NodoCard key={doc.id} padding="none">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl flex-shrink-0">{typeIcon[doc.type] ?? '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1F2E] truncate">{doc.title}</p>
                  <p className="text-xs text-[#9CA3AF]">{doc.description} · {new Date(doc.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openDoc(doc)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-[#F4F6F9] text-[#374151] hover:bg-[#E5E8EF] transition-colors flex items-center gap-1"
                  >
                    <Eye size={12} /> Ver
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id}
                    className="text-xs px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={12} /> {deleting === doc.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </NodoCard>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ACTIVIDAD TAB ───────────────────────────────────────────────────────────
function ActividadTab({ logins }: { logins: { id: string; logged_at: string }[] }) {
  const total = logins.length
  const ultima = logins[0]?.logged_at ?? null

  // Agrupar por día para el historial
  const byDay = logins.reduce<Record<string, number>>((acc, l) => {
    const day = new Date(l.logged_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    acc[day] = (acc[day] ?? 0) + 1
    return acc
  }, {})

  const days = Object.entries(byDay) // ya viene ordenado por logged_at desc

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'hace un momento'
    if (m < 60) return `hace ${m} min`
    const h = Math.floor(m / 60)
    if (h < 24) return `hace ${h}h`
    const d = Math.floor(h / 24)
    if (d < 7) return `hace ${d}d`
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  function formatFull(iso: string) {
    return new Date(iso).toLocaleString('es-ES', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (total === 0) {
    return (
      <div className="fade-in flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#F4F6F9] flex items-center justify-center">
          <Activity size={22} className="text-[#9CA3AF]" />
        </div>
        <p className="text-sm font-semibold text-[#1A1F2E]">Sin actividad registrada</p>
        <p className="text-xs text-[#9CA3AF] text-center max-w-xs">
          El historial de accesos al portal aparecerá aquí en cuanto el cliente inicie sesión.
        </p>
      </div>
    )
  }

  return (
    <div className="fade-in space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#E5E8EF] bg-white p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#9CA3AF] mb-1">
            <LogIn size={14} />
            <span className="text-xs font-medium">Total sesiones</span>
          </div>
          <p className="text-2xl font-bold text-[#1A1F2E]">{total}</p>
        </div>
        <div className="rounded-2xl border border-[#E5E8EF] bg-white p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#9CA3AF] mb-1">
            <Clock size={14} />
            <span className="text-xs font-medium">Última sesión</span>
          </div>
          <p className="text-sm font-bold text-[#1A1F2E]">{ultima ? timeAgo(ultima) : '—'}</p>
          {ultima && <p className="text-[10px] text-[#9CA3AF]">{formatFull(ultima)}</p>}
        </div>
        <div className="rounded-2xl border border-[#E5E8EF] bg-white p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#9CA3AF] mb-1">
            <TrendingUp size={14} />
            <span className="text-xs font-medium">Días distintos</span>
          </div>
          <p className="text-2xl font-bold text-[#1A1F2E]">{days.length}</p>
        </div>
      </div>

      {/* Historial agrupado por día */}
      <div className="rounded-2xl border border-[#E5E8EF] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E8EF]">
          <p className="text-xs font-semibold text-[#1A1F2E]">Historial de accesos</p>
        </div>
        <div className="divide-y divide-[#F4F6F9]">
          {days.map(([day, count]) => (
            <div key={day} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#F4F6F9] flex items-center justify-center flex-shrink-0">
                  <LogIn size={12} className="text-[#7C3AED]" />
                </div>
                <p className="text-sm text-[#1A1F2E] font-medium">{day}</p>
              </div>
              <span className="text-xs font-semibold text-[#7C3AED] bg-[#F3F0FF] px-2 py-0.5 rounded-full">
                {count} {count === 1 ? 'sesión' : 'sesiones'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
