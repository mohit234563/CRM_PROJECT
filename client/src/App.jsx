import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AcceptInvite from './pages/auth/AcceptInvite'
import Dashboard from './pages/dashboard/Dashboard'
import Contacts from './pages/contacts/Contacts'
import Pipeline from './pages/pipeline/Pipeline'
import Team from './pages/team/Team'
import Billing from './pages/billing/Billing'
import Settings from './pages/settings/Settings'
import Reports from './pages/reports/Reports'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"         element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"      element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route element={<PrivateRoute><SocketProvider><AppLayout /></SocketProvider></PrivateRoute>}>
        <Route path="/dashboard"         element={<Dashboard />} />
        <Route path="/contacts"          element={<Contacts />} />
        <Route path="/pipeline"          element={<Pipeline />} />
        <Route path="/reports"           element={<Reports />} />
        <Route path="/team"              element={<Team />} />
        <Route path="/settings/billing"  element={<Billing />} />
        <Route path="/settings"          element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ className: 'text-sm' }} />
      </BrowserRouter>
    </AuthProvider>
  )
}
