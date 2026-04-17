import { useEffect, useState } from 'react'
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Shield,
  Globe,
  Bot,
  Mail,
  Phone,
  Database,
  MessageCircle,
  ExternalLink,
  Lock,
  Plus,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import type { ClientCredential } from '../../types'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

const DEMO_CREDENTIALS: ClientCredential[] = [
  {
    id: 'c1',
    client_id: 'demo',
    platform: 'whatsapp_business',
    label: 'WhatsApp Business',
    username: '+34 600 000 000',
    password: 'demo_password_123',
    url: 'https://business.whatsapp.com',
    notes: 'Número principal de WhatsApp Business para el agente.',
    is_visible_to_client: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c2',
    client_id: 'demo',
    platform: 'nodo_bot',
    label: 'Panel NODO Bot',
    username: 'cliente@empresa.com',
    password: 'secure_pass_456',
    url: 'https://app.nodoone.com',
    notes: 'Acceso al panel de control de tu empleado digital.',
    is_visible_to_client: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c3',
    client_id: 'demo',
    platform: 'crm',
    label: 'CRM',
    username: 'admin@empresa.com',
    password: 'crm_password_789',
    url: 'https://crm.empresa.com',
    notes: 'CRM integrado con el agente.',
    is_visible_to_client: true,
    created_at: new Date().toISOString(),
  },
]

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  whatsapp_business: MessageCircle,
  nodo_bot: Bot,
  crm: Database,
  instagram: Globe,
  email: Mail,
  key: Key,
  phone: Phone,
  bot: Bot,
  web: Globe,
  otro: Key,
}

function getPlatformIcon(platform: string): React.ElementType {
  return PLATFORM_ICONS[platform.toLowerCase()] ?? Key
}

