import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    if (db) {
      const products = await db.query.products.findMany({
        where: (p, { eq }) => eq(p.isActive, true),
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

  return NextResponse.json({ success: true, products: [] });
}
