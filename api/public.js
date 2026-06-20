// api/public.js — Rotas públicas: newsletter e formulário de contato
// Unificadas para economizar slots de serverless functions no Vercel Hobby
// GET/POST /api/public?action=newsletter
// POST     /api/public?action=contact

import { createClient } from '@supabase/supabase-js';
import { sendNewsletterWelcomeEmail, sendContactNotificationEmail, sendContactConfirmationEmail } from './_email.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const { action } = req.query;

  // ─── POST /api/public?action=newsletter ──────────────────────────────────
  if (action === 'newsletter') {
    const { email, name } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'E-mail inválido' });
    }

    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, active')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing?.active) {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado na newsletter.' });
    }

    if (existing && !existing.active) {
      await supabase
        .from('newsletter_subscribers')
        .update({ active: true, subscribed_at: new Date().toISOString(), unsubscribed_at: null })
        .eq('id', existing.id);
    } else {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: email.toLowerCase().trim(), name: name || null, active: true });
      if (error) return res.status(400).json({ message: error.message });
    }

    sendNewsletterWelcomeEmail({ email: email.toLowerCase().trim(), name: name || null })
      .catch(err => console.error('[Newsletter] Erro ao enviar e-mail:', err.message));

    return res.status(201).json({ message: 'Cadastrado com sucesso! Confira seu e-mail para o cupom de 10% OFF.' });
  }

  // ─── POST /api/public?action=contact ─────────────────────────────────────
  if (action === 'contact') {
    const { name, email, phone, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Nome, e-mail e mensagem são obrigatórios' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'E-mail inválido' });
    }

    await Promise.allSettled([
      sendContactNotificationEmail({ name, email, phone, message }),
      sendContactConfirmationEmail({ name, email }),
    ]);

    return res.status(200).json({ message: 'Mensagem enviada com sucesso!' });
  }

  return res.status(400).json({ message: 'Action inválida' });
}
