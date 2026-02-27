// Virtual module plugin for Bun — provides virtual:prev-* modules
// Uses onResolve/onLoad with namespace (works with both Bun.plugin() and Bun.build())
import type { BunPlugin } from 'bun'
import path from 'path'
import { scanPages, buildSidebarTree } from '../../content/pages'
import { scanPreviewUnits } from '../../content/previews'
import { loadConfig, type PrevConfig } from '../../config'
import { resolveTokens } from '../../tokens/resolver'
import { existsSync } from 'fs'

export interface VirtualModulesOptions {
  rootDir: string
  include?: string[]
  config?: PrevConfig
}

export function virtualModulesPlugin(options: VirtualModulesOptions): BunPlugin {
  const { rootDir, include } = options
  const config = options.config || loadConfig(rootDir)

  // Cache
  let cachedPages: Awaited<ReturnType<typeof scanPages>> | null = null

  async function getPages() {
    if (!cachedPages) {
      cachedPages = await scanPages(rootDir, { include })
    }
    return cachedPages
  }

  return {
    name: 'prev-virtual-modules',
    setup(build) {
      // Resolve virtual:prev-* imports to a virtual namespace
      build.onResolve({ filter: /^virtual:prev-/ }, (args) => ({
        path: args.path,
        namespace: 'prev-virtual',
      }))

      // Load virtual module content
      build.onLoad({ filter: /.*/, namespace: 'prev-virtual' }, async (args) => {
        switch (args.path) {
          case 'virtual:prev-config':
            return {
              contents: `export const config = ${JSON.stringify(config)};`,
              loader: 'js',
            }

          case 'virtual:prev-pages': {
            const pages = await getPages()
            const sidebar = buildSidebarTree(pages)
            return {
              contents: `export const pages = ${JSON.stringify(pages)};\nexport const sidebar = ${JSON.stringify(sidebar)};`,
              loader: 'js',
            }
          }

          case 'virtual:prev-page-modules': {
            const pages = await getPages()
            const imports = pages.map((page, i) => {
              const absolutePath = path.join(rootDir, page.file)
              return `import * as _page${i} from ${JSON.stringify(absolutePath)};`
            }).join('\n')

            const entries = pages.map((page, i) =>
              `  ${JSON.stringify('/' + page.file)}: _page${i}`
            ).join(',\n')

            return {
              contents: `${imports}\nexport const pageModules = {\n${entries}\n};`,
              loader: 'js',
            }
          }

          case 'virtual:prev-previews': {
            const units = await scanPreviewUnits(rootDir)
            return {
              contents: `
export const previewUnits = ${JSON.stringify(units)};
export function getByType(type) { return previewUnits.filter(u => u.type === type); }
export function getByTags(tags) { return previewUnits.filter(u => u.config?.tags?.some(t => tags.includes(t))); }
export function getByCategory(category) { return previewUnits.filter(u => u.config?.category === category); }
export function getByStatus(status) { return previewUnits.filter(u => u.config?.status === status); }
`,
              loader: 'js',
            }
          }

          case 'virtual:prev-tokens': {
            const userTokensPath = path.join(rootDir, 'previews/tokens.yaml')
            const tokensOptions = existsSync(userTokensPath) ? { userTokensPath } : {}
            const tokens = resolveTokens(tokensOptions)
            return {
              contents: `export const tokens = ${JSON.stringify(tokens)};`,
              loader: 'js',
            }
          }

          default:
            return undefined
        }
      })
    },
  }
}
