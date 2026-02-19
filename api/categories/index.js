import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    const { active = 'true' } = req.query;
    let query = supabase.from('categories').select('*, products(count)').order('sort_order');
    if (active !== 'all') query = query.eq('active', active === 'true');
    const { data, error } = await query;
    if (error) return res.status(500).json({ message: error.message });
    return res.status(200).json(data);
  }

  if (method === 'POST') {
    return requireAuth(async (req, res) => {
      const cat = req.body;
      if (!cat.slug && cat.name) {
        cat.slug = cat.name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      const { data, error } = await supabase.from('categories').insert([cat]).select().single();
      if (error) return res.status(400).json({ message: error.message });
      return res.status(201).json(data);
    })(req, res);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default corsHandler(handler);
