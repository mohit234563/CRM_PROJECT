import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user,   setUser]   = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      setTenant(data.tenant)
    } catch {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (localStorage.getItem('token')) fetchMe()
    else setLoading(false)
  }, [fetchMe])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    setTenant(data.tenant)
    return data
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    localStorage.setItem('token', data.token)
    setUser(data.user)
    setTenant(data.tenant)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setTenant(null)
    window.location.href = '/login'
  }

  const refreshTenant = async () => {
    const { data } = await api.get('/auth/me')
    setTenant(data.tenant)
  }

  const isOwner  = user?.role === 'owner'
  const isAdmin  = ['owner', 'admin'].includes(user?.role)
  const isPro    = tenant?.plan === 'pro' || (tenant?.subscriptionStatus === 'trialing' && new Date() < new Date(tenant?.trialEndsAt))

  return (
    <AuthCtx.Provider value={{ user, tenant, loading, login, register, logout, refreshTenant, isOwner, isAdmin, isPro }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
