# IA & Flows Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure previews showcase with dashboard, interactive flows, and atlas canvas views.

**Architecture:** Extend existing preview infrastructure with new viewers for flows/atlas. Keep backwards compatibility with existing schema and components. Add dashboard as new entry point.

**Tech Stack:** React, TanStack Router, dagre (auto-layout), zod (schema validation), existing Preview component

---

## CRITICAL FIXES FROM FOURTH REVIEW

### BLOCKER 1: _preview-config endpoint for screens/components
The endpoint at `/_preview-config/screens/login` checks for `index.yaml` but screens use `config.yaml`. This causes dev preview thumbnails to hang forever. **FIX:** In Task 2A (NEW), update `src/vite/config.ts` to check for `config.yaml` when type is `components` or `screens`.

### BLOCKER 2: parseConfig returns {} instead of null
The new `parseConfig` function returns `{}` on invalid config, but existing code expects `null` to indicate failure. This breaks tests and hides errors. **FIX:** In Task 1, change `parseConfig` to return `null` on failure, not `{}`.

### HIGH: Atlas schema compatibility
Existing atlas data uses `ref: screens/login` and `children` fields, not `screen: login`. **FIX:** In Task 1, add `ref` and `children` to atlas node schema, and in Task 9, map `ref` to `screen` in AtlasCanvas.

### MINOR: Avoid double builds
Task 11 builds components/screens twice (once from legacy scanPreviews, once from scanPreviewUnits). **FIX:** Filter out multi-type folders from legacy scan.

### MINOR: TypeScript doesn't check src/theme
The tsconfig excludes `src/theme/**/*`. **FIX:** In Task 13, use Vite build validation instead of tsc.

### MINOR: ScreenViewer defaults to 'default' state
Should use first available state if 'default' doesn't exist. **FIX:** In Task 7, derive initial state dynamically.

---

## Task 1: Extend Preview Schema (Additive Changes with Legacy Support)

**Context:** The existing `preview-types.ts` has `FlowDefinition` and `AtlasDefinition` interfaces that use different shapes than our new design. The scanner reads config and passes it through `configSchema`. We need:
1. A NEW `configSchemaExtended` for new-style YAML (with steps/transitions/conditions/nodes)
2. Keep the EXISTING `configSchema` unchanged for backwards compat
3. Use a **union approach** in the scanner to try extended first, fall back to base

**Files:**
- Modify: `src/vite/preview-types.ts`
- Create: `src/vite/preview-types.test.ts`

**Step 1: Write test for extended schema**

Create `src/vite/preview-types.test.ts`:

```typescript
import { test, expect } from 'bun:test'
import { configSchema, configSchemaExtended, parseConfig } from './preview-types'

test('configSchema parses base config (unchanged)', () => {
  const result = configSchema.parse({
    title: 'Test',
    tags: ['ui'],
    status: 'stable',
  })
  expect(result.title).toBe('Test')
  expect(result.tags).toEqual(['ui'])
})

test('configSchemaExtended parses screen states and triggers', () => {
  const result = configSchemaExtended.parse({
    title: 'Dashboard',
    category: 'screens',
    states: {
      default: { user: null },
      'logged-in': { user: { name: 'John' } },
    },
    triggers: {
      click_settings: "[data-nav='settings']",
    },
  })
  expect(result.states?.default).toEqual({ user: null })
  expect(result.triggers?.click_settings).toBe("[data-nav='settings']")
})

test('configSchemaExtended parses flow steps and transitions', () => {
  const result = configSchemaExtended.parse({
    title: 'Onboarding',
    category: 'flows',
    steps: [
      { id: 'welcome', title: 'Welcome', screen: 'login', state: 'default' },
      { id: 'signup', title: 'Sign Up', screen: 'login', trigger: 'click_get_started' },
    ],
    transitions: [
      { from: 'welcome', to: 'signup', trigger: 'click_get_started' },
    ],
  })
  expect(result.steps).toHaveLength(2)
  expect(result.transitions?.[0].trigger).toBe('click_get_started')
})

test('configSchemaExtended parses atlas conditions, nodes, relationships', () => {
  const result = configSchemaExtended.parse({
    title: 'App Structure',
    category: 'atlas',
    conditions: [
      { id: 'guest', title: 'Guest', default: true },
      { id: 'user', title: 'User' },
    ],
    nodes: [
      { id: 'login', title: 'Login', screen: 'login', visible: ['guest'] },
      { id: 'dashboard', title: 'Dashboard', visible: ['user'] }, // Note: screen is OPTIONAL
    ],
    relationships: [
      { from: 'login', to: 'dashboard', label: 'success' },
    ],
  })
  expect(result.conditions).toHaveLength(2)
  expect(result.nodes?.[0].visible).toEqual(['guest'])
  expect(result.nodes?.[1].screen).toBeUndefined() // screen is optional
  expect(result.relationships?.[0].label).toBe('success')
})

test('parseConfig tries extended then falls back to base', () => {
  // New-style config works
  const newStyle = parseConfig({
    title: 'Flow',
    steps: [{ id: 'a', title: 'A', screen: 's' }],
  })
  expect(newStyle.steps).toBeDefined()

  // Old-style config also works (no steps/nodes)
  const oldStyle = parseConfig({
    title: 'Basic',
    tags: ['ui'],
  })
  expect(oldStyle.title).toBe('Basic')
})
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/vite/preview-types.test.ts`
Expected: FAIL - configSchemaExtended and parseConfig don't exist

**Step 3: Extend preview-types.ts (additive, keep all existing types)**

Modify `src/vite/preview-types.ts`:

```typescript
// src/vite/preview-types.ts
import { z } from 'zod'

// Preview content types
export type PreviewType = 'component' | 'screen' | 'flow' | 'atlas'

// ============================================
// EXISTING SCHEMA - UNCHANGED FOR COMPAT
// ============================================

// Config.yaml schema (EXISTING - DO NOT MODIFY)
export const configSchema = z.object({
  // Allow both string and array for tags (YAML allows `tags: core` as scalar)
  tags: z.union([
    z.array(z.string()),
    z.string().transform(s => [s])
  ]).optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'stable', 'deprecated']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
})

export type PreviewConfig = z.infer<typeof configSchema>

// ============================================
// NEW EXTENDED SCHEMA - FOR NEW PREVIEW TYPES
// ============================================

// Flow step schema (for new-style index.yaml)
const flowStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  screen: z.string(),
  state: z.string().optional(),
  trigger: z.string().optional(),
})

// Flow transition schema
const flowTransitionSchema = z.object({
  from: z.string(),
  to: z.string(),
  trigger: z.string(),
})

// Atlas condition schema
const atlasConditionSchema = z.object({
  id: z.string(),
  title: z.string(),
  default: z.boolean().optional(),
})

// Atlas node schema - NOTE: screen is OPTIONAL (nodes can be conceptual)
// ALSO supports legacy `ref` field (e.g., "screens/login") and `children`/`type`
const atlasNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  screen: z.string().optional(), // OPTIONAL - not all nodes have screens
  ref: z.string().optional(), // LEGACY: "screens/login" format - will be mapped to screen
  type: z.string().optional(), // LEGACY: "container", "module", "screen"
  children: z.array(z.string()).optional(), // LEGACY: child node IDs
  description: z.string().optional(),
  state: z.string().optional(),
  stateOverrides: z.record(z.string()).optional(),
  visible: z.array(z.string()).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
})

// Atlas relationship schema
const atlasRelationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  visible: z.array(z.string()).optional(),
})

// Extended config schema - includes all new fields
export const configSchemaExtended = z.object({
  // Common fields (same as base)
  tags: z.union([
    z.array(z.string()),
    z.string().transform(s => [s])
  ]).optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'stable', 'deprecated']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),

  // Component: variants (new)
  variants: z.record(z.record(z.unknown())).optional(),

  // Screen: states and triggers (new)
  states: z.record(z.record(z.unknown())).optional(),
  triggers: z.record(z.string()).optional(),

  // Flow: steps and transitions (new)
  steps: z.array(flowStepSchema).optional(),
  transitions: z.array(flowTransitionSchema).optional(),

  // Atlas: conditions, nodes, relationships (new)
  conditions: z.array(atlasConditionSchema).optional(),
  nodes: z.array(atlasNodeSchema).optional(),
  relationships: z.array(atlasRelationshipSchema).optional(),
})

export type PreviewConfigExtended = z.infer<typeof configSchemaExtended>

/**
 * Parse config with fallback: try extended schema first, then base schema
 * This ensures both new-style and old-style configs work
 * RETURNS NULL on failure (not empty object) to preserve existing test behavior
 */
export function parseConfig(data: unknown): PreviewConfigExtended | null {
  // Try extended schema first (superset of base)
  const extendedResult = configSchemaExtended.safeParse(data)
  if (extendedResult.success) {
    return extendedResult.data
  }

  // Fall back to base schema
  const baseResult = configSchema.safeParse(data)
  if (baseResult.success) {
    return baseResult.data
  }

  // If both fail, return null (matches existing parsePreviewConfig behavior)
  console.warn('Config parse failed, returning null')
  return null
}

// ============================================
// EXTENDED PREVIEW UNIT - WITH TYPE AWARENESS
// ============================================

export interface PreviewUnit {
  type: PreviewType
  name: string
  path: string
  route: string
  config: PreviewConfigExtended | null
  files: {
    index: string           // Main entry file
    states?: string[]       // For screens: additional state files
    schema?: string         // For components: schema.ts
    docs?: string           // docs.mdx if present
  }
}

// Re-export step/node types for use in components
export type FlowStepNew = z.infer<typeof flowStepSchema>
export type FlowTransition = z.infer<typeof flowTransitionSchema>
export type AtlasCondition = z.infer<typeof atlasConditionSchema>
export type AtlasNode = z.infer<typeof atlasNodeSchema>
export type AtlasRelationship = z.infer<typeof atlasRelationshipSchema>

// ============================================
// EXISTING TYPES - PRESERVED FOR BACKWARDS COMPAT
// ============================================

// Flow step definition (from LEGACY index.yaml) - KEPT FOR BACKWARDS COMPAT
export interface FlowStep {
  screen: string
  state?: string
  note?: string
  trigger?: string
  highlight?: string[]
}

// Flow definition - KEPT FOR BACKWARDS COMPAT
export interface FlowDefinition {
  name: string
  description?: string
  steps: FlowStep[]
}

// Atlas area definition - KEPT FOR BACKWARDS COMPAT
export interface AtlasArea {
  title: string
  description?: string
  parent?: string
  children?: string[]
  access?: string
}

// Atlas definition (from LEGACY index.yaml) - KEPT FOR BACKWARDS COMPAT
export interface AtlasDefinition {
  name: string
  description?: string
  hierarchy: {
    root: string
    areas: Record<string, AtlasArea>
  }
  routes?: Record<string, { area: string; screen: string; guard?: string }>
  navigation?: Record<string, Array<{ area?: string; icon?: string; action?: string }>>
  relationships?: Array<{ from: string; to: string; type: string }>
}
```

