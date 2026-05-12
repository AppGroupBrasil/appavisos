import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Input, Label, Textarea } from '../../components/ui'

type ItemLista = {
  id: string
  protocolo: string
  categoria: string
  titulo: string
  status: string
  nome?: string
  bloco?: string
  apartamento?: string
  area?: string
  criadoEm: string
  respondidoEm?: string
  temFotos: boolean
}

type Detalhe = {
  id: string
  protocolo: string
  categoria: string
  titulo: string
  descricao: string
  status: string
  nome?: string
  bloco?: string
  apartamento?: string
  telefone?: string
  email?: string
  area?: string
  criadoEm: string
  resposta?: string
  respondidoEm?: string
  respondidoPor?: string
  fotos: string[]
  historico: { status: string; autorNome: string; autorPerfil: string; observacao?: string; criadoEm: string }[]
  linkPublico: string
  linkPdf: string
}

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

const STATUS_LABEL: Record<string, { txt: string; cls: string }> = {
  Aberto: { txt: 'Aberto', cls: 'bg-amber-100 text-amber-900' },
  EmExecucao: { txt: 'Em execução', cls: 'bg-blue-600 text-white' },
  Finalizado: { txt: 'Finalizado', cls: 'bg-emerald-100 text-emerald-900' },
  Arquivado: { txt: 'Arquivado', cls: 'bg-slate-200 text-slate-800' },
}

const CAT_LABELS: Record<string, string> = {
  Ocorrencia: 'Ocorrência', Manutencao: 'Manutenção',
  Reclamacao: 'Reclamação', Sugestao: 'Sugestão', Outro: 'Outro',
}

const NOVO_CANAL = {
  nome: '', descricao: '', areaId: '', identificacaoObrigatoria: true, ativo: true,
} as { id?: string; nome: string; descricao: string; areaId: string; identificacaoObrigatoria: boolean; ativo: boolean }

