import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 border-b-4 border-gold py-4 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8 text-gold" />
            <span className="font-serif text-xl font-bold text-gold">Óticas Master</span>
          </a>
          <a
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-gold/10 p-3 rounded-full">
              <Shield className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-gray-900">Política de Privacidade</h1>
              <p className="text-gray-500 text-sm mt-1">Última atualização: junho de 2026</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Quem somos</h2>
              <p>
                A <strong>Óticas Master</strong> (CNPJ: 45.657.100/0001-23), com sede na Rua Costa e Silva, Q06, L02,
                Bairro Esplanada, Parauapebas – PA, é responsável pelo tratamento dos dados pessoais coletados
                neste site, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Dados que coletamos</h2>
              <p>Coletamos apenas os dados necessários para prestar nossos serviços:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone e CPF — fornecidos por você ao criar uma conta ou realizar uma compra.</li>
                <li><strong>Dados de entrega:</strong> endereço completo com CEP — necessários para calcular e realizar o envio dos pedidos.</li>
                <li><strong>Dados de pagamento:</strong> processados de forma segura pelo PagBank. Não armazenamos dados de cartão de crédito em nossos servidores.</li>
                <li><strong>Newsletter:</strong> e-mail fornecido voluntariamente ao se cadastrar para receber ofertas e novidades.</li>
                <li><strong>Dados de navegação:</strong> cookies técnicos utilizados para manter a sessão e o carrinho de compras.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Como utilizamos seus dados</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Processar e entregar seus pedidos</li>
                <li>Enviar confirmações e atualizações sobre seus pedidos por e-mail</li>
                <li>Enviar ofertas e promoções, caso você tenha se cadastrado na newsletter (pode cancelar a qualquer momento)</li>
                <li>Responder às suas solicitações de contato</li>
                <li>Cumprir obrigações legais e fiscais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Compartilhamento de dados</h2>
              <p>
                Seus dados são compartilhados apenas com parceiros essenciais para a prestação do serviço:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>PagBank:</strong> processamento seguro de pagamentos.</li>
                <li><strong>Correios / transportadoras:</strong> entrega dos produtos.</li>
                <li><strong>Resend:</strong> envio de e-mails transacionais.</li>
              </ul>
              <p className="mt-3">
                Nunca vendemos ou compartilhamos seus dados com terceiros para fins de marketing sem seu consentimento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cookies</h2>
              <p>
                Utilizamos cookies estritamente necessários para o funcionamento do site (manutenção do carrinho,
                sessão de login). Não utilizamos cookies de rastreamento ou publicidade comportamental.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Seus direitos (LGPD)</h2>
              <p>Nos termos da LGPD, você tem direito a:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Acesso:</strong> saber quais dados seus temos armazenados.</li>
                <li><strong>Correção:</strong> corrigir dados incompletos ou desatualizados.</li>
                <li><strong>Exclusão:</strong> solicitar a remoção dos seus dados pessoais.</li>
                <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado.</li>
                <li><strong>Revogação:</strong> cancelar o consentimento a qualquer momento (ex: descadastrar da newsletter).</li>
              </ul>
              <p className="mt-3">
                Para exercer qualquer um desses direitos, entre em contato pelo e-mail{' '}
                <a href="mailto:felipedourado029@gmail.com" className="text-gold hover:underline">
                  felipedourado029@gmail.com
                </a>{' '}
                ou pelo WhatsApp <a href="https://wa.me/5594981796065" className="text-gold hover:underline">(94) 98179-6065</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Segurança</h2>
              <p>
                Adotamos medidas técnicas e administrativas para proteger seus dados contra acesso não autorizado,
                alteração, divulgação ou destruição. Toda a comunicação entre seu navegador e nosso servidor
                é protegida por criptografia SSL (HTTPS).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Retenção de dados</h2>
              <p>
                Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas e obrigações legais.
                Dados de pedidos são mantidos por 5 anos para fins fiscais. Dados de newsletter são excluídos
                mediante solicitação ou cancelamento de inscrição.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Alterações nesta política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Comunicaremos alterações
                significativas por e-mail ou por aviso em destaque no site. O uso continuado do site após
                as alterações constitui aceitação da nova política.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contato</h2>
              <p>
                Dúvidas sobre esta política? Entre em contato com nosso encarregado de dados (DPO):
              </p>
              <address className="not-italic mt-3 space-y-1 text-gray-600">
                <p><strong>Óticas Master</strong></p>
                <p>Rua Costa e Silva, Q06, L02, Bairro Esplanada, Parauapebas – PA</p>
                <p>E-mail: <a href="mailto:felipedourado029@gmail.com" className="text-gold hover:underline">felipedourado029@gmail.com</a></p>
                <p>WhatsApp: <a href="https://wa.me/5594981796065" className="text-gold hover:underline">(94) 98179-6065</a></p>
              </address>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Óticas Master. CNPJ: 45.657.100/0001-23.</p>
      </footer>
    </div>
  );
}
