import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, Moon, Sun, Sunset, Star, ChevronRight, X, ArrowRight, BarChart2 } from 'lucide-react'
import { NodoCard } from '../../components/ui/NodoCard'
import { useAuthStore } from '../../store/auth'
import {
  DEMO_BOT_METRICS, DEMO_HOURLY, DEMO_BY_WEEKDAY,
  DEMO_DURATION_DIST, DEMO_RESPONSE_DIST,
  DEMO_ESCALATED_TOPICS, DEMO_TOPIC_TREND,
  AQUAJETS_CLIENT_ID, AQUAJETS_BOT_METRICS, AQUAJETS_HOURLY,
  AQUAJETS_BY_WEEKDAY, AQUAJETS_DURATION_DIST, AQUAJETS_RESPONSE_DIST,
  AQUAJETS_ESCALATED_TOPICS, AQUAJETS_TOPIC_TREND,
  AQUAJETS_LANGUAGES, AQUAJETS_LIFETIME,
} from '../../lib/demo'

// ─── Dataset selector ─────────────────────────────────────────────────────────
function getDataset(clientId?: string) {
  const isAQ = clientId === AQUAJETS_CLIENT_ID
  return {
    hasData:         isAQ,
    botMetrics:      isAQ ? AQUAJETS_BOT_METRICS      : DEMO_BOT_METRICS,
    hourly:          isAQ ? AQUAJETS_HOURLY            : DEMO_HOURLY,
    byWeekday:       isAQ ? AQUAJETS_BY_WEEKDAY        : DEMO_BY_WEEKDAY,
    durationDist:    isAQ ? AQUAJETS_DURATION_DIST     : DEMO_DURATION_DIST,
    responseDist:    isAQ ? AQUAJETS_RESPONSE_DIST     : DEMO_RESPONSE_DIST,
    escalatedTopics: isAQ ? AQUAJETS_ESCALATED_TOPICS  : DEMO_ESCALATED_TOPICS,
    topicTrend:      isAQ ? AQUAJETS_TOPIC_TREND       : DEMO_TOPIC_TREND,
    languages:       isAQ ? AQUAJETS_LANGUAGES         : null,
    lifetime:        isAQ ? AQUAJETS_LIFETIME          : null,
  }
}
type Dataset = ReturnType<typeof getDataset>

type Period = '7d' | '14d' | '1m' | '2m' | '3m' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  '7d':  'últimos 7 días',
  '14d': 'últimos 14 días',
  '1m':  'último mes',
  '2m':  'últimos 2 meses',
  '3m':  'últimos 3 meses',
  'all': 'histórico total',
}

const PERIOD_DAYS: Record<Period, number> = {
  '7d': 7, '14d': 14, '1m': 28, '2m': 56, '3m': 91, 'all': 182,
}
type PanelType =
  | 'conversaciones' | 'fuera_horario' | 'duracion' | 'respuesta'
  | 'resolucion' | 'alertas' | 'horario' | 'temas' | null

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (ms: number) => {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}
const fmtDur = (sec: number) => {
  const m = Math.floor(sec / 60); const s = sec % 60
  return `${m}m${s > 0 ? ` ${s}s` : ''}`
}
const pct = (n: number, total: number) => total > 0 ? Math.round((n / total) * 100) : 0
const fmt24 = (h: number) => `${String(h).padStart(2, '0')}:00`

// ─── Stat card (billing style) ────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: string; sub?: string
  valueColor?: string; onClick?: () => void
}
function StatCard({ label, value, sub, valueColor = '#1e1b4b', onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-white border border-[#E8E6F0] rounded-xl p-3 md:p-4 text-left w-full transition-all duration-150 ${onClick ? 'hover:border-[#c026a8]/40 hover:shadow-md cursor-pointer group' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1.5">{label}</p>
        {onClick && <ChevronRight size={12} className="text-[#c026a8] opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />}
      </div>
      <p className="text-xl md:text-2xl font-bold leading-none" style={{ color: valueColor }}>{value}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c026a8]" />
          <p className="text-[10px] text-[#6B6B80]">{sub}</p>
        </div>
      )}
    </button>
  )
}

// ─── Barra de progreso ────────────────────────────────────────────────────────
function Bar({ pct: p, color, height = 'h-2' }: { pct: number; color: string; height?: string }) {
  return (
    <div className={`${height} rounded-full bg-[#f1f0f9] overflow-hidden`}>
      <div className={`h-full rounded-full transition-all duration-500`} style={{ width: `${p}%`, background: color }} />
    </div>
  )
}

