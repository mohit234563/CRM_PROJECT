import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Trash2, Edit2, Mail, Phone, X,Users  } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'

const STAGES = ['active', 'inactive']

function ContactModal({ contact, onClose, onSave, team }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', position: '',
    status: 'active', notes: '', assignedTo: '', tags: '',
    ...contact
  })
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] }
      if (contact?._id) {
        const { data } = await api.patch(`/contacts/${contact._id}`, payload)
        onSave(data, 'update')
      } else {
        const { data } = await api.post('/contacts', payload)
        onSave(data, 'create')
      }
      toast.success(contact?._id ? 'Contact updated' : 'Contact added')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">{contact?._id ? 'Edit contact' : 'New contact'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handle} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={set('name')} required /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
            <div><label className="label">Company</label><input className="input" value={form.company} onChange={set('company')} /></div>
            <div><label className="label">Position</label><input className="input" value={form.position} onChange={set('position')} /></div>
            <div>
              <label className="label">Assign to</label>
              <select className="input" value={form.assignedTo} onChange={set('assignedTo')}>
                <option value="">Unassigned</option>
                {team.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Tags (comma-separated)</label><input className="input" value={form.tags} onChange={set('tags')} placeholder="hot-lead, enterprise" /></div>
          <div><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes} onChange={set('notes')} /></div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Saving…' : 'Save contact'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Contacts() {
  const { isAdmin } = useAuth()
  const socketRef = useSocket()
  const [contacts, setContacts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [team, setTeam] = useState([])
  const [page, setPage] = useState(1)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (search) params.search = search
      const { data } = await api.get('/contacts', { params })
      setContacts(data.contacts)
      setTotal(data.total)
    } finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  useEffect(() => {
    api.get('/team').then(r => setTeam(r.data.members))
  }, [])

  // Real-time socket updates
  useEffect(() => {
    const s = socketRef?.current
    if (!s) return
    const onCreated = c => setContacts(p => [c, ...p])
    const onUpdated = c => setContacts(p => p.map(x => x._id === c._id ? c : x))
    const onDeleted = ({ _id }) => setContacts(p => p.filter(x => x._id !== _id))
    s.on('contact:created', onCreated)
    s.on('contact:updated', onUpdated)
    s.on('contact:deleted', onDeleted)
    return () => { s.off('contact:created', onCreated); s.off('contact:updated', onUpdated); s.off('contact:deleted', onDeleted) }
  }, [socketRef?.current])

  const handleSave = (contact, type) => {
    if (type === 'create') setContacts(p => [contact, ...p])
    else setContacts(p => p.map(c => c._id === contact._id ? contact : c))
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await api.delete(`/contacts/${id}`)
      setContacts(p => p.filter(c => c._id !== id))
      toast.success('Contact deleted')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete') }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total contacts</p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary"><Plus className="w-4 h-4" />Add contact</button>
      </div>

      <div className="card mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name, email, company…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Company</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Assigned to</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : contacts.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 opacity-30" />
                  <p>No contacts yet. Add your first one!</p>
                </div>
              </td></tr>
            ) : contacts.map(c => (
              <tr key={c._id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {c.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <div className="flex items-center gap-2 text-gray-400">
                        {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /><span className="text-xs">{c.email}</span></span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{c.company || '—'}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {c.assignedTo ? (
                    <span className="text-gray-700">{c.assignedTo.name}</span>
                  ) : <span className="text-gray-400">Unassigned</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setModal(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(c._id, c.name)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <ContactModal contact={modal._id ? modal : undefined} onClose={() => setModal(null)} onSave={handleSave} team={team} />
      )}
    </div>
  )
}
