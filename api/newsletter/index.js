import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  // POST — Inscrever e-mail (público)
  if (req.method === 'POST') {
    const { email, name } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'E-mail inválido' });
    }

    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert([{ email: email.toLowerCase().trim(), name, active: true }], { onConflict: 'email' });

    if (error) return res.status(500).json({ message: error.message });
    return res.status(200).json({ message: 'Cadastro realizado com sucesso! Obrigado.' });
  }

  // GET — Listar inscritos (admin)
  if (req.method === 'GET') {
    return requireAuth(async (req, res) => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('active', true)
        .order('subscribed_at', { ascending: false });

      if (error) return res.status(500).json({ message: error.message });
      return res.status(200).json({ subscribers: data, total: data.length });
    })(req, res);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default corsHandler(handler);
