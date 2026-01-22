import { test, expect } from 'bun:test'
import { buildVendorBundle } from './vendors'

test('buildVendorBundle creates runtime.js with React', async () => {
  const result = await buildVendorBundle()
  expect(result.success).toBe(true)
  expect(result.code).toBeDefined()
  expect(result.code).toContain('createElement')
  expect(result.code).toContain('createRoot')
})

test('buildVendorBundle output is valid ESM', async () => {
  const result = await buildVendorBundle()
  expect(result.code).toContain('export')
})