// ─── Section card (clickable) ─────────────────────────────────────────────────
function SectionCard({ title, onClick, children, className = '' }: {
  title: string; onClick?: () => void; children: React.ReactNode; className?: string
}) {
  return (
    <NodoCard padding="md" className={className}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-[#3730a3]">{title}</p>
        {onClick && (
          <button
            onClick={onClick}
            className="flex items-center gap-1 text-[11px] text-[#c026a8] hover:text-[#a21caf] font-medium transition-colors"
          >
            Ver detalle <ArrowRight size={11} />
          </button>
        )}
      </div>
      {children}
    </NodoCard>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETAIL PANELS
// ═══════════════════════════════════════════════════════════════════════════════

function PanelConversaciones({ data, ds, period }: { data: ReturnType<typeof useMetrics>; ds: Dataset; period: Period }) {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const maxDay = Math.max(...Object.values(ds.byWeekday))
  const total = Object.values(ds.byWeekday).reduce((a, b) => a + b, 0)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#f9f8ff] rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Total período</p>
          <p className="text-2xl font-bold text-[#1e1b4b]">{data.conversations.toLocaleString('es-ES')}</p>
        </div>
        <div className="bg-[#f9f8ff] rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Media diaria</p>
          <p className="text-2xl font-bold text-[#c026a8]">{Math.round(data.conversations / PERIOD_DAYS[period])}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-[#3730a3] mb-3">Por día de la semana</p>
        <div className="space-y-2.5">
          {days.map((day, i) => {
            const v = ds.byWeekday[i]
            const isMax = v === maxDay
            return (
              <div key={day} className="flex items-center gap-3">
                <span className={`text-xs w-20 flex-shrink-0 ${isMax ? 'font-semibold text-[#c026a8]' : 'text-[#6d7ab5]'}`}>{day}</span>
                <div className="flex-1">
                  <Bar pct={pct(v, maxDay)} color={isMax ? '#c026a8' : '#e0d7f8'} />
                </div>
                <span className={`text-xs font-semibold w-8 text-right flex-shrink-0 ${isMax ? 'text-[#c026a8]' : 'text-[#1e1b4b]'}`}>{v}</span>
                <span className="text-[10px] text-[#6d7ab5] w-8 text-right flex-shrink-0">{pct(v, total)}%</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="bg-indigo-50/60 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-[#3730a3] mb-1">Insight</p>
        <p className="text-xs text-[#6d7ab5]">
          El <span className="font-semibold text-[#1e1b4b]">viernes</span> es tu día de mayor actividad con <span className="font-semibold text-[#c026a8]">{ds.byWeekday[4]} conversaciones</span>. Los fines de semana representan el {pct(ds.byWeekday[5] + ds.byWeekday[6], total)}% del tráfico semanal.
        </p>
      </div>
    </div>
  )
}

function PanelFueraHorario({ data, ds }: { data: ReturnType<typeof useMetrics>; ds: Dataset }) {
  // Horario de cierre: 20:00. Apertura: 09:00. Mostrar 20h–08h
  const fueraHours = [20,21,22,23,0,1,2,3,4,5,6,7,8]
  const values = fueraHours.map(h => ds.hourly[h])
  const maxV = Math.max(...values)
  const totalFuera = values.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-violet-50 rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Total fuera de horario</p>
          <p className="text-2xl font-bold text-[#7c3aed]">{data.fuera_horario}</p>
        </div>
        <div className="bg-violet-50 rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Hora pico</p>
          <p className="text-2xl font-bold text-[#1e1b4b]">
            {fmt24(fueraHours[values.indexOf(maxV)])}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-[#3730a3] mb-1">Desglose hora a hora (cierre → apertura)</p>
        <p className="text-[11px] text-[#6d7ab5] mb-3">Horario laboral: 09:00 – 20:00 · Fuera: 20:00 – 09:00</p>
        <div className="space-y-1.5">
          {fueraHours.map((h, i) => {
            const v = values[i]
            const isPeak = v === maxV
            return (
              <div key={h} className="flex items-center gap-2.5">
                <span className={`text-[11px] font-mono w-12 flex-shrink-0 ${isPeak ? 'text-[#7c3aed] font-bold' : 'text-[#6d7ab5]'}`}>
                  {fmt24(h)}
                </span>
                <div className="flex-1">
                  <div className="h-5 rounded bg-[#f1f0f9] overflow-hidden relative">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${pct(v, maxV)}%`,
                        background: isPeak
                          ? 'linear-gradient(90deg, #7c3aed, #c026a8)'
                          : h >= 0 && h < 6 ? '#ddd6fe' : '#e0d7f8',
                      }}
                    />
                    {v > 0 && (
                      <span className="absolute left-2 top-0 bottom-0 flex items-center text-[10px] font-semibold text-[#1e1b4b] mix-blend-darken">
                        {v}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-[#6d7ab5] w-8 text-right flex-shrink-0">{pct(v, totalFuera)}%</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-violet-50/70 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-[#3730a3] mb-1">Recomendación operativa</p>
        <p className="text-xs text-[#6d7ab5]">
          La mayor actividad fuera de horario se concentra entre las <span className="font-semibold text-[#1e1b4b]">20:00 y las 22:00</span>. Considera ampliar la cobertura del equipo hasta las 21:00 para capturar más conversiones en este tramo.
        </p>
      </div>
    </div>
  )
}

function PanelDuracion({ ds }: { ds: Dataset }) {
  const total = ds.durationDist.reduce((a, d) => a + d.count, 0)
  const maxV  = Math.max(...ds.durationDist.map(d => d.count))
  const avgSeg = ds.durationDist === AQUAJETS_DURATION_DIST ? '2m 22s' : '3m 10s'
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#f9f8ff] rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Total analizadas</p>
          <p className="text-2xl font-bold text-[#1e1b4b]">{total.toLocaleString('es-ES')}</p>
        </div>
        <div className="bg-[#f9f8ff] rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Duración media</p>
          <p className="text-2xl font-bold text-[#6366f1]">{avgSeg}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-[#3730a3] mb-3">Distribución por rango de duración</p>
        <div className="space-y-3">
          {ds.durationDist.map(d => (
            <div key={d.range}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#1e1b4b]">{d.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#1e1b4b]">{d.count.toLocaleString('es-ES')}</span>
                  <span className="text-[10px] text-[#6d7ab5] w-8 text-right">{pct(d.count, total)}%</span>
                </div>
              </div>
              <Bar pct={pct(d.count, maxV)} color={d.color} />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-indigo-50/60 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-[#3730a3] mb-1">Insight</p>
        <p className="text-xs text-[#6d7ab5]">
          El <span className="font-semibold text-[#1e1b4b]">{pct(ds.durationDist[1].count + ds.durationDist[2].count, total)}%</span> de las conversaciones duran entre 1 y 5 minutos, lo que indica buena eficiencia. Las conversaciones de más de 10 min ({ds.durationDist[4].count.toLocaleString('es-ES')}) suelen corresponder a consultas de presupuesto.
        </p>
      </div>
    </div>
  )
}

function PanelRespuesta({ ds }: { ds: Dataset }) {
  const total = ds.responseDist.reduce((a, d) => a + d.count, 0)
  const maxV  = Math.max(...ds.responseDist.map(d => d.count))
  const avgMs = ds.responseDist === AQUAJETS_RESPONSE_DIST ? '1.8s' : '2.1s'
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#f0f9ff] rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Tiempo medio</p>
          <p className="text-2xl font-bold text-[#0ea5e9]">{avgMs}</p>
        </div>
        <div className="bg-[#f0f9ff] rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">{'< 4 segundos'}</p>
          <p className="text-2xl font-bold text-emerald-500">
            {pct(ds.responseDist[0].count + ds.responseDist[1].count + ds.responseDist[2].count, total)}%
          </p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-[#3730a3] mb-3">Distribución por velocidad de respuesta</p>
        <div className="space-y-3">
          {ds.responseDist.map(d => (
            <div key={d.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#1e1b4b]">{d.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#1e1b4b]">{d.count.toLocaleString('es-ES')}</span>
                  <span className="text-[10px] text-[#6d7ab5] w-8 text-right">{pct(d.count, total)}%</span>
                </div>
              </div>
              <Bar pct={pct(d.count, maxV)} color={d.color} />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-sky-50/60 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-[#0ea5e9] mb-1">Benchmark</p>
        <p className="text-xs text-[#6d7ab5]">
          Los chatbots del sector náutico tienen un tiempo medio de 3.2s. Tu agente responde en <span className="font-semibold text-emerald-600">{avgMs}</span>, un <span className="font-semibold text-emerald-600">44% más rápido</span> que la media del sector.
        </p>
      </div>
    </div>
  )
}

function PanelResolucion({ data, ds }: { data: ReturnType<typeof useMetrics>; ds: Dataset }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Resueltas</p>
          <p className="text-2xl font-bold text-emerald-500">{data.resueltas.toLocaleString('es-ES')}</p>
          <p className="text-[10px] text-[#6d7ab5] mt-0.5">{Math.round(data.resolution_rate * 100)}% del total</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Derivadas</p>
          <p className="text-2xl font-bold text-amber-500">{data.escaladas.toLocaleString('es-ES')}</p>
          <p className="text-[10px] text-[#6d7ab5] mt-0.5">{Math.round(data.escalation_rate * 100)}% del total</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-[#3730a3] mb-3">Temas que más se derivan al equipo</p>
        <div className="space-y-3">
          {ds.escalatedTopics.map(t => (
            <div key={t.topic}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#1e1b4b]">{t.topic}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-amber-600 font-semibold">{t.escalated} escal.</span>
                  <span className="text-[10px] text-emerald-600">{t.resolved} res.</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[#f1f0f9] overflow-hidden flex">
                <div className="h-full bg-amber-400 rounded-l-full" style={{ width: `${t.pct}%` }} />
                <div className="h-full bg-emerald-400 rounded-r-full flex-1" />
              </div>
              <p className="text-[10px] text-[#6d7ab5] mt-0.5">{t.pct}% de este tema se deriva al equipo</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-amber-50/60 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-amber-700 mb-1">Acción recomendada</p>
        <p className="text-xs text-[#6d7ab5]">
          Los temas de <span className="font-semibold text-[#1e1b4b]">precios/presupuestos</span> y <span className="font-semibold text-[#1e1b4b]">seguros</span> concentran el mayor porcentaje de escalamientos. Añadir respuestas más detalladas a estos temas puede reducir las derivaciones un 30–40%.
        </p>
      </div>
    </div>
  )
}

function PanelAlertas({ data, ds }: { data: ReturnType<typeof useMetrics>; ds: Dataset }) {
  const isAQ = ds.escalatedTopics === AQUAJETS_ESCALATED_TOPICS
  const alertTypes = isAQ ? [
    { label: 'Consultas de precio especial sin responder', count: Math.round(data.alertas * 0.34), color: '#f59e0b' },
    { label: 'Solicitud de cancelación o reembolso', count: Math.round(data.alertas * 0.25), color: '#ef4444' },
    { label: 'Más de 5 mensajes sin resolución', count: Math.round(data.alertas * 0.20), color: '#c026a8' },
    { label: 'Solicitud explícita de agente humano', count: Math.round(data.alertas * 0.13), color: '#7c3aed' },
    { label: 'Queja o incidencia durante el alquiler', count: Math.round(data.alertas * 0.08), color: '#6366f1' },
  ] : [
    { label: 'Consultas de precio sin responder', count: Math.round(data.alertas * 0.32), color: '#f59e0b' },
    { label: 'Palabras clave de urgencia detectadas', count: Math.round(data.alertas * 0.24), color: '#ef4444' },
    { label: 'Más de 5 mensajes sin resolución', count: Math.round(data.alertas * 0.21), color: '#c026a8' },
    { label: 'Solicitud explícita de agente humano', count: Math.round(data.alertas * 0.15), color: '#7c3aed' },
    { label: 'Queja o insatisfacción detectada', count: Math.round(data.alertas * 0.08), color: '#6366f1' },
  ]
  const maxV = Math.max(...alertTypes.map(a => a.count))
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Total alertas</p>
          <p className="text-2xl font-bold text-amber-500">{data.alertas}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Tasa de alerta</p>
          <p className="text-2xl font-bold text-[#1e1b4b]">{Math.round(data.escalation_rate * 100)}%</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-[#3730a3] mb-3">Motivos de alerta</p>
        <div className="space-y-3">
          {alertTypes.map(a => (
            <div key={a.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#1e1b4b]">{a.label}</span>
                <span className="text-xs font-semibold ml-2 flex-shrink-0" style={{ color: a.color }}>{a.count}</span>
              </div>
              <Bar pct={pct(a.count, maxV)} color={a.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PanelHorario({ ds }: { ds: Dataset }) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const maxV = Math.max(...hours.map(h => ds.hourly[h]))
  const total = hours.reduce((a, h) => a + ds.hourly[h], 0)
  const isLaboral = (h: number) => h >= 9 && h < 20

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-amber-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-[#6B6B80] uppercase tracking-wider mb-0.5">Mañana (6–12)</p>
          <p className="text-lg font-bold text-amber-500">
            {[6,7,8,9,10,11].reduce((a,h)=>a+ds.hourly[h],0).toLocaleString('es-ES')}
          </p>
        </div>
        <div className="bg-pink-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-[#6B6B80] uppercase tracking-wider mb-0.5">Tarde (12–20)</p>
          <p className="text-lg font-bold text-[#c026a8]">
            {[12,13,14,15,16,17,18,19].reduce((a,h)=>a+ds.hourly[h],0).toLocaleString('es-ES')}
          </p>
        </div>
        <div className="bg-violet-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-[#6B6B80] uppercase tracking-wider mb-0.5">Noche (20–6)</p>
          <p className="text-lg font-bold text-[#7c3aed]">
            {[20,21,22,23,0,1,2,3,4,5].reduce((a,h)=>a+ds.hourly[h],0).toLocaleString('es-ES')}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-[#3730a3] mb-3">Distribución hora a hora (0–23h)</p>
        <div className="space-y-1">
          {hours.map(h => {
            const v = ds.hourly[h]
            const laboral = isLaboral(h)
            const isPeak = v === maxV
            return (
              <div key={h} className="flex items-center gap-2">
                <span className={`text-[10px] font-mono w-10 flex-shrink-0 ${isPeak ? 'text-[#c026a8] font-bold' : 'text-[#6d7ab5]'}`}>
                  {fmt24(h)}
                </span>
                <div className="flex-1 h-4 rounded bg-[#f1f0f9] overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${pct(v, maxV)}%`,
                      background: isPeak
                        ? 'linear-gradient(90deg, #c026a8, #7c3aed)'
                        : laboral ? '#e0d7f8' : '#f0ecff',
                    }}
                  />
                  {v > 0 && (
                    <span className="absolute left-1.5 top-0 bottom-0 flex items-center text-[9px] font-semibold text-[#1e1b4b]">
                      {v}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-[#6d7ab5] w-5 text-right flex-shrink-0">{pct(v, total)}%</span>
                {!laboral && v > 5 && (
                  <Moon size={9} className="text-[#7c3aed] flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-[#e0d7f8]" /><span className="text-[10px] text-[#6d7ab5]">Horario laboral</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-[#f0ecff]" /><span className="text-[10px] text-[#6d7ab5]">Fuera de horario</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg,#c026a8,#7c3aed)' }} /><span className="text-[10px] text-[#6d7ab5]">Pico máximo</span></div>
        </div>
      </div>
    </div>
  )
}

function PanelTemas({ ds }: { ds: Dataset }) {
  const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
  const colors = ['#c026a8', '#7c3aed', '#6366f1', '#0ea5e9', '#10b981']
  const topics = Object.entries(ds.topicTrend)
  return (
    <div className="space-y-6">
      {topics.map(([topic, trend], ti) => {
        const maxV = Math.max(...trend)
        const delta = trend[trend.length - 1] - trend[0]
        return (
          <div key={topic}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1e1b4b]">{topic}</span>
              <span className={`text-[11px] font-semibold ${delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-red-400' : 'text-[#6d7ab5]'}`}>
                {delta > 0 ? `+${delta}` : delta} vs sem 1
              </span>
            </div>
            <div className="flex gap-1.5 items-end h-12">
              {trend.map((v, wi) => (
                <div key={wi} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${Math.max(4, pct(v, maxV) * 0.4)}px`,
                      background: wi === trend.length - 1 ? colors[ti] : `${colors[ti]}55`,
                    }}
                  />
                  <span className="text-[9px] text-[#6d7ab5]">{weeks[wi]}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-1">
              {trend.map((v, wi) => (
                <span key={wi} className="flex-1 text-center text-[10px] font-semibold text-[#1e1b4b]">{v}</span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Hook de agregación ───────────────────────────────────────────────────────
function useMetrics(period: Period, ds: Dataset) {
  const weeks = useMemo(() => {
    if (period === 'all') return ds.botMetrics
    const n = period === '7d' ? 1 : period === '14d' ? 2 : period === '1m' ? 4 : period === '2m' ? 8 : 13
    return ds.botMetrics.slice(-n)
  }, [period, ds])

  return useMemo(() => {
    const conversations   = weeks.reduce((a, w) => a + w.conversations, 0)
    const fuera_horario   = weeks.reduce((a, w) => a + w.atendidas_fuera_horario, 0)
    const avg_dur_seg     = Math.round(weeks.reduce((a, w) => a + w.duracion_conversacion_seg, 0) / weeks.length)
    const avg_resp_ms     = Math.round(weeks.reduce((a, w) => a + w.avg_response_ms, 0) / weeks.length)
    const resolution_rate = weeks.reduce((a, w) => a + w.resolution_rate, 0) / weeks.length
    const escalation_rate = weeks.reduce((a, w) => a + w.escalation_rate, 0) / weeks.length

    const conv_manana    = weeks.reduce((a, w) => a + w.conv_manana, 0)
    const conv_tarde     = weeks.reduce((a, w) => a + w.conv_tarde, 0)
    const conv_noche     = weeks.reduce((a, w) => a + w.conv_noche, 0)
    const conv_madrugada = weeks.reduce((a, w) => a + w.conv_madrugada, 0)
    const horario_laboral = conversations - fuera_horario
    const alertas        = Math.round(conversations * escalation_rate)
    const resueltas      = Math.round(conversations * resolution_rate)
    const escaladas      = alertas

    const topicMap: Record<string, number> = {}
    for (const w of weeks)
      for (const t of w.top_topics)
        topicMap[t.topic] = (topicMap[t.topic] ?? 0) + t.count
    const top_topics = Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))

    return {
      conversations, fuera_horario, avg_dur_seg, avg_resp_ms,
      resolution_rate, escalation_rate,
      conv_manana, conv_tarde, conv_noche, conv_madrugada,
      horario_laboral, alertas, resueltas, escaladas, top_topics,
    }
  }, [weeks])
}

// ─── Panel labels ─────────────────────────────────────────────────────────────
const PANEL_LABELS: Record<Exclude<PanelType, null>, string> = {
  conversaciones: 'Conversaciones — detalle',
  fuera_horario:  'Fuera de horario — hora a hora',
  duracion:       'Duración media — distribución',
  respuesta:      'Tiempo de respuesta — distribución',
  resolucion:     'Resueltas vs Escaladas — detalle',
  alertas:        'Alertas generadas — motivos',
  horario:        'Actividad horaria — mapa completo',
  temas:          'Top temas — tendencia semanal',
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function ClientMetricsPage() {
  const [period, setPeriod]     = useState<Period>('1m')
  const [panel, setPanel]       = useState<PanelType>(null)
  const { user } = useAuthStore()
  const ds   = getDataset(user?.clientId)
  const data = useMetrics(period, ds)

  const openPanel = (p: PanelType) => setPanel(p)
  const closePanel = () => setPanel(null)

  const PERIODS: { label: string; value: Period }[] = [
    { label: '7 días',      value: '7d'  },
    { label: '14 días',     value: '14d' },
    { label: 'Último mes',  value: '1m'  },
    { label: '2 meses',     value: '2m'  },
    { label: '3 meses',     value: '3m'  },
    { label: 'Histórico',   value: 'all' },
  ]

  const hasAlert = data.escalation_rate > 0.09

  return (
    <div className="flex-1 overflow-hidden flex relative">
      {/* ── Main content ────────────────────────────────────────────── */}
      <div className={`flex-1 overflow-y-auto px-4 py-6 md:px-8 transition-all duration-300 ${panel ? 'md:mr-[440px]' : ''}`}>
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Header + período */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#1e1b4b] font-syne">Métricas del Agente</h1>
              <p className="text-sm text-[#6d7ab5] mt-0.5">Rendimiento de tu agente IA</p>
            </div>
            <div className="flex gap-1 bg-white border border-[#E8E6F0] rounded-xl p-1 self-start sm:self-auto">
              {PERIODS.map(p => (
                <button key={p.value} onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p.value ? 'bg-[#c026a8] text-white shadow-sm' : 'text-[#6d7ab5] hover:text-[#1e1b4b]'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Estado vacío para clientes sin datos reales ─────────── */}
          {!ds.hasData && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#f1f0f9] flex items-center justify-center mb-4">
                <BarChart2 size={28} className="text-[#c026a8]" />
              </div>
              <h2 className="text-base font-semibold text-[#1e1b4b] mb-2">Métricas en camino</h2>
              <p className="text-sm text-[#6d7ab5] max-w-sm">
                Las métricas de tu agente estarán disponibles una vez entre en producción. Vuelve aquí cuando tu empleado digital esté activo.
              </p>
            </div>
          )}

          {/* 4 hero numbers + all metric sections (only when client has real data) */}
          {ds.hasData && (<>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Conversaciones totales" value={data.conversations.toLocaleString('es-ES')} sub={`en ${PERIOD_LABELS[period]}`} onClick={() => openPanel('conversaciones')} />
            <StatCard label="Fuera de horario" value={data.fuera_horario.toLocaleString('es-ES')} sub={`${pct(data.fuera_horario, data.conversations)}% del total`} valueColor="#7c3aed" onClick={() => openPanel('fuera_horario')} />
            <StatCard label="Duración media" value={fmtDur(data.avg_dur_seg)} sub="por conversación" onClick={() => openPanel('duracion')} />
            <StatCard label="Tiempo de respuesta" value={fmtTime(data.avg_resp_ms)} sub="por mensaje" valueColor="#0ea5e9" onClick={() => openPanel('respuesta')} />
          </div>

          {/* Resueltas vs Escaladas + Alertas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SectionCard title="Resolución de conversaciones" onClick={() => openPanel('resolucion')} className="md:col-span-2">
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
              <div className="h-3 rounded-full overflow-hidden flex gap-px">
                <div className="h-full rounded-l-full" style={{ width: `${Math.round(data.resolution_rate * 100)}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                <div className="h-full rounded-r-full flex-1" style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-[#6d7ab5]">Autónomas</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[10px] text-[#6d7ab5]">Derivadas</span></div>
              </div>
            </SectionCard>

            <SectionCard title="Alertas generadas" onClick={() => openPanel('alertas')}>
              <p className="text-3xl font-bold text-[#1e1b4b] font-syne">{data.alertas}</p>
              <p className="text-xs text-[#6d7ab5] mt-1">conversaciones que requirieron intervención</p>
              <div className="mt-4 pt-3 border-t border-white/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#6d7ab5]">Tasa de alerta</span>
                  <span className="text-xs font-semibold text-amber-500">{Math.round(data.escalation_rate * 100)}%</span>
                </div>
                <Bar pct={Math.round(data.escalation_rate * 100)} color="#f59e0b" />
                <p className="text-[10px] text-[#6d7ab5]">{data.escalation_rate <= 0.08 ? '✓ Dentro del rango óptimo (< 8%)' : '⚠ Por encima del óptimo (> 8%)'}</p>
              </div>
            </SectionCard>
          </div>

          {/* Horario + Temas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionCard title="Horario laboral vs fuera de horario" onClick={() => openPanel('horario')}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-indigo-50/60 rounded-xl p-3 text-center">
                  <Sun size={16} className="text-amber-500 mx-auto mb-1.5" />
                  <p className="text-xl font-bold text-[#1e1b4b]">{data.horario_laboral.toLocaleString('es-ES')}</p>
                  <p className="text-[10px] text-[#6d7ab5] mt-0.5">Horario laboral</p>
                  <p className="text-[10px] font-semibold text-[#c026a8]">{pct(data.horario_laboral, data.conversations)}%</p>
                </div>
                <div className="bg-violet-50/60 rounded-xl p-3 text-center">
                  <Moon size={16} className="text-violet-500 mx-auto mb-1.5" />
                  <p className="text-xl font-bold text-[#1e1b4b]">{data.fuera_horario.toLocaleString('es-ES')}</p>
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
                  const maxFranja = Math.max(data.conv_manana, data.conv_tarde, data.conv_noche, data.conv_madrugada)
                  return (
                    <div key={row.label} className="flex items-center gap-2">
                      <span style={{ color: row.color }} className="flex-shrink-0">{row.icon}</span>
                      <span className="text-[11px] text-[#6d7ab5] w-[68px] flex-shrink-0">{row.label} <span className="text-[9px] opacity-60">{row.sub}</span></span>
                      <div className="flex-1"><Bar pct={pct(row.value, maxFranja)} color={row.color} /></div>
                      <span className="text-[11px] font-semibold text-[#1e1b4b] w-10 text-right">{row.value.toLocaleString('es-ES')}</span>
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            <SectionCard title="Top 5 temas consultados" onClick={() => openPanel('temas')}>
              <div className="space-y-3">
                {data.top_topics.map((t, i) => {
                  const maxCount = data.top_topics[0].count
                  return (
                    <div key={t.topic}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#f1f0f9] flex items-center justify-center text-[9px] font-bold text-[#6366f1] flex-shrink-0">{i + 1}</span>
                          <span className="text-xs text-[#1e1b4b]">{t.topic}</span>
                        </div>
                        <span className="text-xs font-semibold text-[#1e1b4b] ml-2 flex-shrink-0">{t.count.toLocaleString('es-ES')}</span>
                      </div>
                      <Bar pct={pct(t.count, maxCount)} color={i === 0 ? '#c026a8' : '#e0d7f8'} />
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-white/40">
                <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-2">Retención autónoma</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1"><Bar pct={Math.round(data.resolution_rate * 100)} color="#10b981" /></div>
                  <span className="text-sm font-bold text-emerald-500 flex-shrink-0">{Math.round(data.resolution_rate * 100)}%</span>
                </div>
                <p className="text-[10px] text-[#6d7ab5] mt-1">conversaciones resueltas sin intervención humana</p>
              </div>
            </SectionCard>
          </div>

          {/* ── AquaJets: Idiomas + Impacto económico ─────────────────── */}
          {ds.languages && ds.lifetime && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Distribución por idioma */}
              <NodoCard padding="md">
                <p className="text-xs font-semibold text-[#3730a3] mb-4">Conversaciones por idioma</p>
                <div className="space-y-3">
                  {ds.languages.map(lang => {
                    const total = ds.lifetime!.total_conversations
                    return (
                      <div key={lang.idioma}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">{lang.flag}</span>
                            <span className="text-xs text-[#1e1b4b] font-medium">{lang.idioma}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#1e1b4b]">{lang.count.toLocaleString('es-ES')}</span>
                            <span className="text-[10px] text-[#6d7ab5] w-8 text-right">{pct(lang.count, total)}%</span>
                          </div>
                        </div>
                        <Bar pct={pct(lang.count, ds.languages![0].count)} color={lang.color} />
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-[#f1f0f9]">
                  <p className="text-[10px] text-[#6d7ab5]">
                    Tu agente atiende en <span className="font-semibold text-[#1e1b4b]">5 idiomas</span>. El inglés y el italiano representan el <span className="font-semibold text-[#c026a8]">{pct(ds.languages[1].count + ds.languages[2].count, ds.lifetime.total_conversations)}%</span> del tráfico internacional.
                  </p>
                </div>
              </NodoCard>

              {/* Impacto económico */}
              <NodoCard padding="md">
                <p className="text-xs font-semibold text-[#3730a3] mb-4">Impacto económico generado</p>
                <div className="space-y-3">
                  <div className="bg-emerald-50/70 rounded-xl p-4">
                    <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Agendas confirmadas</p>
                    <p className="text-3xl font-bold text-emerald-600 font-syne">{ds.lifetime.agendas_confirmadas.toLocaleString('es-ES')}</p>
                    <p className="text-[11px] text-[#6d7ab5] mt-1">reservas gestionadas de forma autónoma</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#f9f0ff] to-[#eef2ff] rounded-xl p-4">
                    <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Facturación generada</p>
                    <p className="text-3xl font-bold text-[#1e1b4b] font-syne">
                      €{(ds.lifetime.revenue_eur / 1000).toFixed(0)}k
                    </p>
                    <p className="text-[11px] text-[#6d7ab5] mt-1">aprox. atribuibles al agente IA</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#f1f0f9]">
                  <p className="text-[10px] text-[#6d7ab5]">
                    Cada agenda confirmada representa un ticket medio de <span className="font-semibold text-[#1e1b4b]">€{Math.round(ds.lifetime.revenue_eur / ds.lifetime.agendas_confirmadas).toLocaleString('es-ES')}</span>.
                  </p>
                </div>
              </NodoCard>
            </div>
          )}

          {/* Smart alert */}
          {hasAlert ? (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Escalamientos elevados este período</p>
                <p className="text-xs text-amber-700 mt-0.5">El {Math.round(data.escalation_rate * 100)}% de las conversaciones requirieron intervención. Revisa <span className="font-semibold">Mi agente</span> para añadir respuestas a los temas que más se escalan.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/60">
              <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Agente funcionando en óptimas condiciones</p>
                <p className="text-xs text-emerald-700 mt-0.5">Resolución autónoma del {Math.round(data.resolution_rate * 100)}% con un tiempo de respuesta de {fmtTime(data.avg_resp_ms)}. Sin alertas activas.</p>
              </div>
            </div>
          )}
          </>)}

        </div>
      </div>

      {/* ── Detail panel (slide-in) ──────────────────────────────────── */}
      {panel && (
        <>
          {/* Backdrop mobile */}
          <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={closePanel} />
          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[440px] flex flex-col bg-white/95 backdrop-blur-xl border-l border-[#E8E6F0] shadow-2xl overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6F0] flex-shrink-0">
              <p className="text-sm font-semibold text-[#1e1b4b]">{PANEL_LABELS[panel]}</p>
              <button onClick={closePanel} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6d7ab5] hover:text-[#1e1b4b] hover:bg-[#f1f0f9] transition-colors">
                <X size={16} />
              </button>
            </div>
            {/* Panel content */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {panel === 'conversaciones' && <PanelConversaciones data={data} ds={ds} period={period} />}
              {panel === 'fuera_horario'  && <PanelFueraHorario data={data} ds={ds} />}
              {panel === 'duracion'       && <PanelDuracion ds={ds} />}
              {panel === 'respuesta'      && <PanelRespuesta ds={ds} />}
              {panel === 'resolucion'     && <PanelResolucion data={data} ds={ds} />}
              {panel === 'alertas'        && <PanelAlertas data={data} ds={ds} />}
              {panel === 'horario'        && <PanelHorario ds={ds} />}
              {panel === 'temas'          && <PanelTemas ds={ds} />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
