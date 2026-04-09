import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ArrowRight, Flame, Eye, Phone, Mail, MessageCircle, FileText, Users as UsersIcon, StickyNote, CheckSquare } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { getDemoClientsWithProjects } from '../../lib/demo'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL
import { NodoBadge } from '../../components/ui/NodoBadge'
import { NodoProgressBar } from '../../components/ui/NodoProgressBar'
import { NodoButton } from '../../components/ui/NodoButton'
import { NodoAvatar } from '../../components/ui/NodoAvatar'
import { SERVICE_LABELS, LEAD_STATUS_LABELS } from '../../types'
import type { Client, Project, LeadActivity } from '../../types'

// ─── Activity type ────────────────────────────────────────────────────────────
type ActivityType = 'llamada' | 'email' | 'whatsapp' | 'propuesta' | 'reunion' | 'nota' | 'tarea'

function DashActivityIcon({ type }: { type: ActivityType }) {
  const icons: Record<ActivityType, React.ReactNode> = {
    llamada:   <Phone size={11} />,
    email:     <Mail size={11} />,
    whatsapp:  <MessageCircle size={11} />,
    propuesta: <FileText size={11} />,
    reunion:   <UsersIcon size={11} />,
    nota:      <StickyNote size={11} />,
    tarea:     <CheckSquare size={11} />,
  }
  return <>{icons[type] ?? null}</>
}

function activityColor(type: ActivityType): string {
  const m: Record<ActivityType, string> = {
    llamada: 'text-green-400', email: 'text-blue-400', whatsapp: 'text-emerald-400',
    propuesta: 'text-violet-400', reunion: 'text-orange-400', nota: 'text-yellow-400', tarea: 'text-pink-400',
  }
  return m[type] ?? 'text-white/40'
}

interface PendingActivity extends LeadActivity {
  leads?: { business_name: string }
}

// ── Chart demo data ───────────────────────────────────────────────
// ─── Country flags ────────────────────────────────────────────────────────────
const COUNTRY_FLAGS: Record<string, string> = {
  'España': '🇪🇸', 'Mexico': '🇲🇽', 'México': '🇲🇽', 'Argentina': '🇦🇷',
  'Colombia': '🇨🇴', 'Chile': '🇨🇱', 'Perú': '🇵🇪', 'Peru': '🇵🇪',
  'Uruguay': '🇺🇾', 'Venezuela': '🇻🇪', 'Ecuador': '🇪🇨', 'Bolivia': '🇧🇴',
  'Paraguay': '🇵🇾', 'Costa Rica': '🇨🇷', 'Panamá': '🇵🇦',
  'Guatemala': '🇬🇹', 'Estados Unidos': '🇺🇸', 'USA': '🇺🇸',
  'Portugal': '🇵🇹', 'UK': '🇬🇧', 'Francia': '🇫🇷',
}
function getFlag(country: string) { return COUNTRY_FLAGS[country] ?? '🌍' }

const DEMO_COUNTRIES = [
  { country: 'España',    count: 6 },
  { country: 'Colombia',  count: 3 },
  { country: 'México',    count: 1 },
  { country: 'Argentina', count: 1 },
  { country: 'Portugal',  count: 1 },
]
const DEMO_SECTORS_DIST = [
  { sector: 'Clínicas dentales',   count: 3 },
  { sector: 'Salud y bienestar',   count: 2 },
  { sector: 'Deporte y fitness',   count: 2 },
  { sector: 'Alquiler náutico',    count: 1 },
  { sector: 'Concesionario',       count: 1 },
  { sector: 'Estética y belleza',  count: 1 },
]

