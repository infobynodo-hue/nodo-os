import type { Client, Project, ProjectPhase, Task, BillingRecord, BotKnowledge, BotMetricDemo } from '../types'

export const DEMO_CLIENTS: Client[] = [
  {
    id: 'demo-client-1',
    business_name: 'Clínica DentaPlus',
    contact_name: 'María González',
    contact_email: 'maria@dentaplus.es',
    contact_phone: '+34 612 345 678',
    sector: 'Clínicas dentales',
    country: 'España',
    notes: 'Cliente prioritario — expansión a 3 sedes en 2025',
    is_active: true,
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'demo-client-2',
    business_name: 'EstiloCasa Inmobiliaria',
    contact_name: 'Carlos Ruiz',
    contact_email: 'carlos@estimocasa.es',
    contact_phone: '+34 698 234 567',
    sector: 'Inmobiliaria',
    country: 'España',
    is_active: true,
    created_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'demo-client-3',
    business_name: 'FitLife Studio',
    contact_name: 'Laura Martínez',
    contact_email: 'laura@fitlife.es',
    contact_phone: '+34 677 891 234',
    sector: 'Deporte y fitness',
    country: 'España',
    is_active: true,
    created_at: '2025-02-20T10:00:00Z',
  },
  {
    id: 'demo-client-4',
    business_name: 'Restaurante El Rincón',
    contact_name: 'Antonio López',
    contact_email: 'antonio@elrincon.es',
    contact_phone: '+34 654 321 987',
    sector: 'Hostelería y turismo',
    country: 'España',
    is_active: true,
    created_at: '2025-03-01T10:00:00Z',
  },
]

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-project-1',
    client_id: 'demo-client-1',
    service_type: 'bpo_claudia',
    duration_months: 12,
    start_date: '2025-01-20',
    end_date: '2026-01-20',
    monthly_price: 789,
    total_price: 9468,
    current_phase: 3,
    progress_pct: 42,
    status: 'active',
    created_at: '2025-01-20T10:00:00Z',
  },
  {
    id: 'demo-project-2',
    client_id: 'demo-client-2',
    service_type: 'bpo_lucia',
    duration_months: 6,
    start_date: '2025-02-05',
    end_date: '2025-08-05',
    monthly_price: 1677,
    total_price: 10062,
    current_phase: 2,
    progress_pct: 28,
    status: 'active',
    created_at: '2025-02-05T10:00:00Z',
  },
  {
    id: 'demo-project-3',
    client_id: 'demo-client-3',
    service_type: 'bpo_claudia',
    duration_months: 12,
    start_date: '2024-10-01',
    end_date: '2025-10-01',
    monthly_price: 789,
    total_price: 9468,
    current_phase: 6,
    progress_pct: 85,
    status: 'active',
    created_at: '2024-10-01T10:00:00Z',
  },
  {
    id: 'demo-project-4',
    client_id: 'demo-client-4',
    service_type: 'track_property',
    duration_months: 6,
    start_date: '2025-03-05',
    end_date: '2025-09-05',
    monthly_price: 0,
    total_price: 0,
    current_phase: 1,
    progress_pct: 10,
    status: 'active',
    created_at: '2025-03-05T10:00:00Z',
  },
]

export const DEMO_PHASES: ProjectPhase[] = [
  { id: 'p1-1', project_id: 'demo-project-1', phase_number: 1, phase_name: 'Onboarding & Setup', status: 'completed', completed_at: '2025-02-01T10:00:00Z' },
  { id: 'p1-2', project_id: 'demo-project-1', phase_number: 2, phase_name: 'Configuración de Claudia', status: 'completed', completed_at: '2025-02-20T10:00:00Z' },
  { id: 'p1-3', project_id: 'demo-project-1', phase_number: 3, phase_name: 'Automatización de Comunicaciones', status: 'in_progress' },
  { id: 'p1-4', project_id: 'demo-project-1', phase_number: 4, phase_name: 'Gestión de Pacientes', status: 'pending' },
  { id: 'p1-5', project_id: 'demo-project-1', phase_number: 5, phase_name: 'Optimización y Reportes', status: 'pending' },
  { id: 'p1-6', project_id: 'demo-project-1', phase_number: 6, phase_name: 'Expansión y Escalado', status: 'pending' },
  { id: 'p1-7', project_id: 'demo-project-1', phase_number: 7, phase_name: 'Mantenimiento Continuo', status: 'pending' },
]

export const DEMO_TASKS: Task[] = [
  { id: 't1', project_id: 'demo-project-1', phase_number: 3, title: 'Configurar secuencias de email automáticas', assigned_to: 'internal', is_enabled: true, is_completed: true, order_index: 1, created_at: '2025-02-21T10:00:00Z', completed_at: '2025-02-28T10:00:00Z' },
  { id: 't2', project_id: 'demo-project-1', phase_number: 3, title: 'Integrar CRM con plataforma de citas', assigned_to: 'internal', is_enabled: true, is_completed: true, order_index: 2, created_at: '2025-02-21T10:00:00Z', completed_at: '2025-03-05T10:00:00Z' },
  { id: 't3', project_id: 'demo-project-1', phase_number: 3, title: 'Revisar plantillas de comunicación', assigned_to: 'client', is_enabled: true, is_completed: false, order_index: 3, created_at: '2025-03-01T10:00:00Z' },
  { id: 't4', project_id: 'demo-project-1', phase_number: 3, title: 'Activar notificaciones de recordatorio de cita', assigned_to: 'internal', is_enabled: true, is_completed: false, order_index: 4, created_at: '2025-03-01T10:00:00Z' },
  { id: 't5', project_id: 'demo-project-1', phase_number: 3, title: 'Aprobar flujo de comunicación post-consulta', assigned_to: 'client', is_enabled: true, is_completed: false, order_index: 5, created_at: '2025-03-01T10:00:00Z' },
]

