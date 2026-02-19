import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  if (req.method === 'POST') {
    const { customer_name, customer_email, customer_phone, appointment_date, appointment_time, service_type, notes } = req.body;

    if (!customer_name || !customer_phone || !appointment_date || !appointment_time) {
      return res.status(400).json({ message: 'Preencha todos os campos obrigatórios' });
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([{ customer_name, customer_email, customer_phone, appointment_date, appointment_time, service_type: service_type || 'exame_vista', notes }])
      .select()
      .single();

    if (error) return res.status(500).json({ message: error.message });
    return res.status(201).json({ message: 'Agendamento realizado com sucesso!', appointment: data });
  }

  if (req.method === 'GET') {
    return requireAuth(async (req, res) => {
      const { status, date_from, date_to } = req.query;
      let query = supabase.from('appointments').select('*').order('appointment_date').order('appointment_time');
      if (status) query = query.eq('status', status);
      if (date_from) query = query.gte('appointment_date', date_from);
      if (date_to) query = query.lte('appointment_date', date_to);
      const { data, error } = await query;
      if (error) return res.status(500).json({ message: error.message });
      return res.status(200).json(data);
    })(req, res);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default corsHandler(handler);
