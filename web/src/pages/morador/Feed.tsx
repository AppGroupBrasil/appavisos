import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Card } from '../../components/ui'
import { Link, useNavigate } from 'react-router-dom'

type Item = { avisoId: string; titulo: string; texto: string; categoria: string; urgente: boolean; fixado: boolean; publicadoEm: string; anexoUrl?: string; anexoNome?: string; cienteEm?: string; resposta?: string }
type Identidade = { nome: string; logoUrl?: string; descricaoCurta?: string; corPrimaria?: string }

export default function Feed() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [itens, setItens] = useState<Item[]>([])
  const [ident, setIdent] = useState<Identidade | null>(null)

  useEffect(() => {
    api.get('/api/avisos/morador/feed').then((r) => setItens(r.data))
    api.get('/api/condominio/identidade').then((r) => {
      setIdent(r.data)
      if (r.data.corPrimaria) document.documentElement.style.setProperty('--primary', r.data.corPrimaria)
    })
  }, [])

  return (
    <div className="min-h-full">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {ident?.logoUrl && <img src={ident.logoUrl} alt="" className="h-10 w-10 rounded object-cover" />}
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{ident?.nome ?? 'Carregando…'}</div>
            {ident?.descricaoCurta && <div className="text-xs text-slate-700 truncate">{ident.descricaoCurta}</div>}
          </div>
          <button onClick={() => { logout(); nav('/login') }} className="text-sm text-slate-700">Sair</button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        <div className="text-sm text-slate-700">Olá, {user?.nome}</div>
        {itens.length === 0 && <div className="text-center py-12 text-slate-700">Nenhum aviso no momento.</div>}
        {itens.map((a) => (
          <Link key={a.avisoId} to={`/aviso/${a.avisoId}`} className="block">
            <Card className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                {a.fixado && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">📌</span>}
                {a.urgente && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">URGENTE</span>}
                <span className="text-xs text-slate-700">{new Date(a.publicadoEm).toLocaleString('pt-BR')}</span>
              </div>
              <h2 className="font-semibold text-lg mb-2">{a.titulo}</h2>
              <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-500 line-clamp-3">{a.texto}</p>
              {a.anexoUrl && <div className="inline-flex mt-3 px-3 py-2 rounded bg-slate-100 dark:bg-slate-800 text-sm">📎 {a.anexoNome}</div>}
              <div className="mt-4 text-xs">
                {a.cienteEm
                  ? <span className="text-emerald-600">✓ Ciente em {new Date(a.cienteEm).toLocaleString('pt-BR')}</span>
                  : <span className="text-slate-700">Toque para abrir e responder →</span>}
              </div>
            </Card>
          </Link>
        ))}
      </main>
    </div>
  )
}
