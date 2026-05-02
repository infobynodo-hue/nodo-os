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
      | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } }
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
  // Recupera la última pestaña que el usuario usó (localStorage) para que no "desaparezcan" mensajes
  const [selectedPlug, setSelectedPlug] = useState<PlugId>(() => {
    const saved = localStorage.getItem('nodo_last_plug') as PlugId | null
    return saved || 'onboarding'
  })
  const [availablePlugs, setAvailablePlugs] = useState<ProjectPlug[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'extracting' | null>(null)
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
  }, [user?.id])

  useEffect(() => {
    if (!project || !selectedPlug || !user?.projectId) return

    localStorage.setItem('nodo_last_plug', selectedPlug)
    loadMessages(selectedPlug)
    setAttachedFile(null)

    // Suscripción en tiempo real — nuevos mensajes llegan solos sin recargar
    const channel = supabase
      .channel(`chat:${user.projectId}:${selectedPlug}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'chat_messages',
          filter: `project_id=eq.${user.projectId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          if (newMsg.session_type !== selectedPlug) return
          // Evitar duplicados (el mismo dispositivo ya lo añadió optimistamente)
          setMessages(prev =>
            prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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

    // Set plug: respeta el último que usó el cliente (localStorage).
    // Si no hay guardado o ya no está habilitado, usa el primero disponible.
    if (plugsRes.data && plugsRes.data.length > 0) {
      const enabledIds = plugsRes.data.map(p => p.plug_id)
      const lastUsed = localStorage.getItem('nodo_last_plug') as PlugId | null
      const fallback = plugsRes.data[0].plug_id as PlugId
      setSelectedPlug(lastUsed && enabledIds.includes(lastUsed) ? lastUsed : fallback)
    }
  }

  async function loadMessages(plugId: PlugId) {
    if (!user?.projectId) return
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', user.projectId)
      .eq('session_type', plugId)
      .order('created_at', { ascending: false })
      .limit(100)
    // Invertir para mostrar del más antiguo al más reciente
    setMessages((data || []).reverse())
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user?.projectId) return

    // Hard limit: 50 MB. Por encima de eso ni el servidor puede manejarlo.
    const HARD_LIMIT = 50 * 1024 * 1024
    if (file.size > HARD_LIMIT) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      setMessages(prev => [...prev, {
        id: 'file-error-' + Date.now(),
        project_id: user.projectId!,
        session_type: selectedPlug,
        role: 'assistant' as const,
        content: `⚠️ El archivo **${file.name}** pesa ${sizeMB} MB y supera el límite de 50 MB. Intenta comprimirlo en smallpdf.com o dividirlo en partes.`,
        created_at: new Date().toISOString(),
      }])
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    setUploadStatus('uploading')
    try {
      // Extract content based on file type
      let extractedContent = ''
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        extractedContent = await file.text()
      } else if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file)
        extractedContent = `[IMAGEN_ADJUNTA:${base64}:${file.type}]`
      } else if (file.type === 'application/pdf') {
        // PDFs pequeños (<20 MB): base64 directo a Claude (más fiel al original)
        // PDFs grandes (≥20 MB): subir a Storage → Edge Function descarga y extrae texto
        // (Las Edge Functions tienen un límite de ~6 MB para el body, por eso usamos Storage)
        const DIRECT_LIMIT = 20 * 1024 * 1024
        if (file.size >= DIRECT_LIMIT) {
          extractedContent = await uploadToStorageAndExtract(file)
        } else {
          const base64 = await fileToBase64(file)
          extractedContent = `[PDF_BASE64:${base64}:application/pdf]`
        }
      } else {
        extractedContent = `[ARCHIVO: ${file.name} (${file.type})] El usuario ha adjuntado un archivo de tipo ${file.type}.`
        // Subir a Storage en background para tenerlo guardado
        const filePath = `${user.projectId}/${Date.now()}-${file.name}`
        supabase.storage.from('client-documents').upload(filePath, file).catch(() => {})
      }

      setAttachedFile({ name: file.name, type: file.type, content: extractedContent })
    } catch (err) {
      console.error('Error procesando archivo:', err)
      setMessages(prev => [...prev, {
        id: 'file-error-' + Date.now(),
        project_id: user.projectId!,
        session_type: selectedPlug,
        role: 'assistant' as const,
        content: `⚠️ No se pudo procesar el archivo **${file.name}**. ${(err instanceof Error && err.message) ? err.message : 'Inténtalo de nuevo o pega el contenido directamente en el chat.'}`,
        created_at: new Date().toISOString(),
      }])
    } finally {
      setUploading(false)
      setUploadStatus(null)
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

  /**
   * Flujo para PDFs ≥20 MB:
   * 1. Sube el archivo a Supabase Storage (el browser maneja archivos grandes sin problema)
   * 2. Llama a la Edge Function `import-pdf` con el path del archivo en Storage
   * 3. La Edge Function descarga el archivo server-side y extrae el texto con unpdf
   *
   * Por qué este enfoque:
   * - Las Edge Functions tienen un límite de ~6 MB para el request body
   * - Supabase Storage acepta archivos de hasta 50 MB (o más si está configurado)
   * - supabase.functions.invoke() con JSON body funciona perfectamente
   */
  async function uploadToStorageAndExtract(file: File): Promise<string> {
    if (!user?.projectId) throw new Error('No hay proyecto activo')

    // Paso 1: Subir a Supabase Storage
    setUploadStatus('uploading')
    const storagePath = `${user.projectId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(storagePath, file, { contentType: 'application/pdf' })

    if (uploadError) {
      throw new Error(`No se pudo subir el archivo: ${uploadError.message}`)
    }

    // Paso 2: Llamar a la Edge Function (cambiamos el estado para que el usuario vea progreso)
    setUploadStatus('extracting')

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token || supabaseAnonKey

    // Timeout de 3 minutos — la extracción de PDFs grandes puede tomar hasta 2 min
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3 * 60 * 1000)

    let response: Response
    try {
      response = await fetch(`${supabaseUrl}/functions/v1/import-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storage_path: storagePath, filename: file.name }),
        signal: controller.signal,
      })
    } catch (fetchErr: unknown) {
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        throw new Error('El proceso tardó demasiado. El archivo puede ser muy pesado o complejo. Intenta con una versión comprimida.')
      }
      throw fetchErr
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: `Error ${response.status}` }))
      throw new Error(errData.error || `Error del servidor (${response.status})`)
    }

    const data = await response.json()

    if (data?.error) {
      throw new Error(data.error)
    }

    const text: string = data?.text ?? ''
    const pages: number = data?.pages ?? 0
    const truncated: boolean = data?.truncated ?? false

    if (!text.trim()) {
      throw new Error(
        'El PDF no tiene texto extraíble. Puede ser un documento escaneado (imagen). ' +
        'Prueba a copiar el texto manualmente y pegarlo en el chat.'
      )
    }

    const header = `[CONTENIDO EXTRAÍDO DEL PDF: ${file.name} — ${pages} página${pages !== 1 ? 's' : ''}${truncated ? ' (truncado por longitud)' : ''}]\n\n`
    return header + text
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
    const hasText = input.trim().length > 0
    const hasFile = !!attachedFile
    if ((!hasText && !hasFile) || !user?.projectId || !project || !client) return
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
      // Build history for Claude — only last 20 messages to keep requests lightweight
      const recentMessages = messages.slice(-20)
      const history: ApiMessage[] = recentMessages.map(m => ({ role: m.role, content: m.content }))

      // Build the last user message content (with optional file)
      const defaultPdfPrompt = 'He subido un documento con información de mi negocio. Por favor, extrae toda la información relevante (productos, servicios, precios, horarios, condiciones) y confírmame lo que encontraste para asegurarnos de que está todo correcto antes de añadirlo.'

      if (fileSnapshot?.type.startsWith('image/')) {
        // Imagen → content array con source base64
        const base64 = fileSnapshot.content
          .replace('[IMAGEN_ADJUNTA:', '')
          .split(':')[0]
        history.push({
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: fileSnapshot.type, data: base64 } },
            { type: 'text', text: userContent },
          ],
        })
      } else if (fileSnapshot?.type === 'application/pdf' && fileSnapshot.content.startsWith('[PDF_BASE64:')) {
        // PDF pequeño (<20 MB) → base64 directo como document block
        const base64 = fileSnapshot.content
          .replace('[PDF_BASE64:', '')
          .split(':')[0]
        history.push({
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: userContent || defaultPdfPrompt },
          ],
        })
      } else if (fileSnapshot?.type === 'application/pdf') {
        // PDF grande (≥20 MB) → texto extraído por Edge Function, se envía como texto plano
        history.push({
          role: 'user',
          content: `${userContent || defaultPdfPrompt}\n\n${fileSnapshot.content}`,
        })
      } else if (fileSnapshot) {
        // Otros archivos (txt, csv, etc.)
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

    } catch (err) {
      console.error('sendMessage error:', err)
      const errMsg = err instanceof Error ? err.message : String(err)
      const isTimeout = errMsg.includes('tardó demasiado') || errMsg.includes('AbortError')
      const isOverloaded = errMsg.includes('529') || errMsg.includes('overloaded')
      const isTooLarge = errMsg.includes('413') || errMsg.includes('too large') || errMsg.includes('Request too large')

      let content: string
      if (isTimeout) {
        content = '⏱ La respuesta tardó demasiado. Esto suele pasar con archivos grandes o conexión lenta. Espera unos segundos e inténtalo de nuevo.'
      } else if (isTooLarge) {
        content = '⚠️ El archivo es demasiado grande para procesarlo. Intenta con un PDF más pequeño (menos de 8 MB) o dividido en páginas.'
      } else if (isOverloaded) {
        content = '⏳ El servicio está con mucha demanda ahora mismo. Espera unos segundos e inténtalo de nuevo.'
      } else {
        content = `⚠️ Hubo un problema al procesar tu mensaje. Por favor, inténtalo de nuevo.`
      }

      const errorMsg: ChatMessage = {
        id: 'error-' + Date.now(),
        project_id: user.projectId,
        session_type: selectedPlug,
        role: 'assistant',
        content,
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
  // Plugs que aceptan archivos — fallback explícito para cuando currentPlugDef sea undefined
  const PLUGS_WITH_FILES: PlugId[] = ['onboarding', 'new_info', 'request_change', 'report_error']
  const currentPlugAcceptsFiles = currentPlugDef?.accepts_files ?? PLUGS_WITH_FILES.includes(selectedPlug)

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
          <div className="mt-2 px-3 py-2 bg-[#F4F3F9] border border-[#E8E6F0] rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-base flex-shrink-0 mt-0.5">{PLUG_INFO[currentPlugDef.id]?.icon ?? currentPlugDef.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#1A1827]">{PLUG_INFO[currentPlugDef.id]?.title ?? currentPlugDef.label}</p>
                <p className="text-xs text-[#6B6B80] leading-relaxed mt-0.5">{PLUG_INFO[currentPlugDef.id]?.desc ?? currentPlugDef.detail}</p>
              </div>
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
                  <span>
                    {uploadStatus === 'extracting'
                      ? 'Extrayendo texto del PDF… puede tardar 1-2 min'
                      : 'Subiendo archivo…'}
                  </span>
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

          {/* File attach button — plugs que aceptan archivos */}
          {currentPlugAcceptsFiles && (
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
            disabled={(!input.trim() && !attachedFile) || uploading || sending}
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

  // Abort after 90 seconds to prevent infinite loading (PDFs tardan más)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 90_000)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new Error(`Claude API error ${response.status}: ${errorBody}`)
    }

    const data = await response.json() as { content: Array<{ text: string }> }
    return data.content[0].text
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('La respuesta tardó demasiado. Por favor, inténtalo de nuevo.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}
