// src/validators/schema-validator.ts
// JSON Schema validation using AJV

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getAdapter, listAdapters } from '../renderers/registry'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface SchemaValidationResult {
  valid: boolean
  errors: SchemaValidationError[]
}

export interface SchemaValidationError {
  path: string
  message: string
  keyword: string
}

// Create AJV instance with formats support
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  allowUnionTypes: true,
})
addFormats(ajv)

// Cache for compiled schemas
const schemaCache = new Map<string, ReturnType<typeof ajv.compile>>()

/**
 * Load and compile a JSON Schema from the schemas directory
 */
function loadSchema(name: string): ReturnType<typeof ajv.compile> {
  if (schemaCache.has(name)) {
    return schemaCache.get(name)!
  }

  const schemaPath = join(__dirname, '..', 'schemas', `${name}.schema.json`)
  const schemaContent = readFileSync(schemaPath, 'utf-8')
  const schema = JSON.parse(schemaContent)

  const validate = ajv.compile(schema)
  schemaCache.set(name, validate)
  return validate
}

/**
 * Select the appropriate schema version based on config's schemaVersion field
 */
function selectSchemaVersion(config: Record<string, unknown>): string {
  const version = config.schemaVersion
  if (version === '2.0') {
    return 'preview-v2'
  }
  // Default to v1 for undefined, "1.0", or any other value
  if (version !== undefined && version !== '1.0') {
    throw new Error(`Unknown schemaVersion: ${version}. Expected "1.0" or "2.0".`)
  }
  return 'preview-v1'
}

/**
 * Validate a config object against the preview schema
 */
export function validateConfig(config: Record<string, unknown>): SchemaValidationResult {
  try {
    const schemaName = selectSchemaVersion(config)
    const validate = loadSchema(schemaName)

    const valid = validate(config) as boolean

    if (valid) {
      return { valid: true, errors: [] }
    }

    const errors: SchemaValidationError[] = (validate.errors ?? []).map(err => ({
      path: err.instancePath || '/',
      message: err.message ?? 'Unknown validation error',
      keyword: err.keyword,
    }))

    return { valid: false, errors }
  } catch (err) {
    return {
      valid: false,
      errors: [{
        path: '/',
        message: err instanceof Error ? err.message : String(err),
        keyword: 'schema',
      }],
    }
  }
}

/**
 * Validate a layout subtree against a specific renderer's layout schema
 * Accepts both array and object layouts (design allows adapters to use either)
 */
export function validateLayoutForRenderer(
  layout: unknown,
  rendererName: string
): SchemaValidationResult {
  const adapter = getAdapter(rendererName)

  if (!adapter) {
    return {
      valid: false,
      errors: [{
        path: `/layoutByRenderer/${rendererName}`,
        message: `Unknown renderer "${rendererName}". Registered renderers: ${listAdapters().join(', ') || 'none'}`,
        keyword: 'renderer',
      }],
    }
  }

  // Compile the adapter's layout schema
  const cacheKey = `layout-${rendererName}`
  if (!schemaCache.has(cacheKey)) {
    const validate = ajv.compile(adapter.layoutSchema)
    schemaCache.set(cacheKey, validate)
  }

  const validate = schemaCache.get(cacheKey)!
  const valid = validate(layout) as boolean

  if (valid) {
    return { valid: true, errors: [] }
  }

  const errors: SchemaValidationError[] = (validate.errors ?? []).map(err => ({
    path: `/layoutByRenderer/${rendererName}${err.instancePath}`,
    message: err.message ?? 'Unknown validation error',
    keyword: err.keyword,
  }))

  return { valid: false, errors }
}

/**
 * Validate all layoutByRenderer entries against their respective adapter schemas
 * Accepts both array and object layouts per the design spec
 */
export function validateAllLayouts(
  layoutByRenderer: Record<string, unknown> | undefined,
  targetRenderer?: string
): SchemaValidationResult {
  const errors: SchemaValidationError[] = []

  if (!layoutByRenderer) {
    return { valid: true, errors: [] }
  }

  const keysToValidate = targetRenderer
    ? [targetRenderer]
    : Object.keys(layoutByRenderer)

  for (const key of keysToValidate) {
    if (!(key in layoutByRenderer)) {
      // When using --renderer flag and key is missing, this is a warning not an error
      if (targetRenderer) {
        errors.push({
          path: `/layoutByRenderer`,
          message: `Config missing layout for renderer "${key}"`,
          keyword: 'missing-renderer-warning', // Special keyword to convert to warning in caller
        })
      }
      continue
    }

    const layout = layoutByRenderer[key]
    const result = validateLayoutForRenderer(layout, key)
    errors.push(...result.errors)
  }

  // Filter out warnings for the valid check
  const realErrors = errors.filter(e => e.keyword !== 'missing-renderer-warning')

  return {
    valid: realErrors.length === 0,
    errors,
  }
}

/**
 * Clear the schema cache (for testing)
 */
export function clearSchemaCache(): void {
  schemaCache.clear()
}