function CredentialCard({ cred }: { cred: ClientCredential }) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const PlatformIcon = getPlatformIcon(cred.icon || cred.platform)

  async function copyPassword() {
    if (!cred.password) return
    await navigator.clipboard.writeText(cred.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-[#E8E6F0] bg-white overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E040A0]/10 to-[#8B22E8]/10 border border-[#C026A8]/20 flex items-center justify-center flex-shrink-0">
          <PlatformIcon size={18} className="text-[#C026A8]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1827]">{cred.label}</p>
          {cred.url && (
            <a
              href={cred.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-[#C026A8] hover:text-[#E040A0] transition-colors mt-0.5"
            >
              <Globe size={9} />
              {cred.url.replace(/^https?:\/\//, '').split('/')[0]}
              <ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#E8E6F0]" />

      {/* Fields */}
      <div className="px-4 py-3 space-y-3">
        {/* Username */}
        {cred.username && (
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1">Usuario / Teléfono</p>
            <p className="text-sm font-mono text-[#1A1827] bg-[#F4F3F9] border border-[#E8E6F0] rounded-lg px-3 py-2">
              {cred.username}
            </p>
          </div>
        )}

        {/* Password */}
        {cred.password && (
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1">Contraseña</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-[#F4F3F9] border border-[#E8E6F0] rounded-lg px-3 py-2">
                <p className="text-sm font-mono text-[#1A1827] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {showPassword ? cred.password : '••••••••'}
                </p>
              </div>
              <button
                onClick={() => setShowPassword(v => !v)}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
                className="w-9 h-9 rounded-lg bg-[#F4F3F9] border border-[#E8E6F0] flex items-center justify-center text-[#6B6B80] hover:text-[#1A1827] hover:border-[#C026A8]/40 transition-all flex-shrink-0"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={copyPassword}
                title="Copiar contraseña"
                className="w-9 h-9 rounded-lg bg-[#F4F3F9] border border-[#E8E6F0] flex items-center justify-center text-[#6B6B80] hover:text-[#1A1827] hover:border-[#C026A8]/40 transition-all flex-shrink-0"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* URL link */}
        {cred.url && (
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1">Enlace</p>
            <a
              href={cred.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#C026A8] hover:text-[#E040A0] transition-colors font-medium bg-[#F4F3F9] border border-[#E8E6F0] rounded-lg px-3 py-2"
            >
              <Globe size={13} />
              <span className="flex-1 truncate">{cred.url}</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* Notes */}
        {cred.notes && (
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1">Notas</p>
            <p className="text-xs text-[#6B6B80] leading-relaxed">{cred.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function ClientCredentialsPage() {
  const { user } = useAuthStore()
  const [credentials, setCredentials] = useState<ClientCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [showShareForm, setShowShareForm] = useState(false)
  const [sharedCreds, setSharedCreds] = useState<ClientCredential[]>([])
  const [savingShare, setSavingShare] = useState(false)
  const [shareForm, setShareForm] = useState({ label: '', username: '', password: '', notes: '' })

  useEffect(() => {
    loadData()
  }, [user?.id])

  async function loadData() {
    setLoading(true)
    try {
      if (IS_DEMO) {
        setCredentials(DEMO_CREDENTIALS)
        setLoading(false)
        return
      }
      if (!user?.clientId) { setLoading(false); return }
      const { data } = await supabase
        .from('client_credentials')
        .select('*')
        .eq('client_id', user.clientId)
        .eq('is_visible_to_client', true)
        .order('created_at')
      setCredentials(data || [])

      const { data: sharedData } = await supabase
        .from('client_credentials')
        .select('*')
        .eq('client_id', user.clientId)
        .eq('platform', 'cliente_compartido')
        .order('created_at', { ascending: false })
      setSharedCreds(sharedData || [])
    } finally {
      setLoading(false)
    }
  }

  async function saveSharedCredential() {
    if (!shareForm.label.trim() || !user?.clientId) return
    setSavingShare(true)
    try {
      const { data, error } = await supabase
        .from('client_credentials')
        .insert({
          client_id: user.clientId,
          platform: 'cliente_compartido',
          label: shareForm.label.trim(),
          username: shareForm.username.trim() || null,
          password: shareForm.password.trim() || null,
          notes: shareForm.notes.trim() || null,
          is_visible_to_client: true,
        })
        .select()
        .single()
      if (!error && data) {
        setSharedCreds(prev => [data, ...prev])
        setShareForm({ label: '', username: '', password: '', notes: '' })
        setShowShareForm(false)
      }
    } finally {
      setSavingShare(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 fade-in w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 flex items-center justify-center">
          <Key size={18} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1A1827]">Mis Accesos</h1>
          <p className="text-sm text-[#6B6B80]">Credenciales y plataformas de tu servicio</p>
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-6">
        <Shield size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-400">Información confidencial</p>
          <p className="text-xs text-amber-400/70 mt-0.5">
            No compartas estas credenciales con terceros. Si sospechas de un acceso no autorizado, contacta al equipo de NODO ONE inmediatamente.
          </p>
        </div>
      </div>

      {/* Section 1: Accesos de tu servicio (from NODO) */}
      <div className="mb-8">
        <p className="text-xs font-bold text-[#1A1827] uppercase tracking-wider mb-3">Accesos de tu servicio</p>
        {credentials.length === 0 ? (
          <div className="rounded-2xl border border-[#E8E6F0] bg-white p-12 text-center">
            <Lock size={36} className="text-[#BBBBCC] mx-auto mb-3" />
            <p className="text-sm text-[#6B6B80] font-medium">Sin credenciales aún</p>
            <p className="text-xs text-[#9999AA] mt-1 max-w-xs mx-auto">
              El equipo de NODO ONE compartirá aquí los accesos a tus plataformas cuando estén listos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {credentials.map(cred => (
              <CredentialCard key={cred.id} cred={cred} />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Compartir clave con NODO */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-[#1A1827] uppercase tracking-wider">Compartir clave con NODO</p>
            <p className="text-xs text-[#6B6B80] mt-0.5">Comparte accesos de tus plataformas con el equipo de NODO ONE de forma segura</p>
          </div>
          <button
            onClick={() => setShowShareForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={13} />
            Compartir acceso
          </button>
        </div>

        {/* Info notice */}
        <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 mb-4">
          <Shield size={15} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-400/80">
            Si necesitamos acceso a una de tus plataformas, puedes compartir aquí las credenciales de forma segura. Solo el equipo de NODO ONE las verá.
          </p>
        </div>

        {/* Share form */}
        {showShareForm && (
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3 mb-4">
            <p className="text-xs font-bold text-[#1A1827] uppercase tracking-wider">Nueva clave compartida</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1 block">Nombre del acceso *</label>
                <input
                  value={shareForm.label}
                  onChange={e => setShareForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="ej: Panel de control, Meta Business…"
                  className="w-full text-sm border border-[#E8E6F0] rounded-xl px-3 py-2 outline-none focus:border-indigo-400/50 bg-white text-[#1A1827] placeholder:text-[#9999AA]"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1 block">Usuario / Email</label>
                <input
                  value={shareForm.username}
                  onChange={e => setShareForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="usuario@email.com"
                  className="w-full text-sm border border-[#E8E6F0] rounded-xl px-3 py-2 outline-none focus:border-indigo-400/50 bg-white text-[#1A1827] placeholder:text-[#9999AA]"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1 block">Contraseña</label>
                <input
                  value={shareForm.password}
                  onChange={e => setShareForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Contraseña"
                  className="w-full text-sm border border-[#E8E6F0] rounded-xl px-3 py-2 outline-none focus:border-indigo-400/50 bg-white text-[#1A1827] placeholder:text-[#9999AA] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#6B6B80] uppercase tracking-wider mb-1 block">Notas (opcional)</label>
                <input
                  value={shareForm.notes}
                  onChange={e => setShareForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observaciones…"
                  className="w-full text-sm border border-[#E8E6F0] rounded-xl px-3 py-2 outline-none focus:border-indigo-400/50 bg-white text-[#1A1827] placeholder:text-[#9999AA]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveSharedCredential}
                disabled={savingShare || !shareForm.label.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {savingShare ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Check size={12} />}
                Enviar a NODO
              </button>
              <button
                onClick={() => setShowShareForm(false)}
                className="px-4 py-2 text-xs font-semibold text-[#6B6B80] hover:text-[#1A1827] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Shared credentials list */}
        {sharedCreds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedCreds.map(cred => (
              <CredentialCard key={cred.id} cred={cred} />
            ))}
          </div>
        )}
        {sharedCreds.length === 0 && !showShareForm && (
          <div className="rounded-2xl border border-[#E8E6F0] bg-white p-8 text-center">
            <Key size={28} className="text-indigo-200 mx-auto mb-2" />
            <p className="text-sm text-[#6B6B80] font-medium">No has compartido ningún acceso aún</p>
            <p className="text-xs text-[#9999AA] mt-1">Pulsa "Compartir acceso" si necesitas darnos acceso a alguna plataforma</p>
          </div>
        )}
      </div>
    </div>
  )
}
