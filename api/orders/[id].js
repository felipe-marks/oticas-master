import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;

  if (method === 'GET') {
    return requireAuth(async (req, res) => {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(*, products(name, main_image_url, sku)), customers(*)`)
        .eq('id', id)
        .single();
      if (error || !data) return res.status(404).json({ message: 'Pedido não encontrado' });
      return res.status(200).json(data);
    })(req, res);
  }

  if (method === 'PATCH') {
    return requireAuth(async (req, res) => {
      const { status, payment_status, shipping_tracking, internal_notes } = req.body;
      const updates = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (payment_status) updates.payment_status = payment_status;
      if (shipping_tracking) updates.shipping_tracking = shipping_tracking;
      if (internal_notes !== undefined) updates.internal_notes = internal_notes;
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(400).json({ message: error.message });
      return res.status(200).json(data);
    })(req, res);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default corsHandler(handler);
