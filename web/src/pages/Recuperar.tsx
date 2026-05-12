import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Button, Card, Input, Label } from '../components/ui'

export default function Recuperar() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    try { await api.post('/api/auth/recuperar', { email }); setEnviado(true) }
    finally { setLoading(false) }
  }

  if (enviado) return (
    <div className="min-h-full flex items-center justify-center p-6">
      <Card className="p-8 max-w-sm text-center">
        <div className="text-5xl mb-3">📧</div>
        <h1 className="text-xl font-bold mb-2">Verifique seu e-mail</h1>
        <p className="text-sm text-slate-500">Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. Válido por 2 horas.</p>
        <Link to="/login" className="inline-block mt-6 text-sm text-slate-600 hover:underline">Voltar para login</Link>
      </Card>
    </div>
  )

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">← Voltar</Link>
        <h1 className="text-2xl font-bold mb-1">Esqueci minha senha</h1>
        <p className="text-sm text-slate-500 mb-6">Vamos enviar um link de redefinição para seu e-mail.</p>
        <Card className="p-6">
          <form onSubmit={enviar} className="space-y-4">
            <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Enviando…' : 'Enviar link'}</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
