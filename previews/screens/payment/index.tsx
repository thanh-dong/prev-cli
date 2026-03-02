import { brand, colors, products, subtotal, tax, total, formatPrice } from '../../shared/data'

export default function PaymentForm() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: colors.white, minHeight: '100vh' }}>
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

      {/* Checkout progress */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: colors.muted, marginBottom: 32 }}>
          <span style={{ color: colors.primary, fontWeight: 500 }}>Cart</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span style={{ color: colors.primary, fontWeight: 500 }}>Shipping</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span style={{ color: colors.accent, fontWeight: 600 }}>Payment</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span>Confirmation</span>
        </div>
      </div>

      {/* Main two-column layout */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 64px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 48, alignItems: 'start' }}>

        {/* Left column — Payment Form */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.primary, marginBottom: 4, letterSpacing: '-0.02em' }}>Payment Details</h1>
          <p style={{ fontSize: 14, color: colors.muted, marginBottom: 32 }}>All transactions are secure and encrypted.</p>

          {/* Card form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Card number */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.primary, marginBottom: 6 }}>Card number</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.muted }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="3" ry="3" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 44px',
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: 10,
                    fontSize: 15,
                    color: colors.primary,
                    background: colors.white,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
                {/* Card brand badges */}
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 6 }}>
                  <div style={{ padding: '2px 6px', borderRadius: 4, background: '#1a1f71', color: colors.white, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>VISA</div>
                  <div style={{ padding: '2px 6px', borderRadius: 4, background: '#eb001b', color: colors.white, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>MC</div>
                </div>
              </div>
            </div>

            {/* Expiry + CVC row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.primary, marginBottom: 6 }}>Expiry date</label>
                <input
                  type="text"
                  placeholder="MM / YY"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: 10,
                    fontSize: 15,
                    color: colors.primary,
                    background: colors.white,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.primary, marginBottom: 6 }}>CVC</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="123"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: `1.5px solid ${colors.border}`,
                      borderRadius: 10,
                      fontSize: 15,
                      color: colors.primary,
                      background: colors.white,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: colors.muted }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Cardholder name */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.primary, marginBottom: 6 }}>Cardholder name</label>
              <input
                type="text"
                placeholder="Full name on card"
                readOnly
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: `1.5px solid ${colors.border}`,
                  borderRadius: 10,
                  fontSize: 15,
                  color: colors.primary,
                  background: colors.white,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Billing address checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 16px', background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}` }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                background: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span style={{ fontSize: 14, color: colors.primary, fontWeight: 500 }}>Billing address same as shipping</span>
            </label>

            {/* Security note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span style={{ fontSize: 12, color: colors.muted }}>256-bit SSL encrypted. Your payment info is never stored.</span>
            </div>

            {/* Pay Now button */}
            <button
              data-region="pay"
              style={{
                width: '100%',
                padding: '16px 24px',
                background: colors.accent,
                color: colors.white,
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                letterSpacing: '-0.01em',
                transition: 'transform 0.1s, box-shadow 0.15s',
                boxShadow: `0 4px 14px ${colors.accent}44`,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Pay {formatPrice(total())}
            </button>

            {/* Payment methods footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 8 }}>
              <span style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Accepted</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Visa', 'Mastercard', 'Amex', 'Apple Pay'].map(m => (
                  <span key={m} style={{ fontSize: 11, color: colors.muted, padding: '3px 8px', border: `1px solid ${colors.border}`, borderRadius: 4, fontWeight: 500 }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Order Summary */}
        <div style={{ background: colors.surface, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 28, position: 'sticky', top: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.primary, marginBottom: 20, letterSpacing: '-0.01em' }}>Order Summary</h2>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            {products.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: `1px solid ${colors.border}`, background: colors.white }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.primary, flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: colors.border, margin: '4px 0 16px' }} />

          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.muted }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 500, color: colors.primary }}>{formatPrice(subtotal())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.muted }}>
              <span>Shipping</span>
              <span style={{ fontWeight: 500, color: colors.success }}>Free</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.muted }}>
              <span>Tax</span>
              <span style={{ fontWeight: 500, color: colors.primary }}>{formatPrice(tax())}</span>
            </div>
          </div>

          {/* Total divider */}
          <div style={{ height: 1, background: colors.border, margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: colors.primary }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: colors.primary, letterSpacing: '-0.02em' }}>{formatPrice(total())}</span>
          </div>

          {/* Promo hint */}
          <div style={{ marginTop: 20, padding: '10px 14px', background: colors.white, borderRadius: 8, border: `1px dashed ${colors.border}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: colors.muted }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="5" x2="5" y2="19" />
              <circle cx="6.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
            Promo code applied at checkout
          </div>
        </div>
      </div>
    </div>
  )
}
