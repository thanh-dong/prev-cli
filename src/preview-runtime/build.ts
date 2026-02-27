// src/preview-runtime/build.ts
// Production build for previews - pre-bundles React/TSX at build time

import type { PreviewConfig } from './types'
import { mkdtempSync, writeFileSync, rmSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { tmpdir } from 'os'

export interface PreviewBuildResult {
  html: string
  error?: string
}

/**
 * Build a preview into a standalone HTML file for production
 * Uses Bun.build (native) to bundle at build time
 */
export async function buildPreviewHtml(config: PreviewConfig): Promise<PreviewBuildResult> {
  try {
    // Find entry and check if it exports default
    const entryFile = config.files.find(f => f.path === config.entry)
    if (!entryFile) {
      return { html: '', error: `Entry file not found: ${config.entry}` }
    }

    const hasDefaultExport = /export\s+default/.test(entryFile.content)

    // Create entry wrapper
    const entryCode = hasDefaultExport ? `
      import React from 'react'
      import { createRoot } from 'react-dom/client'
      import App from './${config.entry}'

      const root = createRoot(document.getElementById('root'))
      root.render(React.createElement(App))
    ` : `
      import './${config.entry}'
    `

    // Write all files to temp directory
    const tempDir = mkdtempSync(join(tmpdir(), 'prev-build-'))
    const entryPath = join(tempDir, '__entry.tsx')

    try {
      writeFileSync(entryPath, entryCode)

      // Write virtual files to temp dir
      for (const file of config.files) {
        const targetPath = join(tempDir, file.path)
        const dir = dirname(targetPath)
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
        }
        writeFileSync(targetPath, file.content)
      }

      // Bundle with Bun.build
      const result = await Bun.build({
        entrypoints: [entryPath],
        format: 'esm',
        target: 'browser',
        minify: true,
        jsx: { runtime: 'automatic', importSource: 'react' },
        define: {
          'process.env.NODE_ENV': '"production"',
        },
        plugins: [{
          name: 'preview-externals',
          setup(build) {
            // External: React from CDN
            build.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, args => {
              const parts = args.path.split('/')
              const pkg = parts[0]
              const subpath = parts.slice(1).join('/')
              const url = subpath
                ? `https://esm.sh/${pkg}@18/${subpath}`
                : `https://esm.sh/${pkg}@18`
              return { path: url, external: true }
            })

            // Auto-resolve npm packages via esm.sh
            build.onResolve({ filter: /^[^./]/ }, args => {
              if (args.path.startsWith('https://')) return undefined
              return { path: `https://esm.sh/${args.path}`, external: true }
            })

            // CSS: convert to JS that injects styles
            build.onLoad({ filter: /\.css$/ }, args => {
              const content = Bun.file(args.path)
              return content.text().then(css => {
                const escaped = css.replace(/`/g, '\\`').replace(/\$/g, '\\$')
                return {
                  contents: `
                    const style = document.createElement('style');
                    style.textContent = \`${escaped}\`;
                    document.head.appendChild(style);
                  `,
                  loader: 'js',
                }
              })
            })
          },
        }],
      })

      if (!result.success) {
        const errors = result.logs.filter(l => l.level === 'error').map(l => l.message).join('; ')
        return { html: '', error: errors || 'Build failed' }
      }

      const jsFile = result.outputs.find(f => f.path.endsWith('.js')) || result.outputs[0]
      const jsCode = jsFile ? await jsFile.text() : ''

      // Generate standalone HTML
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    body { margin: 0; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">${jsCode}</script>
</body>
</html>`

      return { html }
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  } catch (err) {
    return {
      html: '',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
