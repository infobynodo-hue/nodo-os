import { useEffect, useState } from 'react'
import { Brain, BookOpen, CheckCircle, XCircle, ArrowRight, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { DEMO_BOT_KNOWLEDGE } from '../../lib/demo'
import { NodoCard } from '../../components/ui/NodoCard'
import { NodoProgressBar } from '../../components/ui/NodoProgressBar'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY
import { KNOWLEDGE_CATEGORY_LABELS } from '../../types'
import type { BotKnowledge, KnowledgeCategory } from '../../types'

type GroupedKnowledge = Partial<Record<KnowledgeCategory, BotKnowledge[]>>

// Key onboarding fields to check for completeness
const ONBOARDING_FIELDS: Array<{ key: string; label: string; keywords: string[] }> = [
  { key: 'greeting', label: 'Saludo / presentación', keywords: ['descripcion_general', 'personalidad_tono'] },
  { key: 'services', label: 'Servicios / productos', keywords: ['servicios_activos'] },
  { key: 'pricing', label: 'Precios', keywords: ['servicios_activos'] },
  { key: 'hours', label: 'Horarios de atención', keywords: ['horarios_disponibilidad'] },
  { key: 'faqs', label: 'Preguntas frecuentes', keywords: ['preguntas_frecuentes'] },
  { key: 'tone', label: 'Tono de comunicación', keywords: ['personalidad_tono'] },
]

function computeOnboardingCompletion(knowledge: GroupedKnowledge): Array<{ label: string; complete: boolean }> {
  return ONBOARDING_FIELDS.map(field => ({
    label: field.label,
    complete: field.keywords.some(kw => {
      const cat = kw as KnowledgeCategory
      const items = knowledge[cat]
      return items && items.length > 0
    }),
  }))
}

export function ClientBotPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [knowledge, setKnowledge] = useState<GroupedKnowledge>({})
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory | null>(null)

  useEffect(() => {
    loadData()
  }, [user])

  async function loadData() {
    if (IS_DEMO) {
      const grouped: GroupedKnowledge = {}
      for (const item of DEMO_BOT_KNOWLEDGE) {
        const cat = item.category as KnowledgeCategory
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat]!.push(item)
      }
      setKnowledge(grouped)
      setLoading(false)
      return
    }
    if (!user?.projectId) { setLoading(false); return }
    const { data } = await supabase
      .from('bot_knowledge')
      .select('*')
      .eq('project_id', user.projectId)
      .eq('is_visible_to_client', true)
      .order('order_index')
    setLoading(false)

    const grouped: GroupedKnowledge = {}
    for (const item of data || []) {
      const cat = item.category as KnowledgeCategory
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat]!.push(item)
    }
    setKnowledge(grouped)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const categories = Object.keys(knowledge) as KnowledgeCategory[]
  const onboardingFields = computeOnboardingCompletion(knowledge)
  const completedCount = onboardingFields.filter(f => f.complete).length
  const completionPct = Math.round((completedCount / onboardingFields.length) * 100)

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 fade-in w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E040A0]/10 to-[#8B22E8]/10 flex items-center justify-center">
          <Brain size={18} className="text-[#C026A8]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1A1827]">Base del Bot</h1>
          <p className="text-sm text-[#6B6B80]">Lo que sabe tu empleado digital</p>
        </div>
      </div>

      {/* Onboarding Progress Card */}
      <div className="rounded-2xl border border-[#E8E6F0] bg-white p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-[#1A1827]">Completitud del Onboarding</p>
            <p className="text-xs text-[#6B6B80] mt-0.5">{completedCount} de {onboardingFields.length} campos configurados</p>
          </div>
          <span className="text-2xl font-bold gradient-text">{completionPct}%</span>
        </div>
        <NodoProgressBar value={completionPct} size="sm" />

        {/* Field checklist */}
        <div className="grid grid-cols-2 gap-1.5 mt-3">
          {onboardingFields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {field.complete ? (
                <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle size={13} className="text-[#6B6B80] flex-shrink-0" />
              )}
              <span className={`text-xs ${field.complete ? 'text-[#2D2B3A]' : 'text-[#6B6B80]'}`}>
                {field.label}
              </span>
            </div>
          ))}
        </div>

        {completionPct < 100 && (
          <button
            onClick={() => navigate('/client/chat')}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #E040A0, #C026A8 50%, #8B22E8)' }}
          >
            <Zap size={13} />
            Completar con el agente
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <NodoCard dark className="text-center py-12">
          <Brain size={32} className="text-[#BBBBCC] mx-auto mb-3" />
          <p className="text-sm text-[#6B6B80]">La base de conocimiento aún está siendo configurada.</p>
          <p className="text-xs text-[#9999AA] mt-1">Vuelve más adelante cuando tu proyecto esté más avanzado.</p>
        </NodoCard>
      ) : (
        <>
          {/* Category tabs */}
          {categories.length > 1 && (
            <div className="flex gap-1.5 flex-wrap mb-4">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === null
                    ? 'bg-[#C026A8]/15 text-[#C026A8] border border-[#C026A8]/30'
                    : 'text-[#6B6B80] hover:text-[#1A1827] hover:bg-[#F4F3F9] border border-transparent'
                }`}
              >
                Todo
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-[#C026A8]/15 text-[#C026A8] border border-[#C026A8]/30'
                      : 'text-[#6B6B80] hover:text-[#1A1827] hover:bg-[#F4F3F9] border border-transparent'
                  }`}
                >
                  {KNOWLEDGE_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-5">
            {(activeCategory ? [activeCategory] : categories).map((cat) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2.5">
                  <BookOpen size={12} className="text-[#C026A8]" />
                  <p className="text-xs font-semibold text-[#C026A8] uppercase tracking-wider">
                    {KNOWLEDGE_CATEGORY_LABELS[cat]}
                  </p>
                </div>
                <div className="space-y-2">
                  {knowledge[cat]!.map((item) => (
                    <NodoCard key={item.id} dark padding="md">
                      <p className="text-sm font-semibold text-[#1A1827] mb-1.5">{item.title}</p>
                      <p className="text-sm text-[#4D4B60] leading-relaxed whitespace-pre-wrap">{item.content}</p>
                    </NodoCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
