import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { Button, Card, Input, Label } from '../components/ui'

export default function Redefinir() {
  const { token } = useParams()
  const nav = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setErro('')
    if (senha !== confirma) { setErro('Senhas não conferem'); return }
    setLoading(true)
    try {
      await api.post('/api/auth/redefinir', { token, senha })
      setOk(true)
      setTimeout(() => nav('/login'), 2000)
    } catch (err: any) {
      setErro(err.response?.data?.erro ?? 'Erro')
    } finally { setLoading(false) }
  }

  if (ok) return (
    <div className="min-h-full flex items-center justify-center p-6">
      <Card className="p-8 max-w-sm text-center">
        <div className="text-5xl mb-3">✓</div>
        <h1 className="text-xl font-bold mb-2">Senha redefinida</h1>
        <p className="text-sm text-slate-500">Redirecionando para login…</p>
      </Card>
    </div>
  )

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">Nova senha</h1>
        <p className="text-sm text-slate-500 mb-6">Defina uma senha de 6 dígitos.</p>
        <Card className="p-6">
          <form onSubmit={enviar} className="space-y-4">
            <div><Label>Nova senha (6 dígitos)</Label><Input inputMode="numeric" pattern="\d{6}" maxLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} required autoFocus /></div>
            <div><Label>Confirmar senha</Label><Input inputMode="numeric" pattern="\d{6}" maxLength={6} value={confirma} onChange={(e) => setConfirma(e.target.value)} required /></div>
            {erro && <div className="text-sm text-red-600">{erro}</div>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Salvando…' : 'Redefinir'}</Button>
            <Link to="/login" className="block text-center text-sm text-slate-500">Voltar</Link>
          </form>
        </Card>
      </div>
    </div>
  )
}
