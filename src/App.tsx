import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { DemoSwitcher } from './components/ui/DemoSwitcher'

// Layouts
import { InternalLayout } from './components/layout/InternalLayout'
import { ClientLayout } from './components/layout/ClientLayout'

// Guards
import { ProtectedRoute } from './routes/ProtectedRoute'

// Auth pages
import { LoginPage } from './pages/auth/LoginPage'

// Internal pages — lazy loaded (solo se descargan cuando el usuario navega a ellas)
const DashboardPage        = lazy(() => import('./pages/internal/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ClientsPage          = lazy(() => import('./pages/internal/ClientsPage').then(m => ({ default: m.ClientsPage })))
const NewClientPage        = lazy(() => import('./pages/internal/NewClientPage').then(m => ({ default: m.NewClientPage })))
const ClientDetailPage     = lazy(() => import('./pages/internal/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })))
const TeamPage             = lazy(() => import('./pages/internal/TeamPage').then(m => ({ default: m.TeamPage })))
const PlugsPage            = lazy(() => import('./pages/internal/PlugsPage').then(m => ({ default: m.PlugsPage })))
const SuperAdminPage       = lazy(() => import('./pages/internal/SuperAdminPage').then(m => ({ default: m.SuperAdminPage })))
const LeadsPage            = lazy(() => import('./pages/internal/LeadsPage').then(m => ({ default: m.LeadsPage })))
const SequencesPage        = lazy(() => import('./pages/internal/SequencesPage').then(m => ({ default: m.SequencesPage })))
const TasksPage            = lazy(() => import('./pages/internal/TasksPage').then(m => ({ default: m.TasksPage })))
const CalendarPage         = lazy(() => import('./pages/internal/CalendarPage').then(m => ({ default: m.CalendarPage })))
const ResourcesPage        = lazy(() => import('./pages/internal/ResourcesPage').then(m => ({ default: m.ResourcesPage })))
const GuiasPage            = lazy(() => import('./pages/internal/GuiasPage').then(m => ({ default: m.GuiasPage })))
const BotTesterPage        = lazy(() => import('./pages/internal/BotTesterPage').then(m => ({ default: m.BotTesterPage })))
const MasterMetricsPage    = lazy(() => import('./pages/internal/MasterMetricsPage').then(m => ({ default: m.MasterMetricsPage })))
const SolicitudesPage      = lazy(() => import('./pages/internal/SolicitudesPage').then(m => ({ default: m.SolicitudesPage })))

// Client pages — lazy loaded
const ClientDashboardPage  = lazy(() => import('./pages/client/ClientDashboardPage').then(m => ({ default: m.ClientDashboardPage })))
const ClientChatPage       = lazy(() => import('./pages/client/ClientChatPage').then(m => ({ default: m.ClientChatPage })))
const ClientProjectPage    = lazy(() => import('./pages/client/ClientProjectPage').then(m => ({ default: m.ClientProjectPage })))
const ClientBotPage        = lazy(() => import('./pages/client/ClientBotPage').then(m => ({ default: m.ClientBotPage })))
const ClientBillingPage    = lazy(() => import('./pages/client/ClientBillingPage').then(m => ({ default: m.ClientBillingPage })))
const ClientDocsPage       = lazy(() => import('./pages/client/ClientDocsPage').then(m => ({ default: m.ClientDocsPage })))
const ClientCredentialsPage = lazy(() => import('./pages/client/ClientCredentialsPage').then(m => ({ default: m.ClientCredentialsPage })))
const ClientAcademiaPage   = lazy(() => import('./pages/client/ClientAcademiaPage').then(m => ({ default: m.ClientAcademiaPage })))
const ClientMetricsPage    = lazy(() => import('./pages/client/ClientMetricsPage').then(m => ({ default: m.ClientMetricsPage })))
const ClientTestsPage      = lazy(() => import('./pages/client/ClientTestsPage').then(m => ({ default: m.ClientTestsPage })))

// Spinner compartido para Suspense fallback
function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function RootRedirect() {
  const { user, initialized } = useAuthStore()
  if (!initialized) return (
    <div className="flex items-center justify-center h-screen bg-[#08070F]">
      <div className="w-6 h-6 border-2 border-[#C026A8] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'client') return <Navigate to="/client/dashboard" replace />
  return <Navigate to="/internal/dashboard" replace />
}

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <DemoSwitcher />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Internal portal — superadmin, admin & tecnico */}
        <Route
          path="/internal"
          element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'tecnico']}>
              <InternalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/internal/dashboard" replace />} />
          <Route path="dashboard"   element={<Suspense fallback={<PageSpinner />}><DashboardPage /></Suspense>} />
          <Route path="clients"     element={<Suspense fallback={<PageSpinner />}><ClientsPage /></Suspense>} />
          <Route path="clients/new" element={<Suspense fallback={<PageSpinner />}><NewClientPage /></Suspense>} />
          <Route path="clients/:id" element={<Suspense fallback={<PageSpinner />}><ClientDetailPage /></Suspense>} />
          <Route path="team"        element={<Suspense fallback={<PageSpinner />}><TeamPage /></Suspense>} />
          <Route path="tasks"       element={<Suspense fallback={<PageSpinner />}><TasksPage /></Suspense>} />
          <Route path="solicitudes" element={<Suspense fallback={<PageSpinner />}><SolicitudesPage /></Suspense>} />
          <Route path="calendar"    element={<Suspense fallback={<PageSpinner />}><CalendarPage /></Suspense>} />
          <Route path="plugs"       element={<Suspense fallback={<PageSpinner />}><PlugsPage /></Suspense>} />
          <Route path="leads"       element={<Suspense fallback={<PageSpinner />}><LeadsPage /></Suspense>} />
          <Route path="sequences"   element={<Suspense fallback={<PageSpinner />}><SequencesPage /></Suspense>} />
          <Route path="resources"   element={<Suspense fallback={<PageSpinner />}><ResourcesPage /></Suspense>} />
          <Route path="guias"       element={<Suspense fallback={<PageSpinner />}><GuiasPage /></Suspense>} />
          <Route path="metrics"     element={<Suspense fallback={<PageSpinner />}><MasterMetricsPage /></Suspense>} />
          <Route path="bot-tester"  element={<Suspense fallback={<PageSpinner />}><BotTesterPage /></Suspense>} />
          <Route
            path="superadmin"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Suspense fallback={<PageSpinner />}><SuperAdminPage /></Suspense>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Client portal */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard"   element={<Suspense fallback={<PageSpinner />}><ClientDashboardPage /></Suspense>} />
          <Route path="chat"        element={<Suspense fallback={<PageSpinner />}><ClientChatPage /></Suspense>} />
          <Route path="project"     element={<Suspense fallback={<PageSpinner />}><ClientProjectPage /></Suspense>} />
          <Route path="bot"         element={<Suspense fallback={<PageSpinner />}><ClientBotPage /></Suspense>} />
          <Route path="billing"     element={<Suspense fallback={<PageSpinner />}><ClientBillingPage /></Suspense>} />
          <Route path="academia"    element={<Suspense fallback={<PageSpinner />}><ClientAcademiaPage /></Suspense>} />
          <Route path="docs"        element={<Suspense fallback={<PageSpinner />}><ClientDocsPage /></Suspense>} />
          <Route path="credentials" element={<Suspense fallback={<PageSpinner />}><ClientCredentialsPage /></Suspense>} />
          <Route path="metrics"     element={<Suspense fallback={<PageSpinner />}><ClientMetricsPage /></Suspense>} />
          <Route path="tests"       element={<Suspense fallback={<PageSpinner />}><ClientTestsPage /></Suspense>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
