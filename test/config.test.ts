import { test, expect } from 'bun:test'
import { loadConfig, saveConfig } from '../src/config'
import { useTempDirPerTest, writeFiles } from './utils'

const getTempDir = useTempDirPerTest('prev-config-test-')

test('loadConfig returns defaults when no file exists', () => {
  const tmpDir = getTempDir()
  const config = loadConfig(tmpDir)

  expect(config.theme).toBe('system')
  expect(config.contentWidth).toBe('constrained')
  expect(config.hidden).toEqual([])
  expect(config.order).toEqual({})
})

test('loadConfig parses .prev.yaml correctly', async () => {
  const tmpDir = getTempDir()
  await writeFiles(tmpDir, {
    '.prev.yaml': `
theme: dark
contentWidth: full
hidden:
  - "drafts/**"
  - "internal/*.md"
order:
  "/":
    - intro.md
    - guides/
`
  })

  const config = loadConfig(tmpDir)

  expect(config.theme).toBe('dark')
  expect(config.contentWidth).toBe('full')
  expect(config.hidden).toEqual(['drafts/**', 'internal/*.md'])
  expect(config.order['/']).toEqual(['intro.md', 'guides/'])
})

test('saveConfig writes valid YAML', () => {
  const tmpDir = getTempDir()

  saveConfig(tmpDir, {
    theme: 'light',
    contentWidth: 'constrained',
    hidden: ['test.md'],
    order: { '/': ['a.md', 'b.md'] }
  })

  const reloaded = loadConfig(tmpDir)
  expect(reloaded.theme).toBe('light')
  expect(reloaded.hidden).toEqual(['test.md'])
})
