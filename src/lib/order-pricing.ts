import { db } from '@/db';
import { products, promoCodes, stockInventory, storeSettings, shippingRegions, orders } from '@/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

/**
 * Single source of truth for order money math. Used both to show the checkout
 * summary and to save the order, so what the customer sees is what gets stored.
 *
 * Configure with env vars (defaults match the current storefront):
 *   VAT_PERCENT=10   DELIVERY_CHARGE_BDT=150
 */
export const VAT_PERCENT = Number(process.env.VAT_PERCENT ?? 10);
export const DELIVERY_CHARGE_BDT = Number(process.env.DELIVERY_CHARGE_BDT ?? 150);

export interface QuoteItemInput {
  productId: string; // product UUID (or slug / legacy "slug-color" cart id)
  variantName?: string;
  size?: string;
  quantity: number;
}

export interface QuotedLine {
  productId: string;
  productName: string;
  variantName: string;
  size: string;
  quantity: number;
  unitPriceBdt: number;
  lineTotalBdt: number;
  thumbnailUrl: string | null;
  stockRowId: string | null;
}

export interface OrderQuote {
  lines: QuotedLine[];
  subtotalBdt: number;
  discountBdt: number;
  vatBdt: number;
  vatPercent: number;
  deliveryChargeBdt: number;
  freeShippingThresholdBdt: number;
  freeShippingEligible: boolean;
  amountNeededForFreeShippingBdt: number;
  totalBdt: number;
  promo: { code: string; description: string } | null;
  promoError?: string;
}

export type QuoteResult = { ok: true; quote: OrderQuote } | { ok: false; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProductWithVariants = NonNullable<Awaited<ReturnType<typeof loadProduct>>>;

async function loadProduct(where: ReturnType<typeof eq>) {
  return db.query.products.findFirst({
    where,
    with: { colorVariants: { with: { stockInventory: true } } },
  });
}

async function resolveProduct(idOrSlug: string): Promise<ProductWithVariants | null> {
  const key = (idOrSlug || '').trim().toLowerCase();
  if (!key) return null;
  if (UUID_RE.test(key)) {
    const byId = await loadProduct(eq(products.id, key));
    if (byId) return byId;
  }
  const bySlug = await loadProduct(eq(products.slug, key));
  if (bySlug) return bySlug;

  // Legacy carts stored "<slug>-<color>" as the id: find the longest slug that prefixes it.
  const all = await db.select({ id: products.id, slug: products.slug }).from(products);
  const match = all
    .filter((p) => key.startsWith(`${p.slug.toLowerCase()}-`))
    .sort((a, b) => b.slug.length - a.slug.length)[0];
  return match ? (await loadProduct(eq(products.id, match.id))) ?? null : null;
}

export async function validatePromoCode(rawCode: string, subtotalBdt: number) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return { ok: false as const, message: 'Please enter a valid gift or promo code' };

  // Only select columns that exist in every deployed version of promo_codes.
  // (min_cart_value / usage_limit were added to the schema later and may not be migrated yet.)
  const promo = await db.query.promoCodes.findFirst({
    columns: { code: true, discountType: true, discountValue: true, expiresAt: true, isActive: true },
    where: and(eq(promoCodes.code, code), eq(promoCodes.isActive, true)),
  });
  if (!promo) return { ok: false as const, message: 'Invalid gift or promo code.' };
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { ok: false as const, message: 'This promo code has expired.' };
  }

  let minCartValue = 0;
  try {
    const extra = await db.query.promoCodes.findFirst({
      columns: { minCartValue: true },
      where: eq(promoCodes.code, code),
    });
    minCartValue = extra?.minCartValue ?? 0;
  } catch {
    // column not migrated yet — no minimum applies
  }
  // P2.15: Check usageLimit if configured on promo
  try {
    const promoWithLimit = await db.query.promoCodes.findFirst({
      columns: { usageLimit: true },
      where: eq(promoCodes.code, code),
    });
    if (promoWithLimit?.usageLimit && promoWithLimit.usageLimit > 0) {
      const usedOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.promoCode, code));
      if (usedOrders.length >= promoWithLimit.usageLimit) {
        return { ok: false as const, message: 'This promo code has reached its maximum usage limit.' };
      }
    }
  } catch (limitErr) {
    // Non-fatal if table doesn't have promoCode column yet
  }

  if (minCartValue && subtotalBdt > 0 && subtotalBdt < minCartValue) {
    return { ok: false as const, message: `This code needs a minimum order of ৳${minCartValue} BDT.` };
  }

  const isPct = promo.discountType === 'percentage';
  const raw = isPct ? Math.round((subtotalBdt * promo.discountValue) / 100) : promo.discountValue;
  return {
    ok: true as const,
    promo: {
      code: promo.code,
      type: isPct ? ('percentage' as const) : ('fixed' as const),
      value: promo.discountValue,
      description: isPct ? `${promo.discountValue}% OFF` : `৳${promo.discountValue} BDT OFF`,
    },
    discountBdt: Math.max(0, Math.min(raw, subtotalBdt)),
  };
}

