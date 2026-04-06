import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, Moon, Sun, Sunset, Star } from 'lucide-react'
import { NodoCard } from '../../components/ui/NodoCard'
import { DEMO_BOT_METRICS } from '../../lib/demo'

type Period = 7 | 14 | 28

// ─── Hero card (estilo facturación) ──────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string
  sub?: string
  valueColor?: string
}
function StatCard({ label, value, sub, valueColor = '#1e1b4b' }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E8E6F0] rounded-xl p-3 md:p-4">
      <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-xl md:text-2xl font-bold leading-none" style={{ color: valueColor }}>{value}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c026a8]" />
          <p className="text-[10px] text-[#6B6B80]">{sub}</p>
        </div>
      )}
    </div>
  )
}

// ─── Barra de progreso simple ─────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 rounded-full bg-[#f1f0f9] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtTime = (ms: number) => {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}
const fmtDur = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s > 0 ? ` ${s}s` : ''}`
}
const pct = (n: number, total: number) => total > 0 ? Math.round((n / total) * 100) : 0

// ─── Main ─────────────────────────────────────────────────────────────────────
export function ClientMetricsPage() {
  const [period, setPeriod] = useState<Period>(28)

  const weeks = useMemo(() => {
    const weeksNeeded = period === 7 ? 1 : period === 14 ? 2 : 4
    return DEMO_BOT_METRICS.slice(-weeksNeeded)
  }, [period])

  const data = useMemo(() => {
    const conversations    = weeks.reduce((a, w) => a + w.conversations, 0)
    const fuera_horario    = weeks.reduce((a, w) => a + w.atendidas_fuera_horario, 0)
    const avg_dur_seg      = Math.round(weeks.reduce((a, w) => a + w.duracion_conversacion_seg, 0) / weeks.length)
    const avg_resp_ms      = Math.round(weeks.reduce((a, w) => a + w.avg_response_ms, 0) / weeks.length)
    const resolution_rate  = weeks.reduce((a, w) => a + w.resolution_rate, 0) / weeks.length
    const escalation_rate  = weeks.reduce((a, w) => a + w.escalation_rate, 0) / weeks.length

    const conv_manana    = weeks.reduce((a, w) => a + w.conv_manana, 0)
    const conv_tarde     = weeks.reduce((a, w) => a + w.conv_tarde, 0)
    const conv_noche     = weeks.reduce((a, w) => a + w.conv_noche, 0)
    const conv_madrugada = weeks.reduce((a, w) => a + w.conv_madrugada, 0)
    const horario_laboral = conv_manana + conv_tarde
    const fuera_laboral   = conv_noche + conv_madrugada + fuera_horario

    const alertas = Math.round(conversations * escalation_rate)
    const resueltas = Math.round(conversations * resolution_rate)
    const escaladas = alertas

    // Merge topics across weeks
    const topicMap: Record<string, number> = {}
    for (const w of weeks) {
      for (const t of w.top_topics) {
        topicMap[t.topic] = (topicMap[t.topic] ?? 0) + t.count
      }
    }
    const top_topics = Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))

    return {
      conversations, fuera_horario, avg_dur_seg, avg_resp_ms,
      resolution_rate, escalation_rate,
      conv_manana, conv_tarde, conv_noche, conv_madrugada,
      horario_laboral, fuera_laboral,
      alertas, resueltas, escaladas,
      top_topics,
    }
  }, [weeks])

  const PERIODS: { label: string; value: Period }[] = [
    { label: 'Últimos 7 días', value: 7 },
    { label: 'Últimos 14 días', value: 14 },
    { label: 'Últimos 28 días', value: 28 },
  ]

  const hasAlert = data.escalation_rate > 0.09

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Header + período ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#1e1b4b] font-syne">Métricas del Agente</h1>
            <p className="text-sm text-[#6d7ab5] mt-0.5">Rendimiento de tu agente IA</p>
          </div>
          <div className="flex gap-1 bg-white border border-[#E8E6F0] rounded-xl p-1 self-start sm:self-auto">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p.value
                    ? 'bg-[#c026a8] text-white shadow-sm'
                    : 'text-[#6d7ab5] hover:text-[#1e1b4b]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4 hero numbers ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Conversaciones totales"
            value={data.conversations.toLocaleString('es-ES')}
            sub={`en ${period} días`}
          />
          <StatCard
            label="Fuera de horario"
            value={data.fuera_horario.toLocaleString('es-ES')}
            sub={`${pct(data.fuera_horario, data.conversations)}% del total`}
            valueColor="#7c3aed"
          />
          <StatCard
            label="Duración media"
            value={fmtDur(data.avg_dur_seg)}
            sub="por conversación"
            valueColor="#1e1b4b"
          />
          <StatCard
            label="Tiempo de respuesta"
            value={fmtTime(data.avg_resp_ms)}
            sub="por mensaje"
            valueColor="#0ea5e9"
          />
        </div>

        {/* ── Fila 2: Resueltas vs Escaladas + Alertas ─────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Resueltas vs Escaladas */}
          <NodoCard padding="md" className="md:col-span-2">
            <p className="text-xs font-semibold text-[#3730a3] mb-4">Resolución de conversaciones</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Resueltas autónomamente</p>
                <p className="text-2xl font-bold text-emerald-500">{data.resueltas.toLocaleString('es-ES')}</p>
                <p className="text-xs text-[#6d7ab5] mt-0.5">{Math.round(data.resolution_rate * 100)}% del total</p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Derivadas al equipo</p>
                <p className="text-2xl font-bold text-amber-500">{data.escaladas.toLocaleString('es-ES')}</p>
                <p className="text-xs text-[#6d7ab5] mt-0.5">{Math.round(data.escalation_rate * 100)}% del total</p>
              </div>
            </div>
            {/* Split bar */}
            <div className="h-3 rounded-full overflow-hidden flex gap-px">
              <div
                className="h-full rounded-l-full"
                style={{
                  width: `${Math.round(data.resolution_rate * 100)}%`,
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                }}
              />
              <div
                className="h-full rounded-r-full flex-1"
                style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
              />
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-[#6d7ab5]">Autónomas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] text-[#6d7ab5]">Derivadas</span>
              </div>
            </div>
          </NodoCard>

          {/* Alertas */}
          <NodoCard padding="md">
            <p className="text-xs font-semibold text-[#3730a3] mb-3">Alertas generadas</p>
            <p className="text-3xl font-bold text-[#1e1b4b] font-syne">{data.alertas}</p>
            <p className="text-xs text-[#6d7ab5] mt-1">conversaciones que requirieron intervención</p>
            <div className="mt-4 pt-3 border-t border-white/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6d7ab5]">Tasa de alerta</span>
                <span className="text-xs font-semibold text-amber-500">{Math.round(data.escalation_rate * 100)}%</span>
              </div>
              <ProgressBar pct={Math.round(data.escalation_rate * 100)} color="#f59e0b" />
              <p className="text-[10px] text-[#6d7ab5]">
                {data.escalation_rate <= 0.08 ? '✓ Dentro del rango óptimo (< 8%)' : '⚠ Por encima del óptimo (> 8%)'}
              </p>
            </div>
          </NodoCard>
        </div>

        {/* ── Fila 3: Horario laboral vs fuera + Top temas ─────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Horario laboral vs fuera */}
          <NodoCard padding="md">
            <p className="text-xs font-semibold text-[#3730a3] mb-4">Horario laboral vs fuera de horario</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-indigo-50/60 rounded-xl p-3 text-center">
                <Sun size={16} className="text-amber-500 mx-auto mb-1.5" />
                <p className="text-xl font-bold text-[#1e1b4b]">{data.horario_laboral}</p>
                <p className="text-[10px] text-[#6d7ab5] mt-0.5">Horario laboral</p>
                <p className="text-[10px] font-semibold text-[#c026a8]">{pct(data.horario_laboral, data.conversations)}%</p>
              </div>
              <div className="bg-violet-50/60 rounded-xl p-3 text-center">
                <Moon size={16} className="text-violet-500 mx-auto mb-1.5" />
                <p className="text-xl font-bold text-[#1e1b4b]">{data.fuera_horario}</p>
                <p className="text-[10px] text-[#6d7ab5] mt-0.5">Fuera de horario</p>
                <p className="text-[10px] font-semibold text-[#7c3aed]">{pct(data.fuera_horario, data.conversations)}%</p>
              </div>
            </div>

            <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-2.5">Por franja</p>
            <div className="space-y-2.5">
              {[
                { icon: <Sun size={11} />, label: 'Mañana', sub: '06–12h', value: data.conv_manana, color: '#f59e0b' },
                { icon: <Sunset size={11} />, label: 'Tarde', sub: '12–20h', value: data.conv_tarde, color: '#c026a8' },
                { icon: <Star size={11} />, label: 'Noche', sub: '20–00h', value: data.conv_noche, color: '#7c3aed' },
                { icon: <Moon size={11} />, label: 'Madrugada', sub: '00–06h', value: data.conv_madrugada, color: '#6366f1' },
              ].map(row => {
                const maxV = Math.max(data.conv_manana, data.conv_tarde, data.conv_noche, data.conv_madrugada)
                return (
                  <div key={row.label} className="flex items-center gap-2">
                    <span style={{ color: row.color }} className="flex-shrink-0">{row.icon}</span>
                    <span className="text-[11px] text-[#6d7ab5] w-[68px] flex-shrink-0">{row.label} <span className="text-[9px] opacity-60">{row.sub}</span></span>
                    <div className="flex-1">
                      <ProgressBar pct={Math.round((row.value / maxV) * 100)} color={row.color} />
                    </div>
                    <span className="text-[11px] font-semibold text-[#1e1b4b] w-8 text-right">{row.value}</span>
                  </div>
                )
              })}
            </div>
          </NodoCard>

          {/* Top 5 temas */}
          <NodoCard padding="md">
            <p className="text-xs font-semibold text-[#3730a3] mb-4">Top 5 temas consultados</p>
            <div className="space-y-3">
              {data.top_topics.map((t, i) => {
                const maxCount = data.top_topics[0].count
                return (
                  <div key={t.topic}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#f1f0f9] flex items-center justify-center text-[9px] font-bold text-[#6366f1] flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-xs text-[#1e1b4b]">{t.topic}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#1e1b4b] ml-2 flex-shrink-0">{t.count}</span>
                    </div>
                    <ProgressBar
                      pct={Math.round((t.count / maxCount) * 100)}
                      color={i === 0 ? 'linear-gradient(90deg, #c026a8, #7c3aed)' : '#e0d7f8'}
                    />
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-white/40">
              <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-2">Retención autónoma</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <ProgressBar pct={Math.round(data.resolution_rate * 100)} color="linear-gradient(90deg, #10b981, #059669)" />
                </div>
                <span className="text-sm font-bold text-emerald-500 flex-shrink-0">{Math.round(data.resolution_rate * 100)}%</span>
              </div>
              <p className="text-[10px] text-[#6d7ab5] mt-1">conversaciones resueltas sin intervención humana</p>
            </div>
          </NodoCard>
        </div>

        {/* ── Smart alert ──────────────────────────────────────────────── */}
        {hasAlert ? (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 backdrop-blur-sm">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Escalamientos elevados este período</p>
              <p className="text-xs text-amber-700 mt-0.5">
                El {Math.round(data.escalation_rate * 100)}% de las conversaciones requirieron intervención del equipo. Añadir respuestas a los temas más consultados puede reducir este indicador. Revisa la sección <span className="font-semibold">Mi agente</span>.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 backdrop-blur-sm">
            <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Agente funcionando en óptimas condiciones</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Resolución autónoma del {Math.round(data.resolution_rate * 100)}% con un tiempo de respuesta de {fmtTime(data.avg_resp_ms)}. Sin alertas activas en este período.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
