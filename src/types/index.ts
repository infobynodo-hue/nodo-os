// ─── Roles ──────────────────────────────────────────────────────────────────
export type UserRole = 'superadmin' | 'admin' | 'tecnico' | 'client'

// ─── Usuarios Internos ───────────────────────────────────────────────────────
export interface InternalUser {
  id: string
  email: string
  full_name: string
  role: 'superadmin' | 'admin' | 'tecnico'
  avatar_url?: string
  is_active: boolean
  created_at: string
}

// ─── Clientes ────────────────────────────────────────────────────────────────
export type Sector =
  | 'Salud y bienestar'
  | 'Clínicas dentales'
  | 'Estética y belleza'
  | 'Inmobiliaria'
  | 'Retail y moda'
  | 'Calzado'
  | 'Alimentación'
  | 'Educación'
  | 'Tecnología'
  | 'Servicios financieros'
  | 'Hostelería y turismo'
  | 'Deporte y fitness'
  | 'Legal'
  | 'Construcción y reformas'
  | 'Otro'

export const SECTORES: Sector[] = [
  'Salud y bienestar',
  'Clínicas dentales',
  'Estética y belleza',
  'Inmobiliaria',
  'Retail y moda',
  'Calzado',
  'Alimentación',
  'Educación',
  'Tecnología',
  'Servicios financieros',
  'Hostelería y turismo',
  'Deporte y fitness',
  'Legal',
  'Construcción y reformas',
  'Otro',
]

export interface Client {
  id: string
  business_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  sector: Sector
  country: string
  notes?: string
  portal_password?: string
  is_active: boolean
  created_at: string
  created_by?: string
}

// ─── Proyectos ───────────────────────────────────────────────────────────────
export type ServiceType = 'bpo_claudia' | 'bpo_lucia' | 'track_property' | 'recovery'
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export const SERVICE_LABELS: Record<ServiceType, string> = {
  bpo_claudia: 'BPO Digital — Claudia',
  bpo_lucia: 'BPO Digital — Lucía',
  track_property: 'Track Property',
  recovery: 'NODO Recovery',
}

export const SERVICE_PRICES: Record<ServiceType, Record<6 | 12, { monthly: number; total: number }>> = {
  bpo_claudia: {
    6: { monthly: 1117, total: 6702 },
    12: { monthly: 789, total: 9468 },
  },
  bpo_lucia: {
    6: { monthly: 1677, total: 10062 },
    12: { monthly: 1257, total: 15084 },
  },
  track_property: {
    6: { monthly: 0, total: 0 },
    12: { monthly: 0, total: 0 },
  },
  recovery: {
    6: { monthly: 0, total: 0 },
    12: { monthly: 0, total: 0 },
  },
}

export interface Project {
  id: string
  client_id: string
  service_type: ServiceType
  duration_months: 6 | 12
  start_date: string
  end_date: string
  monthly_price: number
  total_price: number
  current_phase: number
  progress_pct: number
  status: ProjectStatus
  assigned_tech?: string
  created_at: string
  // joins
  client?: Client
  assigned_tech_user?: InternalUser
}

// ─── Fases ────────────────────────────────────────────────────────────────────
export type PhaseStatus = 'pending' | 'in_progress' | 'completed'

export interface ProjectPhase {
  id: string
  project_id: string
  phase_number: number
  phase_name: string
  phase_description?: string
  status: PhaseStatus
  started_at?: string
  completed_at?: string
}

// ─── Tareas ───────────────────────────────────────────────────────────────────
export interface Task {
  id: string
  project_id: string
  phase_number: number
  title: string
  description?: string
  assigned_to: 'internal' | 'client'
  is_enabled: boolean
  is_completed: boolean
  due_date?: string
  completed_at?: string
  completed_by?: string
  order_index: number
  created_at: string
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed'

export interface OnboardingSession {
  id: string
  project_id: string
  status: OnboardingStatus
  completion_pct: number
  last_activity?: string
  completed_at?: string
}

// ─── Chat Messages ────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  project_id: string
  session_type: string
  role: 'user' | 'assistant'
  content: string
  metadata?: Record<string, unknown>
  created_at: string
}

