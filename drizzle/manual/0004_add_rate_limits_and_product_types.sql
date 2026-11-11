-- Migration 0004: Add rate_limits table and store_settings.product_types
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  reset_at timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx ON rate_limits (reset_at);

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS product_types text;
