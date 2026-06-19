// api/_email.js — Módulo de e-mails transacionais via Resend
// Usado internamente pelas outras rotas da API

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Óticas Master <noreply@oticasmaster.com.br>';
const STORE_URL = 'https://www.oticasmaster.com.br';

/**
 * Envia um e-mail via API do Resend
 */
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY não configurada — e-mail não enviado');
    return { success: false, error: 'API key não configurada' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Email] Erro ao enviar:', data);
      return { success: false, error: data.message || 'Erro desconhecido' };
    }

    console.log('[Email] Enviado com sucesso:', data.id);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[Email] Exceção ao enviar:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Templates de E-mail ────────────────────────────────────────────────────

function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Óticas Master</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#c9a84c;font-size:28px;font-weight:700;letter-spacing:2px;">ÓTICAS MASTER</h1>
              <p style="margin:6px 0 0;color:#a0a0b0;font-size:13px;letter-spacing:1px;">PARAUAPEBAS • PARÁ</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eeeeee;text-align:center;">
              <p style="margin:0 0 8px;color:#888;font-size:13px;">
                <a href="${STORE_URL}" style="color:#c9a84c;text-decoration:none;">www.oticasmaster.com.br</a>
              </p>
              <p style="margin:0;color:#aaa;font-size:12px;">
                Parauapebas, Pará — (94) 98179-6065
              </p>
              <p style="margin:8px 0 0;color:#bbb;font-size:11px;">
                Este é um e-mail automático. Por favor, não responda diretamente.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * E-mail de boas-vindas após cadastro
 */
export async function sendWelcomeEmail({ name, email }) {
  const firstName = name.split(' ')[0];
  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">Bem-vindo(a), ${firstName}! 👋</h2>
    <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.6;">
      Seu cadastro na <strong>Óticas Master</strong> foi realizado com sucesso. Agora você tem acesso à sua área exclusiva de cliente.
    </p>
    <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.6;">
      Por lá você pode acompanhar seus pedidos, salvar seus endereços favoritos e muito mais.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background:#c9a84c;border-radius:8px;padding:14px 32px;">
          <a href="${STORE_URL}" style="color:#1a1a2e;font-size:15px;font-weight:700;text-decoration:none;display:block;">
            Acessar a Loja →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#888;font-size:13px;line-height:1.5;">
      Se você não criou esta conta, ignore este e-mail com segurança.
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `Bem-vindo(a) à Óticas Master, ${firstName}!`,
    html,
  });
}

/**
 * E-mail de recuperação de senha
 */
export async function sendPasswordResetEmail({ name, email, resetToken }) {
  const firstName = name.split(' ')[0];
  const resetUrl = `${STORE_URL}/redefinir-senha?token=${resetToken}`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">Redefinição de Senha</h2>
    <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.6;">
      Olá, <strong>${firstName}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta na Óticas Master.
    </p>
    <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.6;">
      Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>1 hora</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background:#c9a84c;border-radius:8px;padding:14px 32px;">
          <a href="${resetUrl}" style="color:#1a1a2e;font-size:15px;font-weight:700;text-decoration:none;display:block;">
            Redefinir Minha Senha →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 12px;color:#888;font-size:13px;line-height:1.5;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="margin:0 0 20px;word-break:break-all;">
      <a href="${resetUrl}" style="color:#c9a84c;font-size:12px;">${resetUrl}</a>
    </p>
    <p style="margin:0;color:#888;font-size:13px;line-height:1.5;">
      Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.
    </p>
  `);

  return sendEmail({
    to: email,
    subject: 'Redefinição de senha — Óticas Master',
    html,
  });
}

/**
 * E-mail de confirmação de pedido
 */
export async function sendOrderConfirmationEmail({ name, email, orderNumber, items, total, paymentMethod }) {
  const firstName = name.split(' ')[0];

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#444;font-size:14px;">${item.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:14px;text-align:center;">${item.quantity}x</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#444;font-size:14px;text-align:right;">R$ ${Number(item.price).toFixed(2).replace('.', ',')}</td>
    </tr>
  `).join('');

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:22px;">Pedido Confirmado! ✅</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Pedido #${orderNumber}</p>
    <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.6;">
      Olá, <strong>${firstName}</strong>! Recebemos seu pedido e já estamos preparando tudo com carinho para você.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <th style="text-align:left;padding:10px 0;border-bottom:2px solid #1a1a2e;color:#1a1a2e;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Produto</th>
        <th style="text-align:center;padding:10px 0;border-bottom:2px solid #1a1a2e;color:#1a1a2e;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Qtd</th>
        <th style="text-align:right;padding:10px 0;border-bottom:2px solid #1a1a2e;color:#1a1a2e;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Valor</th>
      </tr>
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding:14px 0 0;color:#1a1a2e;font-size:15px;font-weight:700;">Total</td>
        <td style="padding:14px 0 0;color:#c9a84c;font-size:16px;font-weight:700;text-align:right;">R$ ${Number(total).toFixed(2).replace('.', ',')}</td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#666;font-size:14px;"><strong>Forma de pagamento:</strong> ${paymentMethod}</p>
    <p style="margin:0 0 24px;color:#666;font-size:14px;">Em breve entraremos em contato pelo WhatsApp para confirmar os detalhes do seu pedido.</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background:#1a1a2e;border-radius:8px;padding:14px 32px;">
          <a href="${STORE_URL}/minha-conta" style="color:#c9a84c;font-size:15px;font-weight:700;text-decoration:none;display:block;">
            Acompanhar Pedido →
          </a>
        </td>
      </tr>
    </table>
  `);

  return sendEmail({
    to: email,
    subject: `Pedido #${orderNumber} confirmado — Óticas Master`,
    html,
  });
}

