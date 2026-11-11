import { ImageResponse } from 'next/og';
import { getSiteProfile } from '@/lib/site-profile';

export const alt = 'LIVUS — Athletic streetwear · Cash on delivery across Bangladesh';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const profile = await getSiteProfile();
  const brandName = profile.brand.name || 'LIVUS';
  const tagline = profile.brand.tagline || 'Athletic streetwear · Cash on delivery across Bangladesh';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0d0d',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontSize: 180,
            fontWeight: 800,
            letterSpacing: '0.15em',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {brandName}
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 32,
            color: '#d4d4d4',
            letterSpacing: '0.04em',
            maxWidth: 900,
            textAlign: 'center',
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 22,
            color: '#a3a3a3',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Cash on Delivery · Nationwide Delivery · Bangladesh
        </div>
      </div>
    ),
    { ...size }
  );
}
