-- Add payment verification and promo tracking columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_trx_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_sender_phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code text;

-- Add index on payment_trx_id for fast duplicate TrxID lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_trx_id ON orders(payment_trx_id);
CREATE INDEX IF NOT EXISTS idx_orders_promo_code ON orders(promo_code);
