import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { MessageCircle, Moon, Clock, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { NodoCard } from '../../components/ui/NodoCard'
import { DEMO_BOT_METRICS } from '../../lib/demo'

// ─── Aggregation helpers ─────────────────────────────────────────────────────
function sumKey(arr: typeof DEMO_BOT_METRICS, key: keyof typeof DEMO_BOT_METRICS[0]): number {
  return arr.reduce((acc, w) => acc + (w[key] as number), 0)
}

function avgKey(arr: typeof DEMO_BOT_METRICS, key: keyof typeof DEMO_BOT_METRICS[0]): number {
  if (!arr.length) return 0
  return sumKey(arr, key) / arr.length
}

// ─── Mini hero card ───────────────────────────────────────────────────────────
interface HeroCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: string
}

function HeroCard({ icon, label, value, sub, accent = '#c026a8' }: HeroCardProps) {
  return (
    <NodoCard padding="sm">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#6d7ab5] leading-none mb-1.5">{label}</p>
          <p className="text-2xl font-bold text-[#1e1b4b] leading-none font-syne">{value}</p>
          {sub && <p className="text-[11px] text-[#6d7ab5] mt-1">{sub}</p>}
        </div>
      </div>
    </NodoCard>
  )
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────
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
export function ClientMetricsPage() {
  const weeks = DEMO_BOT_METRICS

  const totals = useMemo(() => {
    const conversaciones = sumKey(weeks, 'conversations')
    const fuera_horario = sumKey(weeks, 'atendidas_fuera_horario')
    const avg_duracion_seg = Math.round(avgKey(weeks, 'duracion_conversacion_seg'))
    const avg_respuesta_ms = Math.round(avgKey(weeks, 'avg_response_ms'))
    const resolution_rate = avgKey(weeks, 'resolution_rate')
    const escalation_rate = avgKey(weeks, 'escalation_rate')

    // Horaria agregada
    const conv_manana   = sumKey(weeks, 'conv_manana')
    const conv_tarde    = sumKey(weeks, 'conv_tarde')
    const conv_noche    = sumKey(weeks, 'conv_noche')
    const conv_madrugada = sumKey(weeks, 'conv_madrugada')

    // Topics: suma por nombre
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

    // Semanas para el gráfico
    const weekChart = weeks.map(w => ({
      label: new Date(w.week_start + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      value: w.conversations,
    }))

    return {
      conversaciones,
      fuera_horario,
      avg_duracion_seg,
      avg_respuesta_ms,
      resolution_rate,
      escalation_rate,
      conv_manana,
      conv_tarde,
      conv_noche,
      conv_madrugada,
      top_topics,
      weekChart,
    }
  }, [weeks])

  const fmtTime = (ms: number) => {
    const s = Math.round(ms / 1000)
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
  }

  const fmtDur = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}m ${s}s`
  }

  // Franja horaria con más actividad
  const horarias = [
    { label: 'Mañana', sublabel: '06–12h', value: totals.conv_manana, color: '#f59e0b' },
    { label: 'Tarde',  sublabel: '12–20h', value: totals.conv_tarde,  color: '#c026a8' },
    { label: 'Noche',  sublabel: '20–00h', value: totals.conv_noche,  color: '#7c3aed' },
    { label: 'Madrugada', sublabel: '00–06h', value: totals.conv_madrugada, color: '#6366f1' },
  ]
  const maxHoraria = Math.max(...horarias.map(h => h.value))

  // Smart alert
  const hasAlert = totals.escalation_rate > 0.09
  const goodResolution = totals.resolution_rate >= 0.85

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-[#1e1b4b] font-syne">Métricas del Agente</h1>
          <p className="text-sm text-[#6d7ab5] mt-0.5">Resumen de los últimos 28 días</p>
        </div>

        {/* ── 4 hero numbers ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <HeroCard
            icon={<MessageCircle size={18} />}
            label="Conversaciones totales"
            value={totals.conversaciones.toLocaleString('es-ES')}
            sub="últimos 28 días"
            accent="#c026a8"
          />
          <HeroCard
            icon={<Moon size={18} />}
            label="Atendidas fuera de horario"
            value={totals.fuera_horario.toLocaleString('es-ES')}
            sub={`${Math.round((totals.fuera_horario / totals.conversaciones) * 100)}% del total`}
            accent="#7c3aed"
          />
          <HeroCard
            icon={<Clock size={18} />}
            label="Duración media de conversación"
            value={fmtDur(totals.avg_duracion_seg)}
            sub="por sesión"
            accent="#6366f1"
          />
          <HeroCard
            icon={<Zap size={18} />}
            label="Tiempo medio de respuesta"
            value={fmtTime(totals.avg_respuesta_ms)}
            sub="por mensaje"
            accent="#0ea5e9"
          />
        </div>

        {/* ── Row 2: gráfico semanal + franja horaria ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Conversaciones por semana */}
          <NodoCard padding="md" className="lg:col-span-2">
            <p className="text-xs font-semibold text-[#3730a3] mb-4">Conversaciones por semana</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={totals.weekChart} barSize={28}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6d7ab5' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,.06)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {totals.weekChart.map((_, i) => (
                    <Cell key={i} fill={i === totals.weekChart.length - 1 ? '#c026a8' : '#e0d7f8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </NodoCard>

          {/* Distribución horaria */}
          <NodoCard padding="md">
            <p className="text-xs font-semibold text-[#3730a3] mb-4">Actividad por franja</p>
            <div className="space-y-3">
              {horarias.map((h) => (
                <div key={h.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#1e1b4b] font-medium">{h.label}
                      <span className="text-[#9CA3AF] ml-1 font-normal">{h.sublabel}</span>
                    </span>
                    <span className="text-xs font-semibold text-[#1e1b4b]">{h.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f1f0f9] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((h.value / maxHoraria) * 100)}%`,
                        background: h.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </NodoCard>
        </div>

        {/* ── Row 3: temas + calidad ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Top 5 temas */}
          <NodoCard padding="md" className="lg:col-span-2">
            <p className="text-xs font-semibold text-[#3730a3] mb-4">Top 5 temas consultados</p>
            <div className="space-y-2.5">
              {totals.top_topics.map((t, i) => {
                const maxCount = totals.top_topics[0].count
                return (
                  <div key={t.topic} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#f1f0f9] flex items-center justify-center text-[10px] font-bold text-[#6366f1] flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#1e1b4b] truncate">{t.topic}</span>
                        <span className="text-xs font-semibold text-[#1e1b4b] ml-2 flex-shrink-0">{t.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#f1f0f9] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((t.count / maxCount) * 100)}%`,
                            background: 'linear-gradient(90deg, #c026a8, #7c3aed)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </NodoCard>

          {/* Calidad y resolución */}
          <NodoCard padding="md">
            <p className="text-xs font-semibold text-[#3730a3] mb-4">Calidad</p>
            <div className="space-y-4">
              {/* Tasa resolución */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#6d7ab5]">Resolución autónoma</span>
                  <span className="text-sm font-bold text-[#1e1b4b]">
                    {Math.round(totals.resolution_rate * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#f1f0f9] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(totals.resolution_rate * 100)}%`,
                      background: 'linear-gradient(90deg, #10b981, #059669)',
                    }}
                  />
                </div>
              </div>
              {/* Tasa escalamiento */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#6d7ab5]">Derivadas a equipo</span>
                  <span className="text-sm font-bold text-[#1e1b4b]">
                    {Math.round(totals.escalation_rate * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#f1f0f9] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(totals.escalation_rate * 100)}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/40">
                {goodResolution ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#6d7ab5] leading-relaxed">
                      Tu agente resuelve <span className="font-semibold text-emerald-600">{Math.round(totals.resolution_rate * 100)}%</span> de las consultas de forma autónoma. Rendimiento excelente.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <TrendingUp size={14} className="text-[#6366f1] flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#6d7ab5] leading-relaxed">
                      Hay margen de mejora. Añadir más respuestas a preguntas frecuentes puede aumentar la resolución.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </NodoCard>
        </div>

        {/* ── Smart alert ──────────────────────────────────────────────────── */}
        {hasAlert ? (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 backdrop-blur-sm">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Atención: escalamientos elevados</p>
              <p className="text-xs text-amber-700 mt-0.5">
                El {Math.round(totals.escalation_rate * 100)}% de las conversaciones se derivaron al equipo en las últimas 4 semanas. Revisa las preguntas sin respuesta en la sección <span className="font-semibold">Mi agente</span> para reducir este porcentaje.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 backdrop-blur-sm">
            <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Agente funcionando correctamente</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Resolución autónoma del {Math.round(totals.resolution_rate * 100)}% y tiempo de respuesta bajo {fmtTime(totals.avg_respuesta_ms)}. Sin alertas activas este período.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
