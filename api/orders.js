// api/orders.js — Gestão completa de pedidos
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !verifyToken(token)) return res.status(401).json({ message: 'Não autorizado' });

  const { id } = req.query;

  // GET /api/orders — listar pedidos
  if (req.method === 'GET' && !id) {
    const { page = 1, limit = 15, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase.from('orders').select('*', { count: 'exact' });
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);

    query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ message: error.message });

    return res.status(200).json({
      orders: data,
      pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) }
    });
  }

  // GET /api/orders?id=xxx — pedido individual
  if (req.method === 'GET' && id) {
    const { data, error } = await supabase.from('orders').select('*, order_items(*, products(name, main_image_url))').eq('id', id).single();
    if (error) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.status(200).json(data);
  }

  // POST /api/orders — criar pedido (checkout)
  if (req.method === 'POST') {
    const { items, customer, payment_method, shipping_address, coupon_code } = req.body;

    // Gerar número do pedido
    const order_number = `OM${Date.now().toString().slice(-8)}`;

    // Calcular totais
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discount_amount = 0; // TODO: aplicar cupom
    const shipping_amount = subtotal >= 300 ? 0 : 25;
    const total = subtotal - discount_amount + shipping_amount;

    const { data: order, error } = await supabase.from('orders').insert({
      order_number,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_cpf: customer.cpf,
      subtotal,
      discount_amount,
      shipping_amount,
      total,
      payment_method,
      shipping_address,
      status: 'pending',
      payment_status: 'pending',
    }).select().single();

    if (error) return res.status(400).json({ message: error.message });

    // Inserir itens do pedido
    const orderItems = items.map(i => ({
      order_id: order.id,
      product_id: i.id,
      product_name: i.name,
      product_sku: i.sku,
      quantity: i.quantity,
      unit_price: i.price,
      total_price: i.price * i.quantity,
    }));

    await supabase.from('order_items').insert(orderItems);

    return res.status(201).json(order);
  }

  // PATCH /api/orders?id=xxx — atualizar status do pedido
  if (req.method === 'PATCH' && id) {
    const { data, error } = await supabase.from('orders')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
