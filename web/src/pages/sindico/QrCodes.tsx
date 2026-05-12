import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Card } from '../../components/ui'

type Area = { id: string; nome: string; slug: string }

export default function QrCodes() {
  const [slug, setSlug] = useState('')
  const [areas, setAreas] = useState<Area[]>([])
  useEffect(() => {
    api.get('/api/condominio/identidade').then((r) => setSlug(r.data.slug))
    api.get('/api/areas').then((r) => setAreas(r.data))
  }, [])

  return (
    <ShellSindico>
      <h1 className="text-2xl font-bold mb-2">QR Codes</h1>
      <p className="text-sm text-slate-500 mb-6">Imprima e cole no mural ou nas áreas do condomínio.</p>

      <div className="grid md:grid-cols-2 gap-4 max-w-3xl mb-6">
        <Card className="p-5">
          <h2 className="font-semibold mb-3">QR de cadastro</h2>
          <p className="text-sm text-slate-500 mb-4">Morador escaneia, preenche cadastro e fica pendente até você aprovar.</p>
          <QrComBotao endpoint="/api/qr/cadastro.png" arquivo={`qr-cadastro-${slug}.png`} />
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold mb-3">QR do mural (geral)</h2>
          <p className="text-sm text-slate-500 mb-4">Morador escaneia e vê todos os avisos atualizados — sempre o mesmo QR.</p>
          <QrComBotao endpoint="/api/qr/feed.png" arquivo={`qr-mural-${slug}.png`} />
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold mb-3">QR de reportes (geral)</h2>
          <p className="text-sm text-slate-500 mb-4">Morador escaneia e abre formulário para reportar ocorrências, manutenção, reclamações, sugestões.</p>
          <QrComBotao endpoint="/api/qr/reportar.png" arquivo={`qr-reportar-${slug}.png`} />
        </Card>
      </div>

      <h2 className="text-lg font-semibold mb-2">QR Code por área</h2>
      <p className="text-sm text-slate-500 mb-4">Cole o QR no local da área (salão, academia, piscina). Quem escaneia vê só os avisos daquela área específica.</p>
      {areas.length === 0 ? (
        <Card className="p-6 text-center text-slate-500 text-sm">Nenhuma área cadastrada. Acesse o menu <b>Áreas</b> para criar.</Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl">
          {areas.map((a) => (
            <Card key={a.id} className="p-5">
              <h3 className="font-semibold mb-3">{a.nome}</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Avisos da área</div>
                  <QrComBotao endpoint={`/api/qr/area/${a.id}.png`} arquivo={`qr-area-${a.slug}.png`} />
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <div className="text-xs font-medium text-slate-500 mb-1">Reportar nesta área</div>
                  <QrComBotao endpoint={`/api/qr/reportar/area/${a.id}.png`} arquivo={`qr-reportar-${a.slug}.png`} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </ShellSindico>
  )
}

function QrComBotao({ endpoint, arquivo }: { endpoint: string; arquivo: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    api.get(endpoint, { responseType: 'blob' }).then((r) => setSrc(URL.createObjectURL(r.data)))
  }, [endpoint])
  return (
    <div className="text-center">
      {src ? <img src={src} alt="" className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto bg-slate-100 dark:bg-slate-800" />}
      {src && <a href={src} download={arquivo} className="inline-block mt-3 text-sm text-slate-600 hover:underline">Baixar PNG</a>}
    </div>
  )
}
