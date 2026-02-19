// api/products.js — CRUD completo de produtos
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'oticas-master-secret-2026').update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const isPublic = req.method === 'GET' && !req.headers.authorization?.includes('Bearer ');

  // Autenticação para métodos de escrita
  if (!isPublic && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) return res.status(401).json({ message: 'Não autorizado' });
  }

  // GET /api/products — listar produtos
  if (req.method === 'GET' && !id) {
    const { page = 1, limit = 15, search, active, featured, category_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase.from('products').select('*, categories(name)', { count: 'exact' });

    if (search) query = query.ilike('name', `%${search}%`);
    if (active !== undefined && active !== 'all') query = query.eq('active', active === 'true');
    if (featured === 'true') query = query.eq('featured', true);
    if (category_id) query = query.eq('category_id', category_id);

    query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ message: error.message });

    return res.status(200).json({
      products: data,
      pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) }
    });
  }

  // GET /api/products?id=xxx — produto individual
  if (req.method === 'GET' && id) {
    const { data, error } = await supabase.from('products').select('*, categories(*)').eq('id', id).single();
    if (error) return res.status(404).json({ message: 'Produto não encontrado' });
    return res.status(200).json(data);
  }

  // POST /api/products — criar produto
  if (req.method === 'POST') {
    const { data, error } = await supabase.from('products').insert(req.body).select().single();
    if (error) return res.status(400).json({ message: error.message });
    return res.status(201).json(data);
  }

  // PUT /api/products?id=xxx — atualizar produto completo
  if (req.method === 'PUT' && id) {
    const { data, error } = await supabase.from('products').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json(data);
  }

  // PATCH /api/products?id=xxx — atualizar campos específicos
  if (req.method === 'PATCH' && id) {
    const { data, error } = await supabase.from('products').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json(data);
  }

  // DELETE /api/products?id=xxx — remover produto
  if (req.method === 'DELETE' && id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(400).json({ message: error.message });
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
