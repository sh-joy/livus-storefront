import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    if (db) {
      const product = await db.query.products.findFirst({
        where: (products, { eq }) => eq(products.slug, slug),
        with: {
          colorVariants: {
            with: {
              variantImages: true,
              stockInventory: true,
            },
          },
        },
      });

      if (product && product.isActive) {
        return NextResponse.json({ success: true, product });
      }
    }
  } catch (error) {
    console.error(`Error fetching product [${slug}] from DB:`, error);
  }

  // H7: Unknown slugs or inactive products must return 404
  return NextResponse.json(
    { success: false, message: 'Product not found' },
    { status: 404 }
  );
}
