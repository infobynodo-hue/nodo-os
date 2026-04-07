import { useEffect, useRef, useState } from 'react'
import { Send, Bot, User, Paperclip, X, Loader2, Mic, MicOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { NodoCard } from '../../components/ui/NodoCard'
import { NodoButton } from '../../components/ui/NodoButton'
import { PLUGS, SERVICE_LABELS } from '../../types'
import type { ChatMessage, PlugId, ProjectPlug, Project, Client } from '../../types'
import { PLUG_SYSTEM_PROMPTS } from '../../lib/plugPrompts'

function renderMarkdownLine(line: string, key: number) {
  const parts = line.split(/(\*\*[^*]+\*\*)/)
  return (
    <span key={key}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-semibold text-[#1A1827]">{part.slice(2, -2)}</strong>
          : part
      )}
    </span>
  )
}

function ChatMarkdown({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="text-sm leading-relaxed text-[#2D2B3A]">
      {lines.map((line, i) => {
        if (line.trim() === '---') {
          return <hr key={i} className="border-[#E8E6F0] my-2" />
        }
        if (line === '') {
          return <div key={i} className="h-2" />
        }
        return <div key={i}>{renderMarkdownLine(line, i)}</div>
      })}
    </div>
  )
}

const PLUG_INFO: Record<PlugId, { icon: string; title: string; desc: string }> = {
  onboarding: { icon: '🚀', title: 'Onboarding', desc: 'Configura tu empleado digital desde cero con una guía inteligente' },
  report_error: { icon: '🐛', title: 'Reportar un error', desc: 'Documenta una respuesta incorrecta de tu empleado digital' },
  request_change: { icon: '✏️', title: 'Solicitar cambio', desc: 'Modifica el comportamiento o instrucciones del empleado digital' },
  new_info: { icon: '➕', title: 'Nueva información', desc: 'Enseña algo nuevo a tu empleado digital. Escribe o sube documentos.' },
  general_review: { icon: '📊', title: 'Revisión mensual', desc: 'Evalúa el desempeño y define mejoras del mes' },
  schedule_meeting: { icon: '📅', title: 'Hablar con el equipo', desc: 'Solicita una llamada con el equipo de NODO ONE' },
  bot_metrics: { icon: '📈', title: 'Métricas', desc: 'Consulta el rendimiento y estadísticas de tu empleado digital' },
}

type AttachedFile = {
  name: string
  type: string
  content: string
  url?: string
}

type ApiMessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
    >

type ApiMessage = {
  role: string
  content: ApiMessageContent
}

