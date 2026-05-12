import { Link } from 'react-router-dom'

export default function Termos() {
  return (
    <div className="min-h-full max-w-3xl mx-auto p-6 md:p-10 text-slate-800 dark:text-slate-200">
      <Link to="/login" className="text-sm text-slate-700 hover:text-slate-700">← Voltar</Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">Termos de Uso — App Avisos</h1>
      <p className="text-sm text-slate-700 mb-8">Última atualização: 10 de maio de 2026</p>

      <div className="space-y-6 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Aceitação</h2>
          <p>Ao usar o App Avisos, você concorda com estes termos. Se não concordar, não utilize o serviço.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">2. O serviço</h2>
          <p>O App Avisos é uma plataforma de comunicação entre administração de condomínios (síndicos, subsíndicos) e moradores, oferecida em modelo SaaS.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">3. Cadastro</h2>
          <p>O cadastro de condomínio é feito pelo responsável (síndico). Moradores podem se autocadastrar via link, QR Code ou CNPJ; o cadastro só é ativado após aprovação do síndico.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">4. Responsabilidades</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>O síndico é responsável pelo conteúdo publicado e pela veracidade das informações sobre os moradores.</li>
            <li>O morador é responsável por manter seus dados de cadastro atualizados.</li>
            <li>O App Avisos não modera o conteúdo dos avisos, mas pode remover conteúdo ilegal ou abusivo mediante denúncia.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">5. Uso aceitável</h2>
          <p>É proibido usar o serviço para: spam, conteúdo ilegal, assédio, fraude, ou qualquer atividade que viole a legislação brasileira.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">6. Suspensão</h2>
          <p>Reservamo-nos o direito de suspender o acesso de condomínios em caso de inadimplência ou descumprimento destes termos. A suspensão preserva os dados para reativação.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">7. Pagamento</h2>
          <p>O serviço é prestado mediante mensalidade ao condomínio. O modelo de cobrança é por boleto, conforme acordo direto com o cliente. Atraso superior a 30 dias pode resultar em bloqueio do acesso.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">8. Privacidade</h2>
          <p>Consulte nossa <Link to="/privacidade" className="underline">Política de Privacidade</Link>.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">9. Limitação de responsabilidade</h2>
          <p>O serviço é fornecido "como está". Não nos responsabilizamos por interrupções de e-mail, push ou serviços de terceiros (provedores de e-mail, sistema operacional, navegador). Manteremos backup diário e melhor esforço operacional.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">10. Foro</h2>
          <p>Estes termos são regidos pela legislação brasileira. Foro da Comarca de Recife/PE para dirimir controvérsias.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">11. Contato</h2>
          <p>E-mail: <a href="mailto:contato@appavisos.com.br" className="underline">contato@appavisos.com.br</a> · WhatsApp: <a href="https://wa.me/5511933284364" className="underline">+55 11 93328-4364</a></p>
        </section>
      </div>
    </div>
  )
}
