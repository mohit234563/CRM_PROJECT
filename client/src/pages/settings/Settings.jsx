import { useState, useEffect } from 'react'
import { Building2, User, Plus, X, GripVertical, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

function SectionCard({ icon: Icon, title, desc, children }) {
  return (
    <div className="card mb-4">
      <div className="flex items-center gap-2.5 mb-1">
        <Icon className="w-4 h-4 text-gray-500" />
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {desc && <p className="text-sm text-gray-500 mb-4">{desc}</p>}
      {children}
    </div>
  )
}

export default function Settings() {
  const { user, tenant, isAdmin, isOwner, refreshTenant } = useAuth()
  const [companyName, setCompanyName] = useState(tenant?.name || '')
  const [stages, setStages] = useState(tenant?.pipelineStages || [])
  const [newStage, setNewStage] = useState('')
  const [profile, setProfile] = useState({ name: user?.name || '' })
  const [savingCompany, setSavingCompany] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    setCompanyName(tenant?.name || '')
    setStages(tenant?.pipelineStages || [])
  }, [tenant])

  const saveCompany = async () => {
    setSavingCompany(true)
    try {
      await api.patch('/settings', { name: companyName, pipelineStages: stages })
      await refreshTenant()
      toast.success('Workspace settings updated')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update') }
    finally { setSavingCompany(false) }
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      await api.patch('/settings/profile', profile)
      toast.success('Profile updated')
    } catch (err) { toast.error('Failed to update profile') }
    finally { setSavingProfile(false) }
  }

  const addStage = () => {
    if (!newStage.trim()) return
    if (stages.includes(newStage.trim())) return toast.error('Stage already exists')
    setStages(s => [...s, newStage.trim()])
    setNewStage('')
  }

  const removeStage = (stage) => {
    if (stages.length <= 2) return toast.error('You need at least 2 stages')
    setStages(s => s.filter(x => x !== stage))
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your workspace and profile.</p>
      </div>

      {/* Profile */}
      <SectionCard icon={User} title="Your profile">
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-50" value={user?.email} disabled />
          </div>
          <button onClick={saveProfile} disabled={savingProfile} className="btn-primary">
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </SectionCard>

      {/* Workspace */}
      <SectionCard icon={Building2} title="Workspace" desc={!isAdmin ? 'Only admins can change workspace settings.' : undefined}>
        <div className="space-y-4">
          <div>
            <label className="label">Company name</label>
            <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={!isAdmin} />
          </div>

          <div>
            <label className="label">Pipeline stages</label>
            <p className="text-xs text-gray-400 mb-2">Customize the columns on your sales pipeline board.</p>
            <div className="space-y-1.5">
              {stages.map((stage, i) => (
                <div key={stage} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                  <span className="text-sm flex-1">{stage}</span>
                  {isAdmin && (
                    <button onClick={() => removeStage(stage)} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-600 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isAdmin && (
              <div className="flex gap-2 mt-2">
                <input className="input" placeholder="New stage name" value={newStage}
                  onChange={e => setNewStage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStage())} />
                <button onClick={addStage} className="btn-secondary"><Plus className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          {isAdmin && (
            <button onClick={saveCompany} disabled={savingCompany} className="btn-primary">
              {savingCompany ? 'Saving…' : 'Save workspace settings'}
            </button>
          )}
        </div>
      </SectionCard>

      {/* Danger zone */}
      {isOwner && (
        <div className="card border-red-200">
          <div className="flex items-center gap-2.5 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-red-700">Danger zone</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">These actions are permanent and cannot be undone.</p>
          <button
            onClick={() => toast.error('Workspace deletion requires contacting support — this protects against accidental data loss.')}
            className="btn-danger"
          >
            Delete workspace
          </button>
        </div>
      )}
    </div>
  )
}
