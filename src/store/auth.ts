import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { AuthUser, UserRole } from '../types'

export const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

const DEMO_SUPERADMIN: AuthUser = {
  id: 'demo-superadmin',
  email: 'santiago@nodoone.com',
  role: 'superadmin',
  profile: {
    id: 'demo-superadmin',
    full_name: 'Santiago',
    email: 'santiago@nodoone.com',
    role: 'superadmin',
    is_active: true,
    created_at: new Date().toISOString(),
  },
}

const DEMO_ADMIN: AuthUser = {
  id: 'demo-admin',
  email: 'admin@nodoone.com',
  role: 'admin',
  profile: {
    id: 'demo-admin',
    full_name: 'Admin Demo',
    email: 'admin@nodoone.com',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
  },
}

const DEMO_CLIENT: AuthUser = {
  id: 'demo-client',
  email: 'maria@dentaplus.es',
  role: 'client',
  clientId: 'demo-client-1',
  projectId: 'demo-project-1',
}

type DemoRole = 'superadmin' | 'admin' | 'client'

interface AuthState {
  user: AuthUser | null
  originalUser: AuthUser | null  // non-null cuando está impersonando
  loading: boolean
  initialized: boolean
  isDemo: boolean
  switchDemoRole: (role: DemoRole) => void
  startImpersonation: (role: 'tecnico' | 'client', opts?: { clientId?: string; projectId?: string; clientName?: string }) => void
  stopImpersonation: () => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  originalUser: null,
  loading: false,
  initialized: false,
  isDemo: IS_DEMO,

  startImpersonation: (role, opts = {}) => {
    const current = get().user
    if (!current) return
    // Guardar usuario real
    set({ originalUser: current })
    if (role === 'tecnico') {
      set({ user: { ...current, role: 'tecnico' } })
    } else {
      set({
        user: {
          id: current.id,
          email: current.email,
          role: 'client',
          clientId: opts.clientId,
          projectId: opts.projectId,
        },
      })
    }
  },

  stopImpersonation: () => {
    const original = get().originalUser
    if (!original) return
    set({ user: original, originalUser: null })
  },

  switchDemoRole: (role) => {
    if (!IS_DEMO) return
    sessionStorage.setItem('nodo_demo_role', role)
    if (role === 'client') set({ user: DEMO_CLIENT })
    else if (role === 'superadmin') set({ user: DEMO_SUPERADMIN })
    else set({ user: DEMO_ADMIN })
  },

  initialize: async () => {
    if (IS_DEMO) {
      const savedRole = sessionStorage.getItem('nodo_demo_role') as DemoRole | null
      let demoUser: AuthUser = DEMO_SUPERADMIN
      if (savedRole === 'client') demoUser = DEMO_CLIENT
      else if (savedRole === 'admin') demoUser = DEMO_ADMIN
      else if (savedRole === 'superadmin') demoUser = DEMO_SUPERADMIN
      set({ user: demoUser, initialized: true })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const user = await resolveUser(session.user.id, session.user.email!)
        set({ user, initialized: true })
      } else {
        set({ user: null, initialized: true })
      }
    } catch {
      set({ user: null, initialized: true })
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await resolveUser(session.user.id, session.user.email!)
        set({ user })
      } else if (event === 'SIGNED_OUT') {
        set({ user: null })
      }
    })
  },

  signIn: async (email: string, password: string) => {
    if (IS_DEMO) {
      set({ user: DEMO_SUPERADMIN })
      return
    }
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        try {
          const user = await resolveUser(data.user.id, data.user.email!)
          set({ user })
        } catch (resolveErr) {
          console.error('resolveUser error:', resolveErr)
          // Fallback: sesión válida pero sin perfil completo
          set({ user: { id: data.user.id, email: data.user.email!, role: 'client' } })
        }
      }
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    if (IS_DEMO) {
      set({ user: null })
      return
    }
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

async function resolveUser(supabaseId: string, email: string): Promise<AuthUser> {
  // Primero intentar como usuario interno
  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('*')
    .eq('id', supabaseId)
    .single()

  if (internalUser) {
    return {
      id: supabaseId,
      email,
      role: internalUser.role as UserRole,
      profile: internalUser,
    }
  }

  // Intentar como cliente: buscar por email en clients
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('contact_email', email)
    .single()

  if (client) {
    // Obtener project_id del cliente
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', client.id)
      .eq('status', 'active')
      .single()

    return {
      id: supabaseId,
      email,
      role: 'client',
      clientId: client.id,
      projectId: project?.id,
    }
  }

  // Fallback
  return { id: supabaseId, email, role: 'client' }
}