export const DEMO_BILLING: BillingRecord[] = [
  { id: 'b1', project_id: 'demo-project-1', period_month: 1, amount: 789, due_date: '2025-02-20', paid_at: '2025-02-18T10:00:00Z', status: 'paid', created_at: '2025-01-20T10:00:00Z' },
  { id: 'b2', project_id: 'demo-project-1', period_month: 2, amount: 789, due_date: '2025-03-20', paid_at: '2025-03-19T10:00:00Z', status: 'paid', created_at: '2025-01-20T10:00:00Z' },
  { id: 'b3', project_id: 'demo-project-1', period_month: 3, amount: 789, due_date: '2025-04-20', status: 'pending', created_at: '2025-01-20T10:00:00Z' },
  { id: 'b4', project_id: 'demo-project-1', period_month: 4, amount: 789, due_date: '2025-05-20', status: 'pending', created_at: '2025-01-20T10:00:00Z' },
]

export const DEMO_BOT_KNOWLEDGE: BotKnowledge[] = [
  { id: 'k1', project_id: 'demo-project-1', category: 'servicios_activos', title: 'Servicios principales', content: 'Ofrecemos ortodoncia invisible, implantes dentales, blanqueamiento láser y revisiones preventivas. Todos los tratamientos cuentan con garantía de 2 años.', is_visible_to_client: true, order_index: 1, updated_at: '2025-01-25T10:00:00Z' },
  { id: 'k2', project_id: 'demo-project-1', category: 'preguntas_frecuentes', title: 'Preguntas frecuentes', content: '¿Acepta mi seguro? Trabajamos con AXA, Sanitas, DKV y ASISA. ¿Puedo ir sin cita? Sí, para urgencias siempre tenemos hueco. ¿Cuánto tarda un implante? El proceso completo es de 3-6 meses.', is_visible_to_client: true, order_index: 2, updated_at: '2025-01-25T10:00:00Z' },
  { id: 'k3', project_id: 'demo-project-1', category: 'horarios_disponibilidad', title: 'Horarios y ubicación', content: 'Lunes a viernes de 9:00 a 20:00. Sábados de 9:00 a 14:00. Situados en Calle Mayor 45, Madrid. Parking gratuito para pacientes.', is_visible_to_client: true, order_index: 3, updated_at: '2025-01-25T10:00:00Z' },
  { id: 'k4', project_id: 'demo-project-1', category: 'personalidad_tono', title: 'Personalidad del asistente', content: 'Claudia es profesional, empática y cercana. Habla en español neutro, evita tecnicismos innecesarios y siempre ofrece una solución antes de cerrar la conversación.', is_visible_to_client: true, order_index: 4, updated_at: '2025-01-25T10:00:00Z' },
]

export const DEMO_BOT_METRICS: BotMetricDemo[] = [
  {
    week_start: '2026-03-03',
    conversations: 148,
    atendidas_fuera_horario: 34,
    duracion_conversacion_seg: 195,
    avg_response_ms: 2100,
    resolution_rate: 0.82,
    escalation_rate: 0.08,
    conv_manana: 52,
    conv_tarde: 71,
    conv_noche: 19,
    conv_madrugada: 6,
    top_topics: [
      { topic: 'Citas y reservas', count: 41 },
      { topic: 'Precios', count: 28 },
      { topic: 'Horarios', count: 24 },
      { topic: 'Servicios disponibles', count: 18 },
      { topic: 'Ubicación', count: 12 },
    ],
  },
  {
    week_start: '2026-03-10',
    conversations: 163,
    atendidas_fuera_horario: 41,
    duracion_conversacion_seg: 188,
    avg_response_ms: 1950,
    resolution_rate: 0.85,
    escalation_rate: 0.07,
    conv_manana: 58,
    conv_tarde: 79,
    conv_noche: 20,
    conv_madrugada: 6,
    top_topics: [
      { topic: 'Citas y reservas', count: 47 },
      { topic: 'Precios', count: 31 },
      { topic: 'Horarios', count: 26 },
      { topic: 'Servicios disponibles', count: 20 },
      { topic: 'Seguros aceptados', count: 15 },
    ],
  },
  {
    week_start: '2026-03-17',
    conversations: 141,
    atendidas_fuera_horario: 29,
    duracion_conversacion_seg: 210,
    avg_response_ms: 2300,
    resolution_rate: 0.79,
    escalation_rate: 0.11,
    conv_manana: 49,
    conv_tarde: 68,
    conv_noche: 18,
    conv_madrugada: 6,
    top_topics: [
      { topic: 'Citas y reservas', count: 38 },
      { topic: 'Precios', count: 27 },
      { topic: 'Horarios', count: 21 },
      { topic: 'Servicios disponibles', count: 16 },
      { topic: 'Ubicación', count: 11 },
    ],
  },
  {
    week_start: '2026-03-24',
    conversations: 179,
    atendidas_fuera_horario: 47,
    duracion_conversacion_seg: 182,
    avg_response_ms: 1870,
    resolution_rate: 0.88,
    escalation_rate: 0.06,
    conv_manana: 64,
    conv_tarde: 86,
    conv_noche: 22,
    conv_madrugada: 7,
    top_topics: [
      { topic: 'Citas y reservas', count: 53 },
      { topic: 'Precios', count: 34 },
      { topic: 'Horarios', count: 28 },
      { topic: 'Servicios disponibles', count: 22 },
      { topic: 'Seguros aceptados', count: 17 },
    ],
  },
]

