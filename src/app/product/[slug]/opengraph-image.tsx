import { ImageResponse } from 'next/og';
import { getProductBySlugAction } from '@/app/actions/products';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlugAction(slug);

  const title = product?.name || 'LIVUS Athletic Streetwear';
  const priceText = product ? `৳${product.priceBdt.toLocaleString()} BDT` : '';
  const photo =
    product?.colorVariants?.[0]?.galleryImages?.[0] ||
    product?.colorVariants?.[0]?.thumbnailUrl ||
    '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          background: '#0d0d0d',
          color: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Left: Product photo if available */}
        {photo ? (
          <div
            style={{
              width: '45%',
              height: '100%',
              display: 'flex',
              background: '#1a1a1a',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        ) : null}

        {/* Right / Full details */}
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 50px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 28,
                letterSpacing: '0.25em',
                color: '#8a8a8a',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              LIVUS ATELIER
            </span>
            <span
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: '#ffffff',
                marginTop: 24,
                lineHeight: 1.15,
                maxHeight: 180,
                overflow: 'hidden',
              }}
            >
              {title}
            </span>
            {priceText ? (
              <span
                style={{
                  fontSize: 36,
                  color: '#facc15',
                  fontWeight: 600,
                  marginTop: 18,
                }}
              >
                {priceText}
              </span>
            ) : null}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #262626',
              paddingTop: 24,
            }}
          >
            <span style={{ fontSize: 20, color: '#a3a3a3' }}>
              Cash on Delivery · Nationwide Bangladesh
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '0.15em',
                color: '#ffffff',
              }}
            >
              LIVUS
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