**Step 4: Run tests to verify they pass**

Run: `bun test src/vite/preview-types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/vite/preview-types.ts src/vite/preview-types.test.ts
git commit -m "feat: add extended preview schema with parseConfig fallback"
```

---

## Task 2A: Fix _preview-config Endpoint for Screens/Components (BLOCKER FIX)

**Context:** The `_preview-config` endpoint at `/_preview-config/screens/login` only checks for `index.yaml`, but screens and components use `config.yaml`. This causes dev preview thumbnails to hang forever because the config never loads.

**Files:**
- Modify: `src/vite/config.ts`

**Step 1: Update the multi-type config path logic**

In `src/vite/config.ts`, find the `_preview-config` handler (around line 306) and update it to check for `config.yaml` when type is `components` or `screens`:

Replace this block (lines 313-360):
```typescript
if (multiTypeMatch) {
  const [, type, name] = multiTypeMatch
  // URL already contains plural form (flows, atlas), use directly
  const configPathYaml = path.join(previewsDir, type, name, 'index.yaml')
  const configPathYml = path.join(previewsDir, type, name, 'index.yml')
  const configPath = existsSync(configPathYaml) ? configPathYaml : configPathYml

  // ... rest of handler
}
```

With this updated logic:
```typescript
if (multiTypeMatch) {
  const [, type, name] = multiTypeMatch
  const typeDir = path.join(previewsDir, type, name)

  // Security: prevent path traversal
  if (!typeDir.startsWith(previewsDir)) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }

  // For flows/atlas: index.yaml is the config
  // For components/screens: config.yaml is the config
  let configPath: string | null = null

  if (type === 'flows' || type === 'atlas') {
    const indexYaml = path.join(typeDir, 'index.yaml')
    const indexYml = path.join(typeDir, 'index.yml')
    configPath = existsSync(indexYaml) ? indexYaml : (existsSync(indexYml) ? indexYml : null)
  } else {
    // components or screens use config.yaml
    const configYaml = path.join(typeDir, 'config.yaml')
    const configYml = path.join(typeDir, 'config.yml')
    configPath = existsSync(configYaml) ? configYaml : (existsSync(configYml) ? configYml : null)
  }

  if (configPath) {
    try {
      if (type === 'flows') {
        const flow = await parseFlowDefinition(configPath)
        if (flow) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(flow))
          return
        }
      } else if (type === 'atlas') {
        const atlas = await parseAtlasDefinition(configPath)
        if (atlas) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(atlas))
          return
        }
      } else {
        // For components/screens, use buildPreviewConfig
        const config = await buildPreviewConfig(typeDir)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(config))
        return
      }
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Invalid config format' }))
      return
    } catch (err) {
      console.error('Error building preview config:', err)
      res.statusCode = 500
      res.end(JSON.stringify({ error: String(err) }))
      return
    }
  } else {
    // No config file found, but directory exists - return defaults
    if (existsSync(typeDir)) {
      const config = await buildPreviewConfig(typeDir)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(config))
      return
    }
  }
}
```

**Step 2: Run existing tests**

Run: `bun test src/vite`
Expected: PASS (no regressions)

**Step 3: Commit**

```bash
git add src/vite/config.ts
git commit -m "fix: _preview-config endpoint uses config.yaml for screens/components"
```

---

## Task 2: Update Scanner to Use parseConfig and Read index.yaml

**Context:** The current scanner reads config.yaml for all types, but flows/atlas use index.yaml as their main definition file. We need to:
1. Read index.yaml for flows/atlas, config.yaml for components/screens
2. Use the new `parseConfig` function instead of direct schema parse

**Files:**
- Modify: `src/vite/previews.ts`
- Modify: `src/vite/config-parser.ts`

**Step 1: Update config-parser to use parseConfig**

Modify `src/vite/config-parser.ts` to export a function that uses `parseConfig`:

```typescript
// In parsePreviewConfig function, replace schema.parse with parseConfig:
import { parseConfig, type PreviewConfigExtended } from './preview-types'

export async function parsePreviewConfig(configPath: string): Promise<PreviewConfigExtended | null> {
  if (!existsSync(configPath)) {
    return null
  }

  try {
    const content = readFileSync(configPath, 'utf-8')
    const data = yaml.load(content)
    return parseConfig(data)
  } catch (err) {
    console.warn(`Failed to parse config at ${configPath}:`, err)
    return null
  }
}
```

**Step 2: Update scanPreviewUnits to read index.yaml for flows/atlas**

Modify `src/vite/previews.ts` - update the config loading logic in scanPreviewUnits:

```typescript
for (const entry of entries) {
  const name = entry.replace(/\/$/, '')
  const unitDir = path.join(typeDir, name)

  // Detect files
  const files = await detectUnitFiles(unitDir, type)
  if (!files.index) continue // Skip if no index file

  // For flows/atlas, index.yaml IS the config (contains steps/nodes)
  // For components/screens, use config.yaml
  let configPath: string
  if (type === 'flow' || type === 'atlas') {
    // index.yaml IS the config for flows/atlas
    configPath = existsSync(path.join(unitDir, 'index.yaml'))
      ? path.join(unitDir, 'index.yaml')
      : path.join(unitDir, 'index.yml')
  } else {
    // config.yaml for components/screens
    configPath = existsSync(path.join(unitDir, 'config.yaml'))
      ? path.join(unitDir, 'config.yaml')
      : path.join(unitDir, 'config.yml')
  }

  const config = await parsePreviewConfig(configPath)

  units.push({
    type,
    name,
    path: unitDir,
    route: `/_preview/${typeFolder}/${name}`,
    config,
    files,
  })
}
```

**Step 3: Run existing tests**

Run: `bun test src/vite`
Expected: PASS (no regressions)

**Step 4: Commit**

```bash
git add src/vite/previews.ts src/vite/config-parser.ts
git commit -m "fix: read index.yaml as config for flows/atlas, use parseConfig"
```

---

## Task 3: Add @testing-library/react Dependency

**Context:** The SmartPopover tests use @testing-library/react but it's not in package.json.

**Files:**
- Modify: `package.json`

**Step 1: Install dependency**

```bash
bun add -d @testing-library/react
```

**Step 2: Verify it's added**

Run: `bun test` (should work without module not found errors)

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add @testing-library/react for component tests"
```

---

## Task 4: Add SmartPopover Component

**Files:**
- Create: `src/theme/SmartPopover.tsx`
- Create: `src/theme/SmartPopover.test.tsx`

**Step 1: Write test for SmartPopover**

Create `src/theme/SmartPopover.test.tsx`:

```typescript
import { test, expect } from 'bun:test'
import { render } from '@testing-library/react'
import { SmartPopover } from './SmartPopover'

