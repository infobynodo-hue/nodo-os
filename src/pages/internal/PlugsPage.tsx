import { PLUGS } from '../../types'
import type { PlugDefinition } from '../../types'

function PlugCard({ plug }: { plug: PlugDefinition }) {
  return (
    <div className="bg-[#1E2433] rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
          {plug.icon}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] px-2 py-0.5 bg-white/8 text-white/40 rounded-full font-mono">
            fase {plug.available_from_phase}+
          </span>
          {plug.accepts_files && (
            <span className="text-[10px] px-2 py-0.5 bg-[#C026A8]/10 text-[#E040A0] rounded-full flex items-center gap-1">
              📎 Acepta archivos
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="font-semibold text-white mb-1">{plug.label}</p>
        <p className="text-sm text-white/60 leading-relaxed">{plug.detail}</p>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-xs text-white/30">
        <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded">{plug.id}</span>
        <span>·</span>
        <span>{plug.services.length} servicios</span>
      </div>
    </div>
  )
}

export function PlugsPage() {
  const gestionPlugs = PLUGS.filter(p => p.category === 'gestion')
  const comunicacionPlugs = PLUGS.filter(p => p.category === 'comunicacion')

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 fade-in">
      <div className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Sistema</p>
        <h1 className="text-2xl font-bold text-[#1A1F2E]">Plugs</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">Modos del chat disponibles para los clientes</p>
      </div>

      {/* Gestión del Agente */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
            Gestión del Agente
          </p>
          <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded-full">
            {gestionPlugs.length} plugs
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {gestionPlugs.map(plug => (
            <PlugCard key={plug.id} plug={plug} />
          ))}
        </div>
      </div>

      {/* Comunicación con NODO ONE */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
            Comunicación con NODO ONE
          </p>
          <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded-full">
            {comunicacionPlugs.length} plugs
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {comunicacionPlugs.map(plug => (
            <PlugCard key={plug.id} plug={plug} />
          ))}
        </div>
      </div>

      <div className="mt-2 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
        <p className="text-xs text-[#9CA3AF]">
          Los plugs se activan individualmente por cliente desde la vista del cliente → pestaña Plugs.
          La activación controla qué modos de chat están disponibles para cada cliente en su portal.
        </p>
        <p className="text-xs text-[#9CA3AF] mt-2 font-mono bg-gray-50 rounded-lg p-3 border border-gray-100">
          {`-- Para activar los nuevos plugs en proyectos existentes, ejecutar en Supabase:`}<br />
          {`INSERT INTO project_plugs (project_id, plug_id, is_enabled)`}<br />
          {`SELECT p.id, unnest(ARRAY['schedule_meeting','bot_metrics']::text[]), true`}<br />
          {`FROM projects p`}<br />
          {`ON CONFLICT (project_id, plug_id) DO NOTHING;`}
        </p>
      </div>
    </div>
  )
}
