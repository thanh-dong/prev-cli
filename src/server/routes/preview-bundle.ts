// Route handler: /_preview-bundle/* - Bundles preview components on demand
import path from 'path'
import { existsSync } from 'fs'

export function createPreviewBundleHandler(rootDir: string) {
  return async (req: Request): Promise<Response | null> => {
    const url = new URL(req.url)
    if (!url.pathname.startsWith('/_preview-bundle/')) return null

    const startTime = performance.now()
    const previewPath = decodeURIComponent(url.pathname.slice('/_preview-bundle/'.length))
    const previewDir = path.join(rootDir, 'previews', previewPath)

    // Security: prevent path traversal
    if (!previewDir.startsWith(path.join(rootDir, 'previews'))) {
      return new Response('Forbidden', { status: 403 })
    }

    // Find entry file — if ?state= is provided, use that file instead of index
    const state = url.searchParams.get('state')
    let entryFile = ''

    if (state) {
      const stateFiles = [`${state}.tsx`, `${state}.jsx`, `${state}.ts`, `${state}.js`]
      for (const f of stateFiles) {
        if (existsSync(path.join(previewDir, f))) {
          entryFile = path.join(previewDir, f)
          break
        }
      }
    }

    if (!entryFile) {
      const defaultFiles = ['index.tsx', 'index.ts', 'index.jsx', 'index.js', 'App.tsx', 'App.ts']
      for (const f of defaultFiles) {
        if (existsSync(path.join(previewDir, f))) {
          entryFile = path.join(previewDir, f)
          break
        }
      }
    }

    if (!entryFile) {
      return new Response(JSON.stringify({ error: 'No entry file found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const result = await Bun.build({
        entrypoints: [entryFile],
        format: 'esm',
        target: 'browser',
        minify: false,
        jsx: { runtime: 'automatic', importSource: 'react', development: false },
        external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', '@prev/jsx', 'fs', 'path', 'js-yaml'],
        define: {
          'process.env.NODE_ENV': '"production"',
        },
        plugins: [{
          name: 'esm-sh-aliases',
          setup(build) {
            // Rewrite externalized React imports to esm.sh URLs
            build.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, (args) => {
              const parts = args.path.split('/')
              const pkg = parts[0]
              const subpath = parts.slice(1).join('/')
              const url = subpath
                ? `https://esm.sh/${pkg}@18/${subpath}`
                : `https://esm.sh/${pkg}@18`
              return { path: url, external: true }
            })
          },
        }],
      })

      if (!result.success) {
        const errors = result.logs.map(l => l.message).join('\n')
        return new Response(JSON.stringify({ error: errors }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const code = result.outputs[0] ? await result.outputs[0].text() : ''
      const bundleTime = Math.round(performance.now() - startTime)

      return new Response(code, {
        headers: {
          'Content-Type': 'application/javascript',
          'X-Bundle-Time': String(bundleTime),
        },
      })
    } catch (err) {
      console.error('Bundle error:', err)
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}
