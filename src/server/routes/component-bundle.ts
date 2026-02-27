// Route handler: /_prev/components/*.js - Serves pre-bundled preview components
import path from 'path'
import { existsSync } from 'fs'

export function createComponentBundleHandler(rootDir: string) {
  const componentCache = new Map<string, string>()

  return async (req: Request): Promise<Response | null> => {
    const url = new URL(req.url)
    const match = url.pathname.match(/^\/_prev\/components\/([^/]+)\.js$/)
    if (!match) return null

    const componentName = match[1]
    const componentEntry = path.join(rootDir, 'previews/components', componentName, 'index.tsx')

    if (!existsSync(componentEntry)) {
      return new Response(`Component not found: ${componentName}`, { status: 404 })
    }

    try {
      let bundledCode = componentCache.get(componentName)

      if (!bundledCode) {
        const result = await Bun.build({
          entrypoints: [componentEntry],
          format: 'esm',
          target: 'browser',
          minify: false,
          jsx: { runtime: 'automatic', importSource: 'react', development: false },
          external: ['react', 'react-dom', 'react/jsx-runtime', '@prev/jsx'],
          define: {
            'process.env.NODE_ENV': '"production"',
          },
        })

        if (result.success && result.outputs[0]) {
          let code = await result.outputs[0].text()
          const origin = req.headers.get('origin') || ''
          code = code
            .replace(/from\s+['"]react\/jsx-runtime['"]/g, 'from "https://esm.sh/react@18/jsx-runtime"')
            .replace(/from\s+['"]react['"]/g, 'from "https://esm.sh/react@18"')
            .replace(/from\s+['"]react-dom['"]/g, 'from "https://esm.sh/react-dom@18"')
            .replace(/from\s+['"]@prev\/jsx['"]/g, `from "${origin}/_prev/jsx.js"`)
          bundledCode = code
          componentCache.set(componentName, code)
        }
      }

      if (bundledCode) {
        return new Response(bundledCode, {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache',
          },
        })
      }

      return new Response(`Failed to bundle component: ${componentName}`, { status: 500 })
    } catch (err) {
      console.error(`Error bundling component ${componentName}:`, err)
      return new Response(String(err), { status: 500 })
    }
  }
}
