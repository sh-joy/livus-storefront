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

      if (product) {
        return NextResponse.json({ success: true, product });
      }
    }
  } catch (error) {
    console.error(`Error fetching product [${slug}] from DB:`, error);
  }

  // Fallback default response for oakwood-long-sleeve
  return NextResponse.json({
    success: true,
    product: {
      id: 'oakwood-long-sleeve',
      name: 'Oakwood Long sleeve',
      slug: 'oakwood-long-sleeve',
      description: 'Ultralight recycled mesh long sleeve in race fit with bonded seams and a silicone logo.',
      priceBdt: 899,
      originalPriceBdt: 1199,
      variants: [
        { name: 'Yellow', isLowStock: true },
        { name: 'Black', isLowStock: false },
        { name: 'Grey', isLowStock: false },
      ],
    },
  });
}
