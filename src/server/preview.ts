// Static file server for previewing production builds (dist/)
import path from 'path'
import { existsSync, statSync } from 'fs'

export interface PreviewServerOptions {
  rootDir: string
  port: number
}

export async function startPreviewServer(options: PreviewServerOptions) {
  const { rootDir, port } = options
  const distDir = path.join(rootDir, 'dist')

  if (!existsSync(distDir)) {
    throw new Error(`No dist/ directory found. Run 'prev build' first.`)
  }

  const indexHtml = path.join(distDir, 'index.html')

  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url)
      let pathname = url.pathname

      // Remove trailing slash
      if (pathname !== '/' && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1)
      }

      // Try serving the exact file (must be a regular file, not a directory)
      const filePath = path.join(distDir, pathname)
      if (filePath.startsWith(distDir) && existsSync(filePath)) {
        try {
          if (statSync(filePath).isFile()) {
            return new Response(Bun.file(filePath))
          }
        } catch {}
      }

      // Try with index.html for directory paths
      const indexPath = path.join(distDir, pathname, 'index.html')
      if (existsSync(indexPath)) {
        return new Response(Bun.file(indexPath))
      }

      // SPA fallback: serve index.html for non-file routes
      if (!pathname.includes('.') && existsSync(indexHtml)) {
        return new Response(Bun.file(indexHtml))
      }

      return new Response('Not Found', { status: 404 })
    },
  })

  return {
    server,
    port: server.port,
    url: `http://localhost:${server.port}/`,
    stop: () => server.stop(),
  }
}
