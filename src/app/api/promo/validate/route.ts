import { NextResponse } from 'next/server';
import { validatePromoCode } from '@/lib/order-pricing';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const subtotal = Number(body?.subtotal) || 0;
    const res = await validatePromoCode(String(body?.code || ''), subtotal);

    if (!res.ok) {
      return NextResponse.json({ success: false, message: res.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, promo: res.promo, discountBdt: res.discountBdt });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json({ success: false, message: 'Could not validate the code. Please try again.' }, { status: 500 });
  }
}
