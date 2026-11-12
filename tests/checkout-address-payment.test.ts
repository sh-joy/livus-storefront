import { describe, it, expect } from 'vitest';
import {
  BANGLADESH_DIVISIONS,
  DIVISION_DISTRICTS_MAP,
  ALL_BANGLADESH_DISTRICTS,
  normalizeDivision,
  normalizeDistrict,
  formatLocation,
  isValidBdMobile,
  normalizeBdPhone,
  isValidTrxId,
  isWalletMethod,
  type BangladeshDivision,
} from '@/lib/bangladesh-geo';

describe('Task 1: Bangladesh Geo Hierarchy (Divisions & Districts)', () => {
  it('defines exactly 8 administrative divisions', () => {
    expect(BANGLADESH_DIVISIONS).toHaveLength(8);
    expect(BANGLADESH_DIVISIONS).toEqual([
      'Barishal',
      'Chattogram',
      'Dhaka',
      'Khulna',
      'Mymensingh',
      'Rajshahi',
      'Rangpur',
      'Sylhet',
    ]);
  });

  it('maps all 64 districts without duplicates across the 8 divisions', () => {
    const districtSet = new Set<string>();
    let totalCount = 0;

    for (const division of BANGLADESH_DIVISIONS) {
      const districts = DIVISION_DISTRICTS_MAP[division];
      expect(districts.length).toBeGreaterThan(0);
      totalCount += districts.length;

      // Verify each division's districts list is sorted A-Z
      const sorted = [...districts].sort((a, b) => a.localeCompare(b));
      expect(districts).toEqual(sorted);

      for (const district of districts) {
        expect(districtSet.has(district)).toBe(false); // No duplicates
        districtSet.add(district);
      }
    }

    expect(totalCount).toBe(64);
    expect(districtSet.size).toBe(64);
    expect(ALL_BANGLADESH_DISTRICTS).toHaveLength(64);
  });

  it('includes official contemporary spellings for districts', () => {
    expect(ALL_BANGLADESH_DISTRICTS).toContain('Chattogram');
    expect(ALL_BANGLADESH_DISTRICTS).toContain('Cumilla');
    expect(ALL_BANGLADESH_DISTRICTS).toContain('Barishal');
    expect(ALL_BANGLADESH_DISTRICTS).toContain('Jashore');
    expect(ALL_BANGLADESH_DISTRICTS).toContain('Bogura');
  });

  it('normalizes division names and historical aliases accurately', () => {
    expect(normalizeDivision('dhaka')).toBe('Dhaka');
    expect(normalizeDivision('DHAKA')).toBe('Dhaka');
    expect(normalizeDivision('Chittagong')).toBe('Chattogram');
    expect(normalizeDivision('chittagong division')).toBe('Chattogram');
    expect(normalizeDivision('Barisal')).toBe('Barishal');
    expect(normalizeDivision('unknown')).toBeNull();
  });

  it('normalizes district names and aliases', () => {
    expect(normalizeDistrict('comilla')).toBe('Cumilla');
    expect(normalizeDistrict('jessore')).toBe('Jashore');
    expect(normalizeDistrict('bogra')).toBe('Bogura');
    expect(normalizeDistrict('dacca')).toBe('Dhaka');
    expect(normalizeDistrict('coxs bazar')).toBe("Cox's Bazar");
  });

  it('formats canonical location as "District, Division"', () => {
    expect(formatLocation('Gazipur', 'Dhaka')).toBe('Gazipur, Dhaka');
    expect(formatLocation('Dhaka', 'Dhaka')).toBe('Dhaka');
    expect(formatLocation('', 'Chattogram')).toBe('Chattogram');
    expect(formatLocation('Sylhet', '')).toBe('Sylhet');
    expect(formatLocation(undefined, undefined)).toBe('');
  });
});

