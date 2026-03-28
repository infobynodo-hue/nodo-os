import { useEffect, useState } from 'react'
import { CheckCircle, Clock, AlertCircle, ArrowUpRight, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { DEMO_BILLING, DEMO_PROJECTS } from '../../lib/demo'
import type { BillingRecord, Project } from '../../types'

function downloadInvoice(record: BillingRecord, project: Project | null, clientName: string) {
  const invoiceNumber = `NODO-${record.id.slice(0, 8).toUpperCase()}`
  const periodLabel = `Mensualidad #${String(record.period_month).padStart(3, '0')}`
  const dueDate = new Date(record.due_date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  const paidDate = record.paid_at
    ? new Date(record.paid_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
  const statusLabel = record.status === 'paid' ? 'Pagado' : record.status === 'overdue' ? 'Vencido' : 'Pendiente'
  const statusColor = record.status === 'paid' ? '#22c55e' : record.status === 'overdue' ? '#ef4444' : '#f59e0b'

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Factura ${invoiceNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fff; color: #1a1a2e; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #C026A8; padding-bottom: 24px; }
  .logo { font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #E040A0, #C026A8, #8B22E8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .logo-sub { font-size: 11px; color: #6b6b80; margin-top: 2px; }
  .invoice-number { font-size: 28px; font-weight: 800; color: #1a1a2e; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}40; margin-top: 6px; }
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b6b80; font-weight: 600; margin-bottom: 12px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f5; }
  .row:last-child { border-bottom: none; }
  .label { color: #6b6b80; font-size: 13px; }
  .value { font-weight: 600; font-size: 13px; color: #1a1a2e; }
  .amount-hero { text-align: center; padding: 32px; background: linear-gradient(135deg, #fdf0f9, #f5f0ff); border-radius: 16px; margin: 28px 0; }
  .amount-hero .amount { font-size: 48px; font-weight: 800; background: linear-gradient(135deg, #E040A0, #C026A8, #8B22E8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .amount-hero .desc { color: #6b6b80; font-size: 13px; margin-top: 4px; }
  .card { background: #f9f9fc; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  .footer { margin-top: 40px; text-align: center; color: #6b6b80; font-size: 11px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">NODO ONE</div>
      <div class="logo-sub">Portal de Clientes · nodoone.com</div>
    </div>
    <div style="text-align:right">
      <div class="invoice-number">${invoiceNumber}</div>
      <div class="status-badge">${statusLabel}</div>
    </div>
  </div>

  <div style="display:flex; gap:20px; margin-bottom:28px;">
    <div style="flex:1">
      <div class="section-title">Facturado a</div>
      <div style="font-size:16px; font-weight:700; color:#1a1a2e;">${clientName}</div>
    </div>
    <div style="flex:1">
      <div class="section-title">Emitido por</div>
      <div style="font-size:14px; font-weight:600; color:#1a1a2e;">NODO ONE</div>
      <div style="font-size:12px; color:#6b6b80;">hola@nodoone.com</div>
    </div>
  </div>

  <div class="amount-hero">
    <div class="amount">€${record.amount.toLocaleString()}</div>
    <div class="desc">${periodLabel} · ${project ? project.service_type.replace('_', ' ').toUpperCase() : 'Servicio NODO ONE'}</div>
  </div>

  <div class="card">
    <div class="section-title">Detalle</div>
    <div class="row"><span class="label">Concepto</span><span class="value">${periodLabel}</span></div>
    <div class="row"><span class="label">Fecha de vencimiento</span><span class="value">${dueDate}</span></div>
    ${record.paid_at ? `<div class="row"><span class="label">Fecha de pago</span><span class="value" style="color:#22c55e">${paidDate}</span></div>` : ''}
    ${project ? `<div class="row"><span class="label">Importe mensual</span><span class="value">€${project.monthly_price.toLocaleString()}</span></div>` : ''}
    ${project ? `<div class="row"><span class="label">Total contrato (${project.duration_months} meses)</span><span class="value">€${project.total_price.toLocaleString()}</span></div>` : ''}
  </div>

  <div class="footer">
    <p>Generado el ${new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })} · NODO ONE</p>
    <p style="margin-top:4px;">Para cualquier consulta: hola@nodoone.com</p>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `factura-${invoiceNumber}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL

type FilterTab = 'all' | 'paid' | 'pending' | 'overdue'

export function ClientBillingPage() {
  const { user } = useAuthStore()
  const [records, setRecords] = useState<BillingRecord[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selected, setSelected] = useState<BillingRecord | null>(null)

  useEffect(() => {
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    if (IS_DEMO) {
      setRecords(DEMO_BILLING)
      setProject(DEMO_PROJECTS[0])
      setSelected(DEMO_BILLING.find(b => b.status === 'pending') || DEMO_BILLING[0])
      setLoading(false)
      return
    }
    if (!user?.projectId) { setLoading(false); return }
    const [billingRes, projectRes] = await Promise.all([
      supabase.from('billing_records').select('*').eq('project_id', user.projectId).order('period_month'),
      supabase.from('projects').select('*').eq('id', user.projectId).single(),
    ])
    const recs = billingRes.data || []
    setRecords(recs)
    setProject(projectRes.data)
    setSelected(recs.find((r: BillingRecord) => r.status === 'pending') || recs[0] || null)
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const paid = records.filter(r => r.status === 'paid')
  const pending = records.filter(r => r.status === 'pending')
  const overdue = records.filter(r => r.status === 'overdue')
  const totalPaid = paid.reduce((s, r) => s + r.amount, 0)
  const totalPending = pending.reduce((s, r) => s + r.amount, 0)
  const totalOverdue = overdue.reduce((s, r) => s + r.amount, 0)

  const filtered = activeTab === 'all' ? records
    : activeTab === 'paid' ? paid
    : activeTab === 'pending' ? pending
    : overdue

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: records.length },
    { key: 'paid', label: 'Pagados', count: paid.length },
    { key: 'pending', label: 'Pendientes', count: pending.length },
    { key: 'overdue', label: 'Vencidos', count: overdue.length },
  ]

  return (
    <div className="flex flex-col h-full fade-in">
      {/* ── Header stats ── */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-[#E8E6F0]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-[#1A1827]">Facturación</h1>
          {project && (
            <span className="text-xs text-[#6B6B80] bg-white px-3 py-1 rounded-full border border-[#E8E6F0]">
              Contrato {project.duration_months} meses
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Vencido */}
          <div className="bg-white border border-[#E8E6F0] rounded-xl p-3 md:p-4">
            <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Vencido</p>
            <p className="text-xl md:text-2xl font-bold text-red-400">
              {totalOverdue > 0 ? `€${totalOverdue.toLocaleString()}` : '—'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${totalOverdue > 0 ? 'bg-red-400' : 'bg-[#6B6B80]'}`} />
              <p className="text-[10px] text-[#6B6B80]">{overdue.length} facturas</p>
            </div>
          </div>

          {/* Pendiente */}
          <div className="bg-white border border-[#E8E6F0] rounded-xl p-3 md:p-4">
            <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Por pagar</p>
            <p className="text-xl md:text-2xl font-bold text-amber-400">
              {totalPending > 0 ? `€${totalPending.toLocaleString()}` : '—'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${totalPending > 0 ? 'bg-amber-400' : 'bg-[#6B6B80]'}`} />
              <p className="text-[10px] text-[#6B6B80]">{pending.length} facturas</p>
            </div>
          </div>

          {/* Pagado */}
          <div className="bg-white border border-[#E8E6F0] rounded-xl p-3 md:p-4">
            <p className="text-[10px] text-[#6B6B80] uppercase tracking-wider mb-1">Pagado</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-400">
              {totalPaid > 0 ? `€${totalPaid.toLocaleString()}` : '—'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${totalPaid > 0 ? 'bg-emerald-400' : 'bg-[#6B6B80]'}`} />
              <p className="text-[10px] text-[#6B6B80]">{paid.length} facturas</p>
            </div>
          </div>
        </div>

        {/* Timeline bar */}
        {records.length > 0 && (
          <div className="mt-4">
            <div className="flex gap-1">
              {records.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="flex-1 group"
                  title={`Mes ${r.period_month} · €${r.amount}`}
                >
                  <div className={`h-1.5 rounded-full transition-all ${
                    r.id === selected?.id ? 'h-2.5' : ''
                  } ${
                    r.status === 'paid'
                      ? 'bg-emerald-500'
                      : r.status === 'overdue'
                      ? 'bg-red-500'
                      : 'bg-[#C026A8]'
                  }`} />
                  <p className={`text-[9px] text-center mt-1 transition-colors ${
                    r.id === selected?.id ? 'text-[#C026A8] font-semibold' : 'text-[#6B6B80]'
                  }`}>
                    M{r.period_month}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs + list / detail ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: list */}
        <div className="flex flex-col w-full md:w-[55%] border-r border-[#E8E6F0] overflow-hidden">
          {/* Tabs */}
          <div className="flex gap-1 px-4 pt-3 pb-2 border-b border-[#E8E6F0]">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === t.key
                    ? 'bg-gradient-to-r from-[#E040A0] to-[#8B22E8] text-white'
                    : 'text-[#6B6B80] hover:text-[#1A1827] hover:bg-[#F4F3F9]'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === t.key ? 'bg-white/20' : 'bg-[#E8E6F0]'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-[#6B6B80] text-center py-10">Sin registros</p>
            ) : (
              filtered.map((record) => (
                <button
                  key={record.id}
                  onClick={() => setSelected(record)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#E8E6F0] text-left transition-colors hover:bg-[#F4F3F9] ${
                    selected?.id === record.id ? 'bg-[#C026A8]/5 border-l-2 border-l-[#C026A8]' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    record.status === 'paid' ? 'bg-emerald-500/10'
                    : record.status === 'overdue' ? 'bg-red-500/10'
                    : 'bg-[#C026A8]/10'
                  }`}>
                    {record.status === 'paid'
                      ? <CheckCircle size={14} className="text-emerald-400" />
                      : record.status === 'overdue'
                      ? <AlertCircle size={14} className="text-red-400" />
                      : <Clock size={14} className="text-[#C026A8]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1827]">
                      Mensualidad #{String(record.period_month).padStart(3, '0')}
                    </p>
                    <p className="text-xs text-[#6B6B80] truncate">
                      {record.status === 'paid' && record.paid_at
                        ? `Pagado · ${new Date(record.paid_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`
                        : `Vence · ${new Date(record.due_date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-[#1A1827]">€{record.amount.toLocaleString()}</p>
                    <p className={`text-[10px] mt-0.5 ${
                      record.status === 'paid' ? 'text-emerald-400'
                      : record.status === 'overdue' ? 'text-red-400'
                      : 'text-amber-400'
                    }`}>
                      {record.status === 'paid' ? 'Pagado' : record.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: detail panel (hidden on mobile) */}
        <div className="hidden md:flex flex-col flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-5">
              {/* Detail header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-[#6B6B80] mb-1">Detalle de factura</p>
                  <p className="text-2xl font-bold font-mono text-[#1A1827]">
                    #00{selected.period_month.toString().padStart(2, '0')}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full mt-2 font-medium ${
                    selected.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400'
                    : selected.status === 'overdue' ? 'bg-red-500/10 text-red-400'
                    : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selected.status === 'paid' ? 'bg-emerald-400'
                      : selected.status === 'overdue' ? 'bg-red-400'
                      : 'bg-amber-400'
                    }`} />
                    {selected.status === 'paid' ? 'Pagado' : selected.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadInvoice(selected, project, user?.email || 'Cliente')}
                    title="Descargar factura"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white border border-[#E8E6F0] text-[#6B6B80] hover:text-[#1A1827] hover:border-[#C026A8]/40 transition-all"
                  >
                    <Download size={13} />
                    Descargar
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-white border border-[#E8E6F0] flex items-center justify-center text-[#6B6B80] hover:text-[#1A1827] transition-colors">
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>

              {/* Amount hero */}
              <div className="bg-white border border-[#E8E6F0] rounded-xl p-5 mb-4">
                <p className="text-xs text-[#6B6B80] mb-2">Importe</p>
                <p className="text-4xl font-bold font-mono gradient-text">
                  €{selected.amount.toLocaleString()}
                </p>
                {project && (
                  <p className="text-xs text-[#6B6B80] mt-2">
                    {project.monthly_price === selected.amount ? 'Mensualidad estándar' : 'Importe ajustado'}
                  </p>
                )}
              </div>

              {/* Detail rows */}
              <div className="bg-white border border-[#E8E6F0] rounded-xl divide-y divide-[#E8E6F0] mb-4">
                <div className="flex justify-between items-center px-4 py-3">
                  <p className="text-xs text-[#6B6B80]">Concepto</p>
                  <p className="text-xs font-medium text-[#1A1827]">Mensualidad {selected.period_month}</p>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <p className="text-xs text-[#6B6B80]">Fecha de vencimiento</p>
                  <p className="text-xs font-medium text-[#1A1827]">
                    {new Date(selected.due_date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {selected.paid_at && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <p className="text-xs text-[#6B6B80]">Fecha de pago</p>
                    <p className="text-xs font-medium text-emerald-400">
                      {new Date(selected.paid_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {project && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <p className="text-xs text-[#6B6B80]">Total contrato</p>
                    <p className="text-xs font-medium text-[#1A1827]">€{project.total_price.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selected.status !== 'paid' && (
                <div className={`rounded-xl p-4 text-xs ${
                  selected.status === 'overdue'
                    ? 'bg-red-500/5 border border-red-500/20 text-red-400'
                    : 'bg-[#C026A8]/5 border border-[#C026A8]/20 text-[#C026A8]'
                }`}>
                  {selected.status === 'overdue'
                    ? 'Este pago está vencido. Contacta a tu gestor de NODO ONE para regularizar tu situación.'
                    : 'Para gestionar el pago de esta mensualidad, contacta a tu gestor de NODO ONE.'
                  }
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#6B6B80] text-sm">
              Selecciona una factura para ver el detalle
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
