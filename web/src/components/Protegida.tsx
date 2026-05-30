import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function Protegida({ children, perfil }: { children: ReactNode; perfil?: string | string[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (perfil) {
    const perfis = Array.isArray(perfil) ? perfil : [perfil]
    if (!perfis.includes(user.perfil)) return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
