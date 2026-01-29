# c3-405: Atlas Viewer

## Purpose

Renders atlas previews showing information architecture with nodes and relationships as a visual graph.

## Location

`src/theme/previews/AtlasPreview.tsx`

## Responsibilities

- Display IA nodes as visual graph
- Show relationships between nodes
- Detect and highlight cycles
- Enable interactive navigation

## Props

```typescript
interface AtlasPreviewProps {
  unit: PreviewUnit  // Atlas unit from preview scanner
}
```

## Preview Unit Structure

```typescript
{
  type: 'atlas',
  name: string,
  path: string,
  route: string,
  config: {
    title?: string,
    description?: string,
    nodes: NodeDefinition[],
    relationships?: RelationshipDefinition[],
  },
  files: {
    index: string,  // Atlas YAML definition
  }
}
```

## Node Definition

```typescript
interface NodeDefinition {
  id: string
  title: string
  type?: 'page' | 'section' | 'modal' | 'external'
  description?: string
  parent?: string  // Parent node ID for hierarchy
}
```

## Relationship Definition

```typescript
interface RelationshipDefinition {
  from: string
  to: string
  type?: 'navigates' | 'contains' | 'links'
  label?: string
}
```

## Features

- **Graph Visualization**: Nodes positioned in tree/graph layout
- **Cycle Detection**: Highlights circular relationships
- **Interactive Navigation**: Click nodes to explore
- **Hierarchy Display**: Parent-child relationships shown visually

## Dependencies

- **Internal:** [c3-401-preview-router](./c3-401-preview-router.md) dispatches here

## Data Flow

```
PreviewUnit
    ↓
Parse index.yaml for nodes/relationships
    ↓
Build graph structure
    ↓
Detect cycles (DFS)
    ↓
Render visual graph
```

## Cycle Detection

```typescript
// Uses depth-first search to find cycles
function detectCycles(nodes, relationships): string[][]
```

## Notes

- Useful for documenting site navigation structure
- Can reference screens and components
- Supports multiple relationship types
- Warns about circular references
