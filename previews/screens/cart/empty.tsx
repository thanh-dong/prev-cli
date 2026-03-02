import { brand, colors } from '../../shared/data'

export default function CartEmpty() {
  return (
    <div
      className="min-h-screen font-[system-ui,sans-serif] flex flex-col"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Header */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: colors.white, borderColor: colors.border }}
      >
        <span className="text-lg font-bold tracking-tight" style={{ color: colors.primary }}>
          {brand.name}
        </span>
        <span className="text-sm" style={{ color: colors.muted }}>
          {brand.tagline}
        </span>
      </header>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm -mt-16">
          {/* Shopping bag illustration */}
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${colors.accent}0a` }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              stroke={colors.accent}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 10h24l-2.4 18a2 2 0 0 1-2 1.8H10.4a2 2 0 0 1-2-1.8L6 10z" />
              <path d="M13 10V8a5 5 0 1 1 10 0v2" />
              <line x1="15" y1="17" x2="15" y2="22" opacity="0.4" />
              <line x1="21" y1="17" x2="21" y2="22" opacity="0.4" />
            </svg>
          </div>

          <h1 className="text-xl font-bold mb-2" style={{ color: colors.primary }}>
            Your cart is empty
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: colors.muted }}>
            Looks like you haven't added anything yet. Explore our curated collection and find something you'll love.
          </p>

          <button
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border-2 transition-all hover:shadow-sm active:scale-[0.98]"
            style={{
              color: colors.accent,
              borderColor: colors.accent,
              backgroundColor: colors.white,
            }}
          >
            Start Shopping
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 7h10M8 3l4 4-4 4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
