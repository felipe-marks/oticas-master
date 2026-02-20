// api/customer.js — Autenticação e área do cliente
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'oticas-master-jwt-secret-2026-felipe-juliana-parauapebas-pa';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'oticas-customer-salt').digest('hex');
}

function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyCustomerToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    if (payload.role !== 'customer') return null;
    return payload;
  } catch { return null; }
}

function requireCustomerAuth(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ message: 'Não autorizado' }); return null; }
  const payload = verifyCustomerToken(token);
  if (!payload) { res.status(401).json({ message: 'Token inválido ou expirado. Faça login novamente.' }); return null; }
  return payload;
}

// Validação de senha segura
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('pelo menos uma letra maiúscula');
  if (!/[0-9]/.test(password)) errors.push('pelo menos um número');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('pelo menos um símbolo (!@#$%...)');
  return errors;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // ===== REGISTRO =====
  if (action === 'register' && req.method === 'POST') {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios' });
    }

    // Validação de senha segura
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        message: `A senha precisa ter: ${passwordErrors.join(', ')}.`
      });
    }

    // Verificar se e-mail já existe
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado. Faça login.' });
    }

    const passwordHash = hashPassword(password);
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: null,
        password_hash: passwordHash
      })
      .select('id, name, email, phone, created_at')
      .single();

    if (error) return res.status(400).json({ message: error.message });

    const token = generateToken({ id: customer.id, email: customer.email, name: customer.name, role: 'customer' });
    return res.status(201).json({ user: customer, token });
  }

  // ===== LOGIN =====
  if (action === 'login' && req.method === 'POST') {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, name, email, phone, password_hash, active')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !customer) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos' });
    }
    if (!customer.active) {
      return res.status(403).json({ message: 'Conta desativada. Entre em contato com a loja.' });
    }

    const passwordHash = hashPassword(password);
    if (customer.password_hash !== passwordHash) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos' });
    }

    const { password_hash, ...safeCustomer } = customer;
    const token = generateToken({ id: customer.id, email: customer.email, name: customer.name, role: 'customer' });
    return res.status(200).json({ user: safeCustomer, token });
  }

  // ===== MEUS PEDIDOS =====
  if (action === 'orders' && req.method === 'GET') {
    const payload = requireCustomerAuth(req, res);
    if (!payload) return;

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, status, total_amount, payment_method, tracking_code, notes, created_at,
        order_items (
          id, product_name, quantity, unit_price, image_url
        )
      `)
      .eq('customer_id', payload.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });

    const formatted = (orders || []).map(o => ({
      ...o,
      items: o.order_items || [],
    }));

    return res.status(200).json(formatted);
  }

  // ===== ATUALIZAR PERFIL =====
  if (action === 'profile' && req.method === 'PATCH') {
    const payload = requireCustomerAuth(req, res);
    if (!payload) return;

    const { name, phone } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone || null;

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', payload.id)
      .select('id, name, email, phone')
      .single();

    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json(data);
  }

  // ===== ALTERAR SENHA =====
  if (action === 'change-password' && req.method === 'POST') {
    const payload = requireCustomerAuth(req, res);
    if (!payload) return;

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
    }

    // Validar nova senha
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ message: `A nova senha precisa ter: ${passwordErrors.join(', ')}.` });
    }

    // Verificar senha atual
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('password_hash')
      .eq('id', payload.id)
      .single();

    if (fetchError || !customer) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const currentHash = hashPassword(currentPassword);
    if (customer.password_hash !== currentHash) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    const newHash = hashPassword(newPassword);
    const { error: updateError } = await supabase
      .from('customers')
      .update({ password_hash: newHash })
      .eq('id', payload.id);

    if (updateError) return res.status(500).json({ message: updateError.message });
    return res.status(200).json({ message: 'Senha alterada com sucesso!' });
  }

  // ===== VERIFICAR TOKEN =====
  if (action === 'verify' && req.method === 'GET') {
    const payload = requireCustomerAuth(req, res);
    if (!payload) return;
    return res.status(200).json({ valid: true, user: { id: payload.id, name: payload.name, email: payload.email } });
  }

  return res.status(404).json({ message: 'Ação não encontrada' });
}
