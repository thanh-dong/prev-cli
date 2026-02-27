<!-- c3-generated: c3-209, c3-210, c3-211, c3-212 -->
# Server (Bun-based)

Before modifying this code, read:
- `.c3/c3-2-build/c3-209-dev-server.md` - Dev server with SSE live reload
- `.c3/c3-2-build/c3-210-build.md` - Production static site generator
- `.c3/c3-2-build/c3-211-preview-server.md` - Preview server for dist/
- `.c3/c3-2-build/c3-212-aliases-plugin.md` - Module resolution plugin

Key modules:
- `start.ts` - Command dispatcher (dev/build/preview)
- `dev.ts` - Bun.serve() dev server with Bun.build() bundling + SSE reload
- `build.ts` - Bun.build() production builder with static HTML generation
- `preview.ts` - Bun.serve() static file server for dist/
- `plugins/` - Bun plugins (virtual-modules, mdx, aliases)
- `routes/` - Dev server route handlers (preview-bundle, preview-config, tokens, etc.)
<!-- end-c3-generated -->
