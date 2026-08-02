import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

async function seed() {
  if (!connectionString) {
    console.error('❌ DATABASE_URL is missing in environment variables');
    process.exit(1);
  }

  const client = neon(connectionString);
  const db = drizzle(client, { schema });

  console.log('🌱 Starting database seed...');

  // 1. Seed Categories
  const [forHim] = await db.insert(schema.categories).values({
    name: 'For Him',
    slug: 'for-him',
    description: 'Performance athletic apparel for men',
  }).returning();

  const [forHer] = await db.insert(schema.categories).values({
    name: 'For Her',
    slug: 'for-her',
    description: 'Performance athletic apparel for women',
  }).returning();

  // 2. Seed Products
  const [oakwood] = await db.insert(schema.products).values({
    name: 'Oakwood Long sleeve',
    slug: 'oakwood-long-sleeve',
    description: 'Ultralight recycled mesh long sleeve in race fit with bonded seams and a silicone logo.',
    priceBdt: 899,
    compareAtPriceBdt: 1199,
    collectionTag: 'Minimal',
    specifications: '- Silicone heat press labels\n- 95 GSM Lightweight Breathable Polyester',
    categoryId: forHim.id,
  }).returning();

  const [owayo] = await db.insert(schema.products).values({
    name: 'OWAYO - CROSS FADE',
    slug: 'owayo-cross-fade',
    description: 'Geometric performance jersey with moisture wicking fabric.',
    priceBdt: 899,
    compareAtPriceBdt: 1199,
    collectionTag: 'Gaming',
    specifications: '- Geometric sublimated graphic\n- Moisture wicking athletic mesh',
    categoryId: forHim.id,
  }).returning();

  // 3. Seed Color Variants for Oakwood
  const [yellowVariant] = await db.insert(schema.colorVariants).values({
    productId: oakwood.id,
    name: 'Yellow',
    hexColor: '#E6A100',
    thumbnailUrl: '/images/products/oakwood-yellow-thumb.png',
    isLowStock: true,
  }).returning();

  const [blackVariant] = await db.insert(schema.colorVariants).values({
    productId: oakwood.id,
    name: 'Black',
    hexColor: '#050505',
    thumbnailUrl: '/images/products/oakwood-black-thumb.png',
    isLowStock: false,
  }).returning();

  const [greyVariant] = await db.insert(schema.colorVariants).values({
    productId: oakwood.id,
    name: 'Grey',
    hexColor: '#707070',
    thumbnailUrl: '/images/products/oakwood-grey-thumb.png',
    isLowStock: false,
  }).returning();

  // 4. Seed Variant Gallery Images
  await db.insert(schema.variantImages).values([
    { variantId: yellowVariant.id, imageUrl: '/images/products/oakwood-yellow-1.png', displayOrder: 1 },
    { variantId: yellowVariant.id, imageUrl: '/images/products/oakwood-yellow-2.png', displayOrder: 2 },
    { variantId: yellowVariant.id, imageUrl: '/images/products/oakwood-yellow-3.png', displayOrder: 3 },
    { variantId: blackVariant.id, imageUrl: '/images/products/oakwood-black-1.png', displayOrder: 1 },
    { variantId: blackVariant.id, imageUrl: '/images/products/oakwood-black-2.png', displayOrder: 2 },
    { variantId: greyVariant.id, imageUrl: '/images/products/oakwood-grey-1.png', displayOrder: 1 },
  ]);

  // 5. Seed Stock Inventory
  await db.insert(schema.stockInventory).values([
    { variantId: yellowVariant.id, size: 'S', quantity: 5, isStockOut: false },
    { variantId: yellowVariant.id, size: 'M', quantity: 8, isStockOut: false },
    { variantId: yellowVariant.id, size: 'XL', quantity: 3, isStockOut: false },
    { variantId: yellowVariant.id, size: 'XXL', quantity: 0, isStockOut: true },
  ]);

  // 6. Seed Promo Codes
  await db.insert(schema.promoCodes).values([
    { code: 'LIVUS10', discountType: 'percentage', discountValue: 10, isActive: true },
    { code: 'SAVE500', discountType: 'fixed', discountValue: 500, isActive: true },
    { code: 'GIFT2000', discountType: 'fixed', discountValue: 2000, isActive: true },
  ]);

  console.log('✅ Database seeded successfully!');
}

seed().catch((err) => {
  console.error('❌ Error seeding database:', err);
  process.exit(1);
});
