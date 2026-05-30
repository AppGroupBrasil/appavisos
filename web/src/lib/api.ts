import axios, { isAxiosError } from 'axios'

export const api = axios.create({ baseURL: '/' })

export function msgErro(err: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (isAxiosError(err)) return err.response?.data?.erro ?? err.response?.data?.message ?? fallback
  return fallback
}

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!location.pathname.startsWith('/login')) location.href = '/login'
    }
    return Promise.reject(err)
  }
)
