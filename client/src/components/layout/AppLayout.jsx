import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Kanban, BarChart3, UserCheck, CreditCard, Settings, LogOut, Zap, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts',  icon: Users,           label: 'Contacts' },
  { to: '/pipeline',  icon: Kanban,          label: 'Pipeline' },
  { to: '/reports',   icon: BarChart3,       label: 'Reports', pro: true },
  { to: '/team',      icon: UserCheck,       label: 'Team' },
]

const settingsNav = [
  { to: '/settings/billing', icon: CreditCard, label: 'Billing' },
  { to: '/settings',         icon: Settings,   label: 'Settings' },
]

function Avatar({ name, size = 'sm' }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  )
}

function PlanBadge() {
  const { tenant, isPro } = useAuth()
  if (isPro) return <span className="badge bg-brand-100 text-brand-700">Pro</span>
  const days = Math.max(0, Math.ceil((new Date(tenant?.subscriptionEndAt) - new Date()) / 86400000))
  return <span className="badge bg-amber-100 text-amber-700">{days}d trial</span>
}

export default function AppLayout() {
  const { user, tenant, logout, isAdmin } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col border-r bg-white shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{tenant?.name}</p>
          </div>
          <PlanBadge />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, pro }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {pro && <span className="badge bg-brand-50 text-brand-600 text-[10px]">Pro</span>}
            </NavLink>
          ))}

          <div className="pt-4 mt-4 border-t">
            <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Workspace</p>
            {settingsNav.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User menu */}
        <div className="border-t p-3 relative">
          <button
            onClick={() => setUserMenuOpen(v => !v)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            <Avatar name={user?.name} />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-16 left-3 right-3 bg-white border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
              <button onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
