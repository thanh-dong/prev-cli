# prev-cli Architecture

## System Context

**prev-cli** is a zero-config documentation site generator that transforms markdown/MDX files into beautiful, interactive documentation websites with a built-in preview system.

```
+-------------------+
|     Developer     |
+-------------------+
         |
         | writes .md/.mdx files
         | runs CLI commands
         v
+-------------------+
|     prev-cli      |
|  (this system)    |
+-------------------+
         |
         | generates
         v
+-------------------+
|   Static Site     |
|  (HTML/JS/CSS)    |
+-------------------+
         |
         | deployed to
         v
+-------------------+
|  Static Host      |
| (GH Pages, etc.)  |
+-------------------+
```

## Philosophy

"prev-cli is for teams that want documentation, not a documentation project" - minimal configuration, maximum functionality out of the box.

## Key Capabilities

| Capability | Description |
|------------|-------------|
| Zero-Config | Auto-generates sidebar from file structure, default theme, automatic routing |
| MDX Support | React components embedded in markdown via `@mdx-js/rollup` |
| Preview System | Interactive catalog for components, screens, flows, and atlas views |
| Dark Mode | Built-in toggle with system preference detection |
| HMR | Hot module replacement for instant feedback during development |
| Mermaid/D2 | Native diagram rendering support |

## Containers

| ID | Container | Description |
|----|-----------|-------------|
| c3-1 | [cli](./c3-1-cli/) | Command-line interface, configuration loading, validation |
| c3-2 | [build](./c3-2-build/) | Vite-based build system with plugins for pages, previews, MDX |
| c3-3 | [theme](./c3-3-theme/) | React frontend: layout, routing, MDX components, styling |
| c3-4 | [previews](./c3-4-previews/) | Preview catalog, type-specific viewers, render adapters |
| c3-5 | [jsx](./c3-5-jsx/) | JSX primitives for renderer-agnostic layouts (WIP) |
| c3-6 | [primitives](./c3-6-primitives/) | Template-based layout primitives (WIP) |

## External Systems

| System | Interaction |
|--------|-------------|
| File System | Reads .md/.mdx files, writes static output to ./dist/ |
| Static Hosts | Output deployed to GitHub Pages, Vercel, Netlify, etc. |

## Deployment

**Input:** Markdown/MDX files in project directory
**Output:** Static HTML/JS/CSS in `./dist/`

```bash
# Development
prev dev          # Local Vite server with HMR

# Production
prev build        # Generate static site
prev preview      # Test production build locally
```

## Configuration

Optional `.prev.yaml` at project root:

```yaml
theme: system              # light | dark | system
contentWidth: constrained  # constrained | full
port: 3000                 # Dev server port
include: []                # Dot-prefixed dirs to include
hidden: []                 # Glob patterns to hide
order: {}                  # Custom page ordering
```
