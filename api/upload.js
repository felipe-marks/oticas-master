// api/upload.js — Upload de imagens para Supabase Storage
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

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !verifyToken(token)) return res.status(401).json({ message: 'Não autorizado' });

  try {
    const { base64, filename, bucket = 'products', contentType = 'image/jpeg' } = req.body;

    if (!base64) return res.status(400).json({ message: 'Dados da imagem são obrigatórios' });

    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const ext = contentType.split('/')[1] || 'jpg';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${bucket}/${uniqueName}`;

    const { error } = await supabase.storage.from(bucket).upload(uniqueName, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

    if (error) return res.status(400).json({ message: error.message });

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(uniqueName);

    return res.status(200).json({ url: publicUrl, path: uniqueName });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