// ─── Plug Requests ────────────────────────────────────────────────────────────
export type PlugRequestStatus = 'pending' | 'in_progress' | 'resolved'

export interface PlugRequest {
  id: string
  project_id: string
  plug_id: string
  plug_label: string
  summary: Record<string, unknown>
  status: PlugRequestStatus
  client_approved: boolean
  admin_response?: string
  resolved_by?: string
  resolved_at?: string
  created_at: string
  // joins
  project?: Project
}

// ─── Base de Conocimiento ─────────────────────────────────────────────────────
export type KnowledgeCategory =
  | 'descripcion_general'
  | 'personalidad_tono'
  | 'preguntas_frecuentes'
  | 'servicios_activos'
  | 'horarios_disponibilidad'
  | 'prohibiciones'
  | 'alertas_escalamiento'
  | 'indicaciones_operativas'
  | 'otra'

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  descripcion_general: 'Descripción General',
  personalidad_tono: 'Personalidad y Tono',
  preguntas_frecuentes: 'Preguntas Frecuentes',
  servicios_activos: 'Servicios Activos',
  horarios_disponibilidad: 'Horarios y Disponibilidad',
  prohibiciones: 'Prohibiciones',
  alertas_escalamiento: 'Alertas y Escalamiento',
  indicaciones_operativas: 'Indicaciones Operativas',
  otra: 'Otra',
}

export interface BotKnowledge {
  id: string
  project_id: string
  category: KnowledgeCategory
  title: string
  content: string
  is_visible_to_client: boolean
  order_index: number
  updated_at: string
  updated_by?: string
}

// ─── Facturación ─────────────────────────────────────────────────────────────
export type BillingStatus = 'pending' | 'paid' | 'overdue'

export interface BillingRecord {
  id: string
  project_id: string
  period_month: number
  due_date: string
  amount: number
  status: BillingStatus
  paid_at?: string
  notes?: string
  created_at: string
}

// ─── Plugs ────────────────────────────────────────────────────────────────────
export type PlugId = 'onboarding' | 'report_error' | 'request_change' | 'new_info' | 'general_review' | 'schedule_meeting' | 'bot_metrics'

export interface ProjectPlug {
  id: string
  project_id: string
  plug_id: PlugId
  is_enabled: boolean
  enabled_at?: string
  enabled_by?: string
}

export interface PlugDefinition {
  id: PlugId
  label: string
  icon: string
  description: string
  detail: string
  available_from_phase: number
  services: ServiceType[]
  accepts_files?: boolean
  category: 'gestion' | 'comunicacion'
}

