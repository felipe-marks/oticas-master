// api/upload.js — Upload de imagens para Supabase Storage
// Aceita: multipart/form-data (campo "file") OU JSON com campo "base64"
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const secret = process.env.JWT_SECRET || 'oticas-master-secret-2026';
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

// Desabilitar o bodyParser padrão do Vercel para lidar com multipart manualmente
export const config = {
  api: {
    bodyParser: false,
  },
};

// Parser manual de multipart/form-data
async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      const boundary = contentType.split('boundary=')[1];

      if (!boundary) {
        // Tentar como JSON
        try {
          resolve({ fields: JSON.parse(body.toString()), file: null });
        } catch {
          resolve({ fields: {}, file: null });
        }
        return;
      }

      const parts = body.toString('binary').split(`--${boundary}`);
      const fields = {};
      let file = null;

      for (const part of parts) {
        if (part === '--\r\n' || part.trim() === '--') continue;
        const [rawHeaders, ...rawBodyParts] = part.split('\r\n\r\n');
        if (!rawHeaders) continue;
        const rawBody = rawBodyParts.join('\r\n\r\n').replace(/\r\n$/, '');

        const nameMatch = rawHeaders.match(/name="([^"]+)"/);
        const filenameMatch = rawHeaders.match(/filename="([^"]+)"/);
        const mimeMatch = rawHeaders.match(/Content-Type:\s*([^\r\n]+)/i);

        if (!nameMatch) continue;
        const fieldName = nameMatch[1];

        if (filenameMatch) {
          file = {
            filename: filenameMatch[1],
            mimetype: mimeMatch ? mimeMatch[1].trim() : 'image/jpeg',
            buffer: Buffer.from(rawBody, 'binary'),
          };
        } else {
          fields[fieldName] = rawBody;
        }
      }

      resolve({ fields, file });
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  try {
    const { fields, file } = await parseMultipart(req);
    const bucket = fields.bucket || 'products';

    let buffer, contentType, ext;

    if (file) {
      // Upload via FormData (multipart)
      buffer = file.buffer;
      contentType = file.mimetype || 'image/jpeg';
      ext = contentType.split('/')[1]?.split('+')[0] || 'jpg';
      if (ext === 'jpeg') ext = 'jpg';
    } else if (fields.base64) {
      // Upload via JSON base64
      const base64Data = fields.base64.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      contentType = fields.contentType || 'image/jpeg';
      ext = contentType.split('/')[1] || 'jpg';
      if (ext === 'jpeg') ext = 'jpg';
    } else {
      return res.status(400).json({ message: 'Nenhuma imagem enviada. Use o campo "file" (multipart) ou "base64" (JSON).' });
    }

    // Verificar tamanho (máx 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Imagem muito grande. Máximo permitido: 5MB.' });
    }

    // Nome único para o arquivo
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

    // Fazer upload para o Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .upload(uniqueName, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return res.status(400).json({ message: `Erro no storage: ${error.message}` });
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueName);

    return res.status(200).json({
      url: publicUrl,
      path: uniqueName,
      bucket,
    });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ message: `Erro interno: ${err.message}` });
  }
}
