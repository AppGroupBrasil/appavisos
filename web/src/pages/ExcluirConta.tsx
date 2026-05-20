import { Link } from 'react-router-dom'

export default function ExcluirConta() {
  return (
    <div className="min-h-full max-w-3xl mx-auto p-6 md:p-10 text-slate-800 dark:text-slate-200">
      <Link to="/login" className="text-sm text-slate-700 hover:text-slate-700">← Voltar</Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">Excluir conta e dados — App Avisos</h1>
      <p className="text-sm text-slate-700 mb-8">Última atualização: 20 de maio de 2026</p>

      <div className="space-y-6 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">Como solicitar</h2>
          <p>Para solicitar a exclusão da sua conta e dos seus dados pessoais do App Avisos, envie um e-mail para:</p>
          <p className="mt-2"><a href="mailto:contato@appavisos.com.br?subject=Exclus%C3%A3o%20de%20conta%20e%20dados" className="underline font-medium">contato@appavisos.com.br</a></p>
          <p className="mt-2">Ou pelo WhatsApp: <a href="https://wa.me/5511933284364" className="underline">+55 11 93328-4364</a></p>
          <p className="mt-2">Informe no pedido:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Nome completo</li>
            <li>E-mail cadastrado no app</li>
            <li>Nome do condomínio (se for morador ou síndico)</li>
            <li>Perfil de uso (síndico ou morador)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Dados excluídos</h2>
          <p>Após a confirmação da solicitação serão removidos:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Cadastro (nome, e-mail, telefone, bloco, apartamento).</li>
            <li>Assinatura de notificações push do seu dispositivo.</li>
            <li>Histórico de leituras e respostas a avisos.</li>
            <li>Mensagens da timeline enviadas pelo usuário.</li>
            <li>Reportes e fotos enviados pelo usuário.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Dados retidos</h2>
          <p>Por obrigação legal e auditoria, alguns registros podem ser mantidos em forma anonimizada (sem identificação pessoal) por até 5 anos: data e hora de eventos de comunicação, agregados estatísticos e logs de segurança. Backups criptografados são preservados por até 90 dias e expiram automaticamente.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Prazo de atendimento</h2>
          <p>Sua solicitação será atendida em até 15 dias úteis após a confirmação da titularidade do e-mail informado. Você receberá uma confirmação por e-mail quando a exclusão for concluída.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Moradores — exclusão por link direto</h2>
          <p>Se você é morador e tem em mãos um e-mail de aviso enviado pelo App Avisos, ele contém um link “Descadastrar” no rodapé que permite a remoção imediata da sua conta sem necessidade de contato por e-mail.</p>
        </section>
      </div>
    </div>
  )
}
