import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { Card } from '../../components/ui'

export default function Documentos() {
  const { user } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    if (user?.perfil === 'Morador') {
      nav('/meus-documentos', { replace: true })
    }
  }, [user, nav])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-sm w-full p-8 text-center">
        <div className="text-4xl mb-4">📄</div>
        <h1 className="text-xl font-bold mb-2">Documentos do condomínio</h1>
        <p className="text-sm text-slate-600 mb-6">
          Faça login para acessar os documentos publicados pelo síndico.
        </p>
        <button
          onClick={() => nav('/login')}
          className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          Entrar
        </button>
        <p className="text-xs text-slate-500 mt-4">
          Ainda não tem cadastro?{' '}
          <button onClick={() => nav('/sou-morador')} className="underline text-slate-700 hover:text-slate-900">
            Cadastre-se aqui
          </button>
        </p>
      </Card>
    </div>
  )
}
