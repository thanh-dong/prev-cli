# c3-207: Preview Runtime

## Purpose

Builds standalone preview HTML files for production using esbuild and Tailwind CSS compilation.

## Location

`src/preview-runtime/build-optimized.ts`, `src/preview-runtime/vendors.ts`, `src/preview-runtime/tailwind.ts`, `src/preview-runtime/types.ts`

## Responsibilities

- Build shared vendor bundle (React, ReactDOM)
- Compile individual preview bundles with esbuild
- Process Tailwind CSS v4 for production
- Generate standalone HTML files

## API

### buildOptimizedPreview()

```typescript
async function buildOptimizedPreview(
  config: PreviewConfig,
  options: OptimizedBuildOptions
): Promise<OptimizedBuildResult>

interface OptimizedBuildOptions {
  vendorPath: string  // Relative path to vendor bundle
}

interface OptimizedBuildResult {
  success: boolean
  html: string
  css: string
  error?: string
}
```

### buildVendorBundle()

```typescript
async function buildVendorBundle(): Promise<{
  success: boolean
  code: string
  error?: string
}>
```

### compileTailwind()

```typescript
async function compileTailwind(
  files: Array<{ path: string; content: string }>
): Promise<{
  success: boolean
  css: string
  error?: string
}>
```

## Build Process

```
Preview files (tsx, css, etc.)
    ↓
Create virtual filesystem
    ↓
Bundle with esbuild (externalize React)
    ↓
Compile Tailwind CSS
    ↓
Merge user CSS
    ↓
Generate HTML with inline scripts/styles
```

## Vendor Bundle

Single shared bundle containing:
- React
- ReactDOM
- createRoot

Loaded once, shared across all previews for smaller total size.

## Dependencies

- **Internal:** [c3-203-previews-plugin](./c3-203-previews-plugin.md) invokes during build
- **External:** `esbuild` for bundling, `tailwindcss` for CSS processing

## PreviewConfig Interface

```typescript
interface PreviewConfig {
  files: PreviewFile[]   // All files in preview directory
  entry: string          // Entry point (App.tsx, etc.)
  tailwind: boolean      // Enable Tailwind processing
}

interface PreviewFile {
  path: string
  content: string
  type: 'tsx' | 'ts' | 'jsx' | 'js' | 'css' | 'json'
}
```

## Notes

- Tailwind v4 uses `@import "tailwindcss"` syntax
- CSS imports stripped when Tailwind compiled
- Minification enabled for production
- JSX automatic runtime used
