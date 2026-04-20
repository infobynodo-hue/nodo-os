import { useEffect, useRef, useState } from 'react'
import {
  Folder, FileText, Link2, Video, Key, Package,
  Download, ExternalLink, ChevronDown, ChevronUp,
  BookOpen, X, Eye, Loader2, FileUp,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import type { InternalResource, ProjectDeliverable } from '../../types'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

const DEMO_RESOURCES: InternalResource[] = [
  {
    id: 'r1', title: 'Propuesta comercial NODO ONE',
    description: 'Propuesta firmada con el detalle de los servicios contratados.',
    category: 'propuesta', tags: [], file_name: 'propuesta_nodo_one.pdf', is_pinned: true,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 2592000000).toISOString(),
  },
  {
    id: 'r2', title: 'Contrato de servicios',
    description: 'Contrato de servicios de IA y automatización.',
    category: 'contrato', tags: [], file_name: 'contrato_servicios.pdf', is_pinned: false,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 2592000000).toISOString(),
  },
]
const DEMO_DELIVERABLES: ProjectDeliverable[] = [
  { id: 'd1', project_id: 'demo', phase_number: 1, title: 'Onboarding completado', description: 'Resumen del onboarding.', type: 'documento', published: true, created_at: new Date(Date.now() - 1296000000).toISOString() },
  { id: 'd2', project_id: 'demo', phase_number: 2, title: 'Acuerdo de Servicio NODO ONE', description: 'Claudia · WhatsApp · 6 meses', type: 'documento', published: true, created_at: new Date(Date.now() - 864000000).toISOString() },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deliverableIcon(type: ProjectDeliverable['type'], size = 16) {
  switch (type) {
    case 'documento': return <FileText size={size} className="text-[#C026A8]" />
    case 'link':      return <Link2    size={size} className="text-blue-400" />
    case 'video':     return <Video    size={size} className="text-violet-400" />
    case 'acceso':    return <Key      size={size} className="text-amber-400" />
    default:          return <Package  size={size} className="text-[#6B6B80]" />
  }
}

function resourceIcon(category: InternalResource['category']) {
  switch (category) {
    case 'propuesta':    return <FileText size={16} className="text-[#C026A8]" />
    case 'contrato':     return <BookOpen size={16} className="text-amber-400" />
    case 'presentacion': return <Package  size={16} className="text-blue-400" />
    case 'enlace':       return <Link2    size={16} className="text-emerald-400" />
    default:             return <FileText size={16} className="text-[#6B6B80]" />
  }
}

function isPDF(fileName?: string | null) {
  return fileName?.toLowerCase().endsWith('.pdf') ?? false
}

// Generate a signed URL from client-documents bucket
async function signedUrl(filePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('client-documents')
    .createSignedUrl(filePath, 3600)
  return data?.signedUrl ?? null
}

// Generate a signed URL from internal-resources bucket
async function signedResourceUrl(filePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('internal-resources')
    .createSignedUrl(filePath, 3600)
  return data?.signedUrl ?? null
}

// Force download via anchor click
function forceDownload(url: string, fileName: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'documento'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({ url, fileName, onClose }: { url: string; fileName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm" onClick={onClose}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-[#1A1827] flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#C026A8]" />
          <span className="text-sm font-medium text-white truncate max-w-xs">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            download={fileName}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C026A8] text-white text-xs font-semibold hover:bg-[#E040A0] transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <Download size={12} />
            Descargar
          </a>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      {/* PDF iframe */}
      <div className="flex-1 overflow-hidden" onClick={e => e.stopPropagation()}>
        <iframe
          src={`${url}#toolbar=0`}
          className="w-full h-full border-0"
          title={fileName}
        />
      </div>
    </div>
  )
}

// ─── Document card ──────────────────────────────────────────────────────────────

function DocCard({
  icon, title, description, date, fileName, filePath, externalUrl, bucket,
}: {
  icon: React.ReactNode
  title: string
  description?: string | null
  date: string
  fileName?: string | null
  filePath?: string | null
  externalUrl?: string | null
  bucket: 'client-documents' | 'internal-resources'
}) {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const canPreview = isPDF(fileName) && !!filePath
  const canDownload = !!filePath || !!externalUrl

  async function getUrl() {
    if (externalUrl) return externalUrl
    if (!filePath) return null
    return bucket === 'client-documents'
      ? await signedUrl(filePath)
      : await signedResourceUrl(filePath)
  }

  async function handlePreview() {
    setLoading(true)
    try {
      const url = await getUrl()
      if (url) setPreviewUrl(url)
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload() {
    setLoading(true)
    try {
      const url = await getUrl()
      if (!url) return
      if (externalUrl) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        forceDownload(url, fileName || title)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-[#F4F3F9] border border-[#E8E6F0] flex items-center justify-center flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1A1827]">{title}</p>
          {description && <p className="text-xs text-[#6B6B80] mt-0.5">{description}</p>}
          <p className="text-[10px] text-[#6B6B80]/60 mt-1">{date}</p>
        </div>

        {canDownload && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Preview — solo si es PDF con file_path */}
            {canPreview && (
              <button
                onClick={handlePreview}
                disabled={loading}
                title="Previsualizar"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F4F3F9] border border-[#E8E6F0] text-xs text-[#4D4B60] hover:text-[#C026A8] hover:border-[#C026A8]/40 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                <span className="hidden sm:inline">Ver</span>
              </button>
            )}
            {/* Download / Open */}
            <button
              onClick={handleDownload}
              disabled={loading}
              title={externalUrl ? 'Abrir enlace' : 'Descargar'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F4F3F9] border border-[#E8E6F0] text-xs text-[#4D4B60] hover:text-[#1A1827] hover:border-[#C026A8]/40 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : externalUrl ? <ExternalLink size={12} /> : <Download size={12} />}
              <span className="hidden sm:inline">{externalUrl ? 'Abrir' : 'Descargar'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewUrl && (
        <PreviewModal
          url={previewUrl}
          fileName={fileName || title}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </>
  )
}

// ─── Upload Section ────────────────────────────────────────────────────────────

function UploadSection({ clientId, projectId, onUploaded }: {
  clientId: string
  projectId: string
  onUploaded: (item: ProjectDeliverable) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    const maxMb = 20
    if (file.size > maxMb * 1024 * 1024) {
      setError(`El archivo supera los ${maxMb} MB máximos.`)
      return
    }
    setError(null)
    setUploading(true)
    try {
      const slug = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `client-uploads/${clientId}/${Date.now()}_${slug}`
      const { error: upErr } = await supabase.storage
        .from('client-documents')
        .upload(path, file, { upsert: false })
      if (upErr) { setError('No se pudo subir el archivo. Contacta con el equipo de NODO.'); return }

      // Insert in project_deliverables
      const fileType = file.name.endsWith('.pdf') ? 'documento'
        : file.name.match(/\.(mp4|mov|avi|webm)$/i) ? 'video'
        : 'documento'
      const { data, error: dbErr } = await supabase
        .from('project_deliverables')
        .insert({
          project_id: projectId,
          title: file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
          description: 'Subido por el cliente',
          file_path: path,
          file_name: file.name,
          type: fileType,
          published: true,
        })
        .select()
        .single()
      if (!dbErr && data) onUploaded(data)
      if (fileRef.current) fileRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
        <h2 className="text-sm font-bold text-[#1A1827]">Subir documento</h2>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-2 cursor-pointer transition-all ${
          dragOver
            ? 'border-[#C026A8] bg-[#C026A8]/5'
            : 'border-[#E8E6F0] bg-white hover:border-[#C026A8]/40 hover:bg-[#F4F3F9]'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 size={24} className="text-[#C026A8] animate-spin" />
            <p className="text-sm text-[#6B6B80]">Subiendo archivo…</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-[#C026A8]/10 flex items-center justify-center">
              <FileUp size={20} className="text-[#C026A8]" />
            </div>
            <p className="text-sm font-medium text-[#1A1827]">
              Arrastra un archivo o <span className="text-[#C026A8]">haz clic para seleccionar</span>
            </p>
            <p className="text-xs text-[#6B6B80]">PDF, imágenes, Word, Excel — máx. 20 MB</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.mov"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function ClientDocsPage() {
  const { user } = useAuthStore()
  const [resources,    setResources]    = useState<InternalResource[]>([])
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([])
  const [loading,      setLoading]      = useState(true)
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6, 7]))

  useEffect(() => { loadData() }, [user?.id])

  async function loadData() {
    setLoading(true)
    try {
      if (IS_DEMO) { setResources(DEMO_RESOURCES); setDeliverables(DEMO_DELIVERABLES); return }
      if (!user?.clientId || !user?.projectId) return
      const [resRes, delivRes] = await Promise.all([
        supabase.from('internal_resources').select('*')
          .eq('client_id', user.clientId).eq('is_client_visible', true)
          .order('created_at', { ascending: false }),
        supabase.from('project_deliverables').select('*')
          .eq('project_id', user.projectId).eq('published', true)
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
      if (next.has(phase)) { next.delete(phase) } else { next.add(phase) }
      return next
    })
  }

  function handleUploaded(item: ProjectDeliverable) {
    setDeliverables(prev => {
      // Add to phase 0 (general) if not set
      return [...prev, { ...item, phase_number: item.phase_number ?? 0 }]
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Group deliverables by phase
  const byPhase = new Map<number, ProjectDeliverable[]>()
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
          <h1 className="text-xl font-bold text-[#1A1827]">Mis Documentos</h1>
          <p className="text-sm text-[#6B6B80]">Archivos y entregables de tu proyecto</p>
        </div>
      </div>

      {/* Upload section — solo usuarios reales con projectId */}
      {!IS_DEMO && user?.clientId && user?.projectId && (
        <UploadSection
          clientId={user.clientId}
          projectId={user.projectId}
          onUploaded={handleUploaded}
        />
      )}

      {isEmpty ? (
        <div className="rounded-2xl border border-[#E8E6F0] bg-[#F7F6FC] p-12 text-center">
          <Folder size={36} className="text-[#BBBBCC] mx-auto mb-3" />
          <p className="text-sm text-[#6B6B80] font-medium">Sin documentos aún</p>
          <p className="text-xs text-[#9999AA] mt-1 max-w-xs mx-auto">
            El equipo de NODO ONE compartirá aquí tus documentos y entregables.
          </p>
        </div>
      ) : (
        <>
          {/* NODO Resources */}
          {resources.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#E040A0] to-[#8B22E8]" />
                <h2 className="text-sm font-bold text-[#1A1827]">Documentos de NODO</h2>
                <span className="text-xs text-[#6B6B80] bg-white border border-[#E8E6F0] px-2 py-0.5 rounded-full">{resources.length}</span>
              </div>
              <div className="rounded-xl border border-[#E8E6F0] bg-white overflow-hidden divide-y divide-[#E8E6F0]">
                {resources.map(res => (
                  <DocCard
                    key={res.id}
                    icon={resourceIcon(res.category)}
                    title={res.title}
                    description={res.description}
                    date={new Date(res.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                    fileName={res.file_name}
                    filePath={res.file_path}
                    externalUrl={res.external_url}
                    bucket="internal-resources"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Deliverables by phase */}
          {deliverables.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-400 to-violet-600" />
                <h2 className="text-sm font-bold text-[#1A1827]">Entregables del proyecto</h2>
                <span className="text-xs text-[#6B6B80] bg-white border border-[#E8E6F0] px-2 py-0.5 rounded-full">{deliverables.length}</span>
              </div>
              <div className="space-y-3">
                {phases.map(phase => {
                  const items = byPhase.get(phase) || []
                  const expanded = expandedPhases.has(phase)
                  return (
                    <div key={phase} className="rounded-xl border border-[#E8E6F0] bg-white overflow-hidden">
                      <button
                        onClick={() => togglePhase(phase)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F4F3F9] transition-colors"
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
                        <div className="border-t border-[#E8E6F0] divide-y divide-[#E8E6F0]">
                          {items.map(item => (
                            <DocCard
                              key={item.id}
                              icon={deliverableIcon(item.type)}
                              title={item.title}
                              description={item.description}
                              date={new Date(item.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                              fileName={item.file_name}
                              filePath={item.file_path}
                              externalUrl={item.external_url}
                              bucket="client-documents"
                            />
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
