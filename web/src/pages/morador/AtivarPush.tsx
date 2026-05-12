import { useState } from 'react'
import { api } from '../../lib/api'
import { Button, Card } from '../../components/ui'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64); const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export default function AtivarPush() {
  const [estado, setEstado] = useState<'idle' | 'pedindo' | 'ok' | 'erro' | 'negado'>('idle')
  const [msg, setMsg] = useState('')

  async function ativar() {
    setEstado('pedindo')
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setEstado('erro'); setMsg('Seu navegador não suporta notificações. No iPhone, adicione à tela de início primeiro.'); return
      }
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setEstado('negado'); return }

      const reg = await navigator.serviceWorker.ready
      const { data: { chave } } = await api.get('/api/push/chave-publica')
      if (!chave) { setEstado('erro'); setMsg('Push não configurado no servidor'); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(chave),
      })
      const j = sub.toJSON() as any
      await api.post('/api/push/assinar', { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth })
      setEstado('ok')
    } catch (err: any) {
      setEstado('erro'); setMsg(err.message ?? 'Erro')
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <Card className="p-8 max-w-sm text-center">
        <div className="text-5xl mb-3">📱</div>
        <h1 className="text-xl font-bold mb-2">Ativar notificações</h1>
        <p className="text-sm text-slate-700 mb-6">Receba os avisos do condomínio direto no seu celular, mesmo com o app fechado.</p>

        {estado === 'ok' && <div className="text-emerald-600 font-medium">✓ Notificações ativadas</div>}
        {estado === 'negado' && <div className="text-red-600 text-sm">Você bloqueou. Habilite nas configurações do navegador.</div>}
        {estado === 'erro' && <div className="text-red-600 text-sm">{msg}</div>}
        {estado !== 'ok' && <Button onClick={ativar} disabled={estado === 'pedindo'} className="w-full">{estado === 'pedindo' ? 'Aguarde…' : 'Ativar'}</Button>}

        <div className="mt-6 text-xs text-slate-700 text-left space-y-1">
          <div className="font-medium text-slate-700 dark:text-slate-500">No iPhone:</div>
          <div>1. Toque em Compartilhar (□↑) → "Adicionar à Tela de Início"</div>
          <div>2. Abra o ícone do App Avisos na tela de início</div>
          <div>3. Toque em Ativar acima</div>
        </div>
      </Card>
    </div>
  )
}
