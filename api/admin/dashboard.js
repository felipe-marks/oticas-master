import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  return requireAuth(async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    const [
      ordersThisMonth,
      ordersLastMonth,
      pendingOrders,
      totalProducts,
      lowStockProducts,
      totalCustomers,
      newCustomersThisMonth,
      recentOrders,
      newsletterCount,
      pendingAppointments,
    ] = await Promise.all([
      supabase.from('orders').select('total', { count: 'exact' }).gte('created_at', startOfMonth).eq('payment_status', 'paid'),
      supabase.from('orders').select('total', { count: 'exact' }).gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth).eq('payment_status', 'paid'),
      supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('products').select('id', { count: 'exact' }).eq('active', true),
      supabase.from('products').select('id, name, stock_quantity', { count: 'exact' }).eq('active', true).eq('track_stock', true).lt('stock_quantity', 5),
      supabase.from('customers').select('id', { count: 'exact' }),
      supabase.from('customers').select('id', { count: 'exact' }).gte('created_at', startOfMonth),
      supabase.from('orders').select('id, order_number, customer_name, total, status, payment_status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('newsletter_subscribers').select('id', { count: 'exact' }).eq('active', true),
      supabase.from('appointments').select('id', { count: 'exact' }).eq('status', 'pending'),
    ]);

    const revenueThisMonth = (ordersThisMonth.data || []).reduce((sum, o) => sum + Number(o.total), 0);
    const revenueLastMonth = (ordersLastMonth.data || []).reduce((sum, o) => sum + Number(o.total), 0);
    const revenueGrowth = revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100).toFixed(1)
      : 0;

    return res.status(200).json({
      revenue: {
        this_month: revenueThisMonth,
        last_month: revenueLastMonth,
        growth_percent: Number(revenueGrowth),
        orders_count: ordersThisMonth.count || 0,
      },
      orders: {
        pending: pendingOrders.count || 0,
        this_month: ordersThisMonth.count || 0,
      },
      products: {
        total: totalProducts.count || 0,
        low_stock: lowStockProducts.count || 0,
        low_stock_items: lowStockProducts.data || [],
      },
      customers: {
        total: totalCustomers.count || 0,
        new_this_month: newCustomersThisMonth.count || 0,
      },
      newsletter: {
        total: newsletterCount.count || 0,
      },
      appointments: {
        pending: pendingAppointments.count || 0,
      },
      recent_orders: recentOrders.data || [],
    });
  })(req, res);
}

export default corsHandler(handler);
