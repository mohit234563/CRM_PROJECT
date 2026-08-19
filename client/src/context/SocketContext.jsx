import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketCtx = createContext(null)

export function SocketProvider({ children }) {
  const { tenant } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!tenant) return
    const socket = io('/', { withCredentials: true })
    socket.emit('join-tenant', tenant._id)
    socketRef.current = socket
    return () => socket.disconnect()
  }, [tenant?._id])

  return <SocketCtx.Provider value={socketRef}>{children}</SocketCtx.Provider>
}

export const useSocket = () => useContext(SocketCtx)
