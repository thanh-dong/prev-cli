# c3-406: Render Adapter

## Purpose

Pluggable rendering backend that enables preview components to be rendered with different technologies (React, HTML).

## Location

`src/renderers/types.ts`, `src/renderers/registry.ts`, `src/renderers/render.ts`

## Responsibilities

- Define adapter interface for renderers
- Register available renderers
- Select renderer based on config
- Render preview content to target

## Adapter Interface

```typescript
interface RendererAdapter {
  name: string

  // Render component to output format
  render(layout: LayoutNode[], context: RenderContext): Promise<RenderResult>

  // Check if renderer supports feature
  supports(feature: string): boolean
}
```

## Available Renderers

| Renderer | Output | Use Case |
|----------|--------|----------|
| `react` | React components | Interactive previews |
| `html` | Static HTML | Documentation, SSR |

## Registration

```typescript
// Register adapter
registerRenderer('react', reactAdapter)
registerRenderer('html', htmlAdapter)

// Get adapter
const adapter = getRenderer('react')
```

## Render Context

```typescript
interface RenderContext {
  preview: PreviewUnit
  state?: string
  props?: Record<string, unknown>
  viewport?: ViewportMode
}
```

## Dependencies

- **Internal:** Preview types from [c3-4-previews](../c3-4-previews/)
- **External:** React for react adapter, DOM for html adapter

## Data Flow

```
Preview config
    ↓
Select renderer from config.layoutByRenderer
    ↓
Get adapter from registry
    ↓
adapter.render(layout, context)
    ↓
Output (React element or HTML string)
```

## Notes

- Adapters are lazy-loaded
- Config can specify per-renderer layouts
- Fallback to default renderer if specific not available
- Enables server-side rendering of previews
