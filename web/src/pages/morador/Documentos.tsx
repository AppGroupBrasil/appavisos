import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button, Card, Input, Label } from '../../components/ui'

type Doc = {
  id: string
  titulo: string
  texto: string
  anexoNome?: string | null
  anexoTamanho?: number | null
  categoria?: string | null
  publicadoEm: string
}

const STORAGE_KEY = 'doctoken'

function formatTamanho(b?: number | null) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function Documentos() {
  const { slug } = useParams()
  const [condominio, setCondominio] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')

  const [pinModal, setPinModal] = useState<Doc | null>(null)
  const [ident, setIdent] = useState('')
  const [pin, setPin] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroModal, setErroModal] = useState('')
  const [modoRecuperar, setModoRecuperar] = useState(false)
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [pinEnviado, setPinEnviado] = useState(false)

  useEffect(() => {
    api.get(`/api/publico/${slug}/documentos`)
      .then(r => { setCondominio(r.data.condominio); setLogoUrl(r.data.logoUrl); setDocs(r.data.documentos) })
      .catch(() => setErro('Condomínio não encontrado'))
  }, [slug])

  async function baixar(d: Doc) {
    const token = localStorage.getItem(STORAGE_KEY)
    if (!token) { setPinModal(d); return }
    try {
      const r = await api.get(`/api/avisos/${d.id}/anexo`, {
        responseType: 'blob', headers: { Authorization: `Bearer ${token}` }
      })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a'); a.href = url; a.download = d.anexoNome ?? 'documento'; a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      if (e?.response?.status === 401) {
        localStorage.removeItem(STORAGE_KEY); setPinModal(d)
      } else setErro('Falha ao baixar')
    }
  }

  async function autenticar() {
    setErroModal(''); setEnviando(true)
    try {
      const r = await api.post(`/api/publico/${slug}/documentos/auth`, { identificador: ident, pin })
      localStorage.setItem(STORAGE_KEY, r.data.token)
      const doc = pinModal!
      setPinModal(null); setPin(''); setIdent('')
      await baixar(doc)
    } catch (e: any) {
      setErroModal(e?.response?.data?.erro ?? 'Falha na autenticação')
    } finally { setEnviando(false) }
  }

  async function enviarRecuperacao() {
    setErroModal(''); setEnviando(true)
    try {
      await api.post(`/api/publico/${slug}/documentos/recuperar-pin`, { email: emailRecuperar })
      setPinEnviado(true)
    } catch (e: any) {
      setErroModal(e?.response?.data?.erro ?? 'Falha')
    } finally { setEnviando(false) }
  }

  const lista = busca
    ? docs.filter(d => d.titulo.toLowerCase().includes(busca.toLowerCase())
        || (d.categoria ?? '').toLowerCase().includes(busca.toLowerCase()))
    : docs

  if (erro) return <div className="p-6 text-center text-slate-500">{erro}</div>

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          {logoUrl && <img src={logoUrl} alt="" className="h-12 mx-auto mb-2" />}
          <h1 className="text-2xl font-bold">{condominio}</h1>
          <p className="text-sm text-slate-500">Documentos do condomínio</p>
        </div>

        <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por título ou categoria..." className="mb-4" />

        {lista.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 text-sm">
            {docs.length === 0 ? 'Nenhum documento publicado.' : 'Nenhum resultado para essa busca.'}
          </Card>
        ) : (
          <div className="space-y-2">
            {lista.map(d => (
              <Card key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {d.categoria && <div className="text-xs text-slate-500 mb-1">{d.categoria}</div>}
                    <div className="font-semibold">{d.titulo}</div>
                    {d.texto && <div className="text-sm text-slate-600 mt-1 line-clamp-2">{d.texto}</div>}
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(d.publicadoEm).toLocaleDateString('pt-BR')}
                      {d.anexoNome && ` · ${d.anexoNome}`}
                      {d.anexoTamanho ? ` · ${formatTamanho(d.anexoTamanho)}` : ''}
                    </div>
                  </div>
                  <Button onClick={() => baixar(d)}>Baixar</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {pinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { setPinModal(null); setModoRecuperar(false); setPinEnviado(false); setErroModal('') }}>
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            {!modoRecuperar ? (
              <>
                <h2 className="text-lg font-bold mb-1">Acesso aos documentos</h2>
                <p className="text-sm text-slate-500 mb-4">Confirme sua identidade para baixar.</p>
                <div className="space-y-3">
                  <div>
                    <Label>E-mail ou telefone cadastrado</Label>
                    <Input value={ident} onChange={e => setIdent(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <Label>PIN (4 dígitos)</Label>
                    <Input inputMode="numeric" pattern="\d{4}" maxLength={4}
                      value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="text-center text-2xl tracking-[0.5em] font-bold" />
                  </div>
                  {erroModal && <div className="text-sm text-red-600">{erroModal}</div>}
                  <Button onClick={autenticar} disabled={enviando || !ident || pin.length !== 4} className="w-full">
                    {enviando ? 'Verificando...' : 'Acessar'}
                  </Button>
                  <button type="button" onClick={() => { setModoRecuperar(true); setErroModal('') }} className="w-full text-sm text-slate-600 hover:text-slate-900 underline">
                    Esqueci meu PIN
                  </button>
                </div>
              </>
            ) : pinEnviado ? (
              <>
                <h2 className="text-lg font-bold mb-1">PIN enviado</h2>
                <p className="text-sm text-slate-600 mb-4">Se o e-mail estiver cadastrado, você receberá o novo PIN em alguns instantes.</p>
                <Button variant="secondary" onClick={() => { setModoRecuperar(false); setPinEnviado(false); setEmailRecuperar('') }} className="w-full">Voltar</Button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold mb-1">Recuperar PIN</h2>
                <p className="text-sm text-slate-500 mb-4">Enviaremos um novo PIN para seu e-mail.</p>
                <div className="space-y-3">
                  <div>
                    <Label>E-mail cadastrado</Label>
                    <Input type="email" value={emailRecuperar} onChange={e => setEmailRecuperar(e.target.value)} autoFocus />
                  </div>
                  {erroModal && <div className="text-sm text-red-600">{erroModal}</div>}
                  <Button onClick={enviarRecuperacao} disabled={enviando || !emailRecuperar} className="w-full">
                    {enviando ? 'Enviando...' : 'Enviar novo PIN'}
                  </Button>
                  <button type="button" onClick={() => setModoRecuperar(false)} className="w-full text-sm text-slate-600 hover:text-slate-900 underline">
                    Voltar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
