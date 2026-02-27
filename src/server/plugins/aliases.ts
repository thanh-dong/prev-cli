// Alias plugin for Bun.build — resolves library imports to CLI's node_modules
// Critical for React dedup (single instance) and library path resolution
// Uses require.resolve() to find actual entry files (not directories)
import type { BunPlugin } from 'bun'
import path from 'path'
import { existsSync } from 'fs'

// Find node_modules containing react — handles hoisted deps (bunx, npm, pnpm)
function findNodeModules(cliRoot: string): string {
  const localNodeModules = path.join(cliRoot, 'node_modules')
  if (existsSync(path.join(localNodeModules, 'react'))) {
    return localNodeModules
  }

  // Traverse up to find hoisted node_modules
  let dir = cliRoot
  for (let i = 0; i < 10; i++) {
    const parent = path.dirname(dir)
    if (parent === dir) break
    if (path.basename(parent) === 'node_modules' && existsSync(path.join(parent, 'react'))) {
      return parent
    }
    dir = parent
  }

  return localNodeModules
}

export interface AliasesOptions {
  cliRoot: string
}

export function aliasesPlugin(options: AliasesOptions): BunPlugin {
  const { cliRoot } = options
  const nodeModules = findNodeModules(cliRoot)
  const srcRoot = path.join(cliRoot, 'src')

  // Packages to resolve from CLI's node_modules (for React dedup and consistency)
  const packages = [
    'react',
    'react-dom',
    '@tanstack/react-router',
    '@mdx-js/react',
    'mermaid',
    'dayjs',
    '@terrastruct/d2',
    'use-sync-external-store',
  ]

  return {
    name: 'prev-aliases',
    setup(build) {
      // Project aliases: @prev/ui, @prev/theme → src directories
      build.onResolve({ filter: /^@prev\/(ui|theme)/ }, (args) => {
        const relPath = args.path.replace('@prev/', '')
        const resolved = path.join(srcRoot, relPath)
        // Resolve directory imports to index.ts
        try {
          return { path: require.resolve(resolved) }
        } catch {
          return { path: resolved }
        }
      })

      // Package aliases: resolve via require.resolve to get actual file paths
      for (const pkg of packages) {
        const esc = pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Match package name and all subpath imports (e.g., react-dom/client)
        build.onResolve({ filter: new RegExp(`^${esc}(/|$)`) }, (args) => {
          try {
            return { path: require.resolve(args.path, { paths: [nodeModules] }) }
          } catch {
            return undefined // Let default resolution handle it
          }
        })
      }
    },
  }
}
