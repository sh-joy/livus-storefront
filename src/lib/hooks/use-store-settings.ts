'use client';

import { useEffect, useState } from 'react';
import { fetchStoreSettingsAction } from '@/app/actions/checkout';

type Settings = Awaited<ReturnType<typeof fetchStoreSettingsAction>>;

// One request per page load, shared by every component that asks.
let pending: Promise<Settings> | null = null;

/** Public store settings (support contacts, free-delivery threshold, payment numbers). null until loaded. */
export function useStoreSettings(): Settings | null {
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    let alive = true;
    pending ??= fetchStoreSettingsAction().catch(() => null);
    pending.then((s) => alive && setSettings(s));
    return () => {
      alive = false;
    };
  }, []);
  return settings;
}

/** Free delivery is on when the threshold is above 0 (Admin → Settings). */
export function freeDeliveryThreshold(settings: Settings | null): number {
  const t = settings?.freeShippingThresholdBdt ?? 0;
  return t > 0 ? t : 0;
}
