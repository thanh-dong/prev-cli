// src/tokens/validation.ts
// Token validation with helpful "did you mean?" suggestions

import { resolveTokens, type TokensConfig } from './resolver'
import { levenshtein } from './utils'

/**
 * Error thrown when a token validation fails.
 * Includes helpful suggestions for similar valid tokens.
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly category: string,
    public readonly invalidToken: string,
    public readonly suggestions: string[]
  ) {
    super(message)
    this.name = 'ValidationError'
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Valid category names that can be used with validateToken.
 * Supports dot notation for nested categories like "typography.sizes"
 */
export type TokenCategory =
  | 'colors'
  | 'backgrounds'
  | 'spacing'
  | 'typography.sizes'
  | 'typography.weights'
  | 'radius'
  | 'shadows'

/**
 * Get a human-readable singular name for a category
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'colors': 'color',
    'backgrounds': 'background',
    'spacing': 'spacing',
    'typography.sizes': 'typography size',
    'typography.weights': 'typography weight',
    'radius': 'radius',
    'shadows': 'shadow'
  }
  return labels[category] || category
}

/**
 * Get a human-readable plural name for a category
 */
function getCategoryPluralLabel(category: string): string {
  const labels: Record<string, string> = {
    'colors': 'colors',
    'backgrounds': 'backgrounds',
    'spacing': 'spacing values',
    'typography.sizes': 'typography sizes',
    'typography.weights': 'typography weights',
    'radius': 'radius values',
    'shadows': 'shadows'
  }
  return labels[category] || category
}

/**
 * Get available tokens for a given category from the resolved config.
 * Supports dot notation for nested paths like "typography.sizes"
 *
 * @param config - The resolved tokens configuration
 * @param category - The category path (e.g., "colors" or "typography.sizes")
 * @returns Array of valid token names, or null if category is invalid
 */
function getTokensForCategory(
  config: TokensConfig,
  category: string
): string[] | null {
  const parts = category.split('.')

  // Navigate to the nested object
  let current: unknown = config
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return null // Invalid path
    }
  }

  // Current should now be a Record<string, something>
  if (current && typeof current === 'object' && !Array.isArray(current)) {
    return Object.keys(current as Record<string, unknown>)
  }

  return null
}

/**
 * Find close matches for an invalid token using Levenshtein distance.
 * Returns tokens within distance 3 of the input, sorted by distance.
 *
 * @param input - The invalid token name
 * @param validTokens - Array of valid token names
 * @param maxDistance - Maximum edit distance for suggestions (default: 3)
 * @returns Array of close matches sorted by distance
 */
function findClosestMatches(
  input: string,
  validTokens: string[],
  maxDistance: number = 3
): string[] {
  const matches: Array<{ token: string; distance: number }> = []

  for (const token of validTokens) {
    const distance = levenshtein(input.toLowerCase(), token.toLowerCase())
    if (distance <= maxDistance) {
      matches.push({ token, distance })
    }
  }

  // Sort by distance (closest first)
  matches.sort((a, b) => a.distance - b.distance)

  return matches.slice(0, 3).map(m => m.token)
}

/**
 * Format error message with suggestions or available tokens.
 *
 * @param category - The token category
 * @param invalidToken - The invalid token name
 * @param suggestions - Close matches (if any)
 * @param availableTokens - All valid tokens for the category
 * @returns Formatted error message
 */
function formatErrorMessage(
  category: string,
  invalidToken: string,
  suggestions: string[],
  availableTokens: string[]
): string {
  const label = getCategoryLabel(category)
  const pluralLabel = getCategoryPluralLabel(category)

  const lines: string[] = [
    `Unknown ${label} '${invalidToken}'`
  ]

  if (suggestions.length > 0) {
    lines.push('')
    lines.push(`Did you mean: ${suggestions.join(', ')}?`)
  } else {
    lines.push('')
    const displayTokens = availableTokens.slice(0, 10)
    const suffix = availableTokens.length > 10 ? ` (and ${availableTokens.length - 10} more)` : ''
    lines.push(`Available ${pluralLabel}: ${displayTokens.join(', ')}${suffix}`)
  }

  return lines.join('\n')
}

/**
 * Validate that a token name is valid for a given category.
 * Throws a ValidationError with helpful suggestions if invalid.
 *
 * @param category - The token category (e.g., "colors", "typography.sizes")
 * @param tokenName - The token name to validate
 * @param config - Optional pre-resolved tokens config (defaults to resolveTokens())
 * @throws ValidationError if the token is invalid
 * @throws Error if the category is invalid
 */
export function validateToken(
  category: TokenCategory,
  tokenName: string,
  config?: TokensConfig
): void {
  if (!tokenName || !tokenName.trim()) {
    throw new Error('Token name cannot be empty')
  }

  const resolvedConfig = config ?? resolveTokens()

  const validTokens = getTokensForCategory(resolvedConfig, category)

  if (validTokens === null) {
    throw new Error(`Unknown category '${category}'. Valid categories: colors, backgrounds, spacing, typography.sizes, typography.weights, radius, shadows`)
  }

  if (validTokens.includes(tokenName)) {
    return // Token is valid
  }

  // Token is invalid - build helpful error message
  const suggestions = findClosestMatches(tokenName, validTokens)
  const message = formatErrorMessage(category, tokenName, suggestions, validTokens)

  throw new ValidationError(message, category, tokenName, suggestions)
}

/**
 * Check if a token is valid without throwing.
 *
 * @param category - The token category
 * @param tokenName - The token name to check
 * @param config - Optional pre-resolved tokens config
 * @returns true if valid, false if invalid
 */
export function isValidToken(
  category: TokenCategory,
  tokenName: string,
  config?: TokensConfig
): boolean {
  try {
    validateToken(category, tokenName, config)
    return true
  } catch (e) {
    if (e instanceof ValidationError) {
      return false
    }
    throw e // Re-throw category errors and other unexpected errors
  }
}
