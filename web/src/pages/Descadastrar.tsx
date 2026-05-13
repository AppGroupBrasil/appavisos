import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Button, Card } from '../components/ui'

type Info = { email: string; condominio: string; notificacoesEmail: boolean }

export default function Descadastrar() {
  const [search] = useSearchParams()
  const moradorId = search.get('m') ?? ''
  const [info, setInfo] = useState<Info | null>(null)
  const [erro, setErro] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  useEffect(() => {
    if (!moradorId) { setErro('Link inválido.'); return }
    api.get(`/api/publico/descadastrar/${moradorId}`)
      .then(r => setInfo(r.data))
      .catch(() => setErro('Não encontramos seu cadastro. O link pode estar expirado.'))
  }, [moradorId])

  async function confirmar() {
    setConfirmando(true)
    try {
      await api.post(`/api/publico/descadastrar/${moradorId}`)
      setConfirmado(true)
    } catch {
      setErro('Não foi possível concluir o descadastro. Tente novamente em instantes.')
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Cancelar notificações por e-mail</h1>

        {erro && <p className="text-sm text-red-600 mt-4">{erro}</p>}

        {!erro && !info && (
          <p className="text-sm text-slate-500 mt-4">Carregando…</p>
        )}

        {info && !confirmado && (
          <>
            {info.notificacoesEmail ? (
              <>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  Deseja deixar de receber e-mails de avisos de <b>{info.condominio}</b> em <b>{info.email}</b>?
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  Você continuará vendo avisos no app e nas notificações push (se ativadas). Apenas os e-mails serão interrompidos.
                </p>
                <div className="mt-6 flex gap-2">
                  <Button onClick={confirmar} disabled={confirmando} variant="danger">
                    {confirmando ? 'Confirmando…' : 'Sim, cancelar e-mails'}
                  </Button>
                  <Link to="/" className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 inline-flex items-center">
                    Voltar
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600 mt-3">
                Suas notificações por e-mail de <b>{info.condominio}</b> já estão desativadas.
              </p>
            )}
          </>
        )}

        {confirmado && (
          <>
            <p className="text-sm text-emerald-700 mt-3 leading-relaxed">
              ✓ Pronto. Você não receberá mais e-mails de avisos de <b>{info?.condominio}</b>.
            </p>
            <p className="text-xs text-slate-500 mt-3">
              Para voltar a receber, peça ao síndico para reativar.
            </p>
            <Link to="/" className="inline-block mt-6 text-sm text-slate-500 hover:text-slate-700">
              ← Voltar ao início
            </Link>
          </>
        )}
      </Card>
    </div>
  )
}
