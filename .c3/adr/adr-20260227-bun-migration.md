# ADR: Vite -> Bun Migration

**Status:** implemented
**Date:** 2026-02-27

## Context
prev-cli originally used Vite as its build system and dev server. As Bun matured with native build (Bun.build), serve (Bun.serve), and plugin APIs, migrating eliminated external build tool dependencies.

## Decision
Replace Vite with Bun.build() for bundling and Bun.serve() for dev/preview servers.

## Key Changes
- Dev server: Vite dev server -> Bun.serve() with SSE-based live reload
- Build: Vite build -> Bun.build() for production static site generation
- Preview: Vite preview -> Bun.serve() static file serving
- Plugins: Vite plugin API (resolveId/load) -> Bun plugin API (onResolve/onLoad)
- MDX: @mdx-js/rollup -> @mdx-js/mdx (compiled directly via Bun plugin onLoad)
- Source restructure: src/vite/ -> src/content/ (pure logic) + src/server/ (build/serve)

## Tradeoffs
- Lost Vite's mature HMR; replaced with full-page SSE reload
- Bun.serve()'s HTML import bundler doesn't respect Bun.plugin() -- required pre-building with Bun.build() and serving from fetch handler
- `builder.module()` doesn't work in Bun.build() -- virtual modules resolved via namespace-based onResolve/onLoad

## Consequences
- Zero external build tool dependencies (Vite, esbuild CLI removed)
- Faster dev startup (no Vite overhead)
- Simpler architecture (one runtime for everything)
- src/vite/ split into src/content/ (scanning logic) and src/server/ (build/serve infrastructure)
