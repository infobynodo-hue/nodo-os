import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Bot, Lock, Mail } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { NodoButton } from '../../components/ui/NodoButton'
import { NodoInput } from '../../components/ui/NodoInput'

export function LoginPage() {
  const { signIn, loading } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await signIn(email, password)
      // La redirección la maneja el Router basado en el rol
      const role = useAuthStore.getState().user?.role
      if (role === 'client') {
        navigate('/client/dashboard')
      } else {
        navigate('/internal/dashboard')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : msg)
    }
  }

  return (
    <div className="min-h-screen bg-[#08070F] flex items-center justify-center p-4">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C026A8]/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#8B22E8]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E040A0] via-[#C026A8] to-[#8B22E8] flex items-center justify-center shadow-[0_0_30px_rgba(192,38,168,0.3)] mb-4">
            <Bot size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NODO OS</h1>
          <p className="text-sm text-[#6B6B80] mt-1">Plataforma de gestión de servicios</p>
        </div>

        {/* Form */}
        <div className="bg-[#12101A] border border-[#1E1C2A] rounded-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          <h2 className="text-base font-semibold text-white mb-5">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <NodoInput
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={14} />}
              required
              autoComplete="email"
            />

            <NodoInput
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={14} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#6B6B80] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <NodoButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-1"
            >
              Entrar
            </NodoButton>
          </form>
        </div>

        <p className="text-center text-xs text-[#6B6B80] mt-6">
          ¿Problemas para acceder? Contacta a tu gestor de NODO ONE.
        </p>
      </div>
    </div>
  )
}
