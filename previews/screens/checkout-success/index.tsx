import { Col, Row, Box, Text, Spacer, toReact, type VNodeType } from '@prev/jsx'
import { Button } from '@prev/components/button'

const order = {
  number: 'ORD-2024-1234',
  date: 'January 26, 2026',
  items: [
    { name: 'Wireless Headphones', quantity: 1, price: 199 },
    { name: 'Mechanical Keyboard', quantity: 1, price: 149 },
    { name: 'USB-C Hub', quantity: 2, price: 79 },
  ],
  shipping: {
    name: 'John Doe',
    address: '123 Main Street',
    city: 'San Francisco, CA 94102',
  },
  payment: {
    method: 'Visa',
    last4: '4242',
  },
}

const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

// Success icon using primitives
function SuccessIcon(): VNodeType {
  return Box({
    bg: 'secondary',
    padding: 'xl',
    radius: 'full',
    children: Text({ children: '✓', size: '2xl', color: 'accent' })
  })
}

// Order item row
function OrderItem({ name, quantity, price }: { name: string; quantity: number; price: number }): VNodeType {
  return Row({
    children: [
      Text({ children: `${name} × ${quantity}`, size: 'sm', color: 'muted-foreground' }),
      Spacer({}),
      Text({ children: `$${price * quantity}`, size: 'sm', weight: 'medium' })
    ]
  })
}

// Info card
function InfoCard({ title, children }: { title: string; children: VNodeType[] }): VNodeType {
  return Box({
    bg: 'card',
    padding: 'lg',
    radius: 'lg',
    children: Col({
      gap: 'sm',
      children: [
        Text({ children: title, size: 'sm', weight: 'semibold', color: 'muted-foreground' }),
        ...children
      ]
    })
  })
}

// Main layout
function CheckoutSuccessLayout(): VNodeType {
  return Box({
    bg: 'background',
    padding: 'xl',
    children: Col({
      gap: 'xl',
      align: 'center',
      children: [
        // Success header
        Col({
          gap: 'md',
          align: 'center',
          children: [
            SuccessIcon(),
            Text({ children: 'Order Confirmed!', size: '2xl', weight: 'bold' }),
            Text({ children: 'Thank you for your purchase', color: 'muted-foreground' })
          ]
        }),

        // Order details card
        Box({
          bg: 'card',
          padding: 'xl',
          radius: 'lg',
          children: Col({
            gap: 'lg',
            children: [
              // Order number and date
              Row({
                children: [
                  Col({
                    gap: 'xs',
                    children: [
                      Text({ children: 'Order Number', size: 'sm', color: 'muted-foreground' }),
                      Text({ children: order.number, weight: 'semibold' })
                    ]
                  }),
                  Spacer({}),
                  Col({
                    gap: 'xs',
                    children: [
                      Text({ children: 'Date', size: 'sm', color: 'muted-foreground' }),
                      Text({ children: order.date, weight: 'semibold' })
                    ]
                  })
                ]
              }),

              // Divider
              Box({ bg: 'secondary', padding: 'xs', children: Text({ children: '' }) }),

              // Items
              Col({
                gap: 'md',
                children: [
                  Text({ children: 'Items', size: 'base', weight: 'semibold' }),
                  ...order.items.map(item => OrderItem(item))
                ]
              }),

              // Total
              Box({ bg: 'secondary', padding: 'xs', children: Text({ children: '' }) }),
              Row({
                children: [
                  Text({ children: 'Total', size: 'lg', weight: 'bold' }),
                  Spacer({}),
                  Text({ children: `$${total}`, size: 'lg', weight: 'bold' })
                ]
              })
            ]
          })
        }),

        // Shipping and Payment info
        Row({
          gap: 'lg',
          children: [
            InfoCard({
              title: 'Shipping Address',
              children: [
                Text({ children: order.shipping.name, size: 'sm' }),
                Text({ children: order.shipping.address, size: 'sm', color: 'muted-foreground' }),
                Text({ children: order.shipping.city, size: 'sm', color: 'muted-foreground' })
              ]
            }),
            InfoCard({
              title: 'Payment Method',
              children: [
                Text({ children: `${order.payment.method} ending in ${order.payment.last4}`, size: 'sm' })
              ]
            })
          ]
        }),

        // Confirmation message
        Text({
          children: 'A confirmation email has been sent to your email address.',
          size: 'sm',
          color: 'muted-foreground'
        })
      ]
    })
  })
}

export default function CheckoutSuccess() {
  return (
    <div>
      {toReact(CheckoutSuccessLayout())}
      {/* Buttons using imported component */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
        <Button variant="primary">View Order Details</Button>
        <Button variant="secondary">Continue Shopping</Button>
      </div>
    </div>
  )
}
