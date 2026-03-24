import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Building2, Wrench, Calendar, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { NodoButton } from '../../components/ui/NodoButton'
import { NodoInput } from '../../components/ui/NodoInput'
import { NodoSelect } from '../../components/ui/NodoSelect'
import { NodoTextarea } from '../../components/ui/NodoTextarea'
import { SECTORES, SERVICE_LABELS, SERVICE_PRICES } from '../../types'
import { PHASES, TASKS } from '../../lib/phases'
import type { ServiceType } from '../../types'

const STEPS = [
  { number: 1, label: 'Cliente', icon: Building2 },
  { number: 2, label: 'Servicio', icon: Wrench },
  { number: 3, label: 'Duración', icon: Calendar },
  { number: 4, label: 'Confirmar', icon: Eye },
]

interface FormData {
  business_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  country: string
  sector: string
  notes: string
  service_type: ServiceType | ''
  duration_months: 6 | 12 | null
  start_date: string
  assigned_tech: string
  monthly_price: string
  total_price: number
  monthly_price_num: number
}

export function NewClientPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const fromLead = (location.state as { fromLead?: { business_name?: string; contact_name?: string; contact_email?: string; contact_phone?: string; sector?: string; service_interest?: string; notes?: string } } | null)?.fromLead

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [techUsers, setTechUsers] = useState<{ id: string; full_name: string }[]>([])

  const [form, setForm] = useState<FormData>({
    business_name: fromLead?.business_name || '',
    contact_name: fromLead?.contact_name || '',
    contact_email: fromLead?.contact_email || '',
    contact_phone: fromLead?.contact_phone || '',
    country: '',
    sector: fromLead?.sector || '',
    notes: fromLead?.notes || '',
    service_type: (fromLead?.service_interest as ServiceType) || '',
    duration_months: null, start_date: '', assigned_tech: '', monthly_price: '',
    total_price: 0, monthly_price_num: 0,
  })

  const update = (field: keyof FormData, value: string | number | null | (6 | 12)) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value }
      if ((field === 'service_type' || field === 'duration_months') && updated.service_type && updated.duration_months) {
        const prices = SERVICE_PRICES[updated.service_type as ServiceType]
        const priceData = prices?.[updated.duration_months]
        if (priceData) {
          updated.monthly_price_num = priceData.monthly
          updated.total_price = priceData.total
          updated.monthly_price = String(priceData.monthly)
        }
      }
      return updated
    })
  }

  async function loadTechUsers() {
    const { data } = await supabase
      .from('internal_users')
      .select('id, full_name')
      .eq('role', 'tecnico')
      .eq('is_active', true)
    setTechUsers(data || [])
  }

  const goToStep = (n: number) => {
    if (n === 3 && techUsers.length === 0) loadTechUsers()
    setStep(n)
  }

  const handleSubmit = async () => {
    if (!form.service_type || !form.duration_months || !form.start_date) return
    setLoading(true)
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          business_name: form.business_name,
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
          country: form.country,
          sector: form.sector,
          notes: form.notes || null,
          created_by: user?.id,
        })
        .select()
        .single()

      if (clientError) throw clientError

      const startDate = new Date(form.start_date)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + form.duration_months)

      const serviceType = form.service_type as ServiceType
      const prices = SERVICE_PRICES[serviceType]
      const priceData = prices?.[form.duration_months]
      const monthlyPrice = priceData?.monthly || parseFloat(form.monthly_price) || 0
      const totalPrice = priceData?.total || monthlyPrice * form.duration_months

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          client_id: clientData.id,
          service_type: serviceType,
          duration_months: form.duration_months,
          start_date: form.start_date,
          end_date: endDate.toISOString().split('T')[0],
          monthly_price: monthlyPrice,
          total_price: totalPrice,
          current_phase: 1,
          progress_pct: 0,
          status: 'active',
          assigned_tech: form.assigned_tech || null,
        })
        .select()
        .single()

      if (projectError) throw projectError

      const phases = PHASES[serviceType]
      await supabase.from('project_phases').insert(
        phases.map(p => ({
          project_id: projectData.id,
          phase_number: p.phase_number,
          phase_name: p.phase_name,
          phase_description: p.phase_description,
          status: p.phase_number === 1 ? 'in_progress' : 'pending',
        }))
      )

      const tasks = TASKS[serviceType]
      await supabase.from('tasks').insert(
        tasks.map(t => ({
          project_id: projectData.id,
          phase_number: t.phase_number,
          title: t.title,
          description: t.description || null,
          assigned_to: t.assigned_to,
          is_enabled: false,
          is_completed: false,
          order_index: t.order_index,
        }))
      )

      const billingRecords = []
      for (let i = 1; i <= form.duration_months; i++) {
        const dueDate = new Date(startDate)
        dueDate.setMonth(dueDate.getMonth() + (i - 1))
        billingRecords.push({
          project_id: projectData.id,
          period_month: i,
          due_date: dueDate.toISOString().split('T')[0],
          amount: monthlyPrice,
          status: 'pending',
        })
      }
      await supabase.from('billing_records').insert(billingRecords)

      await supabase.from('onboarding_sessions').insert({
        project_id: projectData.id,
        status: 'not_started',
        completion_pct: 0,
      })

      await supabase.from('project_plugs').insert({
        project_id: projectData.id,
        plug_id: 'onboarding',
        is_enabled: true,
        enabled_by: user?.id,
      })

      navigate(`/internal/clients/${clientData.id}`)
    } catch (err) {
      console.error('Error creando cliente:', err)
      alert('Error al crear el cliente. Revisa los datos e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return form.business_name && form.contact_name && form.contact_email && form.sector && form.country
    if (step === 2) return form.service_type !== ''
    if (step === 3) return form.duration_months !== null && form.start_date !== ''
    return true
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 fade-in">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/internal/clients')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#9CA3AF] hover:text-[#1A1F2E] hover:bg-white transition-all shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1A1F2E]">Nuevo Cliente</h1>
            <p className="text-sm text-[#9CA3AF]">Paso {step} de 4</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1">
              <button
                onClick={() => step > s.number && goToStep(s.number)}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                  step === s.number ? 'text-[#1A1F2E]'
                  : step > s.number ? 'text-[#1A1F2E]'
                  : 'text-[#9CA3AF]'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  step === s.number
                    ? 'bg-[#C8F135] border-[#C8F135] text-[#1A1F2E]'
                    : step > s.number
                    ? 'bg-[#C8F135]/15 border-[#C8F135]/60 text-[#1A1F2E]'
                    : 'bg-white border-[#E5E8EF] text-[#9CA3AF]'
                }`}>
                  {step > s.number ? <Check size={12} /> : <s.icon size={12} />}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${step > s.number ? 'bg-[#C8F135]/50' : 'bg-[#E5E8EF]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 md:p-8 mb-6">

          {step === 1 && (
            <div className="space-y-4">
              {fromLead && (
                <div className="flex items-center gap-3 bg-[#C8F135]/10 border border-[#C8F135]/30 rounded-xl px-4 py-3 mb-2">
                  <span className="text-base">🎯</span>
                  <p className="text-sm text-[#4B5563]">
                    Datos pre-cargados desde el lead <span className="font-bold text-[#1A1F2E]">{fromLead.business_name}</span>. Revisa y completa lo que falte.
                  </p>
                </div>
              )}
              <h2 className="text-base font-bold text-[#1A1F2E] mb-4">Información del cliente</h2>
              <NodoInput label="Nombre del negocio" placeholder="Clínica Dental García"
                value={form.business_name} onChange={e => update('business_name', e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                <NodoInput label="Nombre del responsable" placeholder="Juan García"
                  value={form.contact_name} onChange={e => update('contact_name', e.target.value)} required />
                <NodoInput label="Email de contacto" type="email" placeholder="juan@clinica.com"
                  value={form.contact_email} onChange={e => update('contact_email', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NodoInput label="Teléfono" placeholder="+34 600 000 000"
                  value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} />
                <NodoInput label="País" placeholder="España"
                  value={form.country} onChange={e => update('country', e.target.value)} required />
              </div>
              <NodoSelect label="Sector" value={form.sector}
                onChange={e => update('sector', e.target.value)}
                options={SECTORES.map(s => ({ value: s, label: s }))}
                placeholder="Selecciona sector" required />
              <NodoTextarea label="Notas internas" placeholder="Observaciones internas..."
                value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-base font-bold text-[#1A1F2E] mb-4">Selección de servicio</h2>
              <div className="space-y-3">
                {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([key, label]) => {
                  const prices = SERVICE_PRICES[key]
                  const hasPrices = prices[6].monthly > 0
                  return (
                    <label key={key} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form.service_type === key ? 'border-[#C8F135] bg-[#C8F135]/5' : 'border-[#E5E8EF] hover:border-[#C8F135]/40'
                    }`}>
                      <input type="radio" name="service" value={key} checked={form.service_type === key}
                        onChange={() => update('service_type', key)} className="sr-only" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        form.service_type === key ? 'border-[#C8F135]' : 'border-[#D1D5DB]'
                      }`}>
                        {form.service_type === key && <div className="w-2 h-2 rounded-full bg-[#C8F135]" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#1A1F2E] text-sm">{label}</p>
                        {hasPrices && (
                          <p className="text-xs text-[#9CA3AF] mt-0.5">
                            Desde ${prices[12].monthly.toLocaleString()}/mes · ${prices[12].total.toLocaleString()} total (12m)
                          </p>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#1A1F2E] mb-4">Duración y condiciones</h2>
              <div>
                <p className="text-xs font-semibold text-[#374151] mb-2">Duración del contrato</p>
                <div className="grid grid-cols-2 gap-3">
                  {([6, 12] as const).map((months) => {
                    const serviceType = form.service_type as ServiceType
                    const priceData = serviceType ? SERVICE_PRICES[serviceType]?.[months] : null
                    const hasPrices = priceData && priceData.monthly > 0
                    return (
                      <label key={months} className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.duration_months === months ? 'border-[#C8F135] bg-[#C8F135]/5' : 'border-[#E5E8EF] hover:border-[#C8F135]/40'
                      }`}>
                        <input type="radio" name="duration" value={months} checked={form.duration_months === months}
                          onChange={() => update('duration_months', months)} className="sr-only" />
                        <p className="font-bold text-[#1A1F2E]">{months} meses</p>
                        {hasPrices ? (
                          <>
                            <p className="text-xl font-black text-[#1A1F2E] mt-1">
                              ${priceData!.monthly.toLocaleString()}<span className="text-sm font-normal text-[#9CA3AF]">/mes</span>
                            </p>
                            <p className="text-xs text-[#9CA3AF]">Total: ${priceData!.total.toLocaleString()}</p>
                            {months === 12 && <p className="text-xs text-emerald-600 mt-1 font-medium">Ahorro con plan anual</p>}
                          </>
                        ) : (
                          <p className="text-xs text-[#9CA3AF] mt-1">Precio a definir</p>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
              {form.service_type && SERVICE_PRICES[form.service_type as ServiceType]?.[6]?.monthly === 0 && (
                <NodoInput label="Precio mensual ($)" type="number" placeholder="0.00"
                  value={form.monthly_price} onChange={e => update('monthly_price', e.target.value)} required />
              )}
              <NodoInput label="Fecha de inicio" type="date" value={form.start_date}
                onChange={e => update('start_date', e.target.value)} required />
              <NodoSelect label="Técnico asignado" value={form.assigned_tech}
                onChange={e => update('assigned_tech', e.target.value)}
                options={[{ value: '', label: 'Sin asignar' }, ...techUsers.map(t => ({ value: t.id, label: t.full_name }))]} />
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-base font-bold text-[#1A1F2E] mb-4">Confirmación</h2>
              <div className="space-y-4">
                <div className="bg-[#F4F6F9] rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Cliente</h3>
                  <div className="space-y-2">
                    <Row label="Negocio" value={form.business_name} />
                    <Row label="Responsable" value={form.contact_name} />
                    <Row label="Email" value={form.contact_email} />
                    <Row label="Sector" value={form.sector} />
                    <Row label="País" value={form.country} />
                  </div>
                </div>
                <div className="bg-[#F4F6F9] rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Servicio</h3>
                  <div className="space-y-2">
                    <Row label="Servicio" value={SERVICE_LABELS[form.service_type as ServiceType]} />
                    <Row label="Duración" value={`${form.duration_months} meses`} />
                    <Row label="Inicio" value={form.start_date} />
                    {form.monthly_price_num > 0 && (
                      <>
                        <Row label="Precio/mes" value={`$${form.monthly_price_num.toLocaleString()}`} />
                        <Row label="Total" value={`$${form.total_price.toLocaleString()}`} />
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  Al confirmar se crearán automáticamente: el cliente, el proyecto, todas las fases, tareas, registros de facturación y acceso al portal.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <NodoButton variant="secondary"
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/internal/clients')}
            icon={<ChevronLeft size={14} />}>
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </NodoButton>
          {step < 4 ? (
            <NodoButton variant="primary" onClick={() => goToStep(step + 1)}
              disabled={!canProceed()} iconRight={<ChevronRight size={14} />}>
              Continuar
            </NodoButton>
          ) : (
            <NodoButton variant="primary" onClick={handleSubmit} loading={loading} icon={<Check size={14} />}>
              Crear cliente
            </NodoButton>
          )}
        </div>

      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#9CA3AF]">{label}</span>
      <span className="text-xs text-[#1A1F2E] font-semibold">{value}</span>
    </div>
  )
}
