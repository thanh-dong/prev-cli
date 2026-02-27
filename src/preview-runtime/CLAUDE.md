<!-- c3-generated: c3-207 -->
# c3-207: Preview Runtime

Before modifying this code, read:
- Component: `.c3/c3-2-build/c3-207-preview-runtime.md`
- Patterns: `ref-preview-types`

Key responsibilities:
- Build shared vendor bundle (React, ReactDOM)
- Compile individual preview bundles with Bun.build()
- Process Tailwind CSS v4 for production
- Generate standalone HTML files

Files:
- `build-optimized.ts` - Main preview building logic
- `vendors.ts` - Shared vendor bundle
- `tailwind.ts` - Tailwind CSS compilation
- `types.ts` - Type definitions

Full refs: `.c3/refs/ref-preview-types.md`
<!-- end-c3-generated -->
