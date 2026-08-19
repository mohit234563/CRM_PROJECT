import { useState, useEffect } from 'react'
import { UserPlus, Trash2, Shield, ChevronDown, Mail, Clock } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const ROLE_COLORS = {
  owner:  'bg-purple-100 text-purple-700',
  admin:  'bg-blue-100 text-blue-700',
  member: 'bg-gray-100 text-gray-600'
}

function InviteModal({ onClose, onInvited }) {
  const [form, setForm] = useState({ email: '', role: 'member' })
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/send-invite', form)
      toast.success(`Invite sent to ${form.email}`)
      onInvited()
      onClose()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to send invite') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b">
          <h2 className="font-semibold">Invite team member</h2>
          <p className="text-sm text-gray-500 mt-0.5">They'll receive an email with a link to join.</p>
        </div>
        <form onSubmit={handle} className="p-5 space-y-4">
          <div>
            <label className="label">Email address</label>
            <input className="input" type="email" placeholder="colleague@company.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="member">Member — can view and edit their contacts</option>
              <option value="admin">Admin — full access except billing</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Team() {
  const { user: me, isAdmin } = useAuth()
  const [members, setMembers]   = useState([])
  const [invites, setInvites]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/team')
      setMembers(data.members)
      setInvites(data.invites)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/team/${id}/role`, { role })
      setMembers(m => m.map(x => x._id === id ? { ...x, role } : x))
      toast.success('Role updated')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update role') }
  }

  const removeMember = async (id, name) => {
    if (!confirm(`Remove ${name} from the workspace?`)) return
    try {
      await api.delete(`/team/${id}`)
      setMembers(m => m.filter(x => x._id !== id))
      toast.success('Member removed')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to remove member') }
  }

  const cancelInvite = async id => {
    try {
      await api.delete(`/team/invite/${id}`)
      setInvites(i => i.filter(x => x._id !== id))
      toast.success('Invite cancelled')
    } catch (err) { toast.error('Failed to cancel invite') }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 text-sm mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInvite(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" />Invite member
          </button>
        )}
      </div>

      {/* Active members */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Members</h2>
        <div className="divide-y">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="py-3 h-14 bg-gray-50 rounded animate-pulse mb-2" />)
          ) : members.map(m => (
            <div key={m._id} className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold shrink-0">
                {m.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  {m._id === me?._id && <span className="badge bg-gray-100 text-gray-500 text-[10px]">you</span>}
                </div>
                <p className="text-xs text-gray-400">{m.email}</p>
              </div>

              {/* Role selector */}
              {isAdmin && m.role !== 'owner' && m._id !== me?._id ? (
                <select
                  value={m.role}
                  onChange={e => changeRole(m._id, e.target.value)}
                  className="text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <span className={`badge ${ROLE_COLORS[m.role]}`}>{m.role}</span>
              )}

              {isAdmin && m.role !== 'owner' && m._id !== me?._id && (
                <button onClick={() => removeMember(m._id, m.name)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />Pending invites
          </h2>
          <div className="divide-y">
            {invites.map(inv => (
              <div key={inv._id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{inv.email}</p>
                  <p className="text-xs text-gray-400">
                    Invited as {inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="badge bg-amber-100 text-amber-700">Pending</span>
                {isAdmin && (
                  <button onClick={() => cancelInvite(inv._id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvited={fetch} />}
    </div>
  )
}
