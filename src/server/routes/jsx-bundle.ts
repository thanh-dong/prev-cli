// Route handler: /_prev/jsx.js - Serves pre-bundled @prev/jsx primitives
import path from 'path'

export function createJsxBundleHandler(cliRoot: string) {
  let cachedBundle: string | null = null
  const srcRoot = path.join(cliRoot, 'src')

  return async (req: Request): Promise<Response | null> => {
    const url = new URL(req.url)
    if (url.pathname !== '/_prev/jsx.js') return null

    try {
      if (!cachedBundle) {
        const jsxEntry = path.join(srcRoot, 'jsx/index.ts')

        const result = await Bun.build({
          entrypoints: [jsxEntry],
          format: 'esm',
          target: 'browser',
          minify: false,
          jsx: { runtime: 'automatic', importSource: 'react', development: false },
          external: ['react', 'react-dom', 'react/jsx-runtime', 'zod'],
          define: {
            'process.env.NODE_ENV': '"production"',
          },
        })

        if (result.success && result.outputs[0]) {
          let code = await result.outputs[0].text()
          // Replace external imports with esm.sh URLs
          code = code
            .replace(/from\s+['"]react\/jsx-runtime['"]/g, 'from "https://esm.sh/react@18/jsx-runtime"')
            .replace(/from\s+['"]react['"]/g, 'from "https://esm.sh/react@18"')
            .replace(/from\s+['"]react-dom['"]/g, 'from "https://esm.sh/react-dom@18"')
            .replace(/from\s+['"]zod['"]/g, 'from "https://esm.sh/zod"')
          cachedBundle = code
        }
      }

      if (cachedBundle) {
        return new Response(cachedBundle, {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache',
          },
        })
      }

      return new Response('Failed to bundle jsx primitives', { status: 500 })
    } catch (err) {
      console.error('Error bundling jsx:', err)
      return new Response(String(err), { status: 500 })
    }
  }
}

/** Invalidate the JSX bundle cache */
export function invalidateJsxCache(handler: ReturnType<typeof createJsxBundleHandler>) {
  // The handler closure captures cachedBundle, but we can't reach it from outside.
  // Instead, the dev server recreates handlers when jsx files change.
}
