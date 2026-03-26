import { useEffect, useState } from 'react'
import {
  Folder,
  FileText,
  Link2,
  Video,
  Key,
  Package,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import type { InternalResource, ProjectDeliverable } from '../../types'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

const DEMO_RESOURCES: InternalResource[] = [
  {
    id: 'r1',
    title: 'Propuesta comercial NODO ONE',
    description: 'Propuesta firmada con el detalle de los servicios contratados.',
    category: 'propuesta',
    tags: [],
    file_name: 'propuesta_nodo_one.pdf',
    is_pinned: true,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 2592000000).toISOString(),
  },
  {
    id: 'r2',
    title: 'Contrato de servicios',
    description: 'Contrato de servicios de IA y automatización.',
    category: 'contrato',
    tags: [],
    file_name: 'contrato_servicios.pdf',
    is_pinned: false,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 2592000000).toISOString(),
  },
]

const DEMO_DELIVERABLES: ProjectDeliverable[] = [
  {
    id: 'd1',
    project_id: 'demo',
    phase_number: 1,
    title: 'Onboarding completado',
    description: 'Resumen del onboarding con la información del negocio.',
    type: 'documento',
    published: true,
    created_at: new Date(Date.now() - 1296000000).toISOString(),
  },
  {
    id: 'd2',
    project_id: 'demo',
    phase_number: 2,
    title: 'Acceso al panel de WhatsApp Business',
    description: 'Credenciales para acceder al panel de administración.',
    type: 'acceso',
    external_url: 'https://business.whatsapp.com',
    published: true,
    created_at: new Date(Date.now() - 864000000).toISOString(),
  },
  {
    id: 'd3',
    project_id: 'demo',
    phase_number: 3,
    title: 'Video tutorial del agente',
    description: 'Tutorial explicando cómo funciona tu agente y cómo interpretarlo.',
    type: 'video',
    external_url: 'https://www.youtube.com',
    published: true,
    created_at: new Date(Date.now() - 432000000).toISOString(),
  },
]

function deliverableIcon(type: ProjectDeliverable['type'], size = 16) {
  switch (type) {
    case 'documento': return <FileText size={size} className="text-[#C026A8]" />
    case 'link': return <Link2 size={size} className="text-blue-400" />
    case 'video': return <Video size={size} className="text-violet-400" />
    case 'acceso': return <Key size={size} className="text-amber-400" />
    default: return <Package size={size} className="text-[#6B6B80]" />
  }
}

function resourceCategoryIcon(category: InternalResource['category']) {
  switch (category) {
    case 'propuesta': return <FileText size={16} className="text-[#C026A8]" />
    case 'contrato': return <BookOpen size={16} className="text-amber-400" />
    case 'presentacion': return <Package size={16} className="text-blue-400" />
    case 'enlace': return <Link2 size={16} className="text-emerald-400" />
    default: return <FileText size={16} className="text-[#6B6B80]" />
  }
}

async function openResource(resource: InternalResource) {
  if (resource.external_url) {
    window.open(resource.external_url, '_blank', 'noopener,noreferrer')
    return
  }
  if (resource.file_path) {
    const newWindow = window.open('', '_blank', 'noopener,noreferrer')
    const { data } = await supabase.storage
      .from('internal-resources')
      .createSignedUrl(resource.file_path, 3600)
    if (data?.signedUrl && newWindow) {
      newWindow.location.href = data.signedUrl
    } else if (newWindow) {
      newWindow.close()
    }
  }
}

async function openDeliverable(item: ProjectDeliverable) {
  if (item.external_url) {
    window.open(item.external_url, '_blank', 'noopener,noreferrer')
    return
  }
  if (item.file_path) {
    const newWindow = window.open('', '_blank', 'noopener,noreferrer')
    const { data } = await supabase.storage
      .from('internal-resources')
      .createSignedUrl(item.file_path, 3600)
    if (data?.signedUrl && newWindow) {
      newWindow.location.href = data.signedUrl
    } else if (newWindow) {
      newWindow.close()
    }
  }
}