// ─── Distribución horaria completa (0-23h) ───────────────────────────────────
// Simula una clínica dental: picos mañana y tarde, algo de noche, poco de madrugada
export const DEMO_HOURLY: Record<number, number> = {
  0: 3,  1: 2,  2: 1,  3: 1,  4: 2,  5: 3,
  6: 6,  7: 14, 8: 31, 9: 48, 10: 52, 11: 44,
  12: 38, 13: 45, 14: 29, 15: 34, 16: 28, 17: 41,
  18: 47, 19: 43, 20: 34, 21: 24, 22: 16, 23: 9,
}

// Por día de la semana (0=Lun … 6=Dom)
export const DEMO_BY_WEEKDAY: Record<number, number> = {
  0: 98,  // Lun
  1: 112, // Mar
  2: 107, // Mié
  3: 119, // Jue
  4: 134, // Vie
  5: 68,  // Sáb
  6: 24,  // Dom
}

// Distribución de duración de conversación
export const DEMO_DURATION_DIST = [
  { label: 'Menos de 1 min', range: '<1m',  count: 89,  color: '#10b981' },
  { label: '1 – 3 minutos',  range: '1-3m', count: 241, color: '#6366f1' },
  { label: '3 – 5 minutos',  range: '3-5m', count: 187, color: '#c026a8' },
  { label: '5 – 10 minutos', range: '5-10m',count: 112, color: '#f59e0b' },
  { label: 'Más de 10 min',  range: '>10m', count: 33,  color: '#ef4444' },
]

// Distribución de tiempo de respuesta
export const DEMO_RESPONSE_DIST = [
  { label: '< 1 segundo',    count: 58,  color: '#10b981' },
  { label: '1 – 2 segundos', count: 183, color: '#6366f1' },
  { label: '2 – 4 segundos', count: 214, color: '#c026a8' },
  { label: '4 – 8 segundos', count: 112, color: '#f59e0b' },
  { label: '> 8 segundos',   count: 65,  color: '#ef4444' },
]

// Qué temas se escalan más
export const DEMO_ESCALATED_TOPICS = [
  { topic: 'Precios y presupuestos', escalated: 28, resolved: 6,  pct: 82 },
  { topic: 'Seguros y convenios',    escalated: 21, resolved: 14, pct: 60 },
  { topic: 'Quejas y reclamaciones', escalated: 18, resolved: 3,  pct: 86 },
  { topic: 'Urgencias dentales',     escalated: 16, resolved: 8,  pct: 67 },
  { topic: 'Cambios de cita',        escalated: 9,  resolved: 31, pct: 22 },
]

// Tendencia semanal por tema
export const DEMO_TOPIC_TREND: Record<string, number[]> = {
  'Citas y reservas':       [41, 47, 38, 53],
  'Precios':                [28, 31, 27, 34],
  'Horarios':               [24, 26, 21, 28],
  'Servicios disponibles':  [18, 20, 16, 22],
  'Seguros aceptados':      [12, 15, 11, 17],
}

// ═══════════════════════════════════════════════════════════════════════════════
// FITLIFE STUDIO — Datos de producción
// Cliente: 00000000-0001-0000-0000-000000000003
// ═══════════════════════════════════════════════════════════════════════════════
export const FITLIFE_CLIENT_ID = '00000000-0001-0000-0000-000000000003'

