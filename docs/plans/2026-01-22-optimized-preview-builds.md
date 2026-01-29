# Optimized Preview Builds Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make built preview pages load blazing fast by pre-bundling React and pre-compiling Tailwind CSS at build time, while keeping dev mode unchanged.

**Architecture:** Build phase outputs shared vendor bundle (`_preview/_vendors/runtime.js`) and per-preview compiled CSS. Preview HTML files reference these local assets via relative paths. Dev mode continues using CDN for simplicity.

**Tech Stack:** esbuild (bundling), Tailwind CSS CLI (compilation), Bun (runtime)

---

## Summary

| Phase | Current | After |
|-------|---------|-------|
| Dev | esm.sh + Tailwind browser | No change |
| Build | esm.sh + Tailwind browser | Local vendors + compiled CSS |

**Expected improvement:** ~500-800ms faster page loads (eliminates CDN latency + runtime CSS compilation)

---

## Task 1: Create Shared Vendor Bundle Builder

**Files:**
- Create: `src/preview-runtime/vendors.ts`
- Test: `src/preview-runtime/vendors.test.ts`

**Step 1: Write the failing test**

```ts
// src/preview-runtime/vendors.test.ts
import { test, expect } from 'bun:test'
import { buildVendorBundle } from './vendors'

test('buildVendorBundle creates runtime.js with React', async () => {
  const result = await buildVendorBundle()

  expect(result.success).toBe(true)
  expect(result.code).toBeDefined()
  expect(result.code).toContain('createElement') // React API
  expect(result.code).toContain('createRoot')    // ReactDOM API
})

test('buildVendorBundle output is valid ESM', async () => {
  const result = await buildVendorBundle()

  // Should export React and ReactDOM
  expect(result.code).toContain('export')
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/preview-runtime/vendors.test.ts`
Expected: FAIL with "Cannot find module './vendors'"

**Step 3: Write minimal implementation**

```ts
// src/preview-runtime/vendors.ts
import { build } from 'esbuild'

export interface VendorBundleResult {
  success: boolean
  code: string
  error?: string
}

/**
 * Build a shared vendor bundle containing React and ReactDOM
 * This is used at build time to create dist/_preview/_vendors/runtime.js
 *
 * IMPORTANT: Must also export jsx-runtime for automatic JSX transform
 */
export async function buildVendorBundle(): Promise<VendorBundleResult> {
  try {
    // Entry that re-exports React, ReactDOM, and JSX runtime
    const entryCode = `
      import * as React from 'react'
      import * as ReactDOM from 'react-dom'
      import { createRoot } from 'react-dom/client'

      // JSX runtime exports (required for jsx: 'automatic')
      export { jsx, jsxs, Fragment } from 'react/jsx-runtime'

      export { React, ReactDOM, createRoot }
      export default React
    `

    const result = await build({
      stdin: {
        contents: entryCode,
        loader: 'ts',
        resolveDir: process.cwd(),
      },
      bundle: true,
      write: false,
      format: 'esm',
      target: 'es2020',
      minify: true,
      // Don't externalize - we want React bundled
    })

    const jsFile = result.outputFiles?.[0]
    if (!jsFile) {
      return { success: false, code: '', error: 'No output generated' }
    }

    return { success: true, code: jsFile.text }
  } catch (err) {
    return {
      success: false,
      code: '',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/preview-runtime/vendors.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/preview-runtime/vendors.ts src/preview-runtime/vendors.test.ts
git commit -m "feat(preview): add shared vendor bundle builder"
```

---

## Task 2: Create Tailwind CSS Compiler

**Files:**
- Create: `src/preview-runtime/tailwind.ts`
- Test: `src/preview-runtime/tailwind.test.ts`

**Step 1: Write the failing test**

```ts
// src/preview-runtime/tailwind.test.ts
import { test, expect } from 'bun:test'
import { compileTailwind } from './tailwind'

test('compileTailwind extracts used classes from content', async () => {
  const content = `
    export default function App() {
      return <div className="flex items-center p-4 bg-blue-500">Hello</div>
    }
  `

  const result = await compileTailwind([{ path: 'App.tsx', content }])

  expect(result.success).toBe(true)
  expect(result.css).toBeDefined()
  expect(result.css).toContain('flex')
  expect(result.css).toContain('items-center')
  expect(result.css).toContain('bg-blue-500')
})

test('compileTailwind returns empty CSS for no Tailwind classes', async () => {
  const content = `
    export default function App() {
      return <div style={{ color: 'red' }}>Hello</div>
    }
  `

  const result = await compileTailwind([{ path: 'App.tsx', content }])

  expect(result.success).toBe(true)
  // Minimal base styles only
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/preview-runtime/tailwind.test.ts`
Expected: FAIL with "Cannot find module './tailwind'"

