// src/tokens/validation.test.ts
import { describe, test, expect } from 'bun:test'
import { validateToken, ValidationError, isValidToken } from './validation'

describe('validateToken', () => {
  // Colors
  test('valid color token passes', () => {
    expect(() => validateToken('colors', 'primary')).not.toThrow()
    expect(() => validateToken('colors', 'destructive')).not.toThrow()
  })

  test('invalid color token throws ValidationError', () => {
    expect(() => validateToken('colors', 'purpl')).toThrow(ValidationError)
  })

  test('error includes "did you mean" suggestions for close matches', () => {
    try {
      validateToken('colors', 'primar')
      throw new Error('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
      expect((e as Error).message).toContain("Unknown color 'primar'")
      expect((e as Error).message).toContain('Did you mean')
      expect((e as Error).message).toContain('primary')
    }
  })

  test('error lists available tokens when no close matches', () => {
    try {
      validateToken('colors', 'xyz')
      throw new Error('Should have thrown')
    } catch (e) {
      expect((e as Error).message).toContain('Available colors:')
      expect((e as Error).message).toContain('primary')
      expect((e as Error).message).toContain('secondary')
    }
  })

  // Spacing
  test('valid spacing token passes', () => {
    expect(() => validateToken('spacing', 'lg')).not.toThrow()
    expect(() => validateToken('spacing', 'md')).not.toThrow()
  })

  test('invalid spacing throws with suggestions', () => {
    try {
      validateToken('spacing', 'lrg')
      throw new Error('Should have thrown')
    } catch (e) {
      expect((e as Error).message).toContain('lg') // suggests 'lg'
    }
  })

  // Typography
  test('validates nested typography.sizes', () => {
    expect(() => validateToken('typography.sizes', 'base')).not.toThrow()
    expect(() => validateToken('typography.sizes', 'huge')).toThrow(ValidationError)
  })

  test('validates nested typography.weights', () => {
    expect(() => validateToken('typography.weights', 'bold')).not.toThrow()
    expect(() => validateToken('typography.weights', 'thin')).toThrow(ValidationError)
  })

  // Backgrounds
  test('validates background tokens', () => {
    expect(() => validateToken('backgrounds', 'muted')).not.toThrow()
    expect(() => validateToken('backgrounds', 'dark')).toThrow(ValidationError)
  })

  // Radius
  test('validates radius tokens', () => {
    expect(() => validateToken('radius', 'full')).not.toThrow()
    expect(() => validateToken('radius', 'round')).toThrow(ValidationError)
  })

  // Shadows
  test('validates shadow tokens', () => {
    expect(() => validateToken('shadows', 'xl')).not.toThrow()
    expect(() => validateToken('shadows', 'huge')).toThrow(ValidationError)
  })

  // Edge cases
  test('invalid category throws', () => {
    expect(() => validateToken('invalid' as any, 'foo')).toThrow(/Unknown category/)
  })

  test('empty token name throws', () => {
    expect(() => validateToken('colors', '')).toThrow(/Token name cannot be empty/)
  })

  test('whitespace-only token name throws', () => {
    expect(() => validateToken('colors', '   ')).toThrow(/Token name cannot be empty/)
  })
})

describe('isValidToken', () => {
  test('returns true for valid token', () => {
    expect(isValidToken('colors', 'primary')).toBe(true)
  })

  test('returns false for invalid token', () => {
    expect(isValidToken('colors', 'invalid')).toBe(false)
  })

  test('throws for invalid category', () => {
    expect(() => isValidToken('invalid' as any, 'foo')).toThrow(/Unknown category/)
  })

  test('works with nested categories', () => {
    expect(isValidToken('typography.sizes', 'base')).toBe(true)
    expect(isValidToken('typography.sizes', 'huge')).toBe(false)
  })

  test('throws for empty token name', () => {
    expect(() => isValidToken('colors', '')).toThrow(/Token name cannot be empty/)
  })
})
