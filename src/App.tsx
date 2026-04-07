import { useEffect } from 'react'
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

// Internal pages
import { DashboardPage } from './pages/internal/DashboardPage'
import { ClientsPage } from './pages/internal/ClientsPage'
import { NewClientPage } from './pages/internal/NewClientPage'
import { ClientDetailPage } from './pages/internal/ClientDetailPage'
import { TeamPage } from './pages/internal/TeamPage'
import { PlugsPage } from './pages/internal/PlugsPage'
import { SuperAdminPage } from './pages/internal/SuperAdminPage'
import { LeadsPage } from './pages/internal/LeadsPage'
import { SequencesPage } from './pages/internal/SequencesPage'
import { TasksPage } from './pages/internal/TasksPage'
import { CalendarPage } from './pages/internal/CalendarPage'
import { ResourcesPage } from './pages/internal/ResourcesPage'
import { GuiasPage } from './pages/internal/GuiasPage'
import { BotTesterPage } from './pages/internal/BotTesterPage'
import { MasterMetricsPage } from './pages/internal/MasterMetricsPage'

// Client pages
import { ClientDashboardPage } from './pages/client/ClientDashboardPage'
import { ClientChatPage } from './pages/client/ClientChatPage'
import { ClientProjectPage } from './pages/client/ClientProjectPage'
import { ClientBotPage } from './pages/client/ClientBotPage'
import { ClientBillingPage } from './pages/client/ClientBillingPage'
import { ClientDocsPage } from './pages/client/ClientDocsPage'
import { ClientCredentialsPage } from './pages/client/ClientCredentialsPage'
import { ClientAcademiaPage } from './pages/client/ClientAcademiaPage'
import { ClientMetricsPage } from './pages/client/ClientMetricsPage'
import { ClientTestsPage } from './pages/client/ClientTestsPage'

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
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/new" element={<NewClientPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="plugs" element={<PlugsPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="sequences" element={<SequencesPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="guias" element={<GuiasPage />} />
          <Route path="metrics" element={<MasterMetricsPage />} />
          <Route path="bot-tester" element={<BotTesterPage />} />
          <Route
            path="superadmin"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminPage />
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
          <Route path="dashboard" element={<ClientDashboardPage />} />
          <Route path="chat" element={<ClientChatPage />} />
          <Route path="project" element={<ClientProjectPage />} />
          <Route path="bot" element={<ClientBotPage />} />
          <Route path="billing" element={<ClientBillingPage />} />
          <Route path="academia" element={<ClientAcademiaPage />} />
          <Route path="docs" element={<ClientDocsPage />} />
          <Route path="credentials" element={<ClientCredentialsPage />} />
          <Route path="metrics" element={<ClientMetricsPage />} />
          <Route path="tests" element={<ClientTestsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
