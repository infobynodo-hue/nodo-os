import { useEffect, useState, useCallback, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CalendarDays,
  Clock,
  Building2,
  FileText,
  Trash2,
  Edit3,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore, IS_DEMO } from '../../store/auth'
import type { CalendarEvent } from '../../types'

// ─── Event Types ─────────────────────────────────────────────────────────────
const EVENT_TYPES = {
  entrega:         { label: 'Entrega',           color: '#22c55e',  bg: 'bg-green-500/20',   text: 'text-green-400' },
  reunion_cliente: { label: 'Reunión cliente',   color: '#3b82f6',  bg: 'bg-blue-500/20',    text: 'text-blue-400' },
  info_cliente:    { label: 'Info de cliente',   color: '#f97316',  bg: 'bg-orange-500/20',  text: 'text-orange-400' },
  reunion_interna: { label: 'Reunión interna',   color: '#8B22E8',  bg: 'bg-violet-500/20',  text: 'text-violet-400' },
  seguimiento:     { label: 'Seguimiento',       color: '#C026A8',  bg: 'bg-pink-500/20',    text: 'text-pink-400' },
  tarea:           { label: 'Tarea',             color: '#6b7280',  bg: 'bg-gray-500/20',    text: 'text-gray-400' },
  otro:            { label: 'Otro',              color: '#6b7280',  bg: 'bg-gray-500/20',    text: 'text-gray-400' },
} as const

type EventType = keyof typeof EVENT_TYPES

