import { ImageResponse } from 'next/og'

export const alt =
  'Saroop Singh Archive — preserving Malaysian athletics history'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background:
            'radial-gradient(circle at 82% 18%, #bfdbfe 0, transparent 25%), radial-gradient(circle at 13% 85%, #ddd6fe 0, transparent 28%), linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%)',
          color: '#172554',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '72px',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            border: '18px solid #1d4ed8',
            borderRadius: '999px',
            height: '310px',
            opacity: 0.12,
            position: 'absolute',
            right: '-65px',
            top: '-85px',
            width: '310px',
          }}
        />
        <div
          style={{
            border: '12px solid #7c3aed',
            borderRadius: '999px',
            bottom: '-95px',
            height: '230px',
            left: '110px',
            opacity: 0.12,
            position: 'absolute',
            width: '230px',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxWidth: '900px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              color: '#1d4ed8',
              display: 'flex',
              fontSize: '27px',
              fontWeight: 700,
              justifyContent: 'center',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Malaysian athletics history · 1936–1954
          </div>
          <div
            style={{
              color: '#111827',
              display: 'flex',
              fontSize: '88px',
              fontWeight: 800,
              letterSpacing: '-0.055em',
              lineHeight: 1,
            }}
          >
            Saroop Singh Archive
          </div>
          <div
            style={{
              color: '#475569',
              display: 'flex',
              fontSize: '32px',
              justifyContent: 'center',
              lineHeight: 1.35,
            }}
          >
            A family-built record of a pioneering Sikh athlete and the stories
            that surround him.
          </div>
          <div
            style={{
              alignItems: 'center',
              color: '#6d28d9',
              display: 'flex',
              fontSize: '25px',
              fontWeight: 700,
              justifyContent: 'center',
              marginTop: '10px',
            }}
          >
            saroop.mereka.dev
          </div>
        </div>
      </div>
    ),
    size
  )
}
