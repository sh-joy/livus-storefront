import { NextResponse } from 'next/server';
import { db } from '@/db';

// Fallback promo codes dictionary
const fallbackPromos: Record<string, { type: 'percentage' | 'fixed'; value: number; description: string }> = {
  LIVUS10: { type: 'percentage', value: 10, description: '10% OFF' },
  SAVE500: { type: 'fixed', value: 500, description: '৳500 BDT OFF' },
  GIFT2000: { type: 'fixed', value: 2000, description: '৳2000 Gift Card' },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = (body.code || '').trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ success: false, message: 'Please enter a valid gift or promo code' }, { status: 400 });
    }

    if (db) {
      const dbPromo = await db.query.promoCodes.findFirst({
        where: (promos, { eq, and }) => and(eq(promos.code, code), eq(promos.isActive, true)),
      });

      if (dbPromo) {
        return NextResponse.json({
          success: true,
          promo: {
            code: dbPromo.code,
            type: dbPromo.discountType,
            value: dbPromo.discountValue,
            description: dbPromo.discountType === 'percentage' ? `${dbPromo.discountValue}% OFF` : `৳${dbPromo.discountValue} BDT OFF`,
          },
        });
      }
    }

    // Fallback dictionary check
    if (fallbackPromos[code]) {
      const p = fallbackPromos[code];
      return NextResponse.json({
        success: true,
        promo: {
          code,
          type: p.type,
          value: p.value,
          description: p.description,
        },
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid gift or promo code.' }, { status: 404 });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json({ success: false, message: 'Invalid gift or promo code.' }, { status: 500 });
  }
}
