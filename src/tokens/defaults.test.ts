// src/tokens/defaults.test.ts
import { describe, test, expect, beforeAll } from 'bun:test'
import { load as parse } from 'js-yaml'
import { readFileSync } from 'fs'
import { join } from 'path'

interface TokensConfig {
  colors: Record<string, string>
  backgrounds: Record<string, string>
  spacing: Record<string, string>
  typography: {
    sizes: Record<string, string>
    weights: Record<string, number>
  }
  radius: Record<string, string>
  shadows: Record<string, string>
}

describe('defaults.yaml', () => {
  let tokens: TokensConfig

  beforeAll(() => {
    const content = readFileSync(join(import.meta.dir, 'defaults.yaml'), 'utf-8')
    tokens = parse(content) as TokensConfig
  })

  test('is valid YAML', () => {
    const content = readFileSync(join(import.meta.dir, 'defaults.yaml'), 'utf-8')
    expect(() => parse(content)).not.toThrow()
  })

  test('has all shadcn color tokens', () => {
    expect(tokens.colors).toHaveProperty('primary')
    expect(tokens.colors).toHaveProperty('secondary')
    expect(tokens.colors).toHaveProperty('muted-foreground')
    expect(tokens.colors).toHaveProperty('destructive')
  })

  test('has spacing scale', () => {
    expect(Object.keys(tokens.spacing)).toEqual(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'])
  })

  test('spacing values match Tailwind scale', () => {
    expect(tokens.spacing.none).toBe('0')
    expect(tokens.spacing.xs).toBe('4px')
    expect(tokens.spacing.sm).toBe('8px')
    expect(tokens.spacing.md).toBe('16px')
    expect(tokens.spacing.lg).toBe('24px')
    expect(tokens.spacing.xl).toBe('32px')
    expect(tokens.spacing['2xl']).toBe('48px')
  })

  test('has all shadcn foreground tokens', () => {
    expect(tokens.colors).toHaveProperty('foreground')
    expect(tokens.colors).toHaveProperty('card-foreground')
    expect(tokens.colors).toHaveProperty('primary-foreground')
    expect(tokens.colors).toHaveProperty('secondary-foreground')
    expect(tokens.colors).toHaveProperty('accent-foreground')
    expect(tokens.colors).toHaveProperty('destructive-foreground')
    expect(tokens.colors).toHaveProperty('popover-foreground')
  })

  test('has border and ring tokens', () => {
    expect(tokens.colors).toHaveProperty('border')
    expect(tokens.colors).toHaveProperty('ring')
  })

  test('primary color is blue', () => {
    expect(tokens.colors.primary).toBe('#2563eb')
  })

  test('destructive color is red', () => {
    expect(tokens.colors.destructive).toBe('#ef4444')
  })

  test('has typography sizes', () => {
    expect(Object.keys(tokens.typography.sizes)).toEqual(['xs', 'sm', 'base', 'lg', 'xl', '2xl'])
  })

  test('typography size values are correct', () => {
    expect(tokens.typography.sizes.xs).toBe('12px')
    expect(tokens.typography.sizes.sm).toBe('14px')
    expect(tokens.typography.sizes.base).toBe('16px')
    expect(tokens.typography.sizes.lg).toBe('18px')
    expect(tokens.typography.sizes.xl).toBe('20px')
    expect(tokens.typography.sizes['2xl']).toBe('24px')
  })

  test('has typography weights', () => {
    expect(Object.keys(tokens.typography.weights)).toEqual(['normal', 'medium', 'semibold', 'bold'])
  })

  test('typography weight values are correct', () => {
    expect(tokens.typography.weights.normal).toBe(400)
    expect(tokens.typography.weights.medium).toBe(500)
    expect(tokens.typography.weights.semibold).toBe(600)
    expect(tokens.typography.weights.bold).toBe(700)
  })

  test('has radius scale', () => {
    expect(Object.keys(tokens.radius)).toEqual(['none', 'sm', 'md', 'lg', 'xl', 'full'])
  })

  test('radius values are correct', () => {
    expect(tokens.radius.none).toBe('0')
    expect(tokens.radius.sm).toBe('4px')
    expect(tokens.radius.md).toBe('6px')
    expect(tokens.radius.lg).toBe('8px')
    expect(tokens.radius.xl).toBe('12px')
    expect(tokens.radius.full).toBe('9999px')
  })

  test('has shadow scale', () => {
    expect(Object.keys(tokens.shadows)).toEqual(['none', 'sm', 'md', 'lg', 'xl'])
  })

  test('has background tokens', () => {
    expect(tokens.backgrounds).toHaveProperty('transparent')
    expect(tokens.backgrounds).toHaveProperty('background')
    expect(tokens.backgrounds).toHaveProperty('card')
    expect(tokens.backgrounds).toHaveProperty('primary')
    expect(tokens.backgrounds).toHaveProperty('secondary')
    expect(tokens.backgrounds).toHaveProperty('muted')
    expect(tokens.backgrounds).toHaveProperty('accent')
    expect(tokens.backgrounds).toHaveProperty('destructive')
    expect(tokens.backgrounds).toHaveProperty('input')
    expect(tokens.backgrounds).toHaveProperty('popover')
  })

  test('background values are correct', () => {
    expect(tokens.backgrounds.transparent).toBe('transparent')
    expect(tokens.backgrounds.background).toBe('#ffffff')
    expect(tokens.backgrounds.card).toBe('#ffffff')
    expect(tokens.backgrounds.popover).toBe('#ffffff')
    expect(tokens.backgrounds.primary).toBe('#2563eb')
  })
})
