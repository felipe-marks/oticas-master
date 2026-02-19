import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    return requireAuth(async (req, res) => {
      const { data, error } = await supabase
        .from('promotions')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) return res.status(400).json({ message: error.message });
      return res.status(200).json(data);
    })(req, res);
  }

  if (req.method === 'DELETE') {
    return requireAuth(async (req, res) => {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) return res.status(400).json({ message: error.message });
      return res.status(200).json({ message: 'Promoção removida' });
    })(req, res);
  }

  if (req.method === 'PATCH') {
    return requireAuth(async (req, res) => {
      const { data, error } = await supabase
        .from('promotions')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) return res.status(400).json({ message: error.message });
      return res.status(200).json(data);
    })(req, res);
  }

  // Validar cupom (público)
  if (req.method === 'GET' && req.query.validate) {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('code', id.toUpperCase())
      .eq('active', true)
      .single();
    if (error || !data) return res.status(404).json({ valid: false, message: 'Cupom inválido ou expirado' });
    if (data.ends_at && new Date(data.ends_at) < new Date()) {
      return res.status(400).json({ valid: false, message: 'Cupom expirado' });
    }
    return res.status(200).json({ valid: true, promotion: data });
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default corsHandler(handler);