export const PLUGS: PlugDefinition[] = [
  {
    id: 'onboarding',
    label: 'Onboarding',
    icon: '🚀',
    description: 'Configura tu agente desde cero.',
    detail: 'Responde preguntas guiadas sobre tu negocio para que tu empleado digital aprenda todo lo necesario. Una conversación natural y sencilla.',
    available_from_phase: 2,
    services: ['bpo_claudia', 'bpo_lucia', 'track_property', 'recovery'],
    category: 'gestion',
  },
  {
    id: 'new_info',
    label: 'Nueva Información',
    icon: '📥',
    description: 'Enseña algo nuevo a tu agente. Escríbelo o sube un documento.',
    detail: 'Añade servicios, precios, FAQs, catálogos o cualquier información nueva. Puedes escribirla directamente o subir un PDF, imagen o documento Word.',
    available_from_phase: 5,
    services: ['bpo_claudia', 'bpo_lucia', 'track_property', 'recovery'],
    accepts_files: true,
    category: 'gestion',
  },
  {
    id: 'request_change',
    label: 'Solicitar Cambio',
    icon: '✏️',
    description: 'Modifica horarios, precios, tono o comportamiento del agente.',
    detail: 'Pide cualquier modificación al comportamiento de tu agente. Puedes adjuntar un documento con los cambios si los tienes escritos.',
    available_from_phase: 5,
    services: ['bpo_claudia', 'bpo_lucia', 'track_property', 'recovery'],
    accepts_files: true,
    category: 'gestion',
  },
  {
    id: 'report_error',
    label: 'Reportar Error',
    icon: '🐛',
    description: 'Informa de una respuesta incorrecta. Adjunta captura si tienes.',
    detail: 'Dinos cuándo tu agente respondió algo incorrecto. Puedes adjuntar una captura de pantalla para que lo veamos claramente.',
    available_from_phase: 5,
    services: ['bpo_claudia', 'bpo_lucia', 'track_property', 'recovery'],
    accepts_files: true,
    category: 'gestion',
  },
  {
    id: 'general_review',
    label: 'Revisión Mensual',
    icon: '📊',
    description: 'Evalúa el desempeño del mes y define prioridades.',
    detail: 'Una revisión guiada del mes: qué funcionó, qué falló y qué mejorar. El resumen se envía automáticamente al equipo de NODO ONE.',
    available_from_phase: 7,
    services: ['bpo_claudia', 'bpo_lucia', 'track_property', 'recovery'],
    category: 'gestion',
  },
  {
    id: 'schedule_meeting',
    label: 'Agendar Reunión',
    icon: '📅',
    description: 'Solicita una llamada o reunión con el equipo NODO ONE.',
    detail: 'Reserva una reunión con el equipo. Te pediremos fecha, hora y motivo, y lo confirmaremos en menos de 24 horas.',
    available_from_phase: 1,
    services: ['bpo_claudia', 'bpo_lucia', 'track_property', 'recovery'],
    category: 'comunicacion',
  },
  {
    id: 'bot_metrics',
    label: 'Métricas del Agente',
    icon: '📈',
    description: 'Consulta el rendimiento de tu agente este mes.',
    detail: 'Ve cuántas conversaciones tuvo tu agente, los temas más frecuentes, el índice de resolución y cómo mejorar los resultados.',
    available_from_phase: 5,
    services: ['bpo_claudia', 'bpo_lucia', 'track_property', 'recovery'],
    category: 'comunicacion',
  },
]

// ─── Leads / Pipeline ────────────────────────────────────────────────────────
export type LeadStatus = 'nuevo' | 'contactado' | 'propuesta' | 'negociacion' | 'cerrado_ganado' | 'cerrado_perdido'
export type LeadSource = 'referido' | 'instagram' | 'linkedin' | 'web' | 'evento' | 'cold_outreach' | 'otro'

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  propuesta: 'Propuesta',
  negociacion: 'Negociación',
  cerrado_ganado: 'Ganado ✓',
  cerrado_perdido: 'Perdido',
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  referido: 'Referido',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  web: 'Web',
  evento: 'Evento',
  cold_outreach: 'Outreach',
  otro: 'Otro',
}

export interface Lead {
  id: string
  business_name: string
  contact_name: string
  contact_email?: string
  contact_phone?: string
  sector?: string
  source: LeadSource
  service_interest?: ServiceType
  estimated_mrr?: number
  status: LeadStatus
  notes?: string
  assigned_to?: string
  next_follow_up?: string
  created_by?: string
  created_at: string
  updated_at: string
  sequence_id?: string
  sequence_started_at?: string
  current_step?: number
}

// ─── Secuencias de seguimiento ───────────────────────────────────────────────
export interface LeadSequence {
  id: string
  name: string
  description?: string
  trigger_source?: string[]
  color: string
  is_active: boolean
  created_by?: string
  created_at: string
  lead_sequence_steps?: LeadSequenceStep[]
}

export interface LeadSequenceStep {
  id: string
  sequence_id: string
  step_number: number
  action_type: 'llamada' | 'email' | 'whatsapp' | 'propuesta' | 'reunion' | 'nota' | 'tarea'
  title: string
  description?: string
  message_template?: string
  day_offset: number
  is_required: boolean
}

export interface LeadActivity {
  id: string
  lead_id: string
  sequence_step_id?: string
  activity_type: 'llamada' | 'email' | 'whatsapp' | 'propuesta' | 'reunion' | 'nota' | 'tarea'
  title: string
  description?: string
  outcome?: string
  status: 'pendiente' | 'completado' | 'saltado'
  scheduled_at?: string
  completed_at?: string
  created_by?: string
  created_at: string
}

