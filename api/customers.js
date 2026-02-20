// api/customers.js — Listagem e detalhes de clientes para o painel administrativo
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'oticas-master-jwt-secret-2026-felipe-juliana-parauapebas-pa';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function verifyAdminToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    if (payload.role !== 'admin' && payload.role !== 'super_admin') return null;
    return payload;
  } catch { return null; }
}

function requireAdmin(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ message: 'Não autorizado' }); return null; }
  const payload = verifyAdminToken(token);
  if (!payload) { res.status(401).json({ message: 'Token inválido ou expirado' }); return null; }
  return payload;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    // GET /api/customers?id=xxx — Detalhes completos de um cliente específico
    if (req.query.id) {
      const customerId = req.query.id;

      // Buscar dados básicos do cliente
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name, email, phone, cpf, gender, birthdate, newsletter, created_at')
        .eq('id', customerId)
        .single();

      if (customerError || !customer) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }

      // Buscar endereços
      const { data: addresses } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      // Buscar cartões
      const { data: cards } = await supabase
        .from('customer_cards')
        .select('id, card_brand, last_four, holder_name, expiry_month, expiry_year, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      // Buscar favoritos
      const { data: favorites } = await supabase
        .from('customer_favorites')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      // Buscar pedidos
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, total, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      return res.status(200).json({
        ...customer,
        addresses: addresses || [],
        cards: cards || [],
        favorites: favorites || [],
        orders: orders || [],
      });
    }

    // GET /api/customers — Listar clientes com paginação e busca
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('customers')
      .select('id, name, email, phone, cpf, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: customers, count, error } = await query;
    if (error) return res.status(400).json({ message: error.message });

    return res.status(200).json({
      customers: customers || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  }

  // DELETE /api/customers?id=xxx — Excluir cliente (preserva pedidos)
  if (req.method === 'DELETE') {
    const customerId = req.query.id;
    if (!customerId) return res.status(400).json({ message: 'ID do cliente é obrigatório' });

    // Verificar se o cliente existe
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name, email')
      .eq('id', customerId)
      .single();

    if (!customer) return res.status(404).json({ message: 'Cliente não encontrado' });

    // Preservar pedidos: desvincula o customer_id dos pedidos (mantém histórico)
    await supabase
      .from('orders')
      .update({ customer_id: null, customer_name: customer.name, customer_email: customer.email })
      .eq('customer_id', customerId);

    // Excluir dados vinculados
    await supabase.from('customer_addresses').delete().eq('customer_id', customerId);
    await supabase.from('customer_cards').delete().eq('customer_id', customerId);
    await supabase.from('customer_favorites').delete().eq('customer_id', customerId);

    // Excluir o cliente
    const { error } = await supabase.from('customers').delete().eq('id', customerId);
    if (error) return res.status(500).json({ message: error.message });

    // TODO: Enviar e-mail de notificação ao cliente quando sistema de e-mails for integrado
    // sendEmail(customer.email, 'Conta excluída', 'Sua conta na Óticas Master foi excluída...')

    return res.status(200).json({ message: 'Cliente excluído com sucesso', deleted: { id: customerId, name: customer.name, email: customer.email } });
  }

  // POST /api/customers?action=cleanup — Limpeza automática de contas inativas
  // Regra: conta criada há mais de 1 ano E nunca fez nenhuma compra
  if (req.method === 'POST' && req.query.action === 'cleanup') {
    // Buscar clientes com conta há mais de 1 ano
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: oldCustomers } = await supabase
      .from('customers')
      .select('id, name, email, created_at')
      .lt('created_at', oneYearAgo.toISOString());

    if (!oldCustomers || oldCustomers.length === 0) {
      return res.status(200).json({ message: 'Nenhum cliente elegível para exclusão', deleted: 0 });
    }

    // Filtrar apenas os que nunca compraram
    const deleted = [];
    for (const c of oldCustomers) {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', c.id);

      if (count === 0) {
        // Excluir dados vinculados
        await supabase.from('customer_addresses').delete().eq('customer_id', c.id);
        await supabase.from('customer_cards').delete().eq('customer_id', c.id);
        await supabase.from('customer_favorites').delete().eq('customer_id', c.id);
        await supabase.from('customers').delete().eq('id', c.id);
        deleted.push({ id: c.id, name: c.name, email: c.email });
        // TODO: Enviar e-mail de notificação quando sistema de e-mails for integrado
      }
    }

    return res.status(200).json({
      message: `Limpeza concluída: ${deleted.length} conta(s) excluída(s)`,
      deleted: deleted.length,
      accounts: deleted
    });
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