test('SmartPopover renders trigger', () => {
  const { getByText } = render(
    <SmartPopover
      trigger={<button>Open</button>}
      content={<div>Content</div>}
    />
  )
  expect(getByText('Open')).toBeDefined()
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/theme/SmartPopover.test.tsx`
Expected: FAIL - module not found

**Step 3: Implement SmartPopover**

Create `src/theme/SmartPopover.tsx`:

```typescript
import React, { useState, useRef, useEffect, useCallback } from 'react'

interface SmartPopoverProps {
  trigger: React.ReactNode
  content: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type Position = 'top' | 'bottom' | 'left' | 'right'

export function SmartPopover({ trigger, content, open: controlledOpen, onOpenChange }: SmartPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [position, setPosition] = useState<Position>('bottom')
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen

  const setOpen = useCallback((value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }
  }, [isControlled, onOpenChange])

  // Calculate best position based on available space
  useEffect(() => {
    if (!isOpen || !triggerRef.current || !contentRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()
    const viewport = { width: window.innerWidth, height: window.innerHeight }

    const spaceBelow = viewport.height - triggerRect.bottom
    const spaceAbove = triggerRect.top
    const spaceRight = viewport.width - triggerRect.right
    const spaceLeft = triggerRect.left

    if (spaceBelow >= contentRect.height + 8) {
      setPosition('bottom')
    } else if (spaceAbove >= contentRect.height + 8) {
      setPosition('top')
    } else if (spaceRight >= contentRect.width + 8) {
      setPosition('right')
    } else if (spaceLeft >= contentRect.width + 8) {
      setPosition('left')
    } else {
      setPosition('bottom')
    }
  }, [isOpen])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        contentRef.current && !contentRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setOpen])

  // Close on escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, setOpen])

  const getContentStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      zIndex: 100,
      backgroundColor: 'var(--fd-background, #fff)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: '1px solid var(--fd-border, #e4e4e7)',
      minWidth: '160px',
    }

    switch (position) {
      case 'top':
        return { ...base, bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }
      case 'bottom':
        return { ...base, top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' }
      case 'left':
        return { ...base, right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' }
      case 'right':
        return { ...base, left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' }
    }
  }

  return (
    <div ref={triggerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div ref={contentRef} style={getContentStyle()}>
          {content}
        </div>
      )}
    </div>
  )
}
```

**Step 4: Run test**

Run: `bun test src/theme/SmartPopover.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/theme/SmartPopover.tsx src/theme/SmartPopover.test.tsx
git commit -m "feat: add SmartPopover component with auto-positioning"
```

---

## Task 5: Create PreviewsDashboard Component

**Context:** Dashboard shows all preview types in vertical sections with horizontal scrolling item cards.

**IMPORTANT:** For flows/atlas, thumbnails can't use the preview runtime (they're YAML-only, no TSX). Instead:
- Flows: Show first step's screen as thumbnail (if available)
- Atlas: Show placeholder or first node's screen (if available)

**Files:**
- Create: `src/theme/previews/PreviewsDashboard.tsx`

**Step 1: Create dashboard component with type-specific thumbnail handling**

Create `src/theme/previews/PreviewsDashboard.tsx`:

```typescript
import React, { useRef, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { previewUnits } from 'virtual:prev-previews'
import type { PreviewUnit, PreviewType, FlowStepNew, AtlasNode } from '../../vite/preview-types'
import type { PreviewConfig, PreviewMessage } from '../../preview-runtime/types'

const TYPE_META: Record<PreviewType, { label: string; description: string; plural: string }> = {
  component: { label: 'Components', description: 'UI building blocks', plural: 'components' },
  screen: { label: 'Screens', description: 'Full page layouts', plural: 'screens' },
  flow: { label: 'Flows', description: 'Interactive journeys', plural: 'flows' },
  atlas: { label: 'Atlas', description: 'Architecture maps', plural: 'atlas' },
}

const TYPE_ORDER: PreviewType[] = ['component', 'screen', 'flow', 'atlas']

function groupByType(units: PreviewUnit[]): Record<PreviewType, PreviewUnit[]> {
  const groups: Record<PreviewType, PreviewUnit[]> = {
    component: [], screen: [], flow: [], atlas: [],
  }
  for (const unit of units) {
    groups[unit.type].push(unit)
  }
  return groups
}

// Standard thumbnail for components/screens (uses preview runtime)
function StandardThumbnail({ unit, typeSlug }: { unit: PreviewUnit; typeSlug: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const isDev = import.meta.env?.DEV ?? false
  const baseUrl = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')
  const previewSrc = `${typeSlug}/${unit.name}`
  const previewUrl = isDev
    ? `/_preview-runtime?src=${previewSrc}`
    : `${baseUrl}/_preview/${previewSrc}/`

  useEffect(() => {
    if (!isDev) {
      const iframe = iframeRef.current
      if (iframe) iframe.onload = () => setIsLoaded(true)
      return
    }

    const iframe = iframeRef.current
    if (!iframe) return

    let configSent = false

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data as PreviewMessage

      if (msg.type === 'ready' && !configSent) {
        configSent = true
        fetch(`/_preview-config/${previewSrc}`)
          .then(res => res.json())
          .then((config: PreviewConfig) => {
            iframe.contentWindow?.postMessage({ type: 'init', config } as PreviewMessage, '*')
          })
          .catch(() => setIsLoaded(true))
      }

      if (msg.type === 'built') setIsLoaded(true)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [isDev, previewSrc])

  return (
    <div style={{
      height: '140px',
      backgroundColor: 'var(--fd-muted)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {!isLoaded && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--fd-muted-foreground)', fontSize: '12px',
        }}>
          Loading...
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={previewUrl}
        style={{
          width: '200%', height: '200%', border: 'none',
          transform: 'scale(0.5)', transformOrigin: 'top left',
          pointerEvents: 'none', opacity: isLoaded ? 1 : 0,
        }}
        title={unit.config?.title || unit.name}
        loading="lazy"
      />
    </div>
  )
}

// Flow thumbnail - shows first step's screen OR placeholder
function FlowThumbnail({ unit }: { unit: PreviewUnit }) {
  const steps = (unit.config?.steps || []) as FlowStepNew[]
  const firstStep = steps[0]

  // If first step has a screen, show that screen's thumbnail
  if (firstStep?.screen) {
    return (
      <StandardThumbnail
        unit={{ ...unit, type: 'screen', name: firstStep.screen }}
        typeSlug="screens"
      />
    )
  }

  // Placeholder for flows without screens
  return (
    <div style={{
      height: '140px',
      backgroundColor: 'var(--fd-muted)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'var(--fd-muted-foreground)',
    }}>
      <span style={{ fontSize: '24px' }}>→</span>
      <span style={{ fontSize: '12px', marginTop: '4px' }}>{steps.length} steps</span>
    </div>
  )
}

// Helper to extract screen from atlas node (supports both `screen` and legacy `ref` format)
function getAtlasNodeScreen(node: AtlasNode): string | null {
  if (node.screen) return node.screen
  // Legacy: ref is "screens/login" format - extract the screen name
  if (node.ref) {
    const match = node.ref.match(/^screens\/(.+)$/)
    if (match) return match[1]
  }
  return null
}

// Atlas thumbnail - shows first node's screen OR placeholder
function AtlasThumbnail({ unit }: { unit: PreviewUnit }) {
  const nodes = (unit.config?.nodes || []) as AtlasNode[]
  // Find first node with a screen (either screen or ref field)
  const firstNodeWithScreen = nodes.find(n => getAtlasNodeScreen(n))
  const screenName = firstNodeWithScreen ? getAtlasNodeScreen(firstNodeWithScreen) : null

  // If any node has a screen, show that screen's thumbnail
  if (screenName) {
    return (
      <StandardThumbnail
        unit={{ ...unit, type: 'screen', name: screenName }}
        typeSlug="screens"
      />
    )
  }

  // Placeholder for atlas without screens
  return (
    <div style={{
      height: '140px',
      backgroundColor: 'var(--fd-muted)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'var(--fd-muted-foreground)',
    }}>
      <span style={{ fontSize: '20px' }}>○──○──○</span>
      <span style={{ fontSize: '12px', marginTop: '4px' }}>{nodes.length} nodes</span>
    </div>
  )
}

// Dispatch to appropriate thumbnail based on type
function PreviewThumbnail({ unit, type }: { unit: PreviewUnit; type: PreviewType }) {
  const meta = TYPE_META[type]

  switch (type) {
    case 'flow':
      return <FlowThumbnail unit={unit} />
    case 'atlas':
      return <AtlasThumbnail unit={unit} />
    default:
      return <StandardThumbnail unit={unit} typeSlug={meta.plural} />
  }
}

function PreviewCard({ unit, type }: { unit: PreviewUnit; type: PreviewType }) {
  const meta = TYPE_META[type]

  return (
    <Link
      to={`/previews/${meta.plural}/${unit.name}`}
      style={{
        flex: '0 0 auto',
        width: '240px',
        borderRadius: '8px',
        border: '1px solid var(--fd-border)',
        overflow: 'hidden',
        textDecoration: 'none',
        backgroundColor: 'var(--fd-card)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
        e.currentTarget.style.borderColor = 'var(--fd-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = 'var(--fd-border)'
      }}
    >
      <PreviewThumbnail unit={unit} type={type} />
      <div style={{ padding: '12px' }}>
        <h3 style={{
          fontSize: '14px', fontWeight: 600,
          color: 'var(--fd-foreground)', margin: '0 0 4px 0',
        }}>
          {unit.config?.title || unit.name}
        </h3>
        {unit.config?.description && (
          <p style={{
            fontSize: '12px', color: 'var(--fd-muted-foreground)',
            margin: 0, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {unit.config.description}
          </p>
        )}
      </div>
    </Link>
  )
}

function CategoryRow({ type, units }: { type: PreviewType; units: PreviewUnit[] }) {
  const meta = TYPE_META[type]

  if (units.length === 0) return null

  return (
    <section style={{ marginBottom: '32px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--fd-foreground)', margin: 0 }}>
            {meta.label}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--fd-muted-foreground)', margin: '4px 0 0 0' }}>
            {meta.description}
          </p>
        </div>
        <Link
          to={`/previews/${meta.plural}`}
          style={{ fontSize: '14px', color: 'var(--fd-primary)', textDecoration: 'none' }}
        >
          View all ({units.length}) →
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
        {units.slice(0, 4).map(unit => (
          <PreviewCard key={unit.name} unit={unit} type={type} />
        ))}
      </div>
    </section>
  )
}

export function PreviewsDashboard() {
  const grouped = groupByType(previewUnits as PreviewUnit[])
  const totalCount = (previewUnits as PreviewUnit[]).length

  if (totalCount === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          No Previews Found
        </h1>
        <p style={{ color: 'var(--fd-muted-foreground)', marginBottom: '24px' }}>
          Create your first preview in the previews/ directory.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--fd-foreground)', margin: '0 0 8px 0' }}>
          Previews
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--fd-muted-foreground)', margin: 0 }}>
          Explore components, screens, flows, and architecture
        </p>
      </div>

      {TYPE_ORDER.map(type => (
        <CategoryRow key={type} type={type} units={grouped[type]} />
      ))}
    </div>
  )
}
```

**Step 2: Verify build**

Run: `bunx tsc --noEmit`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/theme/previews/PreviewsDashboard.tsx
git commit -m "feat: add PreviewsDashboard with type-specific thumbnails"
```

---

## Task 6: Create PreviewTypeGrid Component

**Files:**
- Create: `src/theme/previews/PreviewTypeGrid.tsx`

**Step 1: Create type grid component**

Create `src/theme/previews/PreviewTypeGrid.tsx` (uses same thumbnail pattern as Dashboard):

```typescript
import React, { useRef, useEffect, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { previewUnits } from 'virtual:prev-previews'
import type { PreviewUnit, PreviewType, FlowStepNew, AtlasNode } from '../../vite/preview-types'
import type { PreviewConfig, PreviewMessage } from '../../preview-runtime/types'

const TYPE_META: Record<string, { type: PreviewType; label: string; description: string }> = {
  components: { type: 'component', label: 'Components', description: 'UI building blocks' },
  screens: { type: 'screen', label: 'Screens', description: 'Full page layouts' },
  flows: { type: 'flow', label: 'Flows', description: 'Interactive journeys' },
  atlas: { type: 'atlas', label: 'Atlas', description: 'Architecture maps' },
}

// Standard thumbnail for components/screens
function StandardThumbnail({ unit, typeSlug }: { unit: PreviewUnit; typeSlug: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const isDev = import.meta.env?.DEV ?? false
  const baseUrl = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')
  const previewSrc = `${typeSlug}/${unit.name}`
  const previewUrl = isDev
    ? `/_preview-runtime?src=${previewSrc}`
    : `${baseUrl}/_preview/${previewSrc}/`

  useEffect(() => {
    if (!isDev) {
      const iframe = iframeRef.current
      if (iframe) iframe.onload = () => setIsLoaded(true)
      return
    }

    const iframe = iframeRef.current
    if (!iframe) return

    let configSent = false

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data as PreviewMessage

      if (msg.type === 'ready' && !configSent) {
        configSent = true
        fetch(`/_preview-config/${previewSrc}`)
          .then(res => res.json())
          .then((config: PreviewConfig) => {
            iframe.contentWindow?.postMessage({ type: 'init', config } as PreviewMessage, '*')
          })
          .catch(() => setIsLoaded(true))
      }

      if (msg.type === 'built') setIsLoaded(true)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [isDev, previewSrc])

  return (
    <div style={{ height: '180px', backgroundColor: 'var(--fd-muted)', position: 'relative', overflow: 'hidden' }}>
      {!isLoaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fd-muted-foreground)', fontSize: '12px' }}>
          Loading...
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={previewUrl}
        style={{ width: '200%', height: '200%', border: 'none', transform: 'scale(0.5)', transformOrigin: 'top left', pointerEvents: 'none', opacity: isLoaded ? 1 : 0 }}
        title={unit.config?.title || unit.name}
        loading="lazy"
      />
    </div>
  )
}

// Flow thumbnail
function FlowThumbnail({ unit }: { unit: PreviewUnit }) {
  const steps = (unit.config?.steps || []) as FlowStepNew[]
  const firstStep = steps[0]

  if (firstStep?.screen) {
    return <StandardThumbnail unit={{ ...unit, type: 'screen', name: firstStep.screen }} typeSlug="screens" />
  }

  return (
    <div style={{ height: '180px', backgroundColor: 'var(--fd-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--fd-muted-foreground)' }}>
      <span style={{ fontSize: '28px' }}>→</span>
      <span style={{ fontSize: '13px', marginTop: '8px' }}>{steps.length} steps</span>
    </div>
  )
}

// Helper to extract screen from atlas node (supports both `screen` and legacy `ref` format)
function getAtlasNodeScreenForGrid(node: AtlasNode): string | null {
  if (node.screen) return node.screen
  // Legacy: ref is "screens/login" format - extract the screen name
  if (node.ref) {
    const match = node.ref.match(/^screens\/(.+)$/)
    if (match) return match[1]
  }
  return null
}

// Atlas thumbnail - supports both screen and legacy ref
function AtlasThumbnail({ unit }: { unit: PreviewUnit }) {
  const nodes = (unit.config?.nodes || []) as AtlasNode[]
  // Find first node with a screen (either screen or ref field)
  const firstNodeWithScreen = nodes.find(n => getAtlasNodeScreenForGrid(n))
  const screenName = firstNodeWithScreen ? getAtlasNodeScreenForGrid(firstNodeWithScreen) : null

  if (screenName) {
    return <StandardThumbnail unit={{ ...unit, type: 'screen', name: screenName }} typeSlug="screens" />
  }

  return (
    <div style={{ height: '180px', backgroundColor: 'var(--fd-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--fd-muted-foreground)' }}>
      <span style={{ fontSize: '24px' }}>○──○──○</span>
      <span style={{ fontSize: '13px', marginTop: '8px' }}>{nodes.length} nodes</span>
    </div>
  )
}

// Dispatch to appropriate thumbnail
function PreviewThumbnail({ unit, typeSlug }: { unit: PreviewUnit; typeSlug: string }) {
  switch (typeSlug) {
    case 'flows':
      return <FlowThumbnail unit={unit} />
    case 'atlas':
      return <AtlasThumbnail unit={unit} />
    default:
      return <StandardThumbnail unit={unit} typeSlug={typeSlug} />
  }
}

export function PreviewTypeGrid() {
  const location = useLocation()

  // Extract type from URL path: /previews/components -> components
  // Since we use explicit routes (/components, /screens, /flows, /atlas),
  // there's no :type param - we derive it from the pathname
  const pathMatch = location.pathname.match(/\/previews\/(components|screens|flows|atlas)(?:\/|$)/)
  const typeSlug = pathMatch ? pathMatch[1] : null

  const meta = typeSlug ? TYPE_META[typeSlug] : null

  if (!meta) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Unknown preview type: {typeSlug}</p>
        <Link to="/previews">← Back to Previews</Link>
      </div>
    )
  }

  const units = (previewUnits as PreviewUnit[]).filter(u => u.type === meta.type)

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/previews" style={{ fontSize: '14px', color: 'var(--fd-muted-foreground)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          ← Previews
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--fd-foreground)', margin: '0 0 4px 0' }}>
          {meta.label}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--fd-muted-foreground)', margin: 0 }}>
          {meta.description} · {units.length} item{units.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {units.map(unit => (
          <Link
            key={unit.name}
            to={`/previews/${typeSlug}/${unit.name}`}
            style={{ borderRadius: '8px', border: '1px solid var(--fd-border)', overflow: 'hidden', textDecoration: 'none', backgroundColor: 'var(--fd-card)', transition: 'box-shadow 0.2s, border-color 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = 'var(--fd-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--fd-border)' }}
          >
            <PreviewThumbnail unit={unit} typeSlug={typeSlug} />
            <div style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--fd-foreground)', margin: '0 0 4px 0' }}>
                {unit.config?.title || unit.name}
              </h3>
              {unit.config?.description && (
                <p style={{ fontSize: '14px', color: 'var(--fd-muted-foreground)', margin: 0, lineHeight: 1.4 }}>
                  {unit.config.description}
                </p>
              )}
              {unit.config?.tags && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {unit.config.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--fd-muted)', color: 'var(--fd-muted-foreground)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `bunx tsc --noEmit`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/theme/previews/PreviewTypeGrid.tsx
git commit -m "feat: add PreviewTypeGrid component"
```

---

## Task 7: Create ScreenViewer with State Selector

**Files:**
- Create: `src/theme/previews/ScreenViewer.tsx`

**Step 1: Create screen viewer**

Create `src/theme/previews/ScreenViewer.tsx`:

```typescript
import React, { useState, useEffect } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { previewUnits } from 'virtual:prev-previews'
import { Preview } from '../Preview'
import { SmartPopover } from '../SmartPopover'
import { Icon } from '../icons'
import { useDevTools } from '../DevToolsContext'
import type { PreviewUnit } from '../../vite/preview-types'

export function ScreenViewer() {
  const params = useParams({ strict: false })
  const name = (params as any).name as string

  const unit = (previewUnits as PreviewUnit[]).find(
    u => u.type === 'screen' && u.name === name
  )

  const { setDevToolsContent } = useDevTools()

  // Get available states from config
  const states = unit?.config?.states ? Object.keys(unit.config.states) : ['default']
  // Use 'default' if it exists, otherwise use first available state
  const initialState = states.includes('default') ? 'default' : states[0] || 'default'
  const [selectedState, setSelectedState] = useState<string>(initialState)

  // Set state selector in toolbar
  useEffect(() => {
    if (!unit || states.length <= 1) {
      setDevToolsContent(null)
      return
    }

    setDevToolsContent(
      <SmartPopover
        trigger={
          <button style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '6px 10px', borderRadius: '4px', border: 'none',
            backgroundColor: 'transparent', color: 'var(--fd-muted-foreground)',
            fontSize: '13px', cursor: 'pointer',
          }}>
            State: {selectedState}
            <Icon name="chevron-down" size={14} />
          </button>
        }
        content={
          <div style={{ padding: '4px' }}>
            {states.map(state => (
              <button
                key={state}
                onClick={() => setSelectedState(state)}
                style={{
                  display: 'block', width: '100%', padding: '8px 12px',
                  border: 'none', backgroundColor: state === selectedState ? 'var(--fd-muted)' : 'transparent',
                  color: 'var(--fd-foreground)', fontSize: '13px',
                  textAlign: 'left', cursor: 'pointer', borderRadius: '4px',
                }}
              >
                {state}
              </button>
            ))}
          </div>
        }
      />
    )

    return () => setDevToolsContent(null)
  }, [unit, states, selectedState, setDevToolsContent])

  if (!unit) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Screen not found: {name}</p>
        <Link to="/previews/screens">← Back to Screens</Link>
      </div>
    )
  }

  const src = `screens/${name}${selectedState !== 'default' ? `?state=${selectedState}` : ''}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', backgroundColor: 'var(--fd-card)',
        borderBottom: '1px solid var(--fd-border)',
      }}>
        <Link to="/previews/screens" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--fd-muted-foreground)', textDecoration: 'none', fontSize: '14px' }}>
          <Icon name="arrow-left" size={16} />
          Screens
        </Link>
        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--fd-border)' }} />
        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--fd-foreground)' }}>
          {unit.config?.title || unit.name}
        </span>
      </div>

      {/* Preview */}
      <div style={{ flex: 1 }}>
        <Preview src={src} height="100%" />
      </div>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `bunx tsc --noEmit`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/theme/previews/ScreenViewer.tsx
