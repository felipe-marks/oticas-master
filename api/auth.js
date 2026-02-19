// api/auth.js — Autenticação do painel admin
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 * 7 })).toString('base64url');
  const sig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'oticas-master-secret-2026').update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'oticas-master-secret-2026').update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });

  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('active', true)
    .single();

  if (error || !admin) return res.status(401).json({ message: 'Credenciais inválidas' });

  const hash = crypto.createHash('sha256').update(password + (admin.salt || '')).digest('hex');
  if (hash !== admin.password_hash) return res.status(401).json({ message: 'Credenciais inválidas' });

  await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', admin.id);

  const token = generateToken({ id: admin.id, email: admin.email, name: admin.name, role: admin.role });
  return res.status(200).json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
}
