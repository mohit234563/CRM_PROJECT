import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const token = params.get('token')
  const [form, setForm] = useState({ name: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/accept-invite', { token, ...form })
      localStorage.setItem('token', data.token)
      toast.success('Welcome to the team!')
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid invite')
    } finally { setLoading(false) }
  }

  if (!token) return <div className="p-8 text-center text-gray-500">Invalid invite link.</div>

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">FlowCRM</span>
        </div>
        <div className="card">
          <h1 className="text-xl font-semibold mb-1">You're invited!</h1>
          <p className="text-sm text-gray-500 mb-6">Create your account to join the workspace.</p>
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="label">Your name</label>
              <input className="input" placeholder="Alex Kumar" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Choose a password</label>
              <input className="input" type="password" placeholder="Min. 8 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Joining…' : 'Join workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
