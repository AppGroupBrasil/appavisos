import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Textarea } from '../../components/ui'

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

const STATUS_LABEL: Record<string, { txt: string; cls: string }> = {
  Aberto: { txt: 'Aberto', cls: 'bg-amber-100 text-amber-800' },
  EmExecucao: { txt: 'Em execução', cls: 'bg-blue-100 text-blue-800' },
  Finalizado: { txt: 'Finalizado', cls: 'bg-emerald-100 text-emerald-800' },
  Arquivado: { txt: 'Arquivado', cls: 'bg-slate-200 text-slate-700' },
}

const CAT_LABELS: Record<string, string> = {
  Ocorrencia: 'Ocorrência', Manutencao: 'Manutenção',
  Reclamacao: 'Reclamação', Sugestao: 'Sugestão', Outro: 'Outro',
}

export default function Reportes() {
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
    <ShellSindico>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex gap-2 text-sm">
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="px-2 py-1 border rounded">
            <option value="">Todos status</option>
            <option value="Aberto">Aberto</option>
            <option value="EmExecucao">Em execução</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Arquivado">Arquivado</option>
          </select>
          <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} className="px-2 py-1 border rounded">
            <option value="">Todas categorias</option>
            {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="text-center text-slate-500 py-12">Nenhum reporte ainda.</div>
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
                      {r.temFotos && <span className="text-xs text-slate-500">📷</span>}
                      <span className="text-xs text-slate-400 font-mono">#{r.protocolo}</span>
                    </div>
                    <div className="font-medium">{r.titulo}</div>
                    <div className="text-xs text-slate-500 mt-1">
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
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                  {CAT_LABELS[aberto.categoria]}
                </span>
                {aberto.area && <span className="ml-2 text-sm text-slate-600">{aberto.area}</span>}
              </div>
              <button onClick={() => setAberto(null)} className="text-2xl text-slate-400">×</button>
            </div>
            <h2 className="text-xl font-bold mb-1">{aberto.titulo}</h2>
            <div className="text-xs text-slate-500 mb-4">Protocolo <span className="font-mono font-semibold">{aberto.protocolo}</span> · {new Date(aberto.criadoEm).toLocaleString('pt-BR')}</div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4 whitespace-pre-wrap text-sm">{aberto.descricao}</div>

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
                <div className="font-medium mb-1">Identificação</div>
                {aberto.nome && <div>{aberto.nome}</div>}
                {(aberto.bloco || aberto.apartamento) && <div className="text-slate-600">{aberto.bloco}{aberto.bloco && aberto.apartamento ? ' · ' : ''}{aberto.apartamento && `Apto ${aberto.apartamento}`}</div>}
                {aberto.telefone && <div className="text-slate-600">Tel: {aberto.telefone}</div>}
                {aberto.email && <div className="text-slate-600">{aberto.email}</div>}
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_LABEL[aberto.status]?.cls}`}>{STATUS_LABEL[aberto.status]?.txt}</span>
                <span className="text-xs text-slate-500">Mudar para:</span>
                {aberto.status !== 'EmExecucao' && <button onClick={() => mudarStatus('EmExecucao')} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200">Em execução</button>}
                {aberto.status !== 'Finalizado' && <button onClick={() => mudarStatus('Finalizado')} className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Finalizado</button>}
                {aberto.status !== 'Arquivado' && <button onClick={() => mudarStatus('Arquivado')} className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300">Arquivar</button>}
              </div>
              {aberto.historico?.length > 0 && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-slate-600">Histórico ({aberto.historico.length})</summary>
                  <ol className="mt-2 border-l-2 border-slate-200 pl-3 space-y-2">
                    {aberto.historico.map((h, i) => (
                      <li key={i} className="text-xs">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${STATUS_LABEL[h.status]?.cls}`}>{STATUS_LABEL[h.status]?.txt}</span>
                        <span className="ml-2 text-slate-600">{h.autorNome} ({h.autorPerfil}) — {new Date(h.criadoEm).toLocaleString('pt-BR')}</span>
                        {h.observacao && <div className="text-slate-700 mt-0.5">{h.observacao}</div>}
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
              <div className="text-sm font-medium mb-2">{aberto.resposta ? 'Resposta enviada' : 'Responder'}</div>
              {aberto.resposta && aberto.respondidoEm && (
                <div className="text-xs text-slate-500 mb-2">
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
    </ShellSindico>
  )
}
