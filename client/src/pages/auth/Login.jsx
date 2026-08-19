import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'

function AuthShell({ title, sub, children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">FlowCRM</span>
        </div>
        <div className="card">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">{title}</h1>
          <p className="text-sm text-gray-500 mb-6">{sub}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      nav('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <AuthShell title="Welcome back" sub="Sign in to your workspace">
      <form onSubmit={handle} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="you@company.com" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="••••••••" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-sm text-gray-500 text-center mt-5">
        No account? <Link to="/register" className="text-brand-600 font-medium hover:underline">Start free trial</Link>
      </p>
    </AuthShell>
  )
}

export function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handle = async e => {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    try {
      await register(form)
      nav('/dashboard')
      toast.success('Welcome! Your 14-day Pro trial has started.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <AuthShell title="Create your workspace" sub="14-day free Pro trial — no credit card needed">
      <form onSubmit={handle} className="space-y-4">
        <div>
          <label className="label">Company name</label>
          <input className="input" placeholder="Acme Inc." value={form.companyName} onChange={set('companyName')} required />
        </div>
        <div>
          <label className="label">Your name</label>
          <input className="input" placeholder="Alex Kumar" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="label">Work email</label>
          <input className="input" type="email" placeholder="alex@acme.com" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? 'Creating workspace…' : 'Create workspace'}
        </button>
      </form>
      <p className="text-sm text-gray-500 text-center mt-5">
        Already have an account? <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  )
}

export default Login
