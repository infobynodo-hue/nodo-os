import { useEffect, useState } from 'react'
import {
  CheckCircle, Circle, Clock, ChevronDown, ChevronUp, Lock, FolderKanban,
  Brain, BookOpen, CheckCircle2, XCircle, ArrowRight, Zap,
  Key, Eye, EyeOff, Copy, Check, Shield, Globe, Bot, Mail, Phone,
  Database, MessageCircle, ExternalLink,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore, IS_DEMO } from '../../store/auth'
import { DEMO_PROJECTS, DEMO_PHASES, DEMO_TASKS, DEMO_BOT_KNOWLEDGE } from '../../lib/demo'
import { NodoCard } from '../../components/ui/NodoCard'
import { NodoBadge } from '../../components/ui/NodoBadge'
import { NodoProgressBar } from '../../components/ui/NodoProgressBar'
import { KNOWLEDGE_CATEGORY_LABELS } from '../../types'
import type { Project, ProjectPhase, Task, BotKnowledge, KnowledgeCategory, ClientCredential } from '../../types'

// ─── Demo credentials ────────────────────────────────────────────────────────
const DEMO_CREDENTIALS: ClientCredential[] = [
  {
    id: 'c1', client_id: 'demo', platform: 'whatsapp_business',
    label: 'WhatsApp Business', username: '+34 600 000 000',
    password: 'demo_password_123', url: 'https://business.whatsapp.com',
    notes: 'Número principal de WhatsApp Business para el agente.',
    is_visible_to_client: true, created_at: new Date().toISOString(),
  },
  {
    id: 'c2', client_id: 'demo', platform: 'nodo_bot',
    label: 'Panel NODO Bot', username: 'cliente@empresa.com',
    password: 'secure_pass_456', url: 'https://app.nodoone.com',
    notes: 'Acceso al panel de control de tu empleado digital.',
    is_visible_to_client: true, created_at: new Date().toISOString(),
  },
  {
    id: 'c3', client_id: 'demo', platform: 'crm',
    label: 'CRM', username: 'admin@empresa.com',
    password: 'crm_password_789', url: 'https://crm.empresa.com',
    notes: 'CRM integrado con el agente.',
    is_visible_to_client: true, created_at: new Date().toISOString(),
  },
]

// ─── Bot onboarding fields ────────────────────────────────────────────────────
const ONBOARDING_FIELDS: Array<{ label: string; keywords: KnowledgeCategory[] }> = [
  { label: 'Saludo / presentación',   keywords: ['descripcion_general', 'personalidad_tono'] },
  { label: 'Servicios / productos',   keywords: ['servicios_activos'] },
  { label: 'Precios',                 keywords: ['servicios_activos'] },
  { label: 'Horarios de atención',    keywords: ['horarios_disponibilidad'] },
  { label: 'Preguntas frecuentes',    keywords: ['preguntas_frecuentes'] },
  { label: 'Tono de comunicación',    keywords: ['personalidad_tono'] },
]

type GroupedKnowledge = Partial<Record<KnowledgeCategory, BotKnowledge[]>>

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  whatsapp_business: MessageCircle, nodo_bot: Bot, crm: Database,
  instagram: Globe, email: Mail, phone: Phone, bot: Bot, web: Globe, otro: Key,
}
function getPlatformIcon(p: string): React.ElementType {
  return PLATFORM_ICONS[p.toLowerCase()] ?? Key
}