export function ClientDocsPage() {
  const { user } = useAuthStore()
  const [resources, setResources] = useState<InternalResource[]>([])
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 7]))

  useEffect(() => {
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    try {
      if (IS_DEMO) {
        setResources(DEMO_RESOURCES)
        setDeliverables(DEMO_DELIVERABLES)
        setLoading(false)
        return
      }
      if (!user?.clientId || !user?.projectId) { setLoading(false); return }
      const [resRes, delivRes] = await Promise.all([
        supabase
          .from('internal_resources')
          .select('*')
          .eq('client_id', user.clientId)
          .eq('is_client_visible', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('project_deliverables')
          .select('*')
          .eq('project_id', user.projectId)
          .eq('published', true)
          .order('phase_number', { ascending: true }),
      ])
      setResources(resRes.data || [])
      setDeliverables(delivRes.data || [])
    } finally {
      setLoading(false)
    }
  }

  function togglePhase(phase: number) {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(phase)) next.delete(phase)
      else next.add(phase)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Group deliverables by phase
  const byPhase: Map<number, ProjectDeliverable[]> = new Map()
  for (const d of deliverables) {
    const phase = d.phase_number ?? 0
    if (!byPhase.has(phase)) byPhase.set(phase, [])
    byPhase.get(phase)!.push(d)
  }
  const phases = Array.from(byPhase.keys()).sort((a, b) => a - b)

  const isEmpty = resources.length === 0 && deliverables.length === 0

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 fade-in w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/10 to-[#8B22E8]/10 flex items-center justify-center">
          <Folder size={18} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Mis Documentos</h1>
          <p className="text-sm text-[#6B6B80]">Archivos y entregables de tu proyecto</p>
        </div>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border border-[#1E1C2A] bg-[#12101A] p-12 text-center">
          <Folder size={36} className="text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50 font-medium">Sin documentos aún</p>
          <p className="text-xs text-white/30 mt-1 max-w-xs mx-auto">
            El equipo de NODO ONE compartirá aquí tus documentos y entregables.
          </p>
        </div>
      ) : (
        <>
          {/* Section 1: NODO Resources */}
          {resources.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#E040A0] to-[#8B22E8]" />
                <h2 className="text-sm font-bold text-white">Documentos de NODO</h2>
                <span className="text-xs text-[#6B6B80] bg-[#12101A] border border-[#1E1C2A] px-2 py-0.5 rounded-full">
                  {resources.length}
                </span>
              </div>
              <div className="space-y-2">
                {resources.map(res => (
                  <div
                    key={res.id}
                    className="rounded-xl border border-[#1E1C2A] bg-[#12101A] p-4 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#1A1825] border border-[#1E1C2A] flex items-center justify-center flex-shrink-0">
                      {resourceCategoryIcon(res.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{res.title}</p>
                      {res.description && (
                        <p className="text-xs text-[#6B6B80] mt-0.5">{res.description}</p>
                      )}
                      <p className="text-[10px] text-[#6B6B80]/60 mt-1">
                        {new Date(res.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => openResource(res)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1825] border border-[#1E1C2A] text-xs text-white/70 hover:text-white hover:border-[#C026A8]/40 transition-all"
                    >
                      {res.external_url ? <ExternalLink size={12} /> : <Download size={12} />}
                      {res.external_url ? 'Abrir' : 'Descargar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Project Deliverables by phase */}
          {deliverables.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-400 to-violet-600" />
                <h2 className="text-sm font-bold text-white">Entregables del proyecto</h2>
                <span className="text-xs text-[#6B6B80] bg-[#12101A] border border-[#1E1C2A] px-2 py-0.5 rounded-full">
                  {deliverables.length}
                </span>
              </div>
              <div className="space-y-3">
                {phases.map(phase => {
                  const items = byPhase.get(phase) || []
                  const expanded = expandedPhases.has(phase)
                  return (
                    <div key={phase} className="rounded-xl border border-[#1E1C2A] bg-[#12101A] overflow-hidden">
                      <button
                        onClick={() => togglePhase(phase)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#C026A8] bg-[#C026A8]/10 border border-[#C026A8]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {phase === 0 ? 'General' : `Fase ${phase}`}
                          </span>
                          <span className="text-xs text-[#6B6B80]">{items.length} entregable{items.length !== 1 ? 's' : ''}</span>
                        </div>
                        {expanded ? <ChevronUp size={14} className="text-[#6B6B80]" /> : <ChevronDown size={14} className="text-[#6B6B80]" />}
                      </button>
                      {expanded && (
                        <div className="border-t border-[#1E1C2A] divide-y divide-[#1E1C2A]">
                          {items.map(item => (
                            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                              <div className="w-7 h-7 rounded-lg bg-[#1A1825] border border-[#1E1C2A] flex items-center justify-center flex-shrink-0 mt-0.5">
                                {deliverableIcon(item.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white">{item.title}</p>
                                {item.description && (
                                  <p className="text-xs text-[#6B6B80] mt-0.5">{item.description}</p>
                                )}
                                <p className="text-[10px] text-[#6B6B80]/60 mt-1">
                                  {new Date(item.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                              {(item.file_path || item.external_url) && (
                                <button
                                  onClick={() => openDeliverable(item)}
                                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1825] border border-[#1E1C2A] text-xs text-white/70 hover:text-white hover:border-[#C026A8]/40 transition-all"
                                >
                                  {item.external_url ? <ExternalLink size={12} /> : <Download size={12} />}
                                  {item.external_url ? 'Abrir' : 'Descargar'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
