import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { MessageCircle, Moon, Clock, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { NodoCard } from '../../components/ui/NodoCard'
import { DEMO_CLIENTS, DEMO_BOT_METRICS } from '../../lib/demo'

// ─── Datos demo: historial completo desde inicio de operaciones ──────────────
// Total: 1.117.000 conversaciones · 43% fuera de horario laboral
const CLIENT_METRICS = [
  {
    client_id: 'demo-client-1',
    conversations: 434900,
    fuera_horario: 187000,
    resolution_rate: 0.835,
    avg_response_ms: 34000,
    trend: 'up' as const,
    top_topic: 'Citas y reservas',
  },
  {
    client_id: 'demo-client-2',
    conversations: 195800,
    fuera_horario: 84200,
    resolution_rate: 0.71,
    avg_response_ms: 41000,
    trend: 'down' as const,
    top_topic: 'Disponibilidad de propiedades',
  },
  {
    client_id: 'demo-client-3',
    conversations: 352900,
    fuera_horario: 151700,
    resolution_rate: 0.91,
    avg_response_ms: 31000,
    trend: 'up' as const,
    top_topic: 'Clases y horarios',
  },
  {
    client_id: 'demo-client-4',
    conversations: 133400,
    fuera_horario: 57400,
    resolution_rate: 0.66,
    avg_response_ms: 42000,
    trend: 'stable' as const,
    top_topic: 'Carta y menú',
  },
]

const GLOBAL_WEEKLY = DEMO_BOT_METRICS.map(w => ({
  label: new Date(w.week_start + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
  value: w.conversations,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (ms: number) => {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

const total = (key: keyof typeof CLIENT_METRICS[0]) =>
  CLIENT_METRICS.reduce((acc, c) => acc + (c[key] as number), 0)

const avg = (key: keyof typeof CLIENT_METRICS[0]) =>
  total(key) / CLIENT_METRICS.length

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up')   return <TrendingUp size={13} className="text-emerald-500" />
  if (trend === 'down') return <TrendingDown size={13} className="text-red-400" />
  return <Minus size={13} className="text-[#6d7ab5]" />
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-[#6d7ab5] mb-1">{label}</p>
      <p className="text-[#1e1b4b] font-semibold">{payload[0].value} conversaciones</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function MasterMetricsPage() {
  const globalConversations  = total('conversations')
  const globalFueraHorario   = total('fuera_horario')
  const globalAvgResponse    = Math.round(avg('avg_response_ms'))
  const globalResolution     = avg('resolution_rate')

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-[#1e1b4b] font-syne">Métricas globales</h1>
          <p className="text-sm text-[#6d7ab5] mt-0.5">Historial completo desde inicio de operaciones · todos los agentes</p>
        </div>

        {/* ── 4 hero totals ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              icon: <MessageCircle size={18} />,
              label: 'Clientes atendidos',
              value: globalConversations.toLocaleString('es-ES'),
              sub: 'Historial total',
              accent: '#c026a8',
            },
            {
              icon: <Moon size={18} />,
              label: 'Fuera de horario',
              value: globalFueraHorario.toLocaleString('es-ES'),
              sub: `${Math.round((globalFueraHorario / globalConversations) * 100)}% del total`,
              accent: '#7c3aed',
            },
            {
              icon: <Zap size={18} />,
              label: 'Respuesta media',
              value: fmtTime(globalAvgResponse),
              sub: 'Promedio global',
              accent: '#0ea5e9',
            },
            {
              icon: <Clock size={18} />,
              label: 'Resolución autónoma',
              value: `${Math.round(globalResolution * 100)}%`,
              sub: 'Sin escalar al humano',
              accent: '#10b981',
            },
          ].map(({ icon, label, value, sub, accent }) => (
            <NodoCard key={label} padding="sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
                  <span style={{ color: accent }}>{icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#6d7ab5] leading-none mb-1.5">{label}</p>
                  <p className="text-2xl font-bold text-[#1e1b4b] leading-none font-syne">{value}</p>
                  <p className="text-[10px] text-[#6d7ab5] mt-1">{sub}</p>
                </div>
              </div>
            </NodoCard>
          ))}
        </div>

        {/* ── Evolución semanal ────────────────────────────────────────────── */}
        <NodoCard padding="md">
          <p className="text-xs font-semibold text-[#3730a3] mb-4">Conversaciones globales por semana</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={GLOBAL_WEEKLY} barSize={32}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6d7ab5' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,.06)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {GLOBAL_WEEKLY.map((_, i) => (
                  <Cell key={i} fill={i === GLOBAL_WEEKLY.length - 1 ? '#c026a8' : '#e0d7f8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </NodoCard>

        {/* ── Tabla por cliente ────────────────────────────────────────────── */}
        <NodoCard padding="md">
          <p className="text-xs font-semibold text-[#3730a3] mb-4">Rendimiento por cliente</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/40">
                  <th className="text-left pb-3 text-[11px] font-semibold text-[#6d7ab5] pr-4">Cliente</th>
                  <th className="text-right pb-3 text-[11px] font-semibold text-[#6d7ab5] px-3">Convers.</th>
                  <th className="text-right pb-3 text-[11px] font-semibold text-[#6d7ab5] px-3">Fuera horario</th>
                  <th className="text-right pb-3 text-[11px] font-semibold text-[#6d7ab5] px-3">Resolución</th>
                  <th className="text-right pb-3 text-[11px] font-semibold text-[#6d7ab5] px-3">T. respuesta</th>
                  <th className="text-left pb-3 text-[11px] font-semibold text-[#6d7ab5] pl-3">Tema principal</th>
                  <th className="text-center pb-3 text-[11px] font-semibold text-[#6d7ab5]">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {CLIENT_METRICS.map((cm, i) => {
                  const client = DEMO_CLIENTS.find(c => c.id === cm.client_id)
                  const isLast = i === CLIENT_METRICS.length - 1
                  return (
                    <tr key={cm.client_id} className={!isLast ? 'border-b border-white/30' : ''}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-[#1e1b4b] text-xs">{client?.business_name ?? cm.client_id}</p>
                        <p className="text-[10px] text-[#6d7ab5]">{client?.sector}</p>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm font-semibold text-[#1e1b4b]">{cm.conversations.toLocaleString('es-ES')}</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm text-[#1e1b4b]">{cm.fuera_horario}</span>
                        <span className="text-[10px] text-[#6d7ab5] ml-1">({Math.round((cm.fuera_horario / cm.conversations) * 100)}%)</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: cm.resolution_rate >= 0.8 ? '#10b981' : cm.resolution_rate >= 0.65 ? '#f59e0b' : '#ef4444' }}
                        >
                          {Math.round(cm.resolution_rate * 100)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className="text-sm"
                          style={{ color: cm.avg_response_ms <= 30000 ? '#10b981' : cm.avg_response_ms <= 45000 ? '#f59e0b' : '#ef4444' }}
                        >
                          {fmtTime(cm.avg_response_ms)}
                        </span>
                      </td>
                      <td className="py-3 pl-3">
                        <span className="text-xs text-[#6d7ab5]">{cm.top_topic}</span>
                      </td>
                      <td className="py-3 text-center">
                        <TrendIcon trend={cm.trend} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </NodoCard>

        {/* ── Ranking resolución ───────────────────────────────────────────── */}
        <NodoCard padding="md">
          <p className="text-xs font-semibold text-[#3730a3] mb-4">Ranking de resolución autónoma</p>
          <div className="space-y-3">
            {[...CLIENT_METRICS]
              .sort((a, b) => b.resolution_rate - a.resolution_rate)
              .map((cm, i) => {
                const client = DEMO_CLIENTS.find(c => c.id === cm.client_id)
                const pct = Math.round(cm.resolution_rate * 100)
                const color = pct >= 85 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={cm.client_id} className="flex items-center gap-3">
                    <span className="w-5 text-[11px] font-bold text-[#6d7ab5] text-center flex-shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#1e1b4b] truncate">{client?.business_name}</span>
                        <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color }}>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#f1f0f9] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </NodoCard>

      </div>
    </div>
  )
}
