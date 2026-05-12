import { Link } from 'react-router-dom'

const WHATS = '5511933284364'
const wppLink = (msg: string) => `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`

const features = [
  { titulo: 'Avisos por e-mail e push', desc: 'Envio automático para todos os moradores, com confirmação de leitura e ciência.' },
  { titulo: 'Multi-bloco e multi-área', desc: 'Avisos segmentados por bloco, torre ou área de lazer. Cada morador vê apenas o que importa.' },
  { titulo: 'Cadastro por QR Code', desc: 'Imprima o QR e cole no elevador. Morador cadastra em 30 segundos pelo celular.' },
  { titulo: 'Recibos e rastreio', desc: 'Veja quem abriu o e-mail, quem deu ciência e quem respondeu — em tempo real.' },
  { titulo: 'Timeline do condomínio', desc: 'Linha do tempo com todos os comunicados, ocorrências e respostas dos moradores.' },
  { titulo: 'Painel do síndico', desc: 'Criação de avisos em segundos. Anexos, urgência, validade e agendamento.' },
  { titulo: 'Identidade do condomínio', desc: 'Logo, cor e nome do seu condomínio em todos os e-mails e telas.' },
  { titulo: 'Importação em massa', desc: 'Suba a planilha com seus moradores e blocos. Pronto em minutos.' },
  { titulo: 'PWA — funciona como app', desc: 'Morador instala no celular e recebe notificações como um aplicativo nativo.' },
  { titulo: 'LGPD e segurança', desc: 'Senhas criptografadas, JWT, backup diário e isolamento por condomínio.' },
]

const planos = [
  {
    nome: 'Essencial',
    preco: 99,
    sub: 'até 200 unidades',
    bullets: ['Avisos ilimitados', 'E-mail + Push', 'Recibos e ciência', 'Cadastro por QR', 'Suporte por WhatsApp'],
  },
  {
    nome: 'Profissional',
    preco: 199,
    sub: 'acima de 200 unidades',
    destaque: true,
    bullets: ['Tudo do Essencial', 'Multi-bloco / multi-área', 'Timeline do condomínio', 'Importação em massa', 'Identidade personalizada'],
  },
  {
    nome: 'Administradora',
    preco: 350,
    sub: 'condomínios ilimitados',
    bullets: ['Tudo do Profissional', 'Painel Master', 'Quantos condomínios quiser', 'Onboarding assistido', 'Suporte prioritário'],
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-lg">AppAvisos</div>
          <nav className="flex items-center gap-2 sm:gap-4 text-sm">
            <a href="#funcionalidades" className="hidden sm:inline text-slate-600 hover:text-slate-900">Funcionalidades</a>
            <a href="#planos" className="hidden sm:inline text-slate-600 hover:text-slate-900">Planos</a>
            <Link to="/login" className="text-slate-700 hover:text-slate-900">Entrar</Link>
            <Link to="/cadastrar-condominio" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800">
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-4 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Avisos do seu condomínio,<br />
            <span className="text-slate-600">entregues na hora.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
            Síndico cria o aviso, morador recebe por e-mail e notificação no celular.
            Sem grupo de WhatsApp confuso, sem morador "não vi o aviso".
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/cadastrar-condominio" className="bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800">
              Cadastrar meu condomínio
            </Link>
            <Link to="/sou-morador" className="bg-white border border-slate-300 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50">
              Sou morador
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">7 dias grátis. Cancele quando quiser.</p>
        </div>
      </section>

      <section id="funcionalidades" className="px-4 py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Tudo que o seu condomínio precisa</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.titulo} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <div className="font-semibold text-slate-900">{f.titulo}</div>
                <div className="mt-1 text-sm text-slate-600">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Planos simples</h2>
          <p className="text-center text-slate-600 mb-12">Sem fidelidade. Sem taxa de instalação.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {planos.map((p) => (
              <div
                key={p.nome}
                className={`relative bg-white border rounded-2xl p-6 ${p.destaque ? 'border-slate-900 shadow-lg md:scale-105' : 'border-slate-200'}`}
              >
                {p.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Mais escolhido
                  </div>
                )}
                <div className="text-lg font-semibold">{p.nome}</div>
                <div className="text-sm text-slate-500">{p.sub}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-sm text-slate-500">R$</span>
                  <span className="text-4xl font-bold">{p.preco}</span>
                  <span className="text-sm text-slate-500">/mês</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-slate-700">{b}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={wppLink(`Olá! Quero contratar o plano ${p.nome} (R$${p.preco}/mês).`)}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-6 block text-center px-4 py-3 rounded-lg font-semibold ${p.destaque ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                >
                  Contratar
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold">Pronto para acabar com o grupo no WhatsApp?</h2>
          <p className="mt-3 text-slate-300">Cadastre seu condomínio em 2 minutos. Sem cartão de crédito.</p>
          <Link to="/cadastrar-condominio" className="mt-8 inline-block bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100">
            Cadastrar meu condomínio
          </Link>
        </div>
      </section>

      <footer className="px-4 py-8 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-4 text-sm text-slate-600">
          <div>© AppAvisos. Todos os direitos reservados.</div>
          <div className="flex gap-4">
            <Link to="/privacidade" className="hover:text-slate-900">Privacidade</Link>
            <Link to="/termos" className="hover:text-slate-900">Termos</Link>
            <Link to="/login" className="hover:text-slate-900">Entrar</Link>
          </div>
        </div>
      </footer>

      <a
        href={wppLink('Olá! Tenho interesse no AppAvisos.')}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-5 right-5 z-50 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg p-4 flex items-center justify-center transition"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
          <path d="M20.52 3.48A11.78 11.78 0 0 0 12.05 0C5.5 0 .2 5.3.2 11.85a11.8 11.8 0 0 0 1.6 5.96L0 24l6.34-1.66a11.84 11.84 0 0 0 5.7 1.45h.01c6.55 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.15-3.38-8.46zM12.06 21.8h-.01a9.94 9.94 0 0 1-5.07-1.39l-.36-.21-3.76.99 1-3.66-.24-.38a9.93 9.93 0 0 1-1.52-5.3c0-5.48 4.46-9.94 9.96-9.94 2.66 0 5.16 1.04 7.04 2.92a9.86 9.86 0 0 1 2.92 7.03c0 5.48-4.46 9.94-9.96 9.94zm5.46-7.45c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
        </svg>
      </a>
    </div>
  )
}
