import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../../components/ui'

type Cond = { id: string; nome: string; slug: string; emailContato: string | null; bloqueado: boolean; inadimplente: boolean; ultimoPagamentoEm: string | null; criadoEm: string; totalMoradores: number; totalAvisos: number }

export default function Master() {
  const { logout } = useAuth()
  const nav = useNavigate()
  const [lista, setLista] = useState<Cond[]>([])
  function carregar() { api.get('/api/master/condominios').then((r) => setLista(r.data)) }
  useEffect(() => { carregar() }, [])

  async function bloquear(c: Cond) {
    const motivo = c.bloqueado ? null : prompt('Motivo do bloqueio:')
    if (!c.bloqueado && !motivo) return
    await api.post(`/api/master/condominios/${c.id}/bloqueio`, { bloqueado: !c.bloqueado, motivo })
    carregar()
  }
  async function inadimplencia(c: Cond) {
    await api.post(`/api/master/condominios/${c.id}/inadimplencia`, { inadimplente: !c.inadimplente, ultimoPagamentoEm: c.inadimplente ? new Date().toISOString() : null })
    carregar()
  }
  async function excluir(c: Cond) {
    if (!confirm(`Excluir ${c.nome}? Isso apaga tudo.`)) return
    await api.delete(`/api/master/condominios/${c.id}`)
    carregar()
  }

  return (
    <div className="min-h-full max-w-6xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Master — Condomínios</h1>
        <button onClick={() => { logout(); nav('/login') }} className="text-sm text-slate-500">Sair</button>
      </header>
      <div className="space-y-3">
        {lista.map((c) => (
          <Card key={c.id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold truncate">{c.nome}</div>
                {c.bloqueado && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">Bloqueado</span>}
                {c.inadimplente && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">Inadimplente</span>}
              </div>
              <div className="text-xs text-slate-500 mt-1">/{c.slug} • {c.totalMoradores} moradores • {c.totalAvisos} avisos</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => inadimplencia(c)}>{c.inadimplente ? 'Marcar adimplente' : 'Marcar inadimplente'}</Button>
              <Button variant={c.bloqueado ? 'secondary' : 'danger'} onClick={() => bloquear(c)}>{c.bloqueado ? 'Desbloquear' : 'Bloquear'}</Button>
              <Button variant="ghost" onClick={() => excluir(c)}>Excluir</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
