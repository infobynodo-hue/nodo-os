import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { NodoCard } from '../../components/ui/NodoCard'
import { NodoBadge } from '../../components/ui/NodoBadge'

const PLUG_LABELS: Record<string, string> = {
  report_error:    '🐛 Error del agente',
  request_change:  '✏️ Solicitud de cambio',
  new_info:        '➕ Nueva información',
  schedule_meeting:'📅 Reunión',
  onboarding:      '🚀 Onboarding',
  general_review:  '📊 Revisión mensual',
}

const TYPE_COLORS: Record<string, string> = {
  report_error:    'bg-red-100 text-red-700 border-red-200',
  request_change:  'bg-amber-100 text-amber-700 border-amber-200',
  new_info:        'bg-blue-100 text-blue-700 border-blue-200',
  schedule_meeting:'bg-purple-100 text-purple-700 border-purple-200',
  onboarding:      'bg-green-100 text-green-700 border-green-200',
  general_review:  'bg-slate-100 text-slate-700 border-slate-200',
}

interface Request {
  id: string
  plug_id: string
  request_type: string
  content: string
  status: 'pending' | 'in_progress' | 'resolved'
  admin_response?: string
  created_at: string
  project_id: string
  client_name?: string
  client_id?: string
}

const FILTERS = ['all', 'pending', 'in_progress', 'resolved'] as const
type Filter = typeof FILTERS[number]
const FILTER_LABELS: Record<Filter, string> = {
  all: 'Todas', pending: 'Pendientes', in_progress: 'En proceso', resolved: 'Resueltas',
}

export function SolicitudesPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')

  useEffect(() => { loadRequests() }, [])

  async function loadRequests() {
    setLoading(true)
    const { data } = await supabase
      .from('plug_requests')
      .select('*, projects(client_id, clients(id, business_name))')
      .order('created_at', { ascending: false })

    const mapped: Request[] = (data || []).map((r: any) => ({
      id: r.id,
      plug_id: r.plug_id,
      request_type: r.request_type,
      content: r.content,
      status: r.status,
      admin_response: r.admin_response,
      created_at: r.created_at,
      project_id: r.project_id,
      client_name: r.projects?.clients?.business_name,
      client_id: r.projects?.clients?.id,
    }))
    setRequests(mapped)
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'pending' | 'in_progress' | 'resolved') {
    await supabase.from('plug_requests').update({
      status,
      resolved_by: status === 'resolved' ? user?.id : null,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  async function sendResponse(id: string) {
    if (!responseText.trim()) return
    await supabase.from('plug_requests').update({
      admin_response: responseText.trim(),
      status: 'resolved',
      resolved_by: user?.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, admin_response: responseText.trim(), status: 'resolved' } : r))
    setRespondingTo(null)
    setResponseText('')
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pending = requests.filter(r => r.status === 'pending').length
  const inProgress = requests.filter(r => r.status === 'in_progress').length

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1F2E] font-syne">Solicitudes de clientes</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">
            Errores reportados, cambios, nueva info y reuniones solicitadas
          </p>
        </div>
        <div className="flex gap-3">
          {pending > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-red-700">{pending} pendiente{pending !== 1 ? 's' : ''}</span>
            </div>
          )}
          {inProgress > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <span className="text-xs font-semibold text-amber-700">{inProgress} en proceso</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-[#1A1F2E] text-[#C8F135]'
                : 'bg-[#F4F6F9] text-[#6B7280] hover:bg-[#E9EBF0]'
            }`}
          >
            {FILTER_LABELS[f]}
            {f !== 'all' && (
              <span className="ml-1.5 opacity-60">
                {requests.filter(r => r.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#C8F135] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <NodoCard className="text-center py-14">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-sm font-semibold text-[#1A1F2E]">Sin solicitudes {filter !== 'all' ? FILTER_LABELS[filter].toLowerCase() : ''}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Todo al día</p>
        </NodoCard>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <NodoCard key={req.id} padding="md">
              <div className="flex items-start gap-3">
                {/* Type badge */}
                <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg border ${TYPE_COLORS[req.plug_id] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {PLUG_LABELS[req.plug_id] ?? req.plug_id}
                </span>

                <div className="flex-1 min-w-0">
                  {/* Client + status row */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <button
                      onClick={() => req.client_id && navigate(`/internal/clients/${req.client_id}?tab=solicitudes`)}
                      className="text-sm font-semibold text-[#1A1F2E] hover:text-[#C026A8] transition-colors"
                    >
                      {req.client_name ?? 'Cliente desconocido'}
                    </button>
                    <NodoBadge status={req.status} size="sm" />
                    <span className="text-[10px] text-[#9CA3AF] ml-auto">
                      {new Date(req.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      {new Date(req.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Content preview */}
                  {req.content && (
                    <p className="text-xs text-[#6B7280] line-clamp-2 mb-2">{req.content}</p>
                  )}

                  {/* Admin response */}
                  {req.admin_response && respondingTo !== req.id && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 mb-2">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Respuesta enviada</p>
                      <p className="text-xs text-emerald-800">{req.admin_response}</p>
                    </div>
                  )}

                  {/* Response form */}
                  {respondingTo === req.id && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={responseText}
                        onChange={e => setResponseText(e.target.value)}
                        rows={3}
                        placeholder="Escribe tu respuesta al cliente..."
                        autoFocus
                        className="w-full bg-white border border-[#E5E8EF] rounded-xl px-3 py-2.5 text-sm text-[#1A1F2E] placeholder-[#9CA3AF] outline-none focus:border-[#C8F135] focus:ring-2 focus:ring-[#C8F135]/15 resize-none transition-all"
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setRespondingTo(null); setResponseText('') }}
                          className="text-xs px-3 py-1.5 text-[#6B7280] border border-[#E5E8EF] rounded-lg hover:bg-[#F4F6F9] transition-colors">
                          Cancelar
                        </button>
                        <button onClick={() => sendResponse(req.id)} disabled={!responseText.trim()}
                          className="text-xs px-3 py-1.5 bg-[#C8F135] text-[#1A1F2E] font-semibold rounded-lg hover:bg-[#D4F53C] disabled:opacity-40 transition-colors">
                          Enviar y resolver
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {req.status !== 'resolved' && respondingTo !== req.id && (
                  <div className="flex gap-1 flex-shrink-0">
                    {req.status === 'pending' && (
                      <button onClick={() => updateStatus(req.id, 'in_progress')}
                        className="text-xs px-2 py-1 bg-[#F4F6F9] text-[#374151] border border-[#E5E8EF] rounded-lg hover:border-[#C8F135]/40 transition-colors whitespace-nowrap">
                        En proceso
                      </button>
                    )}
                    <button onClick={() => { setRespondingTo(req.id); setResponseText('') }}
                      className="text-xs px-2 py-1 bg-[#1E2433] text-white rounded-lg hover:bg-[#252D3D] transition-colors whitespace-nowrap">
                      Responder
                    </button>
                  </div>
                )}
              </div>
            </NodoCard>
          ))}
        </div>
      )}
    </div>
  )
}