export function ClientChatPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedPlug, setSelectedPlug] = useState<PlugId>('onboarding')
  const [availablePlugs, setAvailablePlugs] = useState<ProjectPlug[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [botMetrics, setBotMetrics] = useState<Array<{
    week_start: string; conversations: number; messages_total: number;
    resolution_rate: number; escalation_rate: number; avg_response_ms: number;
    top_topics: string[]; user_satisfaction: number;
  }>>([])

  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }
    const rec: any = new SR()
    rec.lang = 'es-ES'
    rec.continuous = false
    rec.interimResults = true
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      setInput(transcript)
    }
    rec.onend = () => setRecording(false)
    rec.onerror = () => setRecording(false)
    recognitionRef.current = rec
    rec.start()
    setRecording(true)
  }

  useEffect(() => {
    if (user?.projectId) {
      loadContext()
    }
  }, [user])

  useEffect(() => {
    if (project && selectedPlug) {
      loadMessages(selectedPlug)
      setAttachedFile(null)
    }
  }, [selectedPlug, project])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadContext() {
    if (!user?.projectId || !user?.clientId) return
    const [projectRes, clientRes, plugsRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', user.projectId).single(),
      supabase.from('clients').select('*').eq('id', user.clientId).single(),
      supabase.from('project_plugs').select('*').eq('project_id', user.projectId).eq('is_enabled', true),
    ])
    setProject(projectRes.data)
    setClient(clientRes.data)
    setAvailablePlugs(plugsRes.data || [])

    // Load bot metrics for bot_metrics plug
    if (projectRes.data?.id) {
      const { data: metricsData } = await supabase
        .from('bot_metrics')
        .select('week_start, conversations, messages_total, resolution_rate, escalation_rate, avg_response_ms, top_topics, user_satisfaction')
        .eq('project_id', projectRes.data.id)
        .order('week_start', { ascending: false })
        .limit(8)
      if (metricsData) setBotMetrics(metricsData)
    }

    // Set default plug to first available
    if (plugsRes.data && plugsRes.data.length > 0) {
      setSelectedPlug(plugsRes.data[0].plug_id as PlugId)
    }
  }

  async function loadMessages(plugId: PlugId) {
    if (!user?.projectId) return
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', user.projectId)
      .eq('session_type', plugId)
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages(data || [])
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user?.projectId) return
    setUploading(true)
    try {
      // Upload to Supabase Storage
      const filePath = `${user.projectId}/${Date.now()}-${file.name}`
      await supabase.storage.from('client-documents').upload(filePath, file)

      // Extract content based on file type
      let extractedContent = ''
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        extractedContent = await file.text()
      } else if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file)
        extractedContent = `[IMAGEN_ADJUNTA:${base64}:${file.type}]`
      } else if (file.type === 'application/pdf') {
        extractedContent = `[ARCHIVO PDF: ${file.name}] El usuario ha subido un PDF. Indícale que el equipo lo revisará y procesará el contenido manualmente si no se puede extraer automáticamente.`
      } else {
        extractedContent = `[ARCHIVO: ${file.name} (${file.type})] El usuario ha adjuntado un archivo de tipo ${file.type}.`
      }

      setAttachedFile({ name: file.name, type: file.type, content: extractedContent })
    } catch (err) {
      console.error('Error uploading file:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handlePlugActions(response: string, plugId: PlugId) {
    if (!user?.projectId || !user?.clientId) return

    // new_info: save confirmed info to bot_knowledge after client approval
    if (plugId === 'new_info' && response.includes('[NEW_INFO_READY]')) {
      const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]
      if (lastUserMsg) {
        await supabase.from('bot_knowledge').insert({
          project_id: user.projectId,
          category: 'otra',
          title: 'Info añadida por cliente',
          content: lastUserMsg.content,
          is_visible_to_client: false,
          order_index: 999,
        })
      }
    }

    // report_error: create plug_request after client approval
    if (plugId === 'report_error' && response.includes('[PLUG_REQUEST_READY]')) {
      const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n')
      await supabase.from('plug_requests').insert({
        project_id: user.projectId,
        plug_id: 'report_error',
        request_type: 'error_report',
        content: conversation,
        status: 'pending',
      })
    }

    // request_change: create plug_request after client approval
    if (plugId === 'request_change' && response.includes('[PLUG_REQUEST_READY]')) {
      const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n')
      await supabase.from('plug_requests').insert({
        project_id: user.projectId,
        plug_id: 'request_change',
        request_type: 'change_request',
        content: conversation,
        status: 'pending',
      })
    }

    // schedule_meeting: create calendar_event and plug_request
    if (plugId === 'schedule_meeting' && response.includes('REUNIÓN_CONFIRMADA')) {
      try {
        const jsonMatch = response.match(/\{[^}]+\}/)
        if (jsonMatch) {
          const meetingData = JSON.parse(jsonMatch[0]) as {
            titulo: string
            fecha: string
            hora?: string
            formato: string
            notas?: string
          }
          const title = `Reunión con ${client?.business_name || 'Cliente'} — ${meetingData.titulo}`
          await supabase.from('calendar_events').insert({
            title,
            description: meetingData.notas || '',
            event_type: 'reunion_cliente',
            start_at: new Date(meetingData.fecha + 'T' + (meetingData.hora || '10:00')).toISOString(),
            client_id: user.clientId,
            source: 'plug_request',
            created_by: null,
          })
          // Also create a plug_request of type reunion
          const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n')
          await supabase.from('plug_requests').insert({
            project_id: user.projectId,
            plug_id: 'schedule_meeting',
            request_type: 'reunion',
            content: conversation,
            status: 'pending',
          })
        }
      } catch (e) {
        console.error('Error creating meeting event:', e)
      }
    }
  }

  async function sendMessage() {
    if (!input.trim() || !user?.projectId || !project || !client) return
    setSending(true)
    const userContent = input.trim()
    setInput('')
    const fileSnapshot = attachedFile
    setAttachedFile(null)

    // Build content for display and DB (include file hint if present)
    const displayContent = fileSnapshot
      ? `${userContent}\n\n📎 ${fileSnapshot.name}`
      : userContent

    // Guardar mensaje del usuario
    const { data: userMsg } = await supabase
      .from('chat_messages')
      .insert({
        project_id: user.projectId,
        session_type: selectedPlug,
        role: 'user',
        content: displayContent,
      })
      .select()
      .single()

    if (userMsg) {
      setMessages(prev => [...prev, userMsg])
    }

    try {
      // Build history for Claude — use plain content for all past messages
      const history: ApiMessage[] = messages.map(m => ({ role: m.role, content: m.content }))

      // Build the last user message content (with optional file)
      if (fileSnapshot?.type.startsWith('image/')) {
        const base64 = fileSnapshot.content
          .replace('[IMAGEN_ADJUNTA:', '')
          .split(':')[0]
        history.push({
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: fileSnapshot.type, data: base64 },
            },
            { type: 'text', text: userContent },
          ],
        })
      } else if (fileSnapshot) {
        history.push({
          role: 'user',
          content: `${userContent}\n\n${fileSnapshot.content}`,
        })
      } else {
        history.push({ role: 'user', content: userContent })
      }

      const systemPrompt = buildSystemPrompt(selectedPlug, project, client, botMetrics)
      const response = await callClaude(systemPrompt, history)

      // Guardar respuesta del asistente
      const { data: assistantMsg } = await supabase
        .from('chat_messages')
        .insert({
          project_id: user.projectId,
          session_type: selectedPlug,
          role: 'assistant',
          content: response,
        })
        .select()
        .single()

      if (assistantMsg) {
        setMessages(prev => [...prev, assistantMsg])
      }

      // Post-response actions
      await handlePlugActions(response, selectedPlug)

      // Actualizar onboarding session si aplica
      if (selectedPlug === 'onboarding') {
        const completionPct = Math.min(100, Math.round((messages.length / 20) * 100))
        await supabase
          .from('onboarding_sessions')
          .update({
            status: 'in_progress',
            completion_pct: completionPct,
            last_activity: new Date().toISOString(),
          })
          .eq('project_id', user.projectId)
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err)
      const errorMsg: ChatMessage = {
        id: 'error-' + Date.now(),
        project_id: user.projectId,
        session_type: selectedPlug,
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const currentPlugDef = PLUGS.find(p => p.id === selectedPlug)
  const enabledPlugIds = availablePlugs.map(p => p.plug_id)

  const gestionPlugs = PLUGS.filter(p => p.category === 'gestion')
  const comunicacionPlugs = PLUGS.filter(p => p.category === 'comunicacion')

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-57px)]">
      {/* Plug selector — horizontal scrollable pills grouped by category */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-[#E8E6F0]">
        <div className="space-y-2">
          {/* Gestión del agente */}
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-widest mb-1.5">
              Gestión del Agente
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {gestionPlugs.map((plug) => {
                const isEnabled = enabledPlugIds.includes(plug.id)
                const isActive = selectedPlug === plug.id
                return (
                  <button
                    key={plug.id}
                    disabled={!isEnabled}
                    onClick={() => isEnabled && setSelectedPlug(plug.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#C026A8] text-white'
                        : isEnabled
                        ? 'bg-[#F4F3F9] border border-[#E8E6F0] text-[#4D4B60] hover:border-[#C026A8]/40 hover:text-[#1A1827]'
                        : 'bg-[#F4F3F9] border border-[#E8E6F0] text-[#9999AA] opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span>{plug.icon}</span>
                    <span>{plug.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comunicación */}
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-widest mb-1.5">
              Comunicación
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {comunicacionPlugs.map((plug) => {
                const isEnabled = enabledPlugIds.includes(plug.id)
                const isActive = selectedPlug === plug.id
                return (
                  <button
                    key={plug.id}
                    disabled={!isEnabled}
                    onClick={() => isEnabled && setSelectedPlug(plug.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#C026A8] text-white'
                        : isEnabled
                        ? 'bg-[#F4F3F9] border border-[#E8E6F0] text-[#4D4B60] hover:border-[#C026A8]/40 hover:text-[#1A1827]'
                        : 'bg-[#F4F3F9] border border-[#E8E6F0] text-[#9999AA] opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span>{plug.icon}</span>
                    <span>{plug.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Current plug detail description with enhanced info */}
        {currentPlugDef && (
          <div className="mt-2 px-3 py-2 bg-[#F4F3F9] border border-[#E8E6F0] rounded-lg flex items-start gap-2">
            <span className="text-base flex-shrink-0 mt-0.5">{PLUG_INFO[currentPlugDef.id]?.icon ?? currentPlugDef.icon}</span>
            <div>
              <p className="text-xs font-semibold text-[#1A1827]">{PLUG_INFO[currentPlugDef.id]?.title ?? currentPlugDef.label}</p>
              <p className="text-xs text-[#6B6B80] leading-relaxed mt-0.5">{PLUG_INFO[currentPlugDef.id]?.desc ?? currentPlugDef.detail}</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E040A0]/10 to-[#8B22E8]/10 flex items-center justify-center mb-4">
              <span className="text-2xl">{currentPlugDef?.icon}</span>
            </div>
            <p className="text-[#1A1827] font-semibold text-sm mb-1">{currentPlugDef?.label}</p>
            <p className="text-[#6B6B80] text-xs text-center max-w-xs">{currentPlugDef?.detail}</p>
            <p className="text-[#6B6B80] text-xs mt-3">Escribe un mensaje para empezar</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-[#E040A0] to-[#8B22E8]'
                : 'bg-[#EEECF8] border border-[#E8E6F0]'
            }`}>
              {msg.role === 'assistant' ? (
                <Bot size={13} className="text-white" />
              ) : (
                <User size={13} className="text-[#6B6B80]" />
              )}
            </div>
            <div className={`max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              {msg.role === 'user' ? (
                <div className="rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap text-[#1A1827] bg-[#EEECF8] border border-[#C026A8]/30">
                  {msg.content}
                </div>
              ) : (
                <NodoCard dark padding="sm">
                  <ChatMarkdown content={msg.content} />
                </NodoCard>
              )}
              <span className="text-[10px] text-[#6B6B80] px-1">
                {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-3 fade-in">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E040A0] to-[#8B22E8] flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-white" />
            </div>
            <NodoCard dark padding="sm" className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#BBBBCC] rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-1.5 h-1.5 bg-[#BBBBCC] rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 bg-[#BBBBCC] rounded-full animate-bounce [animation-delay:300ms]" />
            </NodoCard>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-[#E8E6F0]">
        {/* Attached file chip */}
        {(attachedFile || uploading) && (
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-[#F4F3F9] border border-[#C026A8]/30 rounded-full px-3 py-1.5 text-xs text-[#4D4B60]">
              {uploading ? (
                <>
                  <Loader2 size={12} className="animate-spin text-[#C026A8]" />
                  <span>Subiendo archivo...</span>
                </>
              ) : (
                <>
                  <span>📄</span>
                  <span className="max-w-[200px] truncate">{attachedFile?.name}</span>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="ml-1 text-[#6B6B80] hover:text-[#1A1827] transition-colors"
                  >
                    <X size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-[#F4F3F9] border border-[#E8E6F0] rounded-xl overflow-hidden focus-within:border-[#C026A8]/40 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-sm text-[#1A1827] placeholder-[#6B6B80] outline-none resize-none max-h-32"
              style={{ minHeight: '44px' }}
            />
          </div>

          {/* Voice input button */}
          <button
            onClick={toggleVoice}
            title={recording ? 'Detener grabación' : 'Hablar'}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${
              recording
                ? 'bg-[#C026A8]/20 border-[#C026A8] text-[#C026A8] animate-pulse'
                : 'bg-[#F4F3F9] border-[#E8E6F0] text-[#6B6B80] hover:border-[#C026A8]/40 hover:text-[#C026A8]'
            }`}
          >
            {recording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* File attach button — only for plugs that accept files */}
          {currentPlugDef?.accepts_files && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Adjuntar archivo"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F4F3F9] border border-[#E8E6F0] text-[#6B6B80] hover:border-[#C026A8]/40 hover:text-[#C026A8] transition-colors disabled:opacity-40"
              >
                <Paperclip size={16} />
              </button>
            </>
          )}

          <NodoButton
            variant="brand"
            size="md"
            onClick={sendMessage}
            loading={sending}
            disabled={!input.trim() || uploading}
            icon={<Send size={14} />}
          >
            <span className="sr-only">Enviar</span>
          </NodoButton>
        </div>
        <p className="text-[10px] text-[#6B6B80] mt-1.5 text-center">
          Enter para enviar · Shift+Enter para nueva línea · 🎙 para hablar
        </p>
      </div>
    </div>
  )
}

const AGENT_NAMES: Record<string, string> = {
  bpo_claudia: 'Claudia',
  bpo_lucia: 'Lucía',
  track_property: 'el empleado digital',
  recovery: 'el empleado digital',
}

// Build system prompt with client context
function buildSystemPrompt(
  plugId: PlugId,
  project: Project,
  client: Client,
  metrics?: Array<{
    week_start: string; conversations: number; messages_total: number;
    resolution_rate: number; escalation_rate: number; avg_response_ms: number;
    top_topics: string[]; user_satisfaction: number;
  }>
): string {
  const base = PLUG_SYSTEM_PROMPTS[plugId] || ''
  const agentName = AGENT_NAMES[project.service_type] ?? 'el empleado digital'
  let prompt = base
    .replace(/{agent_name}/g, agentName)
    .replace(/{service_type}/g, SERVICE_LABELS[project.service_type])
    .replace(/{sector}/g, client.sector)
    .replace(/{business_name}/g, client.business_name)

  // Inject real metrics data for bot_metrics plug
  if (plugId === 'bot_metrics' && metrics && metrics.length > 0) {
    const totalConvs = metrics.reduce((a, w) => a + w.conversations, 0)
    const avgResolution = (metrics.reduce((a, w) => a + w.resolution_rate, 0) / metrics.length * 100).toFixed(1)
    const avgEscalation = (metrics.reduce((a, w) => a + w.escalation_rate, 0) / metrics.length * 100).toFixed(1)
    const avgResponse = Math.round(metrics.reduce((a, w) => a + w.avg_response_ms, 0) / metrics.length / 1000)
    const topicCounts: Record<string, number> = {}
    metrics.forEach(w => (w.top_topics || []).forEach((t: string) => { topicCounts[t] = (topicCounts[t] || 0) + 1 }))
    const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t)
    const lastWeek = metrics[0]
    const prevWeek = metrics[1]
    const trend = prevWeek ? (lastWeek.conversations > prevWeek.conversations ? 'creciente' : lastWeek.conversations < prevWeek.conversations ? 'decreciente' : 'estable') : 'estable'

    const metricsBlock = `
DATOS REALES DEL SISTEMA (últimas ${metrics.length} semanas):
- Total conversaciones: ${totalConvs.toLocaleString('es-ES')}
- Promedio semanal: ${Math.round(totalConvs / metrics.length)} conversaciones/semana
- Tendencia: ${trend} (semana pasada: ${lastWeek.conversations} conv.)
- Tasa de resolución autónoma: ${avgResolution}%
- Tasa de escalación a humano: ${avgEscalation}%
- Tiempo de respuesta medio: ${avgResponse} segundos
- Satisfacción: ${(metrics.reduce((a, w) => a + (w.user_satisfaction || 0), 0) / metrics.length).toFixed(1)}/5
- Temas más frecuentes: ${topTopics.join(', ')}

Semana más reciente (${lastWeek.week_start}): ${lastWeek.conversations} conversaciones · ${(lastWeek.resolution_rate * 100).toFixed(0)}% resolución · ${lastWeek.avg_response_ms / 1000}s respuesta

Usa ESTOS datos reales cuando el cliente pregunte por métricas. Habla en primera persona del equipo NODO ONE.`

    prompt = metricsBlock + '\n\n' + prompt
  }

  return prompt
}

// Call Claude API
async function callClaude(
  systemPrompt: string,
  messages: ApiMessage[]
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    return 'La API de Claude no está configurada. Añade VITE_ANTHROPIC_API_KEY en .env.local'
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json() as { content: Array<{ text: string }> }
  return data.content[0].text
}
