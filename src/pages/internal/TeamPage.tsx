import { useEffect, useState, useRef } from 'react'
import {
  Plus, ChevronDown, Calendar, CheckCircle2, Clock,
  Users, BarChart3, AlertCircle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { IS_DEMO } from '../../store/auth'
import { NodoButton } from '../../components/ui/NodoButton'
import { NodoAvatar } from '../../components/ui/NodoAvatar'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string
  email: string
  full_name: string
  role: 'superadmin' | 'admin' | 'tecnico'
  avatar_url?: string
  is_active: boolean
  created_at: string
  metadata?: Record<string, unknown>
}

interface ProjectRow {
  id: string
  service_type: string
  status: string
  assigned_tech: string | null
  client_id: string
  clients: { business_name: string } | null
}

interface InternalTask {
  id: string
  title: string
  status: string
  assigned_to: string | null
  due_date: string | null
}

interface CalendarEvent {
  id: string
  title: string
  start_at: string
  end_at: string
  assigned_to: string[] | null
}

type Availability = 'disponible' | 'en_reunion' | 'ocupado'

const AVAIL_OPTIONS: { value: Availability; label: string; dot: string }[] = [
  { value: 'disponible', label: 'Disponible', dot: 'bg-emerald-400' },
  { value: 'en_reunion', label: 'En reunión', dot: 'bg-amber-400' },
  { value: 'ocupado', label: 'Ocupado', dot: 'bg-red-400' },
]

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  tecnico: 'Técnico',
}

const ROLE_STYLE: Record<string, string> = {
  superadmin: 'bg-[#C026A8]/15 text-[#C026A8] border border-[#C026A8]/30',
  admin: 'bg-[#C8F135]/12 text-[#C8F135] border border-[#C8F135]/30',
  tecnico: 'bg-[#8B22E8]/15 text-[#8B22E8] border border-[#8B22E8]/30',
}

