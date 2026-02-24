// api/migrate.js — Migration temporária para adicionar colunas do PagBank
// REMOVER APÓS EXECUTAR!
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // Proteção básica: só aceita GET com secret
  const { secret } = req.query;
  if (secret !== 'pagbank-migration-2026') {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  const results = [];

  // 1. Adicionar coluna pagbank_order_id
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS pagbank_order_id VARCHAR(255)'
    });
    results.push({ step: 'pagbank_order_id', error: error?.message || null });
  } catch (e) {
    // Tentar via query direta
    results.push({ step: 'pagbank_order_id', error: e.message });
  }

  // 2. Adicionar coluna pagbank_charge_id
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS pagbank_charge_id VARCHAR(255)'
    });
    results.push({ step: 'pagbank_charge_id', error: error?.message || null });
  } catch (e) {
    results.push({ step: 'pagbank_charge_id', error: e.message });
  }

  // 3. Adicionar coluna customer_cpf
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_cpf VARCHAR(20)'
    });
    results.push({ step: 'customer_cpf', error: error?.message || null });
  } catch (e) {
    results.push({ step: 'customer_cpf', error: e.message });
  }

  // Verificar estrutura atual da tabela orders
  const { data: columns, error: colError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'orders')
    .eq('table_schema', 'public');

  return res.status(200).json({
    message: 'Migration executada',
    results,
    columns: columns || [],
    colError: colError?.message,
  });
}
