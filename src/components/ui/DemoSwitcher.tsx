import { useNavigate } from 'react-router-dom'
import { useAuthStore, IS_DEMO } from '../../store/auth'

export function DemoSwitcher() {
  const { user, switchDemoRole } = useAuthStore()
  const navigate = useNavigate()

  if (!IS_DEMO) return null

  const role = user?.role

  function switchTo(r: 'superadmin' | 'admin' | 'client') {
    switchDemoRole(r)
    if (r === 'client') navigate('/client/dashboard')
    else navigate('/internal/dashboard')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 bg-[#12101A] border border-[#C026A8]/30 rounded-full px-3 py-1.5 shadow-lg">
      <span className="text-[10px] text-[#6B6B80] mr-1">DEMO</span>
      <button
        onClick={() => switchTo('superadmin')}
        className={`text-xs px-2.5 py-1 rounded-full transition-all ${
          role === 'superadmin'
            ? 'bg-gradient-to-r from-violet-600 to-violet-400 text-white font-semibold'
            : 'text-[#6B6B80] hover:text-white'
        }`}
      >
        S.Admin
      </button>
      <button
        onClick={() => switchTo('admin')}
        className={`text-xs px-2.5 py-1 rounded-full transition-all ${
          role === 'admin'
            ? 'bg-gradient-to-r from-[#E040A0] to-[#8B22E8] text-white font-semibold'
            : 'text-[#6B6B80] hover:text-white'
        }`}
      >
        Admin
      </button>
      <button
        onClick={() => switchTo('client')}
        className={`text-xs px-2.5 py-1 rounded-full transition-all ${
          role === 'client'
            ? 'bg-gradient-to-r from-[#E040A0] to-[#8B22E8] text-white font-semibold'
            : 'text-[#6B6B80] hover:text-white'
        }`}
      >
        Cliente
      </button>
    </div>
  )
}
