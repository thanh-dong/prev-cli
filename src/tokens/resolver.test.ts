// src/tokens/resolver.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { resolveTokens, loadTokens, resolveProjectTokens } from './resolver'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'

// Test fixtures directory
const TEST_FIXTURES_DIR = join(import.meta.dir, '__test_fixtures__')

beforeAll(() => {
  mkdirSync(TEST_FIXTURES_DIR, { recursive: true })
})

afterAll(() => {
  rmSync(TEST_FIXTURES_DIR, { recursive: true, force: true })
})

describe('loadTokens', () => {
  test('parses YAML file and returns typed tokens', () => {
    const tokens = loadTokens(import.meta.dir + '/defaults.yaml')
    expect(tokens.colors.primary).toBe('#2563eb')
    expect(tokens.spacing.md).toBe('16px')
  })

  test('throws error for non-existent file', () => {
    expect(() => loadTokens('/nonexistent/path.yaml')).toThrow()
  })

  test('throws error for invalid YAML syntax', () => {
    const invalidYamlPath = join(TEST_FIXTURES_DIR, 'invalid-syntax.yaml')
    writeFileSync(invalidYamlPath, '{ invalid yaml: [unclosed')
    expect(() => loadTokens(invalidYamlPath)).toThrow()
  })

  test('throws error for YAML that is not an object', () => {
    const scalarYamlPath = join(TEST_FIXTURES_DIR, 'scalar.yaml')
    writeFileSync(scalarYamlPath, 'just a string')
    expect(() => loadTokens(scalarYamlPath)).toThrow('must contain a YAML object')
  })

  test('throws error for YAML missing required keys', () => {
    const incompleteYamlPath = join(TEST_FIXTURES_DIR, 'incomplete.yaml')
    writeFileSync(incompleteYamlPath, 'colors:\n  primary: "#000"')
    expect(() => loadTokens(incompleteYamlPath)).toThrow('missing required key')
  })

  test('throws error for YAML with invalid typography structure', () => {
    const badTypoPath = join(TEST_FIXTURES_DIR, 'bad-typography.yaml')
    writeFileSync(badTypoPath, `
colors:
  primary: "#000"
backgrounds:
  background: "#fff"
spacing:
  md: "16px"
typography:
  sizes: {}
radius:
  md: "8px"
shadows:
  sm: "0 1px 2px black"
`)
    expect(() => loadTokens(badTypoPath)).toThrow('typography must have "sizes" and "weights"')
  })
})

