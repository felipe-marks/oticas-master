// api/admin.js — Dashboard, Configurações e Upload
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

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !verifyToken(token)) return res.status(401).json({ message: 'Não autorizado' });

  const { resource } = req.query;

  // ===== DASHBOARD =====
  if (resource === 'dashboard') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    const [
      { data: revenueData },
      { data: lastMonthRevenue },
      { data: pendingOrders },
      { count: totalProducts },
      { data: lowStockItems },
      { count: totalCustomers },
      { data: newCustomers },
      { count: newsletterCount },
      { data: pendingAppointments },
      { data: recentOrders },
    ] = await Promise.all([
      supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', startOfMonth),
      supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth),
      supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('products').select('id', { count: 'exact' }).eq('active', true),
      supabase.from('products').select('id, name, stock_quantity').eq('active', true).lt('stock_quantity', 5).order('stock_quantity'),
      supabase.from('customers').select('id', { count: 'exact' }),
      supabase.from('customers').select('id', { count: 'exact' }).gte('created_at', startOfMonth),
      supabase.from('newsletter_subscribers').select('id', { count: 'exact' }).eq('active', true),
      supabase.from('appointments').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('orders').select('id, order_number, customer_name, total, status, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const thisMonthRevenue = (revenueData || []).reduce((s, o) => s + Number(o.total), 0);
    const lastMonthTotal = (lastMonthRevenue || []).reduce((s, o) => s + Number(o.total), 0);
    const growthPercent = lastMonthTotal > 0 ? Math.round(((thisMonthRevenue - lastMonthTotal) / lastMonthTotal) * 100) : 0;

    return res.status(200).json({
      revenue: {
        this_month: thisMonthRevenue,
        last_month: lastMonthTotal,
        growth_percent: growthPercent,
        orders_count: revenueData?.length || 0,
      },
      orders: { pending: pendingOrders?.length || 0, this_month: revenueData?.length || 0 },
      products: { total: totalProducts || 0, low_stock: lowStockItems?.length || 0, low_stock_items: lowStockItems || [] },
      customers: { total: totalCustomers || 0, new_this_month: newCustomers?.length || 0 },
      newsletter: { total: newsletterCount || 0 },
      appointments: { pending: pendingAppointments?.length || 0 },
      recent_orders: recentOrders || [],
    });
  }

  // ===== CONFIGURAÇÕES =====
  if (resource === 'settings') {
    if (req.method === 'GET') {
      const { data } = await supabase.from('site_settings').select('key, value');
      const settings = (data || []).reduce((acc, row) => {
        try { acc[row.key] = JSON.parse(row.value); } catch { acc[row.key] = row.value; }
        return acc;
      }, {});
      return res.status(200).json(settings);
    }
    if (req.method === 'PUT') {
      const upserts = Object.entries(req.body).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
      return res.status(200).json({ message: 'Configurações salvas' });
    }
  }

  return res.status(404).json({ message: `Recurso '${resource}' não encontrado` });
}