git commit -m "feat: add ScreenViewer with state selector"
```

---

## Task 8: Create FlowViewer with Step Navigation

**NAVIGATION DESIGN:**
- **Footer "Next" button** uses `transition.to` to follow the flow graph (supports non-linear flows)
- **Dot navigation + arrow keys** use linear index for manual step browsing (intentional - allows reviewing any step)

This dual approach lets users both follow the designed flow path AND freely browse all steps.

**Files:**
- Create: `src/theme/previews/FlowViewer.tsx`
- Create: `src/theme/previews/FlowViewer.css`

**Step 1: Create flow viewer CSS**

Create `src/theme/previews/FlowViewer.css`:

```css
.flow-step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--fd-border);
  background-color: var(--fd-background);
  cursor: pointer;
  transition: all 0.2s;
}

.flow-step-dot.active {
  background-color: var(--fd-primary);
  border-color: var(--fd-primary);
}

.flow-step-dot.completed {
  background-color: var(--fd-primary);
  border-color: var(--fd-primary);
  opacity: 0.5;
}
```

**Step 2: Create flow viewer component with transition.to navigation**

Create `src/theme/previews/FlowViewer.tsx`:

```typescript
import React, { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { previewUnits } from 'virtual:prev-previews'
import { Preview } from '../Preview'
import { Icon } from '../icons'
import { useDevTools } from '../DevToolsContext'
import type { PreviewUnit, FlowStepNew, FlowTransition } from '../../vite/preview-types'
import './FlowViewer.css'

export function FlowViewer() {
  const params = useParams({ strict: false })
  const name = (params as any).name as string

  const unit = (previewUnits as PreviewUnit[]).find(
    u => u.type === 'flow' && u.name === name
  )

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const { setDevToolsContent } = useDevTools()

  const steps = (unit?.config?.steps || []) as FlowStepNew[]

  // Reset step index when navigating to a different flow
  useEffect(() => {
    setCurrentStepIndex(0)
  }, [name])
  const transitions = (unit?.config?.transitions || []) as FlowTransition[]
  const currentStep = steps[currentStepIndex]

  // Find transition FROM current step
  const transition = transitions.find(t => t.from === currentStep?.id)

  // Navigate to step by index
  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) setCurrentStepIndex(index)
  }, [steps.length])

  // Navigate using transition.to (finds target step by ID)
  const goToNextViaTransition = useCallback(() => {
    if (!transition) return

    // Find the step with id === transition.to
    const targetIndex = steps.findIndex(s => s.id === transition.to)
    if (targetIndex !== -1) {
      setCurrentStepIndex(targetIndex)
    }
  }, [transition, steps])

  // Simple prev/next for dot navigation
  const goNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }, [currentStepIndex, steps.length])

  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }, [currentStepIndex])

  // Step navigation in toolbar
  useEffect(() => {
    if (!unit || steps.length === 0) {
      setDevToolsContent(null)
      return
    }

    setDevToolsContent(
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={goPrev}
          disabled={currentStepIndex === 0}
          style={{
            padding: '4px', border: 'none', backgroundColor: 'transparent',
            color: currentStepIndex === 0 ? 'var(--fd-muted)' : 'var(--fd-muted-foreground)',
            cursor: currentStepIndex === 0 ? 'default' : 'pointer',
          }}
        >
          <Icon name="chevron-left" size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => goToStep(i)}
              className={`flow-step-dot ${i === currentStepIndex ? 'active' : i < currentStepIndex ? 'completed' : ''}`}
              title={step.title}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentStepIndex === steps.length - 1}
          style={{
            padding: '4px', border: 'none', backgroundColor: 'transparent',
            color: currentStepIndex === steps.length - 1 ? 'var(--fd-muted)' : 'var(--fd-muted-foreground)',
            cursor: currentStepIndex === steps.length - 1 ? 'default' : 'pointer',
          }}
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    )

    return () => setDevToolsContent(null)
  }, [unit, steps, currentStepIndex, goPrev, goNext, goToStep, setDevToolsContent])

  // Keyboard navigation (arrow keys use simple prev/next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goPrev, goNext])

  if (!unit) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Flow not found: {name}</p>
        <Link to="/previews/flows">← Back to Flows</Link>
      </div>
    )
  }

  if (!currentStep) {
    return <div style={{ padding: '40px' }}>No steps defined for this flow</div>
  }

  const src = `screens/${currentStep.screen}${currentStep.state ? `?state=${currentStep.state}` : ''}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', backgroundColor: 'var(--fd-card)',
        borderBottom: '1px solid var(--fd-border)',
      }}>
        <Link to="/previews/flows" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--fd-muted-foreground)', textDecoration: 'none', fontSize: '14px' }}>
          <Icon name="arrow-left" size={16} />
          Flows
        </Link>
        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--fd-border)' }} />
        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--fd-foreground)' }}>
          {unit.config?.title || unit.name}
        </span>
      </div>

      {/* Preview */}
      <div style={{ flex: 1 }}>
        <Preview src={src} height="100%" />
      </div>

      {/* Step info footer */}
      <div style={{
        padding: '12px 16px', backgroundColor: 'var(--fd-card)',
        borderTop: '1px solid var(--fd-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ fontWeight: 600, color: 'var(--fd-foreground)' }}>{currentStep.title}</span>
          {currentStep.description && (
            <span style={{ color: 'var(--fd-muted-foreground)', marginLeft: '8px' }}>· {currentStep.description}</span>
          )}
        </div>
        {/* Use transition.to for navigation, not index+1 */}
        {transition && (
          <button
            onClick={goToNextViaTransition}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 12px', borderRadius: '4px', border: 'none',
              backgroundColor: 'var(--fd-primary)', color: 'var(--fd-primary-foreground)',
              fontSize: '13px', cursor: 'pointer',
            }}
          >
            {transition.trigger} →
          </button>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Verify build**

Run: `bunx tsc --noEmit`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/theme/previews/FlowViewer.tsx src/theme/previews/FlowViewer.css
git commit -m "feat: add FlowViewer with transition.to navigation"
```

