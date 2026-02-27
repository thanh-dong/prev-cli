// src/server/start.ts
// Server entry point: dev, build, preview
import { startDevServer } from './dev'
import { buildProductionSite } from './build'
import { startPreviewServer } from './preview'
import { getRandomPort } from '../utils/port'
import { exec } from 'child_process'

export interface DevOptions {
  port?: number
  include?: string[]
  debug?: boolean
}

export interface BuildOptions {
  include?: string[]
  base?: string
  debug?: boolean
}

function printWelcome(type: 'dev' | 'preview') {
  console.log()
  console.log('  ✨ prev')
  console.log()
  if (type === 'dev') {
    console.log('  Your docs are ready! Open in your browser:')
  } else {
    console.log('  Previewing your production build:')
  }
}

function printShortcuts() {
  console.log()
  console.log('  Shortcuts:')
  console.log('    o  →  open in browser')
  console.log('    h  →  show this help')
  console.log('    q  →  quit')
  console.log()
}

function printReady() {
  console.log()
  console.log('  Edit your .md/.mdx files and see changes instantly.')
  console.log('  Press h for shortcuts.')
  console.log()
}

function openBrowser(url: string) {
  const platform = process.platform
  const cmd = platform === 'darwin' ? 'open' :
              platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} ${url}`)
  console.log(`  ↗ Opened ${url}`)
}

function setupKeyboardShortcuts(url: string, quit: () => void): () => void {
  if (!process.stdin.isTTY) return () => {}

  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')

  const handler = (key: string) => {
    switch (key.toLowerCase()) {
      case 'o':
        openBrowser(url)
        break
      case 'h':
        printShortcuts()
        break
      case 'q':
      case '\u0003': // Ctrl+C
        quit()
        break
    }
  }

  process.stdin.on('data', handler)

  return () => {
    process.stdin.off('data', handler)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false)
    }
    process.stdin.pause()
  }
}

export async function startDev(rootDir: string, options: DevOptions = {}) {
  const port = options.port ?? await getRandomPort()

  const { server, url, stop } = await startDevServer({
    rootDir,
    port,
    include: options.include,
  })

  printWelcome('dev')
  console.log(`  ➜  Local:   ${url}`)
  printReady()

  let isShuttingDown = false
  let cleanupStdin: () => void = () => {}

  const shutdown = async (signal?: string) => {
    if (isShuttingDown) return
    isShuttingDown = true

    if (signal) {
      console.log(`\n  Received ${signal}, shutting down...`)
    } else {
      console.log('\n  Shutting down...')
    }

    cleanupStdin()
    stop()
    process.exit(0)
  }

  cleanupStdin = setupKeyboardShortcuts(url, () => shutdown())

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('uncaughtException', (err) => {
    console.error('\n  Uncaught exception:', err.message)
    shutdown('uncaughtException')
  })

  return server
}

export async function buildSite(rootDir: string, options: BuildOptions = {}) {
  console.log()
  console.log('  ✨ prev build')
  console.log()
  console.log('  Building your documentation site...')

  await buildProductionSite({
    rootDir,
    include: options.include,
    base: options.base,
  })

  console.log()
  console.log('  Done! Your site is ready in ./dist')
  console.log('  You can deploy this folder anywhere.')
  console.log()
}

export async function previewSite(rootDir: string, options: DevOptions = {}) {
  const port = options.port ?? await getRandomPort()

  const { url, stop } = await startPreviewServer({ rootDir, port })

  printWelcome('preview')
  console.log(`  ➜  Local:   ${url}`)
  console.log()
  console.log('  Press Ctrl+C to stop.')
  console.log()

  return { url, stop }
}