const DEMO_MRR = [
  { mes: 'Oct', mrr: 3200 }, { mes: 'Nov', mrr: 4100 }, { mes: 'Dic', mrr: 3900 },
  { mes: 'Ene', mrr: 5200 }, { mes: 'Feb', mrr: 6300 }, { mes: 'Mar', mrr: 7100 },
]
const DEMO_PIPELINE = [
  { etapa: 'Nuevo', count: 8 }, { etapa: 'Contactado', count: 6 },
  { etapa: 'Propuesta', count: 4 }, { etapa: 'Negociación', count: 3 },
  { etapa: 'Ganado', count: 2 },
]
const DEMO_TEAM_LOAD = [
  { nombre: 'Carlos', clientes: 3 }, { nombre: 'María', clientes: 2 },
  { nombre: 'Ana', clientes: 4 }, { nombre: 'Luis', clientes: 1 },
]
const CHART_COLORS = ['#C026A8', '#8B22E8', '#C8F135', '#E040A0', '#6366F1']
const DONUT_COLORS: Record<string, string> = {
  active: '#C8F135', paused: '#F59E0B', completed: '#8B22E8', cancelled: '#EF4444',
}

// Demo health scores
const DEMO_HEALTH_SCORES: Record<string, number> = {
  'demo-client-1': 87,
  'demo-client-2': 61,
  'demo-client-3': 94,
  'demo-client-4': 34,
}

function healthColor(score: number): string {
  if (score >= 75) return 'text-green-600 bg-green-50'
  if (score >= 50) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-500 bg-red-50'
}

interface ClientWithProject extends Client {
  project?: Project
}

interface StatsData {
  total: number
  active: number
  pending_requests: number
  completed: number
}

