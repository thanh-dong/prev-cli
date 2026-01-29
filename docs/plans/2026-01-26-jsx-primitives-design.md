# JSX-Based Primitives Design

Replace YAML config with JSX. Zod schemas define everything. TypeScript validates at compile time.

## Architecture

```
JSX/TSX → Virtual Tree (immutable) → Adapter → HTML/Tailwind
```

## Core Components

### 1. Zod Schemas (Single Source of Truth)

```typescript
// schemas/tokens.ts
export const SpacingToken = z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'])
export const ColorToken = z.enum(['background', 'foreground', 'primary', 'muted', ...])
export const SizeToken = z.enum(['xs', 'sm', 'md', 'lg', 'xl'])

// schemas/primitives.ts
export const ColProps = z.object({
  gap: SpacingToken.optional(),
  padding: SpacingToken.optional(),
  children: z.any(),
})
```

Types derived via `z.infer<typeof Schema>`. No separate type definitions.

### 2. Virtual Tree

```typescript
export const VNode = z.object({
  id: z.string(),
  type: z.enum(['col', 'row', 'box', 'text', 'icon', 'image', 'spacer', 'slot', 'component']),
  props: z.record(z.unknown()),
  children: z.array(z.lazy(() => VNode)).optional(),
  componentName: z.string().optional(),
})

// Immutable creation
export function createVNode(type, props, children?): VNode {
  return Object.freeze({ id: generateId(type), type, props: Object.freeze(props), children })
}
```

### 3. JSX Runtime

```typescript
// jsx-runtime.ts
export function Col(props: ColProps): VNode {
  if (DEV) ColProps.parse(props)  // Runtime validation in dev only
  return createVNode('col', props, normalizeChildren(props.children))
}

export function jsx(type: Function, props): VNode {
  return type(props)
}
export { jsx as jsxs, jsx as jsxDEV }
```

### 4. defineComponent API

```typescript
export function defineComponent<TProps extends z.ZodType, TStates extends z.ZodType>({
  name,
  props,
  states,
  defaultState,
  render,  // (ctx: { props, state }) => VNode
}) {
  return function Component(p: z.infer<TProps>, s?: z.infer<TStates>): VNode {
    const validatedProps = props.parse(p)
    const validatedState = states.parse(s ?? defaultState)
    const rendered = render({ props: validatedProps, state: validatedState })
    return createVNode('component', { componentName: name }, [rendered])
  }
}
```

### 5. HTML Adapter

Maps VNode tree to HTML with Tailwind classes. Token-to-class mappings defined once.

## Codex Review Mitigations

| Risk | Mitigation |
|------|------------|
| **Type drift** | Zod schemas are single source. `z.infer` generates types. No separate definitions to drift. |
| **JSX pragma fragility** | Use standard `jsxImportSource` (Vite-native). Test against supported Vite versions in CI. |
| **defineComponent signatures** | Typed context object `{ props, state }`. TypeScript enforces VNode return. Runtime validates in dev. |
| **Tree identity** | Immutable (Object.freeze). Deterministic IDs via counter reset per render. Structural equality for comparison. |

## Vite Config

```typescript
// vite.config.ts
export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: '@prev-cli/primitives' }
})
```

## Implementation Order

1. Zod schemas for tokens and primitives
2. VNode + createVNode
3. JSX runtime exports
4. HTML adapter
5. defineComponent
6. Migration tool (YAML → JSX)

## Type Checking

```bash
bunx @typescript/native-preview --noEmit || tsc --noEmit
```

## Success Criteria

- [ ] Type errors caught at compile time
- [ ] Runtime validation in dev mode
- [ ] HTML output matches current renderer
- [ ] Custom components preserved in tree
