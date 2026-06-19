// api/products.js — CRUD completo de produtos
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ── Helpers ──────────────────────────────────────────────────────────────────

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const secret = process.env.JWT_SECRET || 'oticas-master-jwt-secret-2026-felipe-juliana-parauapebas-pa';
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
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

/**
 * Gera um slug URL-safe a partir de qualquer texto.
 * Ex: "Óculos Ray-Ban Aviador" → "oculos-ray-ban-aviador"
 */
function generateSlug(text) {
  return text
    .toString()
    .normalize('NFD')                          // decompõe acentos
    .replace(/[\u0300-\u036f]/g, '')           // remove diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')             // remove caracteres especiais
    .replace(/\s+/g, '-')                      // espaços → hífens
    .replace(/-+/g, '-')                       // múltiplos hífens → um
    .replace(/^-|-$/g, '');                    // remove hífens nas bordas
}

/**
 * Garante que o slug seja único no banco adicionando sufixo numérico se necessário.
 * Ex: "oculos-grau" → "oculos-grau-2" se já existir
 */
async function uniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    let query = supabase.from('products').select('id').eq('slug', slug);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;          // slug disponível
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  // Autenticação obrigatória para escrita
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) return res.status(401).json({ message: 'Não autorizado' });
  }

  // ── GET /api/products — listar produtos (público) ─────────────────────────
  if (req.method === 'GET' && !id) {
    const { page = 1, limit = 15, search, active, featured, category_id, is_promotion, slug: productSlug } = req.query;

    // ── Busca por slug de produto individual ──────────────────────────────
    if (productSlug) {
      const { data, error } = await supabase
        .from('products').select('*, categories(*)').eq('slug', productSlug).single();
      if (error || !data) return res.status(404).json({ message: 'Produto não encontrado' });
      return res.status(200).json({ product: data, products: [data] });
    }

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase.from('products').select('*, categories(name, slug)', { count: 'exact' });

    if (search) query = query.ilike('name', `%${search}%`);
    if (active !== undefined && active !== 'all') query = query.eq('active', active === 'true');
    if (featured === 'true') query = query.eq('featured', true);
    if (is_promotion === 'true') query = query.eq('is_promotion', true);
    if (category_id) query = query.eq('category_id', category_id);

    query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ message: error.message });

    return res.status(200).json({
      products: data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    });
  }

  // ── GET /api/products?id=xxx — produto individual (público) ──────────────
  if (req.method === 'GET' && id) {
    const { data, error } = await supabase
      .from('products').select('*, categories(*)').eq('id', id).single();
    if (error) return res.status(404).json({ message: 'Produto não encontrado' });
    return res.status(200).json(data);
  }

  // ── POST /api/products — criar produto ───────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body || {};

    // Validações obrigatórias
    if (!body.name || !body.name.trim()) {
      return res.status(400).json({ message: 'O nome do produto é obrigatório.' });
    }
    if (!body.sku || !body.sku.trim()) {
      return res.status(400).json({ message: 'O SKU do produto é obrigatório.' });
    }
    if (body.price_original === undefined || body.price_original === null || body.price_original === '') {
      return res.status(400).json({ message: 'O preço original é obrigatório.' });
    }

    // Gerar slug automaticamente a partir do nome
    const baseSlug = generateSlug(body.name);
    const slug = await uniqueSlug(baseSlug);

    // Montar payload limpo
    const payload = {
      name: body.name.trim(),
      sku: body.sku.trim(),
      slug,
      description: body.description || null,
      short_description: body.short_description || null,
      category_id: body.category_id || null,
      brand_id: body.brand_id || null,
      price_original: Number(body.price_original),
      price_sale: body.price_sale ? Number(body.price_sale) : null,
      price_pix: body.price_pix ? Number(body.price_pix) : null,
      installments_max: Number(body.installments_max) || 3,
      installments_interest_free: Number(body.installments_interest_free) || 3,
      stock_quantity: Number(body.stock_quantity) || 0,
      stock_min_alert: Number(body.stock_min_alert) || 5,
      track_stock: body.track_stock !== false,
      frame_material: body.frame_material || null,
      frame_shape: body.frame_shape || null,
      frame_color: body.frame_color || null,
      lens_type: body.lens_type || null,
      gender: body.gender || 'unissex',
      active: body.active !== false,
      featured: body.featured === true,
      is_new: body.is_new === true,
      is_promotion: body.is_promotion === true,
      main_image_url: body.main_image_url || null,
      images: body.images || [],
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
    };

    const { data, error } = await supabase.from('products').insert(payload).select().single();
    if (error) return res.status(400).json({ message: error.message });
    return res.status(201).json(data);
  }

  // ── PUT /api/products?id=xxx — atualizar produto ─────────────────────────
  if (req.method === 'PUT' && id) {
    const body = req.body || {};
    const updates = { ...body, updated_at: new Date().toISOString() };

    // Se o nome mudou, regenerar o slug
    if (body.name) {
      const baseSlug = generateSlug(body.name);
      updates.slug = await uniqueSlug(baseSlug, id);
    }

    // Garantir que slug nunca seja nulo
    if (!updates.slug) {
      const { data: existing } = await supabase.from('products').select('name').eq('id', id).single();
      if (existing) updates.slug = await uniqueSlug(generateSlug(existing.name), id);
    }

    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json(data);
  }

  // ── PATCH /api/products?id=xxx — atualizar campos específicos ────────────
  if (req.method === 'PATCH' && id) {
    const body = req.body || {};
    const updates = { ...body, updated_at: new Date().toISOString() };

    if (body.name) {
      const baseSlug = generateSlug(body.name);
      updates.slug = await uniqueSlug(baseSlug, id);
    }

    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json(data);
  }

  // ── DELETE /api/products?id=xxx — remover produto ────────────────────────
  if (req.method === 'DELETE' && id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(400).json({ message: error.message });
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
