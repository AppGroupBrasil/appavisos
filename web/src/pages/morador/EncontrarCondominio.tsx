import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button, Card, Input, Label } from '../../components/ui'

export default function EncontrarCondominio() {
  const nav = useNavigate()
  const [tab, setTab] = useState<'cnpj' | 'codigo'>('cnpj')
  const [cnpj, setCnpj] = useState('')
  const [slug, setSlug] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  function formatarCnpj(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 14)
    return d
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setLoading(true)
    try {
      if (tab === 'cnpj') {
        const d = cnpj.replace(/\D/g, '')
        if (d.length !== 14) { setErro('CNPJ deve ter 14 dígitos'); return }
        const { data } = await api.get(`/api/cadastro/por-cnpj/${d}`)
        nav(`/cadastro/${data.slug}`)
      } else {
        const s = slug.trim().toLowerCase().replace(/\s+/g, '-')
        await api.get(`/api/cadastro/info/${s}`)
        nav(`/cadastro/${s}`)
      }
    } catch (err: any) {
      setErro(err.response?.data?.erro ?? 'Condomínio não encontrado. Confira com o síndico.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">← Voltar</Link>
        <h1 className="text-2xl font-bold mb-1">Cadastrar-se como morador</h1>
        <p className="text-sm text-slate-500 mb-6">Informe o CNPJ do seu condomínio (você encontra no boleto) ou o código fornecido pelo síndico.</p>

        <Card className="p-6">
          <div className="flex gap-2 mb-5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button type="button" onClick={() => setTab('cnpj')}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${tab === 'cnpj' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600'}`}>CNPJ</button>
            <button type="button" onClick={() => setTab('codigo')}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${tab === 'codigo' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600'}`}>Código</button>
          </div>

          <form onSubmit={buscar} className="space-y-4">
            {tab === 'cnpj' ? (
              <div>
                <Label>CNPJ do condomínio</Label>
                <Input inputMode="numeric" value={cnpj} onChange={(e) => setCnpj(formatarCnpj(e.target.value))} placeholder="00.000.000/0000-00" required autoFocus />
              </div>
            ) : (
              <div>
                <Label>Código do condomínio</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ex: condominio-teste" required autoFocus />
              </div>
            )}
            {erro && <div className="text-sm text-red-600">{erro}</div>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Buscando…' : 'Continuar'}</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
