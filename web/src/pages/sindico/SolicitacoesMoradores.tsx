import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { comprimirImagem } from '../../lib/imagem'
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
  temVideo?: boolean
}

type Mensagem = {
  id: string
  autorNome: string
  autorPerfil: string
  texto: string
  fotos: string[]
  criadoEm: string
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
  video?: string | null
  historico: { status: string; autorNome: string; autorPerfil: string; observacao?: string; criadoEm: string }[]
  mensagens: Mensagem[]
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
  EmAnalise: { txt: 'Em análise', cls: 'bg-violet-600 text-white' },
  EmExecucao: { txt: 'Em execução', cls: 'bg-blue-600 text-white' },
  Finalizado: { txt: 'Finalizado', cls: 'bg-emerald-100 text-emerald-900' },
  Arquivado: { txt: 'Arquivado', cls: 'bg-slate-200 text-slate-800' },
}

const CAT_LABELS: Record<string, string> = {
  Ocorrencia: 'Ocorrência', Manutencao: 'Manutenção', Solicitacao: 'Solicitação',
  Reclamacao: 'Reclamação', SegundaViaBoleto: '2ª via de boleto', Informacao: 'Informação',
  Sugestao: 'Sugestão', Outro: 'Outro',
}

const NOVO_CANAL = {
  nome: '', descricao: '', areaId: '', identificacaoObrigatoria: true, ativo: true,
} as { id?: string; nome: string; descricao: string; areaId: string; identificacaoObrigatoria: boolean; ativo: boolean }

