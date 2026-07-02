import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { api, msgErro } from '../lib/api'
import { comprimirImagem } from '../lib/imagem'
import { Button, Input, Label, Textarea, Card } from '../components/ui'

type Config = {
  nome: string
  logoUrl?: string | null
  corPrimaria?: string | null
  identificacaoObrigatoria: boolean
  areas: { id: string; nome: string }[]
  canalNome?: string | null
  canalDescricao?: string | null
  canalAreaId?: string | null
  canalAreaNome?: string | null
}

const CATEGORIAS = [
  { v: 'Ocorrencia', l: 'Ocorrência' },
  { v: 'Manutencao', l: 'Problema de manutenção' },
  { v: 'Solicitacao', l: 'Solicitação' },
  { v: 'Reclamacao', l: 'Reclamação' },
  { v: 'SegundaViaBoleto', l: '2ª via de boleto' },
  { v: 'Informacao', l: 'Informação' },
  { v: 'Sugestao', l: 'Sugestão' },
  { v: 'Outro', l: 'Outro' },
]

const CATS_COM_MIDIA = ['Ocorrencia', 'Manutencao', 'Reclamacao']

export default function Reportar() {
  const { slug, canal } = useParams()
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
  const [video, setVideo] = useState<string | null>(null)
  const [gravando, setGravando] = useState(false)
  const [contagem, setContagem] = useState(15)
  const [enviandoVideo, setEnviandoVideo] = useState(false)
  const previewRef = useRef<HTMLVideoElement>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const url = canal
      ? `/api/publico/reportes/${slug}/config?canal=${canal}`
      : `/api/publico/reportes/${slug}/config`
    api.get(url)
      .then(r => {
        setCfg(r.data)
        if (r.data.canalAreaId) setAreaId(r.data.canalAreaId)
      })
      .catch(() => setErro('Condomínio ou canal não encontrado'))
  }, [slug, canal])

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    const rec = recRef.current
    if (rec && rec.state !== 'inactive') {
      rec.onstop = null
      rec.stop()
      rec.stream.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function adicionarFoto(files: FileList | null) {
    if (!files || files.length === 0) return
    setErro('')
    for (const f of Array.from(files)) {
      if (fotos.length >= 6) { setErro('Máximo de 6 fotos'); break }
      try {
        const blob = await comprimirImagem(f)
        const fd = new FormData()
        fd.append('file', blob, 'foto.jpg')
        const r = await api.post(`/api/publico/reportes/${slug}/foto`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        setFotos(p => [...p, r.data.url])
      } catch {
        setErro(`Falha ao enviar ${f.name}`)
      }
    }
    if (inputFile.current) inputFile.current.value = ''
  }

  async function iniciarGravacao() {
    setErro('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true })
      const mime = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm'
        : MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : ''
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      const chunks: Blob[] = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null }
        setGravando(false)
        const tipo = rec.mimeType || 'video/webm'
        const blob = new Blob(chunks, { type: tipo })
        enviarVideo(blob, tipo.includes('mp4') ? 'video.mp4' : 'video.webm')
      }
      recRef.current = rec
      if (previewRef.current) {
        previewRef.current.srcObject = stream
        previewRef.current.play().catch(() => {})
      }
      setContagem(15)
      setGravando(true)
      rec.start()
      let restante = 15
      timerRef.current = window.setInterval(() => {
        restante -= 1
        setContagem(restante)
        if (restante <= 0) pararGravacao()
      }, 1000)
    } catch {
      setErro('Não foi possível acessar a câmera/microfone')
    }
  }

  function pararGravacao() {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
  }

  async function enviarVideo(blob: Blob, nomeArq: string) {
    if (blob.size > 25 * 1024 * 1024) { setErro('Vídeo excede 25 MB'); return }
    setEnviandoVideo(true)
    try {
      const fd = new FormData()
      fd.append('file', blob, nomeArq)
      const r = await api.post(`/api/publico/reportes/${slug}/video`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setVideo(r.data.url)
    } catch (e) {
      setErro(msgErro(e, 'Falha ao enviar vídeo'))
    } finally { setEnviandoVideo(false) }
  }

  async function enviar() {
    setErro('')
    if (!titulo.trim() || !descricao.trim()) { setErro('Título e descrição são obrigatórios'); return }
    if ((cfg?.identificacaoObrigatoria || categoria === 'SegundaViaBoleto') && (!nome.trim() || !apto.trim())) {
      setErro('Nome e apartamento são obrigatórios'); return
    }
    setEnviando(true)
    try {
      const r = await api.post(`/api/publico/reportes/${slug}`, {
        categoria, areaId: areaId || null, titulo, descricao, fotos,
        nome: nome || null, bloco: bloco || null, apartamento: apto || null,
        telefone: tel || null, email: emailMor || null,
        canal: canal || null,
        video: CATS_COM_MIDIA.includes(categoria) ? video : null
      })
      setSucesso({ link: r.data.linkPublico, protocolo: r.data.protocolo })
    } catch (e) {
      setErro(msgErro(e, 'Erro ao enviar'))
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
            <div className="text-xs text-slate-700 uppercase tracking-wider">Seu protocolo</div>
            <div className="text-4xl font-bold tracking-widest mt-1">{sucesso.protocolo}</div>
            <div className="text-xs text-slate-700 mt-2">Guarde este número. Consulte o status a qualquer momento na página inicial.</div>
          </div>
          <a href={sucesso.link} target="_blank" rel="noreferrer" className="block text-sm text-slate-900 underline break-all">Ver registro completo</a>
        </Card>
      </div>
    )
  }

  if (!cfg) return <div className="p-6 text-center text-slate-700">{erro || 'Carregando...'}</div>

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          {cfg.logoUrl && <img src={cfg.logoUrl} alt="" className="h-12 mx-auto mb-2" />}
          <h1 className="text-xl font-bold">{cfg.nome}</h1>
          <p className="text-sm text-slate-700">{cfg.canalNome ?? 'Reportar para o síndico'}</p>
          {cfg.canalDescricao && <p className="text-xs text-slate-700 mt-1 max-w-md mx-auto">{cfg.canalDescricao}</p>}
          {cfg.canalAreaNome && <p className="text-xs text-slate-600 mt-1">Área: {cfg.canalAreaNome}</p>}
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
            <Label>Fotos (galeria ou câmera, até 6)</Label>
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

          {CATS_COM_MIDIA.includes(categoria) && (
            <div>
              <Label>Vídeo (até 15 segundos, opcional)</Label>
              <video ref={previewRef} muted playsInline className={gravando ? 'w-full rounded-lg bg-black mt-2' : 'hidden'} />
              {gravando && (
                <div className="flex items-center justify-between mt-2">
                  <div className="text-2xl font-bold text-red-600 tabular-nums">
                    <span className="inline-block w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2" />{contagem}s
                  </div>
                  <Button onClick={pararGravacao} className="bg-red-600">Parar gravação</Button>
                </div>
              )}
              {!gravando && !video && (
                <Button onClick={iniciarGravacao} disabled={enviandoVideo} className="w-full mt-2">
                  {enviandoVideo ? 'Enviando vídeo...' : '🎥 Gravar vídeo (15s)'}
                </Button>
              )}
              {video && !gravando && (
                <div className="relative mt-2">
                  <video src={video} controls playsInline className="w-full rounded-lg bg-black" />
                  <button onClick={() => setVideo(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white text-xs px-3 py-1.5 rounded-full">Remover</button>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <div className="font-medium text-sm mb-2">
              Identificação {cfg.identificacaoObrigatoria || categoria === 'SegundaViaBoleto' ? '*' : '(opcional)'}
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
