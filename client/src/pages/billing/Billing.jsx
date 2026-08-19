import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Zap, ArrowUpRight, AlertCircle } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useSearchParams } from 'react-router-dom'

const FREE_FEATURES  = ['Up to 3 team members', '500 contacts', 'Basic pipeline', 'Email support']
const PRO_FEATURES   = ['Unlimited team members', 'Unlimited contacts', 'Advanced pipeline', 'Reports & analytics', 'Priority support', 'Custom pipeline stages', 'API access']

export default function Billing() {
  const { tenant, isOwner, refreshTenant } = useAuth()
  const [billing, setBilling]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [params]  = useSearchParams()

  useEffect(() => {
    if (params.get('success') === 'true') {
      toast.success('🎉 Welcome to Pro! Your plan has been upgraded.')
      refreshTenant()
    }
  }, [])

  useEffect(() => {
    api.get('/billing/status').then(r => setBilling(r.data)).finally(() => setLoading(false))
  }, [])

  const upgrade = async () => {
    setUpgrading(true)
    try {
      const { data } = await api.post('/billing/create-checkout')
      window.location.href = data.url
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to open checkout')
      setUpgrading(false)
    }
  }

  const openPortal = async () => {
    try {
      const { data } = await api.post('/billing/portal')
      window.location.href = data.url
    } catch (err) { toast.error('Failed to open billing portal') }
  }

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 gap-4">
        {[1,2].map(i => <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  const isPro = billing?.plan === 'pro'
  const inTrial = billing?.inTrial && !isPro
  const trialDays = inTrial ? Math.max(0, Math.ceil((new Date(billing.trialEndsAt) - new Date()) / 86400000)) : 0

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing & plan</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your subscription and billing details.</p>
      </div>

      {/* Current status */}
      <div className="card mb-6 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPro ? 'bg-brand-100' : 'bg-gray-100'}`}>
          {isPro ? <Zap className="w-6 h-6 text-brand-600" /> : <CreditCard className="w-6 h-6 text-gray-500" />}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">
            {isPro ? 'Pro plan' : 'Free plan'}
            {inTrial && <span className="ml-2 badge bg-amber-100 text-amber-700">{trialDays} days left in trial</span>}
          </p>
          <p className="text-sm text-gray-500">
            {isPro
              ? `Active subscription · ${billing.subscriptionStatus}`
              : inTrial
              ? 'You\'re on a Pro trial — upgrade to keep access after the trial ends.'
              : 'Upgrade to unlock reports, unlimited contacts, and more.'}
          </p>
        </div>
        {isPro && isOwner && (
          <button onClick={openPortal} className="btn-secondary">
            Manage subscription <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {billing?.subscriptionStatus === 'past_due' && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Payment failed</p>
            <p className="text-sm text-red-600">Please update your payment method to keep access.</p>
          </div>
          <button onClick={openPortal} className="btn-danger ml-auto">Fix now</button>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Free */}
        <div className={`card border-2 ${!isPro ? 'border-gray-300' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Free</h3>
            {!isPro && <span className="badge bg-gray-100 text-gray-600">Current plan</span>}
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">₹0 <span className="text-base font-normal text-gray-500">/ mo</span></p>
          <p className="text-sm text-gray-500 mb-5">For individuals and small teams just getting started.</p>
          <ul className="space-y-2">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-gray-400 shrink-0" />{f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className={`card border-2 relative overflow-hidden ${isPro ? 'border-brand-400' : 'border-brand-200'}`}>
          <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
            POPULAR
          </div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Pro</h3>
            {isPro && <span className="badge bg-brand-100 text-brand-700">Current plan</span>}
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">₹1,499 <span className="text-base font-normal text-gray-500">/ mo</span></p>
          <p className="text-sm text-gray-500 mb-5">Everything in Free, plus advanced features for growing teams.</p>
          <ul className="space-y-2 mb-5">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-brand-500 shrink-0" />{f}
              </li>
            ))}
          </ul>
          {!isPro && isOwner && (
            <button onClick={upgrade} disabled={upgrading} className="btn-primary w-full justify-center">
              <Zap className="w-4 h-4" />
              {upgrading ? 'Opening checkout…' : 'Upgrade to Pro'}
            </button>
          )}
          {!isPro && !isOwner && (
            <p className="text-xs text-gray-400 text-center">Ask your workspace owner to upgrade.</p>
          )}
        </div>
      </div>
    </div>
  )
}
