import { Col, Row, Box, Text, Spacer, toReact, type VNodeType } from '@prev/jsx'

const items = [
  { id: 1, name: 'Wireless Headphones', price: 199, quantity: 1 },
  { id: 2, name: 'Mechanical Keyboard', price: 149, quantity: 1 },
  { id: 3, name: 'USB-C Hub', price: 79, quantity: 2 },
]

const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

// Cart item using primitives
function CartItem({ name, price, quantity }: { name: string; price: number; quantity: number }): VNodeType {
  return Box({
    bg: 'card',
    padding: 'lg',
    radius: 'lg',
    children: Row({
      gap: 'lg',
      align: 'center',
      children: [
        // Product image placeholder
        Box({
          bg: 'secondary',
          padding: 'lg',
          radius: 'md',
          children: Text({ children: '📦', size: 'xl' })
        }),
        // Product info
        Col({
          gap: 'xs',
          children: [
            Text({ children: name, size: 'base', weight: 'semibold' }),
            Text({ children: `$${price}`, size: 'sm', color: 'muted-foreground' })
          ]
        }),
        Spacer({}),
        // Quantity controls
        Row({
          gap: 'sm',
          align: 'center',
          children: [
            Box({
              bg: 'secondary',
              padding: 'sm',
              radius: 'md',
              children: Text({ children: '−', size: 'base' })
            }),
            Text({ children: String(quantity), size: 'base', weight: 'medium' }),
            Box({
              bg: 'secondary',
              padding: 'sm',
              radius: 'md',
              children: Text({ children: '+', size: 'base' })
            })
          ]
        }),
        // Item total
        Text({ children: `$${price * quantity}`, size: 'base', weight: 'semibold' })
      ]
    })
  })
}

// Order summary using primitives
function OrderSummary(): VNodeType {
  return Box({
    bg: 'card',
    padding: 'xl',
    radius: 'lg',
    children: Col({
      gap: 'lg',
      children: [
        Text({ children: 'Order Summary', size: 'lg', weight: 'semibold' }),
        Col({
          gap: 'sm',
          children: [
            Row({
              children: [
                Text({ children: 'Subtotal', size: 'sm', color: 'muted-foreground' }),
                Spacer({}),
                Text({ children: `$${subtotal.toFixed(2)}`, size: 'sm' })
              ]
            }),
            Row({
              children: [
                Text({ children: 'Shipping', size: 'sm', color: 'muted-foreground' }),
                Spacer({}),
                Text({ children: 'Free', size: 'sm' })
              ]
            })
          ]
        }),
        Box({
          bg: 'secondary',
          padding: 'xs',
          children: Text({ children: '' }) // Divider
        }),
        Row({
          children: [
            Text({ children: 'Total', size: 'lg', weight: 'bold' }),
            Spacer({}),
            Text({ children: `$${subtotal.toFixed(2)}`, size: 'lg', weight: 'bold' })
          ]
        }),
        // Checkout button using primitives (styled as primary button)
        Box({
          bg: 'primary',
          padding: 'md',
          radius: 'md',
          children: Text({
            children: 'Checkout',
            size: 'base',
            weight: 'semibold',
            color: 'primary-foreground'
          })
        }),
        Text({
          children: 'Secure checkout powered by Stripe',
          size: 'xs',
          color: 'muted-foreground'
        })
      ]
    })
  })
}

// Main cart layout
function CartLayout(): VNodeType {
  return Box({
    bg: 'background',
    padding: 'xl',
    children: Col({
      gap: 'xl',
      children: [
        Text({ children: 'Shopping Cart', size: '2xl', weight: 'bold' }),
        Row({
          gap: 'xl',
          align: 'start',
          children: [
            // Items list
            Col({
              gap: 'md',
              children: items.map(item => CartItem(item))
            }),
            // Order summary
            OrderSummary()
          ]
        })
      ]
    })
  })
}

export default function Cart() {
  return toReact(CartLayout())
}