describe('resolveTokens', () => {
  test('returns defaults when no user overrides', () => {
    const result = resolveTokens({})
    expect(result.colors.primary).toBe('#2563eb')
    expect(result.backgrounds.background).toBe('#ffffff')
  })

  test('merges user token overrides', () => {
    const result = resolveTokens({
      userTokens: { colors: { primary: '#ff6600' } }
    })
    expect(result.colors.primary).toBe('#ff6600')
    expect(result.colors.secondary).toBe('#64748b') // default preserved
  })

  test('deep merges nested objects like typography', () => {
    const result = resolveTokens({
      userTokens: { typography: { sizes: { '3xl': '32px' } } }
    })
    expect(result.typography.sizes['3xl']).toBe('32px')
    expect(result.typography.sizes.base).toBe('16px') // default preserved
  })

  test('user can add new token values', () => {
    const result = resolveTokens({
      userTokens: { colors: { success: '#22c55e' } }
    })
    expect(result.colors.success).toBe('#22c55e')
    expect(result.colors.primary).toBe('#2563eb')
  })

  test('user can remove token by setting null', () => {
    const result = resolveTokens({
      userTokens: { colors: { accent: null } }
    })
    expect(result.colors.accent).toBeUndefined()
  })

  test('loads from user file path when provided', () => {
    // Create a valid user tokens file
    const userTokensPath = join(TEST_FIXTURES_DIR, 'user-tokens.yaml')
    writeFileSync(userTokensPath, `
colors:
  primary: "#ff0000"
  secondary: "#64748b"
backgrounds:
  background: "#ffffff"
spacing:
  md: "16px"
  huge: "100px"
typography:
  sizes:
    base: "16px"
  weights:
    normal: 400
radius:
  md: "8px"
shadows:
  sm: "0 1px 2px black"
`)
    const result = resolveTokens({ userTokensPath })
    expect(result.spacing.huge).toBe('100px')
    expect(result.colors.primary).toBe('#ff0000')
  })

  test('ignores non-existent user file path and uses defaults', () => {
    const result = resolveTokens({ userTokensPath: '/nonexistent/tokens.yaml' })
    // Should use defaults without throwing
    expect(result.colors.primary).toBe('#2563eb')
  })

  test('throws for user file with invalid content (not ENOENT)', () => {
    const invalidPath = join(TEST_FIXTURES_DIR, 'invalid-user.yaml')
    writeFileSync(invalidPath, 'just a string')
    expect(() => resolveTokens({ userTokensPath: invalidPath })).toThrow('must contain a YAML object')
  })

  test('preserves all default token categories', () => {
    const result = resolveTokens({})
    expect(result).toHaveProperty('colors')
    expect(result).toHaveProperty('backgrounds')
    expect(result).toHaveProperty('spacing')
    expect(result).toHaveProperty('typography')
    expect(result).toHaveProperty('radius')
    expect(result).toHaveProperty('shadows')
  })

  test('can override multiple nested levels', () => {
    const result = resolveTokens({
      userTokens: {
        typography: {
          sizes: { base: '18px' },
          weights: { bold: 800 }
        }
      }
    })
    expect(result.typography.sizes.base).toBe('18px')
    expect(result.typography.sizes.sm).toBe('14px') // default preserved
    expect(result.typography.weights.bold).toBe(800)
    expect(result.typography.weights.normal).toBe(400) // default preserved
  })

  test('handles empty userTokens gracefully', () => {
    const result = resolveTokens({ userTokens: {} })
    expect(result.colors.primary).toBe('#2563eb')
  })

  test('can override shadow values', () => {
    const result = resolveTokens({
      userTokens: { shadows: { md: '0 2px 4px rgba(0,0,0,0.1)' } }
    })
    expect(result.shadows.md).toBe('0 2px 4px rgba(0,0,0,0.1)')
    expect(result.shadows.sm).toBe('0 1px 2px 0 rgb(0 0 0 / 0.05)') // default preserved
  })
})

describe('resolveProjectTokens', () => {
  test('resolves tokens from project directory with tokens.yaml', () => {
    // Create a project directory with tokens.yaml
    const projectDir = join(TEST_FIXTURES_DIR, 'test-project')
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(join(projectDir, 'tokens.yaml'), `
colors:
  primary: "#123456"
  secondary: "#654321"
backgrounds:
  background: "#fafafa"
spacing:
  md: "20px"
typography:
  sizes:
    base: "18px"
  weights:
    normal: 400
radius:
  md: "12px"
shadows:
  sm: "0 2px 4px black"
`)
    const result = resolveProjectTokens(projectDir)
    expect(result.colors.primary).toBe('#123456')
    expect(result.spacing.md).toBe('20px')
  })

  test('returns defaults when project has no tokens.yaml', () => {
    // Create empty project directory
    const emptyProjectDir = join(TEST_FIXTURES_DIR, 'empty-project')
    mkdirSync(emptyProjectDir, { recursive: true })

    const result = resolveProjectTokens(emptyProjectDir)
    // Should use defaults
    expect(result.colors.primary).toBe('#2563eb')
  })

  test('throws for project with invalid tokens.yaml', () => {
    // Create project with invalid tokens file
    const badProjectDir = join(TEST_FIXTURES_DIR, 'bad-project')
    mkdirSync(badProjectDir, { recursive: true })
    writeFileSync(join(badProjectDir, 'tokens.yaml'), 'not: valid: yaml: [')

    expect(() => resolveProjectTokens(badProjectDir)).toThrow()
  })
})
