import { formatPrice } from '../../shared/data'

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
} as const

export function PriceTag({
  amount,
  original,
  size = 'md',
}: {
  amount: number
  original?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const hasDiscount = original != null && original > amount

  return (
    <span className={`inline-flex items-baseline gap-2 ${sizeClasses[size]}`}>
      {hasDiscount && (
        <span className="line-through text-gray-400 font-normal">
          {formatPrice(original)}
        </span>
      )}
      <span className={`font-semibold tabular-nums ${hasDiscount ? 'text-rose-600' : 'text-gray-900'}`}>
        {formatPrice(amount)}
      </span>
    </span>
  )
}

export default function PriceTagDemo() {
  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm max-w-xs">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Regular price</span>
        <PriceTag amount={128} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Sale price</span>
        <PriceTag amount={128} original={160} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Large total</span>
        <PriceTag amount={501} size="lg" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Small inline</span>
        <PriceTag amount={12.5} size="sm" />
      </div>
    </div>
  )
}
