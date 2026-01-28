// src/tokens/utils.ts
// Deep merge utility for token resolution

/**
 * Check if a value is a plain object (not null, array, or other type)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Deep merge two objects, with source values taking precedence.
 * - Nested objects are merged recursively
 * - null values in source remove the key from result
 * - Arrays and primitives are replaced entirely
 */
// Keys that could be exploited for prototype pollution
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype']

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T> | Record<string, unknown>
): T {
  const result = { ...target } as Record<string, unknown>

  for (const key of Object.keys(source)) {
    // Skip dangerous keys to prevent prototype pollution
    if (DANGEROUS_KEYS.includes(key)) {
      continue
    }

    const sourceValue = (source as Record<string, unknown>)[key]
    const targetValue = result[key]

    // null means "remove this key"
    if (sourceValue === null) {
      delete result[key]
      continue
    }

    // Both are plain objects - recurse
    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      )
      continue
    }

    // Otherwise, source value wins (primitives, arrays, or new keys)
    result[key] = sourceValue
  }

  return result as T
}

/**
 * Type-safe deep merge for token configurations.
 * This is a specialized version of deepMerge that handles TokensConfig type properly.
 */
export function mergeTokenConfigs<T>(target: T, source: unknown): T {
  if (!isPlainObject(source)) {
    return target
  }
  return deepMerge(target as Record<string, unknown>, source) as T
}

/**
 * Calculate the Levenshtein distance between two strings.
 * Used for "did you mean?" suggestions in validation errors.
 *
 * @param a - First string
 * @param b - Second string
 * @returns The edit distance between the strings
 */
export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}
