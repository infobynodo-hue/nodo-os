import { useEffect, useState } from 'react'
import {
  GraduationCap, Plus, Edit2, Trash2, Eye, EyeOff,
  Play, Globe, User, Clock, ChevronDown, X, Save,
  Bot, MessageCircle, Smartphone, Zap, Search,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { IS_DEMO } from '../../store/auth'
import { TUTORIAL_CATEGORY_LABELS } from '../../types'
import type { ClientTutorial, TutorialCategory, Client } from '../../types'

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_GUIAS: ClientTutorial[] = [
  { id: 't0', title: 'Bienvenido a NODO ONE: Guía de inicio rápido', description: 'Aprende a navegar por tu portal y por dónde empezar.', category: 'general', duration_min: 12, is_global: true, order_index: 0, is_published: true, created_at: new Date().toISOString() },
  { id: 't1', title: 'Cómo añadir información nueva a tu agente', description: 'Cuando cambies precios o añadas servicios nuevos.', category: 'bot', duration_min: 6, is_global: true, order_index: 1, is_published: true, created_at: new Date().toISOString() },
  { id: 't2', title: 'Cómo corregir una respuesta incorrecta', description: '¿Tu agente respondió algo que no era correcto? Aquí lo corregimos.', category: 'bot', duration_min: 5, is_global: true, order_index: 2, is_published: true, created_at: new Date().toISOString() },
  { id: 't3', title: 'Cómo pausar a tu agente temporalmente', description: 'Para vacaciones, días festivos o pausas puntuales.', category: 'bot', duration_min: 4, is_global: true, order_index: 3, is_published: false, created_at: new Date().toISOString() },
  { id: 't4', title: 'Cómo etiquetar conversaciones en el CRM', description: 'Organiza las conversaciones por categorías.', category: 'crm', duration_min: 8, is_global: true, order_index: 4, is_published: true, created_at: new Date().toISOString() },
  { id: 't5', title: 'Qué tocar y qué NO tocar en WhatsApp Business', description: 'Configuraciones críticas que no se deben cambiar.', category: 'whatsapp', duration_min: 10, is_global: true, order_index: 6, is_published: true, created_at: new Date().toISOString() },
]

const DEMO_CLIENTS: Pick<Client, 'id' | 'business_name'>[] = [
  { id: 'demo-client-1', business_name: 'FitLife Studio' },
]

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<TutorialCategory, React.ElementType> = {
  general: GraduationCap, bot: Bot, crm: MessageCircle, plataformas: Smartphone, whatsapp: Zap,
}
const CATEGORY_COLORS: Record<TutorialCategory, string> = {
  general: 'text-amber-400 bg-amber-500/10', bot: 'text-[#C026A8] bg-[#C026A8]/10',
  crm: 'text-blue-400 bg-blue-500/10', plataformas: 'text-emerald-400 bg-emerald-500/10',
  whatsapp: 'text-green-400 bg-green-500/10',
}

// ─── Form types ───────────────────────────────────────────────────────────────
interface TutorialForm {
  title: string
  description: string
  category: TutorialCategory
  video_url: string
  duration_min: string
  is_global: boolean
  client_id: string
  is_published: boolean
  order_index: string
}

const EMPTY_FORM: TutorialForm = {
  title: '', description: '', category: 'general', video_url: '',
  duration_min: '', is_global: true, client_id: '', is_published: true, order_index: '0',
}

// ─── Guia row ─────────────────────────────────────────────────────────────────
function GuiaRow({
  guia, clientName, onEdit, onDelete, onTogglePublish,
}: {
  guia: ClientTutorial
  clientName?: string
  onEdit: (g: ClientTutorial) => void
  onDelete: (id: string) => void
  onTogglePublish: (g: ClientTutorial) => void
}) {
  const CatIcon = CATEGORY_ICONS[guia.category] ?? GraduationCap
  const catColor = CATEGORY_COLORS[guia.category] ?? CATEGORY_COLORS.general

  return (
    <div className={`flex items-center gap-4 px-5 py-3.5 border-b border-[#1E1C2A] hover:bg-white/3 transition-colors ${!guia.is_published ? 'opacity-50' : ''}`}>
      {/* Category icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${catColor}`}>
        <CatIcon size={14} />
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white truncate">{guia.title}</p>
          {!guia.is_published && (
            <span className="text-[10px] font-bold text-[#6B6B80] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 uppercase tracking-wide">Borrador</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-[#6B6B80]">{TUTORIAL_CATEGORY_LABELS[guia.category]}</span>
          {guia.duration_min && (
            <span className="flex items-center gap-1 text-[11px] text-[#6B6B80]">
              <Clock size={10} /> {guia.duration_min} min
            </span>
          )}
          {guia.video_url && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-500">
              <Play size={10} /> Con vídeo
            </span>
          )}
          {guia.is_global ? (
            <span className="flex items-center gap-1 text-[11px] text-blue-400">
              <Globe size={10} /> Todos los clientes
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-[#C026A8]">
              <User size={10} /> {clientName ?? 'Cliente específico'}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onTogglePublish(guia)}
          title={guia.is_published ? 'Despublicar' : 'Publicar'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B80] hover:text-white hover:bg-white/8 transition-all"
        >
          {guia.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          onClick={() => onEdit(guia)}
          title="Editar"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B80] hover:text-white hover:bg-white/8 transition-all"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => onDelete(guia.id)}
          title="Eliminar"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B80] hover:text-red-400 hover:bg-red-500/8 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Form modal ───────────────────────────────────────────────────────────────
function GuiaModal({
  initial, clients, onSave, onClose,
}: {
  initial: TutorialForm & { id?: string }
  clients: Pick<Client, 'id' | 'business_name'>[]
  onSave: (form: TutorialForm & { id?: string }) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  const set = (k: keyof TutorialForm, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await onSave({ ...form, id: initial.id })
    setSaving(false)
  }

  const categories: TutorialCategory[] = ['general', 'bot', 'crm', 'plataformas', 'whatsapp']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg bg-[#12101A] border border-[#1E1C2A] rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1C2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <GraduationCap size={14} className="text-amber-400" />
            </div>
            <p className="text-sm font-bold text-white">
              {initial.id ? 'Editar guía' : 'Nueva guía de uso'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B6B80] hover:text-white hover:bg-white/8 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5">Título *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ej: Cómo pausar a tu agente temporalmente"
              required
              className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#6B6B80] focus:outline-none focus:border-[#C026A8]/50 transition-colors"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Explica en 1-2 frases qué aprenderá el cliente con este vídeo..."
              rows={2}
              className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#6B6B80] focus:outline-none focus:border-[#C026A8]/50 transition-colors resize-none"
            />
          </div>

          {/* Categoría + Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5">Categoría</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C026A8]/50 transition-colors appearance-none"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{TUTORIAL_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B80] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5">Duración (min)</label>
              <input
                type="number"
                value={form.duration_min}
                onChange={e => set('duration_min', e.target.value)}
                placeholder="5"
                min={1}
                className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#6B6B80] focus:outline-none focus:border-[#C026A8]/50 transition-colors"
              />
            </div>
          </div>

          {/* URL del vídeo */}
          <div>
            <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5">
              URL del vídeo
              <span className="ml-2 font-normal normal-case text-[#6B6B80]/70">(YouTube, Vimeo o enlace directo)</span>
            </label>
            <input
              value={form.video_url}
              onChange={e => set('video_url', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#6B6B80] focus:outline-none focus:border-[#C026A8]/50 transition-colors"
            />
          </div>

          {/* Visibilidad */}
          <div>
            <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-2">Visibilidad</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set('is_global', true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.is_global
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                    : 'bg-[#1A1825] border-[#1E1C2A] text-[#6B6B80] hover:text-white'
                }`}
              >
                <Globe size={14} /> Todos los clientes
              </button>
              <button
                type="button"
                onClick={() => set('is_global', false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  !form.is_global
                    ? 'bg-[#C026A8]/15 border-[#C026A8]/30 text-[#C026A8]'
                    : 'bg-[#1A1825] border-[#1E1C2A] text-[#6B6B80] hover:text-white'
                }`}
              >
                <User size={14} /> Cliente específico
              </button>
            </div>
          </div>

          {/* Selector de cliente (solo si no es global) */}
          {!form.is_global && (
            <div>
              <label className="block text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1.5">Cliente</label>
              <div className="relative">
                <select
                  value={form.client_id}
                  onChange={e => set('client_id', e.target.value)}
                  required={!form.is_global}
                  className="w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C026A8]/50 transition-colors appearance-none"
                >
                  <option value="">Selecciona un cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.business_name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B80] pointer-events-none" />
              </div>
            </div>
          )}

          {/* Estado publicación */}
          <div className="flex items-center justify-between rounded-xl bg-[#1A1825] border border-[#1E1C2A] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Publicado</p>
              <p className="text-xs text-[#6B6B80] mt-0.5">Los clientes podrán verlo inmediatamente</p>
            </div>
            <button
              type="button"
              onClick={() => set('is_published', !form.is_published)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.is_published ? 'bg-[#C026A8]' : 'bg-white/15'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_published ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#1E1C2A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-[#6B6B80] hover:text-white hover:bg-white/8 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #E040A0, #C026A8, #8B22E8)' }}
          >
            <Save size={14} />
            {saving ? 'Guardando...' : initial.id ? 'Guardar cambios' : 'Crear guía'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
type FilterTab = 'all' | 'global' | 'exclusive'

export function GuiasPage() {
  const [guias, setGuias] = useState<ClientTutorial[]>([])
  const [clients, setClients] = useState<Pick<Client, 'id' | 'business_name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<(TutorialForm & { id?: string }) | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    if (IS_DEMO) {
      setGuias(DEMO_GUIAS)
      setClients(DEMO_CLIENTS)
      setLoading(false)
      return
    }
    const [guiasRes, clientsRes] = await Promise.all([
      supabase.from('client_tutorials').select('*').order('order_index'),
      supabase.from('clients').select('id, business_name').order('business_name'),
    ])
    setGuias(guiasRes.data || [])
    setClients(clientsRes.data || [])
    setLoading(false)
  }

  async function handleSave(form: TutorialForm & { id?: string }) {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      video_url: form.video_url.trim() || null,
      duration_min: form.duration_min ? parseInt(form.duration_min) : null,
      is_global: form.is_global,
      client_id: !form.is_global && form.client_id ? form.client_id : null,
      is_published: form.is_published,
      order_index: parseInt(form.order_index) || 0,
    }

    if (IS_DEMO) {
      if (form.id) {
        setGuias(prev => prev.map(g => g.id === form.id ? { ...g,
          title: payload.title, description: payload.description ?? undefined,
          category: payload.category, video_url: payload.video_url ?? undefined,
          duration_min: payload.duration_min ?? undefined, is_global: payload.is_global,
          client_id: payload.client_id ?? undefined, is_published: payload.is_published,
          order_index: payload.order_index,
        } : g))
      } else {
        setGuias(prev => [...prev, { id: `demo-${Date.now()}`, ...payload, description: payload.description ?? undefined, video_url: payload.video_url ?? undefined, duration_min: payload.duration_min ?? undefined, client_id: payload.client_id ?? undefined, created_at: new Date().toISOString() } as ClientTutorial])
      }
      setModal(null)
      return
    }

    if (form.id) {
      await supabase.from('client_tutorials').update(payload).eq('id', form.id)
    } else {
      await supabase.from('client_tutorials').insert(payload)
    }
    await loadData()
    setModal(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta guía? Esta acción no se puede deshacer.')) return
    if (IS_DEMO) { setGuias(prev => prev.filter(g => g.id !== id)); return }
    await supabase.from('client_tutorials').delete().eq('id', id)
    setGuias(prev => prev.filter(g => g.id !== id))
  }

  async function handleTogglePublish(guia: ClientTutorial) {
    const updated = !guia.is_published
    if (IS_DEMO) {
      setGuias(prev => prev.map(g => g.id === guia.id ? { ...g, is_published: updated } : g))
      return
    }
    await supabase.from('client_tutorials').update({ is_published: updated }).eq('id', guia.id)
    setGuias(prev => prev.map(g => g.id === guia.id ? { ...g, is_published: updated } : g))
  }

  function openNew() {
    setModal({ ...EMPTY_FORM })
  }

  function openEdit(g: ClientTutorial) {
    setModal({
      id: g.id,
      title: g.title,
      description: g.description ?? '',
      category: g.category,
      video_url: g.video_url ?? '',
      duration_min: g.duration_min?.toString() ?? '',
      is_global: g.is_global,
      client_id: g.client_id ?? '',
      is_published: g.is_published,
      order_index: g.order_index.toString(),
    })
  }

  const filtered = guias.filter(g => {
    const matchesTab = tab === 'all' || (tab === 'global' && g.is_global) || (tab === 'exclusive' && !g.is_global)
    const matchesSearch = !search || g.title.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.business_name]))

  const globalCount   = guias.filter(g => g.is_global).length
  const exclusiveCount = guias.filter(g => !g.is_global).length
  const publishedCount = guias.filter(g => g.is_published).length

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F6F9]">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <GraduationCap size={20} className="text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1A1F2E]">Guías de uso</h1>
              <p className="text-sm text-[#6B7280]">Gestiona el contenido que ven tus clientes en su portal</p>
            </div>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #E040A0, #C026A8, #8B22E8)' }}
          >
            <Plus size={15} /> Nueva guía
          </button>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total de guías', value: guias.length, color: 'text-[#1A1F2E]' },
            { label: 'Publicadas', value: publishedCount, color: 'text-emerald-600' },
            { label: 'Exclusivas por cliente', value: exclusiveCount, color: 'text-[#C026A8]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#E5E7EB] px-5 py-4 shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filters + search ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F3F4F6]">
            {/* Tabs */}
            <div className="flex gap-1">
              {([
                { id: 'all',       label: `Todas (${guias.length})` },
                { id: 'global',    label: `Globales (${globalCount})` },
                { id: 'exclusive', label: `Exclusivas (${exclusiveCount})` },
              ] as { id: FilterTab; label: string }[]).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tab === t.id
                      ? 'bg-[#1A1F2E] text-white'
                      : 'text-[#6B7280] hover:text-[#1A1F2E] hover:bg-[#F9FAFB]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar guía..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs text-[#1A1F2E] bg-[#F9FAFB] focus:outline-none focus:border-[#C026A8]/40 w-48 transition-colors"
              />
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap size={36} className="text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280] font-medium">
                {search ? 'No se encontraron guías con ese nombre.' : 'Aún no hay guías en esta categoría.'}
              </p>
              {!search && (
                <button onClick={openNew} className="mt-3 text-xs text-[#C026A8] hover:underline font-medium">
                  Crear la primera guía →
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {filtered.map(g => (
                <GuiaRow
                  key={g.id}
                  guia={g}
                  clientName={g.client_id ? clientMap[g.client_id] : undefined}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                />
              ))}
            </div>
          )}
        </div>

        {/* Helper tip */}
        <div className="mt-4 flex items-start gap-2 text-xs text-[#9CA3AF]">
          <span className="mt-0.5">💡</span>
          <p>
            Las guías <strong className="text-[#6B7280]">globales</strong> aparecen en el portal de todos los clientes.
            Las <strong className="text-[#6B7280]">exclusivas</strong> solo las ve el cliente al que se las asignas —
            aparecen destacadas con badge "Solo para ti".
          </p>
        </div>

      </div>

      {/* Modal */}
      {modal && (
        <GuiaModal
          initial={modal}
          clients={clients}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
