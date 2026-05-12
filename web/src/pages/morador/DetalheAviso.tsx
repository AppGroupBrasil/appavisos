import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button, Card } from '../../components/ui'

type Aviso = { id: string; titulo: string; texto: string; tipo: number; urgente: boolean; fixado: boolean; publicadoEm: string; anexoUrl?: string; anexoNome?: string; cienteEm?: string; resposta?: string }
type Msg = { id: string; autorTipo: number; autorNome: string; texto: string; criadoEm: string }

const TIPOS = ['', 'Aviso', 'Comunicado', 'Informativo', 'Notificação']

export default function DetalheAviso() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [resposta, setResposta] = useState('')
  const [mensagens, setMensagens] = useState<Msg[]>([])
  const [novaMsg, setNovaMsg] = useState('')
  const respRef = useRef<HTMLTextAreaElement>(null)

  function carregar() {
    api.get(`/api/avisos/${id}/morador`).then((r) => setAviso(r.data))
    api.post(`/api/avisos/${id}/visualizar`).catch(() => {})
    api.get(`/api/timeline/${id}/${userMoradorId()}`).then((r) => setMensagens(r.data.mensagens)).catch(() => {})
  }
  useEffect(() => { carregar() }, [id])
  useEffect(() => {
    if (search.get('responder') === '1' && respRef.current) respRef.current.focus()
  }, [search, aviso])
  useEffect(() => {
    if (search.get('ciente') === '1' && aviso && !aviso.cienteEm) marcarCiente()
  }, [aviso])

  function userMoradorId() {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u).condominioId && JSON.parse(localStorage.getItem('user')!).perfil === 'Morador' ? JSON.parse(atob(localStorage.getItem('token')!.split('.')[1])).nameid ?? '' : '' : ''
  }

  async function marcarCiente() {
    await api.post(`/api/avisos/${id}/ciente`, { resposta: resposta || null })
    carregar()
  }

  async function enviarMensagem(e: React.FormEvent) {
    e.preventDefault()
    if (!novaMsg.trim()) return
    const moradorId = JSON.parse(atob(localStorage.getItem('token')!.split('.')[1])).nameid
    await api.post(`/api/timeline/${id}/${moradorId}`, { texto: novaMsg.trim() })
    setNovaMsg(''); carregar()
  }

  if (!aviso) return <div className="p-6 text-center text-slate-700">Carregando…</div>

  return (
    <div className="min-h-full max-w-2xl mx-auto p-4">
      <Link to="/feed" className="text-sm text-slate-700 hover:text-slate-700 mb-4 inline-block">← Voltar</Link>

      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{TIPOS[aviso.tipo] || 'Aviso'}</span>
          {aviso.urgente && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">URGENTE</span>}
          {aviso.fixado && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">📌</span>}
        </div>
        <h1 className="text-xl font-bold mb-2">{aviso.titulo}</h1>
        <div className="text-xs text-slate-700 mb-4">{new Date(aviso.publicadoEm).toLocaleString('pt-BR')}</div>
        <div className="text-sm whitespace-pre-wrap">{aviso.texto}</div>
        {aviso.anexoUrl && (
          <a href={aviso.anexoUrl} target="_blank" rel="noopener" className="inline-flex mt-3 px-3 py-2 rounded bg-slate-100 dark:bg-slate-800 text-sm">📎 {aviso.anexoNome}</a>
        )}

        {!aviso.cienteEm ? (
          <div className="mt-5 space-y-2">
            <textarea ref={respRef} placeholder="Resposta (opcional)" rows={3} value={resposta} onChange={(e) => setResposta(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
            <Button onClick={marcarCiente}>Marcar como ciente</Button>
          </div>
        ) : (
          <div className="mt-4 text-xs text-emerald-600">✓ Ciente em {new Date(aviso.cienteEm).toLocaleString('pt-BR')}</div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Conversa</h2>
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {mensagens.length === 0 && <div className="text-sm text-slate-700">Sem mensagens ainda. Use o campo abaixo para falar com o síndico.</div>}
          {mensagens.map((m) => (
            <div key={m.id} className={`flex ${m.autorTipo === 1 ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.autorTipo === 1 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <div className="text-xs font-semibold mb-1">{m.autorNome}</div>
                <div className="whitespace-pre-wrap">{m.texto}</div>
                <div className="text-xs text-slate-700 mt-1">{new Date(m.criadoEm).toLocaleString('pt-BR')}</div>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={enviarMensagem} className="flex gap-2">
          <textarea value={novaMsg} onChange={(e) => setNovaMsg(e.target.value)} placeholder="Enviar mensagem ao síndico…" rows={2} className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
          <Button type="submit" disabled={!novaMsg.trim()}>Enviar</Button>
        </form>
      </Card>
    </div>
  )
}
