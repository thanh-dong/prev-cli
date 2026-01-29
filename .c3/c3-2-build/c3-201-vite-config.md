# c3-201: Vite Config

## Purpose

Creates the Vite configuration for building and serving documentation sites. Configures plugins, resolves, caching, and server options.

## Location

`src/vite/config.ts`

## Responsibilities

- Create Vite InlineConfig for dev/build/preview modes
- Configure MDX transformation pipeline
- Set up plugin chain (pages, previews, entry, config, debug)
- Configure module resolution and deduplication
- Handle preview server routes and SPA fallback
- Manage global cache for optimized dependencies

## API

### ConfigOptions

```typescript
interface ConfigOptions {
  rootDir: string                    // Project root directory
  mode: 'development' | 'production' // Vite mode
  port?: number                      // Dev server port
  include?: string[]                 // Dot directories to include
  base?: string                      // Base path for deployment
  debug?: boolean                    // Enable debug tracing
}
```

### createViteConfig

```typescript
async function createViteConfig(options: ConfigOptions): Promise<InlineConfig>
```

## Plugin Chain

1. **debugPlugin** (optional) - Performance tracing
2. **mdx** - MDX transformation with GFM and syntax highlighting
3. **react** - React fast refresh
4. **configPlugin** - Runtime config injection
5. **pagesPlugin** - Page discovery and sidebar generation
6. **entryPlugin** - React entry point generation
7. **previewsPlugin** - Preview catalog and building
8. **prev-config-api** - Inline plugin for config updates
9. **prev-spa-fallback** - SPA routing for client-side navigation
10. **prev-preview-server** - Preview routes and WASM runtime

## Dependencies

- **Internal:** [c3-102-config-loader](../c3-1-cli/c3-102-config-loader.md) for loading config
- **Internal:** All plugins in [c3-2-build](../c3-2-build/)
- **External:** Vite, @vitejs/plugin-react, @mdx-js/rollup

## Key Configurations

### Module Resolution

```typescript
alias: {
  '@prev/ui': 'src/ui',
  '@prev/theme': 'src/theme',
  'react': '<cliNodeModules>/react',
  // ... dedupe React and dependencies
}
```

### Global Cache

Uses `~/.cache/prev/deps` for shared dependency optimization across projects.

### Server Middleware

- `/__prev/config` - POST endpoint for page order updates
- `/_preview/*` - Preview HTML and config serving
- `/_preview-runtime` - WASM preview runtime
- SPA fallback for all non-asset routes

## Notes

- Friendly logger hides technical Vite noise
- Virtual modules excluded from optimization
- Build output to `./dist` with rollup input from theme entry
