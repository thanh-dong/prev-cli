# c3-2: Build Container

## Purpose

Vite-based build system that compiles markdown/MDX files into a static documentation site. Provides plugins for page discovery, preview scanning, and MDX transformation.

## Responsibilities

- Configure Vite for documentation site generation
- Scan and parse markdown/MDX files for page metadata
- Discover and catalog preview configurations
- Generate virtual modules for runtime injection
- Handle MDX transformation with syntax highlighting

## Entry Point

`src/vite/config.ts` - Vite configuration builder

## Key Directories

| Path | Purpose |
|------|---------|
| `src/vite/` | Build configuration and plugins |
| `src/vite/plugins/` | Vite plugin implementations |

## Components

| ID | Component | Description |
|----|-----------|-------------|
| c3-201 | [vite-config](./c3-201-vite-config.md) | Core Vite configuration builder |
| c3-202 | [pages-plugin](./c3-202-pages-plugin.md) | Page discovery and sidebar generation |
| c3-203 | [previews-plugin](./c3-203-previews-plugin.md) | Preview catalog discovery |
| c3-204 | [entry-plugin](./c3-204-entry-plugin.md) | React entry point generation |
| c3-205 | [config-plugin](./c3-205-config-plugin.md) | Runtime config injection |
| c3-206 | [mdx-plugin](./c3-206-mdx-plugin.md) | MDX transformation pipeline |
| c3-207 | [preview-runtime](./c3-207-preview-runtime.md) | Preview build with esbuild + Tailwind |

## Virtual Modules

| Module | Purpose |
|--------|---------|
| `virtual:prev-pages` | Generated page manifest |
| `virtual:prev-page-modules` | MDX component imports |
| `virtual:prev-previews` | Preview catalog |
| `virtual:prev-config` | Runtime configuration |

## Dependencies

- **Internal:** [c3-1-cli](../c3-1-cli/) provides configuration
- **External:** Vite, @mdx-js/rollup, fast-glob

## Data Flow

```
.md/.mdx files
      ↓
 Page Scanner (frontmatter extraction)
      ↓
 Virtual Modules (page manifest, MDX imports)
      ↓
 Vite Bundle
      ↓
 Static Output (./dist/)
```
