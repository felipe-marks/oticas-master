// api/customers.js — Listagem de clientes para o painel administrativo
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

  // GET /api/customers — Listar clientes com paginação e busca
  if (req.method === 'GET') {
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

  // GET /api/customers?id=xxx — Detalhes de um cliente específico
  if (req.method === 'GET' && req.query.id) {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, name, email, phone, cpf, gender, birthdate, created_at')
      .eq('id', req.query.id)
      .single();
    if (error) return res.status(404).json({ message: 'Cliente não encontrado' });
    return res.status(200).json(customer);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
