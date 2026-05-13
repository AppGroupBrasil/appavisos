import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Card } from '../../components/ui'

type CardItem = { key: string; titulo: string; descricao: string; endpoint: string; arquivo: string; preview: string; customId?: string }
type QrCustom = { id: string; titulo: string; descricao: string; url: string; ordem: number }
type Cond = { nome: string; logoUrl?: string; slug: string }

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}

export default function QrCodes() {
  const [cond, setCond] = useState<Cond | null>(null)
  const [personalizados, setPersonalizados] = useState<QrCustom[]>([])
  const [imgSrcs, setImgSrcs] = useState<Record<string, string>>({})
  const [titulos, setTitulos] = useState<Record<string, string>>({})
  const [desc, setDesc] = useState<Record<string, string>>({})
  const [novo, setNovo] = useState<{ titulo: string; descricao: string; url: string } | null>(null)
  const [salvando, setSalvando] = useState(false)

  function carregarPersonalizados() {
    api.get('/api/qr-personalizados').then(r => setPersonalizados(r.data))
  }

  useEffect(() => {
    api.get('/api/condominio/identidade').then(r =>
      setCond({ nome: r.data.nome, logoUrl: r.data.logoUrl, slug: r.data.slug })
    )
    carregarPersonalizados()
  }, [])

  const slug = cond?.slug ?? ''
  const base = window.location.origin

  const fixos: CardItem[] = slug ? [
    { key: 'cadastro', titulo: 'Cadastro de morador',  descricao: 'Escaneie para se cadastrar como morador do condomínio.',          endpoint: '/api/qr/cadastro.png', arquivo: `qr-cadastro-${slug}.png`,  preview: `${base}/cadastro/${slug}` },
    { key: 'feed',     titulo: 'Mural de avisos',       descricao: 'Escaneie para ver os avisos e comunicados do condomínio.',         endpoint: '/api/qr/feed.png',     arquivo: `qr-mural-${slug}.png`,    preview: `${base}/c/${slug}` },
    { key: 'reportar', titulo: 'Solicitações',           descricao: 'Escaneie para enviar uma solicitação ou registrar uma ocorrência.', endpoint: '/api/qr/reportar.png', arquivo: `qr-reportar-${slug}.png`, preview: `${base}/c/${slug}/reportar` },
  ] : []

  const cards: CardItem[] = [
    ...fixos,
    ...personalizados.map(p => ({
      key: `custom-${p.id}`,
      titulo: p.titulo,
      descricao: p.descricao,
      endpoint: `/api/qr/personalizado/${p.id}.png`,
      arquivo: `qr-personalizado-${p.id}.png`,
      preview: p.url,
      customId: p.id,
    })),
  ]

  const totalCarregados = cards.filter(c => imgSrcs[c.key]).length
  const todosCarregados = cards.length > 0 && totalCarregados === cards.length
  const pages = chunk(cards, 4)

  async function criarQr() {
    if (!novo || !novo.titulo.trim() || !novo.url.trim()) return
    setSalvando(true)
    try {
      const r = await api.post('/api/qr-personalizados', novo)
      setPersonalizados(ps => [...ps, r.data])
      setNovo(null)
    } finally {
      setSalvando(false)
    }
  }

  async function excluirQr(id: string) {
    if (!confirm('Excluir este QR Code?')) return
    await api.delete(`/api/qr-personalizados/${id}`)
    const key = `custom-${id}`
    setPersonalizados(ps => ps.filter(p => p.id !== id))
    setImgSrcs(s => { const n = { ...s }; delete n[key]; return n })
    setTitulos(t => { const n = { ...t }; delete n[key]; return n })
    setDesc(d => { const n = { ...d }; delete n[key]; return n })
  }

  return (
    <ShellSindico>
      <style>{`
        @media print {
          body > * { visibility: hidden; }
          #qr-print, #qr-print * { visibility: visible; }
          #qr-print { position: fixed; inset: 0; background: white; padding: 0; }
        }
        @page { size: A4 portrait; margin: 12mm; }
      `}</style>

      {/* ── Tela ── */}
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">QR Codes</h1>
          <button
            onClick={() => window.print()}
            disabled={!todosCarregados}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            🖨️&nbsp;{todosCarregados
              ? 'Imprimir folha A4'
              : `Carregando… ${totalCarregados}/${cards.length}`}
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Edite o título e descrição de cada QR Code. Adicione QR Codes personalizados apontando para qualquer URL. Clique em <b>Imprimir folha A4</b> para imprimir 4 por página.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {cards.map(c => (
            <Card key={c.key} className="p-5">
              <div className="flex items-start gap-2 mb-2">
                <input
                  value={titulos[c.key] ?? c.titulo}
                  onChange={e => setTitulos(t => ({ ...t, [c.key]: e.target.value }))}
                  className="flex-1 font-semibold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-400 focus:outline-none py-0.5 transition-colors"
                />
                {c.customId && (
                  <button
                    onClick={() => excluirQr(c.customId!)}
                    className="text-slate-300 hover:text-red-500 transition-colors text-xs shrink-0 mt-0.5"
                    title="Excluir"
                  >✕</button>
                )}
              </div>
              <textarea
                value={desc[c.key] ?? c.descricao}
                onChange={e => setDesc(d => ({ ...d, [c.key]: e.target.value }))}
                placeholder="Descrição (opcional)"
                className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg p-2 resize-none mb-2 focus:outline-none focus:border-slate-400"
                rows={2}
              />
              <a href={c.preview} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 mb-3 transition-colors truncate max-w-full">
                {c.customId ? c.preview : 'Ver página →'}
              </a>
              <QrComBotao
                endpoint={c.endpoint}
                arquivo={c.arquivo}
                onLoad={url => setImgSrcs(s => ({ ...s, [c.key]: url }))}
              />
            </Card>
          ))}

          {/* Card de adicionar QR personalizado */}
          {novo ? (
            <Card className="p-5 border-dashed">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Novo QR Code</div>
              <input
                placeholder="Título *"
                value={novo.titulo}
                onChange={e => setNovo(n => n && ({ ...n, titulo: e.target.value }))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:border-slate-400"
              />
              <input
                placeholder="URL de destino *"
                value={novo.url}
                onChange={e => setNovo(n => n && ({ ...n, url: e.target.value }))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:border-slate-400"
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={novo.descricao}
                onChange={e => setNovo(n => n && ({ ...n, descricao: e.target.value }))}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 mb-3 resize-none focus:outline-none focus:border-slate-400"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={criarQr}
                  disabled={salvando || !novo.titulo.trim() || !novo.url.trim()}
                  className="flex-1 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  {salvando ? 'Salvando…' : 'Criar'}
                </button>
                <button
                  onClick={() => setNovo(null)}
                  className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </Card>
          ) : (
            <button
              onClick={() => setNovo({ titulo: '', descricao: '', url: '' })}
              className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors min-h-[200px]"
            >
              <span className="text-2xl">+</span>
              <span className="text-sm">Adicionar QR Code</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Impressão A4 ── */}
      <div id="qr-print" style={{ display: 'none' }}>
        {pages.map((page, pi) => (
          <div
            key={pi}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '6mm',
              height: '273mm',
              pageBreakAfter: pi < pages.length - 1 ? 'always' : 'auto',
            }}
          >
            {page.map(c => {
              const tituloFinal = titulos[c.key] ?? c.titulo
              const descFinal = desc[c.key] ?? c.descricao
              return (
                <div
                  key={c.key}
                  style={{
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    overflow: 'hidden',
                    fontFamily: 'Inter, Arial, sans-serif',
                  }}
                >
                  <div style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                    padding: '5mm 6mm 4mm',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3mm',
                  }}>
                    {cond?.logoUrl && (
                      <img src={cond.logoUrl} alt="" style={{ height: '8mm', width: '8mm', borderRadius: '2px', objectFit: 'cover' }} />
                    )}
                    <span style={{ fontSize: '8pt', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                      {cond?.nome ?? ''}
                    </span>
                  </div>

                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '5mm 6mm',
                    gap: '3mm',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '13pt', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, maxWidth: '75mm' }}>
                      {tituloFinal}
                    </div>
                    {descFinal && (
                      <div style={{ fontSize: '9pt', color: '#475569', maxWidth: '72mm', lineHeight: 1.5 }}>
                        {descFinal}
                      </div>
                    )}
                    <div style={{ marginTop: '2mm' }}>
                      {imgSrcs[c.key]
                        ? <img src={imgSrcs[c.key]} alt="" style={{ width: '68mm', height: '68mm' }} />
                        : <div style={{ width: '68mm', height: '68mm', background: '#f1f5f9', borderRadius: '4px' }} />}
                    </div>
                  </div>

                  <div style={{
                    width: '100%',
                    borderTop: '1px solid #e2e8f0',
                    padding: '3mm 6mm',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '8pt', color: '#64748b' }}>
                      📱 Aponte a câmera do celular para o código
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </ShellSindico>
  )
}

function QrComBotao({
  endpoint, arquivo, onLoad,
}: {
  endpoint: string; arquivo: string; onLoad?: (url: string) => void
}) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    api.get(endpoint, { responseType: 'blob' }).then(r => {
      const url = URL.createObjectURL(r.data)
      setSrc(url)
      onLoad?.(url)
    })
  }, [endpoint])

  return (
    <div className="text-center">
      {src
        ? <img src={src} alt="" className="w-40 h-40 mx-auto" />
        : <div className="w-40 h-40 mx-auto bg-slate-100 rounded animate-pulse" />}
      {src && (
        <a href={src} download={arquivo} className="inline-block mt-3 text-sm text-slate-600 hover:underline">
          Baixar PNG
        </a>
      )}
    </div>
  )
}
