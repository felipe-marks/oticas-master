-- ============================================================
-- MIGRATION: Adicionar suporte ao PagBank na tabela orders
-- Data: 2026-02-24
-- ============================================================

-- Adicionar colunas do PagBank na tabela orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS pagbank_order_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS pagbank_charge_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_cpf VARCHAR(20);

-- Índice para busca por ID do PagBank
CREATE INDEX IF NOT EXISTS idx_orders_pagbank ON orders(pagbank_order_id);

-- Atualizar payment_status para incluir 'cancelled'
-- (O CHECK constraint precisa ser recriado se necessário)
-- Verificar se 'cancelled' já está no check constraint
-- Se não estiver, rodar:
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'chargeback', 'cancelled'));

-- Comentário
COMMENT ON COLUMN orders.pagbank_order_id IS 'ID do pedido no PagBank';
COMMENT ON COLUMN orders.pagbank_charge_id IS 'ID da cobrança no PagBank';
COMMENT ON COLUMN orders.customer_cpf IS 'CPF do cliente (necessário para PagBank)';
