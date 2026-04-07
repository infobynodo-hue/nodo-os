import { useEffect, useState } from 'react'
import {
  FlaskConical, CheckCircle, AlertTriangle, XCircle,
  ChevronRight, Bot, User, Loader2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { NodoCard } from '../../components/ui/NodoCard'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConvTurn { role: 'client' | 'bot'; content: string }

interface Conversation {
  id: string
  personaId: string
  personaName: string
  turns: ConvTurn[]
  status: string
}

interface Report {
  overall_score: number
  summary: string
  achieved: string[]
  failed: string[]
  warnings: string[]
  recommendations: string[]
  persona_insights: { persona: string; verdict: 'ok' | 'warning' | 'fail'; note: string }[]
}

interface Session {
  id: string
  name: string
  objective: string
  num_turns: number
  status: string
  conversations: Conversation[]
  report: Report | null
  created_at: string
  completed_at: string | null
}

// ─── Score badge ─────────────────────────────────────────────────────────────
function ScoreBadge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'Excelente' : score >= 60 ? 'Aceptable' : 'Deficiente'
  const outer = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-14 h-14 text-lg'
  const inner = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-11 h-11 text-sm'
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${outer} rounded-full flex items-center justify-center font-bold text-white shadow-lg`}
        style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #e5e7eb ${score * 3.6}deg)` }}
      >
        <div className={`${inner} rounded-full bg-white flex items-center justify-center font-bold`} style={{ color }}>
          {score}
        </div>
      </div>
      {size === 'lg' && <p className="text-xs font-semibold" style={{ color }}>{label}</p>}
    </div>
  )
}

