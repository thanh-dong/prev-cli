// Shared mock data for checkout demo previews

export const brand = {
  name: 'Luminary',
  tagline: 'Curated essentials, delivered.',
} as const

export const colors = {
  primary: '#1a1a2e',
  accent: '#e94560',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  muted: '#6b7280',
  border: '#e5e7eb',
  surface: '#f9fafb',
  white: '#ffffff',
} as const

export interface Product {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  image: string
}

export const products: Product[] = [
  {
    id: 'prod-1',
    name: 'Merino Wool Crewneck',
    description: 'Lightweight everyday sweater',
    price: 128.00,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=120&h=120&fit=crop',
  },
  {
    id: 'prod-2',
    name: 'Canvas Weekender Bag',
    description: 'Waxed cotton, leather trim',
    price: 245.00,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&h=120&fit=crop',
  },
  {
    id: 'prod-3',
    name: 'Ceramic Pour-Over Set',
    description: 'Handmade, matte glaze finish',
    price: 64.00,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=120&h=120&fit=crop',
  },
]

export const TAX_RATE = 0.0875

export function subtotal(items: Product[] = products): number {
  return items.reduce((sum, p) => sum + p.price * p.quantity, 0)
}

export function tax(items: Product[] = products): number {
  return subtotal(items) * TAX_RATE
}

export function total(items: Product[] = products): number {
  return subtotal(items) + tax(items)
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export const orderNumber = 'LMN-2026-48291'