const SERVICE_LABEL: Record<string, string> = {
  bpo_claudia: 'BPO Digital — Claudia',
  bpo_lucia: 'BPO Digital — Lucía',
  track_property: 'Track Property',
  recovery: 'NODO Recovery',
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_TEAM: TeamMember[] = [
  { id: '1', email: 'santiago@nodoone.com', full_name: 'Santiago R.', role: 'superadmin', is_active: true, created_at: '2025-01-01', metadata: { availability: 'disponible' } },
  { id: '2', email: 'admin@nodoone.com', full_name: 'Admin Demo', role: 'admin', is_active: true, created_at: '2025-01-15', metadata: { availability: 'en_reunion' } },
  { id: '3', email: 'claudia@nodoone.com', full_name: 'Claudia López', role: 'tecnico', is_active: true, created_at: '2025-02-01', metadata: {} },
  { id: '4', email: 'lucia@nodoone.com', full_name: 'Lucía Martín', role: 'tecnico', is_active: true, created_at: '2025-02-15', metadata: {} },
]

const DEMO_PROJECTS: ProjectRow[] = [
  { id: 'p1', service_type: 'bpo_claudia', status: 'active', assigned_tech: '3', client_id: 'c1', clients: { business_name: 'Clínica DentaPlus' } },
  { id: 'p2', service_type: 'bpo_lucia', status: 'active', assigned_tech: '3', client_id: 'c2', clients: { business_name: 'EstiloCasa' } },
  { id: 'p3', service_type: 'track_property', status: 'active', assigned_tech: null, client_id: 'c3', clients: { business_name: 'FitLife Studio' } },
  { id: 'p4', service_type: 'recovery', status: 'active', assigned_tech: '4', client_id: 'c4', clients: { business_name: 'MediBalance' } },
]

const DEMO_TASKS: InternalTask[] = [
  { id: 't1', title: 'Revisar onboarding DentaPlus', status: 'pendiente', assigned_to: '3', due_date: new Date().toISOString().split('T')[0] },
  { id: 't2', title: 'Actualizar bot FitLife', status: 'en_progreso', assigned_to: '4', due_date: new Date().toISOString().split('T')[0] },
  { id: 't3', title: 'Llamada revisión mensual', status: 'pendiente', assigned_to: '2', due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
  { id: 't4', title: 'Configurar plug solicitud', status: 'pendiente', assigned_to: '3', due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
]

const DEMO_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Reunión de equipo', start_at: new Date().toISOString(), end_at: new Date(Date.now() + 3600000).toISOString(), assigned_to: ['1', '2', '3', '4'] },
  { id: 'e2', title: 'Demo cliente MediBalance', start_at: new Date(Date.now() + 86400000).toISOString(), end_at: new Date(Date.now() + 90000000).toISOString(), assigned_to: ['4'] },
  { id: 'e3', title: 'Check-in DentaPlus', start_at: new Date(Date.now() + 172800000).toISOString(), end_at: new Date(Date.now() + 176400000).toISOString(), assigned_to: ['3'] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfWeek(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(): Date[] {
  const mon = startOfWeek()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function workloadPct(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 33
  if (count === 2) return 66
  return 100
}

function workloadColor(pct: number): string {
  if (pct < 34) return '#22c55e'
  if (pct < 67) return '#f59e0b'
  return '#ef4444'
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// ─── Availability Selector ────────────────────────────────────────────────────

function AvailabilitySelector({
  userId,
  initial,
  memberMetadata,
}: {
  userId: string
  initial: Availability
  memberMetadata: Record<string, unknown>
}) {
  const [value, setValue] = useState<Availability>(initial)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const current = AVAIL_OPTIONS.find(o => o.value === value) ?? AVAIL_OPTIONS[0]

  async function select(v: Availability) {
    setValue(v)
    setOpen(false)
    if (!IS_DEMO) {
      await supabase
        .from('internal_users')
        .update({ metadata: { ...memberMetadata, availability: v } })
        .eq('id', userId)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1A1825] border border-[#1E1C2A] rounded-lg text-xs font-medium text-white/70 hover:border-[#C026A8]/40 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${current.dot}`} />
        {current.label}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-[#12101A] border border-[#1E1C2A] rounded-xl shadow-xl overflow-hidden min-w-[130px]">
          {AVAIL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => select(opt.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-[#1A1825] ${
                value === opt.value ? 'text-white font-semibold' : 'text-white/60'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Quick Assign ─────────────────────────────────────────────────────────────

function QuickAssign({
  userId,
  unassignedProjects,
  onAssigned,
}: {
  userId: string
  unassignedProjects: ProjectRow[]
  onAssigned: (projectId: string, userId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (unassignedProjects.length === 0) return null

  async function assign(projectId: string) {
    setOpen(false)
    if (!IS_DEMO) {
      await supabase
        .from('projects')
        .update({ assigned_tech: userId })
        .eq('id', projectId)
    }
    onAssigned(projectId, userId)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#C026A8]/10 border border-[#C026A8]/25 text-[#C026A8] rounded-lg text-xs font-semibold hover:bg-[#C026A8]/20 transition-colors"
      >
        <Plus size={11} />
        Asignar proyecto
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-[#12101A] border border-[#1E1C2A] rounded-xl shadow-xl overflow-hidden min-w-[200px]">
          <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-bold text-white/30 uppercase tracking-wider">Sin asignar</p>
          {unassignedProjects.map(p => (
            <button
              key={p.id}
              onClick={() => assign(p.id)}
              className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-[#1A1825] hover:text-white transition-colors"
            >
              <span className="block font-medium">{p.clients?.business_name ?? 'Sin cliente'}</span>
              <span className="text-[10px] text-white/40">{SERVICE_LABEL[p.service_type] ?? p.service_type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Member Card ──────────────────────────────────────────────────────────────

function MemberCard({
  member,
  projects,
  unassignedProjects,
  onAssigned,
}: {
  member: TeamMember
  projects: ProjectRow[]
  unassignedProjects: ProjectRow[]
  onAssigned: (projectId: string, userId: string) => void
}) {
  const active = projects.filter(p => p.assigned_tech === member.id)
  const pct = workloadPct(active.length)
  const barColor = workloadColor(pct)
  const availability = (member.metadata?.availability as Availability | undefined) ?? 'disponible'

  return (
    <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <NodoAvatar name={member.full_name} src={member.avatar_url} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{member.full_name}</p>
          <p className="text-[11px] text-white/40 truncate">{member.email}</p>
          <div className="mt-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_STYLE[member.role] ?? ROLE_STYLE.tecnico}`}>
              {ROLE_LABEL[member.role] ?? member.role}
            </span>
          </div>
        </div>
        <AvailabilitySelector
          userId={member.id}
          initial={availability}
          memberMetadata={member.metadata ?? {}}
        />
      </div>

      {/* Workload */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Carga de trabajo</p>
          <span className="text-[11px] font-bold" style={{ color: barColor }}>{pct}%</span>
        </div>
        <div className="w-full bg-white/8 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Active projects */}
      <div>
        <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">Proyectos activos</p>
        {active.length === 0 ? (
          <p className="text-xs text-white/30 italic">Sin proyectos asignados</p>
        ) : (
          <div className="space-y-1.5">
            {active.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-[#1A1825] rounded-lg px-2.5 py-1.5">
                <CheckCircle2 size={11} className="text-[#8B22E8] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white/80 truncate">
                    {p.clients?.business_name ?? 'Sin cliente'}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">
                    {SERVICE_LABEL[p.service_type] ?? p.service_type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick assign */}
      <QuickAssign
        userId={member.id}
        unassignedProjects={unassignedProjects}
        onAssigned={onAssigned}
      />
    </div>
  )
}

// ─── Cell Popover ─────────────────────────────────────────────────────────────

function CellPopover({ items, onClose }: { items: string[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-30 top-full left-0 mt-1 bg-[#12101A] border border-[#1E1C2A] rounded-xl shadow-2xl p-3 min-w-[180px]"
    >
      <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Tareas / Eventos</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C026A8] flex-shrink-0 mt-1" />
          <p className="text-xs text-white/70">{item}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Tab Equipo ───────────────────────────────────────────────────────────────

function TabEquipo({
  team,
  projects,
  onAssigned,
}: {
  team: TeamMember[]
  projects: ProjectRow[]
  onAssigned: (projectId: string, userId: string) => void
}) {
  const unassignedProjects = projects.filter(p => !p.assigned_tech)

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map(member => (
          <MemberCard
            key={member.id}
            member={member}
            projects={projects}
            unassignedProjects={unassignedProjects}
            onAssigned={onAssigned}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Tab Operaciones ──────────────────────────────────────────────────────────

function TabOperaciones({
  team,
  tasks,
  events,
}: {
  team: TeamMember[]
  tasks: InternalTask[]
  events: CalendarEvent[]
}) {
  const weekDays = getWeekDays()
  const [openCell, setOpenCell] = useState<{ memberId: string; dayIdx: number } | null>(null)

  function getCellItems(memberId: string, day: Date): string[] {
    const taskItems = tasks
      .filter(t => t.assigned_to === memberId && t.due_date && isSameDay(new Date(t.due_date), day))
      .map(t => t.title)
    const eventItems = events
      .filter(e =>
        (e.assigned_to ?? []).includes(memberId) &&
        isSameDay(new Date(e.start_at), day)
      )
      .map(e => e.title)
    return [...taskItems, ...eventItems]
  }

  function cellStyle(count: number): string {
    if (count === 0) return 'bg-transparent'
    if (count <= 2) return 'bg-amber-500/15 border border-amber-500/25'
    return 'bg-red-500/15 border border-red-500/25'
  }

  function cellTextColor(count: number): string {
    if (count === 0) return 'text-white/20'
    if (count <= 2) return 'text-amber-400'
    return 'text-red-400'
  }

  const upcomingEvents = [...events]
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    .slice(0, 5)

  const pendingByMember = team.map(m => ({
    member: m,
    count: tasks.filter(t => t.assigned_to === m.id).length,
  }))

  return (
    <div className="space-y-6">
      {/* Weekly capacity grid */}
      <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E1C2A]">
          <p className="text-sm font-bold text-white">Capacidad semanal</p>
          <p className="text-xs text-white/40 mt-0.5">Semana del {weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} al {weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E1C2A]">
                <th className="text-left px-5 py-3 text-[11px] font-bold text-white/40 uppercase tracking-wider w-36">Miembro</th>
                {weekDays.map((d, i) => (
                  <th key={i} className="px-3 py-3 text-center text-[11px] font-bold text-white/40 uppercase tracking-wider min-w-[80px]">
                    <div>{DAY_LABELS[i]}</div>
                    <div className="text-[10px] font-normal text-white/25 mt-0.5">{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.map(m => (
                <tr key={m.id} className="border-b border-[#1E1C2A] last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <NodoAvatar name={m.full_name} size="xs" />
                      <span className="text-xs font-semibold text-white/70 truncate max-w-[90px]">{m.full_name.split(' ')[0]}</span>
                    </div>
                  </td>
                  {weekDays.map((day, di) => {
                    const items = getCellItems(m.id, day)
                    const count = items.length
                    const isOpen = openCell?.memberId === m.id && openCell?.dayIdx === di
                    return (
                      <td key={di} className="px-2 py-2 text-center relative">
                        <button
                          onClick={() => {
                            if (count === 0) return
                            setOpenCell(isOpen ? null : { memberId: m.id, dayIdx: di })
                          }}
                          className={`w-full rounded-lg py-1.5 text-xs font-bold transition-colors ${cellStyle(count)} ${
                            count > 0 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                          }`}
                        >
                          <span className={cellTextColor(count)}>
                            {count === 0 ? '—' : count}
                          </span>
                        </button>
                        {isOpen && (
                          <CellPopover items={items} onClose={() => setOpenCell(null)} />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending tasks */}
        <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E1C2A] flex items-center gap-2">
            <Clock size={14} className="text-[#C026A8]" />
            <p className="text-sm font-bold text-white">Tareas pendientes por miembro</p>
          </div>
          <div className="divide-y divide-[#1E1C2A]">
            {pendingByMember.map(({ member, count }) => (
              <div key={member.id} className="flex items-center gap-3 px-5 py-3.5">
                <NodoAvatar name={member.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80 truncate">{member.full_name}</p>
                  <p className="text-[11px] text-white/40">{member.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {count > 0 ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold border border-amber-500/25">
                      {count} tarea{count !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/12 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                      Al día
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E1C2A] flex items-center gap-2">
            <Calendar size={14} className="text-[#8B22E8]" />
            <p className="text-sm font-bold text-white">Próximos eventos esta semana</p>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-white/30">Sin eventos próximos</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1E1C2A]">
              {upcomingEvents.map(event => {
                const start = new Date(event.start_at)
                return (
                  <div key={event.id} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="flex-shrink-0 w-10 text-center">
                      <p className="text-xs font-bold text-[#8B22E8]">{start.toLocaleDateString('es-ES', { day: 'numeric' })}</p>
                      <p className="text-[10px] text-white/40">{start.toLocaleDateString('es-ES', { month: 'short' })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/80 truncate">{event.title}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {event.assigned_to && event.assigned_to.length > 0 && (
                          <span className="ml-1.5">· {event.assigned_to.length} asistente{event.assigned_to.length !== 1 ? 's' : ''}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TeamTab = 'equipo' | 'operaciones'

export function TeamPage() {
  const [activeTab, setActiveTab] = useState<TeamTab>('equipo')
  const [team, setTeam] = useState<TeamMember[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [tasks, setTasks] = useState<InternalTask[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (IS_DEMO) {
        setTeam(DEMO_TEAM)
        setProjects(DEMO_PROJECTS)
        setTasks(DEMO_TASKS)
        setEvents(DEMO_EVENTS)
        setLoading(false)
        return
      }

      const [teamRes, projectsRes, tasksRes] = await Promise.all([
        supabase.from('internal_users').select('*').eq('is_active', true).order('created_at'),
        supabase.from('projects').select('id, service_type, status, assigned_tech, client_id, clients!inner(business_name)').eq('status', 'active'),
        supabase.from('internal_tasks').select('id, title, status, assigned_to, due_date').in('status', ['pendiente', 'en_progreso']),
      ])

      const wStart = startOfWeek()
      const wEnd = new Date(wStart)
      wEnd.setDate(wStart.getDate() + 6)
      wEnd.setHours(23, 59, 59, 999)

      const eventsRes = await supabase
        .from('calendar_events')
        .select('id, title, start_at, end_at, assigned_to')
        .gte('start_at', wStart.toISOString())
        .lte('start_at', wEnd.toISOString())

      setTeam((teamRes.data as unknown as TeamMember[]) || [])
      setProjects((projectsRes.data as unknown as ProjectRow[]) || [])
      setTasks((tasksRes.data as unknown as InternalTask[]) || [])
      setEvents((eventsRes.data as unknown as CalendarEvent[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  function handleAssigned(projectId: string, userId: string) {
    setProjects(prev =>
      prev.map(p => p.id === projectId ? { ...p, assigned_tech: userId } : p)
    )
  }

  const TABS: { id: TeamTab; label: string; icon: React.ElementType }[] = [
    { id: 'equipo', label: 'Equipo', icon: Users },
    { id: 'operaciones', label: 'Operaciones', icon: BarChart3 },
  ]

  return (
    <div className="flex-1 overflow-y-auto fade-in" style={{ background: '#08070F' }}>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#1E1C2A]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1">Organización</p>
            <h1 className="text-2xl font-black text-white tracking-tight">Equipo & Operaciones</h1>
            <p className="text-sm text-white/40 mt-0.5">Gestión de recursos y capacidad del equipo NODO ONE</p>
          </div>
          <NodoButton
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => alert('Próximamente')}
          >
            Invitar miembro
          </NodoButton>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mt-5 border-b border-[#1E1C2A] -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#C026A8] text-[#C026A8]'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : team.length === 0 ? (
          <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl text-center py-16">
            <AlertCircle size={24} className="text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/30">No hay miembros del equipo activos.</p>
          </div>
        ) : activeTab === 'equipo' ? (
          <TabEquipo team={team} projects={projects} onAssigned={handleAssigned} />
        ) : (
          <TabOperaciones team={team} tasks={tasks} events={events} />
        )}
      </div>
    </div>
  )
}
