import { useEffect, useRef, useState } from 'react'
import {
  FileText, FileCheck, Play, Link, Layout, Mic, Package,
  MonitorPlay, ExternalLink, Download, Copy, Star, Pencil,
  Trash2, Upload, Search, X, Check, Library
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import type { InternalResource } from '../../types'

// ── Config ────────────────────────────────────────────────────────────
type Category = InternalResource['category']

const CATEGORY_CONFIG: Record<Category, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  propuesta:    { icon: FileText,    label: 'Propuesta',    color: '#C026A8', bg: 'bg-pink-500/15' },
  presentacion: { icon: MonitorPlay, label: 'Presentación', color: '#8B22E8', bg: 'bg-violet-500/15' },
  contrato:     { icon: FileCheck,   label: 'Contrato',     color: '#3b82f6', bg: 'bg-blue-500/15' },
  demo:         { icon: Play,        label: 'Demo',         color: '#C8F135', bg: 'bg-lime-500/15' },
  enlace:       { icon: Link,        label: 'Enlace',       color: '#22c55e', bg: 'bg-green-500/15' },
  plantilla:    { icon: Layout,      label: 'Plantilla',    color: '#f97316', bg: 'bg-orange-500/15' },
  guion:        { icon: Mic,         label: 'Guión',        color: '#06b6d4', bg: 'bg-cyan-500/15' },
  otro:         { icon: Package,     label: 'Otro',         color: '#6b7280', bg: 'bg-gray-500/15' },
}

const SERVICE_LABELS: Record<string, string> = {
  bpo_claudia:    'Claudia',
  bpo_lucia:      'Lucía',
  track_property: 'Track Property',
  recovery:       'Recovery',
}

const CATEGORIES: { id: Category | 'all'; label: string; emoji: string }[] = [
  { id: 'all',         label: 'Todos',        emoji: '📁' },
  { id: 'propuesta',   label: 'Propuestas',   emoji: '📄' },
  { id: 'presentacion',label: 'Presentaciones',emoji: '📊' },
  { id: 'contrato',    label: 'Contratos',    emoji: '📋' },
  { id: 'demo',        label: 'Demos',        emoji: '🎯' },
  { id: 'enlace',      label: 'Enlaces',      emoji: '🔗' },
  { id: 'plantilla',   label: 'Plantillas',   emoji: '📝' },
  { id: 'guion',       label: 'Guiones',      emoji: '🎤' },
  { id: 'otro',        label: 'Otros',        emoji: '📦' },
]

// ── Types ─────────────────────────────────────────────────────────────
interface FormState {
  title: string
  description: string
  category: Category
  tags: string
  inputType: 'file' | 'url'
  external_url: string
  service: string
  is_pinned: boolean
}

const EMPTY_FORM: FormState = {
  title: '', description: '', category: 'propuesta', tags: '',
  inputType: 'url', external_url: '', service: '', is_pinned: false,
}

