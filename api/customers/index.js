import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    return requireAuth(async (req, res) => {
      const { page = 1, limit = 20, search } = req.query;
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      query = query.range((page - 1) * limit, page * limit - 1);
      const { data, error, count } = await query;
      if (error) return res.status(500).json({ message: error.message });

      return res.status(200).json({
        customers: data,
        pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / limit) }
      });
    })(req, res);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default corsHandler(handler);
