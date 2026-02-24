// api/payment.js — Integração com PagBank para checkout transparente
import { createClient } from '@supabase/supabase-js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function toCents(value) {
  return Math.round(value * 100);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Inicializar clientes dentro do handler para garantir acesso às env vars
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
  const PAGBANK_ENV = process.env.PAGBANK_ENV || 'sandbox';
  const PAGBANK_BASE_URL = PAGBANK_ENV === 'production'
    ? 'https://api.pagseguro.com'
    : 'https://sandbox.api.pagseguro.com';

  const { action } = req.query;

  // ─── POST /api/payment?action=create-order ─────────────────────────────────
  // Cria pedido no PagBank — Pix (qr_codes) ou Cartão (charges com card)
  if (req.method === 'POST' && action === 'create-order') {
    const { items, customer, shipping_address, payment_method = 'pix', card } = req.body;

    if (!items?.length || !customer?.name || !customer?.email || !customer?.cpf) {
      return res.status(400).json({ message: 'Dados incompletos: nome, email e CPF são obrigatórios' });
    }

    // Calcular totais
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping_amount = subtotal >= 300 ? 0 : 25;
    const total = subtotal + shipping_amount;

    // Gerar número do pedido
    const order_number = `OM${Date.now().toString().slice(-8)}`;

    // Dados do cliente
    const phone = customer.phone?.replace(/\D/g, '') || '';
    const customerData = {
      name: customer.name,
      email: customer.email,
      tax_id: customer.cpf.replace(/\D/g, ''),
      ...(phone.length >= 10 ? {
        phones: [{
          country: '55',
          area: phone.slice(0, 2),
          number: phone.slice(2),
          type: 'MOBILE',
        }]
      } : {}),
    };

    // Itens do pedido
    const orderItems = items.map(item => ({
      reference_id: String(item.id),
      name: item.name.slice(0, 64),
      quantity: item.quantity,
      unit_amount: toCents(item.price),
    }));

    // Endereço de entrega
    const shippingData = shipping_address ? {
      address: {
        street: shipping_address.street,
        number: shipping_address.number,
        ...(shipping_address.complement ? { complement: shipping_address.complement } : {}),
        locality: shipping_address.neighborhood,
        city: shipping_address.city,
        region_code: shipping_address.state,
        country: 'BRA',
        postal_code: shipping_address.zip?.replace(/\D/g, ''),
      },
    } : undefined;

    let pagbankPayload;

    if (payment_method === 'pix') {
      // ── Pedido Pix: apenas qr_codes, sem charges ──
      pagbankPayload = {
        reference_id: order_number,
        customer: customerData,
        items: orderItems,
        qr_codes: [{
          amount: { value: toCents(total) },
          expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }],
        ...(shippingData ? { shipping: shippingData } : {}),
        notification_urls: [`https://oticasmaster.com.br/api/payment?action=webhook`],
      };
    } else {
      // ── Pedido Cartão: charges com payment_method e card ──
      if (!card?.number || !card?.exp_month || !card?.exp_year || !card?.security_code || !card?.holder_name) {
        return res.status(400).json({ message: 'Dados do cartão incompletos' });
      }
      pagbankPayload = {
        reference_id: order_number,
        customer: customerData,
        items: orderItems,
        charges: [{
          reference_id: order_number,
          description: `Pedido ${order_number} - Oticas Master`,
          amount: { value: toCents(total), currency: 'BRL' },
          payment_method: {
            type: 'CREDIT_CARD',
            installments: card.installments || 1,
            capture: true,
            card: {
              number: card.number.replace(/\s/g, ''),
              exp_month: card.exp_month,
              exp_year: card.exp_year,
              security_code: card.security_code,
              holder: { name: card.holder_name },
            },
          },
          notification_urls: [`https://oticasmaster.com.br/api/payment?action=webhook`],
        }],
        ...(shippingData ? { shipping: shippingData } : {}),
        notification_urls: [`https://oticasmaster.com.br/api/payment?action=webhook`],
      };
    }

    try {
      const response = await fetch(`${PAGBANK_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAGBANK_TOKEN}`,
          'Content-Type': 'application/json',
          'x-api-version': '4.0',
        },
        body: JSON.stringify(pagbankPayload),
      });

      const pagbankData = await response.json();

      if (!response.ok) {
        console.error('PagBank error:', JSON.stringify(pagbankData));
        return res.status(400).json({
          message: 'Erro ao processar pagamento',
          details: pagbankData?.error_messages || pagbankData,
        });
      }

      // Salvar pedido no Supabase
      const { data: order, error: dbError } = await supabase.from('orders').insert({
        order_number,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_cpf: customer.cpf,
        subtotal,
        discount_amount: 0,
        shipping_amount,
        total,
        payment_method: payment_method === 'pix' ? 'pix' : 'credit_card',
        shipping_address,
        status: 'pending',
        payment_status: 'pending',
        pagbank_order_id: pagbankData.id,
      }).select().single();

      if (dbError) {
        console.error('DB error:', dbError);
        // Não bloquear o fluxo por erro de DB
      }

      // Salvar itens do pedido
      if (order?.id) {
        const orderItemsDB = items.map(i => ({
          order_id: order.id,
          product_id: i.id,
          product_name: i.name,
          product_sku: i.sku,
          quantity: i.quantity,
          unit_price: i.price,
          total_price: i.price * i.quantity,
        }));
        await supabase.from('order_items').insert(orderItemsDB).catch(console.error);
      }

      // Montar resposta
      const qrCode = pagbankData.qr_codes?.[0];
      const charge = pagbankData.charges?.[0];

      // Se cartão foi aprovado, atualizar status
      if (charge?.status === 'PAID' && order?.id) {
        await supabase.from('orders')
          .update({ payment_status: 'paid', status: 'confirmed' })
          .eq('id', order.id)
          .catch(console.error);
      }

      return res.status(201).json({
        order_id: order?.id,
        order_number,
        pagbank_order_id: pagbankData.id,
        pagbank_charge_id: charge?.id,
        total,
        payment_method,
        pix: qrCode ? {
          qr_code: qrCode.text,
          qr_code_image: qrCode.links?.find(l => l.rel === 'QRCODE.PNG')?.href,
          expiration_date: qrCode.expiration_date,
        } : null,
        card_status: charge?.status || null,
        card_payment_response: charge?.payment_response || null,
        status: charge?.status === 'PAID' ? 'paid' : 'pending',
      });

    } catch (err) {
      console.error('Payment error:', err);
      return res.status(500).json({ 
        message: 'Erro interno ao processar pagamento',
        debug: err.message || String(err)
      });
    }
  }

  // ─── POST /api/payment?action=webhook ──────────────────────────────────────
  if (req.method === 'POST' && action === 'webhook') {
    const { id, charges } = req.body;
    try {
      const charge = charges?.[0];
      if (charge?.status === 'PAID') {
        await supabase.from('orders')
          .update({ payment_status: 'paid', status: 'confirmed', updated_at: new Date().toISOString() })
          .eq('pagbank_order_id', id);
      } else if (charge?.status === 'DECLINED') {
        await supabase.from('orders')
          .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
          .eq('pagbank_order_id', id);
      } else if (charge?.status === 'CANCELED') {
        await supabase.from('orders')
          .update({ payment_status: 'cancelled', status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('pagbank_order_id', id);
      }
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('Webhook error:', err);
      return res.status(500).json({ message: 'Erro no webhook' });
    }
  }

  // ─── GET /api/payment?action=status&order_id=xxx ───────────────────────────
  if (req.method === 'GET' && action === 'status') {
    const { order_id } = req.query;
    if (!order_id) return res.status(400).json({ message: 'order_id obrigatório' });
    const { data, error } = await supabase.from('orders')
      .select('id, order_number, status, payment_status, total, pagbank_order_id')
      .eq('id', order_id).single();
    if (error) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.status(200).json(data);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
