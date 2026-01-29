# c3-504: HTML Adapter

## Purpose

Renders VNode trees to HTML strings for static output.

## Location

`src/jsx/adapters/html.ts`

## Responsibilities

- Convert VNode tree to HTML string
- Map primitive types to HTML elements
- Apply styles from props
- Handle text content escaping

## API

### renderToHtml()

```typescript
function renderToHtml(
  vnode: VNode,
  context?: RenderContext
): string

interface RenderContext {
  slots?: Record<string, VNode[]>  // Slot content from parent
  indent?: number                   // Indentation level
  pretty?: boolean                  // Pretty-print output
}
```

## Element Mapping

| Primitive | HTML Element | Styles |
|-----------|-------------|--------|
| `col` | `<div>` | `display: flex; flex-direction: column` |
| `row` | `<div>` | `display: flex; flex-direction: row` |
| `box` | `<div>` | Custom styles from props |
| `spacer` | `<div>` | `flex: 1` or fixed size |
| `text` | `<span>` | Font styles |
| `icon` | `<svg>` | Icon from sprite |
| `image` | `<img>` | Sizing and fit |
| `slot` | (children) | No wrapper |
| `fragment` | (children) | No wrapper |

## Style Generation

```typescript
// Props mapped to CSS
{ gap: 16 }      → 'gap: 16px'
{ padding: 24 }  → 'padding: 24px'
{ bg: 'muted' }  → 'background: var(--fd-muted)'
```

## Dependencies

- **Internal:** [c3-501-vnode](./c3-501-vnode.md) for VNode types

## Usage Example

```typescript
import { renderToHtml } from './adapters/html'
import { Col, Text } from './jsx-runtime'

const vnode = Col({ gap: 8 },
  Text({ weight: 'bold' }, 'Hello'),
  Text({}, 'World'),
)

const html = renderToHtml(vnode)
// <div style="display:flex;flex-direction:column;gap:8px">
//   <span style="font-weight:bold">Hello</span>
//   <span>World</span>
// </div>
```

## Notes

- Output is minified by default
- Set `pretty: true` for readable output
- Text content is HTML-escaped
- Slots resolved from context
