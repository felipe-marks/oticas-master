// api/payment.js — Integração com PagBank para checkout transparente
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
const PAGBANK_EMAIL = process.env.PAGBANK_EMAIL;
const PAGBANK_ENV = process.env.PAGBANK_ENV || 'sandbox'; // 'sandbox' ou 'production'
const PAGBANK_BASE_URL = PAGBANK_ENV === 'production'
  ? 'https://api.pagseguro.com'
  : 'https://sandbox.api.pagseguro.com';

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'oticas-master-jwt-secret-2026-felipe-juliana-parauapebas-pa')
      .update(`${header}.${body}`)
      .digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Formata valor em centavos (PagBank usa centavos)
function toCents(value) {
  return Math.round(value * 100);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // ─── POST /api/payment?action=create-order ─────────────────────────────────
  // Cria pedido no PagBank e retorna o ID para processar pagamento
  if (req.method === 'POST' && action === 'create-order') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) return res.status(401).json({ message: 'Não autorizado' });

    const { items, customer, shipping_address, coupon_code } = req.body;

    if (!items?.length || !customer) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    // Calcular totais
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping_amount = subtotal >= 300 ? 0 : 25;
    const discount_amount = 0;
    const total = subtotal - discount_amount + shipping_amount;

    // Gerar número do pedido
    const order_number = `OM${Date.now().toString().slice(-8)}`;

    // Montar payload para o PagBank
    const pagbankPayload = {
      reference_id: order_number,
      customer: {
        name: customer.name,
        email: customer.email,
        tax_id: customer.cpf?.replace(/\D/g, ''),
        phones: customer.phone ? [{
          country: '55',
          area: customer.phone.replace(/\D/g, '').slice(0, 2),
          number: customer.phone.replace(/\D/g, '').slice(2),
          type: 'MOBILE',
        }] : [],
      },
      items: items.map(item => ({
        reference_id: String(item.id),
        name: item.name.slice(0, 64),
        quantity: item.quantity,
        unit_amount: toCents(item.price),
      })),
      qr_codes: [{
        amount: { value: toCents(total) },
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }],
      charges: [{
        reference_id: order_number,
        description: `Pedido ${order_number} — Óticas Master`,
        amount: {
          value: toCents(total),
          currency: 'BRL',
        },
        payment_method: {
          type: 'CREDIT_CARD',
          installments: 1,
          capture: true,
        },
        notification_urls: [`https://oticasmaster.com.br/api/payment?action=webhook`],
      }],
      shipping: shipping_address ? {
        address: {
          street: shipping_address.street,
          number: shipping_address.number,
          complement: shipping_address.complement || '',
          locality: shipping_address.neighborhood,
          city: shipping_address.city,
          region_code: shipping_address.state,
          country: 'BRA',
          postal_code: shipping_address.zip?.replace(/\D/g, ''),
        },
      } : undefined,
      notification_urls: [`https://oticasmaster.com.br/api/payment?action=webhook`],
    };

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
        console.error('PagBank error:', pagbankData);
        return res.status(400).json({
          message: 'Erro ao criar pedido no PagBank',
          details: pagbankData,
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
        discount_amount,
        shipping_amount,
        total,
        payment_method: 'pagbank',
        shipping_address,
        status: 'pending',
        payment_status: 'pending',
        pagbank_order_id: pagbankData.id,
      }).select().single();

      if (dbError) {
        console.error('DB error:', dbError);
        return res.status(500).json({ message: 'Erro ao salvar pedido' });
      }

      // Salvar itens do pedido
      const orderItems = items.map(i => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        product_sku: i.sku,
        quantity: i.quantity,
        unit_price: i.price,
        total_price: i.price * i.quantity,
      }));
      await supabase.from('order_items').insert(orderItems);

      // Extrair QR Code do Pix (se disponível)
      const qrCode = pagbankData.qr_codes?.[0];
      const charge = pagbankData.charges?.[0];

      return res.status(201).json({
        order_id: order.id,
        order_number,
        pagbank_order_id: pagbankData.id,
        pagbank_charge_id: charge?.id,
        total,
        pix: qrCode ? {
          qr_code: qrCode.text,
          qr_code_image: qrCode.links?.find(l => l.rel === 'QRCODE.PNG')?.href,
          expiration_date: qrCode.expiration_date,
        } : null,
        charge_links: charge?.links,
        status: 'pending',
      });

    } catch (err) {
      console.error('Payment error:', err);
      return res.status(500).json({ message: 'Erro interno ao processar pagamento' });
    }
  }

  // ─── POST /api/payment?action=pay-card ─────────────────────────────────────
  // Processa pagamento com cartão de crédito em uma cobrança existente
  if (req.method === 'POST' && action === 'pay-card') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) return res.status(401).json({ message: 'Não autorizado' });

    const { pagbank_charge_id, card, installments = 1 } = req.body;

    if (!pagbank_charge_id || !card) {
      return res.status(400).json({ message: 'Dados do cartão incompletos' });
    }

    try {
      const response = await fetch(`${PAGBANK_BASE_URL}/charges/${pagbank_charge_id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAGBANK_TOKEN}`,
          'Content-Type': 'application/json',
          'x-api-version': '4.0',
        },
        body: JSON.stringify({
          payment_method: {
            type: 'CREDIT_CARD',
            installments,
            capture: true,
            card: {
              number: card.number?.replace(/\s/g, ''),
              exp_month: card.exp_month,
              exp_year: card.exp_year,
              security_code: card.security_code,
              holder: {
                name: card.holder_name,
              },
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(400).json({
          message: 'Pagamento recusado',
          details: data,
        });
      }

      // Atualizar status no Supabase
      if (data.status === 'PAID') {
        await supabase.from('orders')
          .update({ payment_status: 'paid', status: 'confirmed', updated_at: new Date().toISOString() })
          .eq('pagbank_order_id', data.order_id);
      }

      return res.status(200).json({
        status: data.status,
        payment_response: data.payment_response,
      });

    } catch (err) {
      console.error('Card payment error:', err);
      return res.status(500).json({ message: 'Erro ao processar cartão' });
    }
  }

  // ─── POST /api/payment?action=webhook ──────────────────────────────────────
  // Recebe notificações do PagBank sobre mudanças de status
  if (req.method === 'POST' && action === 'webhook') {
    const { id, reference_id, charges } = req.body;

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
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) return res.status(401).json({ message: 'Não autorizado' });

    const { order_id } = req.query;
    const { data, error } = await supabase.from('orders')
      .select('id, order_number, status, payment_status, total, pagbank_order_id')
      .eq('id', order_id).single();

    if (error) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.status(200).json(data);
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
