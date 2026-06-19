// api/_auth.js — Módulo centralizado de autenticação JWT
// Importado por todas as outras APIs para garantir consistência
import crypto from 'crypto';

// Secret único e consistente em toda a aplicação
const JWT_SECRET = () => process.env.JWT_SECRET || 'oticas-master-jwt-secret-2026-felipe-juliana-parauapebas-pa';

export function generateToken(payload) {
  const secret = JWT_SECRET();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 86400000 * 7  // 7 dias
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  try {
    const secret = JWT_SECRET();
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export function requireAuth(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    return null;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ message: 'Token inválido ou expirado. Faça login novamente.' });
    return null;
  }
  return payload;
}
