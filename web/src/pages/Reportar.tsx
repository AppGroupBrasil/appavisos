import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { Button, Input, Label, Textarea, Card } from '../components/ui'

type Config = {
  nome: string
  logoUrl?: string | null
  corPrimaria?: string | null
  identificacaoObrigatoria: boolean
  areas: { id: string; nome: string }[]
}

const CATEGORIAS = [
  { v: 'Ocorrencia', l: 'Ocorrência' },
  { v: 'Manutencao', l: 'Problema de manutenção' },
  { v: 'Reclamacao', l: 'Reclamação' },
  { v: 'Sugestao', l: 'Sugestão' },
  { v: 'Outro', l: 'Outro' },
]

export default function Reportar() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const areaPreId = params.get('area')
  const [cfg, setCfg] = useState<Config | null>(null)
  const [categoria, setCategoria] = useState('Ocorrencia')
  const [areaId, setAreaId] = useState(areaPreId ?? '')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [nome, setNome] = useState('')
  const [bloco, setBloco] = useState('')
  const [apto, setApto] = useState('')
  const [tel, setTel] = useState('')
  const [emailMor, setEmailMor] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState<{ link: string; protocolo: string } | null>(null)
  const inputFile = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get(`/api/publico/reportes/${slug}/config`)
      .then(r => setCfg(r.data))
      .catch(() => setErro('Condomínio não encontrado'))
  }, [slug])

  async function adicionarFoto(files: FileList | null) {
    if (!files || files.length === 0) return
    setErro('')
    for (const f of Array.from(files)) {
      if (fotos.length >= 5) { setErro('Máximo de 5 fotos'); break }
      if (f.size > 5 * 1024 * 1024) { setErro(`${f.name} acima de 5MB`); continue }
      const fd = new FormData()
      fd.append('file', f)
      try {
        const r = await api.post(`/api/publico/reportes/${slug}/foto`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        setFotos(p => [...p, r.data.url])
      } catch {
        setErro(`Falha ao enviar ${f.name}`)
      }
    }
    if (inputFile.current) inputFile.current.value = ''
  }

  async function enviar() {
    setErro('')
    if (!titulo.trim() || !descricao.trim()) { setErro('Título e descrição são obrigatórios'); return }
    if (cfg?.identificacaoObrigatoria && (!nome.trim() || !apto.trim())) {
      setErro('Nome e apartamento são obrigatórios'); return
    }
    setEnviando(true)
    try {
      const r = await api.post(`/api/publico/reportes/${slug}`, {
        categoria, areaId: areaId || null, titulo, descricao, fotos,
        nome: nome || null, bloco: bloco || null, apartamento: apto || null,
        telefone: tel || null, email: emailMor || null
      })
      setSucesso({ link: r.data.linkPublico, protocolo: r.data.protocolo })
    } catch (e: any) {
      setErro(e?.response?.data?.erro ?? 'Erro ao enviar')
    } finally { setEnviando(false) }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-xl font-bold mb-2">Enviado com sucesso!</h1>
          <p className="text-slate-600 text-sm mb-4">O síndico foi notificado.</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Seu protocolo</div>
            <div className="text-4xl font-bold tracking-widest mt-1">{sucesso.protocolo}</div>
            <div className="text-xs text-slate-500 mt-2">Guarde este número. Consulte o status a qualquer momento na página inicial.</div>
          </div>
          <a href={sucesso.link} target="_blank" rel="noreferrer" className="block text-sm text-slate-900 underline break-all">Ver registro completo</a>
        </Card>
      </div>
    )
  }

  if (!cfg) return <div className="p-6 text-center text-slate-500">{erro || 'Carregando...'}</div>

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          {cfg.logoUrl && <img src={cfg.logoUrl} alt="" className="h-12 mx-auto mb-2" />}
          <h1 className="text-xl font-bold">{cfg.nome}</h1>
          <p className="text-sm text-slate-500">Reportar para o síndico</p>
        </div>

        <Card className="p-5 space-y-4">
          <div>
            <Label>Categoria</Label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white">
              {CATEGORIAS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          </div>

          {cfg.areas.length > 0 && (
            <div>
              <Label>Área (opcional)</Label>
              <select value={areaId} onChange={e => setAreaId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white">
                <option value="">— Nenhuma —</option>
                {cfg.areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
          )}

          <div>
            <Label>Título *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={160} placeholder="Ex.: Lâmpada queimada no elevador" />
          </div>

          <div>
            <Label>Descrição *</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={5} placeholder="Descreva a situação com detalhes" />
          </div>

          <div>
            <Label>Fotos (galeria ou câmera, até 5)</Label>
            <input
              ref={inputFile}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={e => adicionarFoto(e.target.files)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white"
            />
            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {fotos.map((f, i) => (
                  <div key={i} className="relative">
                    <img src={f} alt="" className="w-full h-24 object-cover rounded-lg border" />
                    <button onClick={() => setFotos(p => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs w-6 h-6 rounded-full">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="font-medium text-sm mb-2">
              Identificação {cfg.identificacaoObrigatoria ? '*' : '(opcional)'}
            </div>
            <div className="space-y-3">
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" maxLength={160} />
              <div className="grid grid-cols-2 gap-3">
                <Input value={bloco} onChange={e => setBloco(e.target.value)} placeholder="Bloco" maxLength={80} />
                <Input value={apto} onChange={e => setApto(e.target.value)} placeholder="Apartamento" maxLength={20} />
              </div>
              <Input value={tel} onChange={e => setTel(e.target.value)} placeholder="Telefone (para resposta no WhatsApp)" maxLength={30} />
              <Input type="email" value={emailMor} onChange={e => setEmailMor(e.target.value)} placeholder="E-mail (para resposta por e-mail)" maxLength={200} />
            </div>
          </div>

          {erro && <div className="text-sm text-red-600">{erro}</div>}
          <Button onClick={enviar} disabled={enviando} className="w-full">
            {enviando ? 'Enviando...' : 'Enviar para o síndico'}
          </Button>
        </Card>
      </div>
    </div>
  )
}
