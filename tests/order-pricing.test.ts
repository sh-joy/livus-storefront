/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockProduct1 = {
  id: '3b1b6814-2396-4886-b485-612662c5b364',
  name: 'Textured Linen Shirt',
  slug: 'textured-linen-shirt',
  priceBdt: 1665,
  isActive: true,
  colorVariants: [
    {
      id: 'var-1',
      productId: '3b1b6814-2396-4886-b485-612662c5b364',
      name: 'White',
      hexColor: '#FFFFFF',
      thumbnailUrl: '/images/shirt.jpg',
      stockInventory: [
        {
          id: 'stock-1',
          variantId: 'var-1',
          size: 'M',
          quantity: 50,
          isStockOut: false,
        },
      ],
    },
  ],
};

const mockProduct2 = {
  id: '4c2c7925-3407-5997-c596-723773d6c475',
  name: 'Minimal Formal Trousers',
  slug: 'minimal-formal-trousers',
  priceBdt: 3000,
  isActive: true,
  colorVariants: [
    {
      id: 'var-2',
      productId: '4c2c7925-3407-5997-c596-723773d6c475',
      name: 'Black',
      hexColor: '#000000',
      thumbnailUrl: '/images/trousers.jpg',
      stockInventory: [
        {
          id: 'stock-2',
          variantId: 'var-2',
          size: '32',
          quantity: 50,
          isStockOut: false,
        },
      ],
    },
  ],
};

const mockPromoCodes: Record<string, any> = {
  GIFT2000: {
    id: 'promo-1',
    code: 'GIFT2000',
    discountType: 'fixed',
    discountValue: 2000,
    minCartValue: 0,
    isActive: true,
    expiresAt: null,
    usageLimit: null,
  },
  TENPERCENT: {
    id: 'promo-2',
    code: 'TENPERCENT',
    discountType: 'percentage',
    discountValue: 10,
    minCartValue: 1000,
    isActive: true,
    expiresAt: null,
    usageLimit: null,
  },
  EXPIRED: {
    id: 'promo-3',
    code: 'EXPIRED',
    discountType: 'fixed',
    discountValue: 500,
    minCartValue: 0,
    isActive: true,
    expiresAt: new Date(Date.now() - 86400000), // yesterday
    usageLimit: null,
  },
};

const mockRegions = [
  { id: 'reg-1', regionName: 'Dhaka Division', deliveryChargeBdt: 100 },
  { id: 'reg-2', regionName: 'Chittagong Division', deliveryChargeBdt: 150 },
  { id: 'reg-3', regionName: 'Sylhet Division', deliveryChargeBdt: 150 },
  { id: 'reg-4', regionName: 'Barishal Division', deliveryChargeBdt: 150 },
];

