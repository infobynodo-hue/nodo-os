import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Play, X, ChevronRight, CheckCircle, AlertTriangle, XCircle,
  Loader2, RotateCcw, Bot, User, Sparkles, Plus, Minus, Upload,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { NodoButton } from '../../components/ui/NodoButton'
import { NodoCard } from '../../components/ui/NodoCard'

// ─── Persona library ──────────────────────────────────────────────────────────
const PERSONAS = [
  { id: 'molesto',       emoji: '😤', label: 'Molesto',           desc: 'Queja, tono agresivo, exige solución',  color: '#ef4444', bg: '#fef2f2', prompt: 'Eres un cliente frustrado. Tuviste un problema previo y vienes a reclamar. Tu tono es directo e impaciente. Exiges soluciones concretas y rápidas. Si el bot no te satisface, escala tu frustración levemente.' },
  { id: 'curioso',       emoji: '🤔', label: 'Curioso',            desc: 'Muchas preguntas antes de decidir',     color: '#6366f1', bg: '#eef2ff', prompt: 'Eres un cliente curioso evaluando el servicio. Haces muchas preguntas sobre servicios, precios, horarios y funcionamiento antes de tomar ninguna decisión.' },
  { id: 'precio',        emoji: '💰', label: 'Precio-sensitivo',   desc: 'Todo lo evalúa por coste',             color: '#f59e0b', bg: '#fffbeb', prompt: 'Eres un cliente muy enfocado en el precio. Todo lo evalúas por coste. Preguntas por descuentos, comparativas y opciones más económicas. Eres escéptico si algo parece caro.' },
  { id: 'directo',       emoji: '⚡', label: 'Directo',            desc: 'Info exacta, sin rodeos',              color: '#0ea5e9', bg: '#f0f9ff', prompt: 'Eres un cliente muy eficiente. Preguntas de forma concisa y sin rodeos. Quieres respuestas exactas en pocas palabras. Mensajes de 1 frase máximo.' },
  { id: 'confundido',    emoji: '😕', label: 'Confundido',         desc: 'No sabe lo que quiere, necesita guía', color: '#8b5cf6', bg: '#f5f3ff', prompt: 'Eres un cliente que no tiene claro lo que quiere. Haces preguntas vagas. A veces cambias de tema. Necesitas que el bot te guíe con paciencia.' },
  { id: 'recurrente',    emoji: '🔁', label: 'Recurrente',         desc: 'Ya es cliente, duda específica',       color: '#10b981', bg: '#ecfdf5', prompt: 'Eres un cliente habitual que ya conoce el negocio. Vienes con una consulta específica o a modificar algo. Eres amable y conciso.' },
  { id: 'urgente',       emoji: '🚨', label: 'Urgente',            desc: 'Problema ahora, atención inmediata',   color: '#f43f5e', bg: '#fff1f2', prompt: 'Eres un cliente con una urgencia real ahora mismo. Tu primer mensaje transmite urgencia. Esperas respuesta rápida y directa. Mensajes cortos y urgentes.' },
  { id: 'investigador',  emoji: '📋', label: 'Investigador',       desc: 'Compara opciones, preguntas técnicas', color: '#0891b2', bg: '#ecfeff', prompt: 'Eres un cliente muy meticuloso comparando opciones. Haces preguntas técnicas o muy detalladas. Quieres entender exactamente cómo funciona el servicio antes de comprometerte.' },
  { id: 'no_tech',       emoji: '🧓', label: 'No tech',            desc: 'Le cuesta, necesita paciencia',        color: '#78716c', bg: '#fafaf9', prompt: 'Eres un cliente mayor que no está familiarizado con la tecnología. Usas lenguaje simple, cometes algún error al escribir. Necesitas explicaciones muy sencillas y directas.' },
  { id: 'hablador',      emoji: '💬', label: 'Hablador',           desc: 'Conversación larga, se va por ramas',  color: '#d97706', bg: '#fffbeb', prompt: 'Eres un cliente muy conversador que se va por las ramas. Añades contexto personal innecesario y anécdotas. El bot tiene que reconducirte al tema principal.' },
  { id: 'frio',          emoji: '❄️', label: 'Frío',              desc: 'Primer contacto, sin contexto',        color: '#64748b', bg: '#f8fafc', prompt: 'Eres un cliente que llega sin contexto ni expectativas claras. Tu primer mensaje es muy genérico. Necesitas que el bot tome la iniciativa y te guíe.' },
  { id: 'listo_comprar', emoji: '🛒', label: 'Listo para comprar', desc: 'Ya decidió, solo confirma y cierra',   color: '#16a34a', bg: '#f0fdf4', prompt: 'Eres un cliente que ya decidió comprar o contratar. Solo necesitas confirmar los últimos detalles para proceder. Eres positivo y resolutivo.' },
]

