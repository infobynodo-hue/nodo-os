import { useEffect, useState } from 'react'
import {
  GraduationCap, Play, Clock, Star, ExternalLink, X,
  Bot, MessageCircle, Smartphone, Zap, BookOpen, ChevronRight,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore, IS_DEMO } from '../../store/auth'
import { TUTORIAL_CATEGORY_LABELS } from '../../types'
import type { ClientTutorial, TutorialCategory } from '../../types'

// ─── Demo tutorials ───────────────────────────────────────────────────────────
const DEMO_TUTORIALS: ClientTutorial[] = [
  {
    id: 't0', title: 'Bienvenido a NODO ONE: Guía de inicio rápido',
    description: 'Aprende a navegar por tu portal, qué hace cada sección y por dónde empezar para sacarle el máximo partido a tu empleada digital desde el primer día.',
    category: 'general', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_min: 12, is_global: true, order_index: 0, is_published: true, created_at: new Date().toISOString(),
  },
  {
    id: 't1', title: 'Cómo añadir información nueva a tu agente',
    description: 'Cuando cambies precios, añadas un servicio nuevo o quieras que tu agente aprenda algo, aquí te explicamos exactamente cómo hacerlo en 3 pasos sencillos.',
    category: 'bot', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_min: 6, is_global: true, order_index: 1, is_published: true, created_at: new Date().toISOString(),
  },
  {
    id: 't2', title: 'Cómo corregir una respuesta incorrecta de tu agente',
    description: '¿Tu agente respondió algo que no era del todo correcto? Te mostramos cómo reportarlo y corregirlo para que no vuelva a pasar.',
    category: 'bot', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_min: 5, is_global: true, order_index: 2, is_published: true, created_at: new Date().toISOString(),
  },
  {
    id: 't3', title: 'Cómo pausar a tu agente temporalmente',
    description: 'Si tienes vacaciones, días festivos o necesitas pausar el servicio por cualquier motivo, aprende a desactivar a tu agente sin perder ninguna configuración.',
    category: 'bot', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_min: 4, is_global: true, order_index: 3, is_published: true, created_at: new Date().toISOString(),
  },
  {
    id: 't4', title: 'Cómo etiquetar conversaciones en el CRM',
    description: 'Organiza las conversaciones de tu agente por categorías: ventas, soporte, quejas, urgente. Así sabrás exactamente de qué habló cada cliente.',
    category: 'crm', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_min: 8, is_global: true, order_index: 4, is_published: true, created_at: new Date().toISOString(),
  },
  {
    id: 't5', title: 'Cómo escalar una conversación al equipo humano',
    description: 'Cuando un cliente necesita atención humana, tu agente puede pasar la conversación a una persona de tu equipo. Aprende cuándo y cómo funciona esto.',
    category: 'crm', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_min: 7, is_global: true, order_index: 5, is_published: true, created_at: new Date().toISOString(),
  },
  {
    id: 't6', title: 'Qué tocar y qué NO tocar en WhatsApp Business',
    description: 'Hay configuraciones en WhatsApp Business que, si se cambian, pueden afectar a tu agente. Te explicamos exactamente qué puedes cambiar tú y qué debes dejar como está.',
    category: 'whatsapp', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_min: 10, is_global: true, order_index: 6, is_published: true, created_at: new Date().toISOString(),
  },
  {
    id: 't7', title: 'Cómo revisar el historial de conversaciones',
    description: 'Accede a todas las conversaciones que ha tenido tu agente, busca por fecha o cliente, y descarga el historial cuando lo necesites.',
    category: 'whatsapp', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_min: 5, is_global: true, order_index: 7, is_published: true, created_at: new Date().toISOString(),
  },
  {
    id: 't8', title: 'Cómo revisar el reporte semanal de tu agente',
    description: 'Cada semana recibes un resumen de lo que hizo tu agente. Aprende a interpretarlo: cuántas conversaciones tuvo, qué preguntaron más y cómo está evolucionando.',
    category: 'general', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_min: 4, is_global: true, order_index: 8, is_published: true, created_at: new Date().toISOString(),
  },
]

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<TutorialCategory, { icon: React.ElementType; gradient: string; color: string }> = {
  general:     { icon: GraduationCap, gradient: 'from-amber-500 to-orange-600',    color: 'text-amber-400' },
  bot:         { icon: Bot,           gradient: 'from-[#E040A0] to-[#8B22E8]',     color: 'text-[#C026A8]' },
  crm:         { icon: MessageCircle, gradient: 'from-blue-500 to-blue-700',        color: 'text-blue-400' },
  plataformas: { icon: Smartphone,    gradient: 'from-emerald-500 to-teal-600',     color: 'text-emerald-400' },
  whatsapp:    { icon: Zap,           gradient: 'from-green-500 to-green-700',      color: 'text-green-400' },
}

