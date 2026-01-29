# c3-502: JSX Runtime

## Purpose

JSX primitive components that create VNodes for layout and content.

## Location

`src/jsx/jsx-runtime.ts`

## Responsibilities

- Export primitive components as functions
- Create VNodes with appropriate types
- Support common layout patterns
- Enable declarative UI definition

## Primitives

### Layout Primitives

```typescript
// Vertical flex container
Col({ gap?, align?, justify?, padding?, ...props }, ...children)

// Horizontal flex container
Row({ gap?, align?, justify?, padding?, ...props }, ...children)

// Generic container
Box({ padding?, margin?, border?, bg?, ...props }, ...children)

// Flexible spacer
Spacer({ size?, flex? })
```

### Content Primitives

```typescript
// Text content
Text({ size?, weight?, color?, align? }, content)

// Icon component
Icon({ name, size?, color? })

// Image component
Image({ src, alt?, width?, height?, fit? })
```

### Structural Primitives

```typescript
// Named content slot
Slot({ name, fallback? })

// Grouping without wrapper
Fragment(...children)
```

## Usage Example

```typescript
import { Col, Row, Text, Spacer } from './jsx-runtime'

const layout = Col({ gap: 16, padding: 24 },
  Text({ size: 'lg', weight: 'bold' }, 'Title'),
  Spacer({ size: 8 }),
  Row({ gap: 8 },
    Text({}, 'Item 1'),
    Text({}, 'Item 2'),
  )
)
```

## Dependencies

- **Internal:** [c3-501-vnode](./c3-501-vnode.md) for VNode creation

## Notes

- All primitives return VNodes
- Props are typed via Zod schemas
- Children can be strings, numbers, or VNodes
- Gap/padding use design system units
