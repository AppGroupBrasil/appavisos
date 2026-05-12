import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card } from '../../components/ui'

type Aviso = { id: string; titulo: string; categoria: string; urgente: boolean; fixado: boolean; lidos: number; total: number; criadoEm: string; arquivadoEm: string | null }

export default function Avisos() {
  const [lista, setLista] = useState<Aviso[]>([])
  useEffect(() => { api.get('/api/avisos').then((r) => setLista(r.data)) }, [])
  return (
    <ShellSindico>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Avisos</h1>
        <Link to="/painel/avisos/novo"><Button>+ Novo aviso</Button></Link>
      </div>
      <div className="space-y-3">
        {lista.length === 0 && <div className="text-slate-700 text-sm">Nenhum aviso ainda.</div>}
        {lista.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {a.fixado && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">📌 fixado</span>}
                  {a.urgente && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">URGENTE</span>}
                </div>
                <Link to={`/painel/avisos/${a.id}`} className="font-medium hover:underline">{a.titulo}</Link>
                <div className="text-xs text-slate-700 mt-1">{new Date(a.criadoEm).toLocaleString('pt-BR')}</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-medium">{a.lidos}/{a.total}</div>
                <div className="text-xs text-slate-700">leram</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ShellSindico>
  )
}
