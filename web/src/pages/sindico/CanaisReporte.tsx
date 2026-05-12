import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Input, Label, Textarea } from '../../components/ui'

type Canal = {
  id: string
  nome: string
  descricao?: string | null
  identificacaoObrigatoria: boolean
  ativo: boolean
  token: string
  area?: string | null
  areaId?: string | null
}
type Area = { id: string; nome: string }

const NOVO: { id?: string; nome: string; descricao: string; areaId: string; identificacaoObrigatoria: boolean; ativo: boolean } = {
  nome: '', descricao: '', areaId: '', identificacaoObrigatoria: true, ativo: true,
}

export default function CanaisReporte() {
  const [canais, setCanais] = useState<Canal[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [edit, setEdit] = useState<typeof NOVO | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    carregar()
    api.get('/api/areas').then(r => setAreas(r.data))
  }, [])

  async function carregar() {
    const r = await api.get('/api/canais-reporte')
    setCanais(r.data)
  }

  async function salvar() {
    if (!edit) return
    setSalvando(true)
    try {
      const body = {
        nome: edit.nome,
        descricao: edit.descricao || null,
        areaId: edit.areaId || null,
        identificacaoObrigatoria: edit.identificacaoObrigatoria,
        ativo: edit.ativo,
      }
      if (edit.id) await api.put(`/api/canais-reporte/${edit.id}`, body)
      else await api.post('/api/canais-reporte', body)
      setEdit(null)
      await carregar()
    } finally { setSalvando(false) }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este canal? O QR Code deixará de funcionar.')) return
    await api.delete(`/api/canais-reporte/${id}`)
    await carregar()
  }

  function baixarQr(c: Canal) {
    window.open(`/api/qr/canal/${c.id}.png`, '_blank')
  }

  return (
    <ShellSindico>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Canais de reporte</h1>
        <Button onClick={() => setEdit({ ...NOVO })}>+ Novo canal</Button>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Cada canal gera um QR Code próprio com sua configuração de identificação obrigatória ou opcional.
        Use canais separados para denúncia anônima, manutenção, reclamações, sugestões — cada um com a regra que fizer sentido.
      </p>

      {canais.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 text-sm">
          Nenhum canal criado. Clique em "+ Novo canal" para começar.
        </Card>
      ) : (
        <div className="space-y-3">
          {canais.map(c => (
            <Card key={c.id} className={`p-4 ${!c.ativo ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold">{c.nome}</span>
                    {!c.ativo && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Inativo</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.identificacaoObrigatoria ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {c.identificacaoObrigatoria ? 'Identificação obrigatória' : 'Anônimo permitido'}
                    </span>
                    {c.area && <span className="text-xs text-slate-500">· {c.area}</span>}
                  </div>
                  {c.descricao && <div className="text-sm text-slate-600 mb-1">{c.descricao}</div>}
                  <div className="text-xs text-slate-400 break-all">{origin}/c/.../reportar/{c.token}</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" onClick={() => baixarQr(c)}>QR Code</Button>
                  <Button variant="secondary" onClick={() => setEdit({
                    id: c.id, nome: c.nome, descricao: c.descricao ?? '',
                    areaId: c.areaId ?? '', identificacaoObrigatoria: c.identificacaoObrigatoria, ativo: c.ativo
                  })}>Editar</Button>
                  <Button variant="danger" onClick={() => excluir(c.id)}>Excluir</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEdit(null)}>
          <Card className="max-w-lg w-full p-6" onClick={() => {}}>
            <div onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">{edit.id ? 'Editar canal' : 'Novo canal'}</h2>
              <div className="space-y-4">
                <div>
                  <Label>Nome do canal *</Label>
                  <Input value={edit.nome} onChange={e => setEdit({ ...edit, nome: e.target.value })}
                    placeholder='Ex: "Denúncia anônima", "Manutenção"' maxLength={120} />
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea rows={2} value={edit.descricao} onChange={e => setEdit({ ...edit, descricao: e.target.value })}
                    placeholder="Texto que aparece para o morador no topo do formulário" />
                </div>
                <div>
                  <Label>Área (opcional)</Label>
                  <select value={edit.areaId} onChange={e => setEdit({ ...edit, areaId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white">
                    <option value="">— Nenhuma —</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={edit.identificacaoObrigatoria}
                    onChange={e => setEdit({ ...edit, identificacaoObrigatoria: e.target.checked })}
                    className="mt-1" />
                  <div className="text-sm">
                    <div className="font-medium">Exigir identificação do morador</div>
                    <div className="text-slate-500">Quando marcado, nome e apartamento são obrigatórios.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={edit.ativo}
                    onChange={e => setEdit({ ...edit, ativo: e.target.checked })}
                    className="mt-1" />
                  <div className="text-sm">
                    <div className="font-medium">Canal ativo</div>
                    <div className="text-slate-500">Desative para fazer o QR Code parar de aceitar novos envios sem excluí-lo.</div>
                  </div>
                </label>
              </div>
              <div className="flex gap-2 mt-6 justify-end">
                <Button variant="secondary" onClick={() => setEdit(null)}>Cancelar</Button>
                <Button onClick={salvar} disabled={salvando || !edit.nome.trim()}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </ShellSindico>
  )
}
