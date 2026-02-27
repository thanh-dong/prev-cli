// src/content/config-parser.test.ts
import { test, expect, beforeAll } from 'bun:test'
import { join } from 'path'
import { parsePreviewConfig, parseFlowDefinition, parseAtlasDefinition } from './config-parser'
import { useTempDirPerSuite, writeFiles } from '../../test/utils'

const getTempDir = useTempDirPerSuite('prev-config-parser-test-')

beforeAll(async () => {
  await writeFiles(getTempDir(), {
    'valid.yaml': 'tags: [core]\ncategory: inputs\nstatus: stable\ntitle: Button',
    'invalid.yaml': 'status: unknown',
    'flow.yaml': 'name: Onboarding\nsteps:\n  - screen: login\n  - screen: dashboard',
    'atlas.yaml': 'name: App\nhierarchy:\n  root: home\n  areas:\n    home:\n      title: Home',
  })
})

test('parsePreviewConfig parses valid config', async () => {
  const result = await parsePreviewConfig(join(getTempDir(), 'valid.yaml'))
  expect(result.errors).toHaveLength(0)
  expect(result.data?.tags).toEqual(['core'])
  expect(result.data?.status).toBe('stable')
})

test('parsePreviewConfig returns errors for invalid or missing files', async () => {
  const invalid = await parsePreviewConfig(join(getTempDir(), 'invalid.yaml'))
  expect(invalid.errors.length).toBeGreaterThan(0)

  const missing = await parsePreviewConfig(join(getTempDir(), 'nonexistent.yaml'))
  expect(missing.errors.length).toBeGreaterThan(0)
})

test('parseFlowDefinition parses flow config', async () => {
  const flow = await parseFlowDefinition(join(getTempDir(), 'flow.yaml'))
  expect(flow?.name).toBe('Onboarding')
  expect(flow?.steps).toHaveLength(2)
})

test('parseAtlasDefinition parses atlas config', async () => {
  const atlas = await parseAtlasDefinition(join(getTempDir(), 'atlas.yaml'))
  expect(atlas?.name).toBe('App')
  expect(atlas?.hierarchy.root).toBe('home')
})
