import { test, expect } from 'bun:test'
import { buildOptimizedPreview } from './build-optimized'
import type { PreviewConfig } from './types'

// Tailwind CLI can be slow on first run
const TAILWIND_TIMEOUT = 30000

test('buildOptimizedPreview generates HTML with local vendor imports', async () => {
  const config: PreviewConfig = {
    files: [
      {
        path: 'index.tsx',
        content: `export default function App() { return <div className="p-4">Hello</div> }`,
        type: 'tsx',
      },
    ],
    entry: 'index.tsx',
    tailwind: true,
  }

  const result = await buildOptimizedPreview(config, { vendorPath: '../_vendors/runtime.js' })

  expect(result.success).toBe(true)
  expect(result.html).toContain('../_vendors/runtime.js')
  expect(result.html).not.toContain('esm.sh')
  expect(result.html).not.toContain('tailwindcss/browser')
}, TAILWIND_TIMEOUT)

test('buildOptimizedPreview includes compiled CSS', async () => {
  const config: PreviewConfig = {
    files: [
      {
        path: 'index.tsx',
        content: `export default function App() { return <div className="flex items-center bg-red-500">Hello</div> }`,
        type: 'tsx',
      },
    ],
    entry: 'index.tsx',
    tailwind: true,
  }

  const result = await buildOptimizedPreview(config, { vendorPath: '../_vendors/runtime.js' })

  expect(result.success).toBe(true)
  expect(result.css).toContain('flex')
  expect(result.css).toContain('bg-red-500')
}, TAILWIND_TIMEOUT)
