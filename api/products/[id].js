import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const { id } = req.query;
  const { method } = req;

  // GET — Buscar produto por ID ou slug (público)
  if (method === 'GET') {
    const isUUID = /^[0-9a-f-]{36}$/.test(id);
    let query = supabase
      .from('products')
      .select(`*, categories(id, name, slug), brands(id, name)`);

    query = isUUID ? query.eq('id', id) : query.eq('slug', id);
    const { data, error } = await query.single();

    if (error || !data) return res.status(404).json({ message: 'Produto não encontrado' });

    // Incrementar visualizações
    supabase.from('products').update({ views_count: (data.views_count || 0) + 1 }).eq('id', data.id);

    return res.status(200).json(data);
  }

  // PUT — Atualizar produto (requer auth)
  if (method === 'PUT') {
    return requireAuth(async (req, res) => {
      const updates = { ...req.body, updated_at: new Date().toISOString() };
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(400).json({ message: error.message });
      if (!data) return res.status(404).json({ message: 'Produto não encontrado' });
      return res.status(200).json(data);
    })(req, res);
  }

  // DELETE — Remover produto (requer auth)
  if (method === 'DELETE') {
    return requireAuth(async (req, res) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) return res.status(400).json({ message: error.message });
      return res.status(200).json({ message: 'Produto removido com sucesso' });
    })(req, res);
  }

  // PATCH — Atualização parcial (ex: toggle ativo/destaque)
  if (method === 'PATCH') {
    return requireAuth(async (req, res) => {
      const { data, error } = await supabase
        .from('products')
        .update({ ...req.body, updated_at: new Date().toISOString() })
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