export const FITLIFE_BOT_METRICS: BotMetricDemo[] = [
  {
    week_start: '2026-03-17',
    conversations: 187,
    atendidas_fuera_horario: 74,
    duracion_conversacion_seg: 168,
    avg_response_ms: 2340,
    resolution_rate: 0.85,
    escalation_rate: 0.08,
    conv_manana: 52, conv_tarde: 96, conv_noche: 29, conv_madrugada: 10,
    top_topics: [
      { topic: 'Clases y horarios',        count: 58 },
      { topic: 'Reservas de clase',         count: 42 },
      { topic: 'Membresías y tarifas',      count: 37 },
      { topic: 'Información nutricional',   count: 29 },
      { topic: 'Instalaciones y servicios', count: 21 },
    ],
  },
  {
    week_start: '2026-03-24',
    conversations: 214,
    atendidas_fuera_horario: 83,
    duracion_conversacion_seg: 162,
    avg_response_ms: 2280,
    resolution_rate: 0.87,
    escalation_rate: 0.07,
    conv_manana: 61, conv_tarde: 109, conv_noche: 33, conv_madrugada: 11,
    top_topics: [
      { topic: 'Clases y horarios',        count: 67 },
      { topic: 'Reservas de clase',         count: 48 },
      { topic: 'Membresías y tarifas',      count: 41 },
      { topic: 'Información nutricional',   count: 33 },
      { topic: 'Instalaciones y servicios', count: 25 },
    ],
  },
  {
    week_start: '2026-03-31',
    conversations: 198,
    atendidas_fuera_horario: 78,
    duracion_conversacion_seg: 171,
    avg_response_ms: 2410,
    resolution_rate: 0.84,
    escalation_rate: 0.09,
    conv_manana: 56, conv_tarde: 101, conv_noche: 31, conv_madrugada: 10,
    top_topics: [
      { topic: 'Clases y horarios',        count: 62 },
      { topic: 'Reservas de clase',         count: 44 },
      { topic: 'Membresías y tarifas',      count: 38 },
      { topic: 'Información nutricional',   count: 30 },
      { topic: 'Cancelaciones y cambios',   count: 24 },
    ],
  },
  {
    week_start: '2026-04-07',
    conversations: 231,
    atendidas_fuera_horario: 89,
    duracion_conversacion_seg: 158,
    avg_response_ms: 2190,
    resolution_rate: 0.88,
    escalation_rate: 0.07,
    conv_manana: 66, conv_tarde: 118, conv_noche: 36, conv_madrugada: 11,
    top_topics: [
      { topic: 'Clases y horarios',        count: 72 },
      { topic: 'Reservas de clase',         count: 52 },
      { topic: 'Membresías y tarifas',      count: 44 },
      { topic: 'Información nutricional',   count: 36 },
      { topic: 'Instalaciones y servicios', count: 27 },
    ],
  },
]

export const FITLIFE_HOURLY: Record<number, number> = {
  0: 2,  1: 1,  2: 0,  3: 0,  4: 1,  5: 4,
  6: 12, 7: 28, 8: 41, 9: 38, 10: 34, 11: 29,
  12: 24, 13: 31, 14: 28, 15: 33, 16: 41, 17: 58,
  18: 72, 19: 68, 20: 52, 21: 38, 22: 21, 23: 9,
}

export const FITLIFE_BY_WEEKDAY: Record<number, number> = {
  0: 112, // Lun
  1: 124, // Mar
  2: 118, // Mié
  3: 131, // Jue
  4: 127, // Vie
  5: 98,  // Sáb — clases mañana
  6: 54,  // Dom — menor actividad
}

export const FITLIFE_DURATION_DIST = [
  { label: 'Menos de 1 min', range: '<1m',  count: 68,  color: '#10b981' },
  { label: '1 – 3 minutos',  range: '1-3m', count: 287, color: '#6366f1' },
  { label: '3 – 5 minutos',  range: '3-5m', count: 214, color: '#c026a8' },
  { label: '5 – 10 minutos', range: '5-10m',count: 124, color: '#f59e0b' },
  { label: 'Más de 10 min',  range: '>10m', count: 38,  color: '#ef4444' },
]

export const FITLIFE_RESPONSE_DIST = [
  { label: '< 1 segundo',    count: 48,  color: '#10b981' },
  { label: '1 – 2 segundos', count: 197, color: '#6366f1' },
  { label: '2 – 4 segundos', count: 284, color: '#c026a8' },
  { label: '4 – 8 segundos', count: 148, color: '#f59e0b' },
  { label: '> 8 segundos',   count: 57,  color: '#ef4444' },
]

export const FITLIFE_ESCALATED_TOPICS = [
  { topic: 'Congelaciones de membresía',  escalated: 31, resolved: 8,  pct: 79 },
  { topic: 'Reclamaciones de pago',       escalated: 24, resolved: 11, pct: 69 },
  { topic: 'Lesiones e incidencias',      escalated: 18, resolved: 6,  pct: 75 },
  { topic: 'Cambio de plan/tarifa',       escalated: 14, resolved: 22, pct: 39 },
  { topic: 'Acceso y horarios especiales',escalated: 9,  resolved: 28, pct: 24 },
]

export const FITLIFE_TOPIC_TREND: Record<string, number[]> = {
  'Clases y horarios':        [58, 67, 62, 72],
  'Reservas de clase':        [42, 48, 44, 52],
  'Membresías y tarifas':     [37, 41, 38, 44],
  'Información nutricional':  [29, 33, 30, 36],
  'Instalaciones y servicios':[21, 25, 24, 27],
}

// ═══════════════════════════════════════════════════════════════════════════════
// AQUAJETS — Datos específicos de producción
// Cliente: deeb1a7b-5f4a-4e43-b188-2ed9f047d417
// ═══════════════════════════════════════════════════════════════════════════════
export const AQUAJETS_CLIENT_ID = 'deeb1a7b-5f4a-4e43-b188-2ed9f047d417'

export const AQUAJETS_LIFETIME = {
  total_conversations: 5847,
  fuera_horario: 3241,
  agendas_confirmadas: 1013,
  revenue_eur: 101340,
}

