import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Button, Card, Input } from '../../components/ui'

type Doc = {
  id: string
  titulo: string
  texto?: string | null
  anexoNome?: string | null
  anexoTamanho?: number | null
  categoria?: string | null
  publicadoEm: string
}

function formatTamanho(b?: number | null) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function MeusDocumentos() {
  const { logout } = useAuth()
  const nav = useNavigate()
  const [docs, setDocs] = useState<Doc[]>([])
  const [busca, setBusca] = useState('')
  const [baixando, setBaixando] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.get('/api/avisos/morador/documentos')
      .then(r => setDocs(r.data))
      .catch(() => setErro('Não foi possível carregar os documentos.'))
  }, [])

  async function baixar(d: Doc) {
    setBaixando(d.id)
    try {
      const r = await api.get(`/api/avisos/${d.id}/anexo`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = d.anexoNome ?? 'documento'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setErro('Falha ao baixar o documento.')
    } finally {
      setBaixando(null)
    }
  }

  const lista = busca
    ? docs.filter(d =>
        d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        (d.categoria ?? '').toLowerCase().includes(busca.toLowerCase()))
    : docs

  return (
    <div className="min-h-full">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => nav('/feed')} className="text-sm text-slate-600 hover:text-slate-900">← Voltar</button>
          <div className="flex-1 font-semibold">Documentos do condomínio</div>
          <button onClick={() => { logout(); nav('/login') }} className="text-sm text-slate-700">Sair</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        <p className="text-sm text-slate-600 mb-4">
          Convenções, atas, regulamentos e outros documentos publicados pelo síndico.
        </p>

        <Input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por título ou categoria..."
          className="mb-4"
        />

        {erro && <div className="text-sm text-red-600 mb-4">{erro}</div>}

        {lista.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 text-sm">
            {docs.length === 0
              ? 'Nenhum documento disponível no momento.'
              : 'Nenhum resultado para essa busca.'}
          </Card>
        ) : (
          <div className="space-y-2">
            {lista.map(d => (
              <Card key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {d.categoria && (
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{d.categoria}</div>
                    )}
                    <div className="font-semibold text-slate-900">{d.titulo}</div>
                    {d.texto && (
                      <div className="text-sm text-slate-600 mt-1 leading-relaxed">{d.texto}</div>
                    )}
                    <div className="text-xs text-slate-400 mt-2 flex flex-wrap gap-2">
                      <span>{new Date(d.publicadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      {d.anexoNome && (
                        <span>📎 {d.anexoNome}{d.anexoTamanho ? ` · ${formatTamanho(d.anexoTamanho)}` : ''}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => baixar(d)}
                    disabled={baixando === d.id}
                    className="shrink-0"
                  >
                    {baixando === d.id ? 'Baixando...' : 'Baixar'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
