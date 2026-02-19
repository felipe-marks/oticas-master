import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  if (req.method === 'GET') {
    // Configurações públicas (sem auth)
    const publicKeys = ['store_name', 'store_phone', 'store_whatsapp', 'store_address', 'store_hours', 'store_instagram', 'topbar_messages', 'pix_discount_percent', 'max_installments', 'free_shipping_above'];
    const { data, error } = await supabase.from('site_settings').select('key, value').in('key', publicKeys);
    if (error) return res.status(500).json({ message: error.message });
    const settings = {};
    (data || []).forEach(s => { settings[s.key] = s.value; });
    return res.status(200).json(settings);
  }

  if (req.method === 'PUT') {
    return requireAuth(async (req, res) => {
      const updates = req.body; // { key: value, key2: value2, ... }
      const upserts = Object.entries(updates).map(([key, value]) => ({
        key, value: typeof value === 'string' ? JSON.stringify(value) : value, updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
      if (error) return res.status(500).json({ message: error.message });
      return res.status(200).json({ message: 'Configurações atualizadas com sucesso' });
    })(req, res);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default corsHandler(handler);
