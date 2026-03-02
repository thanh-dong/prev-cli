import { brand, colors, formatPrice, total } from '../../shared/data'

export default function PaymentProcessing() {
  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: colors.primary,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle radial gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(233,69,96,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Content card */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
        padding: 48,
        maxWidth: 400,
        textAlign: 'center',
      }}>
        {/* Spinner */}
        <div style={{ position: 'relative', width: 72, height: 72 }}>
          {/* Outer ring — slow spin */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `3px solid rgba(255,255,255,0.08)`,
            borderTopColor: colors.accent,
            animation: 'spin 1.2s linear infinite',
          }} />
          {/* Inner ring — reverse spin */}
          <div style={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            border: `3px solid rgba(255,255,255,0.05)`,
            borderBottomColor: 'rgba(233,69,96,0.5)',
            animation: 'spin 1.8s linear infinite reverse',
          }} />
          {/* Center dot pulse */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: colors.accent,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        </div>

        {/* Amount being charged */}
        <div style={{
          fontSize: 32,
          fontWeight: 800,
          color: colors.white,
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}>
          {formatPrice(total())}
        </div>

        {/* Status text */}
        <div>
          <p style={{
            fontSize: 18,
            fontWeight: 600,
            color: colors.white,
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            Processing your payment...
          </p>
          <p style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.4)',
            margin: '12px 0 0',
            lineHeight: 1.5,
          }}>
            Please don't close this window
          </p>
        </div>

        {/* Encrypted badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 100,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.04em' }}>
            SECURED BY 256-BIT ENCRYPTION
          </span>
        </div>

        {/* Brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 16,
          opacity: 0.3,
        }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.white, letterSpacing: '-0.01em' }}>{brand.name}</span>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.7); }
        }
      `}</style>
    </div>
  )
}