// ─── Demo Events ─────────────────────────────────────────────────────────────
function buildDemoEvents(): CalendarEvent[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  return [
    {
      id: 'demo-1',
      title: 'Entrega BPO Claudia — DentaPlus',
      description: 'Entrega del empleado digital configurado.',
      event_type: 'entrega',
      start_at: new Date(y, m, 5, 10, 0).toISOString(),
      end_at: new Date(y, m, 5, 11, 0).toISOString(),
      all_day: false,
      source: 'manual',
      created_at: new Date().toISOString(),
      clients: { business_name: 'DentaPlus' },
    },
    {
      id: 'demo-2',
      title: 'Reunión de kick-off',
      description: 'Primera reunión con el cliente para revisar el proyecto.',
      event_type: 'reunion_cliente',
      start_at: new Date(y, m, 8, 16, 0).toISOString(),
      end_at: new Date(y, m, 8, 17, 0).toISOString(),
      all_day: false,
      source: 'manual',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-3',
      title: 'Info horarios Estética Bella',
      event_type: 'info_cliente',
      start_at: new Date(y, m, 12, 9, 0).toISOString(),
      all_day: false,
      source: 'plug_request',
      created_at: new Date().toISOString(),
      clients: { business_name: 'Estética Bella' },
    },
    {
      id: 'demo-4',
      title: 'Reunión interna equipo',
      event_type: 'reunion_interna',
      start_at: new Date(y, m, now.getDate(), 11, 0).toISOString(),
      end_at: new Date(y, m, now.getDate(), 12, 0).toISOString(),
      all_day: false,
      source: 'manual',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-5',
      title: 'Seguimiento mensual Track Property',
      event_type: 'seguimiento',
      start_at: new Date(y, m, 20, 10, 0).toISOString(),
      all_day: false,
      source: 'lead_activity',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-6',
      title: 'Preparar propuesta recovery',
      event_type: 'tarea',
      start_at: new Date(y, m, 25).toISOString(),
      all_day: true,
      source: 'manual',
      created_at: new Date().toISOString(),
    },
  ]
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DAY_NAMES_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const DAY_NAMES_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

// ISO weekday: Monday=0 … Sunday=6
function isoWeekday(d: Date) {
  return (d.getDay() + 6) % 7
}

function formatSpanishDate(d: Date, allDay: boolean, endStr?: string) {
  const dayName = DAY_NAMES_LONG[isoWeekday(d)]
  const day = d.getDate()
  const month = MONTH_NAMES[d.getMonth()].toLowerCase()
  if (allDay) {
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${day} de ${month} · Todo el día`
  }
  const startTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  let result = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${day} de ${month} · ${startTime}`
  if (endStr) {
    const end = new Date(endStr)
    const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
    result += ` – ${endTime}`
  }
  return result
}

// ─── Client Option ────────────────────────────────────────────────────────────
interface ClientOption {
  id: string
  business_name: string
}

// ─── Form State ───────────────────────────────────────────────────────────────
interface EventForm {
  title: string
  event_type: EventType
  all_day: boolean
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  client_id: string
  description: string
}

function defaultForm(date?: Date, time?: string): EventForm {
  const d = date ?? new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return {
    title: '',
    event_type: 'reunion_cliente',
    all_day: !time,
    start_date: dateStr,
    start_time: time ?? '09:00',
    end_date: dateStr,
    end_time: time ? `${String(parseInt(time.split(':')[0]) + 1).padStart(2, '0')}:00` : '10:00',
    client_id: '',
    description: '',
  }
}

// ─── Hours for week view ──────────────────────────────────────────────────────
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8..20
const CELL_HEIGHT = 52

// ─── CalendarPage ─────────────────────────────────────────────────────────────
export function CalendarPage() {
  const { user } = useAuthStore()
  const today = new Date()

  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [viewMode, setViewMode] = useState<'mes' | 'semana'>('mes')
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date()
    d.setDate(d.getDate() - isoWeekday(d))
    return startOfDay(d)
  })

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])

  // Modal / drawer state
  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [drawerEditMode, setDrawerEditMode] = useState(false)
  const [form, setForm] = useState<EventForm>(defaultForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const currentTimeRef = useRef<HTMLDivElement>(null)

  // ── Load clients ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (IS_DEMO) return
    supabase.from('clients').select('id, business_name').eq('is_active', true).order('business_name').then(({ data }) => {
      if (data) setClients(data as ClientOption[])
    })
  }, [])

  // ── Load events ───────────────────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      if (IS_DEMO) {
        setEvents(buildDemoEvents())
        return
      }

      let start: Date
      let end: Date

      if (viewMode === 'mes') {
        start = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
        end = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0, 23, 59, 59)
      } else {
        start = weekStart
        end = addDays(weekStart, 6)
        end.setHours(23, 59, 59)
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, clients(business_name)')
        .gte('start_at', start.toISOString())
        .lte('start_at', end.toISOString())
        .order('start_at')

      if (error) throw error

      if (!data || data.length === 0) {
        if (user?.role === 'superadmin') {
          setEvents(buildDemoEvents())
        } else {
          setEvents([])
        }
      } else {
        setEvents(data as CalendarEvent[])
      }
    } finally {
      setLoading(false)
    }
  }, [viewMonth, viewMode, weekStart, user?.role])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // ── Scroll to current time in week view ──────────────────────────────────
  useEffect(() => {
    if (viewMode === 'semana' && currentTimeRef.current) {
      currentTimeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [viewMode])

  // ── Navigation ───────────────────────────────────────────────────────────
  function prevPeriod() {
    if (viewMode === 'mes') {
      setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
    } else {
      setWeekStart(addDays(weekStart, -7))
    }
  }

  function nextPeriod() {
    if (viewMode === 'mes') {
      setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
    } else {
      setWeekStart(addDays(weekStart, 7))
    }
  }

  function goToToday() {
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    const d = new Date()
    d.setDate(d.getDate() - isoWeekday(d))
    setWeekStart(startOfDay(d))
  }

  // ── Open new event modal ──────────────────────────────────────────────────
  function openNewModal(date?: Date, time?: string) {
    setForm(defaultForm(date, time))
    setShowNewModal(true)
  }

  // ── Save new event ────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const toISOLocal = (dateStr: string, timeStr: string) => {
        const [y, mo, d] = dateStr.split('-').map(Number)
        const [h, mi] = timeStr.split(':').map(Number)
        return new Date(y, mo - 1, d, h, mi).toISOString()
      }

      const start_at = form.all_day
        ? new Date(form.start_date + 'T00:00:00').toISOString()
        : toISOLocal(form.start_date, form.start_time)
      const end_at = form.end_date
        ? (form.all_day ? new Date(form.end_date + 'T23:59:59').toISOString() : toISOLocal(form.end_date, form.end_time))
        : undefined

      if (IS_DEMO) {
        const newEv: CalendarEvent = {
          id: `demo-new-${Date.now()}`,
          title: form.title,
          description: form.description || undefined,
          event_type: form.event_type,
          start_at,
          end_at,
          all_day: form.all_day,
          client_id: form.client_id || undefined,
          source: 'manual',
          created_at: new Date().toISOString(),
          created_by: user?.id,
          clients: form.client_id
            ? { business_name: clients.find(c => c.id === form.client_id)?.business_name ?? '' }
            : undefined,
        }
        setEvents(prev => [...prev, newEv])
      } else {
        const { error } = await supabase.from('calendar_events').insert({
          title: form.title,
          event_type: form.event_type,
          start_at,
          end_at,
          all_day: form.all_day,
          client_id: form.client_id || null,
          description: form.description || null,
          created_by: user?.id,
          source: 'manual',
        })
        if (error) throw error
        await loadEvents()
      }

      setShowNewModal(false)
    } finally {
      setSaving(false)
    }
  }

  // ── Save edit ─────────────────────────────────────────────────────────────
  async function handleEditSave() {
    if (!selectedEvent || !form.title.trim()) return
    setSaving(true)
    try {
      const toISOLocal = (dateStr: string, timeStr: string) => {
        const [y, mo, d] = dateStr.split('-').map(Number)
        const [h, mi] = timeStr.split(':').map(Number)
        return new Date(y, mo - 1, d, h, mi).toISOString()
      }

      const start_at = form.all_day
        ? new Date(form.start_date + 'T00:00:00').toISOString()
        : toISOLocal(form.start_date, form.start_time)
      const end_at = form.end_date
        ? (form.all_day ? new Date(form.end_date + 'T23:59:59').toISOString() : toISOLocal(form.end_date, form.end_time))
        : undefined

      if (IS_DEMO) {
        const updatedEvent: CalendarEvent = {
          ...selectedEvent,
          title: form.title,
          description: form.description || undefined,
          event_type: form.event_type,
          start_at,
          end_at,
          all_day: form.all_day,
          client_id: form.client_id || undefined,
          clients: form.client_id
            ? { business_name: clients.find(c => c.id === form.client_id)?.business_name ?? '' }
            : undefined,
        }
        setEvents(prev => prev.map(e => e.id === selectedEvent.id ? updatedEvent : e))
        setSelectedEvent(updatedEvent)
      } else {
        const { error } = await supabase.from('calendar_events').update({
          title: form.title,
          event_type: form.event_type,
          start_at,
          end_at,
          all_day: form.all_day,
          client_id: form.client_id || null,
          description: form.description || null,
        }).eq('id', selectedEvent.id)
        if (error) throw error
        await loadEvents()
        setSelectedEvent(null)
      }
      setDrawerEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete event ──────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!selectedEvent) return
    setDeleting(true)
    try {
      if (IS_DEMO) {
        setEvents(prev => prev.filter(e => e.id !== selectedEvent.id))
      } else {
        await supabase.from('calendar_events').delete().eq('id', selectedEvent.id)
        await loadEvents()
      }
      setSelectedEvent(null)
      setShowDeleteConfirm(false)
      setDrawerEditMode(false)
    } finally {
      setDeleting(false)
    }
  }

  // ── Open drawer ───────────────────────────────────────────────────────────
  function openEventDrawer(ev: CalendarEvent) {
    setSelectedEvent(ev)
    setDrawerEditMode(false)
    setShowDeleteConfirm(false)
    const d = new Date(ev.start_at)
    const pad = (n: number) => String(n).padStart(2, '0')
    const endDate = ev.end_at ? new Date(ev.end_at) : d
    setForm({
      title: ev.title,
      event_type: ev.event_type,
      all_day: ev.all_day,
      start_date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      start_time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      end_date: `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`,
      end_time: `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`,
      client_id: ev.client_id ?? '',
      description: ev.description ?? '',
    })
  }

  // ─── Render month grid ───────────────────────────────────────────────────
  function renderMonthView() {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = isoWeekday(firstDay)
    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7

    const cells: Date[] = []
    for (let i = 0; i < totalCells; i++) {
      cells.push(new Date(year, month, 1 - startOffset + i))
    }

    return (
      <div className="flex-1 overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[#1E1C2A] sticky top-0 z-10 bg-[#08070F]">
          {DAY_NAMES_SHORT.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-white/30 py-2 tracking-widest uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7" style={{ minHeight: '480px' }}>
          {cells.map((cell, idx) => {
            const isCurrentMonth = cell.getMonth() === month
            const isToday = isSameDay(cell, today)
            const dayEvents = events.filter(e => isSameDay(new Date(e.start_at), cell))
            const visible = dayEvents.slice(0, 3)
            const overflow = dayEvents.length - 3

            return (
              <div
                key={idx}
                onClick={() => openNewModal(cell)}
                className={`border-b border-r border-[#1E1C2A] min-h-[100px] p-1.5 cursor-pointer hover:bg-white/[0.02] transition-colors ${!isCurrentMonth ? 'opacity-30' : ''}`}
              >
                {/* Day number */}
                <div className="flex justify-end mb-1">
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#C8F135] text-[#08070F] font-bold' : 'text-white/50'}`}>
                    {cell.getDate()}
                  </span>
                </div>

                {/* Events */}
                <div className="space-y-0.5">
                  {visible.map(ev => {
                    const cfg = EVENT_TYPES[ev.event_type]
                    return (
                      <div
                        key={ev.id}
                        onClick={e => { e.stopPropagation(); openEventDrawer(ev) }}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: cfg.color + '30', color: cfg.color, borderLeft: `2px solid ${cfg.color}` }}
                        title={ev.title}
                      >
                        {!ev.all_day && (
                          <span className="opacity-70 mr-1">
                            {`${String(new Date(ev.start_at).getHours()).padStart(2, '0')}:${String(new Date(ev.start_at).getMinutes()).padStart(2, '0')}`}
                          </span>
                        )}
                        {ev.title}
                      </div>
                    )
                  })}

                  {overflow > 0 && (
                    <div className="text-[10px] text-white/40 pl-1 cursor-pointer hover:text-white/60 transition-colors">
                      + {overflow} más
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Render week view ────────────────────────────────────────────────────
  function renderWeekView() {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const allDayEvs = events.filter(e => e.all_day)
    const timedEvents = events.filter(e => !e.all_day)

    const nowHour = today.getHours()
    const nowMin = today.getMinutes()
    const currentMinFromTop = (nowHour - 8) * CELL_HEIGHT + (nowMin / 60) * CELL_HEIGHT

    return (
      <div className="flex-1 overflow-auto">
        {/* All-day strip */}
        {allDayEvs.length > 0 && (
          <div className="border-b border-[#1E1C2A] flex">
            <div className="w-16 flex-shrink-0 text-[10px] text-white/30 text-right pr-2 py-1.5 border-r border-[#1E1C2A]">
              Todo el día
            </div>
            <div className="flex-1 grid grid-cols-7">
              {days.map((day, di) => {
                const dayAllDay = allDayEvs.filter(e => isSameDay(new Date(e.start_at), day))
                return (
                  <div key={di} className="border-r border-[#1E1C2A] p-1 min-h-[28px]">
                    {dayAllDay.map(ev => {
                      const cfg = EVENT_TYPES[ev.event_type]
                      return (
                        <div
                          key={ev.id}
                          onClick={() => openEventDrawer(ev)}
                          className="text-[10px] rounded px-1 py-0.5 truncate cursor-pointer mb-0.5"
                          style={{ backgroundColor: cfg.color + '30', color: cfg.color }}
                        >
                          {ev.title}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Day headers */}
        <div className="flex border-b border-[#1E1C2A] sticky top-0 z-10 bg-[#08070F]">
          <div className="w-16 flex-shrink-0 border-r border-[#1E1C2A]" />
          {days.map((day, di) => {
            const isT = isSameDay(day, today)
            return (
              <div
                key={di}
                className={`flex-1 text-center py-2 border-r border-[#1E1C2A] ${isT ? 'bg-[#C8F135]/5' : ''}`}
              >
                <div className="text-[10px] text-white/30 uppercase tracking-widest">{DAY_NAMES_SHORT[di]}</div>
                <div className={`text-sm font-bold mt-0.5 ${isT ? 'text-[#C8F135]' : 'text-white/60'}`}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="flex relative">
          {/* Hour labels */}
          <div className="w-16 flex-shrink-0 border-r border-[#1E1C2A]">
            {HOURS.map(h => (
              <div key={h} style={{ height: CELL_HEIGHT }} className="border-b border-[#1E1C2A] flex items-start justify-end pr-2 pt-1">
                <span className="text-[10px] text-white/25">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex-1 grid grid-cols-7 relative">
            {days.map((day, di) => {
              const isT = isSameDay(day, today)
              const dayTimed = timedEvents.filter(e => isSameDay(new Date(e.start_at), day))

              return (
                <div
                  key={di}
                  className={`border-r border-[#1E1C2A] relative ${isT ? 'bg-[#C8F135]/[0.02]' : ''}`}
                  style={{ height: CELL_HEIGHT * HOURS.length }}
                >
                  {/* Hour cells (click targets) */}
                  {HOURS.map(h => (
                    <div
                      key={h}
                      style={{ height: CELL_HEIGHT }}
                      className="border-b border-[#1E1C2A] cursor-pointer hover:bg-white/[0.03] transition-colors"
                      onClick={() => openNewModal(day, `${String(h).padStart(2, '0')}:00`)}
                    />
                  ))}

                  {/* Events */}
                  {dayTimed.map(ev => {
                    const start = new Date(ev.start_at)
                    const end = ev.end_at ? new Date(ev.end_at) : new Date(start.getTime() + 60 * 60 * 1000)
                    const startMins = (start.getHours() - 8) * 60 + start.getMinutes()
                    const endMins = (end.getHours() - 8) * 60 + end.getMinutes()
                    const top = (startMins / 60) * CELL_HEIGHT
                    const height = Math.max(((endMins - startMins) / 60) * CELL_HEIGHT, 20)
                    const cfg = EVENT_TYPES[ev.event_type]

                    if (startMins < 0 || startMins > HOURS.length * 60) return null

                    return (
                      <div
                        key={ev.id}
                        onClick={e => { e.stopPropagation(); openEventDrawer(ev) }}
                        className="absolute left-0.5 right-0.5 rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-10"
                        style={{
                          top,
                          height: Math.max(height, 22),
                          backgroundColor: cfg.color + '22',
                          borderLeft: `2.5px solid ${cfg.color}`,
                        }}
                      >
                        <div className="px-1 py-0.5">
                          <div className="text-[10px] font-semibold truncate" style={{ color: cfg.color }}>
                            {ev.title}
                          </div>
                          {height > 30 && (
                            <div className="text-[9px] opacity-60" style={{ color: cfg.color }}>
                              {String(start.getHours()).padStart(2, '0')}:{String(start.getMinutes()).padStart(2, '0')}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Current time indicator */}
                  {isT && (
                    <div
                      ref={currentTimeRef}
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: currentMinFromTop }}
                    >
                      <div className="relative flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                        <div className="flex-1 h-px bg-red-500" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ─── Header label ────────────────────────────────────────────────────────
  function headerLabel() {
    if (viewMode === 'mes') {
      return `${MONTH_NAMES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`
    }
    const end = addDays(weekStart, 6)
    if (weekStart.getMonth() === end.getMonth()) {
      return `${weekStart.getDate()} – ${end.getDate()} de ${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    }
    return `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`
  }

  // ─── Form field helper ───────────────────────────────────────────────────
  const inputCls = `w-full bg-[#1A1825] border border-[#1E1C2A] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C026A8]/50 transition-colors`

  function renderFormFields() {
    return (
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-widest">Título *</label>
          <input
            className={inputCls}
            placeholder="Nombre del evento"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-widest">Tipo</label>
          <div className="relative">
            <select
              className={inputCls + ' appearance-none pl-7'}
              value={form.event_type}
              onChange={e => setForm(f => ({ ...f, event_type: e.target.value as EventType }))}
            >
              {(Object.entries(EVENT_TYPES) as [EventType, { label: string; color: string; bg: string; text: string }][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
              style={{ backgroundColor: EVENT_TYPES[form.event_type].color }}
            />
          </div>
        </div>

        {/* All day */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, all_day: !f.all_day }))}
            className={`w-10 h-5 rounded-full transition-colors flex items-center ${form.all_day ? 'bg-[#C026A8]' : 'bg-white/10'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${form.all_day ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm text-white/70">Todo el día</span>
        </div>

        {/* Start */}
        <div className={`grid gap-3 ${form.all_day ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-widest">Fecha inicio</label>
            <input type="date" className={inputCls} value={form.start_date}
              onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          </div>
          {!form.all_day && (
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-widest">Hora inicio</label>
              <input type="time" className={inputCls} value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
          )}
        </div>

        {/* End */}
        <div className={`grid gap-3 ${form.all_day ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-widest">Fecha fin</label>
            <input type="date" className={inputCls} value={form.end_date}
              onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
          {!form.all_day && (
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-widest">Hora fin</label>
              <input type="time" className={inputCls} value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          )}
        </div>

        {/* Client */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-widest">Cliente</label>
          <select
            className={inputCls + ' appearance-none'}
            value={form.client_id}
            onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
          >
            <option value="">Sin cliente</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.business_name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-widest">Descripción</label>
          <textarea
            className={inputCls + ' resize-none'}
            rows={3}
            placeholder="Notas o detalles del evento..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>
      </div>
    )
  }

  // ─── Main Render ─────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full bg-[#08070F] overflow-hidden">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1C2A] flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={prevPeriod}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#12101A] border border-[#1E1C2A] text-white/50 hover:text-white hover:border-white/20 transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={nextPeriod}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#12101A] border border-[#1E1C2A] text-white/50 hover:text-white hover:border-white/20 transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <h1 className="text-base font-bold text-white">{headerLabel()}</h1>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl bg-[#12101A] border border-[#1E1C2A] text-xs font-semibold text-white/50 hover:text-white hover:border-white/20 transition-all"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-[#12101A] border border-[#1E1C2A] rounded-xl p-0.5">
            {(['mes', 'semana'] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === v ? 'bg-[#C8F135] text-[#08070F]' : 'text-white/40 hover:text-white'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* New event */}
          <button
            onClick={() => openNewModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #E040A0, #C026A8, #8B22E8)' }}
          >
            <Plus size={14} />
            Nuevo evento
          </button>
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-4 flex-shrink-0">
          <div className="w-4 h-4 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Calendar Grid ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {viewMode === 'mes' ? renderMonthView() : renderWeekView()}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-[#1E1C2A] flex-wrap flex-shrink-0">
        {(Object.entries(EVENT_TYPES) as [EventType, { label: string; color: string; bg: string; text: string }][]).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
            <span className="text-[11px] text-white/40">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* ── New Event Modal ───────────────────────────────────────────────── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1C2A]">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-[#C026A8]" />
                <h2 className="text-sm font-bold text-white">Nuevo evento</h2>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-white/30 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-5">
              {renderFormFields()}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1E1C2A]">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #E040A0, #C026A8, #8B22E8)' }}
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <Plus size={14} />
                Crear evento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Event Detail Drawer ───────────────────────────────────────────── */}
      {selectedEvent && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => { setSelectedEvent(null); setDrawerEditMode(false); setShowDeleteConfirm(false) }}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 bottom-0 z-50 w-[380px] bg-[#12101A] border-l border-[#1E1C2A] flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1C2A] flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full ${EVENT_TYPES[selectedEvent.event_type].bg} ${EVENT_TYPES[selectedEvent.event_type].text}`}
                >
                  {EVENT_TYPES[selectedEvent.event_type].label}
                </span>
                {selectedEvent.source !== 'manual' && (
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-violet-500/15 text-violet-400">
                    {selectedEvent.source === 'lead_activity' ? 'Desde pipeline' : 'Desde solicitud'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDrawerEditMode(!drawerEditMode)}
                  className={`p-1.5 rounded-lg transition-colors ${drawerEditMode ? 'text-[#C8F135] bg-[#C8F135]/10' : 'text-white/40 hover:text-white hover:bg-white/8'}`}
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => { setSelectedEvent(null); setDrawerEditMode(false); setShowDeleteConfirm(false) }}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              {drawerEditMode ? (
                <div className="px-5 py-5">
                  {renderFormFields()}
                </div>
              ) : (
                <div className="px-5 py-5 space-y-5">
                  {/* Title */}
                  <h2 className="text-xl font-bold text-white leading-tight">{selectedEvent.title}</h2>

                  {/* Date/time */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#1A1825] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock size={14} className="text-white/40" />
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {formatSpanishDate(new Date(selectedEvent.start_at), selectedEvent.all_day, selectedEvent.end_at)}
                    </p>
                  </div>

                  {/* Client */}
                  {selectedEvent.clients && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#1A1825] flex items-center justify-center flex-shrink-0">
                        <Building2 size={14} className="text-white/40" />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white/80">{selectedEvent.clients.business_name}</p>
                        {selectedEvent.client_id && (
                          <a
                            href={`/internal/clients/${selectedEvent.client_id}`}
                            className="text-[#C026A8] hover:text-[#E040A0] transition-colors"
                            title="Ver cliente"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#1A1825] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText size={14} className="text-white/40" />
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed">{selectedEvent.description}</p>
                    </div>
                  )}

                  {/* Created info */}
                  <div className="pt-3 border-t border-[#1E1C2A]">
                    <p className="text-[11px] text-white/25">
                      Creado el {new Date(selectedEvent.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="flex-shrink-0 border-t border-[#1E1C2A] px-5 py-4">
              {drawerEditMode ? (
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setDrawerEditMode(false)}
                    className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={saving || !form.title.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #E040A0, #C026A8, #8B22E8)' }}
                  >
                    {saving && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Guardar cambios
                  </button>
                </div>
              ) : showDeleteConfirm ? (
                <div className="space-y-2">
                  <p className="text-xs text-white/50 text-center">¿Eliminar este evento? Esta acción no se puede deshacer.</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 rounded-xl text-sm text-white/50 bg-[#1A1825] hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 py-2 rounded-xl text-sm text-red-400 font-semibold bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={13} />
                    Eliminar
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setDrawerEditMode(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-[#1A1825] border border-[#1E1C2A] hover:border-white/20 transition-all"
                  >
                    <Edit3 size={13} />
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
