import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ShellSindico } from '../../components/Layout'
import { Button, Card, Input, Label, Textarea } from '../../components/ui'

export default function Identidade() {
  const [f, setF] = useState({ nome: '', descricaoCurta: '', endereco: '', cnpj: '', telefoneContato: '', emailContato: '', site: '', corPrimaria: '#0F172A' })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    api.get('/api/condominio/identidade').then((r) => {
      setF({
        nome: r.data.nome ?? '', descricaoCurta: r.data.descricaoCurta ?? '',
        endereco: r.data.endereco ?? '', cnpj: r.data.cnpj ?? '',
        telefoneContato: r.data.telefoneContato ?? '', emailContato: r.data.emailContato ?? '',
        site: r.data.site ?? '', corPrimaria: r.data.corPrimaria ?? '#0F172A',
      })
      setLogoUrl(r.data.logoUrl)
    })
  }, [])

  async function uploadLogo(file: File) {
    const fd = new FormData(); fd.append('file', file)
    const { data } = await api.post('/api/uploads/logo', fd)
    setLogoUrl(data.url)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    await api.put('/api/condominio/identidade', f)
    setSalvo(true); setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <ShellSindico>
      <h1 className="text-2xl font-bold mb-2">Identidade do condomínio</h1>
      <p className="text-sm text-slate-500 mb-6">Aparece no cabeçalho do app e nos e-mails</p>

      <form onSubmit={salvar} className="max-w-2xl space-y-4">
        <Card className="p-5 space-y-4">
          <div>
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {logoUrl && <img src={logoUrl} alt="" className="h-16 w-16 object-cover rounded" />}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} className="text-sm" />
            </div>
          </div>
          <div><Label>Nome do condomínio</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required /></div>
          <div><Label>Descrição curta</Label><Textarea rows={2} value={f.descricaoCurta} onChange={(e) => setF({ ...f, descricaoCurta: e.target.value })} /></div>
          <div><Label>Endereço</Label><Input value={f.endereco} onChange={(e) => setF({ ...f, endereco: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>CNPJ</Label><Input value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={f.telefoneContato} onChange={(e) => setF({ ...f, telefoneContato: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>E-mail de contato</Label><Input type="email" value={f.emailContato} onChange={(e) => setF({ ...f, emailContato: e.target.value })} /></div>
            <div><Label>Site</Label><Input value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} /></div>
          </div>
          <div>
            <Label>Cor primária</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={f.corPrimaria} onChange={(e) => setF({ ...f, corPrimaria: e.target.value })} className="w-12 h-10 rounded border border-slate-300" />
              <Input value={f.corPrimaria} onChange={(e) => setF({ ...f, corPrimaria: e.target.value })} className="flex-1" />
            </div>
          </div>
        </Card>
        <div className="flex items-center gap-2">
          <Button type="submit">Salvar</Button>
          {salvo && <span className="text-sm text-emerald-600">✓ Salvo</span>}
        </div>
      </form>
    </ShellSindico>
  )
}
