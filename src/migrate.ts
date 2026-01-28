// src/migrate.ts
// Migration tool to upgrade preview configs from v1 to v2 format

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import * as yaml from 'js-yaml'

export interface MigrationResult {
  success: boolean
  migrated: number
  skipped: number
  errors: MigrationError[]
}

export interface MigrationError {
  file: string
  message: string
}

const PREVIEW_TYPE_FOLDERS = ['components', 'screens', 'flows', 'atlas'] as const
type PreviewTypeDir = typeof PREVIEW_TYPE_FOLDERS[number]

const KIND_MAP: Record<PreviewTypeDir, string> = {
  components: 'component',
  screens: 'screen',
  flows: 'flow',
  atlas: 'atlas',
}

/**
 * Find the preview directory root
 */
function findPreviewRoot(startDir: string): string | null {
  let current = startDir

  while (current !== '/') {
    const previewsDir = join(current, '.previews')
    if (existsSync(previewsDir)) {
      return previewsDir
    }

    const previewsDirAlt = join(current, 'previews')
    if (existsSync(previewsDirAlt)) {
      return previewsDirAlt
    }

    current = join(current, '..')
  }

  return null
}

/**
 * Migrate a single config file from v1 to v2
 */
function migrateConfig(
  configPath: string,
  folderId: string,
  kind: string
): { migrated: boolean; error?: string } {
  try {
    const content = readFileSync(configPath, 'utf-8')
    const config = yaml.load(content) as Record<string, unknown>

    if (!config || typeof config !== 'object') {
      return { migrated: false, error: 'Invalid YAML' }
    }

    // Check if already v2
    if (config.schemaVersion === '2.0') {
      return { migrated: false }
    }

    // Track if any changes were made
    let changed = false

    // Add kind if missing
    if (!config.kind) {
      config.kind = kind
      changed = true
    }

    // Add id if missing
    if (!config.id) {
      config.id = folderId
      changed = true
    }

    // Set schemaVersion to 2.0
    if (config.schemaVersion !== '2.0') {
      config.schemaVersion = '2.0'
      changed = true
    }

    if (!changed) {
      return { migrated: false }
    }

    // Write back as YAML
    const newContent = yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
      noRefs: true,
    })

    writeFileSync(configPath, newContent, 'utf-8')
    return { migrated: true }
  } catch (err) {
    return {
      migrated: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Migrate all preview configs from v1 to v2 format
 */
export async function migrateConfigs(rootDir: string = process.cwd()): Promise<MigrationResult> {
  const previewRoot = findPreviewRoot(rootDir)

  if (!previewRoot) {
    return {
      success: false,
      migrated: 0,
      skipped: 0,
      errors: [{
        file: rootDir,
        message: 'No preview directory found (.previews/ or previews/)',
      }],
    }
  }

  const result: MigrationResult = {
    success: true,
    migrated: 0,
    skipped: 0,
    errors: [],
  }

  for (const type of PREVIEW_TYPE_FOLDERS) {
    const typeDir = join(previewRoot, type)
    if (!existsSync(typeDir)) continue

    const kind = KIND_MAP[type]
    const entries = readdirSync(typeDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const unitPath = join(typeDir, entry.name)
      const configYaml = join(unitPath, 'config.yaml')
      const configYml = join(unitPath, 'config.yml')

      const configPath = existsSync(configYaml)
        ? configYaml
        : existsSync(configYml)
          ? configYml
          : null

      if (!configPath) {
        result.skipped++
        continue
      }

      const migrationResult = migrateConfig(configPath, entry.name, kind)

      if (migrationResult.error) {
        result.errors.push({
          file: configPath,
          message: migrationResult.error,
        })
        result.success = false
      } else if (migrationResult.migrated) {
        result.migrated++
      } else {
        result.skipped++
      }
    }
  }

  return result
}

/**
 * Format migration result for CLI output
 */
export function formatMigrationResult(result: MigrationResult): string {
  const lines: string[] = []

  if (result.migrated > 0) {
    lines.push(`✓ Migrated ${result.migrated} config(s) to v2 format`)
  }

  if (result.skipped > 0) {
    lines.push(`  Skipped ${result.skipped} (already v2 or no config)`)
  }

  if (result.errors.length > 0) {
    lines.push('')
    lines.push('Errors:')
    for (const err of result.errors) {
      lines.push(`  ${err.file}: ${err.message}`)
    }
  }

  if (result.migrated === 0 && result.errors.length === 0) {
    lines.push('No configs needed migration')
  }

  return lines.join('\n')
}
