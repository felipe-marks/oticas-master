// api/contact.js — Formulário de contato com e-mail para loja e cliente
import { sendContactNotificationEmail, sendContactConfirmationEmail } from './_email.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const { name, email, phone, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Nome, e-mail e mensagem são obrigatórios' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'E-mail inválido' });
  }

  // Enviar os dois e-mails em paralelo (sem bloquear se um falhar)
  await Promise.allSettled([
    sendContactNotificationEmail({ name, email, phone, message }),
    sendContactConfirmationEmail({ name, email }),
  ]);

  return res.status(200).json({ message: 'Mensagem enviada com sucesso!' });
}
