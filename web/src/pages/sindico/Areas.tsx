import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Input } from '../../components/ui'

type Area = { id: string; nome: string; slug: string; ordem: number }

export default function Areas() {
  const [lista, setLista] = useState<Area[]>([])
  const [nome, setNome] = useState('')
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null)

  function carregar() { api.get('/api/areas').then((r) => setLista(r.data)) }
  useEffect(() => { carregar() }, [])

  async function criar(e: React.FormEvent) { e.preventDefault(); await api.post('/api/areas', { nome }); setNome(''); carregar() }
  async function salvarEdicao() { if (!editando) return; await api.put(`/api/areas/${editando.id}`, { nome: editando.nome }); setEditando(null); carregar() }
  async function excluir(id: string) { if (!confirm('Excluir área?')) return; try { await api.delete(`/api/areas/${id}`); carregar() } catch (err: any) { alert(err.response?.data?.erro ?? 'Erro') } }

  return (
    <ShellSindico>
      <h1 className="text-2xl font-bold mb-2">Áreas</h1>
      <p className="text-sm text-slate-700 mb-6">Espaços comuns do condomínio (salão de festas, academia, piscina, etc.). Cada área tem seu próprio QR Code para avisos específicos.</p>

      <Card className="p-5 mb-6">
        <form onSubmit={criar} className="flex gap-2">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Salão de Festas, Academia, Piscina" required />
          <Button type="submit">Adicionar</Button>
        </form>
      </Card>

      <div className="space-y-2">
        {lista.map((a) => (
          <Card key={a.id} className="p-4 flex items-center justify-between gap-2">
            {editando?.id === a.id ? (
              <>
                <Input value={editando.nome} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} className="flex-1" />
                <Button onClick={salvarEdicao}>Salvar</Button>
                <Button variant="ghost" onClick={() => setEditando(null)}>✕</Button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <div className="font-medium">{a.nome}</div>
                  <div className="text-xs text-slate-700">/{a.slug}</div>
                </div>
                <Button variant="ghost" onClick={() => setEditando({ id: a.id, nome: a.nome })}>Editar</Button>
                <Button variant="ghost" onClick={() => excluir(a.id)}>Excluir</Button>
              </>
            )}
          </Card>
        ))}
      </div>
    </ShellSindico>
  )
}