// ─── Health Scores ─────────────────────────────────────────────────────────
export interface ClientHealthScore {
  id: string
  client_id: string
  score: number
  payment_score: number
  engagement_score: number
  progress_score: number
  nps_score?: number
  trend: 'up' | 'down' | 'stable'
  last_calculated: string
}

// ─── Calendar ────────────────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  event_type: 'entrega' | 'reunion_cliente' | 'info_cliente' | 'reunion_interna' | 'seguimiento' | 'tarea' | 'otro'
  start_at: string
  end_at?: string
  all_day: boolean
  client_id?: string
  project_id?: string
  assigned_to?: string[]
  created_by?: string
  source: 'manual' | 'lead_activity' | 'plug_request'
  source_id?: string
  color?: string
  created_at: string
  clients?: { business_name: string }
}

// ─── Internal Resources ──────────────────────────────────────────────────────
export interface InternalResource {
  id: string
  title: string
  description?: string
  category: 'propuesta' | 'presentacion' | 'contrato' | 'demo' | 'enlace' | 'plantilla' | 'guion' | 'otro'
  tags: string[]
  file_path?: string
  file_name?: string
  file_size?: number
  file_type?: string
  external_url?: string
  service?: string
  is_pinned: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// ─── Tutoriales / Academia ─────────────────────────────────────────────────────
export type TutorialCategory = 'general' | 'bot' | 'crm' | 'plataformas' | 'whatsapp'

export const TUTORIAL_CATEGORY_LABELS: Record<TutorialCategory, string> = {
  general:     'Primeros pasos',
  bot:         'Tu agente IA',
  crm:         'Gestión de conversaciones',
  plataformas: 'Plataformas',
  whatsapp:    'WhatsApp Business',
}

export interface ClientTutorial {
  id: string
  title: string
  description?: string
  category: TutorialCategory
  video_url?: string
  thumbnail_url?: string
  duration_min?: number
  is_global: boolean
  client_id?: string       // si está definido, solo ese cliente lo ve
  order_index: number
  is_published: boolean
  created_at: string
}

// ─── Bot Metrics ─────────────────────────────────────────────────────────────
export interface BotMetricWeek {
  id: string
  project_id: string
  week_start: string           // ISO date, e.g. "2026-03-31"
  conversations: number
  messages_total: number
  resolution_rate: number      // 0-1
  escalation_rate: number      // 0-1
  avg_response_ms: number
  top_topics: string[]         // JSONB array of topic strings
  user_satisfaction?: number   // 0-5
  created_at: string
}

export interface BotMetricDemo {
  week_start: string
  conversations: number
  atendidas_fuera_horario: number
  duracion_conversacion_seg: number
  avg_response_ms: number
  resolution_rate: number
  escalation_rate: number
  conv_manana: number          // 06-12h
  conv_tarde: number           // 12-20h
  conv_noche: number           // 20-00h
  conv_madrugada: number       // 00-06h
  top_topics: Array<{ topic: string; count: number }>
}

// ─── Auth / App ───────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  profile?: InternalUser
  clientId?: string
  projectId?: string
}

// ─── Client Credentials ───────────────────────────────────────────────────────
export interface ClientCredential {
  id: string
  client_id: string
  platform: string
  label: string
  username?: string
  password?: string
  url?: string
  notes?: string
  icon?: string
  is_visible_to_client: boolean
  created_at: string
}

// ─── Client Notifications ─────────────────────────────────────────────────────
export interface ClientNotification {
  id: string
  client_id: string
  title: string
  body?: string
  type: 'info' | 'success' | 'warning' | 'action'
  action_url?: string
  is_read: boolean
  created_at: string
}

// ─── Project Deliverables ─────────────────────────────────────────────────────
export interface ProjectDeliverable {
  id: string
  project_id: string
  phase_number?: number
  title: string
  description?: string
  file_path?: string
  file_name?: string
  external_url?: string
  type: 'documento' | 'link' | 'video' | 'acceso' | 'otro'
  published: boolean
  created_at: string
}
