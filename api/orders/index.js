import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHandler } from '../_middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `OM${year}${month}${random}`;
}

async function handler(req, res) {
  const { method } = req;

  // GET — Listar pedidos (requer auth admin)
  if (method === 'GET') {
    return requireAuth(async (req, res) => {
      const { page = 1, limit = 20, status, payment_status, search } = req.query;

      let query = supabase
        .from('orders')
        .select(`*, order_items(*, products(name, main_image_url)), customers(name, email, phone)`, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (payment_status) query = query.eq('payment_status', payment_status);
      if (search) query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);

      query = query.range((page - 1) * limit, page * limit - 1);
      const { data, error, count } = await query;
      if (error) return res.status(500).json({ message: error.message });

      return res.status(200).json({
        orders: data,
        pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / limit) }
      });
    })(req, res);
  }

  // POST — Criar pedido (público — checkout do cliente)
  if (method === 'POST') {
    const { customer, items, payment_method, payment_installments = 1, shipping_address, coupon_code, notes } = req.body;

    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ message: 'Dados do pedido incompletos' });
    }

    // Calcular totais
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('id, sku, name, price_sale, price_original, main_image_url, stock_quantity, track_stock')
        .eq('id', item.product_id)
        .single();

      if (!product) return res.status(400).json({ message: `Produto ${item.product_id} não encontrado` });
      if (product.track_stock && product.stock_quantity < item.quantity) {
        return res.status(400).json({ message: `Estoque insuficiente para ${product.name}` });
      }

      const unitPrice = product.price_sale || product.price_original;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        product_id: product.id,
        product_sku: product.sku,
        product_name: product.name,
        product_image: product.main_image_url,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      });
    }

    // Aplicar cupom/promoção
    let discountAmount = 0;
    let promotionId = null;
    if (coupon_code) {
      const { data: promo } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('active', true)
        .single();

      if (promo && (!promo.ends_at || new Date(promo.ends_at) > new Date())) {
        if (promo.type === 'percentage') discountAmount = subtotal * (promo.value / 100);
        else if (promo.type === 'fixed_amount') discountAmount = promo.value;
        promotionId = promo.id;
      }
    }

    // Desconto PIX
    if (payment_method === 'pix') {
      const { data: settings } = await supabase.from('site_settings').select('value').eq('key', 'pix_discount_percent').single();
      const pixDiscount = settings ? Number(settings.value) : 5;
      discountAmount += subtotal * (pixDiscount / 100);
    }

    const shippingAmount = 0; // Calcular frete aqui futuramente
    const total = Math.max(0, subtotal - discountAmount + shippingAmount);

    // Criar ou buscar cliente
    let customerId = null;
    if (customer.email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert([{ name: customer.name, email: customer.email, phone: customer.phone }])
          .select('id')
          .single();
        if (newCustomer) customerId = newCustomer.id;
      }
    }

    // Criar pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: generateOrderNumber(),
        customer_id: customerId,
        status: 'pending',
        payment_status: 'pending',
        subtotal,
        discount_amount: discountAmount,
        shipping_amount: shippingAmount,
        total,
        payment_method,
        payment_installments,
        promotion_id: promotionId,
        coupon_code,
        shipping_address,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        notes,
      }])
      .select()
      .single();

    if (orderError) return res.status(500).json({ message: orderError.message });

    // Criar itens do pedido
    const itemsWithOrderId = orderItems.map(item => ({ ...item, order_id: order.id }));
    await supabase.from('order_items').insert(itemsWithOrderId);

    // Atualizar estoque
    for (const item of items) {
      await supabase.rpc('decrement_stock', { product_id: item.product_id, qty: item.quantity });
    }

    return res.status(201).json({
      order_id: order.id,
      order_number: order.order_number,
      total: order.total,
      status: order.status,
    });
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default corsHandler(handler);
