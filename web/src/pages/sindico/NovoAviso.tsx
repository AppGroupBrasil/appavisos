import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Input, Label, Textarea } from '../../components/ui'

type Bloco = { id: string; nome: string }
type Morador = { id: string; nome: string; telefone?: string; apartamento?: string; blocoId?: string }
type Categoria = { id: string; nome: string }
type Area = { id: string; nome: string }

const TIPOS = [{ v: 1, l: 'Aviso' }, { v: 2, l: 'Comunicado' }, { v: 3, l: 'Informativo' }, { v: 4, l: 'Notificação' }, { v: 5, l: 'Documento' }] as const

export default function NovoAviso() {
  const nav = useNavigate()
  const [blocos, setBlocos] = useState<Bloco[]>([])
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [gerenciarCat, setGerenciarCat] = useState(false)
  const [filtroBloco, setFiltroBloco] = useState('')
  const [busca, setBusca] = useState('')
  const [f, setF] = useState({
    titulo: '', texto: '',
    escopo: 1 as 1 | 2 | 3 | 4, blocoId: '', moradorId: '', areaId: '',
    template: 1, tipo: 1, categoriaId: '',
    urgente: false, fixado: false,
    publicarEm: '', validoAte: '',
  })
  const [anexo, setAnexo] = useState<{ url: string; nome: string; tamanho: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const carregarCategorias = () => api.get('/api/categorias').then((r) => setCategorias(r.data))

  useEffect(() => {
    api.get('/api/blocos').then((r) => setBlocos(r.data))
    api.get('/api/moradores?status=ativo').then((r) => setMoradores(r.data))
    api.get('/api/areas').then((r) => setAreas(r.data))
    carregarCategorias()
  }, [])

  const moradoresFiltrados = useMemo(() => {
    let l = moradores
    if (filtroBloco) l = l.filter((m) => m.blocoId === filtroBloco)
    if (busca.trim()) {
      const q = busca.toLowerCase().trim()
      l = l.filter((m) => m.nome.toLowerCase().includes(q) || (m.apartamento || '').toLowerCase().includes(q))
    }
    return l
  }, [moradores, filtroBloco, busca])

  const moradorSelecionado = moradores.find((m) => m.id === f.moradorId)

  async function uploadAnexo(file: File) {
    const fd = new FormData(); fd.append('file', file)
    const endpoint = f.tipo === 5 ? '/api/uploads/documento' : '/api/uploads/anexo'
    const { data } = await api.post(endpoint, fd)
    setAnexo(data)
  }

  async function salvar(viaWhatsapp: boolean) {
    setErro(''); setLoading(true)
    try {
      const { data } = await api.post('/api/avisos', {
        titulo: f.titulo, texto: f.texto,
        escopo: f.escopo,
        blocoId: f.escopo === 2 ? f.blocoId : null,
        moradorId: f.escopo === 3 ? f.moradorId : null,
        areaId: f.escopo === 4 ? f.areaId : null,
        template: f.template, tipo: f.tipo,
        categoriaId: f.categoriaId || null,
        urgente: f.urgente, fixado: f.fixado,
        publicarEm: f.publicarEm || null, validoAte: f.validoAte || null,
        anexoUrl: anexo?.url, anexoNome: anexo?.nome, anexoTamanho: anexo?.tamanho,
      })
      if (viaWhatsapp && moradorSelecionado?.telefone) {
        const tel = moradorSelecionado.telefone.replace(/\D/g, '')
        const tipoLabel = TIPOS.find((t) => t.v === f.tipo)?.l ?? 'Aviso'
        const origin = window.location.origin
        const msg = `*${tipoLabel}: ${f.titulo}*\n\n${f.texto}\n\n🔔 Ative as notificações para receber direto no celular (sem instalar app):\n${origin}/ativar-notificacoes`
        window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank')
      }
      void data
      nav('/painel')
    } catch (err: any) {
      setErro(err.response?.data?.erro ?? 'Erro')
    } finally { setLoading(false) }
  }

  const tipoLabel = TIPOS.find((t) => t.v === f.tipo)?.l ?? 'Aviso'

  return (
    <ShellSindico>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Novo</h1>
        <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: +e.target.value })}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xl font-bold">
          {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); salvar(false) }} className="space-y-4 max-w-2xl">
        <Card className="p-5 space-y-4">
          <div><Label>Título</Label><Input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} required /></div>
          <div><Label>Mensagem</Label><Textarea rows={6} value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} required /></div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Template</Label>
              <select value={f.template} onChange={(e) => setF({ ...f, template: +e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <option value={1}>Padrão</option>
                <option value={2}>Urgente</option>
                <option value={4}>Manutenção</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</label>
                <button type="button" onClick={() => setGerenciarCat(true)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="Gerenciar categorias">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
              </div>
              <select value={f.categoriaId} onChange={(e) => setF({ ...f, categoriaId: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <option value="">— sem categoria —</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label>Para quem</Label>
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex-wrap">
              {[[1, 'Todo condomínio'], [2, 'Bloco'], [3, 'Morador'], [4, 'Área']].map(([v, l]) => (
                <button type="button" key={v} onClick={() => setF({ ...f, escopo: v as any })}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md ${f.escopo === v ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600'}`}>{l}</button>
              ))}
            </div>
          </div>

          {f.escopo === 2 && (
            <div>
              <Label>Bloco</Label>
              <select value={f.blocoId} onChange={(e) => setF({ ...f, blocoId: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <option value="">Selecione…</option>
                {blocos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
          )}

          {f.escopo === 4 && (
            <div>
              <Label>Área</Label>
              <select value={f.areaId} onChange={(e) => setF({ ...f, areaId: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <option value="">Selecione…</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">Aviso visível ao escanear o QR Code da área. Não envia e-mail/push.</p>
            </div>
          )}

          {f.escopo === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Filtrar por bloco</Label>
                  <select value={filtroBloco} onChange={(e) => setFiltroBloco(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <option value="">Todos os blocos</option>
                    {blocos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Buscar (nome ou apto)</Label>
                  <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="ex: João, 101" />
                </div>
              </div>
              <div>
                <Label>Morador ({moradoresFiltrados.length})</Label>
                <select value={f.moradorId} onChange={(e) => setF({ ...f, moradorId: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <option value="">Selecione…</option>
                  {moradoresFiltrados.map((m) => {
                    const b = blocos.find((x) => x.id === m.blocoId)
                    const det = [b?.nome, m.apartamento && `Apto ${m.apartamento}`].filter(Boolean).join(' — ')
                    return <option key={m.id} value={m.id}>{m.nome}{det ? ` — ${det}` : ''}</option>
                  })}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.urgente} onChange={(e) => setF({ ...f, urgente: e.target.checked })} /> Urgente</label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.fixado} onChange={(e) => setF({ ...f, fixado: e.target.checked })} />
              Fixar no topo
              <span title="O aviso fica destacado no topo da lista do morador mesmo após novos avisos. Útil para regulamento, contatos de emergência ou avisos que devem permanecer visíveis." className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs cursor-help">?</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Agendar para</Label><Input type="datetime-local" value={f.publicarEm} onChange={(e) => setF({ ...f, publicarEm: e.target.value })} /></div>
            <div><Label>Válido até</Label><Input type="datetime-local" value={f.validoAte} onChange={(e) => setF({ ...f, validoAte: e.target.value })} /></div>
          </div>

          <div>
            <Label>Anexo (PDF/imagem, até 5MB)</Label>
            {!anexo ? (
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(e) => e.target.files?.[0] && uploadAnexo(e.target.files[0])} className="text-sm" />
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span>📎 {anexo.nome}</span>
                <button type="button" onClick={() => setAnexo(null)} className="text-red-600">remover</button>
              </div>
            )}
          </div>

          {erro && <div className="text-sm text-red-600">{erro}</div>}
        </Card>

        <div className="flex gap-2 flex-wrap">
          <Button type="submit" disabled={loading}>{loading ? 'Publicando…' : `Publicar ${tipoLabel.toLowerCase()}`}</Button>
          {f.escopo === 3 && moradorSelecionado?.telefone && (
            <Button type="button" variant="whatsapp" disabled={loading} onClick={() => salvar(true)}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Publicar e enviar pelo WhatsApp
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => nav('/painel')}>Cancelar</Button>
        </div>
      </form>

      {gerenciarCat && (
        <ModalCategorias categorias={categorias} onClose={() => setGerenciarCat(false)} onChange={carregarCategorias} />
      )}
    </ShellSindico>
  )
}

function ModalCategorias({ categorias, onClose, onChange }: { categorias: Categoria[]; onClose: () => void; onChange: () => void }) {
  const [nova, setNova] = useState('')
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null)

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!nova.trim()) return
    try { await api.post('/api/categorias', { nome: nova.trim() }); setNova(''); onChange() }
    catch (err: any) { alert(err.response?.data?.erro ?? 'Erro') }
  }
  async function salvarEdicao() {
    if (!editando) return
    try { await api.put(`/api/categorias/${editando.id}`, { nome: editando.nome }); setEditando(null); onChange() }
    catch (err: any) { alert(err.response?.data?.erro ?? 'Erro') }
  }
  async function excluir(id: string) {
    if (!confirm('Excluir categoria?')) return
    try { await api.delete(`/api/categorias/${id}`); onChange() }
    catch (err: any) { alert(err.response?.data?.erro ?? 'Erro') }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Gerenciar categorias</h2>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        <form onSubmit={adicionar} className="flex gap-2 mb-4">
          <Input value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Nova categoria" />
          <Button type="submit">Adicionar</Button>
        </form>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {categorias.map((c) => (
            <div key={c.id} className="flex items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-700">
              {editando?.id === c.id ? (
                <>
                  <Input value={editando.nome} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} className="flex-1" />
                  <Button type="button" onClick={salvarEdicao}>Salvar</Button>
                  <Button type="button" variant="ghost" onClick={() => setEditando(null)}>✕</Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{c.nome}</span>
                  <button onClick={() => setEditando({ id: c.id, nome: c.nome })} className="text-slate-500 hover:text-slate-700 text-sm">editar</button>
                  <button onClick={() => excluir(c.id)} className="text-red-500 hover:text-red-700 text-sm">excluir</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