export default function SolicitacoesMoradores() {
  const [params, setParams] = useSearchParams()
  const abaParam = params.get('aba')
  const aba = (abaParam === 'canais' || abaParam === 'relatorios' ? abaParam : 'solicitacoes') as 'solicitacoes' | 'canais' | 'relatorios'

  return (
    <ShellSindico>
      <h1 className="text-2xl font-bold mb-1 text-slate-900">Solicitações dos moradores</h1>
      <p className="text-sm text-slate-700 mb-4">Acompanhe as solicitações recebidas e gerencie os canais (QR Codes) pelos quais os moradores enviam.</p>

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <button
          onClick={() => setParams({})}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${aba === 'solicitacoes' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-700 hover:text-slate-900'}`}>
          Solicitações
        </button>
        <button
          onClick={() => setParams({ aba: 'canais' })}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${aba === 'canais' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-700 hover:text-slate-900'}`}>
          Canais de Solicitações
        </button>
        <button
          onClick={() => setParams({ aba: 'relatorios' })}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${aba === 'relatorios' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-700 hover:text-slate-900'}`}>
          Relatórios
        </button>
      </div>

      {aba === 'solicitacoes' ? <AbaSolicitacoes /> : aba === 'canais' ? <AbaCanais /> : <AbaRelatorios />}
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
  const [msgTexto, setMsgTexto] = useState('')
  const [msgFotos, setMsgFotos] = useState<string[]>([])
  const [enviandoMsg, setEnviandoMsg] = useState(false)
  const msgFileRef = useRef<HTMLInputElement>(null)

  const carregar = useCallback(async () => {
    const p = new URLSearchParams()
    if (filtroStatus) p.set('status', filtroStatus)
    if (filtroCat) p.set('categoria', filtroCat)
    const r = await api.get(`/api/reportes?${p}`)
    setLista(r.data)
  }, [filtroStatus, filtroCat])
  useEffect(() => { carregar() }, [carregar])

  async function abrir(id: string) {
    const r = await api.get(`/api/reportes/${id}`)
    setAberto(r.data)
    setResposta(r.data.resposta ?? '')
    setMsgTexto('')
    setMsgFotos([])
  }

  async function enviarMsg() {
    if (!aberto || (!msgTexto.trim() && msgFotos.length === 0)) return
    setEnviandoMsg(true)
    try {
      const r = await api.post(`/api/reportes/${aberto.id}/mensagens`, { texto: msgTexto, fotos: msgFotos })
      setAberto(a => a ? { ...a, mensagens: r.data } : a)
      setMsgTexto('')
      setMsgFotos([])
    } finally { setEnviandoMsg(false) }
  }

  async function anexarFotoMsg(files: FileList | null) {
    if (!aberto || !files) return
    let qtd = msgFotos.length
    for (const f of Array.from(files)) {
      if (qtd >= 3) break
      try {
        const blob = await comprimirImagem(f)
        const fd = new FormData()
        fd.append('file', blob, 'foto.jpg')
        const r = await api.post(`/api/reportes/${aberto.id}/mensagens/foto`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        setMsgFotos(p => [...p, r.data.url])
        qtd++
      } catch { break }
    }
    if (msgFileRef.current) msgFileRef.current.value = ''
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
            <option value="EmAnalise">Em análise</option>
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
                      {r.temVideo && <span className="text-xs text-slate-700">🎥</span>}
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

            {aberto.video && (
              <video src={aberto.video} controls playsInline className="w-full max-h-80 rounded-lg bg-black mb-4" />
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
                {aberto.status !== 'EmAnalise' && <button onClick={() => mudarStatus('EmAnalise')} className="text-xs px-2 py-1 rounded bg-violet-600 text-white hover:bg-violet-700">Em análise</button>}
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

            <div className="pt-4 border-t mt-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="text-sm font-medium text-slate-900">Chat com o morador</div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-slate-600">Status:</span>
                  {['Aberto', 'EmAnalise', 'EmExecucao', 'Finalizado'].filter(s => s !== aberto.status).map(s => (
                    <button key={s} onClick={() => mudarStatus(s)}
                      className="text-xs px-2 py-1 rounded bg-slate-900 text-white hover:bg-slate-700">
                      {STATUS_LABEL[s].txt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 max-h-80 overflow-y-auto space-y-2">
                {(!aberto.mensagens || aberto.mensagens.length === 0) && (
                  <div className="text-xs text-slate-600">Nenhuma mensagem ainda.</div>
                )}
                {aberto.mensagens?.map(m => (
                  <div key={m.id} className={`p-2.5 rounded-lg text-sm max-w-[85%] ${m.autorPerfil === 'Morador' ? 'bg-white border border-slate-200' : 'bg-blue-100 ml-auto'}`}>
                    <div className="text-[11px] font-semibold text-slate-600">{m.autorNome} · {m.autorPerfil}</div>
                    {m.texto && <div className="whitespace-pre-wrap text-slate-900 mt-0.5">{m.texto}</div>}
                    {m.fotos?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {m.fotos.map((f, i) => (
                          <a key={i} href={f} target="_blank" rel="noreferrer">
                            <img src={f} alt="" className="w-16 h-16 object-cover rounded border" />
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 mt-1">{new Date(m.criadoEm).toLocaleString('pt-BR')}</div>
                  </div>
                ))}
              </div>
              {msgFotos.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {msgFotos.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={f} alt="" className="w-14 h-14 object-cover rounded border" />
                      <button onClick={() => setMsgFotos(p => p.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-xs w-5 h-5 rounded-full leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2">
                <Textarea value={msgTexto} onChange={e => setMsgTexto(e.target.value)} rows={2} placeholder="Mensagem para o morador..." />
              </div>
              <div className="flex gap-2 mt-2">
                <input ref={msgFileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => anexarFotoMsg(e.target.files)} />
                <Button variant="secondary" onClick={() => msgFileRef.current?.click()}>Anexar foto</Button>
                <Button onClick={enviarMsg} disabled={enviandoMsg || (!msgTexto.trim() && msgFotos.length === 0)}>
                  {enviandoMsg ? 'Enviando...' : 'Enviar mensagem'}
                </Button>
              </div>
              {aberto.email
                ? <div className="text-[11px] text-slate-500 mt-1">O morador recebe um e-mail a cada mensagem enviada.</div>
                : <div className="text-[11px] text-slate-500 mt-1">O morador acompanha o chat pelo link público do protocolo.</div>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

type RelLinha = {
  protocolo: string
  categoria: string
  titulo: string
  status: string
  nome?: string
  bloco?: string
  apartamento?: string
  area?: string
  abertoEm: string
  emAnaliseEm?: string
  emAnalisePor?: string
  emExecucaoEm?: string
  emExecucaoPor?: string
  finalizadoEm?: string
  finalizadoPor?: string
  minAbertoParaAnalise?: number
  minAnaliseParaExecucao?: number
  minAbertoParaFinalizado?: number
}

type Relatorio = {
  total: number
  porStatus: Record<string, number>
  porCategoria: Record<string, number>
  porBloco: Record<string, number>
  tempoMedioMin: { abertoParaAnalise?: number; analiseParaExecucao?: number; abertoParaFinalizado?: number }
  linhas: RelLinha[]
}

function fmtMin(min?: number | null) {
  if (min == null) return '—'
  const m = Math.round(min)
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60
  return [d ? `${d}d` : '', h ? `${h}h` : '', `${mm}min`].filter(Boolean).join(' ')
}

function AbaRelatorios() {
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [cat, setCat] = useState('')
  const [st, setSt] = useState('')
  const [bloco, setBloco] = useState('')
  const [rel, setRel] = useState<Relatorio | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function gerar() {
    setCarregando(true)
    try {
      const p = new URLSearchParams()
      if (de) p.set('de', de)
      if (ate) p.set('ate', ate)
      if (cat) p.set('categoria', cat)
      if (st) p.set('status', st)
      if (bloco.trim()) p.set('bloco', bloco.trim())
      const r = await api.get(`/api/reportes/relatorio?${p}`)
      setRel(r.data)
    } finally { setCarregando(false) }
  }

  useEffect(() => { gerar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function exportarCsv() {
    if (!rel) return
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const dt = (v?: string) => v ? new Date(v).toLocaleString('pt-BR') : ''
    const cab = ['Protocolo', 'Categoria', 'Título', 'Status', 'Nome', 'Bloco', 'Apto', 'Área',
      'Aberto em', 'Em análise em', 'Em análise por', 'Em execução em', 'Em execução por',
      'Finalizado em', 'Finalizado por', 'Tempo até análise', 'Tempo análise→execução', 'Tempo até finalizado']
    const linhas = rel.linhas.map(l => [
      l.protocolo, CAT_LABELS[l.categoria] ?? l.categoria, l.titulo, STATUS_LABEL[l.status]?.txt ?? l.status,
      l.nome, l.bloco, l.apartamento, l.area,
      dt(l.abertoEm), dt(l.emAnaliseEm), l.emAnalisePor, dt(l.emExecucaoEm), l.emExecucaoPor,
      dt(l.finalizadoEm), l.finalizadoPor,
      l.minAbertoParaAnalise != null ? fmtMin(l.minAbertoParaAnalise) : '',
      l.minAnaliseParaExecucao != null ? fmtMin(l.minAnaliseParaExecucao) : '',
      l.minAbertoParaFinalizado != null ? fmtMin(l.minAbertoParaFinalizado) : '',
    ].map(esc).join(';'))
    const csv = '\uFEFF' + [cab.map(esc).join(';'), ...linhas].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `relatorio-solicitacoes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <Label>De</Label>
            <Input type="date" value={de} onChange={e => setDe(e.target.value)} />
          </div>
          <div>
            <Label>Até</Label>
            <Input type="date" value={ate} onChange={e => setAte(e.target.value)} />
          </div>
          <div>
            <Label>Categoria</Label>
            <select value={cat} onChange={e => setCat(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900">
              <option value="">Todas</option>
              {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select value={st} onChange={e => setSt(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900">
              <option value="">Todos</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l.txt}</option>)}
            </select>
          </div>
          <div>
            <Label>Bloco</Label>
            <Input value={bloco} onChange={e => setBloco(e.target.value)} placeholder="Todos" maxLength={80} />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={gerar} disabled={carregando}>{carregando ? 'Gerando...' : 'Gerar relatório'}</Button>
          <Button variant="secondary" onClick={exportarCsv} disabled={!rel || rel.linhas.length === 0}>Exportar CSV</Button>
        </div>
      </Card>

      {rel && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="p-4">
              <div className="text-xs text-slate-600 uppercase tracking-wider">Total</div>
              <div className="text-2xl font-bold text-slate-900">{rel.total}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-600 uppercase tracking-wider">Tempo médio até análise</div>
              <div className="text-lg font-bold text-slate-900">{fmtMin(rel.tempoMedioMin.abertoParaAnalise)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-600 uppercase tracking-wider">Análise → execução</div>
              <div className="text-lg font-bold text-slate-900">{fmtMin(rel.tempoMedioMin.analiseParaExecucao)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-600 uppercase tracking-wider">Tempo médio até finalizado</div>
              <div className="text-lg font-bold text-slate-900">{fmtMin(rel.tempoMedioMin.abertoParaFinalizado)}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Card className="p-4">
              <div className="text-sm font-medium mb-2 text-slate-900">Por status</div>
              {Object.entries(rel.porStatus).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-0.5">
                  <span className="text-slate-700">{STATUS_LABEL[k]?.txt ?? k}</span>
                  <span className="font-semibold text-slate-900">{v}</span>
                </div>
              ))}
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium mb-2 text-slate-900">Por categoria</div>
              {Object.entries(rel.porCategoria).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-0.5">
                  <span className="text-slate-700">{CAT_LABELS[k] ?? k}</span>
                  <span className="font-semibold text-slate-900">{v}</span>
                </div>
              ))}
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium mb-2 text-slate-900">Por bloco</div>
              {Object.keys(rel.porBloco).length === 0
                ? <div className="text-sm text-slate-600">Sem informação de bloco.</div>
                : Object.entries(rel.porBloco).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm py-0.5">
                    <span className="text-slate-700">{k}</span>
                    <span className="font-semibold text-slate-900">{v}</span>
                  </div>
                ))}
            </Card>
          </div>

          {rel.linhas.length === 0 ? (
            <div className="text-center text-slate-700 py-12">Nenhum registro no período.</div>
          ) : (
            <Card className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-600 uppercase">
                    <th className="px-3 py-2">Protocolo</th>
                    <th className="px-3 py-2">Categoria</th>
                    <th className="px-3 py-2">Título</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Morador</th>
                    <th className="px-3 py-2">Bloco/Apto</th>
                    <th className="px-3 py-2">Aberto em</th>
                    <th className="px-3 py-2">Até análise</th>
                    <th className="px-3 py-2">Até finalizado</th>
                    <th className="px-3 py-2">Finalizado por</th>
                  </tr>
                </thead>
                <tbody>
                  {rel.linhas.map(l => (
                    <tr key={l.protocolo} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs">{l.protocolo}</td>
                      <td className="px-3 py-2">{CAT_LABELS[l.categoria] ?? l.categoria}</td>
                      <td className="px-3 py-2 max-w-[220px] truncate" title={l.titulo}>{l.titulo}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_LABEL[l.status]?.cls ?? ''}`}>
                          {STATUS_LABEL[l.status]?.txt ?? l.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{l.nome ?? 'Anônimo'}</td>
                      <td className="px-3 py-2">{[l.bloco, l.apartamento].filter(Boolean).join(' / ') || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{new Date(l.abertoEm).toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{fmtMin(l.minAbertoParaAnalise)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{fmtMin(l.minAbertoParaFinalizado)}</td>
                      <td className="px-3 py-2">{l.finalizadoPor ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </>
  )
}

function AbaCanais() {
  const [canais, setCanais] = useState<Canal[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [edit, setEdit] = useState<typeof NOVO_CANAL | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [origin] = useState(() => window.location.origin)

  const carregar = useCallback(async () => {
    const r = await api.get('/api/canais-reporte')
    setCanais(r.data)
  }, [])

  useEffect(() => {
    carregar()
    api.get('/api/areas').then(r => setAreas(r.data))
  }, [carregar])

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
    if (!confirm('Excluir esta solicitação? O QR Code deixará de funcionar.')) return
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
          Crie formulários com QR Codes para que os moradores possam enviar reclamações, denúncias, elogios ou sugestões
          com apenas um escaneamento. Cada envio pode incluir título, descrição e imagens. Você define se a identificação
          do morador será obrigatória ou opcional — ideal para solicitações anônimas.
        </p>
        <Button onClick={() => setEdit({ ...NOVO_CANAL })}>+ Nova solicitação</Button>
      </div>

      {canais.length === 0 ? (
        <Card className="p-8 text-center text-slate-700 text-sm mt-4">
          Nenhuma solicitação criada. Clique em "+ Nova solicitação" para começar.
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
              <h2 className="text-lg font-bold mb-4">{edit.id ? 'Editar solicitação' : 'Nova solicitação'}</h2>
              <div className="space-y-4">
                <div>
                  <Label>Nome da solicitação *</Label>
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
