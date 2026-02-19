import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const { method } = req;

  // GET — Listar produtos (público ou admin)
  if (method === 'GET') {
    const {
      page = 1, limit = 20, category, featured, active = 'true',
      search, sort = 'created_at', order = 'desc', promotion
    } = req.query;

    let query = supabase
      .from('products')
      .select(`*, categories(id, name, slug), brands(id, name)`, { count: 'exact' });

    if (active !== 'all') query = query.eq('active', active === 'true');
    if (category) query = query.eq('category_id', category);
    if (featured === 'true') query = query.eq('featured', true);
    if (promotion === 'true') query = query.eq('is_promotion', true);
    if (search) query = query.ilike('name', `%${search}%`);

    query = query
      .order(sort, { ascending: order === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ message: error.message });

    return res.status(200).json({
      products: data,
      pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / limit) }
    });
  }

  // POST — Criar produto (requer auth)
  if (method === 'POST') {
    return requireAuth(async (req, res) => {
      const product = req.body;

      // Gerar slug se não fornecido
      if (!product.slug && product.name) {
        product.slug = product.name
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') + '-' + Date.now();
      }

      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) return res.status(400).json({ message: error.message });
      return res.status(201).json(data);
    })(req, res);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default corsHandler(handler);
