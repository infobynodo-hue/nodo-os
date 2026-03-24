import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Phone, Mail, TrendingUp,
  ChevronRight, X, CircleDollarSign, Users, Target, Flame, ArrowRight,
  CheckCircle2, Circle, Clock, Phone as PhoneIcon, Mail as MailIcon,
  MessageCircle, FileText, StickyNote, CheckSquare, SkipForward, ChevronDown, ChevronUp,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { NodoButton } from '../../components/ui/NodoButton'
import { NodoInput } from '../../components/ui/NodoInput'
import { NodoTextarea } from '../../components/ui/NodoTextarea'
import { NodoAvatar } from '../../components/ui/NodoAvatar'
import type { Lead, LeadStatus, LeadSource, ServiceType, LeadSequence, LeadActivity } from '../../types'
import {
  LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS,
  SERVICE_LABELS,
} from '../../types'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL

// ─── Demo data ───────────────────────────────────────────────────────────────
const DEMO_LEADS: Lead[] = [
  {
    id: 'l1', business_name: 'Clínica Smileplus', contact_name: 'Dra. Marta Fonts',
    contact_email: 'marta@smileplus.es', contact_phone: '+34 611 222 333',
    sector: 'Clínicas dentales', source: 'referido', service_interest: 'bpo_claudia',
    estimated_mrr: 1117, status: 'propuesta', notes: 'Muy interesada, espera presupuesto final.',
    created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-15T10:00:00Z',
    next_follow_up: '2026-03-22T10:00:00Z',
  },
  {
    id: 'l2', business_name: 'InmoBcn Group', contact_name: 'Carlos Rueda',
    contact_email: 'crueda@inmobcn.com', contact_phone: '+34 622 444 555',
    sector: 'Inmobiliaria', source: 'linkedin', service_interest: 'track_property',
    estimated_mrr: 2000, status: 'negociacion', notes: 'Quiere descuento por anual.',
    created_at: '2026-03-05T10:00:00Z', updated_at: '2026-03-18T10:00:00Z',
  },
  {
    id: 'l3', business_name: 'Belleza Total SL', contact_name: 'Ana Morales',
    contact_email: 'ana@bellezatotal.es', source: 'instagram', service_interest: 'bpo_lucia',
    estimated_mrr: 1677, status: 'contactado', notes: 'Primera llamada realizada, positiva.',
    created_at: '2026-03-10T10:00:00Z', updated_at: '2026-03-12T10:00:00Z',
  },
  {
    id: 'l4', business_name: 'TechStart Valencia', contact_name: 'Jordi López',
    sector: 'Tecnología', source: 'web', service_interest: 'bpo_claudia',
    estimated_mrr: 789, status: 'nuevo',
    created_at: '2026-03-18T10:00:00Z', updated_at: '2026-03-18T10:00:00Z',
  },
  {
    id: 'l5', business_name: 'FitLife Gym', contact_name: 'Pedro Sainz',
    contact_email: 'pedro@fitlife.es', source: 'evento', service_interest: 'bpo_claudia',
    estimated_mrr: 1117, status: 'cerrado_ganado', notes: 'Firmado contrato anual.',
    created_at: '2026-02-10T10:00:00Z', updated_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'l6', business_name: 'Restaurante Casa Juana', contact_name: 'Juana Pérez',
    source: 'cold_outreach', estimated_mrr: 789, status: 'cerrado_perdido',
    notes: 'Precio demasiado alto, lo dejaremos para el año que viene.',
    created_at: '2026-02-15T10:00:00Z', updated_at: '2026-02-28T10:00:00Z',
  },
]

const DEMO_SEQUENCES: LeadSequence[] = [
  {
    id: 'seq1', name: 'Secuencia Referidos', color: '#C026A8', is_active: true,
    trigger_source: ['referido'], description: 'Para leads que llegan por referencia',
    created_at: '2026-01-01T00:00:00Z',
    lead_sequence_steps: [
      { id: 's1', sequence_id: 'seq1', step_number: 1, action_type: 'llamada', title: 'Llamada inicial', day_offset: 0, is_required: true },
      { id: 's2', sequence_id: 'seq1', step_number: 2, action_type: 'email', title: 'Enviar presentación', day_offset: 2, is_required: true },
      { id: 's3', sequence_id: 'seq1', step_number: 3, action_type: 'propuesta', title: 'Presentar propuesta', day_offset: 5, is_required: true },
      { id: 's4', sequence_id: 'seq1', step_number: 4, action_type: 'reunion', title: 'Reunión de cierre', day_offset: 10, is_required: false },
    ],
  },
  {
    id: 'seq2', name: 'Secuencia Instagram', color: '#E040A0', is_active: true,
    trigger_source: ['instagram'], description: 'Para leads de Instagram',
    created_at: '2026-01-01T00:00:00Z',
    lead_sequence_steps: [
      { id: 's5', sequence_id: 'seq2', step_number: 1, action_type: 'whatsapp', title: 'Mensaje de bienvenida', day_offset: 0, is_required: true },
      { id: 's6', sequence_id: 'seq2', step_number: 2, action_type: 'llamada', title: 'Llamada de descubrimiento', day_offset: 3, is_required: true },
    ],
  },
  {
    id: 'seq3', name: 'Secuencia Cold Outreach', color: '#8B22E8', is_active: true,
    trigger_source: ['cold_outreach', 'linkedin'], description: 'Para leads fríos',
    created_at: '2026-01-01T00:00:00Z',
    lead_sequence_steps: [
      { id: 's7', sequence_id: 'seq3', step_number: 1, action_type: 'email', title: 'Email de presentación', day_offset: 0, is_required: true },
      { id: 's8', sequence_id: 'seq3', step_number: 2, action_type: 'llamada', title: 'Seguimiento telefónico', day_offset: 5, is_required: true },
      { id: 's9', sequence_id: 'seq3', step_number: 3, action_type: 'email', title: 'Email de valor', day_offset: 10, is_required: false },
    ],
  },
  {
    id: 'seq4', name: 'Secuencia General', color: '#C8F135', is_active: true,
    trigger_source: ['web', 'evento', 'otro'], description: 'Secuencia estándar para cualquier lead',
    created_at: '2026-01-01T00:00:00Z',
    lead_sequence_steps: [
      { id: 's10', sequence_id: 'seq4', step_number: 1, action_type: 'llamada', title: 'Primera llamada', day_offset: 0, is_required: true },
      { id: 's11', sequence_id: 'seq4', step_number: 2, action_type: 'propuesta', title: 'Enviar propuesta', day_offset: 7, is_required: true },
    ],
  },
]