export async function quoteOrder(
  items: QuoteItemInput[],
  promoCode?: string,
  divisionOrRegion?: string
): Promise<QuoteResult> {
  if (!items || items.length === 0) return { ok: false, message: 'Your cart is empty.' };
  if (items.length > 50) return { ok: false, message: 'Too many items in one order.' };

  const lines: QuotedLine[] = [];
  for (const item of items) {
    const qty = Math.floor(Number(item.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > 99) {
      return { ok: false, message: 'Invalid item quantity.' };
    }

    const product = await resolveProduct(item.productId);
    if (!product || !product.isActive) {
      return { ok: false, message: 'An item in your cart is no longer available. Please remove it and try again.' };
    }

    const variants = product.colorVariants || [];
    const wantedColor = (item.variantName || '').trim().toLowerCase();
    const variant =
      variants.find((v) => v.name.trim().toLowerCase() === wantedColor) ||
      (variants.length === 1 ? variants[0] : undefined);

    const wantedSize = (item.size || '').trim().toUpperCase();
    let stockRowId: string | null = null;

    if (variant && variant.stockInventory.length > 0) {
      const row = variant.stockInventory.find((s) => s.size.trim().toUpperCase() === wantedSize);
      if (!row) {
        return { ok: false, message: `${product.name}: size ${wantedSize || '(none)'} is not available in ${variant.name}.` };
      }
      if (row.isStockOut || row.quantity < qty) {
        return {
          ok: false,
          message: row.quantity > 0 && !row.isStockOut
            ? `${product.name} (${variant.name}, ${wantedSize}): only ${row.quantity} left in stock.`
            : `${product.name} (${variant.name}, ${wantedSize}) is out of stock.`,
        };
      }
      stockRowId = row.id;
    } else if (variants.length > 0 && !variant) {
      return { ok: false, message: `${product.name}: the selected colour is no longer available.` };
    }

    lines.push({
      productId: product.id,
      productName: product.name,
      variantName: variant?.name || item.variantName || 'Primary',
      size: wantedSize || 'M',
      quantity: qty,
      unitPriceBdt: product.priceBdt,
      lineTotalBdt: product.priceBdt * qty,
      thumbnailUrl: variant?.thumbnailUrl || null,
      stockRowId,
    });
  }

  // Same product/colour/size listed twice → check combined stock.
  const perRow = new Map<string, number>();
  for (const l of lines) if (l.stockRowId) perRow.set(l.stockRowId, (perRow.get(l.stockRowId) || 0) + l.quantity);
  for (const [rowId, total] of perRow) {
    const row = await db.query.stockInventory.findFirst({ where: eq(stockInventory.id, rowId) });
    if (!row || row.quantity < total) return { ok: false, message: 'Not enough stock for one of the items in your cart.' };
  }

  const subtotalBdt = lines.reduce((s, l) => s + l.lineTotalBdt, 0);

  let discountBdt = 0;
  let promo: OrderQuote['promo'] = null;
  let promoError: string | undefined;
  if (promoCode && promoCode.trim()) {
    const p = await validatePromoCode(promoCode, subtotalBdt);
    if (p.ok) {
      discountBdt = p.discountBdt;
      promo = { code: p.promo.code, description: p.promo.description };
    } else {
      promoError = p.message;
    }
  }

  const charges = await computeOrderCharges(subtotalBdt, discountBdt, divisionOrRegion);

  return {
    ok: true,
    quote: {
      lines,
      subtotalBdt,
      discountBdt,
      vatBdt: charges.vatBdt,
      vatPercent: charges.vatPercent,
      deliveryChargeBdt: charges.deliveryChargeBdt,
      freeShippingThresholdBdt: charges.freeShippingThresholdBdt,
      freeShippingEligible: charges.freeShippingEligible,
      amountNeededForFreeShippingBdt: charges.amountNeededForFreeShippingBdt,
      totalBdt: charges.totalBdt,
      promo,
      promoError,
    },
  };
}

/**
 * VAT, delivery and total for a given goods subtotal — the single place these rules live.
 * Used by customer checkout (via quoteOrder) and by admin-created orders.
 * Standard rule: discount first, then VAT and the free-delivery check use the discounted amount.
 */
export async function computeOrderCharges(subtotalBdt: number, discountBdt: number, divisionOrRegion?: string) {
  let freeShippingThreshold = 2500;
  let defaultDelivery = DELIVERY_CHARGE_BDT;
  let vatPercent = VAT_PERCENT;

  try {
    const settings = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 'general') });
    if (settings) {
      freeShippingThreshold = settings.freeShippingThresholdBdt ?? 2500;
      vatPercent = settings.vatPercent ?? VAT_PERCENT;
      defaultDelivery = settings.defaultDeliveryChargeBdt ?? DELIVERY_CHARGE_BDT;
    }
  } catch {
    // fall back to defaults
  }

  const taxableBdt = Math.max(0, subtotalBdt - discountBdt);
  const freeShippingEligible = taxableBdt >= freeShippingThreshold;
  const amountNeededForFreeShippingBdt = freeShippingEligible ? 0 : Math.max(0, freeShippingThreshold - taxableBdt);

  let deliveryChargeBdt = 0;
  if (!freeShippingEligible) {
    deliveryChargeBdt = defaultDelivery;
    try {
      if (divisionOrRegion && divisionOrRegion.trim()) {
        const norm = (s: string) =>
          s.toLowerCase().replace(/divisions?/g, '').replace('barishal', 'barisal').replace(/[^a-z]/g, '');
        const searchKey = norm(divisionOrRegion);
        const allRegions = await db.select().from(shippingRegions);
        const match = searchKey
          ? allRegions.find((r) => {
              const reg = norm(r.regionName);
              return reg === searchKey || reg.includes(searchKey) || searchKey.includes(reg);
            })
          : undefined;
        if (match) deliveryChargeBdt = match.deliveryChargeBdt;
      }
    } catch {
      deliveryChargeBdt = defaultDelivery;
    }
  }

  const vatBdt = Math.round((taxableBdt * vatPercent) / 100);
  const totalBdt = Math.max(0, taxableBdt + vatBdt + deliveryChargeBdt);

  return {
    taxableBdt,
    vatPercent,
    vatBdt,
    deliveryChargeBdt,
    freeShippingThresholdBdt: freeShippingThreshold,
    freeShippingEligible,
    amountNeededForFreeShippingBdt,
    totalBdt,
  };
}

