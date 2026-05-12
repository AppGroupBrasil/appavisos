import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Input, Label } from '../../components/ui'

type Bloco = { id: string; nome: string }
type Morador = { id: string; nome: string; email: string; telefone?: string; apartamento?: string; blocoId?: string; status: number }

export default function Moradores() {
  const [lista, setLista] = useState<Morador[]>([])
  const [blocos, setBlocos] = useState<Bloco[]>([])
  const [filtro, setFiltro] = useState<'todos' | 'pendente' | 'ativo' | 'inativo'>('todos')
  const [novo, setNovo] = useState(false)
  const [f, setF] = useState({ nome: '', email: '', telefone: '', blocoId: '', apartamento: '' })

  function carregar() {
    const p = filtro === 'todos' ? '' : `?status=${filtro}`
    api.get('/api/moradores' + p).then((r) => setLista(r.data))
  }
  useEffect(() => { carregar() }, [filtro])
  useEffect(() => { api.get('/api/blocos').then((r) => setBlocos(r.data)) }, [])

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    await api.post('/api/moradores', { ...f, blocoId: f.blocoId || null })
    setNovo(false); setF({ nome: '', email: '', telefone: '', blocoId: '', apartamento: '' }); carregar()
  }
  async function aprovar(id: string) { await api.post(`/api/moradores/${id}/aprovar`); carregar() }
  async function inativar(id: string) { if (!confirm('Inativar morador?')) return; await api.post(`/api/moradores/${id}/inativar`); carregar() }
  async function importarExcel(file: File) {
    const fd = new FormData(); fd.append('file', file)
    const { data } = await api.post('/api/importacao/moradores/preview', fd)
    if (!confirm(`${data.validos} de ${data.total} válidos. Importar?`)) return
    await api.post('/api/importacao/moradores/confirmar', { linhas: data.linhas })
    carregar()
  }

  return (
    <ShellSindico>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Moradores</h1>
        <div className="flex gap-2">
          <a href="/api/importacao/moradores/modelo.xlsx" className="text-sm text-slate-700 hover:text-slate-700 self-center">Baixar modelo</a>
          <label className="cursor-pointer">
            <input type="file" accept=".xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && importarExcel(e.target.files[0])} />
            <span className="inline-block px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-medium">Importar Excel</span>
          </label>
          <Button onClick={() => setNovo(!novo)}>+ Novo</Button>
        </div>
      </div>

      {novo && (
        <Card className="p-5 mb-4">
          <form onSubmit={criar} className="grid grid-cols-2 gap-4">
            <div><Label>Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required /></div>
            <div><Label>E-mail</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
            <div><Label>Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
            <div><Label>Apartamento</Label><Input value={f.apartamento} onChange={(e) => setF({ ...f, apartamento: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>Bloco</Label>
              <select value={f.blocoId} onChange={(e) => setF({ ...f, blocoId: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <option value="">—</option>
                {blocos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex gap-2"><Button type="submit">Salvar</Button><Button type="button" variant="ghost" onClick={() => setNovo(false)}>Cancelar</Button></div>
          </form>
        </Card>
      )}

      <div className="flex gap-2 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {(['todos', 'pendente', 'ativo', 'inativo'] as const).map((s) => (
          <button key={s} onClick={() => setFiltro(s)} className={`px-4 py-2 rounded-md text-sm capitalize ${filtro === s ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-2">
        {[...lista].sort((a, b) => (a.status === 1 ? -1 : 0) - (b.status === 1 ? -1 : 0)).map((m) => (
          <div key={m.id} className={`p-4 flex items-center justify-between rounded-xl border ${m.status === 1 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
            <div>
              <div className="font-medium">{m.nome} {m.status === 1 && <span className="text-xs px-2 py-0.5 rounded bg-amber-200 text-amber-800 ml-2 font-semibold">Aguardando aprovação</span>}</div>
              <div className="text-xs text-slate-700">{m.email} {m.telefone && `• ${m.telefone}`} {m.apartamento && `• Apto ${m.apartamento}`}</div>
            </div>
            <div className="flex gap-2">
              {m.status === 1 && <Button onClick={() => aprovar(m.id)}>Aprovar</Button>}
              {m.status !== 3 && <Button variant="ghost" onClick={() => inativar(m.id)}>Inativar</Button>}
            </div>
          </div>
        ))}
      </div>
    </ShellSindico>
  )
}
