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
