// test/utils.ts - Shared test utilities for temp directory management
import { beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { dirname, join } from 'path'

/**
 * Create a unique temporary directory
 */
export async function createTempDir(prefix = 'prev-cli-test-'): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix))
}

/**
 * Remove a temporary directory recursively
 * Safe to call with undefined or already-removed directories
 */
export async function cleanupTempDir(dir: string | undefined): Promise<void> {
  if (!dir) return
  await rm(dir, { recursive: true, force: true })
}

/**
 * Hook for per-suite temp directory lifecycle
 * Returns a getter function that returns the temp dir path
 *
 * Usage:
 *   const getTempDir = useTempDirPerSuite('my-prefix-')
 *   beforeAll(() => { ... setup using getTempDir() ... })
 *   test('...', () => { const dir = getTempDir() })
 */
export function useTempDirPerSuite(prefix = 'prev-cli-test-'): () => string {
  let dir: string | undefined

  beforeAll(async () => {
    dir = await createTempDir(prefix)
  })

  afterAll(async () => {
    await cleanupTempDir(dir)
  })

  return () => {
    if (!dir) throw new Error('Temp dir not initialized - ensure beforeAll has run')
    return dir
  }
}

/**
 * Hook for per-test temp directory lifecycle
 * Each test gets a fresh directory that is cleaned up after
 *
 * Usage:
 *   const getTempDir = useTempDirPerTest('my-prefix-')
 *   test('...', () => { const dir = getTempDir() })
 */
export function useTempDirPerTest(prefix = 'prev-cli-test-'): () => string {
  let dir: string | undefined

  beforeEach(async () => {
    dir = await createTempDir(prefix)
  })

  afterEach(async () => {
    await cleanupTempDir(dir)
    dir = undefined
  })

  return () => {
    if (!dir) throw new Error('Temp dir not initialized - ensure beforeEach has run')
    return dir
  }
}

/**
 * Write multiple files to a directory from a path->content map
 * Creates parent directories automatically
 *
 * Usage:
 *   await writeFiles(dir, {
 *     'config.yaml': 'title: Test',
 *     'src/index.ts': 'export default {}',
 *   })
 */
export async function writeFiles(
  root: string,
  files: Record<string, string>
): Promise<void> {
  for (const [relativePath, contents] of Object.entries(files)) {
    const target = join(root, relativePath)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, contents)
  }
}