**Step 3: Write minimal implementation**

```ts
// src/preview-runtime/tailwind.ts
import { $ } from 'bun'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { tmpdir } from 'os'

export interface TailwindResult {
  success: boolean
  css: string
  error?: string
}

interface ContentFile {
  path: string
  content: string
}

/**
 * Compile Tailwind CSS for given content files
 * Scans files for class usage and generates minimal CSS
 */
export async function compileTailwind(files: ContentFile[]): Promise<TailwindResult> {
  // Create temp directory for Tailwind processing
  const tempDir = mkdtempSync(join(tmpdir(), 'prev-tailwind-'))

  try {
    // Write content files for scanning (create parent dirs for nested paths)
    for (const file of files) {
      const filePath = join(tempDir, file.path)
      const parentDir = dirname(filePath)
      mkdirSync(parentDir, { recursive: true })
      writeFileSync(filePath, file.content)
    }

    // Create Tailwind config - use .cjs for compatibility
    // Use JSON.stringify for paths to handle Windows backslashes
    const configContent = `
      module.exports = {
        content: [${JSON.stringify(tempDir + '/**/*.{tsx,jsx,ts,js,html}')}],
      }
    `
    const configPath = join(tempDir, 'tailwind.config.cjs')
    writeFileSync(configPath, configContent)

    // Create input CSS with Tailwind directives
    const inputCss = `
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
    `
    const inputPath = join(tempDir, 'input.css')
    writeFileSync(inputPath, inputCss)

    // Output path
    const outputPath = join(tempDir, 'output.css')

    // Run Tailwind CLI
    // Use bunx to run tailwindcss from node_modules
    await $`bunx tailwindcss -c ${configPath} -i ${inputPath} -o ${outputPath} --minify`.quiet()

    const css = readFileSync(outputPath, 'utf-8')

    return { success: true, css }
  } catch (err) {
    return {
      success: false,
      css: '',
      error: err instanceof Error ? err.message : String(err),
    }
  } finally {
    // Cleanup temp directory
    rmSync(tempDir, { recursive: true, force: true })
  }
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/preview-runtime/tailwind.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/preview-runtime/tailwind.ts src/preview-runtime/tailwind.test.ts
git commit -m "feat(preview): add Tailwind CSS build-time compiler"
```

---

## Task 3: Create Optimized Preview Builder

**Files:**
- Create: `src/preview-runtime/build-optimized.ts`
- Test: `src/preview-runtime/build-optimized.test.ts`

**Step 1: Write the failing test**

```ts
// src/preview-runtime/build-optimized.test.ts
import { test, expect } from 'bun:test'
import { buildOptimizedPreview } from './build-optimized'
import type { PreviewConfig } from './types'

test('buildOptimizedPreview generates HTML with local vendor imports', async () => {
  const config: PreviewConfig = {
    files: [
      {
        path: 'index.tsx',
        content: `
          export default function App() {
            return <div className="p-4">Hello</div>
          }
        `,
        type: 'tsx',
      },
    ],
    entry: 'index.tsx',
    tailwind: true,
  }

  const result = await buildOptimizedPreview(config, { vendorPath: '../_vendors/runtime.js' })

  expect(result.success).toBe(true)
  expect(result.html).toContain('../_vendors/runtime.js')
  expect(result.html).not.toContain('esm.sh')        // No CDN
  expect(result.html).not.toContain('tailwindcss/browser') // No runtime Tailwind
})

test('buildOptimizedPreview includes compiled CSS', async () => {
  const config: PreviewConfig = {
    files: [
      {
        path: 'index.tsx',
        content: `
          export default function App() {
            return <div className="flex items-center bg-red-500">Hello</div>
          }
        `,
        type: 'tsx',
      },
    ],
    entry: 'index.tsx',
    tailwind: true,
  }

  const result = await buildOptimizedPreview(config, { vendorPath: '../_vendors/runtime.js' })

  expect(result.success).toBe(true)
  expect(result.css).toContain('flex')
  expect(result.css).toContain('bg-red-500')
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/preview-runtime/build-optimized.test.ts`
Expected: FAIL with "Cannot find module './build-optimized'"

**Step 3: Write minimal implementation**