// ── Main Component ────────────────────────────────────────────────────
export function ResourcesPage() {
  const { user } = useAuthStore()
  const [resources, setResources] = useState<InternalResource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingResource, setEditingResource] = useState<InternalResource | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => { loadResources() }, [])

  async function loadResources() {
    setLoading(true)
    const { data } = await supabase
      .from('internal_resources')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setResources(data || [])
    setLoading(false)
  }

  const filtered = resources.filter(r => {
    const matchCat = activeCategory === 'all' || r.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.title.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    return matchCat && matchSearch
  })

  const pinned = filtered.filter(r => r.is_pinned)
  const rest   = filtered.filter(r => !r.is_pinned)

  async function openResource(r: InternalResource) {
    if (r.external_url) { window.open(r.external_url, '_blank', 'noopener,noreferrer'); return }
    if (r.file_path) {
      const newWindow = window.open('', '_blank', 'noopener,noreferrer')
      const { data } = await supabase.storage.from('internal-resources').createSignedUrl(r.file_path, 3600)
      if (data?.signedUrl && newWindow) {
        newWindow.location.href = data.signedUrl
      } else if (newWindow) {
        newWindow.close()
      }
    }
  }

  async function copyLink(r: InternalResource) {
    let url = r.external_url || ''
    if (!url && r.file_path) {
      const { data } = await supabase.storage.from('internal-resources').createSignedUrl(r.file_path, 3600)
      url = data?.signedUrl || ''
    }
    if (url) {
      await navigator.clipboard.writeText(url)
      setCopiedId(r.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  async function togglePin(r: InternalResource) {
    await supabase.from('internal_resources').update({ is_pinned: !r.is_pinned }).eq('id', r.id)
    setResources(prev => prev.map(x => x.id === r.id ? { ...x, is_pinned: !x.is_pinned } : x))
  }

  async function deleteResource(r: InternalResource) {
    if (r.file_path) await supabase.storage.from('internal-resources').remove([r.file_path])
    await supabase.from('internal_resources').delete().eq('id', r.id)
    setResources(prev => prev.filter(x => x.id !== r.id))
    setConfirmDeleteId(null)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Library size={18} className="text-[#C026A8]" />
            <p className="text-xs font-semibold text-[#6B6B80] uppercase tracking-widest">Interno</p>
          </div>
          <h1 className="text-2xl font-bold text-white">Biblioteca de Recursos</h1>
          <p className="text-sm text-[#6B6B80] mt-0.5">Propuestas, presentaciones, demos y herramientas del equipo</p>
        </div>
        <button
          onClick={() => { setEditingResource(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#E040A0,#C026A8,#8B22E8)' }}
        >
          <Upload size={14} />
          Subir recurso
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B80]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, descripción o etiqueta..."
            className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#6B6B80] outline-none focus:border-[#C026A8]/40"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B80] hover:text-white"><X size={13} /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[#C026A8] text-white'
                  : 'bg-[#1A1825] border border-[#1E1C2A] text-[#6B6B80] hover:text-white hover:border-[#C026A8]/30'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#6B6B80] text-sm">Cargando recursos…</div>
      ) : (
        <>
          {/* Pinned */}
          {pinned.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-[#C8F135] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Star size={12} fill="currentColor" /> Fijados
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinned.map(r => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    copiedId={copiedId}
                    confirmDeleteId={confirmDeleteId}
                    onOpen={openResource}
                    onCopy={copyLink}
                    onPin={togglePin}
                    onEdit={res => { setEditingResource(res); setShowModal(true) }}
                    onDelete={id => setConfirmDeleteId(id)}
                    onConfirmDelete={deleteResource}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <p className="text-xs font-semibold text-[#6B6B80] uppercase tracking-widest mb-3">Todos los recursos</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map(r => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    copiedId={copiedId}
                    confirmDeleteId={confirmDeleteId}
                    onOpen={openResource}
                    onCopy={copyLink}
                    onPin={togglePin}
                    onEdit={res => { setEditingResource(res); setShowModal(true) }}
                    onDelete={id => setConfirmDeleteId(id)}
                    onConfirmDelete={deleteResource}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                  />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1A1825] flex items-center justify-center">
                <Library size={28} className="text-[#6B6B80]" />
              </div>
              <p className="text-white font-medium">Sin recursos en esta categoría</p>
              <p className="text-sm text-[#6B6B80]">Sube el primer recurso para empezar</p>
              <button
                onClick={() => { setEditingResource(null); setShowModal(true) }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#E040A0,#C026A8,#8B22E8)' }}
              >+ Subir recurso</button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <ResourceModal
          resource={editingResource}
          userId={user?.id || ''}
          onClose={() => { setShowModal(false); setEditingResource(null) }}
          onSaved={() => { setShowModal(false); setEditingResource(null); loadResources() }}
        />
      )}
    </div>
  )
}

// ── Resource Card ─────────────────────────────────────────────────────
function ResourceCard({
  resource: r, copiedId, confirmDeleteId,
  onOpen, onCopy, onPin, onEdit, onDelete, onConfirmDelete, onCancelDelete,
}: {
  resource: InternalResource
  copiedId: string | null
  confirmDeleteId: string | null
  onOpen: (r: InternalResource) => void
  onCopy: (r: InternalResource) => void
  onPin: (r: InternalResource) => void
  onEdit: (r: InternalResource) => void
  onDelete: (id: string) => void
  onConfirmDelete: (r: InternalResource) => void
  onCancelDelete: () => void
}) {
  const cfg = CATEGORY_CONFIG[r.category]
  const Icon = cfg.icon

  return (
    <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl p-5 flex flex-col gap-3 hover:border-[#C026A8]/20 transition-colors">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.color + '20', color: cfg.color }}>
              {cfg.label}
            </span>
            {r.service && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                {SERVICE_LABELS[r.service] || r.service}
              </span>
            )}
            {r.is_pinned && <Star size={11} className="text-[#C8F135]" fill="currentColor" />}
          </div>
          <p className="text-sm font-semibold text-white mt-1 truncate">{r.title}</p>
        </div>
      </div>

      {/* Description */}
      {r.description && (
        <p className="text-xs text-[#6B6B80] line-clamp-2">{r.description}</p>
      )}

      {/* Tags */}
      {r.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {r.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 bg-[#1A1825] border border-[#1E1C2A] rounded-full text-[#6B6B80]">
              {tag}
            </span>
          ))}
          {r.tags.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 bg-[#1A1825] border border-[#1E1C2A] rounded-full text-[#6B6B80]">
              +{r.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* File info */}
      {r.file_name && (
        <div className="flex items-center gap-1.5 text-xs text-[#6B6B80]">
          <Download size={11} />
          <span className="truncate">{r.file_name}</span>
          {r.file_size && <span className="flex-shrink-0">· {(r.file_size / 1024 / 1024).toFixed(1)} MB</span>}
        </div>
      )}
      {r.external_url && !r.file_name && (
        <div className="flex items-center gap-1.5 text-xs text-[#6B6B80]">
          <ExternalLink size={11} />
          <span className="truncate">{r.external_url}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-[#1E1C2A]">
        <button
          onClick={() => onOpen(r)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#1A1825] hover:bg-[#C026A8]/15 text-xs text-[#6B6B80] hover:text-[#C026A8] transition-colors"
        >
          {r.external_url ? <ExternalLink size={12} /> : <Download size={12} />}
          {r.external_url ? 'Abrir' : 'Descargar'}
        </button>

        <button
          onClick={() => onCopy(r)}
          title="Copiar enlace"
          className="p-1.5 rounded-lg hover:bg-white/5 text-[#6B6B80] hover:text-white transition-colors"
        >
          {copiedId === r.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
        </button>

        <button
          onClick={() => onPin(r)}
          title={r.is_pinned ? 'Quitar de fijados' : 'Fijar'}
          className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${r.is_pinned ? 'text-[#C8F135]' : 'text-[#6B6B80] hover:text-[#C8F135]'}`}
        >
          <Star size={13} fill={r.is_pinned ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={() => onEdit(r)}
          title="Editar"
          className="p-1.5 rounded-lg hover:bg-white/5 text-[#6B6B80] hover:text-white transition-colors"
        >
          <Pencil size={13} />
        </button>

        {confirmDeleteId === r.id ? (
          <div className="flex items-center gap-1">
            <button onClick={() => onConfirmDelete(r)} className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-semibold hover:bg-red-500/30">Sí</button>
            <button onClick={onCancelDelete} className="px-2 py-1 rounded-lg bg-white/5 text-[#6B6B80] text-[10px] hover:bg-white/10">No</button>
          </div>
        ) : (
          <button
            onClick={() => onDelete(r.id)}
            title="Eliminar"
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#6B6B80] hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────
function ResourceModal({
  resource, userId, onClose, onSaved,
}: {
  resource: InternalResource | null
  userId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(resource ? {
    title: resource.title,
    description: resource.description || '',
    category: resource.category,
    tags: resource.tags.join(', '),
    inputType: resource.external_url ? 'url' : 'file',
    external_url: resource.external_url || '',
    service: resource.service || '',
    is_pinned: resource.is_pinned,
  } : EMPTY_FORM)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      let filePath: string | null = resource?.file_path || null
      let fileName: string | null = resource?.file_name || null
      let fileSize: number | null = resource?.file_size || null
      let fileType: string | null = resource?.file_type || null

      if (selectedFile) {
        const path = `${form.category}/${Date.now()}-${selectedFile.name}`
        const { data } = await supabase.storage.from('internal-resources').upload(path, selectedFile)
        if (data) {
          filePath = data.path
          fileName = selectedFile.name
          fileSize = selectedFile.size
          fileType = selectedFile.type
        }
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        file_path: form.inputType === 'file' ? filePath : null,
        file_name: form.inputType === 'file' ? fileName : null,
        file_size: form.inputType === 'file' ? fileSize : null,
        file_type: form.inputType === 'file' ? fileType : null,
        external_url: form.inputType === 'url' ? form.external_url.trim() || null : null,
        service: form.service || null,
        is_pinned: form.is_pinned,
        updated_at: new Date().toISOString(),
      }

      if (resource) {
        await supabase.from('internal_resources').update(payload).eq('id', resource.id)
      } else {
        await supabase.from('internal_resources').insert({ ...payload, created_by: userId })
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#12101A] border border-[#1E1C2A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#1E1C2A]">
          <h2 className="text-base font-bold text-white">{resource ? 'Editar recurso' : 'Subir nuevo recurso'}</h2>
          <button onClick={onClose} className="text-[#6B6B80] hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5 block">Título *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Propuesta Comercial Claudia Q1 2026"
              className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#6B6B80] outline-none focus:border-[#C026A8]/40"
            />
          </div>

          {/* Category + Service */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5 block">Categoría *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#C026A8]/40"
              >
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5 block">Servicio</label>
              <select
                value={form.service}
                onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#C026A8]/40"
              >
                <option value="">Todos</option>
                {Object.entries(SERVICE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5 block">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Breve descripción del recurso..."
              rows={2}
              className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#6B6B80] outline-none focus:border-[#C026A8]/40 resize-none"
            />
          </div>

          {/* Type toggle */}
          <div>
            <label className="text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-2 block">Tipo de recurso</label>
            <div className="flex gap-2">
              {(['file', 'url'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setForm(f => ({ ...f, inputType: type }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    form.inputType === type
                      ? 'border-[#C026A8] bg-[#C026A8]/10 text-[#C026A8]'
                      : 'border-[#1E1C2A] bg-[#1A1825] text-[#6B6B80] hover:text-white'
                  }`}
                >
                  {type === 'file' ? '📁 Subir archivo' : '🔗 Enlace externo'}
                </button>
              ))}
            </div>
          </div>

          {/* File or URL input */}
          {form.inputType === 'file' ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-[#C026A8] bg-[#C026A8]/5' : 'border-[#1E1C2A] hover:border-[#C026A8]/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]) }}
              />
              {selectedFile ? (
                <div className="text-sm text-white">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-[#6B6B80] text-xs mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : resource?.file_name ? (
                <div className="text-sm text-[#6B6B80]">
                  <p>Archivo actual: <span className="text-white">{resource.file_name}</span></p>
                  <p className="text-xs mt-1">Arrastra un nuevo archivo para reemplazarlo</p>
                </div>
              ) : (
                <div className="text-sm text-[#6B6B80]">
                  <Upload size={20} className="mx-auto mb-2 text-[#6B6B80]" />
                  <p>Arrastra un archivo aquí o haz clic para seleccionar</p>
                  <p className="text-xs mt-1">PDF, Word, Excel, imágenes, HTML — máx 50MB</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5 block">URL del enlace</label>
              <input
                value={form.external_url}
                onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#6B6B80] outline-none focus:border-[#C026A8]/40"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5 block">Etiquetas</label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="propuesta, claudia, ventas (separadas por coma)"
              className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#6B6B80] outline-none focus:border-[#C026A8]/40"
            />
            {form.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-[#C026A8]/10 border border-[#C026A8]/20 rounded-full text-[#C026A8]">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Pin toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, is_pinned: !f.is_pinned }))}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.is_pinned ? 'bg-[#C8F135]' : 'bg-[#1A1825] border border-[#1E1C2A]'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_pinned ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-[#6B6B80]">Fijar en destacados</span>
          </label>
        </div>

        <div className="flex gap-3 p-5 border-t border-[#1E1C2A]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-[#1A1825] border border-[#1E1C2A] text-sm text-[#6B6B80] hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#E040A0,#C026A8,#8B22E8)' }}
          >
            {saving ? 'Guardando…' : resource ? 'Guardar cambios' : 'Subir recurso'}
          </button>
        </div>
      </div>
    </div>
  )
}