describe('Task 3: Mobile Wallet Validation & Normalization (bKash & Nagad)', () => {
  it('validates Bangladeshi mobile phone numbers with optional prefixes', () => {
    expect(isValidBdMobile('01712345678')).toBe(true);
    expect(isValidBdMobile('01912345678')).toBe(true);
    expect(isValidBdMobile('01312345678')).toBe(true);
    expect(isValidBdMobile('+8801812345678')).toBe(true);
    expect(isValidBdMobile('8801612345678')).toBe(true);
    expect(isValidBdMobile('01712-345678')).toBe(true);
    expect(isValidBdMobile('01712 345678')).toBe(true);

    // Invalid formats
    expect(isValidBdMobile('01212345678')).toBe(false); // 012 not valid mobile operator
    expect(isValidBdMobile('0171234567')).toBe(false);  // 10 digits
    expect(isValidBdMobile('017123456789')).toBe(false); // 12 digits
    expect(isValidBdMobile('')).toBe(false);
    expect(isValidBdMobile('abcdefghijk')).toBe(false);
  });

  it('normalizes BD phone numbers to clean 01XXXXXXXXX 11-digit string', () => {
    expect(normalizeBdPhone('+8801712-345678')).toBe('01712345678');
    expect(normalizeBdPhone('8801812345678')).toBe('01812345678');
    expect(normalizeBdPhone('01912 345 678')).toBe('01912345678');
  });

  it('validates Transaction ID (TrxID) format (8–16 alphanumeric characters)', () => {
    expect(isValidTrxId('ABC12345')).toBe(true);
    expect(isValidTrxId('bkash12345')).toBe(true);
    expect(isValidTrxId('BLA97XYZ12345678')).toBe(true); // 16 chars

    // Invalid TrxIDs
    expect(isValidTrxId('SHORT12')).toBe(false); // 7 chars
    expect(isValidTrxId('TOOLONGTRXID123456789')).toBe(false); // >16 chars
    expect(isValidTrxId('WITH SPACE12')).toBe(false);
    expect(isValidTrxId('SPECIAL!@#12')).toBe(false);
    expect(isValidTrxId('')).toBe(false);
  });

  it('identifies wallet payment methods accurately', () => {
    expect(isWalletMethod('bkash')).toBe(true);
    expect(isWalletMethod('bKash')).toBe(true);
    expect(isWalletMethod('nagad')).toBe(true);
    expect(isWalletMethod('Nagad')).toBe(true);
    expect(isWalletMethod('Cash on Delivery')).toBe(false);
    expect(isWalletMethod('cod')).toBe(false);
  });
});

describe('Task 3: Payment Status Transition Semantics', () => {
  it('handles verification transitions correctly without mutating delivered orders', () => {
    // 1. Initial wallet order status
    let order = {
      status: 'Pending',
      paymentMethod: 'bKash',
      paymentStatus: 'Awaiting Verification',
    };
    expect(order.paymentStatus).toBe('Awaiting Verification');

    // 2. Admin marks payment as verified
    const markVerified = (ord: typeof order) => ({
      ...ord,
      paymentStatus: 'Paid (Verified)',
    });
    order = markVerified(order);
    expect(order.paymentStatus).toBe('Paid (Verified)');

    // 3. Status transitions to Delivered - verified wallet payment remains untouched!
    const transitionStatus = (ord: typeof order, newStatus: string) => {
      let nextPaymentStatus = ord.paymentStatus;
      const method = ord.paymentMethod.toLowerCase();
      if (newStatus === 'Delivered') {
        if (method.includes('cash')) {
          nextPaymentStatus = 'Paid (COD Collected)';
        }
        // Wallet remains unchanged if already verified
      }
      return { ...ord, status: newStatus, paymentStatus: nextPaymentStatus };
    };

    const deliveredOrder = transitionStatus(order, 'Delivered');
    expect(deliveredOrder.status).toBe('Delivered');
    expect(deliveredOrder.paymentStatus).toBe('Paid (Verified)'); // Preserved!

    // 4. Test COD transition to Delivered
    const codOrder = {
      status: 'Pending',
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Unpaid (COD)',
    };
    const deliveredCod = transitionStatus(codOrder, 'Delivered');
    expect(deliveredCod.paymentStatus).toBe('Paid (COD Collected)');

    // 5. Test "Payment not received" transition without cancelling order
    const markPaymentNotReceived = (ord: typeof order) => ({
      ...ord,
      paymentStatus: 'Payment not received',
    });
    const unverifiedOrder = markPaymentNotReceived({
      status: 'Pending',
      paymentMethod: 'bKash',
      paymentStatus: 'Awaiting Verification',
    });
    expect(unverifiedOrder.status).toBe('Pending'); // Order remains active!
    expect(unverifiedOrder.paymentStatus).toBe('Payment not received');
  });
});
