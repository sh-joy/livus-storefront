-- Track 2: Add Accessories Category and reassign accessory products
INSERT INTO categories (id, name, slug, description, created_at)
VALUES (
  'c0000000-0000-0000-0000-000000000004',
  'Accessories',
  'accessories',
  'Handcrafted ties, cufflinks, belts, and luxury accessories',
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

UPDATE products
SET category_id = (SELECT id FROM categories WHERE slug = 'accessories'),
    collection_tag = 'Accessories'
WHERE slug IN ('red-silk-tie', 'silver-cufflinks', 'black-leather-belt');