// ─── Credential card ──────────────────────────────────────────────────────────
function CredentialCard({ cred }: { cred: ClientCredential }) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const PlatformIcon = getPlatformIcon(cred.icon || cred.platform)

  async function copyPassword() {
    if (!cred.password) return
    await navigator.clipboard.writeText(cred.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-[#E8E6F0] bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E040A0]/10 to-[#8B22E8]/10 border border-[#C026A8]/20 flex items-center justify-center flex-shrink-0">
          <PlatformIcon size={18} className="text-[#C026A8]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1827]">{cred.label}</p>
          {cred.url && (
            <a href={cred.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-[#C026A8] hover:text-[#E040A0] transition-colors mt-0.5"
            >
              <Globe size={9} />
              {cred.url.replace(/^https?:\/\//, '').split('/')[0]}
              <ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-[#E8E6F0]" />
      <div className="px-4 py-3 space-y-3">
        {cred.username && (
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1">Usuario / Teléfono</p>
            <p className="text-sm font-mono text-[#2D2B3A] bg-[#F4F3F9] border border-[#E8E6F0] rounded-lg px-3 py-2">{cred.username}</p>
          </div>
        )}
        {cred.password && (
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1">Contraseña</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-[#F4F3F9] border border-[#E8E6F0] rounded-lg px-3 py-2">
                <p className="text-sm font-mono text-[#2D2B3A] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {showPassword ? cred.password : '••••••••'}
                </p>
              </div>
              <button onClick={() => setShowPassword(v => !v)}
                className="w-9 h-9 rounded-lg bg-[#F4F3F9] border border-[#E8E6F0] flex items-center justify-center text-[#6B6B80] hover:text-[#1A1827] hover:border-[#C026A8]/40 transition-all flex-shrink-0">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button onClick={copyPassword}
                className="w-9 h-9 rounded-lg bg-[#F4F3F9] border border-[#E8E6F0] flex items-center justify-center text-[#6B6B80] hover:text-[#1A1827] hover:border-[#C026A8]/40 transition-all flex-shrink-0">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}
        {cred.url && (
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1">Enlace</p>
            <a href={cred.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#C026A8] hover:text-[#E040A0] transition-colors font-medium bg-[#F4F3F9] border border-[#E8E6F0] rounded-lg px-3 py-2">
              <Globe size={13} />
              <span className="flex-1 truncate">{cred.url}</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}
        {cred.notes && (
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1">Notas</p>
            <p className="text-xs text-[#6B6B80] leading-relaxed">{cred.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'phases' | 'bot' | 'credentials'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'phases',      label: 'Fases',          icon: FolderKanban },
  { id: 'bot',         label: 'Base del Bot',   icon: Brain },
  { id: 'credentials', label: 'Mis Accesos',    icon: Key },
]

// ─── Main component ───────────────────────────────────────────────────────────
export function ClientProjectPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('phases')

  // Phases & tasks
  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<ProjectPhase[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)

  // Bot knowledge
  const [knowledge, setKnowledge] = useState<GroupedKnowledge>({})
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory | null>(null)

  // Credentials
  const [credentials, setCredentials] = useState<ClientCredential[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [user?.id])

  async function loadData() {
    setLoading(true)
    if (IS_DEMO) {
      const demoProject = DEMO_PROJECTS[0]
      setProject(demoProject)
      setPhases(DEMO_PHASES.filter(p => p.project_id === demoProject.id))
      setTasks(DEMO_TASKS.filter(t => t.project_id === demoProject.id && t.assigned_to === 'client'))
      setExpandedPhase(demoProject.current_phase)

      const grouped: GroupedKnowledge = {}
      for (const item of DEMO_BOT_KNOWLEDGE) {
        const cat = item.category as KnowledgeCategory
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat]!.push(item)
      }
      setKnowledge(grouped)
      setCredentials(DEMO_CREDENTIALS)
      setLoading(false)
      return
    }

    if (!user?.projectId) { setLoading(false); return }

    const [projectRes, phasesRes, tasksRes, botRes, credsRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', user.projectId).single(),
      supabase.from('project_phases').select('*').eq('project_id', user.projectId).order('phase_number'),
      supabase.from('tasks').select('*').eq('project_id', user.projectId).eq('assigned_to', 'client').eq('is_enabled', true).order('order_index'),
      supabase.from('bot_knowledge').select('*').eq('project_id', user.projectId).eq('is_visible_to_client', true).order('order_index'),
      supabase.from('client_credentials').select('*').eq('client_id', user.clientId ?? '').eq('is_visible_to_client', true).order('created_at'),
    ])

    setProject(projectRes.data)
    setPhases(phasesRes.data || [])
    setTasks(tasksRes.data || [])
    if (projectRes.data) setExpandedPhase(projectRes.data.current_phase)

    const grouped: GroupedKnowledge = {}
    for (const item of botRes.data || []) {
      const cat = item.category as KnowledgeCategory
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat]!.push(item)
    }
    setKnowledge(grouped)
    setCredentials(credsRes.data || [])
    setLoading(false)
  }

  async function toggleTask(taskId: string, completed: boolean) {
    await supabase.from('tasks').update({ is_completed: completed, completed_at: completed ? new Date().toISOString() : null }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: completed } : t))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.is_completed).length
  const botCategories = Object.keys(knowledge) as KnowledgeCategory[]
  const onboardingFields = ONBOARDING_FIELDS.map(f => ({
    label: f.label,
    complete: f.keywords.some(kw => knowledge[kw] && knowledge[kw]!.length > 0),
  }))
  const completedOnboarding = onboardingFields.filter(f => f.complete).length
  const completionPct = Math.round((completedOnboarding / onboardingFields.length) * 100)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 md:px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E040A0]/10 to-[#8B22E8]/10 flex items-center justify-center">
            <FolderKanban size={17} className="text-[#C026A8]" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1A1827]">Mi Proyecto</h1>
            {project && (
              <div className="flex items-center gap-2 mt-0.5">
                <NodoBadge status={project.status} size="sm" />
                <span className="text-xs text-[#6B6B80]">Fase {project.current_phase} activa</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#E8E6F0]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.id
                  ? 'text-[#1A1827] border-[#C026A8]'
                  : 'text-[#6B6B80] border-transparent hover:text-[#1A1827]'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">

        {/* ── FASES ── */}
        {tab === 'phases' && (
          <>
            {project && (
              <NodoCard dark className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1A1827]">Progreso general</p>
                    {totalTasks > 0 && (
                      <p className="text-xs text-[#6B6B80] mt-0.5">{completedTasks} de {totalTasks} tareas completadas</p>
                    )}
                  </div>
                  <span className="text-2xl font-bold gradient-text">{project.progress_pct}%</span>
                </div>
                <NodoProgressBar value={project.progress_pct} size="md" />
              </NodoCard>
            )}

            <p className="text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-3">Fases del proyecto</p>
            <div className="space-y-2">
              {phases.map((phase) => {
                const phaseTasks = tasks.filter(t => t.phase_number === phase.phase_number)
                const isExpanded = expandedPhase === phase.phase_number
                const isCurrent = project?.current_phase === phase.phase_number
                const isFuture = project && phase.phase_number > project.current_phase
                const phaseCompleted = phaseTasks.filter(t => t.is_completed).length

                return (
                  <NodoCard key={phase.id} dark padding="none"
                    className={`overflow-hidden transition-all ${isCurrent ? 'border border-[#C026A8]/40' : ''}`}
                  >
                    <button
                      onClick={() => setExpandedPhase(isExpanded ? null : phase.phase_number)}
                      disabled={!!isFuture}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        phase.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400'
                        : phase.status === 'in_progress' ? 'bg-[#C026A8]/10 text-[#C026A8]'
                        : 'bg-[#EEECF8] text-[#6B6B80]'
                      }`}>
                        {phase.status === 'completed' ? <CheckCircle size={16} />
                          : phase.status === 'in_progress' ? <Clock size={16} />
                          : isFuture ? <Lock size={14} />
                          : <Circle size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${isFuture ? 'text-[#6B6B80]' : 'text-[#1A1827]'}`}>
                            Fase {phase.phase_number}: {phase.phase_name}
                          </p>
                          {isCurrent && <NodoBadge status="in_progress" size="sm" label="Actual" />}
                        </div>
                        {phaseTasks.length > 0 && !isFuture && (
                          <p className="text-xs text-[#6B6B80] mt-0.5">{phaseCompleted}/{phaseTasks.length} tareas</p>
                        )}
                        {phase.phase_description && (
                          <p className="text-xs text-[#6B6B80] mt-0.5 truncate">{phase.phase_description}</p>
                        )}
                      </div>
                      {!isFuture && (
                        <div className="text-[#6B6B80]">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      )}
                    </button>

                    {isExpanded && phaseTasks.length > 0 && (
                      <div className="border-t border-[#EEEDF5] px-4 pb-3">
                        <p className="text-xs text-[#9999AA] py-2.5 font-medium uppercase tracking-wider">Tus tareas:</p>
                        <div className="space-y-2.5">
                          {phaseTasks.map((task) => (
                            <div key={task.id} className="flex items-start gap-3">
                              <button
                                onClick={() => toggleTask(task.id, !task.is_completed)}
                                className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border transition-colors ${
                                  task.is_completed
                                    ? 'bg-[#C026A8] border-[#C026A8] flex items-center justify-center'
                                    : 'border-[#C026A8]/30 hover:border-[#C026A8]'
                                }`}
                              >
                                {task.is_completed && (
                                  <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                              <p className={`text-sm leading-snug ${task.is_completed ? 'line-through text-[#6B6B80]' : 'text-[#2D2B3A]'}`}>
                                {task.title}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {isExpanded && phaseTasks.length === 0 && (
                      <div className="border-t border-[#EEEDF5] px-4 py-3">
                        <p className="text-xs text-[#9999AA]">No hay tareas asignadas a ti en esta fase.</p>
                      </div>
                    )}
                  </NodoCard>
                )
              })}
            </div>
          </>
        )}

        {/* ── BASE DEL BOT ── */}
        {tab === 'bot' && (
          <>
            {/* Onboarding progress */}
            <div className="rounded-2xl border border-[#E8E6F0] bg-white p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-[#1A1827]">Completitud del Onboarding</p>
                  <p className="text-xs text-[#6B6B80] mt-0.5">{completedOnboarding} de {onboardingFields.length} campos configurados</p>
                </div>
                <span className="text-2xl font-bold gradient-text">{completionPct}%</span>
              </div>
              <NodoProgressBar value={completionPct} size="sm" />
              <div className="grid grid-cols-2 gap-1.5 mt-3">
                {onboardingFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {field.complete
                      ? <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                      : <XCircle size={13} className="text-[#6B6B80] flex-shrink-0" />}
                    <span className={`text-xs ${field.complete ? 'text-[#2D2B3A]' : 'text-[#6B6B80]'}`}>{field.label}</span>
                  </div>
                ))}
              </div>
              {completionPct < 100 && (
                <button
                  onClick={() => navigate('/client/chat')}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #E040A0, #C026A8 50%, #8B22E8)' }}
                >
                  <Zap size={13} /> Completar con el agente <ArrowRight size={13} />
                </button>
              )}
            </div>

            {botCategories.length === 0 ? (
              <NodoCard dark className="text-center py-12">
                <Brain size={32} className="text-[#BBBBCC] mx-auto mb-3" />
                <p className="text-sm text-[#6B6B80]">La base de conocimiento aún está siendo configurada.</p>
                <p className="text-xs text-[#9999AA] mt-1">Vuelve más adelante cuando tu proyecto esté más avanzado.</p>
              </NodoCard>
            ) : (
              <>
                {botCategories.length > 1 && (
                  <div className="flex gap-1.5 flex-wrap mb-4">
                    <button
                      onClick={() => setActiveCategory(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        activeCategory === null
                          ? 'bg-[#C026A8]/15 text-[#C026A8] border-[#C026A8]/30'
                          : 'text-[#6B6B80] hover:text-[#1A1827] hover:bg-[#F0EFF7] border-transparent'
                      }`}
                    >Todo</button>
                    {botCategories.map((cat) => (
                      <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          activeCategory === cat
                            ? 'bg-[#C026A8]/15 text-[#C026A8] border-[#C026A8]/30'
                            : 'text-[#6B6B80] hover:text-[#1A1827] hover:bg-[#F0EFF7] border-transparent'
                        }`}
                      >
                        {KNOWLEDGE_CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-5">
                  {(activeCategory ? [activeCategory] : botCategories).map((cat) => (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <BookOpen size={12} className="text-[#C026A8]" />
                        <p className="text-xs font-semibold text-[#C026A8] uppercase tracking-wider">
                          {KNOWLEDGE_CATEGORY_LABELS[cat]}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {knowledge[cat]!.map((item) => (
                          <NodoCard key={item.id} dark padding="md">
                            <p className="text-sm font-semibold text-[#1A1827] mb-1.5">{item.title}</p>
                            <p className="text-sm text-[#4D4B60] leading-relaxed whitespace-pre-wrap">{item.content}</p>
                          </NodoCard>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── MIS ACCESOS ── */}
        {tab === 'credentials' && (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-5">
              <Shield size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400">Información confidencial</p>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  No compartas estas credenciales con terceros. Si sospechas de un acceso no autorizado, contacta al equipo de NODO ONE.
                </p>
              </div>
            </div>

            {credentials.length === 0 ? (
              <div className="rounded-2xl border border-[#E8E6F0] bg-white p-12 text-center">
                <Key size={36} className="text-[#BBBBCC] mx-auto mb-3" />
                <p className="text-sm text-[#6B6B80] font-medium">Sin credenciales aún</p>
                <p className="text-xs text-[#9999AA] mt-1 max-w-xs mx-auto">
                  El equipo de NODO ONE compartirá aquí los accesos a tus plataformas cuando estén listos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {credentials.map(cred => (
                  <CredentialCard key={cred.id} cred={cred} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
