// src/typecheck/index.ts
// Embedded TypeScript type checker using tsgo (native TypeScript compiler)
// Works via bunx, global install, or local install - no user dependencies needed

import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"

/**
 * Resolves the tsgo binary path from @typescript/native-preview
 * Uses import.meta.resolve to find it relative to prev-cli's location
 */
function getTsgoPath(): string {
  const platform = process.platform
  const arch = process.arch
  const platformPkg = `@typescript/native-preview-${platform}-${arch}`

  try {
    // Resolve relative to THIS file (prev-cli), not user's project
    const pkgJsonUrl = import.meta.resolve(`${platformPkg}/package.json`)
    const pkgDir = path.dirname(fileURLToPath(pkgJsonUrl))
    const exe = platform === "win32" ? "tsgo.exe" : "tsgo"
    return path.join(pkgDir, "lib", exe)
  } catch {
    throw new Error(
      `Unable to find tsgo for ${platform}-${arch}. ` +
      `Package ${platformPkg} may not be installed or your platform is unsupported.`
    )
  }
}

/**
 * Resolves the @types directory from prev-cli's dependencies
 * This is where @types/react and @types/react-dom live
 */
function getTypeRootsPath(): string {
  try {
    // Resolve @types/react relative to THIS file (prev-cli)
    const reactTypesUrl = import.meta.resolve("@types/react/package.json")
    const reactTypesDir = path.dirname(fileURLToPath(reactTypesUrl))
    // Go up one level to get @types directory
    return path.dirname(reactTypesDir)
  } catch {
    throw new Error(
      "Unable to find @types/react. Make sure prev-cli has @types/react in dependencies."
    )
  }
}

export interface TypecheckOptions {
  /** Directory containing preview files to check */
  previewsDir?: string
  /** Patterns to include (default: ["**\/*.{ts,tsx}"]) */
  include?: string[]
  /** Enable strict mode (default: true) */
  strict?: boolean
  /** Show verbose output */
  verbose?: boolean
}

export interface TypecheckResult {
  success: boolean
  fileCount: number
  errorCount: number
  output: string
}

/**
 * Run type checking on preview files using embedded tsgo
 */
export async function typecheck(
  rootDir: string,
  options: TypecheckOptions = {}
): Promise<TypecheckResult> {
  const {
    previewsDir = path.join(rootDir, "previews"),
    include = ["**/*.{ts,tsx}"],
    strict = true,
    verbose = false,
  } = options

  // Find tsgo binary and type roots from prev-cli's dependencies
  const tsgoPath = getTsgoPath()
  const typeRoots = getTypeRootsPath()

  if (verbose) {
    console.log(`  tsgo: ${tsgoPath}`)
    console.log(`  typeRoots: ${typeRoots}`)
    console.log(`  previewsDir: ${previewsDir}`)
  }

  // Gather files to check
  const files: string[] = []
  for (const pattern of include) {
    const glob = new Bun.Glob(pattern)
    for await (const file of glob.scan({ cwd: previewsDir, absolute: true })) {
      files.push(file)
    }
  }

  if (files.length === 0) {
    return {
      success: true,
      fileCount: 0,
      errorCount: 0,
      output: "No TypeScript files found in previews/",
    }
  }

  if (verbose) {
    console.log(`  files: ${files.length}`)
    files.forEach(f => console.log(`    - ${path.relative(rootDir, f)}`))
  }

  // Build tsgo arguments - all config via CLI flags, no temp files
  const args = [
    "--noEmit",
    "--skipLibCheck",
    "--ignoreConfig",  // Ignore any tsconfig.json in user's project
    "--jsx", "react-jsx",
    "--module", "ESNext",
    "--moduleResolution", "bundler",
    "--target", "ES2022",
    "--typeRoots", typeRoots,
    "--types", "react", "react-dom",
  ]

  if (strict) {
    args.push("--strict")
  }

  // Add files
  args.push(...files)

  // Run tsgo
  return new Promise((resolve) => {
    const proc = spawn(tsgoPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: rootDir,
    })

    let stdout = ""
    let stderr = ""

    proc.stdout.on("data", (data) => {
      stdout += data.toString()
    })

    proc.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    proc.on("close", (exitCode) => {
      const output = (stdout + stderr).trim()
      const errorCount = exitCode === 0 ? 0 : countErrors(output)

      resolve({
        success: exitCode === 0,
        fileCount: files.length,
        errorCount,
        output,
      })
    })

    proc.on("error", (err) => {
      resolve({
        success: false,
        fileCount: files.length,
        errorCount: 1,
        output: `Failed to run tsgo: ${err.message}`,
      })
    })
  })
}

/**
 * Count errors from tsgo output
 */
function countErrors(output: string): number {
  // tsgo outputs errors like: "file.ts(1,2): error TS1234: ..."
  const matches = output.match(/error TS\d+:/g)
  return matches?.length ?? 0
}

/**
 * Format typecheck result for CLI output
 */
export function formatTypecheckResult(result: TypecheckResult): string {
  const lines: string[] = []

  if (result.success) {
    lines.push(`\n  ✓ ${result.fileCount} file${result.fileCount === 1 ? "" : "s"} checked, no errors\n`)
  } else {
    if (result.output) {
      lines.push(`\n${result.output}\n`)
    }
    lines.push(`  ✗ ${result.errorCount} error${result.errorCount === 1 ? "" : "s"} in ${result.fileCount} file${result.fileCount === 1 ? "" : "s"}\n`)
  }

  return lines.join("\n")
}
