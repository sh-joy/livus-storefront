import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

// Mock fallback products list if DB is not connected
const fallbackProducts = [
  {
    id: 'oakwood-long-sleeve',
    name: 'Oakwood Long sleeve',
    slug: 'oakwood-long-sleeve',
    description: 'Ultralight recycled mesh long sleeve in race fit with bonded seams and a silicone logo.',
    priceBdt: 899,
    originalPriceBdt: 1199,
    category: 'For Him',
  },
  {
    id: 'owayo-cross-fade',
    name: 'OWAYO - CROSS FADE',
    slug: 'owayo-cross-fade',
    description: 'Geometric performance jersey with moisture wicking fabric.',
    priceBdt: 899,
    originalPriceBdt: 1199,
    category: 'For Him',
  },
];

export async function GET() {
  try {
    if (db) {
      const products = await db.query.products.findMany({
        with: {
          colorVariants: {
            with: {
              variantImages: true,
              stockInventory: true,
            },
          },
        },
      });
      return NextResponse.json({ success: true, products });
    }
  } catch (error) {
    console.error('Error fetching products from DB:', error);
  }

  return NextResponse.json({ success: true, products: fallbackProducts });
}
