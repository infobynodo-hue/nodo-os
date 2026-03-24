import type { ServiceType } from '../types'

interface PhaseTemplate {
  phase_number: number
  phase_name: string
  phase_description: string
}

interface TaskTemplate {
  phase_number: number
  title: string
  description?: string
  assigned_to: 'internal' | 'client'
  order_index: number
}

// ─── Fases por servicio ───────────────────────────────────────────────────────

export const PHASES: Record<ServiceType, PhaseTemplate[]> = {
  bpo_claudia: [
    { phase_number: 1, phase_name: 'Venta y Cierre', phase_description: 'Formalización del contrato y primer pago.' },
    { phase_number: 2, phase_name: 'Onboarding', phase_description: 'Recopilación de información del negocio y configuración inicial.' },
    { phase_number: 3, phase_name: 'Construcción', phase_description: 'Desarrollo e implementación técnica de Claudia.' },
    { phase_number: 4, phase_name: 'Pruebas Internas', phase_description: 'Testing exhaustivo antes de lanzar con leads reales.' },
    { phase_number: 5, phase_name: 'Migración Progresiva Ronda 1', phase_description: 'Activación controlada con primeros leads reales.' },
    { phase_number: 6, phase_name: 'Calibración y Ronda 2', phase_description: 'Ajustes post-Ronda 1 y ampliación del volumen.' },
    { phase_number: 7, phase_name: 'Operación Plena', phase_description: 'Migración completa y ciclo operativo mensual.' },
  ],
  bpo_lucia: [
    { phase_number: 1, phase_name: 'Venta y Cierre', phase_description: 'Formalización del contrato y primer pago.' },
    { phase_number: 2, phase_name: 'Onboarding', phase_description: 'Recopilación de información y scripts de llamadas.' },
    { phase_number: 3, phase_name: 'Construcción', phase_description: 'Configuración de Lucía en Retell AI.' },
    { phase_number: 4, phase_name: 'Pruebas Internas', phase_description: 'Testing de llamadas y escenarios.' },
    { phase_number: 5, phase_name: 'Migración Progresiva', phase_description: 'Activación con volumen limitado de llamadas.' },
    { phase_number: 6, phase_name: 'Operación Plena', phase_description: 'Operación completa y seguimiento mensual.' },
  ],
  track_property: [
    { phase_number: 1, phase_name: 'Venta y Onboarding', phase_description: 'Contrato y recopilación de catálogo de propiedades.' },
    { phase_number: 2, phase_name: 'Construcción', phase_description: 'Configuración del agente inmobiliario.' },
    { phase_number: 3, phase_name: 'Pruebas', phase_description: 'Testing de búsqueda, cualificación y agendado.' },
    { phase_number: 4, phase_name: 'Activación', phase_description: 'Lanzamiento con leads reales.' },
    { phase_number: 5, phase_name: 'Operación Plena', phase_description: 'Operación continua con actualización de catálogo.' },
  ],
  recovery: [
    { phase_number: 1, phase_name: 'Venta y Onboarding', phase_description: 'Contrato y entrega de base de deudores.' },
    { phase_number: 2, phase_name: 'Construcción', phase_description: 'Configuración de lógica de negociación.' },
    { phase_number: 3, phase_name: 'Pruebas', phase_description: 'Testing de flujos de negociación y acuerdos.' },
    { phase_number: 4, phase_name: 'Activación', phase_description: 'Lanzamiento con lote inicial de deudores.' },
    { phase_number: 5, phase_name: 'Operación', phase_description: 'Campañas periódicas de recuperación.' },
  ],
}

// ─── Tareas por servicio ──────────────────────────────────────────────────────

