/**
 * Official geographic divisions and districts of Bangladesh.
 * Exactly 8 divisions and 64 districts.
 * All district lists are strictly sorted A-Z.
 */

export const BANGLADESH_DIVISIONS = [
  'Barishal',
  'Chattogram',
  'Dhaka',
  'Khulna',
  'Mymensingh',
  'Rajshahi',
  'Rangpur',
  'Sylhet',
] as const;

export type BangladeshDivision = (typeof BANGLADESH_DIVISIONS)[number];

export const DIVISION_DISTRICTS_MAP: Record<BangladeshDivision, readonly string[]> = {
  Barishal: [
    'Barguna',
    'Barishal',
    'Bhola',
    'Jhalokati',
    'Patuakhali',
    'Pirojpur',
  ],
  Chattogram: [
    'Bandarban',
    'Brahmanbaria',
    'Chandpur',
    'Chattogram',
    'Cox\'s Bazar',
    'Cumilla',
    'Feni',
    'Khagrachhari',
    'Lakshmipur',
    'Noakhali',
    'Rangamati',
  ],
  Dhaka: [
    'Dhaka',
    'Faridpur',
    'Gazipur',
    'Gopalganj',
    'Kishoreganj',
    'Madaripur',
    'Manikganj',
    'Munshiganj',
    'Narayanganj',
    'Narsingdi',
    'Rajbari',
    'Shariatpur',
    'Tangail',
  ],
  Khulna: [
    'Bagerhat',
    'Chuadanga',
    'Jashore',
    'Jhenaidah',
    'Khulna',
    'Kushtia',
    'Magura',
    'Meherpur',
    'Narail',
    'Satkhira',
  ],
  Mymensingh: [
    'Jamalpur',
    'Mymensingh',
    'Netrokona',
    'Sherpur',
  ],
  Rajshahi: [
    'Bogura',
    'Chapainawabganj',
    'Joypurhat',
    'Naogaon',
    'Natore',
    'Pabna',
    'Rajshahi',
    'Sirajganj',
  ],
  Rangpur: [
    'Dinajpur',
    'Gaibandha',
    'Kurigram',
    'Lalmonirhat',
    'Nilphamari',
    'Panchagarh',
    'Rangpur',
    'Thakurgaon',
  ],
  Sylhet: [
    'Habiganj',
    'Moulvibazar',
    'Sunamganj',
    'Sylhet',
  ],
} as const;

/** All 64 districts in Bangladesh (unique, sorted) */
export const ALL_BANGLADESH_DISTRICTS: readonly string[] = Object.values(DIVISION_DISTRICTS_MAP)
  .flat()
  .sort((a, b) => a.localeCompare(b));

/**
 * Normalise raw division inputs (e.g. from saved user profiles or legacy orders).
 * Maps "Dhaka Division" -> "Dhaka", "Chittagong" -> "Chattogram", "Barisal" -> "Barishal".
 */
export function normalizeDivision(raw?: string | null): BangladeshDivision | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/divisions?$/i, '').trim().toLowerCase();

  for (const div of BANGLADESH_DIVISIONS) {
    const divLower = div.toLowerCase();
    if (clean === divLower) return div;
    if (clean === 'chittagong' && div === 'Chattogram') return 'Chattogram';
    if (clean === 'barisal' && div === 'Barishal') return 'Barishal';
  }
  return null;
}

/**
 * Normalise raw district input with modern official spellings.
 * e.g. "Bogra" -> "Bogura", "Jeshore" -> "Jashore", "Chittagong" -> "Chattogram".
 */
export function normalizeDistrict(raw?: string | null): string | null {
  if (!raw) return null;
  const clean = raw.trim();

  // Common historical spelling aliases
  const aliases: Record<string, string> = {
    bogra: 'Bogura',
    jeshore: 'Jashore',
    jessore: 'Jashore',
    chittagong: 'Chattogram',
    comilla: 'Cumilla',
    barisal: 'Barishal',
    nawabganj: 'Chapainawabganj',
    coxsbazar: "Cox's Bazar",
    "coxs bazar": "Cox's Bazar",
    "cox's bazar": "Cox's Bazar",
    dacca: 'Dhaka',
    moulavibazar: 'Moulvibazar',
    moulvibazar: 'Moulvibazar',
    netrakona: 'Netrokona',
  };

  const aliasMatch = aliases[clean.toLowerCase()];
  if (aliasMatch) return aliasMatch;

  for (const dist of ALL_BANGLADESH_DISTRICTS) {
    if (dist.toLowerCase() === clean.toLowerCase()) return dist;
  }
  return clean;
}

/**
 * Get districts belonging to a division.
 */
export function getDistrictsForDivision(divisionRaw?: string | null): readonly string[] {
  const div = normalizeDivision(divisionRaw);
  if (!div) return [];
  return DIVISION_DISTRICTS_MAP[div] || [];
}

/**
 * Format order location into canonical "District, Division" string.
 * Example: formatLocation("Gazipur", "Dhaka") -> "Gazipur, Dhaka"
 * Handles legacy orders where division has "Division" suffix or district matches division.
 */
export function formatLocation(districtRaw?: string | null, divisionRaw?: string | null): string {
  const normDist = normalizeDistrict(districtRaw);
  const normDiv = normalizeDivision(divisionRaw);

  if (normDist && normDiv) {
    if (normDist.toLowerCase() === normDiv.toLowerCase()) {
      return normDist;
    }
    return `${normDist}, ${normDiv}`;
  }

  if (normDist) return normDist;
  if (normDiv) return normDiv;
  return '';
}

/**
 * Check if a payment method is a manual mobile wallet (bKash or Nagad).
 */
export function isWalletMethod(method?: string | null): boolean {
  if (!method) return false;
  const m = method.toLowerCase();
  return m.includes('bkash') || m.includes('nagad');
}

/**
 * Normalise Bangladeshi mobile numbers to canonical 01XXXXXXXXX format.
 * Accepts: "+8801712345678", "8801712345678", "01712-345678", "01712 345678".
 */
export function normalizeBdPhone(val?: string | null): string {
  if (!val) return '';
  const clean = val.trim().replace(/[\s-]/g, '');
  if (clean.startsWith('+880')) return '0' + clean.slice(4);
  if (clean.startsWith('880')) return '0' + clean.slice(3);
  return clean;
}

/**
 * Validate that phone number is an active 11-digit Bangladeshi mobile operator (013-019).
 */
export function isValidBdMobile(val?: string | null): boolean {
  const normalized = normalizeBdPhone(val);
  return /^01[3-9]\d{8}$/.test(normalized);
}

/**
 * Validate that a Transaction ID (TrxID) is 8-16 alphanumeric characters without spaces.
 */
export function isValidTrxId(val?: string | null): boolean {
  if (!val) return false;
  const clean = val.trim().toUpperCase();
  return /^[A-Z0-9]{8,16}$/.test(clean);
}