/**
 * E-mail de boas-vindas à newsletter com cupom de 10% OFF
 */
export async function sendNewsletterWelcomeEmail({ email, name }) {
  const greeting = name ? `Olá, ${name.split(' ')[0]}!` : 'Olá!';
  const COUPON = 'BEMVINDO10';

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">${greeting} Você está dentro! 🎉</h2>
    <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.6;">
      Obrigado por se cadastrar na newsletter da <strong>Óticas Master</strong>. Como prometido, aqui está seu cupom de desconto exclusivo:
    </p>

    <div style="background:#1a1a2e;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#a0a0b0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Seu cupom de desconto</p>
      <p style="margin:0 0 8px;color:#c9a84c;font-size:36px;font-weight:900;letter-spacing:4px;">${COUPON}</p>
      <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">10% OFF na primeira compra</p>
    </div>

    <p style="margin:0 0 8px;color:#666;font-size:14px;line-height:1.6;">
      Use o código acima no checkout para garantir 10% de desconto na sua primeira compra no site.
    </p>
    <p style="margin:0 0 24px;color:#888;font-size:13px;">
      Cupom válido para compras acima de R$ 100,00.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background:#c9a84c;border-radius:8px;padding:14px 32px;">
          <a href="${STORE_URL}" style="color:#1a1a2e;font-size:15px;font-weight:700;text-decoration:none;display:block;">
            Comprar Agora →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#bbb;font-size:12px;text-align:center;">
      Você está recebendo este e-mail porque se cadastrou em nossa newsletter.<br>
      <a href="${STORE_URL}" style="color:#c9a84c;">Cancelar inscrição</a>
    </p>
  `);

  return sendEmail({
    to: email,
    subject: 'Seu cupom de 10% OFF chegou — Óticas Master 🎁',
    html,
  });
}

/**
 * E-mail de notificação para a loja quando alguém envia o formulário de contato
 */
export async function sendContactNotificationEmail({ name, email, phone, message }) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">📬 Nova mensagem no site</h2>
    <p style="margin:0 0 20px;color:#666;font-size:14px;">Uma nova mensagem foi enviada pelo formulário de contato do site.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #eee;border-radius:8px;overflow:hidden;">
      <tr style="background:#f9f9f9;">
        <td style="padding:12px 16px;font-size:13px;color:#888;font-weight:600;width:120px;border-bottom:1px solid #eee;">Nome</td>
        <td style="padding:12px 16px;font-size:14px;color:#333;border-bottom:1px solid #eee;">${name}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#888;font-weight:600;border-bottom:1px solid #eee;">E-mail</td>
        <td style="padding:12px 16px;font-size:14px;border-bottom:1px solid #eee;">
          <a href="mailto:${email}" style="color:#c9a84c;">${email}</a>
        </td>
      </tr>
      <tr style="background:#f9f9f9;">
        <td style="padding:12px 16px;font-size:13px;color:#888;font-weight:600;border-bottom:1px solid #eee;">Telefone</td>
        <td style="padding:12px 16px;font-size:14px;color:#333;border-bottom:1px solid #eee;">${phone || 'Não informado'}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#888;font-weight:600;vertical-align:top;">Mensagem</td>
        <td style="padding:12px 16px;font-size:14px;color:#333;line-height:1.6;">${message.replace(/\n/g, '<br>')}</td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background:#c9a84c;border-radius:8px;padding:12px 28px;">
          <a href="mailto:${email}?subject=Re: Contato Óticas Master" style="color:#1a1a2e;font-size:14px;font-weight:700;text-decoration:none;display:block;">
            Responder por E-mail →
          </a>
        </td>
      </tr>
    </table>
  `);

  return sendEmail({
    to: 'oticasmaster@outlook.com.br',
    subject: `Nova mensagem de ${name} — Formulário de Contato`,
    html,
  });
}

/**
 * E-mail de confirmação para quem enviou o formulário de contato
 */
export async function sendContactConfirmationEmail({ name, email }) {
  const firstName = name.split(' ')[0];

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">Mensagem recebida! ✅</h2>
    <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.6;">
      Olá, <strong>${firstName}</strong>! Recebemos sua mensagem e entraremos em contato em breve.
    </p>
    <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.6;">
      Nosso horário de atendimento é de <strong>segunda a sábado, das 8h às 18h</strong>. Se precisar de uma resposta mais rápida, entre em contato pelo WhatsApp:
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background:#25D366;border-radius:8px;padding:14px 32px;">
          <a href="https://wa.me/5594981796065" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:block;">
            Falar no WhatsApp →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#888;font-size:13px;text-align:center;line-height:1.5;">
      Obrigado por entrar em contato com a Óticas Master!
    </p>
  `);

  return sendEmail({
    to: email,
    subject: 'Recebemos sua mensagem — Óticas Master',
    html,
  });
}
