import { brand, colors, products, subtotal, tax, total, formatPrice } from '../../shared/data'
import type { Product } from '../../shared/data'
import { useState } from 'react'

function QuantityControl({ quantity, onChange }: { quantity: number; onChange: (q: number) => void }) {
  return (
    <div className="flex items-center gap-0 border rounded-lg overflow-hidden" style={{ borderColor: colors.border }}>
      <button
        onClick={() => onChange(Math.max(1, quantity - 1))}
        className="w-8 h-8 flex items-center justify-center text-sm font-medium transition-colors hover:bg-gray-100"
        style={{ color: colors.muted }}
      >
        -
      </button>
      <span
        className="w-10 h-8 flex items-center justify-center text-sm font-semibold border-x"
        style={{ color: colors.primary, borderColor: colors.border }}
      >
        {quantity}
      </span>
      <button
        onClick={() => onChange(quantity + 1)}
        className="w-8 h-8 flex items-center justify-center text-sm font-medium transition-colors hover:bg-gray-100"
        style={{ color: colors.muted }}
      >
        +
      </button>
    </div>
  )
}

function CartItem({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: Product
  onQuantityChange: (q: number) => void
  onRemove: () => void
}) {
  return (
    <div
      className="flex items-start gap-5 py-6 border-b last:border-b-0"
      style={{ borderColor: colors.border }}
    >
      <img
        src={item.image}
        alt={item.name}
        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
        style={{ backgroundColor: colors.surface }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold leading-tight" style={{ color: colors.primary }}>
              {item.name}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: colors.muted }}>
              {item.description}
            </p>
          </div>
          <button
            onClick={onRemove}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            style={{ color: colors.muted }}
            aria-label={`Remove ${item.name}`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <QuantityControl quantity={item.quantity} onChange={onQuantityChange} />
          <span className="text-base font-semibold tabular-nums" style={{ color: colors.primary }}>
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Cart() {
  const [items, setItems] = useState<Product[]>(() => products.map(p => ({ ...p })))

  const updateQuantity = (id: string, quantity: number) => {
    setItems(prev => prev.map(p => (p.id === id ? { ...p, quantity } : p)))
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(p => p.id !== id))
  }

  const itemCount = items.reduce((sum, p) => sum + p.quantity, 0)

  return (
    <div
      className="min-h-screen font-[system-ui,sans-serif]"
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

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
            Your Cart
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.muted }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Cart items */}
          <div className="flex-1">
            <div
              className="rounded-2xl border px-6"
              style={{ backgroundColor: colors.white, borderColor: colors.border }}
            >
              {items.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={(q) => updateQuantity(item.id, q)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div className="w-full lg:w-[360px] flex-shrink-0">
            <div
              className="rounded-2xl border p-6 sticky top-10"
              style={{
                backgroundColor: colors.white,
                borderColor: colors.border,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <h2 className="text-base font-semibold mb-5" style={{ color: colors.primary }}>
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: colors.muted }}>Subtotal</span>
                  <span className="font-medium tabular-nums" style={{ color: colors.primary }}>
                    {formatPrice(subtotal(items))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.muted }}>Tax (8.75%)</span>
                  <span className="font-medium tabular-nums" style={{ color: colors.primary }}>
                    {formatPrice(tax(items))}
                  </span>
                </div>
              </div>

              <div className="my-5 border-t" style={{ borderColor: colors.border }} />

              <div className="flex justify-between items-baseline mb-6">
                <span className="text-sm font-semibold" style={{ color: colors.primary }}>
                  Total
                </span>
                <span className="text-xl font-bold tabular-nums" style={{ color: colors.primary }}>
                  {formatPrice(total(items))}
                </span>
              </div>

              <button
                data-region="proceed"
                className="w-full py-3.5 px-6 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ backgroundColor: colors.accent }}
              >
                Proceed to Payment
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </button>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs" style={{ color: colors.muted }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="5" width="8" height="6" rx="1" />
                  <path d="M4 5V3.5a2 2 0 1 1 4 0V5" />
                </svg>
                Secure checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
