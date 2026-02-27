// MDX plugin for Bun.build - compiles .md/.mdx files using @mdx-js/mdx
import type { BunPlugin } from 'bun'

export interface MdxPluginOptions {
  rootDir: string
}

export function mdxPlugin(options: MdxPluginOptions): BunPlugin {
  const { rootDir } = options

  return {
    name: 'prev-mdx',
    setup(build) {
      // Only process .md/.mdx files in user's project root
      build.onLoad({ filter: /\.(md|mdx)$/ }, async (args) => {
        // Skip files outside rootDir (e.g., node_modules)
        if (!args.path.startsWith(rootDir)) return undefined

        const source = await Bun.file(args.path).text()

        // Lazy-load @mdx-js/mdx to avoid top-level import cost
        const { compile } = await import('@mdx-js/mdx')
        const remarkGfm = (await import('remark-gfm')).default
        const rehypeHighlight = (await import('rehype-highlight')).default

        const compiled = await compile(source, {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeHighlight],
          providerImportSource: '@mdx-js/react',
          // Force production JSX to avoid _jsxDEV errors
          development: false,
          jsx: false, // Output JS, not JSX
        })

        return {
          contents: String(compiled),
          loader: 'jsx',
        }
      })
    },
  }
}
