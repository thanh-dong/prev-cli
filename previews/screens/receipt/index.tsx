import { brand, colors, products, subtotal, tax, total, formatPrice, orderNumber } from '../../shared/data'

export default function Receipt() {
  return (
    <div
      className="min-h-screen flex items-start justify-center py-16 px-4"
      style={{ backgroundColor: colors.surface, fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Confetti dots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[
          { top: '8%', left: '12%', size: 8, color: colors.accent, delay: '0s' },
          { top: '14%', right: '18%', size: 6, color: colors.success, delay: '0.3s' },
          { top: '6%', left: '45%', size: 10, color: '#8b5cf6', delay: '0.15s' },
          { top: '18%', right: '30%', size: 5, color: colors.accent, delay: '0.5s' },
          { top: '10%', left: '70%', size: 7, color: colors.success, delay: '0.1s' },
          { top: '22%', left: '25%', size: 4, color: '#f59e0b', delay: '0.4s' },
          { top: '5%', right: '10%', size: 6, color: '#8b5cf6', delay: '0.25s' },
          { top: '16%', left: '85%', size: 5, color: colors.accent, delay: '0.6s' },
        ].map((dot, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              top: dot.top,
              left: (dot as any).left,
              right: (dot as any).right,
              width: dot.size,
              height: dot.size,
              backgroundColor: dot.color,
              opacity: 0,
              animation: `confettiFade 2s ease-out ${dot.delay} forwards`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes confettiFade {
          0% { opacity: 0; transform: translateY(10px) scale(0.5); }
          40% { opacity: 0.8; transform: translateY(-4px) scale(1.1); }
          100% { opacity: 0.35; transform: translateY(0) scale(1); }
        }
        @keyframes checkPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="w-full max-w-lg">
        {/* Confirmation header */}
        <div className="text-center mb-8">
          {/* Green checkmark */}
          <div
            className="mx-auto mb-6"
            style={{
              width: 72,
              height: 72,
              animation: 'checkPop 0.6s ease-out forwards',
            }}
          >
            <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="36" cy="36" r="36" fill={colors.success} fillOpacity="0.1" />
              <circle cx="36" cy="36" r="28" fill={colors.success} fillOpacity="0.15" />
              <circle cx="36" cy="36" r="20" fill={colors.success} />
              <path
                d="M28 36.5L33.5 42L44 31"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1
            className="text-3xl font-bold tracking-tight mb-2"
            style={{ color: colors.primary }}
          >
            Order Confirmed!
          </h1>
          <p className="text-base mb-4" style={{ color: colors.muted }}>
            Thank you for your purchase
          </p>

          {/* Order number badge */}
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-mono tracking-wide"
            style={{
              backgroundColor: `${colors.primary}08`,
              color: colors.primary,
              border: `1px solid ${colors.border}`,
            }}
          >
            {orderNumber}
          </span>
        </div>

        {/* Order summary card */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            backgroundColor: colors.white,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          <div
            className="px-6 py-4 text-sm font-semibold tracking-wide uppercase"
            style={{
              color: colors.muted,
              borderBottom: `1px solid ${colors.border}`,
              fontSize: 11,
              letterSpacing: '0.08em',
            }}
          >
            Order Summary
          </div>

          {/* Items */}
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {products.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="rounded-lg object-cover flex-shrink-0"
                  style={{
                    width: 56,
                    height: 56,
                    border: `1px solid ${colors.border}`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: colors.primary }}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: colors.muted }}>
                    Qty {item.quantity}
                  </p>
                </div>
                <span
                  className="text-sm font-medium tabular-nums flex-shrink-0"
                  style={{ color: colors.primary }}
                >
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div
            className="px-6 py-4 space-y-2"
            style={{ borderTop: `1px solid ${colors.border}` }}
          >
            <div className="flex justify-between text-sm" style={{ color: colors.muted }}>
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPrice(subtotal())}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: colors.muted }}>
              <span>Tax</span>
              <span className="tabular-nums">{formatPrice(tax())}</span>
            </div>
            <div
              className="flex justify-between text-base font-semibold pt-2"
              style={{
                color: colors.primary,
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(total())}</span>
            </div>
          </div>

          {/* Payment method */}
          <div
            className="px-6 py-3 flex items-center gap-2 text-sm"
            style={{
              backgroundColor: colors.surface,
              borderTop: `1px solid ${colors.border}`,
              color: colors.muted,
            }}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className="flex-shrink-0">
              <rect x="0.5" y="0.5" width="19" height="13" rx="2.5" stroke={colors.border} fill={colors.white} />
              <rect x="0" y="3" width="20" height="3" fill={colors.primary} opacity="0.15" />
            </svg>
            <span>Paid with <span className="font-mono">&bull;&bull;&bull;&bull; 4242</span></span>
          </div>
        </div>

        {/* Delivery estimate */}
        <div
          className="rounded-xl px-5 py-4 mb-8 flex items-start gap-3"
          style={{
            backgroundColor: `${colors.success}08`,
            border: `1px solid ${colors.success}20`,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="flex-shrink-0 mt-0.5"
          >
            <path
              d="M13 2H3a1 1 0 00-1 1v8a1 1 0 001 1h1m9-10h4l3 4v6a1 1 0 01-1 1h-1M13 2v10M6 16a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"
              stroke={colors.success}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <p className="text-sm font-medium" style={{ color: colors.primary }}>
              Estimated delivery
            </p>
            <p className="text-sm mt-0.5" style={{ color: colors.muted }}>
              Mar 8 &ndash; 12, 2026
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3">
          <button
            data-region="continue"
            className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold tracking-wide transition-all duration-150"
            style={{
              color: colors.primary,
              backgroundColor: 'transparent',
              border: `1.5px solid ${colors.primary}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${colors.primary}08`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Continue Shopping
          </button>
          <a
            href="#"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: colors.accent }}
          >
            Track Order &rarr;
          </a>
        </div>

        {/* Footer brand */}
        <div className="text-center mt-12">
          <p className="text-xs" style={{ color: `${colors.muted}80` }}>
            {brand.name} &middot; {brand.tagline}
          </p>
        </div>
      </div>
    </div>
  )
}
