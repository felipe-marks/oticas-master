// api/newsletter.js — Cadastro na newsletter e envio do cupom de 10% OFF
import { createClient } from '@supabase/supabase-js';
import { sendNewsletterWelcomeEmail } from './_email.js';

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

  const { email, name } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'E-mail inválido' });
  }

  // Verificar se já está cadastrado
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, active')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (existing?.active) {
    return res.status(409).json({ message: 'Este e-mail já está cadastrado na newsletter.' });
  }

  // Inserir ou reativar
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

  // Enviar e-mail com cupom (sem bloquear a resposta)
  sendNewsletterWelcomeEmail({ email: email.toLowerCase().trim(), name: name || null })
    .catch(err => console.error('[Newsletter] Erro ao enviar e-mail:', err.message));

  return res.status(201).json({ message: 'Cadastrado com sucesso! Confira seu e-mail para o cupom de 10% OFF.' });
}
