// /api/freight.js — Cálculo de frete via Melhor Envio (PAC e SEDEX)
import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const {
    cep,
    valor = '200',
    peso = '0.3',
    comprimento = '20',
    altura = '10',
    largura = '15',
  } = req.query;

  if (!cep || cep.replace(/\D/g, '').length !== 8) {
    return res.status(400).json({ error: 'CEP inválido' });
  }

  const cepLimpo = cep.replace(/\D/g, '');
  const token = process.env.MELHOR_ENVIO_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Token do Melhor Envio não configurado.' });
  }

  try {
    const response = await axios.post(
      'https://melhorenvio.com.br/api/v2/me/shipment/calculate',
      {
        from: { postal_code: '68515000' },
        to: { postal_code: cepLimpo },
        package: {
          height: parseInt(altura),
          width: parseInt(largura),
          length: parseInt(comprimento),
          weight: parseFloat(peso),
        },
        options: {
          insurance_value: parseFloat(valor),
          receipt: false,
          own_hand: false,
        },
        services: '1,2', // 1 = PAC, 2 = SEDEX
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'OticasMaster (felipedourado029@gmail.com)',
        },
        timeout: 10000,
      }
    );

    const data = response.data;

    if (!Array.isArray(data)) {
      console.error('Resposta inesperada do Melhor Envio:', data);
      return res.status(400).json({ error: 'Não foi possível calcular o frete para este CEP.' });
    }

    // Filtrar apenas resultados válidos (sem erro)
    const fretes = data
      .filter((item) => !item.error && item.price)
      .map((item) => ({
        codigo: String(item.id),
        nome: item.name,
        preco: parseFloat(item.price),
        prazo: item.delivery_range ? item.delivery_range.max : item.delivery_time,
        prazoMin: item.delivery_range ? item.delivery_range.min : item.delivery_time,
        empresa: item.company ? item.company.name : 'Correios',
      }));

    if (fretes.length === 0) {
      return res.status(400).json({ error: 'Não foi possível calcular o frete para este CEP.' });
    }

    return res.status(200).json({ fretes });
  } catch (error) {
    const msg = error.response
      ? JSON.stringify(error.response.data).slice(0, 200)
      : error.message;
    console.error('Erro ao calcular frete:', msg);
    return res.status(500).json({ error: 'Erro ao calcular frete. Tente novamente.' });
  }
}
