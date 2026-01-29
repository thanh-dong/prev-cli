# c3-206: MDX Plugin

## Purpose

Configures MDX transformation for markdown files, enabling React components in documentation.

## Location

Configured in `src/vite/config.ts` (uses `@mdx-js/rollup`)

## Responsibilities

- Transform `.md` and `.mdx` files to React components
- Apply remark plugins for GitHub-flavored markdown
- Apply rehype plugins for syntax highlighting
- Configure MDX provider for component mapping

## Configuration

```typescript
mdx({
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeHighlight],
  providerImportSource: '@mdx-js/react',
  include: [
    path.join(rootDir, '**/*.md'),
    path.join(rootDir, '**/*.mdx'),
  ],
  exclude: [
    '**/node_modules/**',
    '**/.git/**',
  ],
})
```

## Plugins

### Remark Plugins
- **remark-gfm**: Tables, strikethrough, task lists, autolinks

### Rehype Plugins
- **rehype-highlight**: Code syntax highlighting

## Dependencies

- **External:** `@mdx-js/rollup` - Rollup/Vite MDX plugin
- **External:** `remark-gfm` - GitHub-flavored markdown
- **External:** `rehype-highlight` - Syntax highlighting

## MDX Provider

Component mapping defined in `src/theme/mdx-components.tsx`:

```typescript
export const mdxComponents = {
  h1: HeadingComponent,
  h2: HeadingComponent,
  code: CodeComponent,
  pre: PreComponent,
  Preview: PreviewComponent,
  // ...
}
```

## Notes

- Only processes files in project root, not node_modules
- MDX files can import React components directly
- Custom components can be used in markdown content
