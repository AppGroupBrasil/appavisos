import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button, Card, Input, Label } from '../../components/ui'

type Info = { condominio: { id: string; nome: string; logoUrl?: string; descricaoCurta?: string }; blocos: { id: string; nome: string }[] }

export default function CadastroPublico() {
  const { slug } = useParams()
  const [info, setInfo] = useState<Info | null>(null)
  const [f, setF] = useState({ nome: '', email: '', telefone: '', blocoId: '', apartamento: '', senha: '', pin: '' })
  const [erro, setErro] = useState(''); const [ok, setOk] = useState(false); const [loading, setLoading] = useState(false)

  useEffect(() => { api.get(`/api/cadastro/info/${slug}`).then((r) => setInfo(r.data)).catch(() => setErro('Condomínio não encontrado')) }, [slug])

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setErro(''); setLoading(true)
    try {
      await api.post('/api/cadastro/morador', { slug, ...f, blocoId: f.blocoId || null })
      setOk(true)
    } catch (err: any) { setErro(err.response?.data?.erro ?? 'Erro') } finally { setLoading(false) }
  }

  if (ok) return (
    <div className="min-h-full flex items-center justify-center p-6">
      <Card className="p-8 max-w-sm text-center">
        <div className="text-5xl mb-3">✓</div>
        <h1 className="text-xl font-bold mb-2">Cadastro enviado</h1>
        <p className="text-sm text-slate-500">Aguarde a aprovação do síndico. Você receberá um e-mail quando for liberado.</p>
      </Card>
    </div>
  )

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {info && (
          <div className="text-center mb-6">
            {info.condominio.logoUrl && <img src={info.condominio.logoUrl} className="h-16 mx-auto mb-2" />}
            <div className="text-xl font-bold">{info.condominio.nome}</div>
            <div className="text-sm text-slate-500">Cadastro de morador</div>
          </div>
        )}
        <Card className="p-6">
          <form onSubmit={enviar} className="space-y-4">
            <div><Label>Nome completo</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required /></div>
            <div><Label>E-mail</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
            <div><Label>Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
            {info && info.blocos.length > 0 && (
              <div>
                <Label>Bloco</Label>
                <select value={f.blocoId} onChange={(e) => setF({ ...f, blocoId: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <option value="">—</option>
                  {info.blocos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </div>
            )}
            <div><Label>Apartamento</Label><Input value={f.apartamento} onChange={(e) => setF({ ...f, apartamento: e.target.value })} /></div>
            <div><Label>Senha (6 dígitos)</Label><Input inputMode="numeric" pattern="\d{6}" maxLength={6} value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value.replace(/\D/g, '').slice(0, 6) })} required /></div>
            <div>
              <Label>PIN para documentos (4 dígitos)</Label>
              <Input inputMode="numeric" pattern="\d{4}" maxLength={4}
                value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="0000" required />
              <div className="text-xs text-slate-500 mt-1">Usado para acessar documentos do condomínio. Pode ser diferente da sua senha.</div>
            </div>
            {erro && <div className="text-sm text-red-600">{erro}</div>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Enviando…' : 'Cadastrar'}</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
