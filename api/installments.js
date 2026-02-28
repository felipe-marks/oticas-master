/**
 * GET /api/installments?value=21900&max_installments=12
 * Retorna as opções de parcelamento com juros calculados pelo PagBank.
 * value: valor em centavos (ex: R$ 219,00 = 21900)
 * max_installments: número máximo de parcelas (padrão: 12)
 */

const corsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
};

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Método não permitido' });

  const { value, max_installments = 12 } = req.query;

  if (!value || isNaN(Number(value)) || Number(value) <= 0) {
    return res.status(400).json({ message: 'Parâmetro value inválido. Informe o valor em centavos.' });
  }

  const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
  const PAGBANK_ENV = process.env.PAGBANK_ENV || 'sandbox';
  const BASE_URL = PAGBANK_ENV === 'production'
    ? 'https://api.pagseguro.com'
    : 'https://sandbox.api.pagseguro.com';

  try {
    const url = `${BASE_URL}/charges/fees/calculate?payment_method_type=CREDIT_CARD&value=${value}&max_installments=${max_installments}&max_installments_no_interest=0&payment_methods=CREDIT_CARD`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ message: 'Erro ao consultar PagBank', details: err });
    }

    const data = await response.json();

    // Extrair os planos de parcelamento (pegar o primeiro cartão disponível)
    const paymentMethods = data?.payment_methods?.credit_card;
    if (!paymentMethods) {
      return res.status(500).json({ message: 'Nenhum plano de parcelamento retornado pelo PagBank' });
    }

    // Pegar o primeiro cartão (ex: verdecard, visa, mastercard — todos têm os mesmos juros)
    const firstCard = Object.values(paymentMethods)[0];
    const plans = firstCard?.installment_plans || [];

    // Formatar para uso no frontend
    const installments = plans.map(plan => ({
      installments: plan.installments,
      installment_value: plan.installment_value, // em centavos
      total_value: plan.amount.value,             // em centavos
      interest_free: plan.interest_free,
      interest_total: plan.amount?.fees?.buyer?.interest?.total || 0, // em centavos
    }));

    return res.status(200).json({ installments });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno ao calcular parcelas', error: error.message });
  }
}