export const TASKS: Record<ServiceType, TaskTemplate[]> = {
  bpo_claudia: [
    // Fase 1 - Internas
    { phase_number: 1, title: 'Contrato firmado y en archivo', assigned_to: 'internal', order_index: 0 },
    { phase_number: 1, title: 'Primer pago confirmado', assigned_to: 'internal', order_index: 1 },
    { phase_number: 1, title: 'Expediente interno del proyecto creado', assigned_to: 'internal', order_index: 2 },
    { phase_number: 1, title: 'Fecha de inicio comunicada al cliente', assigned_to: 'internal', order_index: 3 },
    { phase_number: 1, title: 'Email de bienvenida enviado con acceso al portal', assigned_to: 'internal', order_index: 4 },
    // Fase 2 - Cliente
    { phase_number: 2, title: 'Completar sesión de descubrimiento en el chat', assigned_to: 'client', order_index: 0 },
    { phase_number: 2, title: 'Confirmar información de contacto y responsables', assigned_to: 'client', order_index: 1 },
    { phase_number: 2, title: 'Proporcionar ejemplos de conversaciones reales con clientes', assigned_to: 'client', order_index: 2 },
    { phase_number: 2, title: 'Confirmar acceso a Meta Business Manager', assigned_to: 'client', order_index: 3 },
    { phase_number: 2, title: 'Adquirir SIM card nueva (número dedicado)', assigned_to: 'client', order_index: 4 },
    // Fase 2 - Internas
    { phase_number: 2, title: 'Revisión completa de respuestas del onboarding', assigned_to: 'internal', order_index: 5 },
    { phase_number: 2, title: 'Validar sección de objeciones y situaciones (mínimo 3 casos)', assigned_to: 'internal', order_index: 6 },
    { phase_number: 2, title: 'Validar lógica del agente', assigned_to: 'internal', order_index: 7 },
    { phase_number: 2, title: 'Validar accesos y credenciales', assigned_to: 'internal', order_index: 8 },
    { phase_number: 2, title: 'Confirmación de inicio de Fase 3 enviada al cliente', assigned_to: 'internal', order_index: 9 },
    // Fase 3 - Internas
    { phase_number: 3, title: 'Estructura del agente diseñada y entregada al equipo técnico', assigned_to: 'internal', order_index: 0 },
    { phase_number: 3, title: 'VPS y n8n configurados (Contabo)', assigned_to: 'internal', order_index: 1 },
    { phase_number: 3, title: 'WhatsApp Business API conectada vía yCloud', assigned_to: 'internal', order_index: 2 },
    { phase_number: 3, title: 'Integraciones de CRM/agenda configuradas', assigned_to: 'internal', order_index: 3 },
    { phase_number: 3, title: 'Prompt técnico implementado en n8n', assigned_to: 'internal', order_index: 4 },
    // Fase 3 - Cliente
    { phase_number: 3, title: 'Meta Business Manager verificado y activo', assigned_to: 'client', order_index: 5 },
    { phase_number: 3, title: 'Número de WhatsApp nuevo activo y disponible', assigned_to: 'client', order_index: 6 },
    // Fase 4 - Internas
    { phase_number: 4, title: 'Test 1: Conversación normal de inicio a fin ✓', assigned_to: 'internal', order_index: 0 },
    { phase_number: 4, title: 'Test 2: Todas las objeciones mapeadas testeadas ✓', assigned_to: 'internal', order_index: 1 },
    { phase_number: 4, title: 'Test 3: Escenarios de fallo probados ✓', assigned_to: 'internal', order_index: 2 },
    { phase_number: 4, title: 'Test 4: Escalamiento activado y verificado ✓', assigned_to: 'internal', order_index: 3 },
    { phase_number: 4, title: 'Test 5: Edge cases probados (emojis, audios, stickers) ✓', assigned_to: 'internal', order_index: 4 },
    { phase_number: 4, title: 'Claudia aprobada para Ronda 1', assigned_to: 'internal', order_index: 5 },
    // Fase 5 - Internas
    { phase_number: 5, title: 'Ronda 1 activa con 30-50 leads reales', assigned_to: 'internal', order_index: 0 },
    { phase_number: 5, title: 'Monitoreo diario primeros 7 días', assigned_to: 'internal', order_index: 1 },
    { phase_number: 5, title: 'Registro de conversaciones con errores o mejoras detectadas', assigned_to: 'internal', order_index: 2 },
    // Fase 5 - Cliente
    { phase_number: 5, title: 'Derivar primeros leads al número nuevo de Claudia', assigned_to: 'client', order_index: 3 },
    { phase_number: 5, title: 'Reportar cualquier conversación con respuesta incorrecta', assigned_to: 'client', order_index: 4 },
    // Fase 6 - Internas
    { phase_number: 6, title: 'Ajustes post-Ronda 1 implementados', assigned_to: 'internal', order_index: 0 },
    { phase_number: 6, title: 'Ronda 2 activa y validada', assigned_to: 'internal', order_index: 1 },
    { phase_number: 6, title: 'Informe de resultados Ronda 1 enviado al cliente', assigned_to: 'internal', order_index: 2 },
    // Fase 6 - Cliente
    { phase_number: 6, title: 'Revisar informe de Ronda 1', assigned_to: 'client', order_index: 3 },
    { phase_number: 6, title: 'Confirmar aprobación para migración completa', assigned_to: 'client', order_index: 4 },
    // Fase 7 - Internas
    { phase_number: 7, title: 'Todos los contactos migrados al número de Claudia', assigned_to: 'internal', order_index: 0 },
    { phase_number: 7, title: 'Reporte mensual programado (día 5 de cada mes)', assigned_to: 'internal', order_index: 1 },
    { phase_number: 7, title: 'Ciclo semanal de revisión activo', assigned_to: 'internal', order_index: 2 },
    // Fase 7 - Cliente (recurrentes)
    { phase_number: 7, title: 'Revisar reporte mensual', assigned_to: 'client', order_index: 3 },
    { phase_number: 7, title: 'Reportar cambios en el negocio que afecten al bot', assigned_to: 'client', order_index: 4 },
  ],
  bpo_lucia: [
    // Fase 1
    { phase_number: 1, title: 'Contrato firmado y en archivo', assigned_to: 'internal', order_index: 0 },
    { phase_number: 1, title: 'Primer pago confirmado', assigned_to: 'internal', order_index: 1 },
    { phase_number: 1, title: 'Expediente interno del proyecto creado', assigned_to: 'internal', order_index: 2 },
    { phase_number: 1, title: 'Fecha de inicio comunicada al cliente', assigned_to: 'internal', order_index: 3 },
    { phase_number: 1, title: 'Email de bienvenida enviado con acceso al portal', assigned_to: 'internal', order_index: 4 },
    // Fase 2 - Cliente
    { phase_number: 2, title: 'Completar sesión de descubrimiento en el chat', assigned_to: 'client', order_index: 0 },
    { phase_number: 2, title: 'Proporcionar scripts de llamadas reales (grabaciones o transcripciones)', assigned_to: 'client', order_index: 1 },
    { phase_number: 2, title: 'Definir horario de atención telefónica', assigned_to: 'client', order_index: 2 },
    { phase_number: 2, title: 'Confirmar número de teléfono dedicado para Lucía', assigned_to: 'client', order_index: 3 },
    // Fase 2 - Internas
    { phase_number: 2, title: 'Revisión de respuestas del onboarding', assigned_to: 'internal', order_index: 4 },
    { phase_number: 2, title: 'Validar scripts y flujos de llamada', assigned_to: 'internal', order_index: 5 },
    { phase_number: 2, title: 'Configurar número en Retell AI', assigned_to: 'internal', order_index: 6 },
    // Fase 3
    { phase_number: 3, title: 'Estructura del agente de voz diseñada', assigned_to: 'internal', order_index: 0 },
    { phase_number: 3, title: 'Configuración en Retell AI', assigned_to: 'internal', order_index: 1 },
    { phase_number: 3, title: 'Integración con CRM y agenda', assigned_to: 'internal', order_index: 2 },
    { phase_number: 3, title: 'Voice testing interno', assigned_to: 'internal', order_index: 3 },
    // Fase 4
    { phase_number: 4, title: 'Test de llamadas con escenarios comunes', assigned_to: 'internal', order_index: 0 },
    { phase_number: 4, title: 'Test de objeciones por voz', assigned_to: 'internal', order_index: 1 },
    { phase_number: 4, title: 'Test de escalamiento a humano', assigned_to: 'internal', order_index: 2 },
    { phase_number: 4, title: 'Test de calidad de voz y latencia', assigned_to: 'internal', order_index: 3 },
    { phase_number: 4, title: 'Lucía aprobada para Ronda 1', assigned_to: 'internal', order_index: 4 },
    // Fase 5
    { phase_number: 5, title: 'Activación con volumen limitado de llamadas', assigned_to: 'internal', order_index: 0 },
    { phase_number: 5, title: 'Monitoreo y grabaciones revisadas', assigned_to: 'internal', order_index: 1 },
    { phase_number: 5, title: 'Derivar primeras llamadas a Lucía', assigned_to: 'client', order_index: 2 },
    { phase_number: 5, title: 'Reportar casos problemáticos', assigned_to: 'client', order_index: 3 },
    // Fase 6
    { phase_number: 6, title: 'Todos los contactos migrados al número de Lucía', assigned_to: 'internal', order_index: 0 },
    { phase_number: 6, title: 'Reporte mensual programado (día 5 de cada mes)', assigned_to: 'internal', order_index: 1 },
    { phase_number: 6, title: 'Revisar reporte mensual', assigned_to: 'client', order_index: 2 },
    { phase_number: 6, title: 'Reportar cambios en el negocio que afecten a Lucía', assigned_to: 'client', order_index: 3 },
  ],
  track_property: [
    // Fase 1 - Cliente
    { phase_number: 1, title: 'Completar sesión de descubrimiento', assigned_to: 'client', order_index: 0 },
    { phase_number: 1, title: 'Proporcionar listado actual de propiedades (Excel/CSV)', assigned_to: 'client', order_index: 1 },
    { phase_number: 1, title: 'Definir criterios de cualificación de compradores', assigned_to: 'client', order_index: 2 },
    { phase_number: 1, title: 'Confirmar CRM inmobiliario utilizado', assigned_to: 'client', order_index: 3 },
    // Fase 1 - Internas
    { phase_number: 1, title: 'Revisión completa del onboarding', assigned_to: 'internal', order_index: 4 },
    { phase_number: 1, title: 'Validar estructura de propiedades', assigned_to: 'internal', order_index: 5 },
    { phase_number: 1, title: 'Configurar integración con CRM inmobiliario', assigned_to: 'internal', order_index: 6 },
    // Fase 2
    { phase_number: 2, title: 'Agente configurado con catálogo de propiedades', assigned_to: 'internal', order_index: 0 },
    { phase_number: 2, title: 'Filtros de búsqueda implementados (zona, precio, tipo)', assigned_to: 'internal', order_index: 1 },
    { phase_number: 2, title: 'Integración con agenda de visitas', assigned_to: 'internal', order_index: 2 },
    { phase_number: 2, title: 'Flujo de cualificación de compradores implementado', assigned_to: 'internal', order_index: 3 },
    // Fase 3
    { phase_number: 3, title: 'Test de búsqueda de propiedades', assigned_to: 'internal', order_index: 0 },
    { phase_number: 3, title: 'Test de cualificación de comprador', assigned_to: 'internal', order_index: 1 },
    { phase_number: 3, title: 'Test de agendado de visita', assigned_to: 'internal', order_index: 2 },
    { phase_number: 3, title: 'Test de seguimiento post-visita', assigned_to: 'internal', order_index: 3 },
    // Fase 4
    { phase_number: 4, title: 'Activación con leads reales', assigned_to: 'internal', order_index: 0 },
    { phase_number: 4, title: 'Monitoreo de primeras conversaciones', assigned_to: 'internal', order_index: 1 },
    // Fase 5
    { phase_number: 5, title: 'Seguimiento mensual activo', assigned_to: 'internal', order_index: 0 },
    { phase_number: 5, title: 'Actualización de catálogo de propiedades', assigned_to: 'client', order_index: 1 },
  ],
  recovery: [
    // Fase 1 - Cliente
    { phase_number: 1, title: 'Completar sesión de descubrimiento', assigned_to: 'client', order_index: 0 },
    { phase_number: 1, title: 'Entregar base de datos de deudores (formato acordado)', assigned_to: 'client', order_index: 1 },
    { phase_number: 1, title: 'Definir rangos de deuda y estrategias de negociación permitidas', assigned_to: 'client', order_index: 2 },
    { phase_number: 1, title: 'Confirmar acuerdos de pago posibles (plazos, descuentos)', assigned_to: 'client', order_index: 3 },
    // Fase 1 - Internas
    { phase_number: 1, title: 'Revisión de base de datos de deudores', assigned_to: 'internal', order_index: 4 },
    { phase_number: 1, title: 'Validar estrategias de negociación', assigned_to: 'internal', order_index: 5 },
    { phase_number: 1, title: 'Confirmar cumplimiento legal por país', assigned_to: 'internal', order_index: 6 },
    // Fase 2
    { phase_number: 2, title: 'Agente configurado con lógica de negociación', assigned_to: 'internal', order_index: 0 },
    { phase_number: 2, title: 'Flujos de pago parcial implementados', assigned_to: 'internal', order_index: 1 },
    { phase_number: 2, title: 'Integración con sistema de cobro', assigned_to: 'internal', order_index: 2 },
    { phase_number: 2, title: 'Mensajes por tramo de deuda configurados', assigned_to: 'internal', order_index: 3 },
    // Fase 3
    { phase_number: 3, title: 'Test de flujo de negociación completo', assigned_to: 'internal', order_index: 0 },
    { phase_number: 3, title: 'Test de acuerdos de pago', assigned_to: 'internal', order_index: 1 },
    { phase_number: 3, title: 'Test de escalamiento a gestor humano', assigned_to: 'internal', order_index: 2 },
    { phase_number: 3, title: 'Test de registro de acuerdos', assigned_to: 'internal', order_index: 3 },
    // Fase 4
    { phase_number: 4, title: 'Lanzamiento con lote inicial de deudores', assigned_to: 'internal', order_index: 0 },
    { phase_number: 4, title: 'Monitoreo de primeras negociaciones', assigned_to: 'internal', order_index: 1 },
    // Fase 5
    { phase_number: 5, title: 'Campañas periódicas de recuperación activas', assigned_to: 'internal', order_index: 0 },
    { phase_number: 5, title: 'Revisión mensual de resultados de cobro', assigned_to: 'internal', order_index: 1 },
  ],
}
