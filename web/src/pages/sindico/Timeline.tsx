import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Input, Label, Textarea } from '../../components/ui'

type Conv = { avisoId: string; moradorId: string; avisoTitulo: string; moradorNome: string; bloco?: string; apartamento?: string; ultimaMensagem: string; totalMensagens: number }
type Bloco = { id: string; nome: string }
type Msg = { id: string; autorTipo: number; autorNome: string; texto: string; criadoEm: string }

export default function Timeline() {
  const [convs, setConvs] = useState<Conv[]>([])
  const [blocos, setBlocos] = useState<Bloco[]>([])
  const [filtros, setFiltros] = useState({ blocoId: '', apto: '', q: '' })
  const [aberto, setAberto] = useState<Conv | null>(null)

  function carregar() {
    const p = new URLSearchParams()
    if (filtros.blocoId) p.set('blocoId', filtros.blocoId)
    if (filtros.apto) p.set('apto', filtros.apto)
    if (filtros.q) p.set('q', filtros.q)
    api.get(`/api/timeline?${p}`).then((r) => setConvs(r.data))
  }
  useEffect(() => {
    api.get('/api/blocos').then((r) => setBlocos(r.data))
  }, [])
  useEffect(() => { carregar() }, [filtros])

  return (
    <ShellSindico>
      <h1 className="text-2xl font-bold mb-2">Timeline</h1>
      <p className="text-sm text-slate-500 mb-6">Histórico completo de conversas: avisos, respostas dos moradores e suas réplicas.</p>

      <Card className="p-4 mb-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Bloco</Label>
            <select value={filtros.blocoId} onChange={(e) => setFiltros({ ...filtros, blocoId: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
              <option value="">Todos</option>
              {blocos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
            </select>
          </div>
          <div><Label>Apartamento</Label><Input value={filtros.apto} onChange={(e) => setFiltros({ ...filtros, apto: e.target.value })} placeholder="ex: 101" /></div>
          <div><Label>Nome do morador</Label><Input value={filtros.q} onChange={(e) => setFiltros({ ...filtros, q: e.target.value })} placeholder="ex: João" /></div>
        </div>
      </Card>

      <div className="space-y-2">
        {convs.length === 0 && <Card className="p-6 text-center text-slate-500 text-sm">Nenhuma conversa.</Card>}
        {convs.map((c) => (
          <div key={`${c.avisoId}-${c.moradorId}`} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setAberto(c)}>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{c.avisoTitulo}</div>
              <div className="text-xs text-slate-500">{c.moradorNome}{c.bloco && ` — ${c.bloco}`}{c.apartamento && ` — Apto ${c.apartamento}`}</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{c.totalMensagens} {c.totalMensagens === 1 ? 'mensagem' : 'mensagens'}</div>
              <div>{new Date(c.ultimaMensagem).toLocaleString('pt-BR')}</div>
            </div>
          </div>
        ))}
      </div>

      {aberto && <ThreadModal conversa={aberto} onClose={() => { setAberto(null); carregar() }} />}
    </ShellSindico>
  )
}

function ThreadModal({ conversa, onClose }: { conversa: Conv; onClose: () => void }) {
  const [data, setData] = useState<{ aviso: any; morador: any; mensagens: Msg[] } | null>(null)
  const [texto, setTexto] = useState('')

  function carregar() {
    api.get(`/api/timeline/${conversa.avisoId}/${conversa.moradorId}`).then((r) => setData(r.data))
  }
  useEffect(() => { carregar() }, [])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    await api.post(`/api/timeline/${conversa.avisoId}/${conversa.moradorId}`, { texto: texto.trim() })
    setTexto(''); carregar()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="font-semibold">{conversa.avisoTitulo}</div>
            <div className="text-xs text-slate-500">{conversa.moradorNome}{conversa.bloco && ` — ${conversa.bloco}`}{conversa.apartamento && ` — Apto ${conversa.apartamento}`}</div>
          </div>
          <div className="flex gap-2">
            <a href={`/api/timeline/${conversa.avisoId}/${conversa.moradorId}/pdf`} target="_blank" rel="noopener" className="text-sm text-slate-500 hover:text-slate-700">Exportar PDF</a>
            <button onClick={onClose} className="text-slate-500">✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {data?.aviso && (
            <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-900 dark:border-slate-100 p-3 rounded">
              <div className="text-xs font-semibold text-slate-500 mb-1">AVISO ORIGINAL</div>
              <div className="text-sm whitespace-pre-wrap">{data.aviso.texto}</div>
              <div className="text-xs text-slate-500 mt-2">{new Date(data.aviso.publicadoEm ?? data.aviso.criadoEm).toLocaleString('pt-BR')}</div>
            </div>
          )}
          {data?.mensagens.map((m) => (
            <div key={m.id} className={`flex ${m.autorTipo === 1 ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${m.autorTipo === 1 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <div className="text-xs font-semibold mb-1">{m.autorNome}</div>
                <div className="text-sm whitespace-pre-wrap">{m.texto}</div>
                <div className="text-xs text-slate-500 mt-1">{new Date(m.criadoEm).toLocaleString('pt-BR')}</div>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={enviar} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Réplica do síndico…" rows={2} />
          <Button type="submit" disabled={!texto.trim()}>Enviar</Button>
        </form>
      </div>
    </div>
  )
}
