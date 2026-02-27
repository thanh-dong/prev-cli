// Route handler: /_prev/tokens.json - Serves design tokens
import path from 'path'
import { existsSync } from 'fs'
import { resolveTokens } from '../../tokens/resolver'

export function createTokensHandler(rootDir: string) {
  let cachedTokens: ReturnType<typeof resolveTokens> | null = null

  return async (req: Request): Promise<Response | null> => {
    const url = new URL(req.url)
    if (url.pathname !== '/_prev/tokens.json') return null

    try {
      if (!cachedTokens) {
        const userTokensPath = path.join(rootDir, 'previews/tokens.yaml')
        const options = existsSync(userTokensPath) ? { userTokensPath } : {}
        cachedTokens = resolveTokens(options)
      }

      return Response.json(cachedTokens, {
        headers: { 'Cache-Control': 'no-cache' },
      })
    } catch (err) {
      console.error('Error serving tokens:', err)
      return Response.json({ error: String(err) }, { status: 500 })
    }
  }
}
