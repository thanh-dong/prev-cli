// src/tokens/resolver.ts
// Token resolver with YAML parsing and deep merge support

import { load as parseYaml } from 'js-yaml'
import { readFileSync } from 'fs'
import { join } from 'path'
import { mergeTokenConfigs } from './utils'
import { DEFAULT_TOKENS } from './defaults'

/**
 * Token configuration interface matching shadcn design system
 */
export interface TokensConfig {
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

/**
 * Partial token configuration for user overrides
 * All fields are optional and can be deeply nested
 */
export type PartialTokensConfig = {
  colors?: Record<string, string | null>
  backgrounds?: Record<string, string | null>
  spacing?: Record<string, string | null>
  typography?: {
    sizes?: Record<string, string | null>
    weights?: Record<string, number | null>
  }
  radius?: Record<string, string | null>
  shadows?: Record<string, string | null>
}

/**
 * Options for resolving tokens
 */
export interface ResolveTokensOptions {
  /** Path to user's tokens.yaml file */
  userTokensPath?: string
  /** Inline user token overrides (takes precedence over file) */
  userTokens?: PartialTokensConfig
  /** Path to defaults.yaml (defaults to bundled defaults) */
  defaultsPath?: string
}

/**
 * Validate that parsed YAML has the required TokensConfig structure
 * @param parsed - The parsed YAML content
 * @param filePath - Path to the file (for error messages)
 * @returns Validated TokensConfig
 * @throws Error if validation fails
 */
function validateTokensConfig(parsed: unknown, filePath: string): TokensConfig {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid tokens file: ${filePath} - must contain a YAML object`)
  }

  const obj = parsed as Record<string, unknown>

  // Validate required top-level keys exist
  const requiredKeys = ['colors', 'backgrounds', 'spacing', 'typography', 'radius', 'shadows']
  for (const key of requiredKeys) {
    if (!(key in obj)) {
      throw new Error(`Invalid tokens file: ${filePath} - missing required key "${key}"`)
    }
  }

  // Validate typography has required nested structure
  const typo = obj.typography as Record<string, unknown>
  if (!typo || typeof typo !== 'object' || !('sizes' in typo) || !('weights' in typo)) {
    throw new Error(`Invalid tokens file: ${filePath} - typography must have "sizes" and "weights"`)
  }

  return parsed as TokensConfig
}

/**
 * Load and parse a YAML tokens file (full validation)
 * @param filePath - Absolute path to the YAML file
 * @returns Parsed tokens configuration
 * @throws Error if file doesn't exist or contains invalid YAML
 */
export function loadTokens(filePath: string): TokensConfig {
  const content = readFileSync(filePath, 'utf-8')
  const parsed = parseYaml(content)

  return validateTokensConfig(parsed, filePath)
}

/**
 * Load and parse a partial YAML tokens file (for user overrides)
 * Only validates that it's a valid YAML object, doesn't require all keys
 * @param filePath - Absolute path to the YAML file
 * @returns Partial tokens configuration
 */
function loadPartialTokens(filePath: string): PartialTokensConfig {
  const content = readFileSync(filePath, 'utf-8')
  const parsed = parseYaml(content)

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid tokens file: ${filePath} - must contain a YAML object`)
  }

  return parsed as PartialTokensConfig
}

/**
 * Resolve tokens by merging defaults with user overrides
 *
 * Resolution order (later wins):
 * 1. Bundled default tokens
 * 2. User tokens from file (if userTokensPath provided)
 * 3. Inline user tokens (if userTokens provided)
 *
 * @param options - Resolution options
 * @returns Fully resolved tokens configuration
 */
export function resolveTokens(options: ResolveTokensOptions = {}): TokensConfig {
  const { userTokens, defaultsPath } = options

  // Check for user tokens path from build plugin or options
  let userTokensPath = options.userTokensPath
  if (!userTokensPath && typeof globalThis !== 'undefined') {
    userTokensPath = (globalThis as any).__PREV_USER_TOKENS_PATH
  }

  // Load defaults - use inline defaults or load from file if path provided
  const defaults = defaultsPath ? loadTokens(defaultsPath) : DEFAULT_TOKENS

  // Start with defaults
  let resolved: TokensConfig = { ...defaults }

  // Merge user tokens from file if provided (partial overrides allowed)
  if (userTokensPath) {
    try {
      const fileTokens = loadPartialTokens(userTokensPath)
      resolved = mergeTokenConfigs(resolved, fileTokens)
    } catch (error) {
      // If user file doesn't exist, continue with defaults
      // This allows optional user override files
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error // Re-throw if it's not a "file not found" error
      }
    }
  }

  // Merge inline user tokens if provided
  if (userTokens) {
    resolved = mergeTokenConfigs(resolved, userTokens)
  }

  return resolved
}

/**
 * Convenience function to resolve tokens from a project directory
 * Looks for tokens.yaml in the project root
 *
 * @param projectDir - Path to the project directory
 * @returns Resolved tokens configuration
 */
export function resolveProjectTokens(projectDir: string): TokensConfig {
  return resolveTokens({
    userTokensPath: join(projectDir, 'tokens.yaml')
  })
}
