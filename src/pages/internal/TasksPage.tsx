import { useEffect, useState, useCallback } from 'react'
import {
  Plus, List, Columns, Search, ChevronLeft, ChevronRight,
  X, Calendar, Clock, User, Link2, Trash2, AlertCircle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { NodoButton } from '../../components/ui/NodoButton'
import { NodoInput } from '../../components/ui/NodoInput'
import { NodoTextarea } from '../../components/ui/NodoTextarea'
import { NodoAvatar } from '../../components/ui/NodoAvatar'

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskStatus = 'pendiente' | 'en_progreso' | 'revision' | 'completado'
type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente'
type TaskCategory =
  | 'automatizacion'
  | 'investigacion'
  | 'reunion'
  | 'crecimiento'
  | 'admin'
  | 'otro'

interface InternalTask {
  id: string
  title: string
  description?: string
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  assigned_to?: string
  client_id?: string
  project_id?: string
  due_date?: string
  estimated_hours?: number
  created_at: string
  // joined
  assigned_user?: { full_name: string; avatar_url?: string }
  client?: { business_name: string }
  project?: { service_type: string }
}

interface InternalUser {
  id: string
  full_name: string
  avatar_url?: string
}

interface ClientOption {
  id: string
  business_name: string
}

interface ProjectOption {
  id: string
  service_type: string
  client_id: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const KANBAN_COLS: { status: TaskStatus; label: string; bg: string; border: string; dot: string }[] = [
  { status: 'pendiente',   label: 'Pendiente',    bg: 'bg-white/[0.03]',           border: 'border-white/10',    dot: 'bg-white/30' },
  { status: 'en_progreso', label: 'En Progreso',  bg: 'bg-blue-500/[0.05]',        border: 'border-blue-500/20', dot: 'bg-blue-400' },
  { status: 'revision',    label: 'Revisión',     bg: 'bg-orange-500/[0.05]',      border: 'border-orange-500/20', dot: 'bg-orange-400' },
  { status: 'completado',  label: 'Completado',   bg: 'bg-green-500/[0.05]',       border: 'border-green-500/20', dot: 'bg-green-400' },
]

const STATUS_ORDER: TaskStatus[] = ['pendiente', 'en_progreso', 'revision', 'completado']

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  urgente: 'bg-red-500/15 text-red-400',
  alta: 'bg-orange-500/15 text-orange-400',
  media: 'bg-blue-500/15 text-blue-400',
  baja: 'bg-white/10 text-white/40',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

const CATEGORY_STYLES: Record<TaskCategory, string> = {
  automatizacion: 'bg-violet-500/15 text-violet-400',
  investigacion:  'bg-cyan-500/15 text-cyan-400',
  reunion:        'bg-pink-500/15 text-pink-400',
  crecimiento:    'bg-green-500/15 text-green-400',
  admin:          'bg-white/10 text-white/50',
  otro:           'bg-white/8 text-white/40',
}

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  automatizacion: 'Automatización',
  investigacion:  'Investigación',
  reunion:        'Reunión',
  crecimiento:    'Crecimiento',
  admin:          'Admin',
  otro:           'Otro',
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  bpo_claudia:    'BPO Claudia',
  bpo_lucia:      'BPO Lucía',
  track_property: 'Track Property',
  recovery:       'Recovery',
}

// ─── Blank form ───────────────────────────────────────────────────────────────
function blankForm() {
  return {
    title: '',
    description: '',
    category: 'otro' as TaskCategory,
    priority: 'media' as TaskPriority,
    status: 'pendiente' as TaskStatus,
    assigned_to: '',
    client_id: '',
    project_id: '',
    due_date: '',
    estimated_hours: '',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TasksPage() {
  const [tasks, setTasks] = useState<InternalTask[]>([])
  const [users, setUsers] = useState<InternalUser[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<InternalTask | null>(null)
  const [form, setForm] = useState(blankForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState('')

  const filteredProjects = projects.filter(p =>
    !form.client_id || p.client_id === form.client_id
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [tasksRes, usersRes, clientsRes, projectsRes] = await Promise.all([
        supabase
          .from('internal_tasks')
          .select(`
            *,
            assigned_user:assigned_to(full_name, avatar_url),
            client:client_id(business_name),
            project:project_id(service_type)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('internal_users').select('id, full_name, avatar_url').eq('is_active', true),
        supabase.from('clients').select('id, business_name').eq('is_active', true).order('business_name'),
        supabase.from('projects').select('id, service_type, client_id'),
      ])

      setTasks((tasksRes.data ?? []) as InternalTask[])
      setUsers((usersRes.data ?? []) as InternalUser[])
      setClients((clientsRes.data ?? []) as ClientOption[])
      setProjects((projectsRes.data ?? []) as ProjectOption[])
    } catch (err) {
      console.error('Error loading tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = tasks.filter(t => {
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.client?.business_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'all' || t.category === filterCategory
    const matchUser = filterAssignee === 'all' || t.assigned_to === filterAssignee
    const matchPri = filterPriority === 'all' || t.priority === filterPriority
    return matchSearch && matchCat && matchUser && matchPri
  })

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const now = new Date()
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const kpis = [
    { label: 'Total tareas', value: tasks.length, color: 'text-white' },
    { label: 'Pendientes', value: tasks.filter(t => t.status === 'pendiente').length, color: 'text-white/60' },
    { label: 'En progreso', value: tasks.filter(t => t.status === 'en_progreso').length, color: 'text-blue-400' },
    {
      label: 'Completadas (mes)',
      value: tasks.filter(t =>
        t.status === 'completado' &&
        t.created_at?.startsWith(thisMonthStr)
      ).length,
      color: 'text-green-400',
    },
  ]

  // ── Drawer helpers ───────────────────────────────────────────────────────────
  function openNew() {
    setEditingTask(null)
    setForm(blankForm())
    setFormError('')
    setDrawerOpen(true)
  }

  function openEdit(task: InternalTask) {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description ?? '',
      category: task.category,
      priority: task.priority,
      status: task.status,
      assigned_to: task.assigned_to ?? '',
      client_id: task.client_id ?? '',
      project_id: task.project_id ?? '',
      due_date: task.due_date ?? '',
      estimated_hours: task.estimated_hours?.toString() ?? '',
    })
    setFormError('')
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditingTask(null)
    setForm(blankForm())
    setFormError('')
  }

  // ── Move task (Kanban arrows) ────────────────────────────────────────────────
  async function moveTask(task: InternalTask, direction: 'left' | 'right') {
    const idx = STATUS_ORDER.indexOf(task.status)
    const nextIdx = direction === 'right' ? idx + 1 : idx - 1
    if (nextIdx < 0 || nextIdx >= STATUS_ORDER.length) return
    const newStatus = STATUS_ORDER[nextIdx]
    try {
      await supabase.from('internal_tasks').update({ status: newStatus }).eq('id', task.id)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    } catch (err) {
      console.error('Error moving task:', err)
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.title.trim()) {
      setFormError('El título es obligatorio.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        priority: form.priority,
        status: form.status,
        assigned_to: form.assigned_to || null,
        client_id: form.client_id || null,
        project_id: form.project_id || null,
        due_date: form.due_date || null,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      }
      if (editingTask) {
        const { error } = await supabase.from('internal_tasks').update(payload).eq('id', editingTask.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('internal_tasks').insert(payload)
        if (error) throw error
      }
      await loadData()
      closeDrawer()
    } catch (err) {
      setFormError('Error al guardar la tarea. Intenta de nuevo.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!editingTask) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('internal_tasks').delete().eq('id', editingTask.id)
      if (error) throw error
      await loadData()
      closeDrawer()
    } catch (err) {
      setFormError('Error al eliminar la tarea.')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{ background: '#08070F' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-1">Gestión interna</p>
          <h1 className="text-2xl font-bold text-white">Tareas</h1>
        </div>
        <NodoButton variant="primary" icon={<Plus size={14} />} onClick={openNew}>
          Nueva Tarea
        </NodoButton>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl border border-white/8 p-5" style={{ background: '#12101A' }}>
            <p className={`text-3xl font-black leading-none mb-2 ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-white/40 uppercase tracking-wide font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Buscar tarea o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-[#C026A8]/40 transition-all border border-white/8"
            style={{ background: '#1A1825' }}
          />
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm text-white/70 outline-none border border-white/8 focus:ring-1 focus:ring-[#C026A8]/40"
          style={{ background: '#1A1825' }}
        >
          <option value="all">Todas las categorías</option>
          {(Object.keys(CATEGORY_LABELS) as TaskCategory[]).map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>

        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm text-white/70 outline-none border border-white/8 focus:ring-1 focus:ring-[#C026A8]/40"
          style={{ background: '#1A1825' }}
        >
          <option value="all">Todos los asignados</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm text-white/70 outline-none border border-white/8 focus:ring-1 focus:ring-[#C026A8]/40"
          style={{ background: '#1A1825' }}
        >
          <option value="all">Toda prioridad</option>
          {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map(p => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="ml-auto flex rounded-xl overflow-hidden border border-white/10">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2.5 transition-colors ${viewMode === 'kanban' ? 'bg-[#C026A8] text-white' : 'text-white/40 hover:text-white'}`}
            style={{ background: viewMode === 'kanban' ? '#C026A8' : '#1A1825' }}
            title="Vista Kanban"
          >
            <Columns size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 transition-colors`}
            style={{ background: viewMode === 'list' ? '#C026A8' : '#1A1825' }}
            title="Vista lista"
          >
            <List size={15} className={viewMode === 'list' ? 'text-white' : 'text-white/40'} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Kanban ── */}
      {!loading && viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {KANBAN_COLS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.status)
            return (
              <div
                key={col.status}
                className={`rounded-2xl border ${col.bg} ${col.border} p-3 min-h-[300px]`}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wider flex-1">
                    {col.label}
                  </span>
                  <span className="text-xs text-white/30 font-mono">{colTasks.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {colTasks.length === 0 && (
                    <p className="text-center text-xs text-white/20 py-8">Sin tareas</p>
                  )}
                  {colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={openEdit}
                      onMove={moveTask}
                      statusOrder={STATUS_ORDER}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── List view ── */}
      {!loading && viewMode === 'list' && (
        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: '#12101A' }}>
          {filtered.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-16">No hay tareas que mostrar.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-widest px-5 py-3">Título</th>
                  <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-widest px-4 py-3 hidden md:table-cell">Categoría</th>
                  <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-widest px-4 py-3 hidden lg:table-cell">Prioridad</th>
                  <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-widest px-4 py-3 hidden lg:table-cell">Estado</th>
                  <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-widest px-4 py-3 hidden xl:table-cell">Asignado</th>
                  <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-widest px-4 py-3 hidden xl:table-cell">Cliente</th>
                  <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-widest px-4 py-3 hidden md:table-cell">Vence</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task, i) => (
                  <tr
                    key={task.id}
                    className={`cursor-pointer hover:bg-white/4 transition-colors ${i !== 0 ? 'border-t border-white/5' : ''}`}
                    onClick={() => openEdit(task)}
                  >
                    <td className="px-5 py-3">
                      <p className="text-white font-medium text-sm truncate max-w-[200px]">{task.title}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[task.category]}`}>
                        {CATEGORY_LABELS[task.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-white/50">
                        {KANBAN_COLS.find(c => c.status === task.status)?.label ?? task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {task.assigned_user ? (
                        <div className="flex items-center gap-2">
                          <NodoAvatar name={task.assigned_user.full_name} src={task.assigned_user.avatar_url} size="xs" />
                          <span className="text-xs text-white/60 truncate max-w-[100px]">{task.assigned_user.full_name}</span>
                        </div>
                      ) : <span className="text-xs text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-white/50">{task.client?.business_name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-white/40">{task.due_date ? formatDate(task.due_date) : '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          {/* Panel */}
          <div
            className="relative ml-auto w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden"
            style={{ background: '#12101A', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 flex-shrink-0">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-0.5">
                  {editingTask ? 'Editar tarea' : 'Nueva tarea'}
                </p>
                <h2 className="text-base font-bold text-white">
                  {editingTask ? editingTask.title : 'Crear tarea'}
                </h2>
              </div>
              <button onClick={closeDrawer} className="text-white/40 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Title */}
              <NodoInput
                label="Título *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Nombre de la tarea"
              />

              {/* Description */}
              <NodoTextarea
                label="Descripción"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detalle opcional..."
                rows={3}
              />

              {/* Row: category + priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as TaskCategory }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none border border-white/10 focus:ring-1 focus:ring-[#C026A8]/40"
                    style={{ background: '#1A1825' }}
                  >
                    {(Object.keys(CATEGORY_LABELS) as TaskCategory[]).map(c => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                    Prioridad
                  </label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none border border-white/10 focus:ring-1 focus:ring-[#C026A8]/40"
                    style={{ background: '#1A1825' }}
                  >
                    {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map(p => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                  Estado
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none border border-white/10 focus:ring-1 focus:ring-[#C026A8]/40"
                  style={{ background: '#1A1825' }}
                >
                  {KANBAN_COLS.map(c => (
                    <option key={c.status} value={c.status}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Assigned to */}
              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                  <User size={11} className="inline mr-1" />Asignado a
                </label>
                <select
                  value={form.assigned_to}
                  onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none border border-white/10 focus:ring-1 focus:ring-[#C026A8]/40"
                  style={{ background: '#1A1825' }}
                >
                  <option value="">Sin asignar</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Client */}
              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                  <Link2 size={11} className="inline mr-1" />Cliente (opcional)
                </label>
                <select
                  value={form.client_id}
                  onChange={e => setForm(f => ({ ...f, client_id: e.target.value, project_id: '' }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none border border-white/10 focus:ring-1 focus:ring-[#C026A8]/40"
                  style={{ background: '#1A1825' }}
                >
                  <option value="">Sin cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.business_name}</option>
                  ))}
                </select>
              </div>

              {/* Project — filtered by client */}
              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                  Proyecto (opcional)
                </label>
                <select
                  value={form.project_id}
                  onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                  disabled={!form.client_id}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none border border-white/10 focus:ring-1 focus:ring-[#C026A8]/40 disabled:opacity-40"
                  style={{ background: '#1A1825' }}
                >
                  <option value="">Sin proyecto</option>
                  {filteredProjects.map(p => (
                    <option key={p.id} value={p.id}>
                      {SERVICE_TYPE_LABELS[p.service_type] ?? p.service_type} — {clients.find(c => c.id === p.client_id)?.business_name ?? ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row: due date + estimated hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                    <Calendar size={11} className="inline mr-1" />Fecha límite
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none border border-white/10 focus:ring-1 focus:ring-[#C026A8]/40"
                    style={{ background: '#1A1825', colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                    <Clock size={11} className="inline mr-1" />Horas estimadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.estimated_hours}
                    onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none border border-white/10 focus:ring-1 focus:ring-[#C026A8]/40"
                    style={{ background: '#1A1825' }}
                  />
                </div>
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  <AlertCircle size={13} />
                  {formError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-white/8 flex-shrink-0">
              {editingTask && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm font-medium transition-colors disabled:opacity-50 mr-auto"
                >
                  <Trash2 size={14} />
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              )}
              <button
                onClick={closeDrawer}
                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors rounded-xl border border-white/8 hover:border-white/15"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                style={{ background: saving ? '#6b21a8' : 'linear-gradient(135deg, #E040A0, #C026A8, #8B22E8)', color: '#fff' }}
              >
                {saving ? 'Guardando...' : editingTask ? 'Guardar cambios' : 'Crear tarea'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Task Card (Kanban) ───────────────────────────────────────────────────────
function TaskCard({
  task,
  onEdit,
  onMove,
  statusOrder,
}: {
  task: InternalTask
  onEdit: (t: InternalTask) => void
  onMove: (t: InternalTask, dir: 'left' | 'right') => void
  statusOrder: TaskStatus[]
}) {
  const idx = statusOrder.indexOf(task.status)
  const canLeft = idx > 0
  const canRight = idx < statusOrder.length - 1

  return (
    <div
      className="rounded-xl border border-white/8 p-3 cursor-pointer hover:border-white/15 transition-all group"
      style={{ background: '#12101A' }}
      onClick={() => onEdit(task)}
    >
      {/* Badges row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORY_STYLES[task.category]}`}>
          {CATEGORY_LABELS[task.category]}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-white mb-2 leading-snug">{task.title}</p>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {task.assigned_user && (
          <div className="flex items-center gap-1">
            <NodoAvatar name={task.assigned_user.full_name} src={task.assigned_user.avatar_url} size="xs" />
          </div>
        )}
        {task.client?.business_name && (
          <span className="text-[10px] text-white/35 truncate max-w-[100px]">{task.client.business_name}</span>
        )}
        {task.due_date && (
          <span className="text-[10px] text-white/30 ml-auto flex items-center gap-1">
            <Calendar size={9} />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>

      {/* Move arrows */}
      <div
        className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <button
          disabled={!canLeft}
          onClick={() => onMove(task, 'left')}
          className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors px-1.5 py-0.5 rounded hover:bg-white/8"
        >
          <ChevronLeft size={11} />
        </button>
        <button
          disabled={!canRight}
          onClick={() => onMove(task, 'right')}
          className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors px-1.5 py-0.5 rounded hover:bg-white/8"
        >
          <ChevronRight size={11} />
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  } catch {
    return dateStr
  }
}
