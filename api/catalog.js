// api/catalog.js — Categorias, Promoções e Clientes
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'oticas-master-jwt-secret-2026-felipe-juliana-parauapebas-pa').update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function requireAuth(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !verifyToken(token)) { res.status(401).json({ message: 'Não autorizado' }); return false; }
  return true;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { resource, id } = req.query;

  // ===== CATEGORIAS =====
  if (resource === 'categories') {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('categories').select('*').eq('active', true).order('sort_order');
      if (error) return res.status(500).json({ message: error.message });
      return res.status(200).json(data);
    }
    if (!requireAuth(req, res)) return;
    if (req.method === 'POST') {
      const { data, error } = await supabase.from('categories').insert(req.body).select().single();
      if (error) return res.status(400).json({ message: error.message });
      return res.status(201).json(data);
    }
    if (req.method === 'PUT' && id) {
      const { data, error } = await supabase.from('categories').update(req.body).eq('id', id).select().single();
      if (error) return res.status(400).json({ message: error.message });
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE' && id) {
      await supabase.from('categories').delete().eq('id', id);
      return res.status(204).end();
    }
  }

  // ===== PROMOÇÕES =====
  if (resource === 'promotions') {
    if (req.method === 'GET') {
      const { active_only } = req.query;
      let query = supabase.from('promotions').select('*').order('created_at', { ascending: false });
      if (active_only === 'true') {
        const now = new Date().toISOString();
        query = query.eq('active', true).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`);
      }
      const { data, error } = await query;
      if (error) return res.status(500).json({ message: error.message });
      return res.status(200).json(data);
    }
    if (!requireAuth(req, res)) return;
    if (req.method === 'POST') {
      const { data, error } = await supabase.from('promotions').insert(req.body).select().single();
      if (error) return res.status(400).json({ message: error.message });
      return res.status(201).json(data);
    }
    if ((req.method === 'PUT' || req.method === 'PATCH') && id) {
      const { data, error } = await supabase.from('promotions').update(req.body).eq('id', id).select().single();
      if (error) return res.status(400).json({ message: error.message });
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE' && id) {
      await supabase.from('promotions').delete().eq('id', id);
      return res.status(204).end();
    }
  }

  // ===== CLIENTES =====
  if (resource === 'customers') {
    if (!requireAuth(req, res)) return;
    if (req.method === 'GET') {
      const { page = 1, limit = 20, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      let query = supabase.from('customers').select('*', { count: 'exact' });
      if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);
      const { data, error, count } = await query;
      if (error) return res.status(500).json({ message: error.message });
      return res.status(200).json({ customers: data, pagination: { page: Number(page), limit: Number(limit), total: count } });
    }
  }

  // ===== NEWSLETTER =====
  if (resource === 'newsletter') {
    if (req.method === 'POST') {
      const { email, name } = req.body;
      if (!email) return res.status(400).json({ message: 'E-mail obrigatório' });
      const { error } = await supabase.from('newsletter_subscribers').upsert({ email, name }, { onConflict: 'email' });
      if (error) return res.status(400).json({ message: error.message });
      return res.status(200).json({ message: 'Inscrito com sucesso!' });
    }
    if (req.method === 'GET') {
      if (!requireAuth(req, res)) return;
      const { data, count } = await supabase.from('newsletter_subscribers').select('*', { count: 'exact' }).eq('active', true);
      return res.status(200).json({ subscribers: data, total: count });
    }
  }

  // ===== AGENDAMENTOS =====
  if (resource === 'appointments') {
    if (req.method === 'POST') {
      const { data, error } = await supabase.from('appointments').insert(req.body).select().single();
      if (error) return res.status(400).json({ message: error.message });
      return res.status(201).json(data);
    }
    if (req.method === 'GET') {
      if (!requireAuth(req, res)) return;
      const { data, error } = await supabase.from('appointments').select('*').order('appointment_date', { ascending: true });
      if (error) return res.status(500).json({ message: error.message });
      return res.status(200).json(data);
    }
    if (req.method === 'PATCH' && id) {
      if (!requireAuth(req, res)) return;
      const { data, error } = await supabase.from('appointments').update(req.body).eq('id', id).select().single();
      if (error) return res.status(400).json({ message: error.message });
      return res.status(200).json(data);
    }
  }

  return res.status(404).json({ message: `Recurso '${resource}' não encontrado` });
}
