import { ImageResponse } from 'next/og';

export const alt = 'LIVUS — Athletic streetwear · Cash on delivery across Bangladesh';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
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
        }}
      >
        <div
          style={{
            fontSize: 220,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          LIVUS
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 40,
            color: '#bdbdbd',
            letterSpacing: '0.02em',
          }}
        >
          Athletic streetwear · Cash on delivery across Bangladesh
        </div>
      </div>
    ),
    { ...size }
  );
}