export default function SolicitacoesMoradores() {
  const [params, setParams] = useSearchParams()
  const aba = (params.get('aba') === 'canais' ? 'canais' : 'solicitacoes') as 'solicitacoes' | 'canais'

  return (
    <ShellSindico>
      <h1 className="text-2xl font-bold mb-1 text-slate-900">Solicitações dos moradores</h1>
      <p className="text-sm text-slate-700 mb-4">Acompanhe os reportes recebidos e gerencie os canais (QR Codes) pelos quais os moradores enviam.</p>

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <button
          onClick={() => setParams({})}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${aba === 'solicitacoes' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-700 hover:text-slate-900'}`}>
          Solicitações
        </button>
        <button
          onClick={() => setParams({ aba: 'canais' })}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${aba === 'canais' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-700 hover:text-slate-900'}`}>
          Canais
        </button>
      </div>

      {aba === 'solicitacoes' ? <AbaSolicitacoes /> : <AbaCanais />}
    </ShellSindico>
  )
}

function AbaSolicitacoes() {
  const [lista, setLista] = useState<ItemLista[]>([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCat, setFiltroCat] = useState('')
  const [aberto, setAberto] = useState<Detalhe | null>(null)
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function carregar() {
    const p = new URLSearchParams()
    if (filtroStatus) p.set('status', filtroStatus)
    if (filtroCat) p.set('categoria', filtroCat)
    const r = await api.get(`/api/reportes?${p}`)
    setLista(r.data)
  }
  useEffect(() => { carregar() }, [filtroStatus, filtroCat])

  async function abrir(id: string) {
    const r = await api.get(`/api/reportes/${id}`)
    setAberto(r.data)
    setResposta(r.data.resposta ?? '')
  }

  async function responder() {
    if (!aberto || !resposta.trim()) return
    setEnviando(true)
    try {
      await api.post(`/api/reportes/${aberto.id}/responder`, { resposta })
      await carregar()
      await abrir(aberto.id)
    } finally { setEnviando(false) }
  }

  async function mudarStatus(status: string) {
    if (!aberto) return
    const obs = window.prompt(`Observação para "${STATUS_LABEL[status]?.txt}" (opcional):`, '')
    if (obs === null) return
    await api.post(`/api/reportes/${aberto.id}/status`, { status, observacao: obs || null })
    await carregar()
    await abrir(aberto.id)
  }

  const wppLink = (tel: string, texto: string) =>
    `https://wa.me/55${tel.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <div className="flex gap-2 text-sm">
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="px-2 py-1 border border-slate-300 rounded text-slate-900">
            <option value="">Todos status</option>
            <option value="Aberto">Aberto</option>
            <option value="EmExecucao">Em execução</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Arquivado">Arquivado</option>
          </select>
          <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} className="px-2 py-1 border border-slate-300 rounded text-slate-900">
            <option value="">Todas categorias</option>
            {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="text-center text-slate-700 py-12">Nenhuma solicitação ainda.</div>
      ) : (
        <div className="space-y-2">
          {lista.map(r => (
            <Card key={r.id} className="p-4 cursor-pointer hover:bg-slate-50" >
              <div onClick={() => abrir(r.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                        {CAT_LABELS[r.categoria] ?? r.categoria}
                      </span>
                      {STATUS_LABEL[r.status] && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_LABEL[r.status].cls}`}>{STATUS_LABEL[r.status].txt}</span>}
                      {r.temFotos && <span className="text-xs text-slate-700">📷</span>}
                      <span className="text-xs text-slate-600 font-mono">#{r.protocolo}</span>
                    </div>
                    <div className="font-medium text-slate-900">{r.titulo}</div>
                    <div className="text-xs text-slate-700 mt-1">
                      {r.area && <span>{r.area} · </span>}
                      {r.nome ? `${r.nome}${r.bloco ? ` · ${r.bloco}` : ''}${r.apartamento ? ` · Apto ${r.apartamento}` : ''}` : 'Anônimo'}
                      {' · '}{new Date(r.criadoEm).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {aberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAberto(null)}>
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 text-slate-900" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                  {CAT_LABELS[aberto.categoria]}
                </span>
                {aberto.area && <span className="ml-2 text-sm text-slate-700">{aberto.area}</span>}
              </div>
              <button onClick={() => setAberto(null)} className="text-2xl text-slate-600">×</button>
            </div>
            <h2 className="text-xl font-bold mb-1">{aberto.titulo}</h2>
            <div className="text-xs text-slate-700 mb-4">Protocolo <span className="font-mono font-semibold">{aberto.protocolo}</span> · {new Date(aberto.criadoEm).toLocaleString('pt-BR')}</div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4 whitespace-pre-wrap text-sm text-slate-900">{aberto.descricao}</div>

            {aberto.fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {aberto.fotos.map((f, i) => (
                  <a key={i} href={f} target="_blank" rel="noreferrer">
                    <img src={f} alt="" className="w-full h-28 object-cover rounded-lg border" />
                  </a>
                ))}
              </div>
            )}

            {(aberto.nome || aberto.apartamento) && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm">
                <div className="font-medium mb-1 text-slate-900">Identificação</div>
                {aberto.nome && <div className="text-slate-900">{aberto.nome}</div>}
                {(aberto.bloco || aberto.apartamento) && <div className="text-slate-700">{aberto.bloco}{aberto.bloco && aberto.apartamento ? ' · ' : ''}{aberto.apartamento && `Apto ${aberto.apartamento}`}</div>}
                {aberto.telefone && <div className="text-slate-700">Tel: {aberto.telefone}</div>}
                {aberto.email && <div className="text-slate-700">{aberto.email}</div>}
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_LABEL[aberto.status]?.cls}`}>{STATUS_LABEL[aberto.status]?.txt}</span>
                <span className="text-xs text-slate-700">Mudar para:</span>
                {aberto.status !== 'EmExecucao' && <button onClick={() => mudarStatus('EmExecucao')} className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Em execução</button>}
                {aberto.status !== 'Finalizado' && <button onClick={() => mudarStatus('Finalizado')} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700">Finalizado</button>}
                {aberto.status !== 'Arquivado' && <button onClick={() => mudarStatus('Arquivado')} className="text-xs px-2 py-1 rounded bg-slate-600 text-white hover:bg-slate-700">Arquivar</button>}
              </div>
              {aberto.historico?.length > 0 && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-slate-700">Histórico ({aberto.historico.length})</summary>
                  <ol className="mt-2 border-l-2 border-slate-200 pl-3 space-y-2">
                    {aberto.historico.map((h, i) => (
                      <li key={i} className="text-xs">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${STATUS_LABEL[h.status]?.cls}`}>{STATUS_LABEL[h.status]?.txt}</span>
                        <span className="ml-2 text-slate-700">{h.autorNome} ({h.autorPerfil}) — {new Date(h.criadoEm).toLocaleString('pt-BR')}</span>
                        {h.observacao && <div className="text-slate-800 mt-0.5">{h.observacao}</div>}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <a href={aberto.linkPdf} target="_blank" rel="noreferrer">
                <Button variant="secondary">PDF</Button>
              </a>
              <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(aberto.linkPublico); alert('Link copiado') }}>
                Copiar link público
              </Button>
              {aberto.telefone && aberto.resposta && (
                <a href={wppLink(aberto.telefone, `${aberto.titulo}\n\n${aberto.resposta}`)} target="_blank" rel="noreferrer">
                  <Button variant="whatsapp">Enviar no WhatsApp</Button>
                </a>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm font-medium mb-2 text-slate-900">{aberto.resposta ? 'Resposta enviada' : 'Responder'}</div>
              {aberto.resposta && aberto.respondidoEm && (
                <div className="text-xs text-slate-700 mb-2">
                  Por {aberto.respondidoPor} em {new Date(aberto.respondidoEm).toLocaleString('pt-BR')}
                  {aberto.email && ' · e-mail enviado automaticamente'}
                </div>
              )}
              <Textarea value={resposta} onChange={e => setResposta(e.target.value)} rows={4} placeholder="Sua resposta..." />
              <Button onClick={responder} disabled={enviando || !resposta.trim()} className="mt-2">
                {enviando ? 'Enviando...' : aberto.resposta ? 'Atualizar resposta' : 'Enviar resposta'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AbaCanais() {
  const [canais, setCanais] = useState<Canal[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [edit, setEdit] = useState<typeof NOVO_CANAL | null>(null)
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

  async function baixarQr(c: Canal) {
    const r = await api.get(`/api/qr/canal/${c.id}.png`, { responseType: 'blob' })
    const url = URL.createObjectURL(r.data)
    window.open(url, '_blank')
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2 gap-4">
        <p className="text-sm text-slate-700 max-w-2xl">
          Cada canal gera um QR Code próprio com sua configuração de identificação obrigatória ou opcional.
          Use canais separados para denúncia anônima, manutenção, reclamações, sugestões — cada um com a regra que fizer sentido.
        </p>
        <Button onClick={() => setEdit({ ...NOVO_CANAL })}>+ Novo canal</Button>
      </div>

      {canais.length === 0 ? (
        <Card className="p-8 text-center text-slate-700 text-sm mt-4">
          Nenhum canal criado. Clique em "+ Novo canal" para começar.
        </Card>
      ) : (
        <div className="space-y-3 mt-4">
          {canais.map(c => (
            <Card key={c.id} className={`p-4 ${!c.ativo ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-slate-900">{c.nome}</span>
                    {!c.ativo && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">Inativo</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.identificacaoObrigatoria ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                      {c.identificacaoObrigatoria ? 'Identificação obrigatória' : 'Anônimo permitido'}
                    </span>
                    {c.area && <span className="text-xs text-slate-700">· {c.area}</span>}
                  </div>
                  {c.descricao && <div className="text-sm text-slate-800 mb-1">{c.descricao}</div>}
                  <div className="text-xs text-slate-600 break-all">{origin}/c/.../reportar/{c.token}</div>
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
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 text-slate-900" onClick={e => e.stopPropagation()}>
            <div>
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
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900">
                    <option value="">— Nenhuma —</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={edit.identificacaoObrigatoria}
                    onChange={e => setEdit({ ...edit, identificacaoObrigatoria: e.target.checked })}
                    className="mt-1" />
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">Exigir identificação do morador</div>
                    <div className="text-slate-700">Quando marcado, nome e apartamento são obrigatórios.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={edit.ativo}
                    onChange={e => setEdit({ ...edit, ativo: e.target.checked })}
                    className="mt-1" />
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">Canal ativo</div>
                    <div className="text-slate-700">Desative para fazer o QR Code parar de aceitar novos envios sem excluí-lo.</div>
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
          </div>
        </div>
      )}
    </>
  )
}
