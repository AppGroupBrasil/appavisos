import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Card } from '../components/ui'

type Aviso = {
  id: string; titulo: string; texto?: string; urgente: boolean; fixado: boolean
  publicadoEm: string; anexoUrl?: string; anexoNome?: string
}
type Area = { nome: string }
type Cond = { nome: string; logoUrl?: string; corPrimaria?: string }

export default function MuralArea() {
  const { slug, areaSlug } = useParams()
  const [cond, setCond] = useState<Cond | null>(null)
  const [area, setArea] = useState<Area | null>(null)
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.get(`/api/publico/${slug}/area/${areaSlug}`)
      .then(r => {
        setCond(r.data.condominio)
        setArea(r.data.area)
        setAvisos(r.data.avisos)
        if (r.data.condominio.corPrimaria)
          document.documentElement.style.setProperty('--primary', r.data.condominio.corPrimaria)
      })
      .catch(() => setErro('Área não encontrada ou indisponível.'))
  }, [slug, areaSlug])

  if (erro) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-slate-600 text-center">{erro}</div>
    </div>
  )
  if (!cond || !area) return <div className="p-6 text-center text-slate-500">Carregando...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {cond.logoUrl && <img src={cond.logoUrl} alt="" className="h-10 w-10 rounded object-cover" />}
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{cond.nome}</div>
            <div className="text-xs text-slate-500 truncate">Área: {area.nome}</div>
          </div>
          <Link to={`/c/${slug}`} className="text-xs text-slate-500 hover:text-slate-800 shrink-0">
            ← Mural geral
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        <div className="text-xs text-slate-500 text-center py-2">Avisos de {area.nome}</div>
        {avisos.length === 0 ? (
          <div className="text-center py-16 text-slate-500">Nenhum aviso para esta área no momento.</div>
        ) : (
          avisos.map(a => (
            <Card key={a.id} className="p-5">
              <div className="flex items-center gap-2 mb-2">
                {a.fixado && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">📌</span>}
                {a.urgente && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">URGENTE</span>}
                <span className="text-xs text-slate-500">{new Date(a.publicadoEm).toLocaleString('pt-BR')}</span>
              </div>
              <h2 className="font-semibold text-lg mb-1">{a.titulo}</h2>
              {a.texto && <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.texto}</p>}
              {a.anexoUrl && (
                <div className="inline-flex mt-3 px-3 py-2 rounded bg-slate-100 text-sm">📎 {a.anexoNome}</div>
              )}
            </Card>
          ))
        )}
      </main>
    </div>
  )
}
