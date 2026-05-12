import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Button, Input, Label, Card } from '../components/ui'

export default function CadastroCondominio() {
  const nav = useNavigate()
  const { setUser } = useAuth()
  const [f, setF] = useState({ nomeCondominio: '', nomeSindico: '', email: '', telefone: '', senha: '', cnpj: '' })

  function formatarCnpj(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 14)
    return d
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setLoading(true)
    try {
      const { data } = await api.post('/api/cadastro/condominio', f)
      setUser({ token: data.token, perfil: 'Sindico', nome: f.nomeSindico, condominioId: data.condominioId })
      nav('/painel')
    } catch (err: any) {
      setErro(err.response?.data?.erro ?? 'Erro')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">← Voltar</Link>
        <h1 className="text-2xl font-bold mb-1">Cadastrar condomínio</h1>
        <p className="text-sm text-slate-500 mb-6">Você será cadastrado como síndico</p>

        <Card className="p-6">
          <form onSubmit={enviar} className="space-y-4">
            <div><Label>Nome do condomínio</Label><Input value={f.nomeCondominio} onChange={(e) => setF({ ...f, nomeCondominio: e.target.value })} required /></div>
            <div><Label>Seu nome</Label><Input value={f.nomeSindico} onChange={(e) => setF({ ...f, nomeSindico: e.target.value })} required /></div>
            <div><Label>E-mail</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
            <div><Label>Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} placeholder="(11) 99999-9999" /></div>
            <div><Label>CNPJ do condomínio (opcional, facilita o cadastro dos moradores)</Label><Input value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: formatarCnpj(e.target.value) })} placeholder="00.000.000/0000-00" /></div>
            <div><Label>Senha (6 dígitos)</Label><Input inputMode="numeric" pattern="\d{6}" maxLength={6} value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} required /></div>
            {erro && <div className="text-sm text-red-600">{erro}</div>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Cadastrando…' : 'Cadastrar'}</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