export const AQUAJETS_LANGUAGES = [
  { idioma: 'Español',   flag: '🇪🇸', count: 2134, color: '#c026a8' },
  { idioma: 'English',   flag: '🇬🇧', count: 1847, color: '#6366f1' },
  { idioma: 'Italiano',  flag: '🇮🇹', count: 1094, color: '#0ea5e9' },
  { idioma: 'Français',  flag: '🇫🇷', count: 584,  color: '#10b981' },
  { idioma: 'Português', flag: '🇧🇷', count: 188,  color: '#f59e0b' },
]

export const AQUAJETS_BOT_METRICS: BotMetricDemo[] = [
  // ── Historial: Oct 2025 → Mar 2026 (22 semanas) ───────────────────────────
  {
    week_start: '2025-10-14',
    conversations: 647,
    atendidas_fuera_horario: 362,
    duracion_conversacion_seg: 158,
    avg_response_ms: 44000,
    resolution_rate: 0.83,
    escalation_rate: 0.085,
    conv_manana: 142, conv_tarde: 317, conv_noche: 130, conv_madrugada: 58,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 194 },
      { topic: 'Disponibilidad y fechas', count: 136 },
      { topic: 'Precios y tarifas',        count: 110 },
      { topic: 'Rutas y destinos',         count: 91 },
      { topic: 'Requisitos y licencias',   count: 71 },
    ],
  },
  {
    week_start: '2025-10-21',
    conversations: 683,
    atendidas_fuera_horario: 382,
    duracion_conversacion_seg: 157,
    avg_response_ms: 43500,
    resolution_rate: 0.83,
    escalation_rate: 0.084,
    conv_manana: 150, conv_tarde: 335, conv_noche: 137, conv_madrugada: 61,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 205 },
      { topic: 'Disponibilidad y fechas', count: 143 },
      { topic: 'Precios y tarifas',        count: 116 },
      { topic: 'Rutas y destinos',         count: 96 },
      { topic: 'Cancelaciones y cambios',  count: 75 },
    ],
  },
  {
    week_start: '2025-10-28',
    conversations: 724,
    atendidas_fuera_horario: 406,
    duracion_conversacion_seg: 156,
    avg_response_ms: 43000,
    resolution_rate: 0.84,
    escalation_rate: 0.082,
    conv_manana: 159, conv_tarde: 355, conv_noche: 145, conv_madrugada: 65,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 217 },
      { topic: 'Disponibilidad y fechas', count: 152 },
      { topic: 'Precios y tarifas',        count: 123 },
      { topic: 'Rutas y destinos',         count: 101 },
      { topic: 'Requisitos y licencias',   count: 80 },
    ],
  },
  {
    week_start: '2025-11-04',
    conversations: 761,
    atendidas_fuera_horario: 426,
    duracion_conversacion_seg: 155,
    avg_response_ms: 42500,
    resolution_rate: 0.84,
    escalation_rate: 0.081,
    conv_manana: 167, conv_tarde: 373, conv_noche: 152, conv_madrugada: 69,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 228 },
      { topic: 'Disponibilidad y fechas', count: 160 },
      { topic: 'Precios y tarifas',        count: 129 },
      { topic: 'Rutas y destinos',         count: 107 },
      { topic: 'Cancelaciones y cambios',  count: 84 },
    ],
  },
  {
    week_start: '2025-11-11',
    conversations: 798,
    atendidas_fuera_horario: 447,
    duracion_conversacion_seg: 154,
    avg_response_ms: 42000,
    resolution_rate: 0.85,
    escalation_rate: 0.079,
    conv_manana: 175, conv_tarde: 391, conv_noche: 160, conv_madrugada: 72,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 239 },
      { topic: 'Disponibilidad y fechas', count: 168 },
      { topic: 'Precios y tarifas',        count: 136 },
      { topic: 'Rutas y destinos',         count: 112 },
      { topic: 'Requisitos y licencias',   count: 88 },
    ],
  },
  {
    week_start: '2025-11-18',
    conversations: 841,
    atendidas_fuera_horario: 471,
    duracion_conversacion_seg: 153,
    avg_response_ms: 41500,
    resolution_rate: 0.85,
    escalation_rate: 0.077,
    conv_manana: 185, conv_tarde: 412, conv_noche: 168, conv_madrugada: 76,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 252 },
      { topic: 'Disponibilidad y fechas', count: 177 },
      { topic: 'Precios y tarifas',        count: 143 },
      { topic: 'Rutas y destinos',         count: 118 },
      { topic: 'Cancelaciones y cambios',  count: 93 },
    ],
  },
  {
    week_start: '2025-11-25',
    conversations: 879,
    atendidas_fuera_horario: 492,
    duracion_conversacion_seg: 152,
    avg_response_ms: 41000,
    resolution_rate: 0.86,
    escalation_rate: 0.076,
    conv_manana: 193, conv_tarde: 431, conv_noche: 176, conv_madrugada: 79,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 264 },
      { topic: 'Disponibilidad y fechas', count: 185 },
      { topic: 'Precios y tarifas',        count: 149 },
      { topic: 'Rutas y destinos',         count: 123 },
      { topic: 'Requisitos y licencias',   count: 97 },
    ],
  },
  {
    week_start: '2025-12-02',
    conversations: 912,
    atendidas_fuera_horario: 511,
    duracion_conversacion_seg: 151,
    avg_response_ms: 40500,
    resolution_rate: 0.86,
    escalation_rate: 0.074,
    conv_manana: 200, conv_tarde: 447, conv_noche: 183, conv_madrugada: 82,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 274 },
      { topic: 'Disponibilidad y fechas', count: 191 },
      { topic: 'Precios y tarifas',        count: 155 },
      { topic: 'Rutas y destinos',         count: 128 },
      { topic: 'Cancelaciones y cambios',  count: 100 },
    ],
  },
  {
    week_start: '2025-12-09',
    conversations: 948,
    atendidas_fuera_horario: 531,
    duracion_conversacion_seg: 150,
    avg_response_ms: 40000,
    resolution_rate: 0.87,
    escalation_rate: 0.072,
    conv_manana: 208, conv_tarde: 465, conv_noche: 190, conv_madrugada: 85,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 284 },
      { topic: 'Disponibilidad y fechas', count: 199 },
      { topic: 'Precios y tarifas',        count: 161 },
      { topic: 'Rutas y destinos',         count: 133 },
      { topic: 'Requisitos y licencias',   count: 104 },
    ],
  },
  {
    week_start: '2025-12-16',
    conversations: 989,
    atendidas_fuera_horario: 554,
    duracion_conversacion_seg: 149,
    avg_response_ms: 39500,
    resolution_rate: 0.87,
    escalation_rate: 0.070,
    conv_manana: 217, conv_tarde: 485, conv_noche: 198, conv_madrugada: 89,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 297 },
      { topic: 'Disponibilidad y fechas', count: 208 },
      { topic: 'Precios y tarifas',        count: 168 },
      { topic: 'Rutas y destinos',         count: 138 },
      { topic: 'Cancelaciones y cambios',  count: 109 },
    ],
  },
  {
    week_start: '2025-12-23',
    conversations: 847,
    atendidas_fuera_horario: 474,
    duracion_conversacion_seg: 153,
    avg_response_ms: 41000,
    resolution_rate: 0.86,
    escalation_rate: 0.075,
    conv_manana: 186, conv_tarde: 415, conv_noche: 170, conv_madrugada: 76,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 254 },
      { topic: 'Disponibilidad y fechas', count: 178 },
      { topic: 'Precios y tarifas',        count: 144 },
      { topic: 'Rutas y destinos',         count: 119 },
      { topic: 'Requisitos y licencias',   count: 93 },
    ],
  },
  {
    week_start: '2025-12-30',
    conversations: 712,
    atendidas_fuera_horario: 399,
    duracion_conversacion_seg: 155,
    avg_response_ms: 42000,
    resolution_rate: 0.85,
    escalation_rate: 0.078,
    conv_manana: 156, conv_tarde: 349, conv_noche: 143, conv_madrugada: 64,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 214 },
      { topic: 'Disponibilidad y fechas', count: 149 },
      { topic: 'Precios y tarifas',        count: 121 },
      { topic: 'Rutas y destinos',         count: 100 },
      { topic: 'Cancelaciones y cambios',  count: 78 },
    ],
  },
  {
    week_start: '2026-01-06',
    conversations: 1024,
    atendidas_fuera_horario: 574,
    duracion_conversacion_seg: 149,
    avg_response_ms: 39000,
    resolution_rate: 0.88,
    escalation_rate: 0.068,
    conv_manana: 225, conv_tarde: 502, conv_noche: 205, conv_madrugada: 92,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 307 },
      { topic: 'Disponibilidad y fechas', count: 215 },
      { topic: 'Precios y tarifas',        count: 174 },
      { topic: 'Rutas y destinos',         count: 143 },
      { topic: 'Requisitos y licencias',   count: 113 },
    ],
  },
  {
    week_start: '2026-01-13',
    conversations: 1087,
    atendidas_fuera_horario: 609,
    duracion_conversacion_seg: 148,
    avg_response_ms: 38500,
    resolution_rate: 0.88,
    escalation_rate: 0.067,
    conv_manana: 239, conv_tarde: 533, conv_noche: 218, conv_madrugada: 97,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 326 },
      { topic: 'Disponibilidad y fechas', count: 228 },
      { topic: 'Precios y tarifas',        count: 185 },
      { topic: 'Rutas y destinos',         count: 152 },
      { topic: 'Cancelaciones y cambios',  count: 120 },
    ],
  },
  {
    week_start: '2026-01-20',
    conversations: 1134,
    atendidas_fuera_horario: 635,
    duracion_conversacion_seg: 147,
    avg_response_ms: 38200,
    resolution_rate: 0.89,
    escalation_rate: 0.065,
    conv_manana: 249, conv_tarde: 556, conv_noche: 227, conv_madrugada: 102,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 340 },
      { topic: 'Disponibilidad y fechas', count: 238 },
      { topic: 'Precios y tarifas',        count: 193 },
      { topic: 'Rutas y destinos',         count: 159 },
      { topic: 'Requisitos y licencias',   count: 125 },
    ],
  },
  {
    week_start: '2026-01-27',
    conversations: 1178,
    atendidas_fuera_horario: 660,
    duracion_conversacion_seg: 146,
    avg_response_ms: 38000,
    resolution_rate: 0.89,
    escalation_rate: 0.063,
    conv_manana: 259, conv_tarde: 577, conv_noche: 236, conv_madrugada: 106,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 353 },
      { topic: 'Disponibilidad y fechas', count: 247 },
      { topic: 'Precios y tarifas',        count: 200 },
      { topic: 'Rutas y destinos',         count: 165 },
      { topic: 'Cancelaciones y cambios',  count: 130 },
    ],
  },
  {
    week_start: '2026-02-03',
    conversations: 1214,
    atendidas_fuera_horario: 680,
    duracion_conversacion_seg: 145,
    avg_response_ms: 37800,
    resolution_rate: 0.90,
    escalation_rate: 0.062,
    conv_manana: 267, conv_tarde: 595, conv_noche: 243, conv_madrugada: 109,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 364 },
      { topic: 'Disponibilidad y fechas', count: 255 },
      { topic: 'Precios y tarifas',        count: 206 },
      { topic: 'Rutas y destinos',         count: 170 },
      { topic: 'Requisitos y licencias',   count: 134 },
    ],
  },
  {
    week_start: '2026-02-10',
    conversations: 1263,
    atendidas_fuera_horario: 707,
    duracion_conversacion_seg: 144,
    avg_response_ms: 37500,
    resolution_rate: 0.90,
    escalation_rate: 0.060,
    conv_manana: 278, conv_tarde: 619, conv_noche: 253, conv_madrugada: 113,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 379 },
      { topic: 'Disponibilidad y fechas', count: 265 },
      { topic: 'Precios y tarifas',        count: 215 },
      { topic: 'Rutas y destinos',         count: 177 },
      { topic: 'Cancelaciones y cambios',  count: 139 },
    ],
  },
  {
    week_start: '2026-02-17',
    conversations: 1298,
    atendidas_fuera_horario: 727,
    duracion_conversacion_seg: 144,
    avg_response_ms: 37200,
    resolution_rate: 0.91,
    escalation_rate: 0.058,
    conv_manana: 285, conv_tarde: 636, conv_noche: 260, conv_madrugada: 117,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 389 },
      { topic: 'Disponibilidad y fechas', count: 273 },
      { topic: 'Precios y tarifas',        count: 221 },
      { topic: 'Rutas y destinos',         count: 182 },
      { topic: 'Requisitos y licencias',   count: 143 },
    ],
  },
  {
    week_start: '2026-02-24',
    conversations: 1341,
    atendidas_fuera_horario: 751,
    duracion_conversacion_seg: 143,
    avg_response_ms: 37000,
    resolution_rate: 0.91,
    escalation_rate: 0.057,
    conv_manana: 295, conv_tarde: 657, conv_noche: 268, conv_madrugada: 121,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 402 },
      { topic: 'Disponibilidad y fechas', count: 281 },
      { topic: 'Precios y tarifas',        count: 228 },
      { topic: 'Rutas y destinos',         count: 188 },
      { topic: 'Cancelaciones y cambios',  count: 148 },
    ],
  },
  {
    week_start: '2026-03-03',
    conversations: 1374,
    atendidas_fuera_horario: 770,
    duracion_conversacion_seg: 143,
    avg_response_ms: 37000,
    resolution_rate: 0.91,
    escalation_rate: 0.055,
    conv_manana: 302, conv_tarde: 673, conv_noche: 275, conv_madrugada: 124,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 412 },
      { topic: 'Disponibilidad y fechas', count: 288 },
      { topic: 'Precios y tarifas',        count: 233 },
      { topic: 'Rutas y destinos',         count: 192 },
      { topic: 'Requisitos y licencias',   count: 151 },
    ],
  },
  {
    week_start: '2026-03-10',
    conversations: 1398,
    atendidas_fuera_horario: 783,
    duracion_conversacion_seg: 142,
    avg_response_ms: 38000,
    resolution_rate: 0.92,
    escalation_rate: 0.054,
    conv_manana: 307, conv_tarde: 685, conv_noche: 280, conv_madrugada: 126,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 419 },
      { topic: 'Disponibilidad y fechas', count: 294 },
      { topic: 'Precios y tarifas',        count: 238 },
      { topic: 'Rutas y destinos',         count: 196 },
      { topic: 'Cancelaciones y cambios',  count: 154 },
    ],
  },
  // ── Últimas 4 semanas (mes actual) ────────────────────────────────────────
  {
    week_start: '2026-03-17',
    conversations: 1387,
    atendidas_fuera_horario: 804,
    duracion_conversacion_seg: 142,
    avg_response_ms: 38000,
    resolution_rate: 0.91,
    escalation_rate: 0.05,
    conv_manana: 312,
    conv_tarde: 687,
    conv_noche: 284,
    conv_madrugada: 104,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 412 },
      { topic: 'Disponibilidad y fechas', count: 287 },
      { topic: 'Precios y tarifas',        count: 234 },
      { topic: 'Rutas y destinos',         count: 198 },
      { topic: 'Requisitos y licencias',   count: 156 },
    ],
  },
  {
    week_start: '2026-03-24',
    conversations: 1462,
    atendidas_fuera_horario: 847,
    duracion_conversacion_seg: 138,
    avg_response_ms: 37000,
    resolution_rate: 0.93,
    escalation_rate: 0.04,
    conv_manana: 328,
    conv_tarde: 724,
    conv_noche: 301,
    conv_madrugada: 109,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 441 },
      { topic: 'Disponibilidad y fechas', count: 312 },
      { topic: 'Precios y tarifas',        count: 248 },
      { topic: 'Rutas y destinos',         count: 207 },
      { topic: 'Requisitos y licencias',   count: 168 },
    ],
  },
  {
    week_start: '2026-03-31',
    conversations: 1298,
    atendidas_fuera_horario: 751,
    duracion_conversacion_seg: 147,
    avg_response_ms: 38000,
    resolution_rate: 0.89,
    escalation_rate: 0.06,
    conv_manana: 289,
    conv_tarde: 641,
    conv_noche: 267,
    conv_madrugada: 101,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 387 },
      { topic: 'Disponibilidad y fechas', count: 269 },
      { topic: 'Precios y tarifas',        count: 218 },
      { topic: 'Rutas y destinos',         count: 184 },
      { topic: 'Cancelaciones y cambios',  count: 142 },
    ],
  },
  {
    week_start: '2026-04-07',
    conversations: 1700,
    atendidas_fuera_horario: 839,
    duracion_conversacion_seg: 134,
    avg_response_ms: 36000,
    resolution_rate: 0.94,
    escalation_rate: 0.04,
    conv_manana: 378,
    conv_tarde: 841,
    conv_noche: 349,
    conv_madrugada: 132,
    top_topics: [
      { topic: 'Reservas de embarcación', count: 518 },
      { topic: 'Disponibilidad y fechas', count: 362 },
      { topic: 'Precios y tarifas',        count: 289 },
      { topic: 'Rutas y destinos',         count: 241 },
      { topic: 'Requisitos y licencias',   count: 198 },
    ],
  },
]

