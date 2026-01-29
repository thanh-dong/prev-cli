# ref-virtual-modules: Vite Virtual Module Pattern

## Pattern

Virtual modules are dynamically generated ES modules that don't exist on disk. They're resolved and loaded by Vite plugins at build/serve time.

## Implementation

### 1. Define Virtual Module ID

```typescript
const VIRTUAL_MODULE_ID = 'virtual:prev-pages'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID
```

The `\0` prefix is a Rollup convention marking internal/virtual modules.

### 2. Resolve the Module

```typescript
resolveId(id) {
  if (id === VIRTUAL_MODULE_ID) {
    return RESOLVED_VIRTUAL_MODULE_ID
  }
}
```

### 3. Load Module Content

```typescript
async load(id) {
  if (id === RESOLVED_VIRTUAL_MODULE_ID) {
    const data = await gatherData()
    return `export const pages = ${JSON.stringify(data)};`
  }
}
```

### 4. Import in Client Code

```typescript
import { pages } from 'virtual:prev-pages'
```

## Virtual Modules in prev-cli

| Module | Plugin | Exports |
|--------|--------|---------|
| `virtual:prev-pages` | pages-plugin | `pages`, `sidebar` |
| `virtual:prev-page-modules` | pages-plugin | `pageModules` |
| `virtual:prev-previews` | previews-plugin | `previewUnits`, `previews`, helpers |
| `virtual:prev-config` | config-plugin | `config` |

## HMR Handling

```typescript
handleHotUpdate({ file, server }) {
  if (isRelevantFile(file)) {
    // Clear cached data
    cache = null
    // Invalidate virtual module
    const mod = server.moduleGraph.getModuleById(RESOLVED_MODULE_ID)
    if (mod) {
      server.moduleGraph.invalidateModule(mod)
      return [mod]
    }
  }
}
```

## Used By

- [c3-202-pages-plugin](../c3-2-build/c3-202-pages-plugin.md)
- [c3-203-previews-plugin](../c3-2-build/c3-203-previews-plugin.md)
- [c3-205-config-plugin](../c3-2-build/c3-205-config-plugin.md)

## Notes

- Virtual modules excluded from `optimizeDeps.include`
- Content regenerated on HMR when source files change
- JSON.stringify used for data serialization
