import { useState, useEffect } from 'react'
import {
  ShieldCheck, Users, DollarSign, Settings, Activity,
  UserPlus, Mail, Trash2, ToggleLeft, ToggleRight, Crown,
  Wrench, TrendingUp, AlertCircle, CheckCircle2, Timer, Award, Layers,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { supabase } from '../../lib/supabase'
import { IS_DEMO } from '../../store/auth'
import type { InternalUser } from '../../types'

type SuperTab = 'equipo' | 'financiero' | 'rendimiento' | 'configuracion' | 'auditoria'

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_TEAM: InternalUser[] = [
  { id: '1', email: 'santiago@nodoone.com', full_name: 'Santiago', role: 'superadmin', is_active: true, created_at: '2025-01-01' },
  { id: '2', email: 'admin@nodoone.com', full_name: 'Admin Demo', role: 'admin', is_active: true, created_at: '2025-01-15' },
  { id: '3', email: 'claudia@nodoone.com', full_name: 'Claudia López', role: 'tecnico', is_active: true, created_at: '2025-02-01' },
  { id: '4', email: 'lucia@nodoone.com', full_name: 'Lucía Martín', role: 'tecnico', is_active: true, created_at: '2025-02-15' },
]

const DEMO_BILLING_SUMMARY = {
  mrr: 3315,
  arr: 39780,
  pendiente: 789,
  vencido: 0,
  clients: 4,
  growth: 12,
}

const DEMO_ACTIVITY = [
  { user: 'Claudia López', action: 'Marcó Fase 3 como completada', client: 'Clínica DentaPlus', time: 'Hace 10 min', type: 'phase' },
  { user: 'Admin Demo', action: 'Creó nuevo cliente', client: 'FitLife Studio', time: 'Hace 2h', type: 'client' },
  { user: 'María González', action: 'Envió solicitud de cambio', client: 'Clínica DentaPlus', time: 'Hace 3h', type: 'request' },
  { user: 'Lucía Martín', action: 'Actualizó base de conocimiento', client: 'EstiloCasa Inmobiliaria', time: 'Hace 5h', type: 'bot' },
  { user: 'Admin Demo', action: 'Marcó factura como pagada', client: 'MediBalance', time: 'Ayer', type: 'billing' },
  { user: 'Santiago', action: 'Activó plug "Solicitar Cambio"', client: 'FitLife Studio', time: 'Hace 2 días', type: 'plug' },
]

const DEMO_SERVICES_CONFIG = [
  { key: 'bpo_claudia', label: 'BPO Digital — Claudia', price6: 1117, price12: 789, active: true },
  { key: 'bpo_lucia', label: 'BPO Digital — Lucía', price6: 1677, price12: 1257, active: true },
  { key: 'track_property', label: 'Track Property', price6: 0, price12: 0, active: false },
  { key: 'recovery', label: 'NODO Recovery', price6: 0, price12: 0, active: false },
]

const ROLE_CONFIG = {
  superadmin: { label: 'Super Admin', color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/20', icon: Crown },
  admin: { label: 'Admin', color: 'text-[#C8F135]', bg: 'bg-[#C8F135]/10', border: 'border-[#C8F135]/20', icon: ShieldCheck },
  tecnico: { label: 'Técnico', color: 'text-white/50', bg: 'bg-white/5', border: 'border-white/10', icon: Wrench },
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function TabEquipo() {
  const [team, setTeam] = useState<InternalUser[]>(DEMO_TEAM)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'tecnico'>('tecnico')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showPasswords] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!IS_DEMO) {
      supabase.from('internal_users').select('*').order('created_at')
        .then(({ data }) => { if (data) setTeam(data) })
    }
  }, [])

  const handleToggleActive = (id: string) => {
    setTeam(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u))
  }

  const handleSendInvite = () => {
    if (!inviteEmail || !inviteName) return
    const newUser: InternalUser = {
      id: `new-${Date.now()}`,
      email: inviteEmail,
      full_name: inviteName,
      role: inviteRole,
      is_active: true,
      created_at: new Date().toISOString(),
    }
    setTeam(prev => [...prev, newUser])
    setInviteEmail('')
    setInviteName('')
    setShowInvite(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-bold text-[#1A1F2E]">{team.length} usuarios en el sistema</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{team.filter(u => u.is_active).length} activos</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
        >
          <UserPlus size={14} />
          Invitar usuario
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-violet-800 mb-4">Invitar nuevo usuario</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-[#9CA3AF] mb-1 block">Nombre completo</label>
              <input
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2.5 text-sm text-[#1A1F2E] outline-none focus:border-violet-400"
                placeholder="Nombre Apellido"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#9CA3AF] mb-1 block">Email</label>
              <input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2.5 text-sm text-[#1A1F2E] outline-none focus:border-violet-400"
                placeholder="usuario@nodoone.com"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#9CA3AF] mb-1 block">Rol</label>
            <div className="flex gap-2">
              {(['admin', 'tecnico'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setInviteRole(r)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    inviteRole === r
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-[#9CA3AF] border-[#E5E8EF] hover:border-violet-300'
                  }`}
                >
                  {r === 'admin' ? 'Admin' : 'Técnico'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSendInvite} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors">
              <Mail size={13} /> Enviar invitación
            </button>
            <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm text-[#9CA3AF] hover:text-[#374151] rounded-xl">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Team list */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        {team.map((user, i) => {
          const cfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.tecnico
          const Icon = cfg.icon
          return (
            <div key={user.id} className={`flex items-center gap-4 px-5 py-4 ${i !== 0 ? 'border-t border-[#F4F6F9]' : ''}`}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-[#1E2433] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-[#1A1F2E]">{user.full_name}</p>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                    <Icon size={9} /> {cfg.label}
                  </span>
                  {!user.is_active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">Inactivo</span>
                  )}
                </div>
                <p className="text-xs text-[#9CA3AF]">{user.email}</p>
              </div>

              {/* Actions */}
              {user.role !== 'superadmin' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(user.id)}
                    className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-[#9CA3AF] hover:bg-[#F4F6F9]'}`}
                    title={user.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {user.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    className="p-2 rounded-lg text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Eliminar usuario"
                    onClick={() => setTeam(prev => prev.filter(u => u.id !== user.id))}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface FinancieroData {
  mrr: number
  arr: number
  pendiente: number
  vencido: number
  clients: { name: string; service: string; mrr: number; billingStatus: string }[]
}

function TabFinanciero() {
  const [data, setData] = useState<FinancieroData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (IS_DEMO) {
        setData({
          mrr: DEMO_BILLING_SUMMARY.mrr,
          arr: DEMO_BILLING_SUMMARY.arr,
          pendiente: DEMO_BILLING_SUMMARY.pendiente,
          vencido: DEMO_BILLING_SUMMARY.vencido,
          clients: [
            { name: 'Clínica DentaPlus', service: 'BPO Digital — Claudia', mrr: 789, billingStatus: 'paid' },
            { name: 'EstiloCasa Inmobiliaria', service: 'BPO Digital — Claudia', mrr: 789, billingStatus: 'pending' },
            { name: 'FitLife Studio', service: 'BPO Digital — Claudia', mrr: 789, billingStatus: 'paid' },
            { name: 'MediBalance', service: 'NODO Recovery', mrr: 948, billingStatus: 'paid' },
          ],
        })
        setLoading(false)
        return
      }

      // Load active projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, monthly_price, service_type, status, client_id')
        .eq('status', 'active')

      // Load client names separately
      const clientIds = (projects || []).map((p: { client_id: string }) => p.client_id)
      const { data: clientsData } = clientIds.length > 0
        ? await supabase.from('clients').select('id, business_name').in('id', clientIds)
        : { data: [] }
      const clientNameMap: Record<string, string> = {}
      ;(clientsData || []).forEach((c: { id: string; business_name: string }) => {
        clientNameMap[c.id] = c.business_name
      })

      // Load billing records for pending/overdue amounts
      const { data: billing } = await supabase
        .from('billing_records')
        .select('project_id, amount, status')
        .in('status', ['pending', 'overdue'])

      const mrr = (projects || []).reduce((s: number, p: { monthly_price: number }) => s + (p.monthly_price || 0), 0)
      const pendiente = (billing || []).filter((b: { status: string }) => b.status === 'pending').reduce((s: number, b: { amount: number }) => s + b.amount, 0)
      const vencido = (billing || []).filter((b: { status: string }) => b.status === 'overdue').reduce((s: number, b: { amount: number }) => s + b.amount, 0)

      // Latest billing status per project
      const { data: latestBilling } = await supabase
        .from('billing_records')
        .select('project_id, status')
        .order('period_month', { ascending: false })

      const latestByProject: Record<string, string> = {}
      ;(latestBilling || []).forEach((b: { project_id: string; status: string }) => {
        if (!latestByProject[b.project_id]) latestByProject[b.project_id] = b.status
      })

      const SERVICE_MAP: Record<string, string> = {
        bpo_claudia: 'BPO Digital — Claudia',
        bpo_lucia: 'BPO Digital — Lucía',
        track_property: 'Track Property',
        recovery: 'NODO Recovery',
      }

      const clients = (projects || []).map((p: { id: string; monthly_price: number; service_type: string; client_id: string }) => ({
        name: clientNameMap[p.client_id] || 'Sin nombre',
        service: SERVICE_MAP[p.service_type] || p.service_type,
        mrr: p.monthly_price || 0,
        billingStatus: latestByProject[p.id] || 'paid',
      }))

      setData({ mrr, arr: mrr * 12, pendiente, vencido, clients })
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !data) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const kpis = [
    { label: 'MRR', value: `€${data.mrr.toLocaleString()}`, sub: 'Ingresos recurrentes mensuales', subColor: 'text-emerald-600', icon: TrendingUp, iconBg: 'bg-emerald-50 text-emerald-600' },
    { label: 'ARR', value: `€${data.arr.toLocaleString()}`, sub: 'Proyección anual', subColor: 'text-[#9CA3AF]', icon: DollarSign, iconBg: 'bg-violet-50 text-violet-600' },
    { label: 'PENDIENTE', value: `€${data.pendiente.toLocaleString()}`, sub: data.pendiente > 0 ? 'Requiere atención' : 'Sin pendientes', subColor: data.pendiente > 0 ? 'text-amber-600' : 'text-emerald-600', icon: AlertCircle, iconBg: data.pendiente > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600' },
    { label: 'VENCIDO', value: `€${data.vencido.toLocaleString()}`, sub: data.vencido > 0 ? '¡Acción urgente!' : 'Todo al día ✓', subColor: data.vencido > 0 ? 'text-red-600' : 'text-emerald-600', icon: ShieldCheck, iconBg: data.vencido > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600' },
  ]

  const billingLabel = (s: string) => s === 'paid' ? 'Al día' : s === 'pending' ? 'Pendiente' : 'Vencido'
  const billingClass = (s: string) => s === 'paid' ? 'bg-emerald-50 text-emerald-600' : s === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className={`w-9 h-9 rounded-xl ${k.iconBg} flex items-center justify-center mb-3`}>
                <Icon size={16} />
              </div>
              <p className="text-2xl font-black text-[#1A1F2E]">{k.value}</p>
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mt-0.5">{k.label}</p>
              <p className={`text-xs font-semibold mt-1 ${k.subColor}`}>{k.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F4F6F9] flex items-center justify-between">
          <p className="text-sm font-bold text-[#1A1F2E]">Ingresos por cliente</p>
          <p className="text-xs text-[#9CA3AF]">{data.clients.length} contratos activos</p>
        </div>
        {data.clients.length === 0 ? (
          <p className="text-center text-sm text-[#9CA3AF] py-10">No hay contratos activos</p>
        ) : (
          data.clients.map((c, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-[#F4F6F9] last:border-0">
              <div>
                <p className="text-sm font-semibold text-[#1A1F2E]">{c.name}</p>
                <p className="text-xs text-[#9CA3AF]">{c.service}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-[#1A1F2E]">€{c.mrr.toLocaleString()}/mes</p>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${billingClass(c.billingStatus)}`}>
                  {billingLabel(c.billingStatus)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TabConfiguracion() {
  const [services, setServices] = useState(DEMO_SERVICES_CONFIG)
  const [agencyName, setAgencyName] = useState('NODO ONE')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Agency settings */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
        <p className="text-sm font-bold text-[#1A1F2E] mb-4">Configuración de la agencia</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#9CA3AF] mb-1 block">Nombre de la agencia</label>
            <input
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              className="w-full bg-[#F4F6F9] border border-[#E5E8EF] rounded-xl px-3 py-2.5 text-sm text-[#1A1F2E] outline-none focus:border-violet-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#9CA3AF] mb-1 block">Email de soporte</label>
            <input
              defaultValue="hola@nodoone.com"
              className="w-full bg-[#F4F6F9] border border-[#E5E8EF] rounded-xl px-3 py-2.5 text-sm text-[#1A1F2E] outline-none focus:border-violet-400"
            />
          </div>
        </div>
      </div>

      {/* Services config */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F4F6F9]">
          <p className="text-sm font-bold text-[#1A1F2E]">Servicios y precios</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Configura los precios por servicio y duración</p>
        </div>
        <div className="divide-y divide-[#F4F6F9]">
          {services.map((s, i) => (
            <div key={s.key} className="px-5 py-4 flex items-center gap-4">
              <button
                onClick={() => setServices(prev => prev.map((sv, j) => j === i ? { ...sv, active: !sv.active } : sv))}
                className={s.active ? 'text-emerald-500' : 'text-[#9CA3AF]'}
              >
                {s.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${s.active ? 'text-[#1A1F2E]' : 'text-[#9CA3AF]'}`}>{s.label}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <label className="text-[10px] font-bold text-[#9CA3AF] block mb-0.5">6 meses/mes</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#9CA3AF]">€</span>
                    <input
                      type="number"
                      value={s.price6}
                      onChange={e => setServices(prev => prev.map((sv, j) => j === i ? { ...sv, price6: Number(e.target.value) } : sv))}
                      className="w-20 bg-[#F4F6F9] border border-[#E5E8EF] rounded-lg px-2 py-1 text-sm text-[#1A1F2E] text-right outline-none focus:border-violet-400"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <label className="text-[10px] font-bold text-[#9CA3AF] block mb-0.5">12 meses/mes</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#9CA3AF]">€</span>
                    <input
                      type="number"
                      value={s.price12}
                      onChange={e => setServices(prev => prev.map((sv, j) => j === i ? { ...sv, price12: Number(e.target.value) } : sv))}
                      className="w-20 bg-[#F4F6F9] border border-[#E5E8EF] rounded-lg px-2 py-1 text-sm text-[#1A1F2E] text-right outline-none focus:border-violet-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-violet-600 text-white hover:bg-violet-700'
        }`}
      >
        {saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>
    </div>
  )
}

interface ActivityEntry {
  id: string
  action_type: string
  entity_type?: string
  description: string
  created_at: string
  actor_name?: string
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  return `Hace ${days} días`
}

function TabAuditoria() {
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const typeColors: Record<string, string> = {
    phase_completed: 'bg-blue-50 text-blue-600',
    client_created: 'bg-violet-50 text-violet-600',
    client_updated: 'bg-violet-50 text-violet-600',
    plug_request: 'bg-amber-50 text-amber-600',
    bot_updated: 'bg-teal-50 text-teal-600',
    billing_paid: 'bg-emerald-50 text-emerald-600',
    plug_enabled: 'bg-pink-50 text-pink-600',
    task_completed: 'bg-sky-50 text-sky-600',
    login: 'bg-gray-50 text-gray-500',
  }
  const typeShort: Record<string, string> = {
    phase_completed: 'Fase', client_created: 'Cliente', client_updated: 'Cliente',
    plug_request: 'Solicitud', bot_updated: 'Bot', billing_paid: 'Factura',
    plug_enabled: 'Plug', task_completed: 'Tarea', login: 'Acceso',
  }
  const filterOptions = [
    { value: 'all', label: 'Todo' },
    { value: 'client', label: 'Clientes' },
    { value: 'phase', label: 'Fases' },
    { value: 'billing', label: 'Facturas' },
    { value: 'bot', label: 'Bot' },
  ]

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (IS_DEMO) {
        setActivity(DEMO_ACTIVITY.map((a, i) => ({
          id: String(i),
          action_type: a.type + (a.type === 'phase' ? '_completed' : a.type === 'client' ? '_created' : a.type === 'billing' ? '_paid' : a.type === 'bot' ? '_updated' : a.type === 'plug' ? '_enabled' : '_request'),
          entity_type: a.client,
          description: a.action,
          created_at: new Date(Date.now() - i * 3600000).toISOString(),
          actor_name: a.user,
        })))
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('team_activity_log')
        .select('id, action_type, entity_type, description, created_at, user_id, internal_users(full_name)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) {
        setActivity(data.map((row: {
          id: string; action_type: string; entity_type: string;
          description: string; created_at: string;
          internal_users: { full_name: string }[] | null
        }) => ({
          id: row.id,
          action_type: row.action_type,
          entity_type: row.entity_type,
          description: row.description,
          created_at: row.created_at,
          actor_name: Array.isArray(row.internal_users) ? row.internal_users[0]?.full_name : (row.internal_users as { full_name: string } | null)?.full_name,
        })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? activity : activity.filter(a => a.action_type.startsWith(filter))

  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filter === opt.value
                ? 'bg-[#1E2433] text-white border-[#1E2433]'
                : 'bg-white text-[#6B7280] border-[#E5E8EF] hover:border-[#1E2433]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F4F6F9] flex items-center justify-between">
          <p className="text-sm font-bold text-[#1A1F2E]">Registro de actividad</p>
          <p className="text-xs text-[#9CA3AF]">{filtered.length} eventos</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-[#9CA3AF] py-10">Sin actividad registrada</p>
        ) : (
          filtered.map((a) => {
            const colorClass = typeColors[a.action_type] || 'bg-gray-50 text-gray-500'
            const shortLabel = typeShort[a.action_type] || a.action_type
            return (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-[#F4F6F9] last:border-0">
                <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 ${colorClass}`}>
                  {shortLabel}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1A1F2E]">
                    {a.actor_name && <span className="font-semibold">{a.actor_name} </span>}
                    {a.description}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    {a.entity_type && `${a.entity_type} · `}{formatRelativeTime(a.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Demo data for Rendimiento ────────────────────────────────────────────────

const DEMO_TECH_PERF = [
  { name: 'Santiago R.', active: 2, completed: 5, delayed: 0, avgDays: 45 },
  { name: 'Carlos M.', active: 2, completed: 3, delayed: 1, avgDays: 62 },
]

const DEMO_PHASE_SPEED = [
  { fase: 'Fase 1', dias: 12 },
  { fase: 'Fase 2', dias: 18 },
  { fase: 'Fase 3', dias: 25 },
  { fase: 'Fase 4', dias: 15 },
]

// ─── Tab Rendimiento ──────────────────────────────────────────────────────────

interface TechPerf {
  name: string
  active: number
  completed: number
  delayed: number
  avgDays: number
}

interface PhaseSpeed {
  fase: string
  dias: number
}

interface RendimientoData {
  completedProjects: number
  avgProjectDays: number
  punctualityRate: number
  phasesThisWeek: number
  techPerf: TechPerf[]
  phaseSpeed: PhaseSpeed[]
}

function TabRendimiento() {
  const [data, setData] = useState<RendimientoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      if (IS_DEMO) {
        setData({
          completedProjects: 8,
          avgProjectDays: 52,
          punctualityRate: 87,
          phasesThisWeek: 3,
          techPerf: DEMO_TECH_PERF,
          phaseSpeed: DEMO_PHASE_SPEED,
        })
        setLoading(false)
        return
      }

      try {
        const today = new Date().toISOString().split('T')[0]
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
        weekStart.setHours(0, 0, 0, 0)

        const [projectsRes, phasesRes, teamRes] = await Promise.all([
          supabase.from('projects').select('id, status, start_date, end_date, assigned_tech'),
          supabase.from('project_phases').select('id, phase_name, updated_at, created_at').eq('status', 'completed'),
          supabase.from('internal_users').select('id, full_name').eq('is_active', true),
        ])

        const allProjects: {
          id: string; status: string; start_date: string | null;
          end_date: string | null; assigned_tech: string | null
        }[] = projectsRes.data || []

        const completedProjects = allProjects.filter(p => p.status === 'completed')

        // avg days
        const withDays = completedProjects.filter(p => p.start_date && p.end_date)
        const avgProjectDays = withDays.length > 0
          ? Math.round(withDays.reduce((s, p) => {
              const diff = new Date(p.end_date!).getTime() - new Date(p.start_date!).getTime()
              return s + diff / 86400000
            }, 0) / withDays.length)
          : 0

        // punctuality
        const punctual = completedProjects.filter(p => p.end_date && p.start_date && new Date(p.end_date) >= new Date(p.start_date))
        const punctualityRate = completedProjects.length > 0
          ? Math.round((punctual.length / completedProjects.length) * 100)
          : 0

        // phases this week
        const phasesThisWeek = ((phasesRes.data || []) as { updated_at: string }[]).filter(
          ph => new Date(ph.updated_at) >= weekStart
        ).length

        // tech performance
        const teamMembers: { id: string; full_name: string }[] = teamRes.data || []
        const techPerf: TechPerf[] = teamMembers.map(m => {
          const myProjects = allProjects.filter(p => p.assigned_tech === m.id)
          const myCompleted = myProjects.filter(p => p.status === 'completed')
          const myActive = myProjects.filter(p => p.status === 'active')
          const myDelayed = myActive.filter(p => p.end_date && p.end_date < today)
          const myWithDays = myActive.filter(p => p.start_date)
          const myAvgDays = myWithDays.length > 0
            ? Math.round(myWithDays.reduce((s, p) => {
                const diff = Date.now() - new Date(p.start_date!).getTime()
                return s + diff / 86400000
              }, 0) / myWithDays.length)
            : 0
          return {
            name: m.full_name.split(' ')[0] + ' ' + (m.full_name.split(' ')[1]?.[0] ?? '') + '.',
            active: myActive.length,
            completed: myCompleted.length,
            delayed: myDelayed.length,
            avgDays: myAvgDays,
          }
        })

        // phase speed
        const allPhases: { phase_name: string; updated_at: string; created_at: string }[] = phasesRes.data || []
        const phaseMap: Record<string, number[]> = {}
        allPhases.forEach(ph => {
          const days = (new Date(ph.updated_at).getTime() - new Date(ph.created_at).getTime()) / 86400000
          const key = ph.phase_name || 'Sin nombre'
          if (!phaseMap[key]) phaseMap[key] = []
          phaseMap[key].push(days)
        })
        const phaseSpeed: PhaseSpeed[] = Object.entries(phaseMap).map(([fase, vals]) => ({
          fase,
          dias: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
        }))

        setData({
          completedProjects: completedProjects.length,
          avgProjectDays,
          punctualityRate,
          phasesThisWeek,
          techPerf: techPerf.length > 0 ? techPerf : DEMO_TECH_PERF,
          phaseSpeed: phaseSpeed.length > 0 ? phaseSpeed : DEMO_PHASE_SPEED,
        })
      } catch {
        setData({
          completedProjects: 0,
          avgProjectDays: 0,
          punctualityRate: 0,
          phasesThisWeek: 0,
          techPerf: DEMO_TECH_PERF,
          phaseSpeed: DEMO_PHASE_SPEED,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const kpis = [
    {
      label: 'Proyectos completados',
      value: String(data.completedProjects),
      sub: 'Total histórico',
      icon: CheckCircle2,
      iconClass: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
    },
    {
      label: 'Tiempo promedio',
      value: `${data.avgProjectDays} días`,
      sub: 'Desde inicio a cierre',
      icon: Timer,
      iconClass: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
    {
      label: 'Tasa de puntualidad',
      value: `${data.punctualityRate}%`,
      sub: 'Proyectos a tiempo',
      icon: Award,
      iconClass: 'text-[#C8F135]',
      iconBg: 'bg-[#C8F135]/10',
    },
    {
      label: 'Fases esta semana',
      value: String(data.phasesThisWeek),
      sub: 'Completadas los últimos 7 días',
      icon: Layers,
      iconClass: 'text-violet-400',
      iconBg: 'bg-violet-500/10',
    },
  ]

  const chartTooltipStyle = {
    contentStyle: { background: '#12101A', border: '1px solid #1E1C2A', borderRadius: '12px', fontSize: '12px', color: '#fff' },
    labelStyle: { color: '#9CA3AF', fontSize: '11px' },
  }

  return (
    <div className="space-y-6">
      {/* Row 1 — KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl ${k.iconBg} flex items-center justify-center mb-3`}>
                <Icon size={16} className={k.iconClass} />
              </div>
              <p className="text-2xl font-black text-white">{k.value}</p>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mt-0.5">{k.label}</p>
              <p className="text-xs text-white/40 mt-1">{k.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Proyectos por técnico */}
        <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl p-5">
          <p className="text-sm font-bold text-white mb-1">Proyectos por técnico</p>
          <p className="text-xs text-white/40 mb-5">Activos, completados y retrasados</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.techPerf} barGap={3} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1C2A" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }} />
              <Bar dataKey="completed" name="Completados" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="active" name="Activos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delayed" name="Retrasados" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fases más lentas */}
        <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl p-5">
          <p className="text-sm font-bold text-white mb-1">Fases más lentas</p>
          <p className="text-xs text-white/40 mb-5">Días promedio para completar cada fase</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.phaseSpeed} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1C2A" />
              <XAxis dataKey="fase" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="dias" name="Días promedio" fill="#8B22E8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3 — Detalle por técnico */}
      <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E1C2A]">
          <p className="text-sm font-bold text-white">Detalle por técnico</p>
          <p className="text-xs text-white/40 mt-0.5">Resumen de rendimiento individual</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E1C2A]">
                {['Técnico', 'Proyectos activos', 'Completados', 'En retraso', 'Tiempo promedio'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[11px] font-bold text-white/30 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.techPerf.map((row, i) => (
                <tr key={i} className="border-b border-[#1E1C2A] last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-white">{row.name}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/12 text-blue-400 text-xs font-bold border border-blue-500/20">
                      {row.active}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/12 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                      {row.completed}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {row.delayed > 0 ? (
                      <span className="px-2.5 py-1 rounded-full bg-red-500/12 text-red-400 text-xs font-bold border border-red-500/20">
                        {row.delayed}
                      </span>
                    ) : (
                      <span className="text-xs text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-white/60">{row.avgDays > 0 ? `${row.avgDays} días` : '—'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS: { id: SuperTab; label: string; icon: React.ElementType }[] = [
  { id: 'equipo', label: 'Gestión de Equipo', icon: Users },
  { id: 'financiero', label: 'Financiero Global', icon: DollarSign },
  { id: 'rendimiento', label: 'Rendimiento', icon: TrendingUp },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
  { id: 'auditoria', label: 'Auditoría', icon: Activity },
]

export function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<SuperTab>('equipo')

  return (
    <div className="flex-1 overflow-y-auto fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900 to-violet-700 px-8 py-6">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck size={20} className="text-violet-300" />
          <p className="text-xs font-bold text-violet-300 uppercase tracking-widest">Acceso restringido</p>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Super Admin</h1>
        <p className="text-sm text-violet-300 mt-0.5">Control total del sistema — solo tú tienes acceso a esta sección</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E5E8EF] px-8">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#374151]'
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
        {activeTab === 'equipo' && <TabEquipo />}
        {activeTab === 'financiero' && <TabFinanciero />}
        {activeTab === 'rendimiento' && <TabRendimiento />}
        {activeTab === 'configuracion' && <TabConfiguracion />}
        {activeTab === 'auditoria' && <TabAuditoria />}
      </div>
    </div>
  )
}
