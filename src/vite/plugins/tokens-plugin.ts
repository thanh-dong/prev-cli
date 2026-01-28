// src/vite/plugins/tokens-plugin.ts
import type { Plugin } from 'vite'
import path from 'path'
import { existsSync } from 'fs'
import { resolveTokens } from '../../tokens/resolver'

const VIRTUAL_MODULE_ID = 'virtual:prev-tokens'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export function tokensPlugin(rootDir: string): Plugin {
  let cachedTokens: ReturnType<typeof resolveTokens> | null = null

  function getTokens() {
    if (!cachedTokens) {
      // Check for user tokens file
      const userTokensPath = path.join(rootDir, 'previews/tokens.yaml')
      const options = existsSync(userTokensPath) ? { userTokensPath } : {}
      cachedTokens = resolveTokens(options)
    }
    return cachedTokens
  }

  return {
    name: 'prev-tokens',

    // Serve resolved tokens as JSON for browser preview runtime
    configureServer(server) {
      server.middlewares.use('/_prev/tokens.json', (req, res, next) => {
        if (req.method !== 'GET') return next()

        try {
          const tokens = getTokens()
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(JSON.stringify(tokens))
        } catch (err) {
          console.error('Error serving tokens:', err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const tokens = getTokens()
        return `export const tokens = ${JSON.stringify(tokens, null, 2)};`
      }
    },

    handleHotUpdate({ file, server }) {
      // Invalidate cache when tokens.yaml changes
      if (file.endsWith('tokens.yaml')) {
        cachedTokens = null

        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          return [mod]
        }
      }
    },
  }
}