export const AQUAJETS_HOURLY: Record<number, number> = {
  0: 18,  1: 12,  2: 8,   3: 6,   4: 9,   5: 21,
  6: 38,  7: 64,  8: 89,  9: 124, 10: 187, 11: 219,
  12: 241, 13: 198, 14: 174, 15: 204, 16: 228, 17: 267,
  18: 312, 19: 287, 20: 241, 21: 178, 22: 134, 23: 87,
}

export const AQUAJETS_BY_WEEKDAY: Record<number, number> = {
  0: 748,  // Lun
  1: 712,  // Mar
  2: 698,  // Mié
  3: 834,  // Jue
  4: 921,  // Vie
  5: 1147, // Sáb — pico reservas fin de semana
  6: 787,  // Dom
}

export const AQUAJETS_DURATION_DIST = [
  { label: 'Menos de 1 min', range: '<1m',  count: 487,  color: '#10b981' },
  { label: '1 – 3 minutos',  range: '1-3m', count: 2134, color: '#6366f1' },
  { label: '3 – 5 minutos',  range: '3-5m', count: 1842, color: '#c026a8' },
  { label: '5 – 10 minutos', range: '5-10m',count: 978,  color: '#f59e0b' },
  { label: 'Más de 10 min',  range: '>10m', count: 406,  color: '#ef4444' },
]