---

## Task 9: Install Dagre and Create AtlasCanvas (Handle Optional screen)

**IMPORTANT FIX:** AtlasCanvas must handle nodes where `screen` is optional. Only render thumbnail if screen exists.

**Files:**
- Modify: `package.json`
- Create: `src/theme/previews/AtlasCanvas.tsx`
- Create: `src/theme/previews/AtlasCanvas.css`

**Step 1: Install dagre**

```bash
bun add dagre @types/dagre
```

**Step 2: Create atlas canvas CSS**

Create `src/theme/previews/AtlasCanvas.css`:

```css
.atlas-canvas {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
  background-color: var(--fd-muted);
  background-image: radial-gradient(circle, var(--fd-border) 1px, transparent 1px);
  background-size: 20px 20px;
}

.atlas-node {
  position: absolute;
  border-radius: 8px;
  border: 2px solid var(--fd-border);
  background-color: var(--fd-card);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.atlas-node:hover {
  border-color: var(--fd-primary);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.atlas-node.no-screen {
  cursor: default;
}

.atlas-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.atlas-overlay-content {
  width: 90%;
  max-width: 900px;
  height: 80%;
  background-color: var(--fd-background);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.atlas-overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--fd-border);
}

.atlas-condition-tab {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  color: var(--fd-muted-foreground);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.atlas-condition-tab.active {
  background-color: var(--fd-primary);
  color: var(--fd-primary-foreground);
}
```

