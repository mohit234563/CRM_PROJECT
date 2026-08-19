import { useEffect, useState } from 'react'
import { Users, Handshake, TrendingUp, Activity, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)   return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

export default function Dashboard() {
  const { user, tenant } = useAuth()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/').then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  const inTrial = tenant?.subscriptionStatus === 'trialing'
  const trialDays = inTrial ? Math.max(0, Math.ceil((new Date(tenant.trialEndsAt) - new Date()) / 86400000)) : 0

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-0.5">Here's what's happening with your sales pipeline.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/contacts" className="btn-secondary"><Plus className="w-4 h-4" />Add contact</Link>
          <Link to="/pipeline" className="btn-primary"><Plus className="w-4 h-4" />New deal</Link>
        </div>
      </div>

      {/* Trial banner */}
      {inTrial && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Pro trial:</span> {trialDays} days remaining. Upgrade to keep all features.
          </p>
          <Link to="/settings/billing" className="text-sm font-semibold text-amber-700 hover:underline">
            Upgrade →
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard icon={Users}     label="Total contacts" value={stats?.totalContacts}  color="bg-blue-50 text-blue-600" />
        <KpiCard icon={Handshake} label="Active deals"   value={stats?.totalDeals}     color="bg-brand-50 text-brand-600" />
        <KpiCard icon={TrendingUp} label="Won revenue"  value={stats?.wonRevenue ? `₹${stats.wonRevenue.toLocaleString()}` : '₹0'} color="bg-green-50 text-green-600" />
      </div>

      {/* Activity Feed */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Recent activity</h2>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : stats?.recentActivity?.length ? (
          <div className="space-y-1">
            {stats.recentActivity.map((act, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                  {act.userId?.name?.[0] ?? '?'}
                </div>
                <p className="text-sm text-gray-700 flex-1">
                  <span className="font-medium">{act.userId?.name ?? 'Someone'}</span>
                  {' '}{act.action}{' '}
                  <span className="text-gray-500">{act.entityType}</span>
                  {act.meta?.name && <span className="font-medium"> "{act.meta.name}"</span>}
                </p>
                <span className="text-xs text-gray-400 shrink-0">{timeAgo(act.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No activity yet. Start by adding contacts.</p>
          </div>
        )}
      </div>
    </div>
  )
}
