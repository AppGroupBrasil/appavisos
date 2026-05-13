import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Input, Label, Textarea } from '../../components/ui'

type Doc = {
  id: string
  titulo: string
  texto?: string | null
  anexoNome?: string | null
  anexoTamanho?: number | null
  categoriaNome?: string | null
  categoriaId?: string | null
  criadoEm: string
  publicadoEm?: string | null
}

type Categoria = { id: string; nome: string }

function formatTamanho(b?: number | null) {
  if (!b) return ''
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function Documentos() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [busca, setBusca] = useState('')

  // form novo/editar documento
  const [formAberto, setFormAberto] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [anexo, setAnexo] = useState<{ url: string; nome: string; tamanho: number } | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // modal categorias
  const [catModal, setCatModal] = useState(false)
  const [novaCat, setNovaCat] = useState('')
  const [editCat, setEditCat] = useState<{ id: string; nome: string } | null>(null)
  const [salvandoCat, setSalvandoCat] = useState(false)
  const [erroCat, setErroCat] = useState('')

  async function carregar() {
    const r = await api.get('/api/avisos?tipo=5')
    setDocs(r.data)
  }

  async function carregarCategorias() {
    const r = await api.get('/api/categorias')
    setCategorias(r.data)
  }

  useEffect(() => {
    carregar()
    carregarCategorias()
  }, [])

  async function uploadArquivo(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await api.post('/api/uploads/documento', fd)
    setAnexo(data)
  }

  function abrirNovo() {
    setEditId(null)
    setTitulo(''); setTexto(''); setCategoriaId(''); setAnexo(null); setErro('')
    setFormAberto(true)
  }

  function abrirEditar(d: Doc) {
    setEditId(d.id)
    setTitulo(d.titulo)
    setTexto(d.texto ?? '')
    setCategoriaId(d.categoriaId ?? '')
    setAnexo(null)
    setErro('')
    setFormAberto(true)
  }

  async function salvar() {
    if (!titulo.trim()) { setErro('Título obrigatório'); return }
    setSalvando(true); setErro('')
    try {
      if (editId) {
        await api.put(`/api/avisos/${editId}`, {
          titulo, texto: texto || null,
          categoriaId: categoriaId || null,
        })
      } else {
        await api.post('/api/avisos', {
          titulo, texto: texto || null,
          escopo: 1, tipo: 5,
          categoriaId: categoriaId || null,
          anexoUrl: anexo?.url, anexoNome: anexo?.nome, anexoTamanho: anexo?.tamanho,
        })
      }
      setFormAberto(false)
      await carregar()
    } catch (e: any) {
      setErro(e?.response?.data?.erro ?? 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este documento?')) return
    await api.delete(`/api/avisos/${id}`)
    await carregar()
  }

  // categorias
  async function criarCategoria() {
    if (!novaCat.trim()) return
    setSalvandoCat(true); setErroCat('')
    try {
      await api.post('/api/categorias', { nome: novaCat.trim() })
      setNovaCat('')
      await carregarCategorias()
    } catch (e: any) {
      setErroCat(e?.response?.data?.erro ?? 'Erro ao criar')
    } finally { setSalvandoCat(false) }
  }

  async function renomearCategoria() {
    if (!editCat || !editCat.nome.trim()) return
    setSalvandoCat(true); setErroCat('')
    try {
      await api.put(`/api/categorias/${editCat.id}`, { nome: editCat.nome.trim() })
      setEditCat(null)
      await carregarCategorias()
    } catch (e: any) {
      setErroCat(e?.response?.data?.erro ?? 'Erro ao renomear')
    } finally { setSalvandoCat(false) }
  }

  async function excluirCategoria(id: string) {
    if (!confirm('Excluir esta categoria?')) return
    try {
      await api.delete(`/api/categorias/${id}`)
      await carregarCategorias()
    } catch (e: any) {
      setErroCat(e?.response?.data?.erro ?? 'Não foi possível excluir')
    }
  }

  const lista = busca
    ? docs.filter(d => d.titulo.toLowerCase().includes(busca.toLowerCase())
        || (d.categoriaNome ?? '').toLowerCase().includes(busca.toLowerCase()))
    : docs

  return (
    <ShellSindico>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Documentos</h1>
          <button
            onClick={() => { setCatModal(true); setErroCat(''); setNovaCat(''); setEditCat(null) }}
            title="Gerenciar categorias"
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            ⚙️
          </button>
        </div>
        <Button onClick={abrirNovo}>+ Novo documento</Button>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Publique convenções, atas, regulamentos e contratos. Os moradores acessam pelo app após fazer login.
      </p>

      <Input value={busca} onChange={e => setBusca(e.target.value)}
        placeholder="Buscar por título ou categoria..." className="mb-4" />

      {lista.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 text-sm">
          {docs.length === 0
            ? 'Nenhum documento publicado. Clique em "+ Novo documento" para começar.'
            : 'Nenhum resultado para essa busca.'}
        </Card>
      ) : (
        <div className="space-y-2">
          {lista.map(d => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {d.categoriaNome && (
                    <div className="text-xs text-slate-500 mb-1">{d.categoriaNome}</div>
                  )}
                  <div className="font-semibold text-slate-900">{d.titulo}</div>
                  {d.texto && (
                    <div className="text-sm text-slate-600 mt-1 line-clamp-2">{d.texto}</div>
                  )}
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                    {d.anexoNome && (
                      <span>📎 {d.anexoNome}{d.anexoTamanho ? ` · ${formatTamanho(d.anexoTamanho)}` : ''}</span>
                    )}
                    <span>{new Date(d.publicadoEm ?? d.criadoEm).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => abrirEditar(d)}
                    className="text-sm text-slate-500 hover:text-slate-800">
                    Editar
                  </button>
                  <button onClick={() => excluir(d.id)}
                    className="text-sm text-red-500 hover:text-red-700">
                    Excluir
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal novo/editar documento */}
      {formAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setFormAberto(false)}>
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editId ? 'Editar documento' : 'Novo documento'}</h2>
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex.: Ata da Assembleia — Março 2026" maxLength={200} autoFocus />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea rows={3} value={texto} onChange={e => setTexto(e.target.value)}
                  placeholder="Breve descrição do conteúdo do documento..." />
              </div>
              <div>
                <Label>Categoria (opcional)</Label>
                <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900">
                  <option value="">— sem categoria —</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              {!editId && (
                <div>
                  <Label>Arquivo (PDF, DOC ou imagem, até 10MB)</Label>
                  {!anexo ? (
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      onChange={e => e.target.files?.[0] && uploadArquivo(e.target.files[0])}
                      className="block w-full text-sm text-slate-600 mt-1 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white" />
                  ) : (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <span className="text-slate-700">📎 {anexo.nome} · {formatTamanho(anexo.tamanho)}</span>
                      <button type="button" onClick={() => setAnexo(null)} className="text-red-600 hover:text-red-800">remover</button>
                    </div>
                  )}
                </div>
              )}
              {erro && <div className="text-sm text-red-600">{erro}</div>}
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <Button variant="secondary" onClick={() => setFormAberto(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando || !titulo.trim()}>
                {salvando ? 'Salvando...' : editId ? 'Salvar alterações' : 'Publicar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal gerenciar categorias */}
      {catModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setCatModal(false)}>
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Categorias de documentos</h2>

            <div className="space-y-1 mb-4 max-h-60 overflow-y-auto">
              {categorias.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Nenhuma categoria criada.</p>
              )}
              {categorias.map(c => (
                <div key={c.id} className="flex items-center gap-2 py-1">
                  {editCat?.id === c.id ? (
                    <>
                      <Input
                        value={editCat.nome}
                        onChange={e => setEditCat({ ...editCat, nome: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') renomearCategoria(); if (e.key === 'Escape') setEditCat(null) }}
                        className="flex-1 h-8 text-sm"
                        autoFocus
                      />
                      <button onClick={renomearCategoria} disabled={salvandoCat}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                        Salvar
                      </button>
                      <button onClick={() => setEditCat(null)}
                        className="text-xs text-slate-500 hover:text-slate-700">
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-slate-800">{c.nome}</span>
                      <button onClick={() => { setEditCat({ id: c.id, nome: c.nome }); setErroCat('') }}
                        className="text-xs text-slate-500 hover:text-slate-800">
                        Editar
                      </button>
                      <button onClick={() => excluirCategoria(c.id)}
                        className="text-xs text-red-500 hover:text-red-700">
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <Label>Nova categoria</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={novaCat}
                  onChange={e => setNovaCat(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') criarCategoria() }}
                  placeholder="Nome da categoria"
                  className="flex-1"
                />
                <Button onClick={criarCategoria} disabled={salvandoCat || !novaCat.trim()}>
                  Criar
                </Button>
              </div>
              {erroCat && <div className="text-sm text-red-600 mt-2">{erroCat}</div>}
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setCatModal(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </ShellSindico>
  )
}