export function DashboardPage() {
  const { user, startImpersonation } = useAuthStore()
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientWithProject[]>([])
  const [stats, setStats] = useState<StatsData>({ total: 0, active: 0, pending_requests: 0, completed: 0 })
  const [healthScores, setHealthScores] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [mrrData, setMrrData] = useState<{ mes: string; mrr: number }[]>([])
  const [pipelineData, setPipelineData] = useState<{ etapa: string; count: number }[]>([])
  const [teamLoadData, setTeamLoadData] = useState<{ nombre: string; clientes: number }[]>([])
  const [clientStatusData, setClientStatusData] = useState<{ name: string; value: number; status: string }[]>([])
  const [pendingActivities, setPendingActivities] = useState<PendingActivity[]>([])
  const [countryData, setCountryData] = useState<{ country: string; count: number }[]>([])
  const [sectorData,  setSectorData]  = useState<{ sector: string;  count: number }[]>([])
  const [filterCountry, setFilterCountry] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      if (IS_DEMO) {
        const clientsData = getDemoClientsWithProjects()
        setClients(clientsData)
        setHealthScores(DEMO_HEALTH_SCORES)
        const active = clientsData.filter(c => c.project?.status === 'active').length
        const completed = clientsData.filter(c => c.project?.status === 'completed').length
        setStats({ total: clientsData.length, active, completed, pending_requests: 2 })
        setMrrData(DEMO_MRR)
        setPipelineData(DEMO_PIPELINE)
        setTeamLoadData(DEMO_TEAM_LOAD)
        setCountryData(DEMO_COUNTRIES)
        setSectorData(DEMO_SECTORS_DIST)
        const statusGroups = ['active','paused','completed','cancelled'].map(s => ({
          name: s === 'active' ? 'Activos' : s === 'paused' ? 'Pausados' : s === 'completed' ? 'Completados' : 'Cancelados',
          value: clientsData.filter(c => c.project?.status === s).length,
          status: s,
        })).filter(g => g.value > 0)
        setClientStatusData(statusGroups)
        // Demo pending activities
        setPendingActivities([
          {
            id: 'pa1', lead_id: 'l1', activity_type: 'propuesta', title: 'Presentar propuesta',
            status: 'pendiente', scheduled_at: new Date().toISOString(), created_at: new Date().toISOString(),
            leads: { business_name: 'Clínica Smileplus' },
          },
          {
            id: 'pa2', lead_id: 'l3', activity_type: 'llamada', title: 'Llamada de seguimiento',
            status: 'pendiente', scheduled_at: new Date().toISOString(), created_at: new Date().toISOString(),
            leads: { business_name: 'Belleza Total SL' },
          },
        ])
        setLoading(false)
        return
      }

      let query = supabase
        .from('clients')
        .select('*, projects(id, service_type, status, progress_pct, duration_months, start_date, end_date, monthly_price, total_price, current_phase, assigned_tech, created_at, client_id)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (user?.role === 'tecnico') {
        const { data: techProjects } = await supabase
          .from('projects')
          .select('client_id')
          .eq('assigned_tech', user.id)
        const clientIds = techProjects?.map(p => p.client_id) || []
        if (clientIds.length > 0) query = query.in('id', clientIds)
      }

      const { data } = await query
      const clientsData: ClientWithProject[] = (data || []).map((c: Client & { projects?: Project[] }) => ({
        ...c,
        project: c.projects?.[0],
      }))
      setClients(clientsData)

      const active = clientsData.filter(c => c.project?.status === 'active').length
      const completed = clientsData.filter(c => c.project?.status === 'completed').length
      const { count: pendingRequests } = await supabase
        .from('plug_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      setStats({ total: clientsData.length, active, completed, pending_requests: pendingRequests || 0 })

      // ── Donut: estado de clientes ──────────────────────────────────
      const statusGroups = ['active','paused','completed','cancelled'].map(s => ({
        name: s === 'active' ? 'Activos' : s === 'paused' ? 'Pausados' : s === 'completed' ? 'Completados' : 'Cancelados',
        value: clientsData.filter(c => c.project?.status === s).length,
        status: s,
      })).filter(g => g.value > 0)
      setClientStatusData(statusGroups)

      // ── LineChart: MRR últimos 6 meses ─────────────────────────────
      const { data: billingRaw } = await supabase
        .from('billing_records')
        .select('period_month, amount, status')
        .eq('status', 'paid')
        .order('period_month', { ascending: true })
      if (billingRaw && billingRaw.length > 0) {
        // period_month is INTEGER: 202510 = Oct 2025
        const byMonth: Record<string, number> = {}
        billingRaw.forEach((r: { period_month: number; amount: number }) => {
          const m = r.period_month
          const year = Math.floor(m / 100)
          const mo = String(m % 100).padStart(2, '0')
          const key = `${year}-${mo}`
          byMonth[key] = (byMonth[key] || 0) + Number(r.amount)
        })
        const mrrArr = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([k, v]) => ({
          mes: new Date(k + '-01').toLocaleDateString('es-ES', { month: 'short' }),
          mrr: v,
        }))
        setMrrData(mrrArr.length > 0 ? mrrArr : DEMO_MRR)
      } else {
        setMrrData(DEMO_MRR)
      }

      // ── BarChart horizontal: funnel de pipeline ────────────────────
      const { data: leadsRaw } = await supabase.from('leads').select('status')
      if (leadsRaw && leadsRaw.length > 0) {
        const order = ['nuevo','contactado','propuesta','negociacion','cerrado_ganado']
        const byStage: Record<string, number> = {}
        leadsRaw.forEach((l: { status: string }) => { byStage[l.status] = (byStage[l.status] || 0) + 1 })
        const funnelData = order
          .filter(s => byStage[s])
          .map(s => ({ etapa: LEAD_STATUS_LABELS[s as keyof typeof LEAD_STATUS_LABELS] || s, count: byStage[s] }))
        setPipelineData(funnelData.length > 0 ? funnelData : DEMO_PIPELINE)
      } else {
        setPipelineData(DEMO_PIPELINE)
      }

      // ── BarChart: carga por técnico ────────────────────────────────
      const { data: techData } = await supabase
        .from('internal_users')
        .select('id, full_name')
        .eq('is_active', true)
      if (techData && techData.length > 0) {
        const techLoad = techData.map((t: { id: string; full_name: string }) => ({
          nombre: t.full_name.split(' ')[0],
          clientes: clientsData.filter(c => c.project?.assigned_tech === t.id).length,
        })).filter(t => t.clientes > 0)
        setTeamLoadData(techLoad.length > 0 ? techLoad : DEMO_TEAM_LOAD)
      } else {
        setTeamLoadData(DEMO_TEAM_LOAD)
      }

      // ── Country + sector distribution ──────────────────────────────
      const byCountry: Record<string, number> = {}
      const bySector: Record<string, number> = {}
      clientsData.forEach(c => {
        if (c.country) byCountry[c.country] = (byCountry[c.country] || 0) + 1
        if (c.sector)  bySector[c.sector]   = (bySector[c.sector]   || 0) + 1
      })
      const realCountries = Object.entries(byCountry).sort(([,a],[,b]) => b-a).map(([country,count]) => ({ country, count }))
      const realSectors   = Object.entries(bySector).sort(([,a],[,b]) => b-a).slice(0,6).map(([sector,count]) => ({ sector, count }))
      setCountryData(realCountries.length >= 5 ? realCountries : DEMO_COUNTRIES)
      setSectorData(realSectors.length >= 5 ? realSectors : DEMO_SECTORS_DIST)

      // Load health scores — table uses project_id, map back to client_id via loaded projects
      const { data: hs } = await supabase.from('client_health_scores').select('project_id, score')
      if (hs && hs.length > 0) {
        const scores: Record<string, number> = {}
        clientsData.forEach((c) => {
          const proj = c.project
          if (proj) {
            const match = hs.find((h: { project_id: string; score: number }) => h.project_id === proj.id)
            if (match) scores[c.id] = match.score
          }
        })
        setHealthScores(scores)
      }

      // ── Pending follow-up activities ───────────────────────────────
      const today = new Date().toISOString().split('T')[0]
      const { data: pendingRaw } = await supabase
        .from('lead_activities')
        .select('*, leads(business_name)')
        .eq('status', 'pendiente')
        .lte('scheduled_at', `${today}T23:59:59Z`)
        .order('scheduled_at', { ascending: true })
      setPendingActivities((pendingRaw as PendingActivity[]) || [])
    } finally {
      setLoading(false)
    }
  }

  const filtered = clients.filter(c => {
    const matchesSearch = !search ||
      c.business_name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      c.sector.toLowerCase().includes(search.toLowerCase())
    const matchesCountry = !filterCountry || c.country === filterCountry
    return matchesSearch && matchesCountry
  })
  const uniqueCountries = [...new Set(clients.map(c => c.country).filter(Boolean))]

  const statCards = [
    { label: 'Total clientes',  value: stats.total },
    { label: 'Activos',         value: stats.active },
    { label: 'Solicitudes',     value: stats.pending_requests },
    { label: 'Completados',     value: stats.completed },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">
            Panel de control
          </p>
          <h1 className="text-2xl font-bold text-[#1A1F2E]">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <NodoButton
              variant="secondary"
              icon={<Flame size={14} />}
              onClick={() => navigate('/internal/leads')}
            >
              <span className="hidden sm:inline">Pipeline</span>
            </NodoButton>
          )}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <NodoButton
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => navigate('/internal/clients/new')}
            >
              <span className="hidden sm:inline">Nuevo cliente</span>
              <span className="sm:hidden">Nuevo</span>
            </NodoButton>
          )}
        </div>
      </div>

      {/* Stats — white cards, big numbers, sin iconos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map(({ label, value }) => (
          <div
            key={label}
            className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 md:p-7"
          >
            <p className="text-4xl md:text-5xl font-black text-[#1A1F2E] leading-none mb-3">
              {value}
            </p>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* MRR mensual */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5 col-span-1 md:col-span-2">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">MRR mensual</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={mrrData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v/1000}k`} />
              <Tooltip formatter={(v) => [`€${Number(v).toLocaleString()}`, 'MRR']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E8EF' }} />
              <Line type="monotone" dataKey="mrr" stroke="#C026A8" strokeWidth={2.5} dot={{ fill: '#C026A8', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut estado de clientes */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5 flex flex-col">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Estado clientes</p>
          {clientStatusData.length > 0 ? (
            <div className="flex items-center gap-3 flex-1">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={clientStatusData} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                    {clientStatusData.map((entry, i) => (
                      <Cell key={i} fill={DONUT_COLORS[entry.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 flex-1">
                {clientStatusData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DONUT_COLORS[entry.status] || CHART_COLORS[i] }} />
                    <span className="text-[10px] text-[#6B7280] truncate">{entry.name}</span>
                    <span className="text-[10px] font-bold text-[#1A1F2E] ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#9CA3AF] mt-4">Sin datos aún</p>
          )}
        </div>

        {/* Carga por técnico */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5 flex flex-col">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Carga equipo</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={teamLoadData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
              <XAxis type="number" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [v, 'Clientes']} />
              <Bar dataKey="clientes" radius={[0, 4, 4, 0]}>
                {teamLoadData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline funnel */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5 col-span-1 md:col-span-2">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Pipeline — Leads por etapa</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={pipelineData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="etapa" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [v, 'Leads']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {pipelineData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ── Distribución por país y sector ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

        {/* Por país */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Clientes por país</p>
            <span className="text-[10px] text-[#9CA3AF]">{countryData.reduce((s,c) => s+c.count, 0)} total</span>
          </div>
          {countryData.length === 0 ? (
            <p className="text-xs text-[#9CA3AF]">Sin datos aún</p>
          ) : (
            <div className="space-y-2.5">
              {countryData.map((item, i) => {
                const max = countryData[0]?.count || 1
                const pct = Math.round((item.count / max) * 100)
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{getFlag(item.country)}</span>
                        <span className="text-xs font-medium text-[#374151]">{item.country}</span>
                      </div>
                      <span className="text-xs font-bold text-[#1A1F2E]">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: i === 0 ? '#C026A8' : i === 1 ? '#8B22E8' : i === 2 ? '#C8F135' : '#E040A0' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Por sector */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Clientes por sector</p>
            <span className="text-[10px] text-[#9CA3AF]">{sectorData.reduce((s,c) => s+c.count, 0)} total</span>
          </div>
          {sectorData.length === 0 ? (
            <p className="text-xs text-[#9CA3AF]">Sin datos aún</p>
          ) : (
            <div className="space-y-2.5">
              {sectorData.map((item, i) => {
                const max = sectorData[0]?.count || 1
                const pct = Math.round((item.count / max) * 100)
                const colors = ['#C026A8','#8B22E8','#C8F135','#E040A0','#6366F1','#F59E0B']
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[#374151] truncate max-w-[200px]">{item.sector}</span>
                      <span className="text-xs font-bold text-[#1A1F2E] ml-2 flex-shrink-0">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Seguimientos pendientes widget ── */}
      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <div className="bg-[#1E2433] rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Seguimientos pendientes</p>
              {pendingActivities.length > 0 && (
                <span className="text-[10px] font-bold text-[#1A1F2E] bg-[#C8F135] px-1.5 py-0.5 rounded-full">
                  {pendingActivities.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/internal/leads')}
              className="flex items-center gap-1 text-xs text-[#C8F135] hover:text-[#D4F53C] transition-colors font-semibold"
            >
              Ver pipeline <ArrowRight size={12} />
            </button>
          </div>

          {pendingActivities.length === 0 ? (
            <div className="px-6 py-4">
              <p className="text-sm text-white/40">Sin seguimientos pendientes hoy</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {pendingActivities.slice(0, 6).map(act => (
                <div
                  key={act.id}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-white/3 transition-all cursor-pointer"
                  onClick={() => navigate('/internal/leads')}
                >
                  <span className={`flex-shrink-0 ${activityColor(act.activity_type as ActivityType)}`}>
                    <DashActivityIcon type={act.activity_type as ActivityType} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80 truncate">{act.title}</p>
                    {act.leads?.business_name && (
                      <p className="text-[10px] text-white/40 truncate">{act.leads.business_name}</p>
                    )}
                  </div>
                  {act.scheduled_at && (
                    <span className="text-[10px] text-white/30 flex-shrink-0">
                      {new Date(act.scheduled_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
              ))}
              {pendingActivities.length > 6 && (
                <div className="px-6 py-2.5">
                  <p className="text-[10px] text-white/30">+{pendingActivities.length - 6} más pendientes</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search + filtros */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Buscar cliente, sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E5E8EF] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#1A1F2E] placeholder-[#9CA3AF] outline-none focus:border-[#C8F135] focus:ring-2 focus:ring-[#C8F135]/15 transition-all"
          />
        </div>
        {uniqueCountries.length > 1 && (
          <select
            value={filterCountry}
            onChange={e => setFilterCountry(e.target.value)}
            className="bg-white border border-[#E5E8EF] rounded-2xl px-4 py-3 text-sm text-[#1A1F2E] outline-none focus:border-[#C8F135] transition-all cursor-pointer min-w-[180px]"
          >
            <option value="">🌍 Todos los países</option>
            {uniqueCountries.map(c => (
              <option key={c} value={c}>{getFlag(c)} {c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Clientes — panel oscuro */}
      <div className="bg-[#1E2433] rounded-2xl overflow-hidden dark-scroll">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Clientes recientes
            </p>
            {/* HS Legend */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">HS</span>
              <span className="flex items-center gap-1 text-[10px] text-green-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />≥75 Excelente
              </span>
              <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />50–74 Atención
              </span>
              <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />&lt;50 Crítico
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/internal/clients')}
            className="flex items-center gap-1 text-xs text-[#C8F135] hover:text-[#D4F53C] transition-colors font-semibold"
          >
            Ver todos <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-[#C8F135] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <p className="text-white/40 text-sm">
              {search
                ? 'No se encontraron clientes con ese criterio.'
                : 'Aún no hay clientes. Crea el primero.'}
            </p>
            {!search && user?.role === 'admin' && (
              <NodoButton
                variant="primary"
                icon={<Plus size={14} />}
                className="mt-4"
                onClick={() => navigate('/internal/clients/new')}
              >
                Crear primer cliente
              </NodoButton>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((client, i) => (
              <div
                key={client.id}
                className={`
                  group flex items-center gap-4 px-6 py-4
                  hover:bg-[#252D3D] cursor-pointer transition-all
                  ${i !== 0 ? 'border-t border-white/5' : ''}
                `}
                onClick={() => navigate(`/internal/clients/${client.id}`)}
              >
                <NodoAvatar name={client.business_name} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-semibold text-white text-sm">
                      {client.business_name}
                    </p>
                    {client.project && (
                      <NodoBadge status={client.project.status} size="sm" dark />
                    )}
                    {healthScores[client.id] !== undefined && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${healthColor(healthScores[client.id])}`}>
                        HS {healthScores[client.id]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40">
                    {client.country && <span className="mr-1">{getFlag(client.country)}</span>}
                    {client.sector} · {client.contact_name}
                  </p>
                </div>

                <div className="hidden md:flex flex-col items-end gap-2 min-w-[170px]">
                  {client.project && (
                    <>
                      <p className="text-xs text-white/40 truncate max-w-[170px]">
                        {SERVICE_LABELS[client.project.service_type]}
                      </p>
                      <div className="w-32">
                        <NodoProgressBar
                          value={client.project.progress_pct}
                          size="sm"
                          showLabel
                          dark
                        />
                      </div>
                    </>
                  )}
                </div>

                {user?.role === 'superadmin' && client.project && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startImpersonation('client', {
                        clientId: client.id,
                        projectId: client.project!.id,
                        clientName: client.business_name,
                      })
                      navigate('/client/dashboard')
                    }}
                    title="Ver portal del cliente"
                    className="flex-shrink-0 flex items-center gap-1 text-[10px] font-medium text-white/30 hover:text-[#C8F135] hover:bg-[#C8F135]/10 px-2 py-1 rounded-lg transition-all border border-white/5 hover:border-[#C8F135]/20 mr-1"
                  >
                    <Eye size={11} />
                    <span className="hidden lg:block">Portal</span>
                  </button>
                )}
                <ArrowRight
                  size={14}
                  className="flex-shrink-0 text-white/20 group-hover:text-[#C8F135] transition-colors"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
