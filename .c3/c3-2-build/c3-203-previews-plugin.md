# c3-203: Previews Plugin

## Purpose

Vite plugin that discovers preview components, generates virtual modules for the preview catalog, and builds standalone preview HTML files for production.

## Location

`src/vite/plugins/previews-plugin.ts`, `src/vite/previews.ts`

## Responsibilities

- Scan `previews/` directory for components, screens, flows, atlas
- Parse config.yaml for each preview unit
- Generate virtual module with preview catalog
- Build standalone HTML files during production build
- Handle HMR for preview file changes

## Virtual Module

### `virtual:prev-previews`

```typescript
export const previewUnits: PreviewUnit[]  // Multi-type units
export const previews: Preview[]          // Legacy flat previews

// Helper functions
export function getByType(type: string): PreviewUnit[]
export function getByTags(tags: string[]): PreviewUnit[]
export function getByCategory(category: string): PreviewUnit[]
export function getByStatus(status: string): PreviewUnit[]
```

## Preview Types

| Type | Folder | Index File |
|------|--------|------------|
| component | `previews/components/` | `App.tsx`, `index.tsx` |
| screen | `previews/screens/` | `App.tsx`, `index.tsx` |
| flow | `previews/flows/` | `index.yaml` |
| atlas | `previews/atlas/` | `index.yaml` |

## Production Build

During `closeBundle`:

1. Build shared vendor bundle (`_vendors/runtime.js`)
2. For each preview:
   - Load preview config
   - Build optimized HTML with esbuild
   - Write to `dist/_preview/<name>/index.html`

## Dependencies

- **Internal:** `preview-runtime/build-optimized.ts` for preview building
- **Internal:** `preview-runtime/vendors.ts` for vendor bundle
- **External:** `fast-glob` for file discovery

## Data Flow

```
previews/ directory
    ↓
scanPreviewUnits (for each type folder)
    ↓
Parse config.yaml + detect files
    ↓
Generate virtual module
    ↓
(Build mode) Compile standalone HTML
```

## HMR

Invalidates when files in `previews/` change:
- `.html`, `.tsx`, `.ts`, `.jsx`, `.js`
- `.css`, `.yaml`, `.yml`, `.mdx`

## Notes

- Supports both multi-type structure and legacy flat structure
- Vendor bundle shared across all previews for smaller output
- Preview depth determines relative vendor path
