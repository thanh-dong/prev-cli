# c3-205: Config Plugin

## Purpose

Vite plugin that injects runtime configuration into the client bundle via a virtual module.

## Location

`src/vite/plugins/config-plugin.ts`

## Responsibilities

- Create virtual module `virtual:prev-config`
- Inject user's `.prev.yaml` settings into client code
- Enable runtime access to theme, contentWidth, and other settings

## Virtual Module

### `virtual:prev-config`

```typescript
export const config: {
  theme: 'light' | 'dark' | 'system'
  contentWidth: 'constrained' | 'full'
  // ... other config fields
}
```

## API

```typescript
function createConfigPlugin(config: PrevConfig): Plugin
```

## Dependencies

- **Internal:** [c3-102-config-loader](../c3-1-cli/c3-102-config-loader.md) provides PrevConfig

## Usage in Theme

```typescript
import { config } from 'virtual:prev-config'

// Access theme settings
if (config.theme === 'dark') {
  // Apply dark mode
}
```

## Notes

- Config is serialized as JSON in the virtual module
- Changes to config require dev server restart
