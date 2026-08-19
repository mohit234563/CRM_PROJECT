import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { Lock, Zap, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const STAGE_COLORS = {
  Lead: '#94a3b8', Prospect: '#60a5fa', Proposal: '#fbbf24',
  Negotiation: '#fb923c', Won: '#34d399', Lost: '#f87171'
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function Reports() {
  const { isPro } = useAuth()
  const [pipeline, setPipeline] = useState([])
  const [contactsOverTime, setContactsOverTime] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isPro) { setLoading(false); return }
    Promise.all([
      api.get('/reports/pipeline'),
      api.get('/reports/contacts-over-time')
    ]).then(([p, c]) => {
      setPipeline(p.data)
      setContactsOverTime(c.data.map(d => ({ name: `${MONTHS[d._id.month - 1]} '${String(d._id.year).slice(2)}`, count: d.count })))
    }).finally(() => setLoading(false))
  }, [isPro])

  if (!isPro) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card text-center py-16">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-brand-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Reports are a Pro feature</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Get insight into your pipeline value, conversion rates, and contact growth with advanced reports.
          </p>
          <Link to="/settings/billing" className="btn-primary inline-flex">
            <Zap className="w-4 h-4" />Upgrade to Pro
          </Link>
        </div>
      </div>
    )
  }

  const totalValue = pipeline.reduce((s, p) => s + p.value, 0)
  const wonValue = pipeline.find(p => p._id === 'Won')?.value || 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-0.5">Insights into your pipeline and growth.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Total pipeline value</p>
          <p className="text-2xl font-bold text-gray-900">₹{totalValue.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Won revenue</p>
          <p className="text-2xl font-bold text-green-600">₹{wonValue.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Win rate</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalValue > 0 ? Math.round((wonValue / totalValue) * 100) : 0}%
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />Deal value by stage
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pipeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {pipeline.map((entry, i) => <Cell key={i} fill={STAGE_COLORS[entry._id] || '#6366f1'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Contacts added over time</h3>
            {contactsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={contactsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-400 text-sm">Not enough data yet</div>
            )}
          </div>

          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Deal count by stage</h3>
            <div className="flex gap-3 flex-wrap">
              {pipeline.map(p => (
                <div key={p._id} className="flex-1 min-w-[100px] p-3 rounded-xl" style={{ backgroundColor: `${STAGE_COLORS[p._id] || '#6366f1'}15` }}>
                  <p className="text-xs font-medium" style={{ color: STAGE_COLORS[p._id] || '#6366f1' }}>{p._id}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{p.count}</p>
                  <p className="text-xs text-gray-500">₹{p.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
