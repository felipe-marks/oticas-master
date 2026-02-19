import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = { api: { bodyParser: false } };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  return requireAuth(async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

    const form = formidable({ maxFileSize: 5 * 1024 * 1024 }); // 5MB
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(400).json({ message: 'Erro ao processar arquivo' });

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return res.status(400).json({ message: 'Nenhum arquivo enviado' });

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.' });
      }

      const bucket = fields.bucket?.[0] || 'products';
      const ext = path.extname(file.originalFilename || '.jpg');
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;

      const fileBuffer = fs.readFileSync(file.filepath);
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, fileBuffer, { contentType: file.mimetype, cacheControl: '3600' });

      fs.unlinkSync(file.filepath); // limpar temp

      if (error) return res.status(500).json({ message: error.message });

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return res.status(200).json({ url: urlData.publicUrl, path: data.path });
    });
  })(req, res);
}

export default corsHandler(handler);