const DEMO_ACTIVITIES: Record<string, LeadActivity[]> = {
  l1: [
    {
      id: 'a1', lead_id: 'l1', activity_type: 'llamada', title: 'Llamada inicial',
      outcome: 'Muy receptiva, pide presupuesto detallado', status: 'completado',
      scheduled_at: '2026-03-01T10:00:00Z', completed_at: '2026-03-01T10:30:00Z',
      created_at: '2026-03-01T10:00:00Z',
    },
    {
      id: 'a2', lead_id: 'l1', activity_type: 'email', title: 'Enviar presentación',
      status: 'completado', scheduled_at: '2026-03-03T10:00:00Z', completed_at: '2026-03-03T11:00:00Z',
      created_at: '2026-03-03T10:00:00Z',
    },
    {
      id: 'a3', lead_id: 'l1', activity_type: 'propuesta', title: 'Presentar propuesta',
      status: 'pendiente', scheduled_at: '2026-03-22T10:00:00Z',
      created_at: '2026-03-03T11:00:00Z',
    },
  ],
}

// ─── Pipeline columns ─────────────────────────────────────────────────────────
const PIPELINE_COLS: { status: LeadStatus; label: string; color: string; bg: string }[] = [
  { status: 'nuevo',           label: 'Nuevo',       color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  { status: 'contactado',      label: 'Contactado',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { status: 'propuesta',       label: 'Propuesta',   color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { status: 'negociacion',     label: 'Negociación', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { status: 'cerrado_ganado',  label: 'Ganado ✓',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  { status: 'cerrado_perdido', label: 'Perdido',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
]

function statusStyle(status: LeadStatus): string {
  const col = PIPELINE_COLS.find(c => c.status === status)
  return col ? col.color : 'text-white/40'
}

function sourceLabel(source: LeadSource): string {
  return LEAD_SOURCE_LABELS[source] ?? source
}

// ─── Action type icons ────────────────────────────────────────────────────────
type ActivityType = 'llamada' | 'email' | 'whatsapp' | 'propuesta' | 'reunion' | 'nota' | 'tarea'

function ActivityIcon({ type, size = 14, className = '' }: { type: ActivityType; size?: number; className?: string }) {
  const icons: Record<ActivityType, React.ReactNode> = {
    llamada:   <PhoneIcon size={size} className={className} />,
    email:     <MailIcon size={size} className={className} />,
    whatsapp:  <MessageCircle size={size} className={className} />,
    propuesta: <FileText size={size} className={className} />,
    reunion:   <Users size={size} className={className} />,
    nota:      <StickyNote size={size} className={className} />,
    tarea:     <CheckSquare size={size} className={className} />,
  }
  return <>{icons[type]}</>
}

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  llamada: 'Llamada',
  email: 'Email',
  whatsapp: 'WhatsApp',
  propuesta: 'Propuesta',
  reunion: 'Reunión',
  nota: 'Nota',
  tarea: 'Tarea',
}

function activityTypeColor(type: ActivityType): string {
  const colors: Record<ActivityType, string> = {
    llamada:   'text-green-400',
    email:     'text-blue-400',
    whatsapp:  'text-emerald-400',
    propuesta: 'text-violet-400',
    reunion:   'text-orange-400',
    nota:      'text-yellow-400',
    tarea:     'text-pink-400',
  }
  return colors[type]
}

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return new Date(dateStr).toLocaleDateString('es-ES')
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LeadsPage() {
  const navigate = useNavigate()
  const [leads, setLeads]         = useState<Lead[]>([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState<'kanban' | 'list'>('kanban')
  const [showForm, setShowForm]   = useState(false)
  const [selected, setSelected]   = useState<Lead | null>(null)
  const [sequences, setSequences] = useState<LeadSequence[]>([])

  useEffect(() => { loadLeads(); loadSequences() }, [])

  async function loadLeads() {
    setLoading(true)
    if (IS_DEMO) {
      setLeads(DEMO_LEADS)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  async function loadSequences() {
    if (IS_DEMO) {
      setSequences(DEMO_SEQUENCES)
      return
    }
    const { data } = await supabase
      .from('lead_sequences')
      .select('*, lead_sequence_steps(*)')
      .eq('is_active', true)
      .order('created_at')
    setSequences(data || [])
  }

  const totalMRR     = leads.filter(l => l.status === 'cerrado_ganado').reduce((s, l) => s + (l.estimated_mrr || 0), 0)
  const pipelineMRR  = leads.filter(l => !['cerrado_ganado','cerrado_perdido'].includes(l.status)).reduce((s, l) => s + (l.estimated_mrr || 0), 0)
  const winRate      = leads.length ? Math.round(leads.filter(l => l.status === 'cerrado_ganado').length / leads.filter(l => ['cerrado_ganado','cerrado_perdido'].includes(l.status)).length * 100) || 0 : 0
  const activeLeads  = leads.filter(l => !['cerrado_ganado','cerrado_perdido'].includes(l.status)).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-8 fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CRM</p>
            <h1 className="text-2xl font-bold text-[#1A1F2E]">Pipeline de Ventas</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-white border border-[#E5E8EF] rounded-xl overflow-hidden">
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-2 text-xs font-semibold transition-all ${view === 'kanban' ? 'bg-[#1E2433] text-white' : 'text-[#6B7280] hover:text-[#1A1F2E]'}`}
              >Kanban</button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 text-xs font-semibold transition-all ${view === 'list' ? 'bg-[#1E2433] text-white' : 'text-[#6B7280] hover:text-[#1A1F2E]'}`}
              >Lista</button>
            </div>
            <NodoButton variant="primary" icon={<Plus size={14} />} onClick={() => setShowForm(true)}>
              Nuevo lead
            </NodoButton>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Flame,            label: 'Leads activos',    value: activeLeads,            suffix: '' },
            { icon: CircleDollarSign, label: 'MRR pipeline',     value: `€${pipelineMRR.toLocaleString()}`, suffix: '' },
            { icon: TrendingUp,       label: 'MRR cerrado',      value: `€${totalMRR.toLocaleString()}`,    suffix: '' },
            { icon: Target,           label: 'Tasa de cierre',   value: winRate,                suffix: '%' },
          ].map(({ icon: Icon, label, value, suffix }) => (
            <div key={label} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-[#9CA3AF]" />
                <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">{label}</p>
              </div>
              <p className="text-2xl font-black text-[#1A1F2E]">{value}{suffix}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#1E2433] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === 'kanban' ? (
          <KanbanView leads={leads} onSelect={setSelected} onStatusChange={handleStatusChange} />
        ) : (
          <ListView leads={leads} onSelect={setSelected} />
        )}
      </div>

      {/* Lead Detail Drawer */}
      {selected && (
        <LeadDrawer
          lead={selected}
          sequences={sequences}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onConvert={(lead) => navigate('/internal/clients/new', { state: { fromLead: lead } })}
        />
      )}

      {/* New Lead Form */}
      {showForm && (
        <NewLeadModal onClose={() => setShowForm(false)} onCreate={handleCreate} />
      )}
    </div>
  )

  async function handleStatusChange(leadId: string, newStatus: LeadStatus) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
    if (!IS_DEMO) {
      await supabase.from('leads').update({ status: newStatus }).eq('id', leadId)
    }
  }

  async function handleCreate(data: Partial<Lead>) {
    if (IS_DEMO) {
      const newLead: Lead = {
        id: `l${Date.now()}`,
        business_name: data.business_name || '',
        contact_name: data.contact_name || '',
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        sector: data.sector,
        source: data.source || 'otro',
        service_interest: data.service_interest,
        estimated_mrr: data.estimated_mrr,
        status: 'nuevo',
        notes: data.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setLeads(prev => [newLead, ...prev])
    } else {
      const { data: created } = await supabase.from('leads').insert([{ ...data, status: 'nuevo' }]).select().single()
      if (created) setLeads(prev => [created, ...prev])
    }
    setShowForm(false)
  }

  async function handleUpdate(id: string, updates: Partial<Lead>) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
    setSelected(prev => prev ? { ...prev, ...updates } : null)
    if (!IS_DEMO) {
      await supabase.from('leads').update(updates).eq('id', id)
    }
  }

  async function handleDelete(id: string) {
    setLeads(prev => prev.filter(l => l.id !== id))
    setSelected(null)
    if (!IS_DEMO) {
      await supabase.from('leads').delete().eq('id', id)
    }
  }
}

// ─── Kanban View ──────────────────────────────────────────────────────────────
function KanbanView({ leads, onSelect, onStatusChange }: {
  leads: Lead[]
  onSelect: (l: Lead) => void
  onStatusChange: (id: string, s: LeadStatus) => void
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
      {PIPELINE_COLS.map(col => {
        const colLeads = leads.filter(l => l.status === col.status)
        const colMRR   = colLeads.reduce((s, l) => s + (l.estimated_mrr || 0), 0)
        return (
          <div key={col.status} className="flex-shrink-0 w-64">
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border mb-3 ${col.bg}`}>
              <span className={`text-xs font-bold uppercase tracking-wide ${col.color}`}>{col.label}</span>
              <div className="flex items-center gap-2">
                {colMRR > 0 && <span className="text-[10px] text-white/40">€{colMRR.toLocaleString()}</span>}
                <span className={`text-[10px] font-bold ${col.color}`}>{colLeads.length}</span>
              </div>
            </div>
            {/* Cards */}
            <div className="space-y-2">
              {colLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} onSelect={onSelect} onStatusChange={onStatusChange} />
              ))}
              {colLeads.length === 0 && (
                <div className="text-center py-6 text-xs text-[#9CA3AF] border-2 border-dashed border-[#E5E8EF] rounded-xl">
                  Sin leads
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Lead Card ────────────────────────────────────────────────────────────────
function LeadCard({ lead, onSelect, onStatusChange }: {
  lead: Lead
  onSelect: (l: Lead) => void
  onStatusChange: (id: string, s: LeadStatus) => void
}) {
  const [showMove, setShowMove] = useState(false)

  return (
    <div
      className="bg-white border border-[#E5E8EF] rounded-xl p-3 shadow-[0_1px_6px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-[#C8F135]/40 cursor-pointer transition-all group"
      onClick={() => onSelect(lead)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <NodoAvatar name={lead.business_name} size="sm" />
          <div>
            <p className="text-xs font-semibold text-[#1A1F2E] leading-tight">{lead.business_name}</p>
            <p className="text-[10px] text-[#9CA3AF]">{lead.contact_name}</p>
          </div>
        </div>
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowMove(!showMove)}
            className="text-[#9CA3AF] hover:text-[#1A1F2E] p-1 rounded-lg hover:bg-[#F4F6F9] transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={12} />
          </button>
          {showMove && (
            <div className="absolute right-0 top-6 bg-white border border-[#E5E8EF] rounded-xl shadow-xl z-20 py-1 w-40">
              {PIPELINE_COLS.filter(c => c.status !== lead.status).map(col => (
                <button
                  key={col.status}
                  onClick={() => { onStatusChange(lead.id, col.status); setShowMove(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#F4F6F9] ${col.color} font-medium`}
                >
                  → {col.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] bg-[#F4F6F9] text-[#6B7280] px-2 py-0.5 rounded-full">{sourceLabel(lead.source)}</span>
        {lead.estimated_mrr && (
          <span className="text-[10px] font-bold text-[#1A1F2E]">€{lead.estimated_mrr.toLocaleString()}/mo</span>
        )}
      </div>
      {lead.service_interest && (
        <p className="text-[10px] text-[#9CA3AF] mt-1.5 truncate">{SERVICE_LABELS[lead.service_interest]}</p>
      )}
      {lead.sequence_id && (
        <div className="mt-2 flex items-center gap-1">
          <Clock size={9} className="text-violet-400" />
          <span className="text-[9px] text-violet-400 font-medium">Paso {lead.current_step || 1}</span>
        </div>
      )}
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────
function ListView({ leads, onSelect }: { leads: Lead[]; onSelect: (l: Lead) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E8EF] overflow-hidden">
      <div className="grid grid-cols-12 px-5 py-3 border-b border-[#E5E8EF] text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
        <div className="col-span-4">Lead</div>
        <div className="col-span-2">Estado</div>
        <div className="col-span-2">Fuente</div>
        <div className="col-span-2">Servicio</div>
        <div className="col-span-2 text-right">MRR est.</div>
      </div>
      {leads.map((lead, i) => (
        <div
          key={lead.id}
          onClick={() => onSelect(lead)}
          className={`grid grid-cols-12 px-5 py-3.5 hover:bg-[#F9FAFB] cursor-pointer transition-all items-center ${i > 0 ? 'border-t border-[#F0F2F5]' : ''}`}
        >
          <div className="col-span-4 flex items-center gap-3">
            <NodoAvatar name={lead.business_name} size="sm" />
            <div>
              <p className="text-sm font-semibold text-[#1A1F2E]">{lead.business_name}</p>
              <p className="text-xs text-[#9CA3AF]">{lead.contact_name}</p>
            </div>
          </div>
          <div className="col-span-2">
            <span className={`text-xs font-semibold ${statusStyle(lead.status)}`}>
              {LEAD_STATUS_LABELS[lead.status]}
            </span>
          </div>
          <div className="col-span-2 text-xs text-[#6B7280]">{sourceLabel(lead.source)}</div>
          <div className="col-span-2 text-xs text-[#6B7280] truncate">
            {lead.service_interest ? SERVICE_LABELS[lead.service_interest] : '—'}
          </div>
          <div className="col-span-2 text-right text-sm font-bold text-[#1A1F2E]">
            {lead.estimated_mrr ? `€${lead.estimated_mrr.toLocaleString()}` : '—'}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Lead Drawer ──────────────────────────────────────────────────────────────
function LeadDrawer({ lead, sequences, onClose, onUpdate, onDelete, onConvert }: {
  lead: Lead
  sequences: LeadSequence[]
  onClose: () => void
  onUpdate: (id: string, data: Partial<Lead>) => void
  onDelete: (id: string) => void
  onConvert: (lead: Lead) => void
}) {
  const [notes, setNotes] = useState(lead.notes || '')
  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [selectedSequenceId, setSelectedSequenceId] = useState('')
  const [assigningSeq, setAssigningSeq] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [completingStep, setCompletingStep] = useState<string | null>(null)
  const [stepOutcome, setStepOutcome] = useState('')

  const activeSequence = sequences.find(s => s.id === lead.sequence_id)
  const sortedSteps = (activeSequence?.lead_sequence_steps || []).slice().sort((a, b) => a.step_number - b.step_number)

  useEffect(() => {
    loadActivities()
  }, [lead.id])

  async function loadActivities() {
    setLoadingActivities(true)
    if (IS_DEMO) {
      setActivities(DEMO_ACTIVITIES[lead.id] || [])
      setLoadingActivities(false)
      return
    }
    const { data } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
    setActivities(data || [])
    setLoadingActivities(false)
  }

  async function assignSequence() {
    if (!selectedSequenceId) return
    setAssigningSeq(true)
    const seq = sequences.find(s => s.id === selectedSequenceId)
    if (!seq) return

    const updates: Partial<Lead> = {
      sequence_id: selectedSequenceId,
      sequence_started_at: new Date().toISOString(),
      current_step: 1,
    }
    onUpdate(lead.id, updates)

    // Auto-create first activity
    const firstStep = (seq.lead_sequence_steps || []).sort((a, b) => a.step_number - b.step_number)[0]
    if (firstStep) {
      const newActivity: Omit<LeadActivity, 'id'> = {
        lead_id: lead.id,
        sequence_step_id: firstStep.id,
        activity_type: firstStep.action_type,
        title: firstStep.title,
        status: 'pendiente',
        scheduled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
      if (!IS_DEMO) {
        const { data } = await supabase.from('lead_activities').insert([newActivity]).select().single()
        if (data) setActivities(prev => [data, ...prev])
      } else {
        const demoActivity: LeadActivity = { ...newActivity, id: `a${Date.now()}` }
        setActivities(prev => [demoActivity, ...prev])
      }
    }
    setAssigningSeq(false)
  }

  async function completeStep(stepId: string, stepNumber: number) {
    const activity = activities.find(a => a.sequence_step_id === stepId && a.status === 'pendiente')
    const nextStep = sortedSteps.find(s => s.step_number === stepNumber + 1)

    if (activity) {
      const updatedActivity = { ...activity, status: 'completado' as const, completed_at: new Date().toISOString(), outcome: stepOutcome }
      if (!IS_DEMO) {
        await supabase.from('lead_activities').update({ status: 'completado', completed_at: new Date().toISOString(), outcome: stepOutcome }).eq('id', activity.id)
      }
      setActivities(prev => prev.map(a => a.id === activity.id ? updatedActivity : a))
    }

    const newCurrentStep = stepNumber + 1
    onUpdate(lead.id, { current_step: newCurrentStep })

    // Auto-create next activity
    if (nextStep) {
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + nextStep.day_offset)
      const newActivity: Omit<LeadActivity, 'id'> = {
        lead_id: lead.id,
        sequence_step_id: nextStep.id,
        activity_type: nextStep.action_type,
        title: nextStep.title,
        status: 'pendiente',
        scheduled_at: scheduledDate.toISOString(),
        created_at: new Date().toISOString(),
      }
      if (!IS_DEMO) {
        const { data } = await supabase.from('lead_activities').insert([newActivity]).select().single()
        if (data) setActivities(prev => [data, ...prev])
      } else {
        const demoActivity: LeadActivity = { ...newActivity, id: `a${Date.now()}` }
        setActivities(prev => [demoActivity, ...prev])
      }
    }

    setCompletingStep(null)
    setStepOutcome('')
  }

  async function skipStep(stepId: string, stepNumber: number) {
    const activity = activities.find(a => a.sequence_step_id === stepId && a.status === 'pendiente')
    if (activity) {
      if (!IS_DEMO) {
        await supabase.from('lead_activities').update({ status: 'saltado' }).eq('id', activity.id)
      }
      setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, status: 'saltado' } : a))
    }
    const nextStep = sortedSteps.find(s => s.step_number === stepNumber + 1)
    onUpdate(lead.id, { current_step: stepNumber + 1 })
    if (nextStep) {
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + nextStep.day_offset)
      const newActivity: Omit<LeadActivity, 'id'> = {
        lead_id: lead.id,
        sequence_step_id: nextStep.id,
        activity_type: nextStep.action_type,
        title: nextStep.title,
        status: 'pendiente',
        scheduled_at: scheduledDate.toISOString(),
        created_at: new Date().toISOString(),
      }
      if (!IS_DEMO) {
        const { data } = await supabase.from('lead_activities').insert([newActivity]).select().single()
        if (data) setActivities(prev => [data, ...prev])
      } else {
        const demoActivity: LeadActivity = { ...newActivity, id: `a${Date.now()}` }
        setActivities(prev => [demoActivity, ...prev])
      }
    }
  }

  function getStepStatus(step: { id: string; step_number: number }): 'completado' | 'pendiente' | 'saltado' | 'futuro' {
    const activity = activities.find(a => a.sequence_step_id === step.id)
    if (activity) return activity.status
    const currentStep = lead.current_step || 1
    if (step.step_number < currentStep) return 'completado'
    if (step.step_number === currentStep) return 'pendiente'
    return 'futuro'
  }

  function getStepActivity(stepId: string): LeadActivity | undefined {
    return activities.find(a => a.sequence_step_id === stepId)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E8EF]">
          <div className="flex items-center gap-3">
            <NodoAvatar name={lead.business_name} size="md" />
            <div>
              <h3 className="font-bold text-[#1A1F2E]">{lead.business_name}</h3>
              <p className="text-xs text-[#9CA3AF]">{lead.contact_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1A1F2E] p-1.5 rounded-xl hover:bg-[#F4F6F9]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-5">
          {/* Status */}
          <div>
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">Estado</p>
            <div className="grid grid-cols-3 gap-2">
              {PIPELINE_COLS.map(col => (
                <button
                  key={col.status}
                  onClick={() => {
                    setStatus(col.status)
                    onUpdate(lead.id, { status: col.status })
                  }}
                  className={`text-xs py-1.5 rounded-lg font-semibold transition-all border ${
                    status === col.status
                      ? `${col.bg} ${col.color}`
                      : 'border-[#E5E8EF] text-[#9CA3AF] hover:border-[#1E2433]'
                  }`}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-[#F9FAFB] rounded-2xl p-4 space-y-3">
            {lead.contact_email && (
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-[#9CA3AF]" />
                <span className="text-sm text-[#1A1F2E]">{lead.contact_email}</span>
              </div>
            )}
            {lead.contact_phone && (
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-[#9CA3AF]" />
                <span className="text-sm text-[#1A1F2E]">{lead.contact_phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users size={13} className="text-[#9CA3AF]" />
              <span className="text-sm text-[#6B7280]">{sourceLabel(lead.source)}</span>
            </div>
            {lead.estimated_mrr && (
              <div className="flex items-center gap-2">
                <CircleDollarSign size={13} className="text-[#9CA3AF]" />
                <span className="text-sm font-bold text-[#1A1F2E]">€{lead.estimated_mrr.toLocaleString()} / mes estimado</span>
              </div>
            )}
            {lead.service_interest && (
              <div className="flex items-center gap-2">
                <TrendingUp size={13} className="text-[#9CA3AF]" />
                <span className="text-sm text-[#6B7280]">{SERVICE_LABELS[lead.service_interest]}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">Notas</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => onUpdate(lead.id, { notes })}
              rows={3}
              placeholder="Escribe notas sobre este lead..."
              className="w-full bg-[#F9FAFB] border border-[#E5E8EF] rounded-xl px-4 py-3 text-sm text-[#1A1F2E] placeholder-[#9CA3AF] outline-none focus:border-[#C8F135] focus:ring-2 focus:ring-[#C8F135]/15 resize-none transition-all"
            />
          </div>

          {/* Dates */}
          <div className="text-xs text-[#9CA3AF]">
            <p>Creado: {new Date(lead.created_at).toLocaleDateString('es-ES')}</p>
            {lead.next_follow_up && (
              <p className="mt-0.5">Follow-up: {new Date(lead.next_follow_up).toLocaleDateString('es-ES')}</p>
            )}
          </div>

          {/* ── Sección A: Secuencia de seguimiento ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={13} className="text-violet-500" />
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">Secuencia de seguimiento</p>
            </div>

            {!lead.sequence_id ? (
              <div className="bg-[#F9FAFB] border border-[#E5E8EF] rounded-2xl p-4">
                <p className="text-xs text-[#9CA3AF] mb-3">Sin secuencia asignada. Asigna una para comenzar el seguimiento estructurado.</p>
                <div className="flex gap-2">
                  <select
                    value={selectedSequenceId}
                    onChange={e => setSelectedSequenceId(e.target.value)}
                    className="flex-1 bg-white border border-[#E5E8EF] rounded-xl px-3 py-2 text-sm text-[#1A1F2E] outline-none focus:border-[#C8F135]"
                  >
                    <option value="">Seleccionar secuencia...</option>
                    {sequences.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <NodoButton
                    variant="primary"
                    onClick={assignSequence}
                    disabled={!selectedSequenceId || assigningSeq}
                  >
                    Asignar
                  </NodoButton>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {activeSequence && (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: activeSequence.color }} />
                      <span className="text-sm font-semibold text-[#1A1F2E]">{activeSequence.name}</span>
                    </div>
                    <span className="text-xs text-[#9CA3AF]">Paso {lead.current_step || 1} de {sortedSteps.length}</span>
                  </div>
                )}
                {sortedSteps.map(step => {
                  const stepStatus = getStepStatus(step)
                  const stepActivity = getStepActivity(step.id)
                  const isCurrent = stepStatus === 'pendiente'
                  const isCompleted = stepStatus === 'completado'
                  const isSkipped = stepStatus === 'saltado'
                  const isFuture = stepStatus === 'futuro'
                  const isBeingCompleted = completingStep === step.id

                  return (
                    <div
                      key={step.id}
                      className={`rounded-xl border p-3 transition-all ${
                        isCurrent ? 'border-violet-300 bg-violet-50' :
                        isCompleted ? 'border-green-200 bg-green-50/50 opacity-70' :
                        isSkipped ? 'border-gray-200 bg-gray-50 opacity-50' :
                        'border-[#E5E8EF] bg-white opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 size={16} className="text-green-500" />
                          ) : isSkipped ? (
                            <SkipForward size={16} className="text-gray-400" />
                          ) : isCurrent ? (
                            <Circle size={16} className="text-violet-500" />
                          ) : (
                            <Circle size={16} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <ActivityIcon type={step.action_type} size={11} className={activityTypeColor(step.action_type)} />
                              <span className={`text-xs font-semibold ${isCurrent ? 'text-violet-700' : isCompleted ? 'text-green-700' : 'text-[#6B7280]'}`}>
                                {step.step_number}. {step.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {isCompleted && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Completado</span>}
                              {isSkipped && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">Saltado</span>}
                              {isCurrent && <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full">Actual</span>}
                            </div>
                          </div>

                          {stepActivity?.scheduled_at && (
                            <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                              {isCurrent ? 'Programado: ' : ''}{new Date(stepActivity.scheduled_at).toLocaleDateString('es-ES')}
                              {step.day_offset > 0 && isFuture && ` (+${step.day_offset} días)`}
                            </p>
                          )}
                          {stepActivity?.outcome && (
                            <p className="text-[10px] text-[#6B7280] mt-1 italic">"{stepActivity.outcome}"</p>
                          )}

                          {isCurrent && !isBeingCompleted && (
                            <div className="flex gap-1.5 mt-2">
                              <button
                                onClick={() => setCompletingStep(step.id)}
                                className="text-[10px] font-semibold text-white bg-violet-500 hover:bg-violet-600 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                Marcar completado
                              </button>
                              <button
                                onClick={() => skipStep(step.id, step.step_number)}
                                className="text-[10px] font-semibold text-[#9CA3AF] hover:text-[#6B7280] px-2.5 py-1 rounded-lg hover:bg-[#F4F6F9] transition-colors"
                              >
                                Saltar
                              </button>
                            </div>
                          )}

                          {isBeingCompleted && (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={stepOutcome}
                                onChange={e => setStepOutcome(e.target.value)}
                                placeholder="Resultado / notas del paso..."
                                rows={2}
                                className="w-full bg-white border border-violet-300 rounded-lg px-2.5 py-1.5 text-xs text-[#1A1F2E] placeholder-[#9CA3AF] outline-none focus:border-violet-500 resize-none"
                              />
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => completeStep(step.id, step.step_number)}
                                  className="text-[10px] font-semibold text-white bg-green-500 hover:bg-green-600 px-2.5 py-1 rounded-lg transition-colors"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => { setCompletingStep(null); setStepOutcome('') }}
                                  className="text-[10px] text-[#9CA3AF] hover:text-[#6B7280] px-2.5 py-1 rounded-lg hover:bg-[#F4F6F9] transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Sección B: Historial de actividades ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-[#9CA3AF]" />
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">Historial de actividades</p>
              </div>
              <button
                onClick={() => setShowActivityForm(!showActivityForm)}
                className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                <Plus size={12} />
                Registrar
              </button>
            </div>

            {showActivityForm && (
              <ActivityForm
                leadId={lead.id}
                onSave={(activity) => {
                  setActivities(prev => [activity, ...prev])
                  setShowActivityForm(false)
                }}
                onCancel={() => setShowActivityForm(false)}
              />
            )}

            {loadingActivities ? (
              <div className="flex justify-center py-6">
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#9CA3AF] border-2 border-dashed border-[#E5E8EF] rounded-xl">
                Sin actividades registradas
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map(activity => (
                  <div key={activity.id} className="bg-[#F9FAFB] border border-[#E5E8EF] rounded-xl p-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 mt-0.5">
                        <ActivityIcon type={activity.activity_type} size={13} className={activityTypeColor(activity.activity_type)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-xs font-semibold text-[#1A1F2E]">{activity.title}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              activity.status === 'completado' ? 'text-green-700 bg-green-100' :
                              activity.status === 'saltado' ? 'text-gray-500 bg-gray-100' :
                              'text-yellow-700 bg-yellow-100'
                            }`}>
                              {activity.status === 'completado' ? 'Completado' : activity.status === 'saltado' ? 'Saltado' : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-medium ${activityTypeColor(activity.activity_type)}`}>
                            {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                          </span>
                          <span className="text-[10px] text-[#9CA3AF]">
                            {activity.completed_at
                              ? formatRelativeDate(activity.completed_at)
                              : activity.scheduled_at
                              ? `Para: ${new Date(activity.scheduled_at).toLocaleDateString('es-ES')}`
                              : formatRelativeDate(activity.created_at)
                            }
                          </span>
                        </div>
                        {activity.outcome && (
                          <p className="text-[10px] text-[#6B7280] mt-1 italic">"{activity.outcome}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions footer */}
        <div className="p-6 border-t border-[#E5E8EF] space-y-2">
          {status === 'cerrado_ganado' && (
            <button
              onClick={() => onConvert(lead)}
              className="w-full flex items-center justify-center gap-2 bg-[#C8F135] text-[#1A1F2E] text-sm font-bold py-2.5 rounded-xl hover:bg-[#D4F53C] transition-all"
            >
              <ArrowRight size={14} />
              Convertir a cliente
            </button>
          )}
          <button
            onClick={() => onDelete(lead.id)}
            className="w-full text-center text-xs text-red-400 hover:text-red-600 font-medium py-2 rounded-xl hover:bg-red-50 transition-all"
          >
            Eliminar lead
          </button>
        </div>
      </aside>
    </div>
  )
}

// ─── Activity Form ────────────────────────────────────────────────────────────
function ActivityForm({ leadId, onSave, onCancel }: {
  leadId: string
  onSave: (activity: LeadActivity) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<{
    activity_type: ActivityType
    title: string
    description: string
    outcome: string
    scheduled_at: string
  }>({
    activity_type: 'llamada',
    title: '',
    description: '',
    outcome: '',
    scheduled_at: new Date().toISOString().split('T')[0],
  })

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function save() {
    if (!form.title) return
    const now = new Date().toISOString()
    const newActivity: Omit<LeadActivity, 'id'> = {
      lead_id: leadId,
      activity_type: form.activity_type,
      title: form.title,
      description: form.description || undefined,
      outcome: form.outcome || undefined,
      status: 'pendiente',
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : undefined,
      created_at: now,
    }
    if (!IS_DEMO) {
      const { data } = await supabase.from('lead_activities').insert([newActivity]).select().single()
      if (data) onSave(data as LeadActivity)
    } else {
      onSave({ ...newActivity, id: `a${Date.now()}` } as LeadActivity)
    }
  }

  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Tipo</label>
          <select
            value={form.activity_type}
            onChange={e => set('activity_type', e.target.value as ActivityType)}
            className="w-full bg-white border border-[#E5E8EF] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1F2E] outline-none focus:border-violet-400"
          >
            {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map(t => (
              <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Fecha</label>
          <input
            type="date"
            value={form.scheduled_at}
            onChange={e => set('scheduled_at', e.target.value)}
            className="w-full bg-white border border-[#E5E8EF] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1F2E] outline-none focus:border-violet-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Título *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Ej. Llamada de seguimiento"
          className="w-full bg-white border border-[#E5E8EF] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1F2E] placeholder-[#9CA3AF] outline-none focus:border-violet-400"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Resultado</label>
        <textarea
          value={form.outcome}
          onChange={e => set('outcome', e.target.value)}
          placeholder="¿Cómo fue? ¿Qué se acordó?"
          rows={2}
          className="w-full bg-white border border-[#E5E8EF] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1F2E] placeholder-[#9CA3AF] outline-none focus:border-violet-400 resize-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={!form.title}
          className="flex-1 text-xs font-bold text-white bg-violet-500 hover:bg-violet-600 disabled:opacity-50 py-1.5 rounded-lg transition-colors"
        >
          Guardar actividad
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-[#9CA3AF] hover:text-[#6B7280] px-3 py-1.5 rounded-lg hover:bg-[#F4F6F9] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── New Lead Modal ───────────────────────────────────────────────────────────
function NewLeadModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (data: Partial<Lead>) => void
}) {
  const [form, setForm] = useState<Partial<Lead>>({
    source: 'otro', status: 'nuevo',
  })

  function set(key: keyof Lead, val: unknown) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E8EF]">
          <h3 className="font-bold text-[#1A1F2E]">Nuevo lead</h3>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1A1F2E] p-1.5 rounded-xl hover:bg-[#F4F6F9]">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <NodoInput
            label="Empresa *"
            value={form.business_name || ''}
            onChange={e => set('business_name', e.target.value)}
            placeholder="Nombre de la empresa"
          />
          <NodoInput
            label="Contacto *"
            value={form.contact_name || ''}
            onChange={e => set('contact_name', e.target.value)}
            placeholder="Nombre del contacto"
          />
          <div className="grid grid-cols-2 gap-3">
            <NodoInput
              label="Email"
              value={form.contact_email || ''}
              onChange={e => set('contact_email', e.target.value)}
              placeholder="email@empresa.com"
            />
            <NodoInput
              label="Teléfono"
              value={form.contact_phone || ''}
              onChange={e => set('contact_phone', e.target.value)}
              placeholder="+34 600..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">Fuente</label>
              <select
                value={form.source}
                onChange={e => set('source', e.target.value as LeadSource)}
                className="w-full bg-[#F9FAFB] border border-[#E5E8EF] rounded-xl px-3 py-2.5 text-sm text-[#1A1F2E] outline-none focus:border-[#C8F135]"
              >
                {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">Servicio de interés</label>
              <select
                value={form.service_interest || ''}
                onChange={e => set('service_interest', e.target.value as ServiceType || undefined)}
                className="w-full bg-[#F9FAFB] border border-[#E5E8EF] rounded-xl px-3 py-2.5 text-sm text-[#1A1F2E] outline-none focus:border-[#C8F135]"
              >
                <option value="">Sin definir</option>
                {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <NodoInput
            label="MRR Estimado (€/mes)"
            type="number"
            value={form.estimated_mrr?.toString() || ''}
            onChange={e => set('estimated_mrr', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="1117"
          />
          <NodoTextarea
            label="Notas iniciales"
            value={form.notes || ''}
            onChange={e => set('notes', e.target.value)}
            placeholder="Primera impresión, contexto..."
            rows={3}
          />
        </div>
        <div className="px-6 pb-6 flex justify-end gap-2">
          <NodoButton variant="secondary" onClick={onClose}>Cancelar</NodoButton>
          <NodoButton
            variant="primary"
            onClick={() => {
              if (!form.business_name || !form.contact_name) return
              onCreate(form)
            }}
            disabled={!form.business_name || !form.contact_name}
          >
            Crear lead
          </NodoButton>
        </div>
      </div>
    </div>
  )
}

// Suppress unused import warnings — these are used in JSX
void ChevronDown
void ChevronUp
