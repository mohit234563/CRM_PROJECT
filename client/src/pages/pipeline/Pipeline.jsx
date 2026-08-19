import { useState, useEffect, useCallback } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, X, GripVertical, IndianRupee, Calendar, User } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'

const PRIORITY_COLORS = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100 text-red-700'
}

function DealCard({ deal, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, active } = useSortable({ id: deal._id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: active?.id === deal._id && !isDragging ? 0.3 : 1 }

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white border rounded-xl p-3 shadow-sm group cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-xl rotate-1 scale-105' : 'hover:border-brand-300'} transition-all`}
      {...attributes} {...listeners}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-snug">{deal.title}</p>
        <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 shrink-0 mt-0.5" />
      </div>
      {deal.contactId && (
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <User className="w-3 h-3" />{deal.contactId.name}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {deal.value > 0 && (
            <span className="text-xs font-semibold text-green-700 flex items-center">
              <IndianRupee className="w-3 h-3" />{deal.value.toLocaleString()}
            </span>
          )}
        </div>
        <span className={`badge text-[10px] ${PRIORITY_COLORS[deal.priority]}`}>{deal.priority}</span>
      </div>
      {deal.closeDate && (
        <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(deal.closeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      )}
    </div>
  )
}

function Column({ stage, deals, onAddDeal }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const totalValue = deals.reduce((s, d) => s + (d.value || 0), 0)

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">{stage}</h3>
          <span className="badge bg-gray-100 text-gray-600">{deals.length}</span>
        </div>
        <div className="flex items-center gap-1">
          {totalValue > 0 && <span className="text-xs text-green-700 font-medium">₹{totalValue.toLocaleString()}</span>}
          <button onClick={() => onAddDeal(stage)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>
      <div ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-xl p-2 space-y-2 transition-colors ${isOver ? 'bg-brand-50 ring-2 ring-brand-300 ring-inset' : 'bg-gray-100/60'}`}
      >
        <SortableContext items={deals.map(d => d._id)} strategy={verticalListSortingStrategy}>
          {deals.map(deal => <DealCard key={deal._id} deal={deal} />)}
        </SortableContext>
        {deals.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400">Drop deals here</div>
        )}
      </div>
    </div>
  )
}

function DealModal({ stage, stages, contacts, team, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', value: '', stage, priority: 'medium', closeDate: '', contactId: '', assignedTo: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/deals', { ...form, value: Number(form.value) || 0 })
      onSave(data)
      toast.success('Deal created')
      onClose()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create deal') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">New deal</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handle} className="p-5 space-y-3">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={set('title')} required placeholder="e.g. Enterprise license renewal" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Value (₹)</label><input className="input" type="number" min="0" value={form.value} onChange={set('value')} placeholder="0" /></div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Stage</label>
              <select className="input" value={form.stage} onChange={set('stage')}>
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Close date</label><input className="input" type="date" value={form.closeDate} onChange={set('closeDate')} /></div>
          </div>
          <div>
            <label className="label">Contact</label>
            <select className="input" value={form.contactId} onChange={set('contactId')}>
              <option value="">None</option>
              {contacts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assigned to</label>
            <select className="input" value={form.assignedTo} onChange={set('assignedTo')}>
              <option value="">Unassigned</option>
              {team.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Creating…' : 'Create deal'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Pipeline() {
  const { tenant } = useAuth()
  const socketRef = useSocket()
  const [grouped, setGrouped]   = useState({})
  const [stages,  setStages]    = useState([])
  const [contacts, setContacts] = useState([])
  const [team,    setTeam]      = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeId, setActiveId] = useState(null)
  const [activeDeal, setActiveDeal] = useState(null)
  const [addModal, setAddModal] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/deals')
      setGrouped(data.grouped)
      setStages(data.stages)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  useEffect(() => {
    api.get('/contacts', { params: { limit: 100 } }).then(r => setContacts(r.data.contacts))
    api.get('/team').then(r => setTeam(r.data.members))
  }, [])

  // Real-time
  useEffect(() => {
    const s = socketRef?.current
    if (!s) return
    const onCreated = d => setGrouped(g => ({ ...g, [d.stage]: [d, ...(g[d.stage] || [])] }))
    const onUpdated = d => setGrouped(g => {
      const next = {}
      Object.keys(g).forEach(st => { next[st] = g[st].filter(x => x._id !== d._id) })
      next[d.stage] = [d, ...(next[d.stage] || [])]
      return next
    })
    const onDeleted = ({ _id }) => setGrouped(g => {
      const next = {}
      Object.keys(g).forEach(st => { next[st] = g[st].filter(x => x._id !== _id) })
      return next
    })
    s.on('deal:created', onCreated)
    s.on('deal:updated', onUpdated)
    s.on('deal:deleted', onDeleted)
    return () => { s.off('deal:created', onCreated); s.off('deal:updated', onUpdated); s.off('deal:deleted', onDeleted) }
  }, [socketRef?.current])

  const findDealById = id => {
    for (const stage of Object.keys(grouped)) {
      const deal = grouped[stage]?.find(d => d._id === id)
      if (deal) return { deal, stage }
    }
    return null
  }

  const onDragStart = ({ active }) => {
    setActiveId(active.id)
    const found = findDealById(active.id)
    if (found) setActiveDeal(found.deal)
  }

  const onDragEnd = async ({ active, over }) => {
    setActiveId(null)
    setActiveDeal(null)
    if (!over) return

    const { deal, stage: fromStage } = findDealById(active.id) || {}
    if (!deal) return

    // Find target stage — either column id or deal's stage
    let toStage = over.id
    if (!stages.includes(toStage)) {
      const found = findDealById(over.id)
      if (found) toStage = found.stage
    }

    if (fromStage === toStage) return

    // Optimistic update
    setGrouped(g => {
      const next = { ...g }
      next[fromStage] = g[fromStage].filter(d => d._id !== active.id)
      next[toStage]   = [{ ...deal, stage: toStage }, ...(g[toStage] || [])]
      return next
    })

    try {
      await api.patch(`/deals/${active.id}/stage`, { stage: toStage, order: 0 })
    } catch {
      toast.error('Failed to move deal')
      fetchDeals()
    }
  }

  const handleDealCreated = deal => {
    setGrouped(g => ({ ...g, [deal.stage]: [deal, ...(g[deal.stage] || [])] }))
  }

  if (loading) return (
    <div className="p-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => <div key={i} className="w-72 shrink-0 h-96 bg-gray-200 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {Object.values(grouped).flat().length} deals ·
            ₹{Object.values(grouped).flat().reduce((s, d) => s + (d.value || 0), 0).toLocaleString()} total value
          </p>
        </div>
        <button onClick={() => setAddModal(stages[0])} className="btn-primary">
          <Plus className="w-4 h-4" />New deal
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-4 pb-4 h-full">
            {stages.map(stage => (
              <Column key={stage} stage={stage} deals={grouped[stage] || []} onAddDeal={setAddModal} />
            ))}
          </div>
          <DragOverlay>
            {activeDeal && <DealCard deal={activeDeal} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {addModal && (
        <DealModal stage={addModal} stages={stages} contacts={contacts} team={team}
          onClose={() => setAddModal(null)} onSave={handleDealCreated} />
      )}
    </div>
  )
}