**Step 3: Create atlas canvas component with optional screen handling**

Create `src/theme/previews/AtlasCanvas.tsx`:

```typescript
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import dagre from 'dagre'
import { previewUnits } from 'virtual:prev-previews'
import { Preview } from '../Preview'
import { Icon } from '../icons'
import { useDevTools } from '../DevToolsContext'
import type { PreviewUnit, AtlasNode, AtlasCondition, AtlasRelationship } from '../../vite/preview-types'
import type { PreviewConfig, PreviewMessage } from '../../preview-runtime/types'
import './AtlasCanvas.css'

const NODE_WIDTH = 180
const NODE_HEIGHT = 140

interface LayoutNode extends AtlasNode {
  x: number
  y: number
}

function computeLayout(nodes: AtlasNode[], relationships: AtlasRelationship[], condition: string): LayoutNode[] {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 80 })
  g.setDefaultEdgeLabel(() => ({}))

  const visibleNodes = nodes.filter(n => !n.visible || n.visible.includes(condition))

  for (const node of visibleNodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  const visibleRelationships = relationships.filter(r =>
    (!r.visible || r.visible.includes(condition)) &&
    visibleNodes.some(n => n.id === r.from) &&
    visibleNodes.some(n => n.id === r.to)
  )

  for (const rel of visibleRelationships) {
    g.setEdge(rel.from, rel.to)
  }

  dagre.layout(g)

  return visibleNodes.map(node => {
    const layoutNode = g.node(node.id)
    return {
      ...node,
      x: layoutNode.x - NODE_WIDTH / 2,
      y: layoutNode.y - NODE_HEIGHT / 2,
    }
  })
}

// Helper to extract screen from node (supports both `screen` and legacy `ref` format)
function getNodeScreen(node: AtlasNode): string | null {
  if (node.screen) return node.screen
  // Legacy: ref is "screens/login" format - extract the screen name
  if (node.ref) {
    const match = node.ref.match(/^screens\/(.+)$/)
    if (match) return match[1]
  }
  return null
}

// Atlas node thumbnail - ONLY renders iframe if node has a screen (or ref)
function AtlasNodeThumbnail({ node, condition }: { node: AtlasNode; condition: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const isDev = import.meta.env?.DEV ?? false
  const baseUrl = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')

  // Get screen from either `screen` or legacy `ref` field
  const screen = getNodeScreen(node)

  // GUARD: If no screen, render placeholder
  if (!screen) {
    return (
      <div style={{
        height: NODE_HEIGHT - 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--fd-muted)', color: 'var(--fd-muted-foreground)',
        fontSize: '12px',
      }}>
        No screen
      </div>
    )
  }

  const state = node.stateOverrides?.[condition] || node.state || 'default'
  // Split path and query to avoid malformed URLs like /_preview/screens/foo?state=bar/
  const previewPath = `screens/${screen}`
  const stateQuery = state !== 'default' ? `?state=${state}` : ''
  const previewUrl = isDev
    ? `/_preview-runtime?src=${previewPath}${stateQuery}`
    : `${baseUrl}/_preview/${previewPath}/${stateQuery}`

  useEffect(() => {
    if (!isDev) {
      const iframe = iframeRef.current
      if (iframe) iframe.onload = () => setIsLoaded(true)
      return
    }

    const iframe = iframeRef.current
    if (!iframe) return

    let configSent = false

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data as PreviewMessage

      if (msg.type === 'ready' && !configSent) {
        configSent = true
        // Config endpoint uses path only (no query) - config.yaml doesn't have state info
        fetch(`/_preview-config/${previewPath}`)
          .then(res => res.json())
          .then((config: PreviewConfig) => {
            iframe.contentWindow?.postMessage({ type: 'init', config } as PreviewMessage, '*')
          })
          .catch(() => setIsLoaded(true))
      }

      if (msg.type === 'built') setIsLoaded(true)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [isDev, previewPath, stateQuery])  // Include stateQuery so effect reruns when condition changes

  return (
    <iframe
      ref={iframeRef}
      src={previewUrl}
      style={{
        width: '300%', height: '300%', border: 'none',
        transform: 'scale(0.33)', transformOrigin: 'top left',
        pointerEvents: 'none', opacity: isLoaded ? 1 : 0.5,
      }}
      title={node.title}
      loading="lazy"
    />
  )
}

export function AtlasCanvas() {
  const params = useParams({ strict: false })
  const name = (params as any).name as string

  const unit = (previewUnits as PreviewUnit[]).find(
    u => u.type === 'atlas' && u.name === name
  )

  const conditions = (unit?.config?.conditions || []) as AtlasCondition[]
  const defaultCondition = conditions.find(c => c.default)?.id || conditions[0]?.id || 'default'

  const [selectedCondition, setSelectedCondition] = useState(defaultCondition)
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null)
  const { setDevToolsContent } = useDevTools()

  // Reset state when navigating to a different atlas
  useEffect(() => {
    setSelectedCondition(defaultCondition)
    setSelectedNode(null)
  }, [name, defaultCondition])

  const nodes = (unit?.config?.nodes || []) as AtlasNode[]
  const relationships = (unit?.config?.relationships || []) as AtlasRelationship[]

  const layoutNodes = useMemo(() =>
    computeLayout(nodes, relationships, selectedCondition),
    [nodes, relationships, selectedCondition]
  )

  // Condition tabs in toolbar
  useEffect(() => {
    if (!unit || conditions.length <= 1) {
      setDevToolsContent(null)
      return
    }

    setDevToolsContent(
      <div style={{ display: 'flex', gap: '4px' }}>
        {conditions.map(cond => (
          <button
            key={cond.id}
            onClick={() => setSelectedCondition(cond.id)}
            className={`atlas-condition-tab ${cond.id === selectedCondition ? 'active' : ''}`}
          >
            {cond.title}
          </button>
        ))}
      </div>
    )

    return () => setDevToolsContent(null)
  }, [unit, conditions, selectedCondition, setDevToolsContent])

  if (!unit) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Atlas not found: {name}</p>
        <Link to="/previews/atlas">← Back to Atlas</Link>
      </div>
    )
  }

  const canvasWidth = Math.max(800, ...layoutNodes.map(n => n.x + NODE_WIDTH + 40))
  const canvasHeight = Math.max(600, ...layoutNodes.map(n => n.y + NODE_HEIGHT + 40))

  const getNodeState = (node: AtlasNode): string => {
    return node.stateOverrides?.[selectedCondition] || node.state || 'default'
  }

  // Only open overlay for nodes WITH screens (supports both screen and ref)
  const handleNodeClick = (node: LayoutNode) => {
    if (getNodeScreen(node)) {
      setSelectedNode(node)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', backgroundColor: 'var(--fd-card)',
        borderBottom: '1px solid var(--fd-border)',
      }}>
        <Link to="/previews/atlas" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--fd-muted-foreground)', textDecoration: 'none', fontSize: '14px' }}>
          <Icon name="arrow-left" size={16} />
          Atlas
        </Link>
        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--fd-border)' }} />
        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--fd-foreground)' }}>
          {unit.config?.title || unit.name}
        </span>
      </div>

      {/* Canvas */}
      <div className="atlas-canvas" style={{ flex: 1 }}>
        <div style={{ width: canvasWidth, height: canvasHeight, position: 'relative' }}>
          {/* Edges */}
          <svg width={canvasWidth} height={canvasHeight} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            {relationships
              .filter(r => (!r.visible || r.visible.includes(selectedCondition)) && layoutNodes.some(n => n.id === r.from) && layoutNodes.some(n => n.id === r.to))
              .map(rel => {
                const from = layoutNodes.find(n => n.id === rel.from)
                const to = layoutNodes.find(n => n.id === rel.to)
                if (!from || !to) return null

                const x1 = from.x + NODE_WIDTH
                const y1 = from.y + NODE_HEIGHT / 2
                const x2 = to.x
                const y2 = to.y + NODE_HEIGHT / 2

                return (
                  <g key={`${rel.from}-${rel.to}`}>
                    <line x1={x1} y1={y1} x2={x2 - 8} y2={y2} stroke="var(--fd-border)" strokeWidth={2} />
                    <polygon points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`} fill="var(--fd-border)" />
                    {rel.label && (
                      <text x={(x1 + x2) / 2} y={y1 - 8} fontSize={11} fill="var(--fd-muted-foreground)" textAnchor="middle">
                        {rel.label}
                      </text>
                    )}
                  </g>
                )
              })}
          </svg>

          {/* Nodes */}
          {layoutNodes.map(node => (
            <div
              key={node.id}
              className={`atlas-node ${!getNodeScreen(node) ? 'no-screen' : ''}`}
              style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
              onClick={() => handleNodeClick(node)}
            >
              <div style={{ height: NODE_HEIGHT - 36, overflow: 'hidden' }}>
                <AtlasNodeThumbnail node={node} condition={selectedCondition} />
              </div>
              <div style={{ padding: '6px 8px', borderTop: '1px solid var(--fd-border)', backgroundColor: 'var(--fd-card)' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--fd-foreground)' }}>
                  {node.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Node overlay - ONLY for nodes with screens (supports both screen and ref) */}
      {selectedNode && getNodeScreen(selectedNode) && (
        <div className="atlas-overlay" onClick={() => setSelectedNode(null)}>
          <div className="atlas-overlay-content" onClick={e => e.stopPropagation()}>
            <div className="atlas-overlay-header">
              <span style={{ fontWeight: 600, fontSize: '16px' }}>{selectedNode.title}</span>
              <button onClick={() => setSelectedNode(null)} style={{ padding: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--fd-muted-foreground)' }}>
                <Icon name="x" size={20} />
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <Preview src={`screens/${getNodeScreen(selectedNode)}?state=${getNodeState(selectedNode)}`} height="100%" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 4: Verify build**

Run: `bunx tsc --noEmit`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add package.json bun.lock src/theme/previews/AtlasCanvas.tsx src/theme/previews/AtlasCanvas.css
git commit -m "feat: add AtlasCanvas with optional screen handling"
```

---

## Task 10: Update Router with New Routes (Fix Legacy Path)

**IMPORTANT FIX:** Legacy backwards-compat route must be at `/previews/$` (plural), NOT `/preview/$` (singular).

**Files:**
- Modify: `src/theme/entry.tsx`

**Step 1: Add imports for new components**

Add at top of `src/theme/entry.tsx`:

```typescript
import { PreviewsDashboard } from './previews/PreviewsDashboard'
import { PreviewTypeGrid } from './previews/PreviewTypeGrid'
import { ScreenViewer } from './previews/ScreenViewer'
import { FlowViewer } from './previews/FlowViewer'
import { AtlasCanvas } from './previews/AtlasCanvas'
import { previewUnits } from 'virtual:prev-previews'
```

**Step 2: Create type-specific viewer router component**

Add before route definitions:

```typescript
// Type-specific preview viewer - routes to appropriate viewer based on type
// Extracts type from URL path since we use explicit routes
function TypeSpecificViewer() {
  const params = useParams({ strict: false })
  const name = (params as any).name as string
  const location = useLocation()

  // Extract type from URL path: /previews/components/button -> components
  const pathMatch = location.pathname.match(/\/previews\/(components|screens|flows|atlas)\//)
  const typeSlug = pathMatch ? pathMatch[1] : 'components'

  const typeMap: Record<string, string> = {
    components: 'component',
    screens: 'screen',
    flows: 'flow',
    atlas: 'atlas',
  }

  const unit = (previewUnits as any[]).find(u =>
    u.type === typeMap[typeSlug] && u.name === name
  )

  if (!unit) {
    return <Navigate to="/previews" />
  }

  switch (typeSlug) {
    case 'screens':
      return <ScreenViewer />
    case 'flows':
      return <FlowViewer />
    case 'atlas':
      return <AtlasCanvas />
    default:
      // Components and fallback use standard Preview
      return (
        <div className="preview-detail-page">
          <Preview src={`${typeSlug}/${name}`} height="100%" showHeader />
        </div>
      )
  }
}
```

**Step 3: Update route definitions**

Replace the previews route section with:

```typescript
// Previews layout route
const previewsLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/previews',
  component: () => <Outlet />,
})

// Dashboard (index)
const previewsDashboardRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/',
  component: PreviewsDashboard,
})

// IMPORTANT: Use explicit path segments for type routes to avoid shadowing legacy routes
// This ensures /previews/button-demo goes to legacy, /previews/components goes to type grid

// Type grids - EXPLICIT paths for each known type
const previewsComponentsRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/components',
  component: PreviewTypeGrid,
})

const previewsScreensRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/screens',
  component: PreviewTypeGrid,
})

const previewsFlowsRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/flows',
  component: PreviewTypeGrid,
})

const previewsAtlasRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/atlas',
  component: PreviewTypeGrid,
})

// Type-specific detail routes - EXPLICIT paths
const previewsComponentDetailRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/components/$name',
  component: TypeSpecificViewer,
})

const previewsScreenDetailRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/screens/$name',
  component: TypeSpecificViewer,
})

const previewsFlowDetailRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/flows/$name',
  component: TypeSpecificViewer,
})

const previewsAtlasDetailRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/atlas/$name',
  component: TypeSpecificViewer,
})

// Legacy flat preview route (backwards compat for existing links)
// This MUST come AFTER explicit routes to catch /previews/button-demo etc.
const legacyPreviewRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/$', // Splat catches anything not matched by explicit routes above
  component: PreviewPage, // Keep existing PreviewPage for legacy
})

// Build route tree with explicit paths first, then legacy fallback
const previewsRouteWithChildren = previewsLayoutRoute.addChildren([
  previewsDashboardRoute,
  // Explicit type grids
  previewsComponentsRoute,
  previewsScreensRoute,
  previewsFlowsRoute,
  previewsAtlasRoute,
  // Explicit type details
  previewsComponentDetailRoute,
  previewsScreenDetailRoute,
  previewsFlowDetailRoute,
  previewsAtlasDetailRoute,
  // Legacy fallback LAST
  legacyPreviewRoute,
])
```

**Step 4: Verify build**

Run: `bunx tsc --noEmit`
Expected: No TypeScript errors

**Step 5: Test locally**

Run: `bun run dev`
Navigate to: http://localhost:3000/previews
Expected: Dashboard with category rows (if previews exist in proper folders)

**Step 6: Commit**

```bash
git add src/theme/entry.tsx
git commit -m "feat: update router with dashboard and type-specific routes"
```

---

## Task 11: Extend Production Build for Multi-Type Previews

**Context:** The current build only uses `scanPreviews()` (flat structure). We need to also build from `scanPreviewUnits()` for the new type folders. Note: flows/atlas are YAML-only so we don't build HTML for them (they reference screens).

**Files:**
- Modify: `src/vite/plugins/previews-plugin.ts`

**Step 1: Update closeBundle to handle multi-type structure**

In `src/vite/plugins/previews-plugin.ts`, update the `closeBundle` hook:

```typescript
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

  // Scan both flat previews (legacy) and multi-type units
  const allLegacyPreviews = await scanPreviews(rootDir)
  const units = await scanPreviewUnits(rootDir)

  // IMPORTANT: Filter out multi-type folders from legacy scan to avoid double builds
  // Legacy paths like "components/button" should NOT be built again via scanPreviewUnits
  const multiTypeFolders = ['components/', 'screens/', 'flows/', 'atlas/']
  const legacyPreviews = allLegacyPreviews.filter(p =>
    !multiTypeFolders.some(folder => p.name.startsWith(folder))
  )

  // Count only buildable items (components/screens with TSX)
  const buildableUnits = units.filter(u =>
    (u.type === 'component' || u.type === 'screen') &&
    u.files.index?.endsWith('.tsx')
  )

  const totalCount = legacyPreviews.length + buildableUnits.length
  if (totalCount === 0) return

  console.log(`\n  Building ${totalCount} preview(s)...`)

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

  // Step 2: Build legacy flat previews
  for (const preview of legacyPreviews) {
    const previewDir = path.join(previewsDir, preview.name)

    try {
      const config = await buildPreviewConfig(previewDir)
      const depth = preview.name.split('/').length
      const vendorPath = '../'.repeat(depth) + '_vendors/runtime.js'

      const result = await buildOptimizedPreview(config, { vendorPath })

      if (!result.success) {
        console.error(`    ✗ ${preview.name}: ${result.error}`)
        continue
      }

      const outputDir = path.join(targetDir, preview.name)
      mkdirSync(outputDir, { recursive: true })
      writeFileSync(path.join(outputDir, 'index.html'), result.html)
      console.log(`    ✓ ${preview.name}`)
    } catch (err) {
      console.error(`    ✗ ${preview.name}: ${err}`)
    }
  }

  // Step 3: Build multi-type preview units (components/screens ONLY)
  // Flows and atlas are YAML-only - they reference screens, don't have TSX
  const typeMap: Record<string, string> = {
    component: 'components',
    screen: 'screens',
  }

  for (const unit of buildableUnits) {
    const typeFolder = typeMap[unit.type]
    if (!typeFolder) continue

    try {
      const config = await buildPreviewConfig(unit.path)

      // Path: components/button -> ../../_vendors/runtime.js
      const vendorPath = '../../_vendors/runtime.js'

      const result = await buildOptimizedPreview(config, { vendorPath })

      if (!result.success) {
        console.error(`    ✗ ${typeFolder}/${unit.name}: ${result.error}`)
        continue
      }

      const outputDir = path.join(targetDir, typeFolder, unit.name)
      mkdirSync(outputDir, { recursive: true })
      writeFileSync(path.join(outputDir, 'index.html'), result.html)
      console.log(`    ✓ ${typeFolder}/${unit.name}`)
    } catch (err) {
      console.error(`    ✗ ${typeFolder}/${unit.name}: ${err}`)
    }
  }
}
```

**Step 2: Verify build works**

Run: `bun run build`
Expected: Build succeeds, outputs previews to dist/_preview/

**Step 3: Commit**

```bash
git add src/vite/plugins/previews-plugin.ts
git commit -m "feat: extend production build for multi-type previews"
```

---

## Task 12: Update Virtual Module Types

**Files:**
- Modify: `src/types/virtual.d.ts`

**Step 1: Ensure previewUnits is properly typed**

Verify/update `src/types/virtual.d.ts`:

```typescript
declare module 'virtual:prev-previews' {
  import type { PreviewUnit } from '../vite/preview-types'

