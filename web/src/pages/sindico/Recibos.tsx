import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card } from '../../components/ui'

type Recibo = { id: string; moradorId: string; nome: string; email: string; telefone?: string; apartamento?: string; bloco?: string; cienteEm?: string; resposta?: string; respondidoEm?: string; emailEnviadoEm?: string; emailAbertoEm?: string; visualizadoEm?: string; visualizadoCidade?: string; visualizadoEstado?: string; visualizadoPais?: string; visualizadoUserAgent?: string }

function detectarDispositivo(ua?: string) {
  if (!ua) return ''
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac OS X/i.test(ua)) return 'Mac'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Outro'
}

export default function Recibos() {
  const { id } = useParams()
  const [filtro, setFiltro] = useState<'todos' | 'lidos' | 'naolidos' | 'responderam'>('todos')
  const [data, setData] = useState<{ total: number; lidos: number; recibos: Recibo[] } | null>(null)

  useEffect(() => {
    api.get(`/api/avisos/${id}/recibos${filtro !== 'todos' ? `?filtro=${filtro}` : ''}`).then((r) => setData(r.data))
  }, [id, filtro])

  function whatsapp(r: Recibo) {
    if (!r.telefone) return alert('Sem telefone cadastrado')
    const tel = r.telefone.replace(/\D/g, '')
    const origin = window.location.origin
    const msg = `Olá! Você recebeu um aviso do condomínio. Por favor, confirme a leitura.\n\n🔔 Ative as notificações para receber direto no celular (sem instalar app):\n${origin}/ativar-notificacoes`
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <ShellSindico>
      <h1 className="text-2xl font-bold mb-2">Recibos</h1>
      {data && <div className="text-sm text-slate-500 mb-4">{data.lidos} de {data.total} leram ({Math.round(data.lidos / Math.max(1, data.total) * 100)}%)</div>}

      <div className="flex gap-2 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {(['todos', 'lidos', 'naolidos', 'responderam'] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)} className={`px-4 py-2 rounded-md text-sm ${filtro === f ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-600'}`}>
            {f === 'todos' ? 'Todos' : f === 'lidos' ? 'Lidos' : f === 'naolidos' ? 'Não lidos' : 'Responderam'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {data?.recibos.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{r.nome}</div>
                <div className="text-xs text-slate-500">{r.bloco && `${r.bloco} • `}{r.apartamento && `Apto ${r.apartamento} • `}{r.email}</div>
                {r.resposta && <div className="text-sm mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">"{r.resposta}"</div>}
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div>
                    <div className="text-slate-400">E-mail enviado</div>
                    <div>{r.emailEnviadoEm ? new Date(r.emailEnviadoEm).toLocaleString('pt-BR') : '—'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">E-mail aberto<span title="Pode ter falsos positivos: Apple Mail e Gmail pré-carregam imagens em proxies." className="ml-1 cursor-help">ⓘ</span></div>
                    <div>{r.emailAbertoEm ? new Date(r.emailAbertoEm).toLocaleString('pt-BR') : '—'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Visualizou no app</div>
                    <div>{r.visualizadoEm ? new Date(r.visualizadoEm).toLocaleString('pt-BR') : '—'}</div>
                    {r.visualizadoEm && (
                      <div className="text-slate-400 mt-0.5">
                        {detectarDispositivo(r.visualizadoUserAgent)}
                        {[r.visualizadoCidade, r.visualizadoEstado, r.visualizadoPais].filter(Boolean).length > 0 && ' • ' + [r.visualizadoCidade, r.visualizadoEstado, r.visualizadoPais].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm whitespace-nowrap">
                {r.cienteEm
                  ? <span className="text-emerald-600">✓ Ciente<br/><span className="text-xs text-slate-500">{new Date(r.cienteEm).toLocaleString('pt-BR')}</span></span>
                  : <Button variant="whatsapp" onClick={() => whatsapp(r)}>WhatsApp</Button>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ShellSindico>
  )
}
