// Template-based preview renderer
// This component renders the config.yaml template using the primitives system

import { useState } from 'react'
import './styles.css'

// Import the rendered HTML and CSS from the primitives system
// In production, this would be generated at build time from config.yaml

const states = ['default', 'loading', 'added', 'out-of-stock'] as const
type State = typeof states[number]

export default function ProductPagePreview() {
  const [currentState, setCurrentState] = useState<State>('default')

  return (
    <div className="preview-container">
      {/* State selector toolbar */}
      <div className="state-toolbar">
        <span className="toolbar-label">State:</span>
        {states.map(state => (
          <button
            key={state}
            onClick={() => setCurrentState(state)}
            className={`state-btn ${currentState === state ? 'active' : ''}`}
          >
            {state}
          </button>
        ))}
      </div>

      {/* Rendered template */}
      <div
        className="template-output"
        dangerouslySetInnerHTML={{ __html: getRenderedTemplate(currentState) }}
      />
    </div>
  )
}

// This would normally come from the build system
// For now, we inline the rendered output using Tailwind classes
function getRenderedTemplate(state: State): string {
  const actionContent: Record<State, string> = {
    'default': `
      <div data-primitive="$box" class="bg-accent rounded-md p-4">
        <div data-primitive="$row" class="flex flex-row gap-2 items-center">
          <span data-primitive="$icon" class="inline-flex items-center justify-center">🛒</span>
          <span data-primitive="$text" class="font-medium">Add to Cart</span>
        </div>
      </div>
    `,
    'loading': `
      <div data-primitive="$row" class="flex flex-row gap-2 items-center">
        <span class="spinner"></span>
        <span data-primitive="$text" class="text-muted-foreground">Adding to cart...</span>
      </div>
    `,
    'added': `
      <div data-primitive="$row" class="flex flex-row gap-2 items-center">
        <span data-primitive="$icon" class="text-green-500">✓</span>
        <span data-primitive="$text" class="font-bold text-green-500">Added to cart!</span>
      </div>
    `,
    'out-of-stock': `
      <div data-primitive="$box" class="bg-muted rounded-md p-4">
        <div data-primitive="$col" class="flex flex-col gap-2">
          <span data-primitive="$text" class="text-destructive font-medium">Out of Stock</span>
          <span data-primitive="$text" class="text-sm text-muted-foreground">Notify me when available</span>
        </div>
      </div>
    `,
  }

  return `
    <div data-primitive="$col" data-node-id="root" class="flex flex-col gap-6 p-6">

      <!-- Breadcrumb -->
      <div data-primitive="$row" class="flex flex-row gap-2 items-center">
        <span data-primitive="$text" class="text-muted-foreground">Home</span>
        <span data-primitive="$text" class="text-muted-foreground">/</span>
        <span data-primitive="$text" class="text-muted-foreground">Electronics</span>
        <span data-primitive="$text" class="text-muted-foreground">/</span>
        <span data-primitive="$text" class="text-primary">Wireless Headphones</span>
      </div>

      <!-- Main content -->
      <div data-primitive="$row" class="flex flex-row gap-8 items-start">

        <!-- Gallery -->
        <div data-primitive="$col" class="flex flex-col gap-2 flex-1">
          <div data-primitive="$box" class="bg-muted rounded-lg p-6">
            <img data-primitive="$image" src="https://picsum.photos/400/400" alt="Product Image" class="max-w-full object-contain rounded-md" />
          </div>
          <div data-primitive="$row" class="flex flex-row gap-1 items-center">
            <div data-primitive="$box" class="bg-muted rounded p-2">
              <img src="https://picsum.photos/80/80?1" alt="Thumb 1" class="w-15 h-15 object-cover rounded" />
            </div>
            <div data-primitive="$box" class="bg-muted rounded p-2">
              <img src="https://picsum.photos/80/80?2" alt="Thumb 2" class="w-15 h-15 object-cover rounded" />
            </div>
            <div data-primitive="$box" class="bg-muted rounded p-2">
              <img src="https://picsum.photos/80/80?3" alt="Thumb 3" class="w-15 h-15 object-cover rounded" />
            </div>
          </div>
        </div>

        <!-- Details -->
        <div data-primitive="$col" class="flex flex-col gap-6 flex-1">

          <!-- Title & Rating -->
          <div data-primitive="$col" class="flex flex-col gap-1">
            <span data-primitive="$text" class="text-xl font-bold">Premium Wireless Headphones</span>
            <div data-primitive="$row" class="flex flex-row gap-1 items-center">
              <span class="text-primary">★★★★</span>
              <span class="text-muted-foreground">☆</span>
              <span data-primitive="$text" class="text-sm text-muted-foreground">(128 reviews)</span>
            </div>
          </div>

          <!-- Price -->
          <div data-primitive="$row" class="flex flex-row gap-4 items-baseline">
            <span data-primitive="$text" class="text-xl font-bold text-primary">$299.00</span>
            <span data-primitive="$text" class="text-sm text-muted-foreground line-through">$399.00</span>
          </div>

          <!-- Description -->
          <div data-primitive="$col" class="flex flex-col gap-2">
            <span data-primitive="$text" class="font-medium">Description</span>
            <span data-primitive="$text" class="text-muted-foreground">Experience premium sound quality with active noise cancellation. 30-hour battery life, comfortable over-ear design, and seamless Bluetooth 5.0 connectivity.</span>
          </div>

          <!-- Features -->
          <div data-primitive="$col" class="flex flex-col gap-1">
            <span data-primitive="$text" class="font-medium">Key Features</span>
            <div data-primitive="$row" class="flex flex-row gap-2 items-center">
              <span class="text-green-500">✓</span>
              <span data-primitive="$text">Active Noise Cancellation</span>
            </div>
            <div data-primitive="$row" class="flex flex-row gap-2 items-center">
              <span class="text-green-500">✓</span>
              <span data-primitive="$text">30-hour Battery Life</span>
            </div>
            <div data-primitive="$row" class="flex flex-row gap-2 items-center">
              <span class="text-green-500">✓</span>
              <span data-primitive="$text">Bluetooth 5.0</span>
            </div>
            <div data-primitive="$row" class="flex flex-row gap-2 items-center">
              <span class="text-green-500">✓</span>
              <span data-primitive="$text">Premium Comfort Fit</span>
            </div>
          </div>

          <!-- Action slot (state-dependent) -->
          <div data-slot="actions">
            ${actionContent[state]}
          </div>

        </div>
      </div>

      <!-- Related Products -->
      <div data-primitive="$col" class="flex flex-col gap-4 mt-8">
        <span data-primitive="$text" class="text-lg font-bold">You May Also Like</span>
        <div data-primitive="$row" class="flex flex-row gap-4 items-center">
          <div data-primitive="$box" class="bg-card rounded-md p-4 shadow-sm">
            <div data-primitive="$col" class="flex flex-col gap-2">
              <img src="https://picsum.photos/150/150?r1" alt="Related 1" class="w-30 h-30 object-cover rounded" />
              <span data-primitive="$text" class="text-sm font-medium">Earbuds Pro</span>
              <span data-primitive="$text" class="text-sm text-primary">$149.00</span>
            </div>
          </div>
          <div data-primitive="$box" class="bg-card rounded-md p-4 shadow-sm">
            <div data-primitive="$col" class="flex flex-col gap-2">
              <img src="https://picsum.photos/150/150?r2" alt="Related 2" class="w-30 h-30 object-cover rounded" />
              <span data-primitive="$text" class="text-sm font-medium">Speaker Mini</span>
              <span data-primitive="$text" class="text-sm text-primary">$79.00</span>
            </div>
          </div>
          <div data-primitive="$box" class="bg-card rounded-md p-4 shadow-sm">
            <div data-primitive="$col" class="flex flex-col gap-2">
              <img src="https://picsum.photos/150/150?r3" alt="Related 3" class="w-30 h-30 object-cover rounded" />
              <span data-primitive="$text" class="text-sm font-medium">Headphone Stand</span>
              <span data-primitive="$text" class="text-sm text-primary">$29.00</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
}