  export const previews: Array<{ name: string; route: string }>
  export const previewUnits: PreviewUnit[]

  export function getByType(type: string): PreviewUnit[]
  export function getByTags(tags: string[]): PreviewUnit[]
  export function getByCategory(category: string): PreviewUnit[]
  export function getByStatus(status: string): PreviewUnit[]
}
```

**Step 2: Commit**

```bash
git add src/types/virtual.d.ts
git commit -m "chore: ensure virtual module types include previewUnits"
```

---

## Task 13: Final Integration Test

**Step 1: Run full test suite**

```bash
bun test
```

Expected: All tests pass

**Step 2: Type check (CLI and vite code)**

```bash
bunx tsc --noEmit
```

Expected: No TypeScript errors

**NOTE:** The tsconfig excludes `src/theme/**/*` intentionally (theme is compiled by Vite, not tsc). The production build in Step 3 validates theme TypeScript via Vite's compiler.

**Step 3: Build production (validates all code including theme)**

```bash
bun run build
```

Expected: Build succeeds without errors. Vite will catch any TypeScript errors in theme components.

**Step 4: Test locally**

```bash
bun run dev
```

Test navigation:
1. `/previews` - Dashboard with categories
2. `/previews/components` - Components grid
3. `/previews/screens/{name}` - Screen with state selector
4. `/previews/flows/{name}` - Flow with step navigation (using transition.to)
5. `/previews/atlas/{name}` - Atlas canvas (handles nodes without screens)

**Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "feat: complete IA and flows implementation"
```

---

## Summary

This plan addresses ALL issues from the NINTH Codex review:

### NINTH REVIEW FIXES:
1. **FlowViewer stale state (Task 8)** - Added `useEffect` to reset `currentStepIndex` to 0 when `name` changes, preventing stale step display when navigating between flows.
2. **AtlasCanvas stale state (Task 9)** - Added `useEffect` to reset `selectedCondition` to default and `selectedNode` to null when `name` changes, preventing stale condition tabs or overlay.
3. **bun.lockb -> bun.lock (Tasks 3, 9)** - Fixed commit instructions to reference correct lockfile name `bun.lock`.

### EIGHTH REVIEW FIXES (still in place):
1. **AtlasNodeThumbnail useEffect dependency (Task 9)** - Changed from undefined `previewSrc` to `previewPath, stateQuery` in useEffect dependencies. This fixes the compile error and ensures effect reruns when condition changes (triggering config resend to iframe).

### SEVENTH REVIEW FIXES (still in place):
1. **AtlasNodeThumbnail URL construction (Task 9)** - Split `previewPath` and `stateQuery` to avoid malformed URLs like `/_preview/screens/foo?state=bar/`. Now correctly produces `/_preview/screens/foo/?state=bar`. Config fetch uses path only.

### SIXTH REVIEW FIXES (still in place):
1. **PreviewTypeGrid uses useLocation instead of useParams (Task 6)** - Since explicit routes (`/components`, `/screens`, etc.) don't have a `:type` param, `PreviewTypeGrid` now extracts typeSlug from `location.pathname` using regex `/previews/(components|screens|flows|atlas)`.

### FIFTH REVIEW FIXES (still in place):
1. **Legacy route routing fixed (Task 10)** - Changed from dynamic `/$type` to explicit `/components`, `/screens`, `/flows`, `/atlas` routes. Legacy splat `/$` now correctly catches `/previews/button-demo` etc.

2. **FlowViewer navigation clarified (Task 8)** - Footer button uses `transition.to` for flow-directed navigation. Dots + arrow keys use linear index for manual browsing (intentional design).

3. **PreviewTypeGrid Atlas thumbnail (Task 6)** - Added `getAtlasNodeScreenForGrid` helper to support legacy `ref` format.

4. **AtlasCanvas no-screen class (Task 9)** - Changed from `!node.screen` to `!getNodeScreen(node)` to support legacy `ref` format.

5. **AtlasNodeThumbnail state usage (Task 9)** - Now includes state in `previewSrc` URL for condition-specific thumbnails.

### FOURTH REVIEW FIXES (still in place):
- `_preview-config` endpoint checks `config.yaml` for screens/components
- `parseConfig` returns `null` on failure (not `{}`)
- Atlas schema includes `ref`, `type`, `children` fields
- Double builds avoided by filtering multi-type folders
- ScreenViewer uses first available state if 'default' missing

### EARLIER FIXES (still in place):
- Legacy route path uses `/previews/$` (plural)
- FlowViewer footer button uses `transition.to` for navigation
- AtlasCanvas handles nodes without screens
- Added `@testing-library/react` dependency

**Execution choice:**

Plan complete and saved to `docs/plans/2026-01-22-ia-and-flows-impl.md`.

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