export const AQUAJETS_RESPONSE_DIST = [
  { label: '< 1 segundo',    count: 412,  color: '#10b981' },
  { label: '1 – 2 segundos', count: 1847, color: '#6366f1' },
  { label: '2 – 4 segundos', count: 2241, color: '#c026a8' },
  { label: '4 – 8 segundos', count: 987,  color: '#f59e0b' },
  { label: '> 8 segundos',   count: 360,  color: '#ef4444' },
]

export const AQUAJETS_ESCALATED_TOPICS = [
  { topic: 'Precios especiales y descuentos', escalated: 87, resolved: 23, pct: 79 },
  { topic: 'Cancelaciones y reembolsos',      escalated: 64, resolved: 41, pct: 61 },
  { topic: 'Incidencias durante el alquiler', escalated: 48, resolved: 12, pct: 80 },
  { topic: 'Documentación y licencias',       escalated: 39, resolved: 28, pct: 58 },
  { topic: 'Grupos grandes (+8 personas)',     escalated: 34, resolved: 87, pct: 28 },
]

export const AQUAJETS_TOPIC_TREND: Record<string, number[]> = {
  'Reservas de embarcación': [412, 441, 387, 518],
  'Disponibilidad y fechas': [287, 312, 269, 362],
  'Precios y tarifas':       [234, 248, 218, 289],
  'Rutas y destinos':        [198, 207, 184, 241],
  'Requisitos y licencias':  [156, 168, 142, 198],
}

export function getDemoClientWithProject(clientId: string) {
  const client = DEMO_CLIENTS.find(c => c.id === clientId)
  const project = DEMO_PROJECTS.find(p => p.client_id === clientId)
  return client ? { ...client, project } : null
}

export function getDemoClientsWithProjects() {
  return DEMO_CLIENTS.map(client => ({
    ...client,
    project: DEMO_PROJECTS.find(p => p.client_id === client.id),
  }))
}
