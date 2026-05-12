import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Button, Input, Label, Card } from '../components/ui'

const SUPORTE = '5511933284364'

export default function Login() {
  const nav = useNavigate()
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [show, setShow] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'sindico' | 'morador'>('sindico')
  const [lembrar, setLembrar] = useState(false)

  useEffect(() => {
    const salvo = localStorage.getItem('login-lembrado')
    if (salvo) {
      try {
        const d = JSON.parse(salvo)
        setEmail(d.email ?? '')
        setSenha(d.senha ?? '')
        setTipo(d.tipo ?? 'sindico')
        setLembrar(true)
      } catch { /* ignora */ }
    }
  }, [])

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setLoading(true)
    try {
      const { data } = await api.post(`/api/auth/${tipo}/login`, { email, senha })
      if (lembrar) localStorage.setItem('login-lembrado', JSON.stringify({ email, senha, tipo }))
      else localStorage.removeItem('login-lembrado')
      setUser(data)
      if (data.perfil === 'Master') nav('/master')
      else if (data.perfil === 'Morador') nav('/feed')
      else nav('/painel')
    } catch (err: any) {
      setErro(err.response?.data?.erro ?? 'Erro ao entrar')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold tracking-tight">App Avisos</div>
          <div className="text-sm text-slate-700 mt-1">Avisos do seu condomínio</div>
        </div>

        <Card className="p-6">
          <div className="flex gap-2 mb-5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button type="button" onClick={() => setTipo('sindico')}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${tipo === 'sindico' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600'}`}>Síndico</button>
            <button type="button" onClick={() => setTipo('morador')}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${tipo === 'morador' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600'}`}>Morador</button>
          </div>

          <form onSubmit={entrar} className="space-y-4">
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <Label>Senha (6 dígitos)</Label>
              <div className="relative">
                <Input type={show ? 'text' : 'password'} inputMode="numeric" pattern="\d{6}" maxLength={6}
                  value={senha} onChange={(e) => setSenha(e.target.value)} required />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-600 text-sm">
                  {show ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-600 select-none cursor-pointer">
              <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="rounded" />
              Lembrar e-mail e senha neste dispositivo
            </label>
            {erro && <div className="text-sm text-red-600">{erro}</div>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
            <div className="text-center text-sm">
              <Link to="/recuperar" className="text-slate-700 hover:text-slate-700">Esqueci minha senha</Link>
            </div>
          </form>
        </Card>

        <Link to="/cadastrar-condominio" className="block mt-4">
          <Button variant="secondary" className="w-full">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/><path d="M14 9h1"/><path d="M14 13h1"/><path d="M14 17h1"/></svg>
            Cadastrar condomínio
          </Button>
        </Link>

        <Link to="/sou-morador" className="block mt-2">
          <Button variant="secondary" className="w-full">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Cadastrar-se como morador
          </Button>
        </Link>

        <a href={`https://wa.me/${SUPORTE}?text=${encodeURIComponent('Olá, preciso de suporte do App Avisos')}`}
          target="_blank" rel="noopener" className="block mt-3">
          <Button variant="whatsapp" className="w-full">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Suporte
          </Button>
        </a>

        <div className="text-center mt-4 text-xs text-slate-700">
          <Link to="/privacidade" className="hover:text-slate-700">Privacidade</Link> · <Link to="/termos" className="hover:text-slate-700">Termos</Link>
        </div>
      </div>
    </div>
  )
}
