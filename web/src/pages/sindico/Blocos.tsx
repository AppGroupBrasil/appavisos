import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Input, Label } from '../../components/ui'

type Bloco = { id: string; nome: string; ordem: number }

export default function Blocos() {
  const [lista, setLista] = useState<Bloco[]>([])
  const [tab, setTab] = useState<'manual' | 'gerar'>('manual')
  const [nome, setNome] = useState('')
  const [g, setG] = useState({ tipo: 'numero', quantidade: 10, prefixo: 'Bloco' })

  function carregar() { api.get('/api/blocos').then((r) => setLista(r.data)) }
  useEffect(() => { carregar() }, [])

  async function criar(e: React.FormEvent) { e.preventDefault(); await api.post('/api/blocos', { nome }); setNome(''); carregar() }
  async function gerar(e: React.FormEvent) { e.preventDefault(); await api.post('/api/blocos/gerar', g); carregar() }
  async function excluir(id: string) { if (!confirm('Excluir bloco?')) return; try { await api.delete(`/api/blocos/${id}`); carregar() } catch (err: any) { alert(err.response?.data?.erro ?? 'Erro') } }

  return (
    <ShellSindico>
      <h1 className="text-2xl font-bold mb-6">Blocos</h1>

      <Card className="p-5 mb-6">
        <div className="flex gap-2 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
          <button onClick={() => setTab('manual')} className={`px-4 py-2 rounded-md text-sm ${tab === 'manual' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600'}`}>Manual</button>
          <button onClick={() => setTab('gerar')} className={`px-4 py-2 rounded-md text-sm ${tab === 'gerar' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600'}`}>Gerar em sequência</button>
        </div>

        {tab === 'manual' ? (
          <form onSubmit={criar} className="flex gap-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Paraíba, A, 1…" required />
            <Button type="submit">Adicionar</Button>
          </form>
        ) : (
          <form onSubmit={gerar} className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <select value={g.tipo} onChange={(e) => setG({ ...g, tipo: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <option value="numero">Números (1, 2, 3…)</option>
                <option value="letra">Letras (A, B, C…)</option>
                <option value="prefixo">Prefixo + número (Bloco 1, Bloco 2…)</option>
              </select>
            </div>
            {g.tipo === 'prefixo' && (
              <div><Label>Prefixo</Label><Input value={g.prefixo} onChange={(e) => setG({ ...g, prefixo: e.target.value })} required /></div>
            )}
            <div><Label>Quantidade</Label><Input type="number" min={1} max={100} value={g.quantidade} onChange={(e) => setG({ ...g, quantidade: +e.target.value })} required /></div>
            <Button type="submit">Gerar</Button>
          </form>
        )}
      </Card>

      <div className="space-y-2">
        {lista.map((b) => (
          <Card key={b.id} className="p-4 flex items-center justify-between">
            <div className="font-medium">{b.nome}</div>
            <Button variant="ghost" onClick={() => excluir(b.id)}>Excluir</Button>
          </Card>
        ))}
      </div>
    </ShellSindico>
  )
}