// ─── Session detail view ──────────────────────────────────────────────────────
function SessionDetail({ session, onBack }: { session: Session; onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    session.conversations[0]?.id ?? null
  )
  const selectedConv = session.conversations.find(c => c.id === selectedId)
  const report = session.report

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-[#E8E6F0] flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#6d7ab5] hover:text-[#1e1b4b] transition-colors"
        >
          <ChevronRight size={13} className="rotate-180" /> Volver
        </button>
        <div className="h-4 w-px bg-[#E8E6F0]" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-[#1e1b4b] truncate">{session.name}</h2>
          <p className="text-[10px] text-[#6d7ab5]">
            {new Date(session.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}{session.conversations.filter(c => c.status === 'done').length} conversaciones
          </p>
        </div>
        {report && <ScoreBadge score={report.overall_score} />}
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
        {/* Report summary */}
        {report && (
          <>
            <NodoCard padding="md">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreBadge score={report.overall_score} size="lg" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#3730a3] mb-2">Resumen ejecutivo</p>
                  <p className="text-sm text-[#1e1b4b] leading-relaxed">{report.summary}</p>
                </div>
              </div>
            </NodoCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NodoCard padding="md">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">Cumplió ({report.achieved.length})</p>
                </div>
                <ul className="space-y-2">
                  {report.achieved.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#1e1b4b]">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>{a}
                    </li>
                  ))}
                  {report.achieved.length === 0 && <p className="text-xs text-[#6d7ab5]">Sin objetivos cumplidos.</p>}
                </ul>
              </NodoCard>

              <NodoCard padding="md">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle size={14} className="text-red-400" />
                  <p className="text-xs font-semibold text-red-600">Falló ({report.failed.length})</p>
                </div>
                <ul className="space-y-2">
                  {report.failed.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#1e1b4b]">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{f}
                    </li>
                  ))}
                  {report.failed.length === 0 && <p className="text-xs text-[#6d7ab5]">Sin fallos detectados.</p>}
                </ul>
              </NodoCard>

              <NodoCard padding="md">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <p className="text-xs font-semibold text-amber-700">Advertencias ({report.warnings.length})</p>
                </div>
                <ul className="space-y-2">
                  {report.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#1e1b4b]">
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>{w}
                    </li>
                  ))}
                  {report.warnings.length === 0 && <p className="text-xs text-[#6d7ab5]">Sin advertencias.</p>}
                </ul>
              </NodoCard>
            </div>

            {report.recommendations.length > 0 && (
              <NodoCard padding="md">
                <p className="text-xs font-semibold text-[#3730a3] mb-3">Recomendaciones</p>
                <div className="space-y-2.5">
                  {report.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#c026a8]/10 flex items-center justify-center text-[10px] font-bold text-[#c026a8] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-[#1e1b4b]">{r}</p>
                    </div>
                  ))}
                </div>
              </NodoCard>
            )}
          </>
        )}

        {/* Conversations */}
        <NodoCard padding="none">
          <div className="flex h-[420px] overflow-hidden rounded-2xl">
            {/* Left list */}
            <div className="w-[220px] flex-shrink-0 border-r border-[#E8E6F0] overflow-y-auto">
              {session.conversations.map(conv => {
                const isSelected = conv.id === selectedId
                const lastMsg = conv.turns[conv.turns.length - 1]
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full flex items-start gap-2.5 px-3 py-3 text-left border-b border-[#f1f0f9] transition-colors ${isSelected ? 'bg-[#c026a8]/6' : 'hover:bg-[#f9f8ff]'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#f1f0f9] flex items-center justify-center flex-shrink-0 text-sm mt-0.5">
                      👤
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#1e1b4b] truncate">{conv.personaName}</p>
                      {lastMsg && (
                        <p className="text-[10px] text-[#6d7ab5] truncate mt-0.5">{lastMsg.content}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Right chat */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedConv ? (
                <>
                  <div className="px-4 py-3 border-b border-[#E8E6F0] flex-shrink-0">
                    <p className="text-sm font-semibold text-[#1e1b4b]">{selectedConv.personaName}</p>
                    <p className="text-[10px] text-[#6d7ab5]">{selectedConv.turns.length} mensajes</p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {selectedConv.turns.map((turn, i) => (
                      <div key={i} className={`flex items-start gap-2 ${turn.role === 'bot' ? 'flex-row-reverse' : ''}`}>
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: turn.role === 'bot' ? 'linear-gradient(135deg, #c026a8, #7c3aed)' : '#f1f0f9' }}
                        >
                          {turn.role === 'bot'
                            ? <Bot size={11} className="text-white" />
                            : <User size={11} className="text-[#6d7ab5]" />
                          }
                        </div>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                          turn.role === 'bot'
                            ? 'rounded-tr-sm bg-gradient-to-br from-[#c026a8] to-[#7c3aed] text-white'
                            : 'rounded-tl-sm bg-white border border-[#E8E6F0] text-[#1e1b4b]'
                        }`}>
                          {turn.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#6d7ab5] text-sm">
                  Selecciona una conversación
                </div>
              )}
            </div>
          </div>
        </NodoCard>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function ClientTestsPage() {
  const { user } = useAuthStore()
  const [sessions, setSessions]     = useState<Session[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<Session | null>(null)

  useEffect(() => {
    if (!user?.clientId) return
    supabase
      .from('bot_test_sessions')
      .select('*')
      .eq('client_id', user.clientId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .then(({ data }) => {
        setSessions((data ?? []) as Session[])
        setLoading(false)
      })
  }, [user?.clientId])

  if (selected) {
    return <SessionDetail session={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#1e1b4b] font-syne">Pruebas del agente</h1>
          <p className="text-sm text-[#6d7ab5] mt-0.5">Resultados de simulaciones realizadas sobre tu bot</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-[#6d7ab5]">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Cargando pruebas...</span>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#f1f0f9] flex items-center justify-center">
              <FlaskConical size={22} className="text-[#6d7ab5]" />
            </div>
            <p className="text-sm font-semibold text-[#1e1b4b]">Aún no hay pruebas completadas</p>
            <p className="text-xs text-[#6d7ab5] max-w-xs">
              Cuando el equipo de Nodo realice simulaciones sobre tu agente, los resultados aparecerán aquí.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map(s => {
            const score = s.report?.overall_score
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full text-left"
              >
                <NodoCard padding="md" className="hover:border-[#c026a8]/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    {score != null && <ScoreBadge score={score} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1e1b4b] truncate">{s.name}</p>
                      <p className="text-[11px] text-[#6d7ab5] mt-0.5 line-clamp-2">{s.objective}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-[#6d7ab5]">
                          {new Date(s.completed_at ?? s.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-[#6d7ab5]">
                          {s.conversations.filter(c => c.status === 'done').length} conversaciones
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#6d7ab5] group-hover:text-[#c026a8] transition-colors flex-shrink-0" />
                  </div>
                </NodoCard>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
