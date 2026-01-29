# c3-204: Entry Plugin

## Purpose

Vite plugin that generates the React entry point for the documentation site.

## Location

`src/vite/plugins/entry-plugin.ts`

## Responsibilities

- Generate virtual entry module that bootstraps React app
- Set up TanStack Router with page routes
- Configure MDX provider and component mapping
- Handle preview routing

## Virtual Module

The entry plugin generates dynamic imports and route configuration based on discovered pages and previews.

## Dependencies

- **Internal:** [c3-202-pages-plugin](./c3-202-pages-plugin.md) for page data
- **Internal:** [c3-203-previews-plugin](./c3-203-previews-plugin.md) for preview data
- **External:** TanStack Router, React

## Notes

- Entry point is at `src/theme/entry.tsx` (not generated, but configured)
- Plugin may transform or inject dependencies