/**
 * Atomically takes stock for each line. Each decrement only succeeds if enough stock
 * remains (WHERE quantity >= n), so two shoppers can't buy the last item twice.
 * On any failure the decrements already made are put back.
 */
export async function reserveStock(lines: QuotedLine[]): Promise<{ ok: true } | { ok: false; message: string }> {
  const done: { id: string; qty: number }[] = [];
  for (const l of lines) {
    if (!l.stockRowId) continue;
    const updated = await db
      .update(stockInventory)
      .set({
        quantity: sql`${stockInventory.quantity} - ${l.quantity}`,
        isStockOut: sql`(${stockInventory.quantity} - ${l.quantity}) <= 0`,
      })
      .where(and(eq(stockInventory.id, l.stockRowId), gte(stockInventory.quantity, l.quantity)))
      .returning({ id: stockInventory.id });
    if (updated.length === 0) {
      await releaseStock(done);
      return { ok: false, message: `${l.productName} (${l.variantName}, ${l.size}) just sold out. Please update your cart.` };
    }
    done.push({ id: l.stockRowId, qty: l.quantity });
  }
  return { ok: true };
}

export async function releaseStock(rows: { id: string; qty: number }[]) {
  for (const r of rows) {
    await db
      .update(stockInventory)
      .set({ quantity: sql`${stockInventory.quantity} + ${r.qty}`, isStockOut: false })
      .where(eq(stockInventory.id, r.id));
  }
}

export async function restoreStockForOrderItems(
  items: Array<{ productId: string; variantName?: string | null; size?: string | null; quantity: number }>
) {
  for (const item of items) {
    if (!item.quantity || item.quantity <= 0) continue;
    try {
      const prod = await resolveProduct(item.productId);
      if (!prod) continue;
      const variants = prod.colorVariants || [];
      const wantedColor = (item.variantName || '').trim().toLowerCase();
      const variant =
        variants.find((v) => v.name.trim().toLowerCase() === wantedColor) ||
        (variants.length === 1 ? variants[0] : undefined);
      if (!variant) continue;
      const wantedSize = (item.size || '').trim().toUpperCase();
      const stockRow = (variant.stockInventory || []).find(
        (s) => s.size.trim().toUpperCase() === wantedSize
      );
      if (stockRow) {
        await db
          .update(stockInventory)
          .set({
            quantity: sql`${stockInventory.quantity} + ${item.quantity}`,
            isStockOut: false,
          })
          .where(eq(stockInventory.id, stockRow.id));
      }
    } catch (err) {
      console.warn('Could not restore stock for item:', item, err);
    }
  }
}