// ─── Video helpers — YouTube · Loom · Vimeo ───────────────────────────────────
function getEmbedUrl(url: string): string | null {
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`
  // Loom
  const loom = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/)
  if (loom) return `https://www.loom.com/embed/${loom[1]}?autoplay=1`
  // Vimeo
  const vimeo = url.match(/(?:vimeo\.com\/)([0-9]+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`
  return null
}

function getVideoThumbnail(url: string): string | null {
  const yt   = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  if (yt)   return `https://img.youtube.com/vi/${yt[1]}/mqdefault.jpg`
  const loom = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/)
  if (loom) return `https://cdn.loom.com/sessions/thumbnails/${loom[1]}-with-play.gif`
  return null
}

function getVideoPlatform(url: string): 'youtube' | 'loom' | 'vimeo' | 'otro' {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/loom\.com/.test(url))             return 'loom'
  if (/vimeo\.com/.test(url))            return 'vimeo'
  return 'otro'
}

const PLATFORM_LABELS = { youtube: 'YouTube', loom: 'Loom', vimeo: 'Vimeo', otro: 'Ver enlace' }

// ─── Tutorial card ────────────────────────────────────────────────────────────
function TutorialCard({
  tutorial,
  onPlay,
  isExclusive,
}: {
  tutorial: ClientTutorial
  onPlay: (t: ClientTutorial) => void
  isExclusive?: boolean
}) {
  const cfg = CATEGORY_CONFIG[tutorial.category] ?? CATEGORY_CONFIG.general
  const CatIcon = cfg.icon
  const thumb    = tutorial.thumbnail_url || (tutorial.video_url ? getVideoThumbnail(tutorial.video_url) : null)
  const platform = tutorial.video_url ? getVideoPlatform(tutorial.video_url) : null

  return (
    <div className="rounded-2xl border border-[#E8E6F0] bg-white overflow-hidden group hover:border-[#C026A8]/30 transition-all hover:translate-y-[-2px]">
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden">
        {thumb ? (
          <img src={thumb} alt={tutorial.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${cfg.gradient} opacity-80 flex items-center justify-center`}>
            <CatIcon size={40} className="text-white/50" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPlay(tutorial)}
            className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
          >
            <Play size={22} className="text-[#12101A] ml-1" fill="#12101A" />
          </button>
        </div>
        {/* Duration + platform badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {platform && platform !== 'otro' && (
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-2 py-0.5">
              <span className="text-[10px] text-white/70 font-medium">{PLATFORM_LABELS[platform]}</span>
            </div>
          )}
          {tutorial.duration_min && (
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-2 py-0.5">
              <Clock size={10} className="text-white/70" />
              <span className="text-[10px] text-white/80 font-medium">{tutorial.duration_min} min</span>
            </div>
          )}
        </div>
        {/* Exclusive badge */}
        {isExclusive && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#C026A8]/90 backdrop-blur-sm rounded-md px-2 py-0.5">
            <Star size={9} className="text-white" fill="white" />
            <span className="text-[9px] text-white font-bold uppercase tracking-wide">Para ti</span>
          </div>
        )}
        {/* Category badge */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-2 py-0.5 ${isExclusive ? 'hidden' : ''}`}>
          <CatIcon size={9} className={cfg.color} />
          <span className={`text-[9px] font-semibold ${cfg.color}`}>{TUTORIAL_CATEGORY_LABELS[tutorial.category]}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-sm font-bold text-[#1A1827] leading-snug mb-1.5 line-clamp-2">{tutorial.title}</p>
        <p className="text-xs text-[#6B6B80] leading-relaxed line-clamp-2">{tutorial.description}</p>
        <button
          onClick={() => onPlay(tutorial)}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#C026A8] hover:text-[#E040A0] transition-colors"
        >
          <Play size={11} fill="currentColor" /> Ver tutorial <ChevronRight size={11} />
        </button>
      </div>
    </div>
  )
}

// ─── Video modal ──────────────────────────────────────────────────────────────
function VideoModal({ tutorial, onClose }: { tutorial: ClientTutorial; onClose: () => void }) {
  const embedUrl = tutorial.video_url ? getEmbedUrl(tutorial.video_url) : null
  const platform = tutorial.video_url ? getVideoPlatform(tutorial.video_url) : 'otro'

  // Allow params for Loom (hide owner info for cleaner embed)
  const finalEmbed = embedUrl && platform === 'loom'
    ? embedUrl + '&hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true'
    : embedUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-3xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-4">
            {platform !== 'otro' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/50 flex-shrink-0">
                {PLATFORM_LABELS[platform]}
              </span>
            )}
            <p className="text-sm font-bold text-white line-clamp-1">{tutorial.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors">
            <X size={15} className="text-white" />
          </button>
        </div>

        {/* Player */}
        {finalEmbed ? (
          <div className="relative rounded-2xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={finalEmbed}
              title={tutorial.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              frameBorder="0"
            />
          </div>
        ) : (
          /* Enlace externo — para URLs que no son YouTube/Loom/Vimeo */
          <div className="rounded-2xl bg-[#12101A] border border-[#1E1C2A] p-12 text-center">
            <BookOpen size={40} className="text-[#BBBBCC] mx-auto mb-4" />
            <p className="text-sm text-[#6B6B80] mb-4">Este tutorial está disponible en un enlace externo.</p>
            {tutorial.video_url && (
              <a
                href={tutorial.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #E040A0, #C026A8, #8B22E8)' }}
              >
                <ExternalLink size={15} /> Abrir tutorial
              </a>
            )}
          </div>
        )}

        {/* Description + fallback link */}
        <div className="flex items-start justify-between gap-4 mt-3 px-1">
          {tutorial.description && (
            <p className="text-xs text-[#6B6B80] leading-relaxed flex-1">{tutorial.description}</p>
          )}
          {tutorial.video_url && finalEmbed && (
            <a
              href={tutorial.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors flex-shrink-0 mt-0.5"
            >
              <ExternalLink size={10} /> Abrir en {PLATFORM_LABELS[platform]}
            </a>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const ALL_CATEGORIES: TutorialCategory[] = ['general', 'bot', 'crm', 'plataformas', 'whatsapp']

export function ClientAcademiaPage() {
  const { user } = useAuthStore()
  const [tutorials, setTutorials] = useState<ClientTutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<TutorialCategory | 'all'>('all')
  const [playing, setPlaying] = useState<ClientTutorial | null>(null)

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    setLoading(true)
    if (IS_DEMO) {
      setTutorials(DEMO_TUTORIALS)
      setLoading(false)
      return
    }
    if (!user?.clientId) { setLoading(false); return }

    const { data } = await supabase
      .from('client_tutorials')
      .select('*')
      .eq('is_published', true)
      .or(`is_global.eq.true,client_id.eq.${user.clientId}`)
      .order('order_index')

    setTutorials(data || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const exclusive = tutorials.filter(t => !t.is_global && t.client_id === user?.clientId)
  const filtered = tutorials.filter(t =>
    t.is_global &&
    (activeCategory === 'all' || t.category === activeCategory)
  )

  // Categories with at least 1 tutorial
  const activeCategories = ALL_CATEGORIES.filter(c => tutorials.some(t => t.category === c && t.is_global))

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 fade-in w-full">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 flex items-center justify-center">
          <GraduationCap size={18} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1A1827]">Guías de uso</h1>
          <p className="text-sm text-[#6B6B80]">Todo lo que necesitas saber para usar tu servicio sin complicaciones</p>
        </div>
      </div>

      {/* ── Tutoriales exclusivos para este cliente ────────────────────────── */}
      {exclusive.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <Star size={13} className="text-[#C026A8]" fill="#C026A8" />
            <p className="text-xs font-bold text-[#C026A8] uppercase tracking-wider">Solo para ti</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exclusive.map(t => (
              <TutorialCard key={t.id} tutorial={t} onPlay={setPlaying} isExclusive />
            ))}
          </div>
        </div>
      )}

      {/* ── Filtros por categoría ─────────────────────────────────────────── */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
            activeCategory === 'all'
              ? 'bg-[#C026A8]/15 text-[#C026A8] border-[#C026A8]/30'
              : 'text-[#6B6B80] border-transparent hover:text-[#1A1827] hover:bg-[#F4F3F9]'
          }`}
        >Todos</button>
        {activeCategories.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat]
          const CatIcon = cfg.icon
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                activeCategory === cat
                  ? 'bg-[#C026A8]/15 text-[#C026A8] border-[#C026A8]/30'
                  : 'text-[#6B6B80] border-transparent hover:text-[#1A1827] hover:bg-[#F4F3F9]'
              }`}
            >
              <CatIcon size={11} /> {TUTORIAL_CATEGORY_LABELS[cat]}
            </button>
          )
        })}
      </div>

      {/* ── Grid de tutoriales ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#1E1C2A] bg-[#F7F6FC] p-12 text-center">
          <GraduationCap size={36} className="text-[#BBBBCC] mx-auto mb-3" />
          <p className="text-sm text-[#6B6B80] font-medium">Sin tutoriales en esta categoría</p>
          <p className="text-xs text-[#9999AA] mt-1">Pronto añadiremos más contenido aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TutorialCard key={t.id} tutorial={t} onPlay={setPlaying} />
          ))}
        </div>
      )}

      {/* ── Modal de vídeo ────────────────────────────────────────────────── */}
      {playing && <VideoModal tutorial={playing} onClose={() => setPlaying(null)} />}

    </div>
  )
}
