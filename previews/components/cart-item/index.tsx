import { products, formatPrice, type Product } from '../../shared/data'

export function CartItem({ product }: { product: Product }) {
  const lineTotal = product.price * product.quantity

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0">
      <img
        src={product.image}
        alt={product.name}
        className="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-sm text-gray-500">{product.description}</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
          {product.quantity}
        </span>
        <span className="text-sm font-medium text-gray-900 w-20 text-right tabular-nums">
          {formatPrice(lineTotal)}
        </span>
      </div>
    </div>
  )
}

export default function CartItemDemo() {
  return (
    <div className="max-w-lg bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 px-5">
      {products.map(product => (
        <CartItem key={product.id} product={product} />
      ))}
    </div>
  )
}
