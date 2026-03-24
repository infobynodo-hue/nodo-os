import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { getDemoClientsWithProjects } from '../../lib/demo'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL
import { NodoBadge } from '../../components/ui/NodoBadge'
import { NodoProgressBar } from '../../components/ui/NodoProgressBar'
import { NodoButton } from '../../components/ui/NodoButton'
import { NodoAvatar } from '../../components/ui/NodoAvatar'
import { SERVICE_LABELS } from '../../types'
import type { Client, Project } from '../../types'

interface ClientWithProject extends Client {
  project?: Project
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'paused', label: 'Pausados' },
  { value: 'completed', label: 'Completados' },
  { value: 'no_project', label: 'Sin proyecto' },
]

export function ClientsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientWithProject[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setLoading(true)
    try {
      if (IS_DEMO) {
        setClients(getDemoClientsWithProjects())
        return
      }
      const { data } = await supabase
        .from('clients')
        .select('*, projects(id, service_type, status, progress_pct, duration_months, monthly_price, current_phase, assigned_tech, created_at, client_id)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setClients(
        (data || []).map((c: Client & { projects?: Project[] }) => ({
          ...c,
          project: c.projects?.[0],
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.business_name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      c.sector.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      filterStatus === 'all' ||
      c.project?.status === filterStatus ||
      (!c.project && filterStatus === 'no_project')
    return matchSearch && matchStatus
  })

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Gestión</p>
          <h1 className="text-2xl font-bold text-[#1A1F2E]">Clientes</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">{clients.length} clientes en total</p>
        </div>
        {user?.role === 'admin' && (
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

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-[#E5E8EF] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#1A1F2E] placeholder-[#9CA3AF] outline-none focus:border-[#C8F135] focus:ring-2 focus:ring-[#C8F135]/15 transition-all"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterStatus === f.value
                ? 'bg-[#C8F135] text-[#1A1F2E]'
                : 'text-[#6B7280] bg-white border border-[#E5E8EF] hover:border-[#C8F135]/40 hover:text-[#1A1F2E]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Clients — dark panel */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#C8F135] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-center py-16">
          <p className="text-[#9CA3AF] text-sm">No se encontraron clientes.</p>
        </div>
      ) : (
        <div className="bg-[#1E2433] rounded-2xl overflow-hidden dark-scroll">
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
                  <p className="font-semibold text-white text-sm">{client.business_name}</p>
                  {client.project && <NodoBadge status={client.project.status} size="sm" dark />}
                </div>
                <p className="text-xs text-white/40 truncate">
                  {client.sector} · {client.contact_name}
                </p>
                <p className="text-xs text-white/25 truncate md:hidden">{client.contact_email}</p>
              </div>

              <div className="hidden md:flex flex-col items-end gap-2 min-w-[160px]">
                {client.project ? (
                  <>
                    <p className="text-xs text-white/40 text-right truncate max-w-[160px]">
                      {SERVICE_LABELS[client.project.service_type]}
                    </p>
                    <div className="w-28">
                      <NodoProgressBar value={client.project.progress_pct} size="sm" showLabel dark />
                    </div>
                    <p className="text-[10px] text-white/30">Fase {client.project.current_phase}</p>
                  </>
                ) : (
                  <span className="text-xs text-white/25">Sin proyecto</span>
                )}
              </div>

              <ArrowRight
                size={14}
                className="flex-shrink-0 text-white/20 group-hover:text-[#C8F135] transition-colors"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
