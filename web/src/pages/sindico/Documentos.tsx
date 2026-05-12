import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Input } from '../../components/ui'

type Aviso = {
  id: string
  titulo: string
  texto: string
  tipo: number
  anexoNome?: string | null
  anexoTamanho?: number | null
  categoriaNome?: string | null
  criadoEm: string
  publicadoEm?: string | null
}

export default function Documentos() {
  const [docs, setDocs] = useState<Aviso[]>([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    api.get('/api/avisos?tipo=5').then(r => setDocs(r.data))
  }, [])

  const lista = busca
    ? docs.filter(d => d.titulo.toLowerCase().includes(busca.toLowerCase()))
    : docs

  return (
    <ShellSindico>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Documentos</h1>
        <Link to="/painel/avisos/novo?tipo=5"><Button>+ Novo documento</Button></Link>
      </div>
      <p className="text-sm text-slate-700 mb-4">
        Documentos do condomínio (convenção, atas, regulamentos, contratos). Moradores acessam em
        <code className="px-1 mx-1 bg-slate-100 rounded">/c/&#123;slug&#125;/documentos</code> e baixam após informar PIN.
      </p>

      <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por título..." className="mb-4" />

      {lista.length === 0 ? (
        <Card className="p-8 text-center text-slate-700 text-sm">
          Nenhum documento. Clique em "+ Novo documento" para fazer o upload.
        </Card>
      ) : (
        <div className="space-y-2">
          {lista.map(d => (
            <Link key={d.id} to={`/painel/avisos/${d.id}`}>
              <Card className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {d.categoriaNome && <div className="text-xs text-slate-700 mb-1">{d.categoriaNome}</div>}
                    <div className="font-semibold">{d.titulo}</div>
                    {d.anexoNome && <div className="text-xs text-slate-600 mt-1">📎 {d.anexoNome}</div>}
                    <div className="text-xs text-slate-600 mt-1">
                      {new Date(d.publicadoEm ?? d.criadoEm).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </ShellSindico>
  )
}
