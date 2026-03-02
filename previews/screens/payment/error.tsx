import { brand, colors, formatPrice, total } from '../../shared/data'

export default function PaymentError() {
  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: colors.white,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${colors.border}`, padding: '16px 0' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: colors.primary, letterSpacing: '-0.02em' }}>{brand.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.muted, fontSize: 13 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure checkout
          </div>
        </div>
      </header>

      {/* Centered error content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>

          {/* Error icon */}
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: `${colors.error}0D`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: `${colors.error}1A`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>

          {/* Error message */}
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: colors.primary,
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}>
            Payment declined
          </h1>
          <p style={{
            fontSize: 15,
            color: colors.muted,
            lineHeight: 1.6,
            marginBottom: 28,
            maxWidth: 360,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Your card was declined. Please check your details or try a different payment method.
          </p>

          {/* Card info summary */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 20px',
            background: colors.surface,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            marginBottom: 32,
          }}>
            <div style={{
              width: 40,
              height: 28,
              borderRadius: 6,
              background: colors.white,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="20" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="3" ry="3" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.primary, letterSpacing: '0.04em' }}>
                &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242
              </div>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>
                Declined &middot; {formatPrice(total())}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <button
              data-region="retry"
              style={{
                width: '100%',
                maxWidth: 320,
                padding: '14px 24px',
                background: colors.accent,
                color: colors.white,
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                letterSpacing: '-0.01em',
                boxShadow: `0 4px 14px ${colors.accent}44`,
                transition: 'transform 0.1s, box-shadow 0.15s',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Try Again
            </button>

            <button
              style={{
                background: 'none',
                border: 'none',
                color: colors.muted,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 8,
                transition: 'color 0.15s',
              }}
            >
              Use a different card
            </button>
          </div>

          {/* Security reassurance */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 36,
            padding: '12px 0',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span style={{ fontSize: 12, color: colors.muted }}>
              No charges were applied. Your card information is safe.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
