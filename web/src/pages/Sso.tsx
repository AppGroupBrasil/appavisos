import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

// Recebe ?token=<JWT da central>, troca por sessão local e entra direto.
export default function Sso() {
  const nav = useNavigate()
  const setUser = useAuth((s) => s.setUser)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) { setErro(true); return }
    ;(async () => {
      try {
        const { data } = await api.post('api/sso', { token })
        setUser({ token: data.token, perfil: data.perfil, nome: data.nome, condominioId: data.condominioId })
        const destino = data.perfil === 'Master' ? '/master' : data.perfil === 'Morador' ? '/feed' : '/painel'
        nav(destino, { replace: true })
      } catch {
        setErro(true)
      }
    })()
  }, [])

  if (erro) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
        <p>Não foi possível entrar pelo login único.</p>
        <button onClick={() => nav('/login')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>Ir para o login</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #eee', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}
