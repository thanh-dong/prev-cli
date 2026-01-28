// src/tokens/utils.test.ts
import { describe, test, expect } from 'bun:test'
import { deepMerge, levenshtein } from './utils'

describe('deepMerge', () => {
  test('merges simple objects', () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: 3, c: 4 })
  })

  test('does not mutate original objects', () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3 }
    deepMerge(target, source)
    expect(target).toEqual({ a: 1, b: 2 })
    expect(source).toEqual({ b: 3 })
  })

  test('deep merges nested objects', () => {
    const target = { a: { x: 1, y: 2 }, b: 3 }
    const source = { a: { y: 5, z: 6 } }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: { x: 1, y: 5, z: 6 }, b: 3 })
  })

  test('removes keys when source value is null', () => {
    const target = { a: 1, b: 2, c: 3 }
    const source = { b: null }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, c: 3 })
    expect('b' in result).toBe(false)
  })

  test('removes nested keys when source value is null', () => {
    const target = { a: { x: 1, y: 2 } }
    const source = { a: { x: null } }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: { y: 2 } })
    expect('x' in (result.a as Record<string, unknown>)).toBe(false)
  })

  test('replaces arrays entirely (no merge)', () => {
    const target = { arr: [1, 2, 3] }
    const source = { arr: [4, 5] }
    const result = deepMerge(target, source)
    expect(result).toEqual({ arr: [4, 5] })
  })

  test('handles deeply nested objects', () => {
    const target = {
      level1: {
        level2: {
          level3: { a: 1, b: 2 }
        }
      }
    }
    const source = {
      level1: {
        level2: {
          level3: { b: 3, c: 4 }
        }
      }
    }
    const result = deepMerge(target, source)
    expect(result).toEqual({
      level1: {
        level2: {
          level3: { a: 1, b: 3, c: 4 }
        }
      }
    })
  })

  test('handles empty source', () => {
    const target = { a: 1, b: 2 }
    const result = deepMerge(target, {})
    expect(result).toEqual({ a: 1, b: 2 })
  })

  test('handles empty target', () => {
    const target = {}
    const source = { a: 1, b: 2 }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: 2 })
  })

  test('primitive in source replaces object in target', () => {
    const target = { a: { nested: 1 } }
    const source = { a: 'string' }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 'string' })
  })

  test('object in source replaces primitive in target', () => {
    const target = { a: 'string' }
    const source = { a: { nested: 1 } }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: { nested: 1 } })
  })

  test('handles string values', () => {
    const target = { color: '#ffffff' }
    const source = { color: '#000000' }
    const result = deepMerge(target, source)
    expect(result).toEqual({ color: '#000000' })
  })

  test('handles number values', () => {
    const target = { weight: 400 }
    const source = { weight: 700 }
    const result = deepMerge(target, source)
    expect(result).toEqual({ weight: 700 })
  })

  test('ignores __proto__ key to prevent prototype pollution', () => {
    const target = { a: 1 }
    const source = { __proto__: { polluted: true }, b: 2 }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: 2 })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  test('ignores constructor key to prevent prototype pollution', () => {
    const target = { a: 1 }
    const source = { constructor: { polluted: true }, b: 2 }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: 2 })
    expect('constructor' in result && result.constructor === Object).toBe(true)
  })

  test('ignores prototype key to prevent prototype pollution', () => {
    const target = { a: 1 }
    const source = { prototype: { polluted: true }, b: 2 }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: 2 })
    expect('prototype' in result).toBe(false)
  })
})

describe('levenshtein', () => {
  test('returns 0 for identical strings', () => {
    expect(levenshtein('hello', 'hello')).toBe(0)
    expect(levenshtein('', '')).toBe(0)
  })

  test('returns length of other string when one is empty', () => {
    expect(levenshtein('', 'hello')).toBe(5)
    expect(levenshtein('hello', '')).toBe(5)
  })

  test('calculates single character difference', () => {
    expect(levenshtein('cat', 'bat')).toBe(1)  // substitution
    expect(levenshtein('cat', 'cats')).toBe(1) // insertion
    expect(levenshtein('cats', 'cat')).toBe(1) // deletion
  })

  test('calculates multiple character differences', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('primary', 'primar')).toBe(1)
    expect(levenshtein('lg', 'lrg')).toBe(1)
  })

  test('handles completely different strings', () => {
    expect(levenshtein('abc', 'xyz')).toBe(3)
  })

  test('is symmetric', () => {
    expect(levenshtein('hello', 'hallo')).toBe(levenshtein('hallo', 'hello'))
  })
})