```ts
// src/preview-runtime/build-optimized.ts
import { build } from 'esbuild'
import type { PreviewConfig } from './types'
import { compileTailwind } from './tailwind'

export interface OptimizedBuildOptions {
  vendorPath: string // Relative path to vendor runtime (e.g., '../_vendors/runtime.js')
}

export interface OptimizedBuildResult {
  success: boolean
  html: string
  css: string
  error?: string
}

/**
 * Build an optimized preview for production
 * - Uses local vendor bundle instead of CDN
 * - Pre-compiles Tailwind CSS
 */
export async function buildOptimizedPreview(
  config: PreviewConfig,
  options: OptimizedBuildOptions
): Promise<OptimizedBuildResult> {
  try {
    // Build virtual filesystem
    const virtualFs: Record<string, { contents: string; loader: string }> = {}
    for (const file of config.files) {
      const ext = file.path.split('.').pop()?.toLowerCase()
      const loader = ext === 'css' ? 'css' : ext === 'json' ? 'json' : ext || 'tsx'
      virtualFs[file.path] = { contents: file.content, loader }
    }

    // Find entry and check if it exports default
    const entryFile = config.files.find(f => f.path === config.entry)
    if (!entryFile) {
      return { success: false, html: '', css: '', error: `Entry file not found: ${config.entry}` }
    }

    const hasDefaultExport = /export\s+default/.test(entryFile.content)

    // Collect user CSS imports during bundling
    const userCssCollected: string[] = []

    // Create entry wrapper that imports from local vendor bundle
    const entryCode = hasDefaultExport ? `
      import React, { createRoot } from '${options.vendorPath}'
      import App from './${config.entry}'

      const root = createRoot(document.getElementById('root'))
      root.render(React.createElement(App))
    ` : `
      import './${config.entry}'
    `

    // Bundle with esbuild - externalize vendor imports
    const result = await build({
      stdin: {
        contents: entryCode,
        loader: 'tsx',
        resolveDir: '/',
      },
      bundle: true,
      write: false,
      format: 'esm',
      jsx: 'automatic',
      jsxImportSource: 'react',
      target: 'es2020',
      minify: true,
      plugins: [{
        name: 'optimized-preview',
        setup(build) {
          // External: vendor runtime (local file, not bundled)
          build.onResolve({ filter: new RegExp(options.vendorPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }, args => {
            return { path: args.path, external: true }
          })

          // External: React and JSX runtime (will be loaded from vendor bundle)
          // This prevents React from being bundled into each preview
          build.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, args => {
            // Map react imports to vendor bundle
            return { path: options.vendorPath, external: true }
          })

          // Resolve relative imports from virtual FS
          build.onResolve({ filter: /^\./ }, args => {
            let resolved = args.path.replace(/^\.\//, '')
            if (!resolved.includes('.')) {
              for (const ext of ['.tsx', '.ts', '.jsx', '.js', '.css']) {
                if (virtualFs[resolved + ext]) {
                  resolved = resolved + ext
                  break
                }
              }
            }
            return { path: resolved, namespace: 'virtual' }
          })

          // Load from virtual filesystem
          build.onLoad({ filter: /.*/, namespace: 'virtual' }, args => {
            const file = virtualFs[args.path]
            if (file) {
              if (file.loader === 'css') {
                // Collect CSS content - will be added to userCss
                userCssCollected.push(file.contents)
                return { contents: '', loader: 'js' }
              }
              return { contents: file.contents, loader: file.loader as any }
            }
            return { contents: '', loader: 'empty' }
          })
        },
      }],
    })

    const jsFile = result.outputFiles.find(f => f.path.endsWith('.js')) || result.outputFiles[0]
    const jsCode = jsFile?.text || ''

    // Compile Tailwind CSS
    let css = ''
    if (config.tailwind) {
      const tailwindResult = await compileTailwind(
        config.files.map(f => ({ path: f.path, content: f.content }))
      )
      if (tailwindResult.success) {
        css = tailwindResult.css
      }
    }

    // Combine Tailwind CSS with user CSS
    const userCss = userCssCollected.join('\n')
    const allCss = css + '\n' + userCss

    // Generate standalone HTML with local imports
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>${allCss}</style>
  <style>
    body { margin: 0; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="${options.vendorPath}"></script>
  <script type="module">${jsCode}</script>
</body>
</html>`

    return { success: true, html, css: allCss }
  } catch (err) {
    return {
      success: false,
      html: '',
      css: '',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/preview-runtime/build-optimized.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/preview-runtime/build-optimized.ts src/preview-runtime/build-optimized.test.ts
git commit -m "feat(preview): add optimized preview builder with local vendors"
```

---

## Task 4: Integrate Optimized Build into Plugin

**Files:**
- Modify: `src/vite/plugins/previews-plugin.ts:79-129`
- Test: Manual integration test

**Step 1: Update the plugin's closeBundle hook**

```ts
// src/vite/plugins/previews-plugin.ts
// Add imports at top:
import { buildVendorBundle } from '../../preview-runtime/vendors'
import { buildOptimizedPreview } from '../../preview-runtime/build-optimized'

// Replace the closeBundle hook (lines 79-129) with:

    async closeBundle() {
      if (!isBuild) return

      const distDir = path.join(rootDir, 'dist')
      const targetDir = path.join(distDir, '_preview')
      const vendorsDir = path.join(targetDir, '_vendors')
      const previewsDir = path.join(rootDir, 'previews')

      // Clean up old directories
      const oldPreviewsDir = path.join(distDir, 'previews')
      if (existsSync(oldPreviewsDir)) {
        rmSync(oldPreviewsDir, { recursive: true })
      }
      if (existsSync(targetDir)) {
        rmSync(targetDir, { recursive: true })
      }

      // Scan previews
      const previews = await scanPreviews(rootDir)
      if (previews.length === 0) return

      console.log(`\n  Building ${previews.length} preview(s)...`)

      // Step 1: Build shared vendor bundle
      console.log('    Building shared vendor bundle...')
      mkdirSync(vendorsDir, { recursive: true })

      const vendorResult = await buildVendorBundle()
      if (!vendorResult.success) {
        console.error(`    ✗ Vendor bundle: ${vendorResult.error}`)
        return
      }
      writeFileSync(path.join(vendorsDir, 'runtime.js'), vendorResult.code)
      console.log('    ✓ _vendors/runtime.js')

      // Step 2: Build each preview with optimized builder
      for (const preview of previews) {
        const previewDir = path.join(previewsDir, preview.name)

        try {
          const config = await buildPreviewConfig(previewDir)

          // Calculate relative path from preview to vendors
          // e.g., components/button -> ../../_vendors/runtime.js
          const depth = preview.name.split('/').length
          const vendorPath = '../'.repeat(depth) + '_vendors/runtime.js'

          const result = await buildOptimizedPreview(config, { vendorPath })

          if (!result.success) {
            console.error(`    ✗ ${preview.name}: ${result.error}`)
            continue
          }

          // Write to output directory
          const outputDir = path.join(targetDir, preview.name)
          mkdirSync(outputDir, { recursive: true })
          writeFileSync(path.join(outputDir, 'index.html'), result.html)

          console.log(`    ✓ ${preview.name}`)
        } catch (err) {
          console.error(`    ✗ ${preview.name}: ${err}`)
        }
      }
    }
```

**Step 2: Run integration test**

Run: `bun run build:docs`
Expected: Build succeeds, output shows vendor bundle + previews

**Step 3: Verify output structure**

Run: `ls -la dist/_preview/`
Expected:
```
_vendors/
  runtime.js
components/
  button/
    index.html
screens/
  login/
    index.html
...
```

**Step 4: Verify preview HTML**

Run: `head -20 dist/_preview/components/button/index.html`
Expected: No esm.sh URLs, has local vendor import

**Step 5: Commit**

```bash
git add src/vite/plugins/previews-plugin.ts
git commit -m "feat(preview): integrate optimized build into plugin"
```

---

## Task 5: Test Page Load Performance

**Files:**
- None (manual verification)

**Step 1: Build the docs**

Run: `bun run build:docs`

**Step 2: Serve locally**

Run: `bunx serve dist -p 5555`

**Step 3: Test with browser automation**

```bash
bwsr start
agent-browser --cdp $(bwsr cdp) open http://localhost:5555/_preview/components/button/
agent-browser --cdp $(bwsr cdp) screenshot /tmp/optimized-preview.png
```

**Step 4: Verify no CDN requests in Network tab**

Open DevTools → Network → Reload
Expected: No requests to esm.sh or jsdelivr

**Step 5: Document results**

Compare load times:
- Before: ~500-800ms (CDN + runtime Tailwind)
- After: ~50-100ms (local assets)

---

## Task 6: Update GitHub Pages and Verify

**Step 1: Commit all changes**

```bash
git add -A
git commit -m "feat(preview): optimized production builds with local vendors"
```

**Step 2: Push to trigger CI**

```bash
git push origin main
```

**Step 3: Wait for GitHub Pages deployment**

Run: `gh run watch --exit-status`

**Step 4: Verify on GitHub Pages**

```bash
agent-browser --cdp $(bwsr cdp) open https://lagz0ne.github.io/prev-cli/_preview/components/button/
agent-browser --cdp $(bwsr cdp) screenshot /tmp/github-pages-preview.png
```

**Step 5: Confirm fast load**

Expected: Preview loads instantly without CDN delay

---

## Rollback Plan

If issues arise, revert to CDN-based builds:

```bash
git revert HEAD~N  # N = number of commits to revert
```

The original `buildPreviewHtml` in `src/preview-runtime/build.ts` remains unchanged and can be swapped back in.

---

## Future Enhancements

1. **Shared CSS bundle** - Single Tailwind CSS for all previews (even smaller)
2. **Content-hashed filenames** - Better caching (`runtime.[hash].js`)
3. **Service Worker** - Offline support for previews
4. **Skip React for YAML previews** - Flows/Atlas don't need React
