import { $ } from 'bun'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { tmpdir } from 'os'
import { fileURLToPath } from 'url'

// Resolve tailwindcss CLI from this package's node_modules
const __dirname = dirname(fileURLToPath(import.meta.url))
const tailwindBin = join(__dirname, '../../node_modules/.bin/tailwindcss')

export interface TailwindResult {
  success: boolean
  css: string
  error?: string
}

interface ContentFile {
  path: string
  content: string
}

export async function compileTailwind(files: ContentFile[]): Promise<TailwindResult> {
  const tempDir = mkdtempSync(join(tmpdir(), 'prev-tailwind-'))

  try {
    // Write content files (create parent dirs for nested paths)
    for (const file of files) {
      const filePath = join(tempDir, file.path)
      const parentDir = dirname(filePath)
      mkdirSync(parentDir, { recursive: true })
      writeFileSync(filePath, file.content)
    }

    // Create Tailwind config - use .cjs for compatibility
    const configContent = `
      module.exports = {
        content: [${JSON.stringify(tempDir + '/**/*.{tsx,jsx,ts,js,html}')}],
      }
    `
    const configPath = join(tempDir, 'tailwind.config.cjs')
    writeFileSync(configPath, configContent)

    // Create input CSS
    const inputCss = `
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
    `
    const inputPath = join(tempDir, 'input.css')
    writeFileSync(inputPath, inputCss)

    const outputPath = join(tempDir, 'output.css')

    // Run Tailwind CLI from package's node_modules
    await $`${tailwindBin} -c ${configPath} -i ${inputPath} -o ${outputPath} --minify`.quiet()

    const css = readFileSync(outputPath, 'utf-8')

    return { success: true, css }
  } catch (err) {
    return {
      success: false,
      css: '',
      error: err instanceof Error ? err.message : String(err),
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}
