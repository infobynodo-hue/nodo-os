import { useEffect, useState } from 'react'
import {
  Plus, X, ChevronUp, ChevronDown, Trash2, Workflow,
  Phone, Mail, MessageCircle, FileText, Users, StickyNote, CheckSquare,
  GripVertical, Edit2, Check,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { NodoButton } from '../../components/ui/NodoButton'
import type { LeadSequence, LeadSequenceStep } from '../../types'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_SEQUENCES: LeadSequence[] = [
  {
    id: 'seq1', name: 'Secuencia Referidos', color: '#C026A8', is_active: true,
    trigger_source: ['referido'], description: 'Para leads que llegan por referencia',
    created_at: '2026-01-01T00:00:00Z',
    lead_sequence_steps: [
      { id: 's1', sequence_id: 'seq1', step_number: 1, action_type: 'llamada', title: 'Llamada inicial', day_offset: 0, is_required: true },
      { id: 's2', sequence_id: 'seq1', step_number: 2, action_type: 'email', title: 'Enviar presentación', day_offset: 2, is_required: true },
      { id: 's3', sequence_id: 'seq1', step_number: 3, action_type: 'propuesta', title: 'Presentar propuesta', day_offset: 5, is_required: true },
      { id: 's4', sequence_id: 'seq1', step_number: 4, action_type: 'reunion', title: 'Reunión de cierre', day_offset: 10, is_required: false },
    ],
  },
  {
    id: 'seq2', name: 'Secuencia Instagram', color: '#E040A0', is_active: true,
    trigger_source: ['instagram'], description: 'Para leads de Instagram',
    created_at: '2026-01-01T00:00:00Z',
    lead_sequence_steps: [
      { id: 's5', sequence_id: 'seq2', step_number: 1, action_type: 'whatsapp', title: 'Mensaje de bienvenida', day_offset: 0, is_required: true },
      { id: 's6', sequence_id: 'seq2', step_number: 2, action_type: 'llamada', title: 'Llamada de descubrimiento', day_offset: 3, is_required: true },
    ],
  },
  {
    id: 'seq3', name: 'Secuencia Cold Outreach', color: '#8B22E8', is_active: true,
    trigger_source: ['cold_outreach', 'linkedin'], description: 'Para leads fríos',
    created_at: '2026-01-01T00:00:00Z',
    lead_sequence_steps: [
      { id: 's7', sequence_id: 'seq3', step_number: 1, action_type: 'email', title: 'Email de presentación', day_offset: 0, is_required: true },
      { id: 's8', sequence_id: 'seq3', step_number: 2, action_type: 'llamada', title: 'Seguimiento telefónico', day_offset: 5, is_required: true },
      { id: 's9', sequence_id: 'seq3', step_number: 3, action_type: 'email', title: 'Email de valor', day_offset: 10, is_required: false },
    ],
  },
  {
    id: 'seq4', name: 'Secuencia General', color: '#C8F135', is_active: true,
    trigger_source: ['web', 'evento', 'otro'], description: 'Secuencia estándar para cualquier lead',
    created_at: '2026-01-01T00:00:00Z',
    lead_sequence_steps: [
      { id: 's10', sequence_id: 'seq4', step_number: 1, action_type: 'llamada', title: 'Primera llamada', day_offset: 0, is_required: true },
      { id: 's11', sequence_id: 'seq4', step_number: 2, action_type: 'propuesta', title: 'Enviar propuesta', day_offset: 7, is_required: true },
    ],
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────
type ActionType = LeadSequenceStep['action_type']

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  llamada: 'Llamada',
  email: 'Email',
  whatsapp: 'WhatsApp',
  propuesta: 'Propuesta',
  reunion: 'Reunión',
  nota: 'Nota',
  tarea: 'Tarea',
}

const TRIGGER_SOURCE_OPTIONS = [
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'referido', label: 'Referido' },
  { value: 'web', label: 'Web' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'evento', label: 'Evento' },
  { value: 'otro', label: 'Otro' },
]

const PRESET_COLORS = [
  '#C026A8', '#8B22E8', '#E040A0', '#C8F135',
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
]

function ActionIcon({ type, size = 14, className = '' }: { type: ActionType; size?: number; className?: string }) {
  const icons: Record<ActionType, React.ReactNode> = {
    llamada:   <Phone size={size} className={className} />,
    email:     <Mail size={size} className={className} />,
    whatsapp:  <MessageCircle size={size} className={className} />,
    propuesta: <FileText size={size} className={className} />,
    reunion:   <Users size={size} className={className} />,
    nota:      <StickyNote size={size} className={className} />,
    tarea:     <CheckSquare size={size} className={className} />,
  }
  return <>{icons[type]}</>
}

function actionTypeColor(type: ActionType): string {
  const colors: Record<ActionType, string> = {
    llamada:   'text-green-400',
    email:     'text-blue-400',
    whatsapp:  'text-emerald-400',
    propuesta: 'text-violet-400',
    reunion:   'text-orange-400',
    nota:      'text-yellow-400',
    tarea:     'text-pink-400',
  }
  return colors[type]
}

// ─── Step editor row ─────────────────────────────────────────────────────────
interface EditableStep extends Omit<LeadSequenceStep, 'id'> {
  id: string
  tempId?: string
  showTemplate?: boolean
}

function StepRow({
  step,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  step: EditableStep
  index: number
  total: number
  onChange: (updated: EditableStep) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div className="bg-[#1A1825] border border-[#1E1C2A] rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <GripVertical size={14} className="text-white/20 flex-shrink-0" />
        <span className="text-[10px] font-bold text-white/30 w-4">{index + 1}</span>

        {/* Action type select */}
        <select
          value={step.action_type}
          onChange={e => onChange({ ...step, action_type: e.target.value as ActionType })}
          className="bg-[#12101A] border border-[#1E1C2A] text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-[#C026A8] flex-shrink-0"
        >
          {(Object.keys(ACTION_TYPE_LABELS) as ActionType[]).map(t => (
            <option key={t} value={t}>{ACTION_TYPE_LABELS[t]}</option>
          ))}
        </select>

        {/* Title input */}
        <input
          type="text"
          value={step.title}
          onChange={e => onChange({ ...step, title: e.target.value })}
          placeholder="Título del paso..."
          className="flex-1 bg-[#12101A] border border-[#1E1C2A] text-white text-xs rounded-lg px-2.5 py-1.5 placeholder-white/20 outline-none focus:border-[#C026A8]"
        />

        {/* Day offset */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="number"
            min={0}
            value={step.day_offset}
            onChange={e => onChange({ ...step, day_offset: parseInt(e.target.value) || 0 })}
            className="w-14 bg-[#12101A] border border-[#1E1C2A] text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-[#C026A8] text-center"
          />
          <span className="text-[10px] text-white/30">días</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 rounded text-white/30 hover:text-white disabled:opacity-20 transition-colors"
            title="Subir"
          >
            <ChevronUp size={12} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1 rounded text-white/30 hover:text-white disabled:opacity-20 transition-colors"
            title="Bajar"
          >
            <ChevronDown size={12} />
          </button>
          <button
            onClick={() => onChange({ ...step, showTemplate: !step.showTemplate })}
            className="p-1 rounded text-white/30 hover:text-violet-400 transition-colors"
            title="Plantilla de mensaje"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-white/30 hover:text-red-400 transition-colors"
            title="Eliminar paso"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Required toggle */}
      <div className="flex items-center gap-2 pl-8">
        <ActionIcon type={step.action_type} size={11} className={actionTypeColor(step.action_type)} />
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={step.is_required}
            onChange={e => onChange({ ...step, is_required: e.target.checked })}
            className="w-3 h-3 rounded accent-[#C026A8]"
          />
          <span className="text-[10px] text-white/40">Obligatorio</span>
        </label>
        {step.day_offset > 0 && (
          <span className="text-[10px] text-white/30">· Se programa al día +{step.day_offset}</span>
        )}
      </div>

      {/* Message template (collapsible) */}
      {step.showTemplate && (
        <div className="pl-8">
          <textarea
            value={step.message_template || ''}
            onChange={e => onChange({ ...step, message_template: e.target.value })}
            placeholder="Plantilla de mensaje para este paso (opcional)..."
            rows={3}
            className="w-full bg-[#12101A] border border-[#1E1C2A] text-white/80 text-xs rounded-lg px-2.5 py-2 placeholder-white/20 outline-none focus:border-[#C026A8] resize-none"
          />
        </div>
      )}
    </div>
  )
}

// ─── Sequence Drawer ─────────────────────────────────────────────────────────
function SequenceDrawer({
  sequence,
  onClose,
  onSave,
}: {
  sequence: LeadSequence | null
  onClose: () => void
  onSave: (seq: LeadSequence) => void
}) {
  const { user } = useAuthStore()
  const isNew = !sequence
  const [name, setName] = useState(sequence?.name || '')
  const [description, setDescription] = useState(sequence?.description || '')
  const [color, setColor] = useState(sequence?.color || '#C026A8')
  const [isActive, setIsActive] = useState(sequence?.is_active ?? true)
  const [triggerSources, setTriggerSources] = useState<string[]>(sequence?.trigger_source || [])
  const [steps, setSteps] = useState<EditableStep[]>(
    (sequence?.lead_sequence_steps || [])
      .slice()
      .sort((a, b) => a.step_number - b.step_number)
      .map(s => ({ ...s, showTemplate: false }))
  )
  const [saving, setSaving] = useState(false)

  function toggleSource(val: string) {
    setTriggerSources(prev =>
      prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]
    )
  }

  function addStep() {
    const maxStep = steps.length > 0 ? Math.max(...steps.map(s => s.step_number)) : 0
    const newStep: EditableStep = {
      id: `temp-${Date.now()}`,
      tempId: `temp-${Date.now()}`,
      sequence_id: sequence?.id || '',
      step_number: maxStep + 1,
      action_type: 'llamada',
      title: '',
      day_offset: 0,
      is_required: true,
      showTemplate: false,
    }
    setSteps(prev => [...prev, newStep])
  }

  function updateStep(index: number, updated: EditableStep) {
    setSteps(prev => prev.map((s, i) => i === index ? updated : s))
  }

  function deleteStep(index: number) {
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_number: i + 1 })))
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSteps.length) return
    ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
    setSteps(newSteps.map((s, i) => ({ ...s, step_number: i + 1 })))
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)

    if (IS_DEMO) {
      const savedSeq: LeadSequence = {
        id: sequence?.id || `seq-${Date.now()}`,
        name,
        description: description || undefined,
        color,
        is_active: isActive,
        trigger_source: triggerSources,
        created_by: user?.id,
        created_at: sequence?.created_at || new Date().toISOString(),
        lead_sequence_steps: steps.map((s, i) => ({
          id: s.id.startsWith('temp-') ? `step-${Date.now()}-${i}` : s.id,
          sequence_id: sequence?.id || `seq-${Date.now()}`,
          step_number: i + 1,
          action_type: s.action_type,
          title: s.title,
          description: s.description,
          message_template: s.message_template,
          day_offset: s.day_offset,
          is_required: s.is_required,
        })),
      }
      onSave(savedSeq)
      setSaving(false)
      return
    }

    try {
      // Upsert sequence
      const seqPayload = {
        name,
        description: description || null,
        color,
        is_active: isActive,
        trigger_source: triggerSources,
        created_by: user?.id,
      }

      let seqId = sequence?.id
      if (isNew) {
        const { data } = await supabase.from('lead_sequences').insert([seqPayload]).select().single()
        seqId = data?.id
      } else {
        await supabase.from('lead_sequences').update(seqPayload).eq('id', seqId)
      }

      if (!seqId) { setSaving(false); return }

      // Delete existing steps and reinsert
      await supabase.from('lead_sequence_steps').delete().eq('sequence_id', seqId)
      const stepsPayload = steps.map((s, i) => ({
        sequence_id: seqId,
        step_number: i + 1,
        action_type: s.action_type,
        title: s.title,
        description: s.description || null,
        message_template: s.message_template || null,
        day_offset: s.day_offset,
        is_required: s.is_required,
      }))
      const { data: insertedSteps } = await supabase
        .from('lead_sequence_steps')
        .insert(stepsPayload)
        .select()

      const savedSeq: LeadSequence = {
        id: seqId,
        name,
        description: description || undefined,
        color,
        is_active: isActive,
        trigger_source: triggerSources,
        created_by: user?.id,
        created_at: sequence?.created_at || new Date().toISOString(),
        lead_sequence_steps: insertedSteps || [],
      }
      onSave(savedSeq)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-xl bg-[#12101A] h-full overflow-y-auto shadow-2xl flex flex-col border-l border-[#1E1C2A]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E1C2A] flex-shrink-0">
          <div>
            <h3 className="font-bold text-white">{isNew ? 'Nueva secuencia' : 'Editar secuencia'}</h3>
            <p className="text-xs text-white/40 mt-0.5">Configura los pasos de seguimiento</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 rounded-xl hover:bg-white/6">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Name + Color */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Nombre *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Secuencia Referidos"
                className="w-full bg-[#1A1825] border border-[#1E1C2A] text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 outline-none focus:border-[#C026A8] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Descripción</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe cuándo usar esta secuencia..."
                rows={2}
                className="w-full bg-[#1A1825] border border-[#1E1C2A] text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/20 outline-none focus:border-[#C026A8] resize-none transition-colors"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full transition-all border-2 flex-shrink-0"
                    style={{
                      background: c,
                      borderColor: color === c ? 'white' : 'transparent',
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0 outline-none"
                  title="Color personalizado"
                />
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsActive(!isActive)}
                className={`w-10 h-5 rounded-full transition-all ${isActive ? 'bg-[#C026A8]' : 'bg-white/10'} relative`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isActive ? 'left-5' : 'left-0.5'}`} />
              </div>
              <span className="text-sm text-white/70">{isActive ? 'Activa' : 'Inactiva'}</span>
            </label>
          </div>

          {/* Trigger sources */}
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Fuentes de activación</label>
            <div className="flex flex-wrap gap-2">
              {TRIGGER_SOURCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleSource(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    triggerSources.includes(opt.value)
                      ? 'border-[#C026A8] bg-[#C026A8]/15 text-[#C026A8]'
                      : 'border-[#1E1C2A] text-white/40 hover:border-white/20 hover:text-white/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Pasos de la secuencia ({steps.length})
              </label>
            </div>

            <div className="space-y-2">
              {steps.map((step, index) => (
                <StepRow
                  key={step.id}
                  step={step}
                  index={index}
                  total={steps.length}
                  onChange={(updated) => updateStep(index, updated)}
                  onDelete={() => deleteStep(index)}
                  onMoveUp={() => moveStep(index, 'up')}
                  onMoveDown={() => moveStep(index, 'down')}
                />
              ))}
            </div>

            <button
              onClick={addStep}
              className="mt-3 w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#1E1C2A] rounded-xl py-3 text-xs font-semibold text-white/30 hover:text-white/60 hover:border-white/20 transition-all"
            >
              <Plus size={13} />
              Añadir paso
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1E1C2A] flex-shrink-0 flex gap-3">
          <NodoButton
            variant="primary"
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1"
          >
            {saving ? 'Guardando...' : isNew ? 'Crear secuencia' : 'Guardar cambios'}
          </NodoButton>
          <NodoButton variant="secondary" onClick={onClose}>
            Cancelar
          </NodoButton>
        </div>
      </aside>
    </div>
  )
}

// ─── Sequence Card ────────────────────────────────────────────────────────────
function SequenceCard({
  sequence,
  onEdit,
  onToggleActive,
}: {
  sequence: LeadSequence
  onEdit: () => void
  onToggleActive: () => void
}) {
  const steps = (sequence.lead_sequence_steps || []).sort((a, b) => a.step_number - b.step_number)

  return (
    <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#C026A8]/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: `${sequence.color}20` }}
          >
            <Workflow size={18} style={{ color: sequence.color }} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-tight">{sequence.name}</h3>
            {sequence.description && (
              <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{sequence.description}</p>
            )}
          </div>
        </div>

        {/* Active toggle */}
        <button
          onClick={onToggleActive}
          className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
            sequence.is_active
              ? 'border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20'
              : 'border-white/10 text-white/30 bg-white/5 hover:bg-white/10'
          }`}
        >
          {sequence.is_active ? 'Activa' : 'Inactiva'}
        </button>
      </div>

      {/* Source tags */}
      {sequence.trigger_source && sequence.trigger_source.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sequence.trigger_source.map(src => (
            <span
              key={src}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${sequence.color}20`, color: sequence.color }}
            >
              {src}
            </span>
          ))}
        </div>
      )}

      {/* Steps preview */}
      <div className="space-y-1.5">
        {steps.slice(0, 4).map(step => (
          <div key={step.id} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sequence.color }} />
            <ActionIcon type={step.action_type} size={10} className={actionTypeColor(step.action_type)} />
            <span className="text-[11px] text-white/50 truncate">{step.title}</span>
            <span className="text-[10px] text-white/25 flex-shrink-0 ml-auto">
              {step.day_offset === 0 ? 'día 0' : `+${step.day_offset}d`}
            </span>
          </div>
        ))}
        {steps.length > 4 && (
          <p className="text-[10px] text-white/25 pl-5">+{steps.length - 4} pasos más</p>
        )}
        {steps.length === 0 && (
          <p className="text-[11px] text-white/25 italic">Sin pasos configurados</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[#1E1C2A]">
        <span className="text-[10px] text-white/30 font-medium">
          {steps.length} {steps.length === 1 ? 'paso' : 'pasos'}
        </span>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#C026A8] hover:text-[#E040A0] transition-colors"
        >
          <Edit2 size={11} />
          Editar pasos
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function SequencesPage() {
  const [sequences, setSequences] = useState<LeadSequence[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingSequence, setEditingSequence] = useState<LeadSequence | null>(null)
  const [savedFeedback, setSavedFeedback] = useState(false)

  useEffect(() => {
    loadSequences()
  }, [])

  async function loadSequences() {
    setLoading(true)
    if (IS_DEMO) {
      setSequences(DEMO_SEQUENCES)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('lead_sequences')
      .select('*, lead_sequence_steps(*)')
      .order('created_at')
    setSequences(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditingSequence(null)
    setDrawerOpen(true)
  }

  function openEdit(seq: LeadSequence) {
    setEditingSequence(seq)
    setDrawerOpen(true)
  }

  async function toggleActive(seq: LeadSequence) {
    const updated = { ...seq, is_active: !seq.is_active }
    setSequences(prev => prev.map(s => s.id === seq.id ? updated : s))
    if (!IS_DEMO) {
      await supabase.from('lead_sequences').update({ is_active: !seq.is_active }).eq('id', seq.id)
    }
  }

  function handleSave(saved: LeadSequence) {
    setSequences(prev => {
      const exists = prev.find(s => s.id === saved.id)
      if (exists) return prev.map(s => s.id === saved.id ? saved : s)
      return [saved, ...prev]
    })
    setDrawerOpen(false)
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2500)
  }

  const activeCount = sequences.filter(s => s.is_active).length

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CRM</p>
          <h1 className="text-2xl font-bold text-[#1A1F2E] flex items-center gap-2">
            Secuencias de Seguimiento
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {savedFeedback && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
              <Check size={12} />
              Guardado
            </span>
          )}
          <NodoButton variant="primary" icon={<Plus size={14} />} onClick={openNew}>
            Nueva Secuencia
          </NodoButton>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total secuencias', value: sequences.length },
          { label: 'Activas', value: activeCount },
          { label: 'Inactivas', value: sequences.length - activeCount },
          { label: 'Total pasos', value: sequences.reduce((n, s) => n + (s.lead_sequence_steps?.length || 0), 0) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
            <p className="text-2xl font-black text-[#1A1F2E]">{value}</p>
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sequences.length === 0 ? (
        <div className="text-center py-20">
          <Workflow size={40} className="text-[#9CA3AF] mx-auto mb-4" />
          <p className="text-[#6B7280] font-medium mb-2">Sin secuencias configuradas</p>
          <p className="text-sm text-[#9CA3AF] mb-6">Crea tu primera secuencia de seguimiento para leads</p>
          <NodoButton variant="primary" icon={<Plus size={14} />} onClick={openNew}>
            Crear secuencia
          </NodoButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sequences.map(seq => (
            <SequenceCard
              key={seq.id}
              sequence={seq}
              onEdit={() => openEdit(seq)}
              onToggleActive={() => toggleActive(seq)}
            />
          ))}
          {/* Add card */}
          <button
            onClick={openNew}
            className="bg-[#12101A]/50 border-2 border-dashed border-[#1E1C2A] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:border-[#C026A8]/40 hover:bg-[#C026A8]/5 transition-all group min-h-[200px]"
          >
            <Plus size={24} className="text-white/20 group-hover:text-[#C026A8] transition-colors" />
            <span className="text-xs font-semibold text-white/30 group-hover:text-[#C026A8] transition-colors">Nueva secuencia</span>
          </button>
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <SequenceDrawer
          sequence={editingSequence}
          onClose={() => setDrawerOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
