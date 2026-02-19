import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    const { active_only = 'true' } = req.query;
    let query = supabase.from('promotions').select('*').order('created_at', { ascending: false });
    if (active_only === 'true') {
      query = query.eq('active', true).or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`);
    }
    const { data, error } = await query;
    if (error) return res.status(500).json({ message: error.message });
    return res.status(200).json(data);
  }

  if (method === 'POST') {
    return requireAuth(async (req, res) => {
      const promo = req.body;
      if (promo.code) promo.code = promo.code.toUpperCase().trim();
      const { data, error } = await supabase.from('promotions').insert([promo]).select().single();
      if (error) return res.status(400).json({ message: error.message });
      return res.status(201).json(data);
    })(req, res);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default corsHandler(handler);
