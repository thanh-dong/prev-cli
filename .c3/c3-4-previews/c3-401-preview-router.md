# c3-401: Preview Router

## Purpose

Routes preview requests to the appropriate type-specific viewer based on preview type (component, screen, flow, atlas).

## Location

`src/theme/previews/PreviewRouter.tsx`

## Responsibilities

- Look up preview unit by type and name
- Dispatch to correct viewer component
- Display not-found message for missing previews
- Provide preview list component for browsing

## Props

```typescript
interface PreviewRouterProps {
  type: string   // 'component' | 'screen' | 'flow' | 'atlas'
  name: string   // Preview name (folder name)
}
```

## Type Dispatch

```typescript
switch (unit.type) {
  case 'component': return <ComponentPreview unit={unit} />
  case 'screen':    return <ScreenPreview unit={unit} />
  case 'flow':      return <FlowPreview unit={unit} />
  case 'atlas':     return <AtlasPreview unit={unit} />
}
```

## PreviewList Component

Groups previews by type and renders as clickable cards:

```typescript
<PreviewList />           // All previews
<PreviewList type="component" />  // Only components
```

### Card Display
- Title (from config or folder name)
- Description (from config)
- Tags (first 3, with overflow count)

## Dependencies

- **Internal:** `virtual:prev-previews` for unit lookup
- **Internal:** [c3-402-component-viewer](./c3-402-component-viewer.md)
- **Internal:** [c3-403-screen-viewer](./c3-403-screen-viewer.md)
- **Internal:** [c3-404-flow-viewer](./c3-404-flow-viewer.md)
- **Internal:** [c3-405-atlas-viewer](./c3-405-atlas-viewer.md)

## Data Flow

```
PreviewRouter(type, name)
    ↓
previewUnits.find(u => u.type === type && u.name === name)
    ↓
Switch on unit.type
    ↓
Type-specific viewer
```

## Notes

- Unit not found shows friendly error with expected path
- Unknown type shows generic error
- List view supports filtering by type
