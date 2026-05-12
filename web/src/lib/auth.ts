import { create } from 'zustand'

export type User = { token: string; perfil: string; nome: string; condominioId: string }

type State = {
  user: User | null
  setUser: (u: User | null) => void
  logout: () => void
}

const stored = localStorage.getItem('user')
const token = localStorage.getItem('token')
const initial: User | null = stored && token ? { ...JSON.parse(stored), token } : null

export const useAuth = create<State>((set) => ({
  user: initial,
  setUser: (u) => {
    if (u) {
      localStorage.setItem('token', u.token)
      localStorage.setItem('user', JSON.stringify(u))
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    set({ user: u })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null })
  },
}))
