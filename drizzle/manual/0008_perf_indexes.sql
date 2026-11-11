-- Round 8: Performance indexes for high-traffic storefront queries and joins
-- All statements are additive and idempotent (IF NOT EXISTS)

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_active_created ON products (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_color_variants_product_id ON color_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_inventory_variant_id ON stock_inventory (variant_id);