// Mock the DB layer
vi.mock('@/db', () => ({
  db: {
    query: {
      products: {
        findFirst: vi.fn(),
      },
      colorVariants: {
        findMany: vi.fn(),
      },
      stockInventory: {
        findFirst: vi.fn(),
      },
      storeSettings: {
        findFirst: vi.fn(() => ({
          vatPercent: 10,
          defaultDeliveryChargeBdt: 150,
          freeShippingThresholdBdt: 2500,
        })),
      },
      promoCodes: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
}));

import { quoteOrder, validatePromoCode, computeOrderCharges } from '@/lib/order-pricing';
import { db } from '@/db';

describe('Order Pricing Math (Track 1 & Track 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (db.query.products.findFirst as any).mockResolvedValue(mockProduct1);
    (db.query.stockInventory.findFirst as any).mockResolvedValue({
      id: 'stock-1',
      quantity: 50,
      isStockOut: false,
    });
    (db.query.storeSettings.findFirst as any).mockResolvedValue({
      vatPercent: 10,
      defaultDeliveryChargeBdt: 150,
      freeShippingThresholdBdt: 2500,
    });
    (db.select as any).mockReturnValue({
      from: vi.fn(() => Promise.resolve(mockRegions)),
    });
  });

  describe('Standard VAT and Free Delivery Rules', () => {
    it('calculates exact spec example: 2 x 1665 with GIFT2000 in Sylhet -> subtotal 3330, discount 2000, taxable 1330, VAT 133, delivery 150, total 1613', async () => {
      (db.query.products.findFirst as any).mockResolvedValue(mockProduct1);
      (db.query.promoCodes.findFirst as any).mockImplementation(({ columns }: any) => {
        return mockPromoCodes.GIFT2000;
      });

      const res = await quoteOrder(
        [
          {
            productId: mockProduct1.id,
            variantName: 'White',
            size: 'M',
            quantity: 2,
          },
        ],
        'GIFT2000',
        'Sylhet'
      );

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const q = res.quote;
      // 1. Subtotal = 2 * 1665 = 3330
      expect(q.subtotalBdt).toBe(3330);

      // 2. Promo discount = 2000
      expect(q.discountBdt).toBe(2000);

      // 3. Taxable amount = 3330 - 2000 = 1330
      const taxable = q.subtotalBdt - q.discountBdt;
      expect(taxable).toBe(1330);

      // 4. Free delivery evaluated on TAXABLE amount (1330 < 2500 => not eligible!)
      expect(q.freeShippingEligible).toBe(false);
      expect(q.amountNeededForFreeShippingBdt).toBe(1170); // 2500 - 1330
      expect(q.deliveryChargeBdt).toBe(150);

      // 5. VAT (10% on discounted taxable amount 1330 = 133)
      expect(q.vatBdt).toBe(133);

      // 6. Total = taxable 1330 + vat 133 + delivery 150 = 1613
      expect(q.totalBdt).toBe(1613);
    });

    it('grants free delivery when discounted taxable amount >= freeShippingThreshold', async () => {
      (db.query.products.findFirst as any).mockResolvedValue(mockProduct2); // price 3000
      (db.query.promoCodes.findFirst as any).mockResolvedValue(null);

      const res = await quoteOrder(
        [
          {
            productId: mockProduct2.id,
            variantName: 'Black',
            size: '32',
            quantity: 1, // 3000 BDT
          },
        ],
        undefined,
        'Sylhet'
      );

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const q = res.quote;
      expect(q.subtotalBdt).toBe(3000);
      expect(q.discountBdt).toBe(0);
      expect(q.freeShippingEligible).toBe(true);
      expect(q.amountNeededForFreeShippingBdt).toBe(0);
      expect(q.deliveryChargeBdt).toBe(0);
      expect(q.vatBdt).toBe(300); // 10% of 3000
      expect(q.totalBdt).toBe(3300); // 3000 + 300 + 0
    });
  });

  describe('Shipping Region Matching and Spelling Tolerance', () => {
    it('correctly uses Dhaka Division delivery charge of 100', async () => {
      (db.query.products.findFirst as any).mockResolvedValue(mockProduct1);
      (db.query.promoCodes.findFirst as any).mockResolvedValue(null);

      const res = await quoteOrder(
        [
          {
            productId: mockProduct1.id,
            variantName: 'White',
            size: 'M',
            quantity: 1, // 1665 BDT (< 2500)
          },
        ],
        undefined,
        'Dhaka'
      );

      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.quote.deliveryChargeBdt).toBe(100);
    });

    it('tolerates both Barishal and Barisal spellings for Barishal Division', async () => {
      (db.query.products.findFirst as any).mockResolvedValue(mockProduct1);
      (db.query.promoCodes.findFirst as any).mockResolvedValue(null);

      // Test with "Barishal"
      const res1 = await quoteOrder(
        [{ productId: mockProduct1.id, variantName: 'White', size: 'M', quantity: 1 }],
        undefined,
        'Barishal'
      );
      expect(res1.ok).toBe(true);
      if (res1.ok) expect(res1.quote.deliveryChargeBdt).toBe(150);

      // Test with "Barisal"
      const res2 = await quoteOrder(
        [{ productId: mockProduct1.id, variantName: 'White', size: 'M', quantity: 1 }],
        undefined,
        'Barisal'
      );
      expect(res2.ok).toBe(true);
      if (res2.ok) expect(res2.quote.deliveryChargeBdt).toBe(150);
    });
  });

  describe('Promo Code Rules and Caps', () => {
    it('applies percentage promo correctly on subtotal', async () => {
      (db.query.promoCodes.findFirst as any).mockResolvedValue(mockPromoCodes.TENPERCENT);

      // Subtotal 2,000 BDT -> 10% is 200
      const res = await validatePromoCode('TENPERCENT', 2000);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.discountBdt).toBe(200);
      }
    });

    it('enforces min cart value on promo codes', async () => {
      (db.query.promoCodes.findFirst as any).mockResolvedValue(mockPromoCodes.TENPERCENT);

      // Subtotal 500 BDT with minCartValue 1000 -> rejected
      const res = await validatePromoCode('TENPERCENT', 500);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.message).toContain('minimum order of ৳1000');
      }
    });

    it('clamps fixed discount so it never exceeds cart subtotal', async () => {
      (db.query.promoCodes.findFirst as any).mockResolvedValue(mockPromoCodes.GIFT2000);

      // Subtotal 1,500 BDT with 2,000 BDT fixed promo -> discount should be clamped to 1500
      const res = await validatePromoCode('GIFT2000', 1500);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.discountBdt).toBe(1500);
      }
    });

    it('rejects expired promo codes', async () => {
      (db.query.promoCodes.findFirst as any).mockResolvedValue(mockPromoCodes.EXPIRED);
      const resExpired = await validatePromoCode('EXPIRED', 3000);
      expect(resExpired.ok).toBe(false);
      if (!resExpired.ok) {
        expect(resExpired.message).toContain('expired');
      }
    });

    it('rejects non-existent or inactive promo codes', async () => {
      (db.query.promoCodes.findFirst as any).mockResolvedValue(null);
      const res = await validatePromoCode('DOESNOTEXIST', 3000);
      expect(res.ok).toBe(false);
    });
  });

  describe('Free delivery switch (Admin → Settings)', () => {
    it('gives free delivery at or above the threshold', async () => {
      const c = await computeOrderCharges(3000, 0);
      expect(c.freeShippingEligible).toBe(true);
      expect(c.deliveryChargeBdt).toBe(0);
      expect(c.amountNeededForFreeShippingBdt).toBe(0);
    });

    it('threshold 0 switches the offer off: delivery is always charged and no "add more" hint', async () => {
      (db.query.storeSettings.findFirst as any).mockResolvedValue({
        vatPercent: 10,
        defaultDeliveryChargeBdt: 150,
        freeShippingThresholdBdt: 0,
      });
      const c = await computeOrderCharges(10000, 0);
      expect(c.freeShippingEligible).toBe(false);
      expect(c.deliveryChargeBdt).toBe(150);
      expect(c.amountNeededForFreeShippingBdt).toBe(0);
    });
  });
});
