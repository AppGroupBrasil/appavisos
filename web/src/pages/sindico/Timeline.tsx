import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Input, Label } from '../../components/ui'

type Item = {
  tipo: 'aviso' | 'reporte'
  id: string
  subtipo: string
  titulo: string
  resumo: string
  criadoEm: string
  status?: string | null
  protocolo?: string | null
  moradorNome?: string | null
  bloco?: string | null
  apartamento?: string | null
  link?: string | null
}

const SUBTIPOS_AVISO = ['Aviso', 'Comunicado', 'Informativo', 'Notificacao']
const SUBTIPOS_REPORTE = ['Ocorrencia', 'Manutencao', 'Reclamacao', 'Sugestao', 'Outro']

const LABEL: Record<string, string> = {
  Aviso: 'Aviso', Comunicado: 'Comunicado', Informativo: 'Informativo', Notificacao: 'Notificação',
  Ocorrencia: 'Ocorrência', Manutencao: 'Manutenção', Reclamacao: 'Reclamação', Sugestao: 'Sugestão', Outro: 'Outro',
  Aberto: 'Aberto', EmExecucao: 'Em execução', Finalizado: 'Finalizado', Arquivado: 'Arquivado',
  Rascunho: 'Rascunho', Publicado: 'Publicado',
}

const STATUS_CLS: Record<string, string> = {
  Aberto: 'bg-amber-100 text-amber-800',
  EmExecucao: 'bg-blue-600 text-white',
  Finalizado: 'bg-emerald-100 text-emerald-800',
  Arquivado: 'bg-slate-200 text-slate-700',
  Rascunho: 'bg-slate-200 text-slate-700',
  Publicado: 'bg-emerald-100 text-emerald-800',
}

export default function Timeline() {
  const [itens, setItens] = useState<Item[]>([])
  const [carregando, setCarregando] = useState(false)
  const [f, setF] = useState({ tipo: '', subtipo: '', q: '', protocolo: '', de: '', ate: '' })

  function montarQuery() {
    const p = new URLSearchParams()
    if (f.tipo) p.set('tipo', f.tipo)
    if (f.subtipo) p.set('subtipo', f.subtipo)
    if (f.q) p.set('q', f.q)
    if (f.protocolo) p.set('protocolo', f.protocolo)
    if (f.de) p.set('de', f.de)
    if (f.ate) p.set('ate', f.ate)
    return p
  }

  async function carregar() {
    setCarregando(true)
    try {
      const r = await api.get(`/api/timeline/feed?${montarQuery()}`)
      setItens(r.data)
    } finally { setCarregando(false) }
  }

  useEffect(() => {
    const t = setTimeout(carregar, 300)
    return () => clearTimeout(t)
  }, [f])

  function limpar() {
    setF({ tipo: '', subtipo: '', q: '', protocolo: '', de: '', ate: '' })
  }

  async function abrirRelatorio() {
    const r = await api.get(`/api/timeline/relatorio?${montarQuery()}`, { responseType: 'blob' })
    const url = URL.createObjectURL(r.data)
    window.open(url, '_blank')
  }

  const subtipoOpts = f.tipo === 'reporte' ? SUBTIPOS_REPORTE
    : f.tipo === 'aviso' ? SUBTIPOS_AVISO
    : [...SUBTIPOS_AVISO, ...SUBTIPOS_REPORTE]

  return (
    <ShellSindico>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Timeline</h1>
        <Button onClick={abrirRelatorio} disabled={itens.length === 0}>📄 Gerar relatório (PDF)</Button>
      </div>
      <p className="text-sm text-slate-700 mb-6">Avisos e reportes unificados, com filtros e busca inteligente.</p>

      <Card className="p-4 mb-4 space-y-3">
        <div>
          <Label>Busca inteligente</Label>
          <Input value={f.q} onChange={e => setF({ ...f, q: e.target.value })}
            placeholder="Buscar em título, texto, descrição, nome do morador..." />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Tipo</Label>
            <select value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value, subtipo: '' })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white">
              <option value="">Todos</option>
              <option value="aviso">Avisos do síndico</option>
              <option value="reporte">Reportes dos moradores</option>
            </select>
          </div>
          <div>
            <Label>Subtipo</Label>
            <select value={f.subtipo} onChange={e => setF({ ...f, subtipo: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white">
              <option value="">Todos</option>
              {subtipoOpts.map(s => <option key={s} value={s}>{LABEL[s] ?? s}</option>)}
            </select>
          </div>
          <div>
            <Label>Protocolo</Label>
            <Input value={f.protocolo} maxLength={6} inputMode="numeric"
              onChange={e => setF({ ...f, protocolo: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              placeholder="000000" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>De</Label>
            <Input type="date" value={f.de} onChange={e => setF({ ...f, de: e.target.value })} />
          </div>
          <div>
            <Label>Até</Label>
            <Input type="date" value={f.ate} onChange={e => setF({ ...f, ate: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button variant="secondary" onClick={limpar} className="w-full">Limpar filtros</Button>
          </div>
        </div>
      </Card>

      <div className="text-xs text-slate-700 mb-2">
        {carregando ? 'Carregando...' : `${itens.length} ${itens.length === 1 ? 'registro' : 'registros'}`}
      </div>

      <div className="space-y-2">
        {itens.length === 0 && !carregando && (
          <Card className="p-8 text-center text-slate-700 text-sm">Nenhum registro encontrado com esses filtros.</Card>
        )}
        {itens.map(i => {
          const conteudo = (
            <>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${i.tipo === 'aviso' ? 'bg-blue-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {LABEL[i.subtipo] ?? i.subtipo}
                </span>
                {i.status && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[i.status] ?? 'bg-slate-100 text-slate-700'}`}>
                    {LABEL[i.status] ?? i.status}
                  </span>
                )}
                {i.protocolo && <span className="text-xs text-slate-600 font-mono">#{i.protocolo}</span>}
                <span className="text-xs text-slate-600 ml-auto">{new Date(i.criadoEm).toLocaleString('pt-BR')}</span>
              </div>
              <div className="font-medium">{i.titulo}</div>
              <div className="text-xs text-slate-700 mt-0.5">{i.resumo}</div>
              {(i.moradorNome || i.apartamento) && (
                <div className="text-xs text-slate-600 mt-1">
                  {i.moradorNome ?? '—'}{i.bloco && ` · ${i.bloco}`}{i.apartamento && ` · Apto ${i.apartamento}`}
                </div>
              )}
            </>
          )
          return i.link ? (
            <Link key={`${i.tipo}-${i.id}`} to={i.link} className="block bg-white rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
              {conteudo}
            </Link>
          ) : (
            <div key={`${i.tipo}-${i.id}`} className="bg-white rounded-xl border border-slate-200 p-4">{conteudo}</div>
          )
        })}
      </div>
    </ShellSindico>
  )
}