const SPANISH_NAMES = [
  'Carlos','María','Luis','Ana','Pedro','Laura','Miguel','Sara',
  'Antonio','Carmen','David','Lucía','José','Elena','Manuel','Isabel',
  'Álvaro','Sofía','Diego','Natalia','Andrés','Cristina','Pablo','Raquel',
  'Roberto','Beatriz','Javier','Patricia','Francisco','Marta',
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConvTurn { role: 'client' | 'bot'; content: string }

interface Conversation {
  id: string
  personaId: string
  personaName: string
  turns: ConvTurn[]
  status: 'pending' | 'running' | 'done' | 'error'
  error?: string
}

interface AnalysisReport {
  overall_score: number
  summary: string
  achieved: string[]
  failed: string[]
  warnings: string[]
  recommendations: string[]
  persona_insights: { persona: string; verdict: 'ok' | 'warning' | 'fail'; note: string }[]
}

type Step = 'setup' | 'running' | 'report'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const randName = (used: Set<string>) => {
  const available = SPANISH_NAMES.filter(n => !used.has(n))
  const pool = available.length > 0 ? available : SPANISH_NAMES
  const n = pool[Math.floor(Math.random() * pool.length)]
  used.add(n)
  return n
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'Excelente' : score >= 60 ? 'Aceptable' : 'Deficiente'
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white font-syne shadow-lg"
        style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #e5e7eb ${score * 3.6}deg)` }}
      >
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold" style={{ color }}>
          {score}
        </div>
      </div>
      <p className="text-xs font-semibold" style={{ color }}>{label}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function BotTesterPage() {
  const [step, setStep]       = useState<Step>('setup')
  const [sessionName, setSessionName] = useState('')
  const [botPrompt, setBotPrompt]     = useState('')
  const [objective, setObjective]     = useState('')
  const [numTurns, setNumTurns]       = useState(3)

  // Persona slots: { personaId, count }
  const [slots, setSlots] = useState<{ personaId: string; count: number }[]>([])

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId]       = useState<string | null>(null)
  const [progress, setProgress]           = useState({ done: 0, total: 0 })
  const [analyzing, setAnalyzing]         = useState(false)
  const [report, setReport]               = useState<AnalysisReport | null>(null)
  const [globalError, setGlobalError]     = useState<string | null>(null)
  const [clientId, setClientId]           = useState<string>('')
  const [clients, setClients]             = useState<{ id: string; name: string }[]>([])
  const [pdfLoading, setPdfLoading]       = useState(false)
  const sessionIdRef = useRef<string>('')
  const pdfInputRef  = useRef<HTMLInputElement>(null)

  const runningRef = useRef(false)

  useEffect(() => {
    supabase.from('clients').select('id, name').order('name').then(({ data }) => {
      if (data) setClients(data)
    })
  }, [])

  // ── PDF extraction ──────────────────────────────────────────────────────────
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const bytes  = new Uint8Array(buffer)
      let binary   = ''
      bytes.forEach(b => { binary += String.fromCharCode(b) })
      const base64 = btoa(binary)

      const { data, error } = await supabase.functions.invoke('bot-tester', {
        body: { action: 'extract-pdf-objective', pdf_base64: base64, filename: file.name },
      })
      if (error || data?.error) throw new Error(error?.message ?? data?.error)
      setObjective(data.objective)
    } catch (err: any) {
      setGlobalError('Error al leer PDF: ' + (err.message ?? 'desconocido'))
    } finally {
      setPdfLoading(false)
      if (pdfInputRef.current) pdfInputRef.current.value = ''
    }
  }

  // ── Slot management ─────────────────────────────────────────────────────────
  const togglePersona = (id: string) => {
    setSlots(prev => {
      const exists = prev.find(s => s.personaId === id)
      if (exists) return prev.filter(s => s.personaId !== id)
      return [...prev, { personaId: id, count: 2 }]
    })
  }
  const updateCount = (id: string, delta: number) => {
    setSlots(prev => prev.map(s =>
      s.personaId === id ? { ...s, count: Math.max(1, Math.min(20, s.count + delta)) } : s
    ))
  }
  const totalConversations = slots.reduce((a, s) => a + s.count, 0)

  // ── Build conversation list ─────────────────────────────────────────────────
  const buildConversations = (): Conversation[] => {
    const usedNames = new Set<string>()
    const list: Conversation[] = []
    for (const slot of slots) {
      for (let i = 0; i < slot.count; i++) {
        list.push({
          id: crypto.randomUUID(),
          personaId: slot.personaId,
          personaName: randName(usedNames),
          turns: [],
          status: 'pending',
        })
      }
    }
    return list
  }

  // ── Run simulation ──────────────────────────────────────────────────────────
  const updateConv = useCallback((id: string, patch: Partial<Conversation>) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }, [])

  const runConversation = async (conv: Conversation): Promise<void> => {
    const persona = PERSONAS.find(p => p.id === conv.personaId)!
    updateConv(conv.id, { status: 'running' })

    const { data, error } = await supabase.functions.invoke('bot-tester', {
      body: {
        action: 'run-conversation',
        bot_prompt: botPrompt,
        persona_prompt: persona.prompt,
        persona_name: conv.personaName,
        num_turns: numTurns,
      },
    })

    if (error || data?.error) {
      updateConv(conv.id, { status: 'error', error: error?.message ?? data?.error })
    } else {
      updateConv(conv.id, { status: 'done', turns: data.turns })
    }
  }

  const startSimulation = async () => {
    if (!botPrompt.trim() || !objective.trim() || slots.length === 0) return
    setGlobalError(null)
    const convList = buildConversations()

    // Generate + persist session
    const sid = crypto.randomUUID()
    sessionIdRef.current = sid
    supabase.functions.invoke('bot-tester', {
      body: {
        action: 'save-session',
        session_id: sid,
        name: sessionName || 'Sin nombre',
        bot_prompt: botPrompt,
        objective,
        num_turns: numTurns,
        client_id: clientId || null,
      },
    })

    setConversations(convList)
    setProgress({ done: 0, total: convList.length })
    setSelectedId(convList[0].id)
    setStep('running')
    runningRef.current = true

    // Run in batches of 3
    const BATCH = 3
    let done = 0
    for (let i = 0; i < convList.length; i += BATCH) {
      if (!runningRef.current) break
      const batch = convList.slice(i, i + BATCH)
      await Promise.all(batch.map(c => runConversation(c)))
      done += batch.length
      setProgress({ done, total: convList.length })
    }
  }

  // ── Analyze ──────────────────────────────────────────────────────────────────
  const analyze = async () => {
    setAnalyzing(true)
    setGlobalError(null)
    const doneConvs = conversations.filter(c => c.status === 'done')
    const payload = doneConvs.map(c => {
      const persona = PERSONAS.find(p => p.id === c.personaId)!
      return { personaName: c.personaName, personaLabel: persona.label, turns: c.turns }
    })

    const { data, error } = await supabase.functions.invoke('bot-tester', {
      body: {
        action: 'analyze',
        conversations: payload,
        objective,
        session_id: sessionIdRef.current || null,
        client_id: clientId || null,
        session_name: sessionName || 'Sin nombre',
        bot_prompt: botPrompt,
        num_turns: numTurns,
      },
    })

    if (error || data?.error) {
      setGlobalError(error?.message ?? data?.error)
    } else {
      setReport(data.analysis)
      setStep('report')
    }
    setAnalyzing(false)
  }

  const reset = () => {
    runningRef.current = false
    setStep('setup')
    setConversations([])
    setReport(null)
    setProgress({ done: 0, total: 0 })
    setSelectedId(null)
    setGlobalError(null)
    sessionIdRef.current = ''
  }

  // ── Selected conversation ────────────────────────────────────────────────────
  const selectedConv = conversations.find(c => c.id === selectedId)

  // ════════════════════════════════════════════════════════════════════════════
  // STEP: SETUP
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 'setup') {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-bold text-[#1e1b4b] font-syne">Bot Tester</h1>
            <p className="text-sm text-[#6d7ab5] mt-0.5">Prueba tu bot antes de entregárselo al cliente</p>
          </div>

          {globalError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertTriangle size={14} className="flex-shrink-0" />
              {globalError}
            </div>
          )}

          {/* Session name + client selector */}
          <NodoCard padding="md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-[#3730a3] mb-2">Nombre de la prueba</p>
                <input
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  placeholder="Ej: Prueba inicial — Clínica DentaPlus"
                  className="w-full bg-white/70 border border-white/60 rounded-xl px-3.5 py-2.5 text-sm text-[#1e1b4b] placeholder-[#6d7ab5] outline-none focus:border-[#c026a8]/50 focus:ring-2 focus:ring-[#c026a8]/10 transition-all"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#3730a3] mb-2">Asignar a cliente <span className="font-normal text-[#6d7ab5]">(opcional)</span></p>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full bg-white/70 border border-white/60 rounded-xl px-3.5 py-2.5 text-sm text-[#1e1b4b] outline-none focus:border-[#c026a8]/50 focus:ring-2 focus:ring-[#c026a8]/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="">— Sin asignar —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </NodoCard>

          {/* Bot prompt */}
          <NodoCard padding="md">
            <p className="text-xs font-semibold text-[#3730a3] mb-1">System prompt del bot</p>
            <p className="text-[11px] text-[#6d7ab5] mb-3">Pega aquí el prompt completo que usas en producción</p>
            <textarea
              value={botPrompt}
              onChange={e => setBotPrompt(e.target.value)}
              rows={8}
              placeholder="Eres Claudia, asistente virtual de DentaPlus. Tu función es atender consultas de pacientes sobre..."
              className="w-full bg-white/70 border border-white/60 rounded-xl px-3.5 py-2.5 text-sm text-[#1e1b4b] placeholder-[#6d7ab5] outline-none focus:border-[#c026a8]/50 focus:ring-2 focus:ring-[#c026a8]/10 transition-all resize-none font-mono"
            />
          </NodoCard>

          {/* Objective */}
          <NodoCard padding="md">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#3730a3]">Objetivo de la prueba</p>
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-[#c026a8] hover:text-[#9c1887] px-2.5 py-1 rounded-lg bg-[#c026a8]/8 hover:bg-[#c026a8]/14 transition-colors disabled:opacity-50"
              >
                {pdfLoading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                {pdfLoading ? 'Leyendo PDF...' : 'Subir PDF'}
              </button>
              <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
            </div>
            <p className="text-[11px] text-[#6d7ab5] mb-3">¿Qué quieres verificar? El análisis final evaluará esto</p>
            <textarea
              value={objective}
              onChange={e => setObjective(e.target.value)}
              rows={3}
              placeholder="El bot debe responder correctamente sobre precios, horarios y tipos de tratamiento. Debe derivar al equipo solo cuando hay urgencias o presupuestos complejos. El tono debe ser profesional y cálido en todo momento."
              className="w-full bg-white/70 border border-white/60 rounded-xl px-3.5 py-2.5 text-sm text-[#1e1b4b] placeholder-[#6d7ab5] outline-none focus:border-[#c026a8]/50 focus:ring-2 focus:ring-[#c026a8]/10 transition-all resize-none"
            />
          </NodoCard>

          {/* Turns per conversation */}
          <NodoCard padding="md">
            <p className="text-xs font-semibold text-[#3730a3] mb-3">Turnos por conversación</p>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setNumTurns(n)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    numTurns === n
                      ? 'bg-[#c026a8] text-white border-[#c026a8]'
                      : 'bg-white border-[#E8E6F0] text-[#6d7ab5] hover:border-[#c026a8]/40'
                  }`}
                >
                  {n} {n === 2 ? '(rápido)' : n === 5 ? '(profundo)' : ''}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#6d7ab5] mt-2">{numTurns} intercambios cliente–bot por conversación</p>
          </NodoCard>

          {/* Persona builder */}
          <NodoCard padding="md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[#3730a3]">Tipos de cliente</p>
                <p className="text-[11px] text-[#6d7ab5] mt-0.5">Selecciona qué perfiles quieres simular</p>
              </div>
              {totalConversations > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#c026a8]/10 border border-[#c026a8]/20">
                  <span className="text-sm font-bold text-[#c026a8]">{totalConversations}</span>
                  <span className="text-xs text-[#c026a8]">conversaciones</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {PERSONAS.map(p => {
                const slot = slots.find(s => s.personaId === p.id)
                const active = !!slot
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border-2 transition-all cursor-pointer ${
                      active
                        ? 'border-[#c026a8]/50'
                        : 'border-[#E8E6F0] hover:border-[#c026a8]/25'
                    }`}
                    style={{ background: active ? p.bg : undefined }}
                  >
                    <button
                      onClick={() => togglePersona(p.id)}
                      className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
                    >
                      <span className="text-lg flex-shrink-0">{p.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#1e1b4b] truncate">{p.label}</p>
                        <p className="text-[10px] text-[#6d7ab5] leading-tight truncate">{p.desc}</p>
                      </div>
                      {active && (
                        <CheckCircle size={13} className="flex-shrink-0" style={{ color: p.color }} />
                      )}
                    </button>
                    {active && (
                      <div className="px-3 pb-2.5 flex items-center gap-2 border-t border-black/5 pt-2">
                        <button onClick={() => updateCount(p.id, -1)} className="w-6 h-6 rounded-full bg-white border border-[#E8E6F0] flex items-center justify-center text-[#6d7ab5] hover:border-[#c026a8]/40 transition-colors">
                          <Minus size={10} />
                        </button>
                        <span className="text-sm font-bold text-[#1e1b4b] w-6 text-center">{slot!.count}</span>
                        <button onClick={() => updateCount(p.id, +1)} className="w-6 h-6 rounded-full bg-white border border-[#E8E6F0] flex items-center justify-center text-[#6d7ab5] hover:border-[#c026a8]/40 transition-colors">
                          <Plus size={10} />
                        </button>
                        <span className="text-[10px] text-[#6d7ab5] ml-1">conversaciones</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </NodoCard>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <NodoButton
              variant="brand"
              size="lg"
              icon={<Play size={16} />}
              disabled={!botPrompt.trim() || !objective.trim() || slots.length === 0}
              onClick={startSimulation}
            >
              Iniciar simulación · {totalConversations} conversaciones
            </NodoButton>
            {(!botPrompt.trim() || !objective.trim() || slots.length === 0) && (
              <p className="text-xs text-[#6d7ab5]">Completa el prompt, el objetivo y selecciona al menos un tipo de cliente</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP: RUNNING
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 'running') {
    const donePct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0
    const allDone = progress.done >= progress.total

    return (
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[#E8E6F0] flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1e1b4b] truncate">{sessionName || 'Simulación en curso'}</p>
            <span className="text-xs text-[#6d7ab5] flex-shrink-0">{progress.done}/{progress.total}</span>
          </div>
          {/* Progress bar */}
          <div className="hidden md:flex items-center gap-3 mx-4 flex-1">
            <div className="flex-1 h-2 rounded-full bg-[#f1f0f9] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${donePct}%`, background: 'linear-gradient(90deg, #c026a8, #7c3aed)' }}
              />
            </div>
            <span className="text-xs font-semibold text-[#c026a8] flex-shrink-0">{donePct}%</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {allDone && (
              <NodoButton variant="brand" size="sm" icon={<Sparkles size={13} />} loading={analyzing} onClick={analyze}>
                {analyzing ? 'Analizando...' : 'Analizar resultados'}
              </NodoButton>
            )}
            <button onClick={reset} className="p-2 rounded-xl text-[#6d7ab5] hover:text-[#1e1b4b] hover:bg-[#f1f0f9] transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {globalError && (
          <div className="mx-4 mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertTriangle size={14} className="flex-shrink-0" />
            {globalError}
          </div>
        )}

        {/* WhatsApp-style layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: conversation list */}
          <div className="w-[260px] md:w-[300px] flex-shrink-0 border-r border-[#E8E6F0] overflow-y-auto">
            {conversations.map(conv => {
              const persona = PERSONAS.find(p => p.id === conv.personaId)!
              const isSelected = conv.id === selectedId
              const lastMsg = conv.turns[conv.turns.length - 1]
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full flex items-start gap-3 px-3 py-3 text-left border-b border-[#f1f0f9] transition-colors ${isSelected ? 'bg-[#c026a8]/6' : 'hover:bg-[#f9f8ff]'}`}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                    style={{ background: persona.bg }}
                  >
                    {persona.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-[#1e1b4b] truncate">{conv.personaName}</span>
                      {/* Status dot */}
                      <span className="flex-shrink-0 ml-1">
                        {conv.status === 'running'  && <Loader2 size={11} className="animate-spin text-[#c026a8]" />}
                        {conv.status === 'done'     && <CheckCircle size={11} className="text-emerald-500" />}
                        {conv.status === 'error'    && <XCircle size={11} className="text-red-400" />}
                        {conv.status === 'pending'  && <div className="w-2 h-2 rounded-full bg-[#E8E6F0]" />}
                      </span>
                    </div>
                    <p className="text-[10px]" style={{ color: persona.color }}>{persona.label}</p>
                    {lastMsg && (
                      <p className="text-[10px] text-[#6d7ab5] truncate mt-0.5">{lastMsg.content}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right: conversation view */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedConv ? (
              <>
                {/* Conversation header */}
                <div className="px-4 py-3 border-b border-[#E8E6F0] flex items-center gap-3 flex-shrink-0">
                  {(() => {
                    const p = PERSONAS.find(x => x.id === selectedConv.personaId)!
                    return (
                      <>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: p.bg }}>{p.emoji}</div>
                        <div>
                          <p className="text-sm font-semibold text-[#1e1b4b]">{selectedConv.personaName}</p>
                          <p className="text-[10px]" style={{ color: p.color }}>{p.label}</p>
                        </div>
                        {selectedConv.status === 'running' && (
                          <div className="ml-auto flex items-center gap-1.5 text-xs text-[#c026a8]">
                            <Loader2 size={12} className="animate-spin" /> Generando...
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {selectedConv.turns.length === 0 && selectedConv.status === 'pending' && (
                    <div className="flex items-center justify-center h-full text-[#6d7ab5] text-sm">En espera...</div>
                  )}
                  {selectedConv.turns.length === 0 && selectedConv.status === 'running' && (
                    <div className="flex items-center justify-center h-full gap-2 text-[#c026a8] text-sm">
                      <Loader2 size={16} className="animate-spin" /> Iniciando conversación...
                    </div>
                  )}
                  {selectedConv.turns.map((turn, i) => (
                    <div key={i} className={`flex items-start gap-2 ${turn.role === 'bot' ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: turn.role === 'bot'
                            ? 'linear-gradient(135deg, #c026a8, #7c3aed)'
                            : PERSONAS.find(p => p.id === selectedConv.personaId)!.bg,
                        }}
                      >
                        {turn.role === 'bot'
                          ? <Bot size={12} className="text-white" />
                          : <User size={12} style={{ color: PERSONAS.find(p => p.id === selectedConv.personaId)!.color }} />
                        }
                      </div>
                      <div
                        className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          turn.role === 'bot'
                            ? 'rounded-tr-sm bg-gradient-to-br from-[#c026a8] to-[#7c3aed] text-white'
                            : 'rounded-tl-sm bg-white border border-[#E8E6F0] text-[#1e1b4b]'
                        }`}
                      >
                        {turn.content}
                      </div>
                    </div>
                  ))}
                  {selectedConv.status === 'error' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                      <XCircle size={12} /> {selectedConv.error ?? 'Error desconocido'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#6d7ab5] text-sm">
                Selecciona una conversación
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP: REPORT
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 'report' && report) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#1e1b4b] font-syne">Resultados del testeo</h1>
              <p className="text-sm text-[#6d7ab5] mt-0.5">{sessionName || 'Análisis completado'} · {conversations.filter(c => c.status === 'done').length} conversaciones analizadas</p>
            </div>
            <NodoButton variant="secondary" size="sm" icon={<RotateCcw size={13} />} onClick={reset}>
              Nueva prueba
            </NodoButton>
          </div>

          {/* Score + Summary */}
          <NodoCard padding="md">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreBadge score={report.overall_score} />
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#3730a3] mb-2">Resumen ejecutivo</p>
                <p className="text-sm text-[#1e1b4b] leading-relaxed">{report.summary}</p>
              </div>
            </div>
          </NodoCard>

          {/* 3 columns: logros / fallos / advertencias */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NodoCard padding="md">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-emerald-500" />
                <p className="text-xs font-semibold text-emerald-700">Cumplió ({report.achieved.length})</p>
              </div>
              <ul className="space-y-2">
                {report.achieved.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#1e1b4b]">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                    {a}
                  </li>
                ))}
                {report.achieved.length === 0 && <p className="text-xs text-[#6d7ab5]">Ningún objetivo cumplido completamente.</p>}
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
                    <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                    {f}
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
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                    {w}
                  </li>
                ))}
                {report.warnings.length === 0 && <p className="text-xs text-[#6d7ab5]">Sin advertencias.</p>}
              </ul>
            </NodoCard>
          </div>

          {/* Recommendations */}
          <NodoCard padding="md">
            <p className="text-xs font-semibold text-[#3730a3] mb-3">Recomendaciones para mejorar el prompt</p>
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

          {/* Per-persona insights */}
          <NodoCard padding="md">
            <p className="text-xs font-semibold text-[#3730a3] mb-3">Comportamiento por perfil de cliente</p>
            <div className="space-y-2">
              {report.persona_insights.map((pi, i) => {
                const conv = conversations.find(c => c.personaName === pi.persona)
                const persona = conv ? PERSONAS.find(p => p.id === conv.personaId) : null
                return (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-[#f9f8ff]">
                    <span className="text-base flex-shrink-0">{persona?.emoji ?? '👤'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-[#1e1b4b]">{pi.persona}</span>
                        {persona && <span className="text-[10px]" style={{ color: persona.color }}>{persona.label}</span>}
                      </div>
                      <p className="text-xs text-[#6d7ab5]">{pi.note}</p>
                    </div>
                    <span className="flex-shrink-0 mt-0.5">
                      {pi.verdict === 'ok'      && <CheckCircle size={14} className="text-emerald-500" />}
                      {pi.verdict === 'warning' && <AlertTriangle size={14} className="text-amber-500" />}
                      {pi.verdict === 'fail'    && <XCircle size={14} className="text-red-400" />}
                    </span>
                  </div>
                )
              })}
            </div>
          </NodoCard>

          {/* Review conversations */}
          <NodoCard padding="md">
            <p className="text-xs font-semibold text-[#3730a3] mb-3">Revisar conversaciones</p>
            <div className="space-y-2">
              {conversations.filter(c => c.status === 'done').map(conv => {
                const persona = PERSONAS.find(p => p.id === conv.personaId)!
                return (
                  <details key={conv.id} className="group">
                    <summary className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#f9f8ff] transition-colors list-none">
                      <span className="text-base">{persona.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-[#1e1b4b]">{conv.personaName}</span>
                        <span className="text-[10px] ml-2" style={{ color: persona.color }}>{persona.label}</span>
                      </div>
                      <span className="text-[10px] text-[#6d7ab5]">{conv.turns.length} mensajes</span>
                      <ChevronRight size={12} className="text-[#6d7ab5] group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="mt-2 ml-10 space-y-2 pb-2">
                      {conv.turns.map((t, i) => (
                        <div key={i} className={`flex gap-2 ${t.role === 'bot' ? 'flex-row-reverse' : ''}`}>
                          <p className={`text-xs px-3 py-2 rounded-xl max-w-[85%] ${
                            t.role === 'bot'
                              ? 'bg-[#c026a8]/10 text-[#7c3aed]'
                              : 'bg-[#f1f0f9] text-[#1e1b4b]'
                          }`}>
                            {t.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                )
              })}
            </div>
          </NodoCard>

        </div>
      </div>
    )
  }

  return null
}
