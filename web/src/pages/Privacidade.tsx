import { Link } from 'react-router-dom'

export default function Privacidade() {
  return (
    <div className="min-h-full max-w-3xl mx-auto p-6 md:p-10 text-slate-800 dark:text-slate-200">
      <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700">← Voltar</Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">Política de Privacidade — AppAvisos</h1>
      <p className="text-sm text-slate-500 mb-8">Última atualização: 10 de maio de 2026</p>

      <div className="space-y-6 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Quem somos</h2>
          <p>O AppAvisos é uma plataforma de comunicação entre síndicos e moradores de condomínios. Esta política descreve como tratamos os dados pessoais dos usuários do sistema (síndicos, subsíndicos e moradores), em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Dados coletados</h2>
          <p>Coletamos apenas os dados necessários para a operação do serviço:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><b>Cadastro:</b> nome, e-mail, telefone, bloco, número do apartamento.</li>
            <li><b>Identidade do condomínio:</b> nome, CNPJ, endereço, telefone, e-mail de contato, logotipo.</li>
            <li><b>Conteúdo enviado:</b> avisos, anexos, respostas, mensagens da timeline.</li>
            <li><b>Dados técnicos:</b> endereço IP, navegador/dispositivo, data e hora de acesso, e localização aproximada (cidade, estado, país) derivada do IP no momento da leitura de avisos.</li>
            <li><b>Notificações push:</b> identificador de assinatura do navegador (endpoint, chaves p256dh e auth).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Finalidade do tratamento</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Permitir que o síndico publique avisos para os moradores do condomínio.</li>
            <li>Enviar avisos por e-mail e notificações push aos moradores cadastrados.</li>
            <li>Registrar comprovação de leitura (data, hora, dispositivo, IP, localização aproximada) para evidência de comunicação.</li>
            <li>Permitir comunicação direta entre síndico e morador (timeline).</li>
            <li>Operar o serviço com segurança e prevenir abusos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Base legal</h2>
          <p>Tratamos seus dados com base em (i) execução de contrato (Art. 7º, V), uma vez que o serviço é contratado pelo condomínio para gerir comunicação; (ii) legítimo interesse (Art. 7º, IX) para registros de comprovação de entrega e leitura; e (iii) cumprimento de obrigação legal/regulatória, quando aplicável.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Compartilhamento</h2>
          <p>Não vendemos seus dados. Compartilhamos somente com prestadores essenciais ao funcionamento do serviço:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><b>Amazon Web Services (Amazon SES)</b> — envio de e-mails transacionais.</li>
            <li><b>Cloudflare</b> — entrega de conteúdo e proteção do site.</li>
            <li><b>Hetzner</b> — hospedagem da infraestrutura.</li>
            <li><b>ip-api.com</b> — geolocalização aproximada por IP.</li>
          </ul>
          <p className="mt-2">O síndico do seu condomínio é o controlador principal dos dados dos moradores. Dúvidas devem ser direcionadas a ele em primeira instância.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Tempo de retenção</h2>
          <p>Mantemos os dados enquanto o condomínio for cliente ativo. Após encerramento, os dados podem permanecer em backup por até 90 dias antes da exclusão definitiva. Avisos e mensagens da timeline são preservados como histórico de comunicação enquanto o condomínio estiver ativo.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Seus direitos (LGPD)</h2>
          <p>Você pode, a qualquer momento, solicitar: confirmação de existência de tratamento, acesso aos dados, correção, anonimização ou eliminação, portabilidade, informações sobre compartilhamento, e revogação de consentimento. Para exercer, envie e-mail para <a href="mailto:contato@appavisos.com.br" className="underline">contato@appavisos.com.br</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. Segurança</h2>
          <p>Usamos criptografia em trânsito (HTTPS/TLS), senhas armazenadas com hash bcrypt, banco de dados em rede isolada sem acesso externo, e backups diários criptografados.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. Notificações push</h2>
          <p>O envio de notificações depende do consentimento explícito do morador ao ativar a permissão no navegador. Pode ser desativado a qualquer momento nas configurações do navegador ou do dispositivo.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. Crianças</h2>
          <p>O serviço não é destinado a menores de 13 anos. Cadastros são realizados por adultos responsáveis pelas unidades dos condomínios.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">11. Alterações</h2>
          <p>Esta política pode ser atualizada. A versão vigente estará sempre disponível em <a href="https://app.appavisos.com.br/privacidade" className="underline">app.appavisos.com.br/privacidade</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">12. Contato do Encarregado (DPO)</h2>
          <p>E-mail: <a href="mailto:contato@appavisos.com.br" className="underline">contato@appavisos.com.br</a><br/>
          WhatsApp: <a href="https://wa.me/5511933284364" className="underline">+55 11 93328-4364</a></p>
        </section>
      </div>
    </div>
  )
}
