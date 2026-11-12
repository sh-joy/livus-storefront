-- 0009_payment_verification.sql
-- Add audit columns for manual bKash/Nagad payment verification
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_by text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_at timestamp;
