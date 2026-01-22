# IA & Flows Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure previews showcase with dashboard, interactive flows, and atlas canvas views.

**Architecture:** Replace flat preview catalog with hierarchical IA: dashboard → type grids → type-specific viewers. Extend toolbar with dynamic content slot. Add dagre for atlas auto-layout.

**Tech Stack:** React, TanStack Router, dagre (auto-layout), zod (schema validation), existing Preview component

---

## Task 1: Delete Legacy Previews

**Files:**
- Delete: `previews/button-demo/`
- Delete: `previews/card-demo/`
- Delete: `previews/input-demo/`
- Delete: `previews/demo/`

**Step 1: Remove legacy directories**

```bash
rm -rf previews/button-demo previews/card-demo previews/input-demo previews/demo
```

**Step 2: Verify removal**

Run: `ls previews/`
Expected: Only `atlas/`, `components/`, `flows/`, `screens/` remain

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove legacy flat preview directories"
```

---

## Task 2: Extend Preview Schema Types

**Files:**
- Modify: `src/vite/preview-types.ts`
- Test: `src/vite/config-parser.test.ts`

**Step 1: Write test for extended schema**

Add to `src/vite/config-parser.test.ts`:

```typescript
test('parses screen config with states and triggers', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'prev-cli-test-'))
  const configPath = join(tempDir, 'config.yaml')

  writeFileSync(configPath, `
title: Dashboard
category: screens
states:
  default:
    user: null
  logged-in:
    user: { name: "John", role: "user" }
triggers:
  click_settings: "[data-nav='settings']"
`)

  const config = await parsePreviewConfig(configPath)

  expect(config?.states).toBeDefined()
  expect(config?.states?.default).toEqual({ user: null })
  expect(config?.triggers?.click_settings).toBe("[data-nav='settings']")

  rmSync(tempDir, { recursive: true })
})

test('parses flow config with steps and transitions', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'prev-cli-test-'))
  const configPath = join(tempDir, 'index.yaml')

  writeFileSync(configPath, `
title: Onboarding
category: flows
steps:
  - id: welcome
    title: Welcome
    screen: login
    state: default
  - id: signup
    title: Sign Up
    screen: login
    trigger: click_get_started
transitions:
  - from: welcome
    to: signup
    trigger: click_get_started
`)

  const config = await parsePreviewConfig(configPath)

  expect(config?.steps).toHaveLength(2)
  expect(config?.steps?.[0].screen).toBe('login')
  expect(config?.transitions?.[0].trigger).toBe('click_get_started')

  rmSync(tempDir, { recursive: true })
})

test('parses atlas config with conditions and nodes', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'prev-cli-test-'))
  const configPath = join(tempDir, 'index.yaml')

  writeFileSync(configPath, `
title: App Structure
category: atlas
conditions:
  - id: guest
    title: Guest
    default: true
  - id: user
    title: User
nodes:
  - id: login
    title: Login
    screen: login
    visible: [guest]
  - id: dashboard
    title: Dashboard
    screen: dashboard
    visible: [user]
relationships:
  - from: login
    to: dashboard
    label: success
`)

  const config = await parsePreviewConfig(configPath)

  expect(config?.conditions).toHaveLength(2)
  expect(config?.nodes).toHaveLength(2)
  expect(config?.relationships?.[0].label).toBe('success')

  rmSync(tempDir, { recursive: true })
})
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/vite/config-parser.test.ts`
Expected: FAIL - states, triggers, steps, transitions, conditions, nodes not in schema

**Step 3: Extend schema in preview-types.ts**

Replace content of `src/vite/preview-types.ts`:

```typescript
// src/vite/preview-types.ts
import { z } from 'zod'

// Preview content types
export type PreviewType = 'component' | 'screen' | 'flow' | 'atlas'

// Flow step schema
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

// Atlas node schema
const atlasNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  screen: z.string().optional(),
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

// Config.yaml schema - extended for all types
export const configSchema = z.object({
  // Common fields
  tags: z.union([
    z.array(z.string()),
    z.string().transform(s => [s])
  ]).optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'stable', 'deprecated']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),

  // Component: variants
  variants: z.record(z.record(z.unknown())).optional(),

  // Screen: states and triggers
  states: z.record(z.record(z.unknown())).optional(),
  triggers: z.record(z.string()).optional(),

  // Flow: steps and transitions
  steps: z.array(flowStepSchema).optional(),
  transitions: z.array(flowTransitionSchema).optional(),

  // Atlas: conditions, nodes, relationships
  conditions: z.array(atlasConditionSchema).optional(),
  nodes: z.array(atlasNodeSchema).optional(),
  relationships: z.array(atlasRelationshipSchema).optional(),
})

export type PreviewConfig = z.infer<typeof configSchema>

// Extended preview unit with type awareness
export interface PreviewUnit {
  type: PreviewType
  name: string
  path: string
  route: string
  config: PreviewConfig | null
  files: {
    index: string
    states?: string[]
    schema?: string
    docs?: string
  }
}

// Re-export step/node types for use in components
export type FlowStep = z.infer<typeof flowStepSchema>
export type FlowTransition = z.infer<typeof flowTransitionSchema>
export type AtlasCondition = z.infer<typeof atlasConditionSchema>
export type AtlasNode = z.infer<typeof atlasNodeSchema>
export type AtlasRelationship = z.infer<typeof atlasRelationshipSchema>
```

**Step 4: Run tests to verify they pass**

Run: `bun test src/vite/config-parser.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/vite/preview-types.ts src/vite/config-parser.test.ts
git commit -m "feat: extend preview schema for screens, flows, atlas"
```

---

## Task 3: Add SmartPopover Component

**Files:**
- Create: `src/theme/SmartPopover.tsx`
- Create: `src/theme/SmartPopover.test.tsx`

**Step 1: Write test for SmartPopover**

Create `src/theme/SmartPopover.test.tsx`:

```typescript
import { test, expect } from 'bun:test'
import { render } from '@testing-library/react'
import { SmartPopover } from './SmartPopover'

test('SmartPopover renders trigger and content', () => {
  // Basic render test - positioning logic tested visually
  const { getByText } = render(
    <SmartPopover
      trigger={<button>Open</button>}
      content={<div>Popover content</div>}
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
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    const spaceBelow = viewport.height - triggerRect.bottom
    const spaceAbove = triggerRect.top
    const spaceRight = viewport.width - triggerRect.right
    const spaceLeft = triggerRect.left

    // Prefer bottom, then top, then right, then left
    if (spaceBelow >= contentRect.height + 8) {
      setPosition('bottom')
    } else if (spaceAbove >= contentRect.height + 8) {
      setPosition('top')
    } else if (spaceRight >= contentRect.width + 8) {
      setPosition('right')
    } else if (spaceLeft >= contentRect.width + 8) {
      setPosition('left')
    } else {
      // Default to bottom if nothing fits well
      setPosition('bottom')
    }
  }, [isOpen])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
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

**Step 4: Run test to verify it passes**

Run: `bun test src/theme/SmartPopover.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/theme/SmartPopover.tsx src/theme/SmartPopover.test.tsx
git commit -m "feat: add SmartPopover component with auto-positioning"
```

---

## Task 4: Create PreviewsDashboard Component

**Files:**
- Create: `src/theme/previews/PreviewsDashboard.tsx`

**Step 1: Create dashboard component**

Create `src/theme/previews/PreviewsDashboard.tsx`:

```typescript
import React from 'react'
import { Link } from '@tanstack/react-router'
import { previewUnits } from 'virtual:prev-previews'
import type { PreviewUnit, PreviewType } from '../../vite/preview-types'

const TYPE_META: Record<PreviewType, { label: string; description: string; plural: string }> = {
  component: { label: 'Components', description: 'UI building blocks', plural: 'components' },
  screen: { label: 'Screens', description: 'Full page layouts', plural: 'screens' },
  flow: { label: 'Flows', description: 'Interactive journeys', plural: 'flows' },
  atlas: { label: 'Atlas', description: 'Architecture maps', plural: 'atlas' },
}

const TYPE_ORDER: PreviewType[] = ['component', 'screen', 'flow', 'atlas']

function groupByType(units: PreviewUnit[]): Record<PreviewType, PreviewUnit[]> {
  const groups: Record<PreviewType, PreviewUnit[]> = {
    component: [],
    screen: [],
    flow: [],
    atlas: [],
  }

  for (const unit of units) {
    groups[unit.type].push(unit)
  }

  return groups
}

interface CategoryRowProps {
  type: PreviewType
  units: PreviewUnit[]
}

function CategoryRow({ type, units }: CategoryRowProps) {
  const meta = TYPE_META[type]

  if (units.length === 0) return null

  return (
    <section style={{ marginBottom: '32px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--fd-foreground)',
            margin: 0,
          }}>
            {meta.label}
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--fd-muted-foreground)',
            margin: '4px 0 0 0',
          }}>
            {meta.description}
          </p>
        </div>
        <Link
          to={`/previews/${meta.plural}`}
          style={{
            fontSize: '14px',
            color: 'var(--fd-primary)',
            textDecoration: 'none',
          }}
        >
          View all ({units.length}) →
        </Link>
      </div>

      {/* Horizontal scroll of cards */}
      <div style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '8px',
      }}>
        {units.slice(0, 4).map(unit => (
          <PreviewCard key={unit.name} unit={unit} type={type} />
        ))}
      </div>
    </section>
  )
}

interface PreviewCardProps {
  unit: PreviewUnit
  type: PreviewType
}

function PreviewCard({ unit, type }: PreviewCardProps) {
  const meta = TYPE_META[type]

  // Get base URL for proper subpath deployment
  const baseUrl = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')
  const isDev = import.meta.env?.DEV ?? false
  const previewUrl = isDev
    ? `/_preview-runtime?src=${meta.plural}/${unit.name}`
    : `${baseUrl}/_preview/${meta.plural}/${unit.name}/`

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
      {/* Snapshot thumbnail */}
      <div style={{
        height: '140px',
        backgroundColor: 'var(--fd-muted)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <iframe
          src={previewUrl}
          style={{
            width: '200%',
            height: '200%',
            border: 'none',
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
          title={unit.config?.title || unit.name}
          loading="lazy"
        />
      </div>

      {/* Card content */}
      <div style={{ padding: '12px' }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--fd-foreground)',
          margin: '0 0 4px 0',
        }}>
          {unit.config?.title || unit.name}
        </h3>
        {unit.config?.description && (
          <p style={{
            fontSize: '12px',
            color: 'var(--fd-muted-foreground)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {unit.config.description}
          </p>
        )}
      </div>
    </Link>
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
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'var(--fd-foreground)',
          margin: '0 0 8px 0',
        }}>
          Previews
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--fd-muted-foreground)',
          margin: 0,
        }}>
          Explore components, screens, flows, and architecture
        </p>
      </div>

      {/* Category rows */}
      {TYPE_ORDER.map(type => (
        <CategoryRow key={type} type={type} units={grouped[type]} />
      ))}
    </div>
  )
}
```

**Step 2: Verify build**

Run: `bun run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/theme/previews/PreviewsDashboard.tsx
git commit -m "feat: add PreviewsDashboard with category rows"
```

---

## Task 5: Create PreviewTypeGrid Component

**Files:**
- Create: `src/theme/previews/PreviewTypeGrid.tsx`

**Step 1: Create type grid component**

Create `src/theme/previews/PreviewTypeGrid.tsx`:

```typescript
import React from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { previewUnits } from 'virtual:prev-previews'
import type { PreviewUnit, PreviewType } from '../../vite/preview-types'

const TYPE_META: Record<string, { type: PreviewType; label: string; description: string }> = {
  components: { type: 'component', label: 'Components', description: 'UI building blocks' },
  screens: { type: 'screen', label: 'Screens', description: 'Full page layouts' },
  flows: { type: 'flow', label: 'Flows', description: 'Interactive journeys' },
  atlas: { type: 'atlas', label: 'Atlas', description: 'Architecture maps' },
}

export function PreviewTypeGrid() {
  const params = useParams({ strict: false })
  const typeSlug = (params as any).type as string

  const meta = TYPE_META[typeSlug]

  if (!meta) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Unknown preview type: {typeSlug}</p>
        <Link to="/previews">← Back to Previews</Link>
      </div>
    )
  }

  const units = (previewUnits as PreviewUnit[]).filter(u => u.type === meta.type)

  // Get base URL for proper subpath deployment
  const baseUrl = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')
  const isDev = import.meta.env?.DEV ?? false

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          to="/previews"
          style={{
            fontSize: '14px',
            color: 'var(--fd-muted-foreground)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '12px',
          }}
        >
          ← Previews
        </Link>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'var(--fd-foreground)',
          margin: '0 0 4px 0',
        }}>
          {meta.label}
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--fd-muted-foreground)',
          margin: 0,
        }}>
          {meta.description} · {units.length} item{units.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
      }}>
        {units.map(unit => {
          const previewUrl = isDev
            ? `/_preview-runtime?src=${typeSlug}/${unit.name}`
            : `${baseUrl}/_preview/${typeSlug}/${unit.name}/`

          return (
            <Link
              key={unit.name}
              to={`/previews/${typeSlug}/${unit.name}`}
              style={{
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
              {/* Snapshot */}
              <div style={{
                height: '180px',
                backgroundColor: 'var(--fd-muted)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <iframe
                  src={previewUrl}
                  style={{
                    width: '200%',
                    height: '200%',
                    border: 'none',
                    transform: 'scale(0.5)',
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                  }}
                  title={unit.config?.title || unit.name}
                  loading="lazy"
                />
              </div>

              {/* Card content */}
              <div style={{ padding: '16px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--fd-foreground)',
                  margin: '0 0 4px 0',
                }}>
                  {unit.config?.title || unit.name}
                </h3>
                {unit.config?.description && (
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--fd-muted-foreground)',
                    margin: 0,
                    lineHeight: 1.4,
                  }}>
                    {unit.config.description}
                  </p>
                )}
                {unit.config?.tags && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {unit.config.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--fd-muted)',
                          color: 'var(--fd-muted-foreground)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `bun run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/theme/previews/PreviewTypeGrid.tsx
git commit -m "feat: add PreviewTypeGrid component"
```

---

## Task 6: Create ScreenViewer with State Selector

**Files:**
- Create: `src/theme/previews/ScreenViewer.tsx`

**Step 1: Create screen viewer component**

Create `src/theme/previews/ScreenViewer.tsx`:

```typescript
import React, { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
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

  const [selectedState, setSelectedState] = useState<string>('default')
  const { setDevToolsContent } = useDevTools()

  // Get available states from config
  const states = unit?.config?.states ? Object.keys(unit.config.states) : ['default']

  // State selector for toolbar
  useEffect(() => {
    if (!unit || states.length <= 1) {
      setDevToolsContent(null)
      return
    }

    const StateSelector = () => (
      <SmartPopover
        trigger={
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--fd-muted-foreground)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {selectedState}
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
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: state === selectedState ? 'var(--fd-muted)' : 'transparent',
                  color: 'var(--fd-foreground)',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                {state}
              </button>
            ))}
          </div>
        }
      />
    )

    setDevToolsContent(<StateSelector />)

    return () => setDevToolsContent(null)
  }, [unit, states, selectedState, setDevToolsContent])

  if (!unit) {
    return <div style={{ padding: '40px' }}>Screen not found: {name}</div>
  }

  // Build preview src with state parameter
  const src = `screens/${name}${selectedState !== 'default' ? `?state=${selectedState}` : ''}`

  return (
    <div style={{ height: '100%' }}>
      <Preview src={src} height="100%" showHeader />
    </div>
  )
}
```

**Step 2: Verify build**

Run: `bun run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/theme/previews/ScreenViewer.tsx
git commit -m "feat: add ScreenViewer with state selector"
```

---

## Task 7: Create FlowViewer with Step Navigation

**Files:**
- Create: `src/theme/previews/FlowViewer.tsx`
- Create: `src/theme/previews/FlowViewer.css`

**Step 1: Create flow viewer CSS**

Create `src/theme/previews/FlowViewer.css`:

```css
.flow-hotspot {
  position: absolute;
  border: 2px solid var(--fd-primary, #3b82f6);
  border-radius: 4px;
  background-color: rgba(59, 130, 246, 0.1);
  animation: pulse 2s ease-in-out infinite;
  pointer-events: auto;
  cursor: pointer;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

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

**Step 2: Create flow viewer component**

Create `src/theme/previews/FlowViewer.tsx`:

```typescript
import React, { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { previewUnits } from 'virtual:prev-previews'
import { Preview } from '../Preview'
import { Icon } from '../icons'
import { useDevTools } from '../DevToolsContext'
import type { PreviewUnit, FlowStep } from '../../vite/preview-types'
import './FlowViewer.css'

export function FlowViewer() {
  const params = useParams({ strict: false })
  const name = (params as any).name as string

  const unit = (previewUnits as PreviewUnit[]).find(
    u => u.type === 'flow' && u.name === name
  )

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const { setDevToolsContent } = useDevTools()

  const steps = unit?.config?.steps || []
  const currentStep = steps[currentStepIndex]

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index)
    }
  }

  const goNext = () => goToStep(currentStepIndex + 1)
  const goPrev = () => goToStep(currentStepIndex - 1)

  // Step navigation for toolbar
  useEffect(() => {
    if (!unit || steps.length === 0) {
      setDevToolsContent(null)
      return
    }

    const StepNav = () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={goPrev}
          disabled={currentStepIndex === 0}
          style={{
            padding: '4px',
            border: 'none',
            backgroundColor: 'transparent',
            color: currentStepIndex === 0 ? 'var(--fd-muted)' : 'var(--fd-muted-foreground)',
            cursor: currentStepIndex === 0 ? 'default' : 'pointer',
          }}
        >
          <Icon name="chevron-left" size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={`flow-step-dot ${i === currentStepIndex ? 'active' : i < currentStepIndex ? 'completed' : ''}`}
              title={steps[i].title}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentStepIndex === steps.length - 1}
          style={{
            padding: '4px',
            border: 'none',
            backgroundColor: 'transparent',
            color: currentStepIndex === steps.length - 1 ? 'var(--fd-muted)' : 'var(--fd-muted-foreground)',
            cursor: currentStepIndex === steps.length - 1 ? 'default' : 'pointer',
          }}
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    )

    setDevToolsContent(<StepNav />)

    return () => setDevToolsContent(null)
  }, [unit, steps, currentStepIndex, setDevToolsContent])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStepIndex, steps.length])

  if (!unit) {
    return <div style={{ padding: '40px' }}>Flow not found: {name}</div>
  }

  if (!currentStep) {
    return <div style={{ padding: '40px' }}>No steps defined for this flow</div>
  }

  // Find transition from current step
  const transition = unit.config?.transitions?.find(t => t.from === currentStep.id)

  // Build preview src for current step's screen
  const src = `screens/${currentStep.screen}${currentStep.state ? `?state=${currentStep.state}` : ''}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Preview area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Preview src={src} height="100%" showHeader />

        {/* TODO: Hotspot overlay - requires postMessage to iframe to get element positions */}
      </div>

      {/* Step info footer */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'var(--fd-card)',
        borderTop: '1px solid var(--fd-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ fontWeight: 600, color: 'var(--fd-foreground)' }}>
            {currentStep.title}
          </span>
          {currentStep.description && (
            <span style={{ color: 'var(--fd-muted-foreground)', marginLeft: '8px' }}>
              · {currentStep.description}
            </span>
          )}
        </div>
        {transition && (
          <button
            onClick={goNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'var(--fd-primary)',
              color: 'var(--fd-primary-foreground)',
              fontSize: '13px',
              cursor: 'pointer',
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

Run: `bun run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/theme/previews/FlowViewer.tsx src/theme/previews/FlowViewer.css
git commit -m "feat: add FlowViewer with step navigation"
```

---

## Task 8: Install Dagre and Create AtlasCanvas

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
  background-image:
    radial-gradient(circle, var(--fd-border) 1px, transparent 1px);
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

.atlas-edge {
  position: absolute;
  pointer-events: none;
}

.atlas-edge line {
  stroke: var(--fd-border);
  stroke-width: 2;
}

.atlas-edge polygon {
  fill: var(--fd-border);
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

.atlas-condition-tabs {
  display: flex;
  gap: 4px;
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

**Step 3: Create atlas canvas component**

Create `src/theme/previews/AtlasCanvas.tsx`:

```typescript
import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from '@tanstack/react-router'
import dagre from 'dagre'
import { previewUnits } from 'virtual:prev-previews'
import { Preview } from '../Preview'
import { Icon } from '../icons'
import { useDevTools } from '../DevToolsContext'
import type { PreviewUnit, AtlasNode, AtlasCondition, AtlasRelationship } from '../../vite/preview-types'
import './AtlasCanvas.css'

const NODE_WIDTH = 180
const NODE_HEIGHT = 140

interface LayoutNode extends AtlasNode {
  x: number
  y: number
}

function computeLayout(
  nodes: AtlasNode[],
  relationships: AtlasRelationship[],
  condition: string
): LayoutNode[] {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 80 })
  g.setDefaultEdgeLabel(() => ({}))

  // Filter nodes by visibility
  const visibleNodes = nodes.filter(n =>
    !n.visible || n.visible.includes(condition)
  )

  // Add nodes
  for (const node of visibleNodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  // Add edges
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

export function AtlasCanvas() {
  const params = useParams({ strict: false })
  const name = (params as any).name as string

  const unit = (previewUnits as PreviewUnit[]).find(
    u => u.type === 'atlas' && u.name === name
  )

  const conditions = unit?.config?.conditions || []
  const defaultCondition = conditions.find(c => c.default)?.id || conditions[0]?.id || 'default'

  const [selectedCondition, setSelectedCondition] = useState(defaultCondition)
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null)
  const { setDevToolsContent } = useDevTools()

  const nodes = unit?.config?.nodes || []
  const relationships = unit?.config?.relationships || []

  const layoutNodes = useMemo(() =>
    computeLayout(nodes, relationships, selectedCondition),
    [nodes, relationships, selectedCondition]
  )

  // Condition tabs for toolbar
  useEffect(() => {
    if (!unit || conditions.length <= 1) {
      setDevToolsContent(null)
      return
    }

    const ConditionTabs = () => (
      <div className="atlas-condition-tabs">
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

    setDevToolsContent(<ConditionTabs />)

    return () => setDevToolsContent(null)
  }, [unit, conditions, selectedCondition, setDevToolsContent])

  if (!unit) {
    return <div style={{ padding: '40px' }}>Atlas not found: {name}</div>
  }

  // Calculate canvas size
  const canvasWidth = Math.max(800, ...layoutNodes.map(n => n.x + NODE_WIDTH + 40))
  const canvasHeight = Math.max(600, ...layoutNodes.map(n => n.y + NODE_HEIGHT + 40))

  // Get base URL for previews
  const baseUrl = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')
  const isDev = import.meta.env?.DEV ?? false

  // Determine state for selected node based on condition
  const getNodeState = (node: AtlasNode): string => {
    if (node.stateOverrides?.[selectedCondition]) {
      return node.stateOverrides[selectedCondition]
    }
    return node.state || 'default'
  }

  return (
    <>
      <div className="atlas-canvas">
        <div style={{ width: canvasWidth, height: canvasHeight, position: 'relative' }}>
          {/* Edges */}
          <svg
            width={canvasWidth}
            height={canvasHeight}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            {relationships
              .filter(r =>
                (!r.visible || r.visible.includes(selectedCondition)) &&
                layoutNodes.some(n => n.id === r.from) &&
                layoutNodes.some(n => n.id === r.to)
              )
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
                    <polygon
                      points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`}
                      fill="var(--fd-border)"
                    />
                    {rel.label && (
                      <text
                        x={(x1 + x2) / 2}
                        y={y1 - 8}
                        fontSize={11}
                        fill="var(--fd-muted-foreground)"
                        textAnchor="middle"
                      >
                        {rel.label}
                      </text>
                    )}
                  </g>
                )
              })}
          </svg>

          {/* Nodes */}
          {layoutNodes.map(node => {
            const previewUrl = isDev
              ? `/_preview-runtime?src=screens/${node.screen}`
              : `${baseUrl}/_preview/screens/${node.screen}/`

            return (
              <div
                key={node.id}
                className="atlas-node"
                style={{
                  left: node.x,
                  top: node.y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                }}
                onClick={() => setSelectedNode(node)}
              >
                {/* Mini preview */}
                <div style={{ height: NODE_HEIGHT - 36, overflow: 'hidden' }}>
                  <iframe
                    src={previewUrl}
                    style={{
                      width: '300%',
                      height: '300%',
                      border: 'none',
                      transform: 'scale(0.33)',
                      transformOrigin: 'top left',
                      pointerEvents: 'none',
                    }}
                    title={node.title}
                    loading="lazy"
                  />
                </div>

                {/* Label */}
                <div style={{
                  padding: '6px 8px',
                  borderTop: '1px solid var(--fd-border)',
                  backgroundColor: 'var(--fd-card)',
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--fd-foreground)',
                  }}>
                    {node.title}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Node overlay */}
      {selectedNode && (
        <div className="atlas-overlay" onClick={() => setSelectedNode(null)}>
          <div className="atlas-overlay-content" onClick={e => e.stopPropagation()}>
            <div className="atlas-overlay-header">
              <span style={{ fontWeight: 600, fontSize: '16px' }}>{selectedNode.title}</span>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  padding: '4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--fd-muted-foreground)',
                }}
              >
                <Icon name="x" size={20} />
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <Preview
                src={`screens/${selectedNode.screen}?state=${getNodeState(selectedNode)}`}
                height="100%"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

**Step 4: Verify build**

Run: `bun run build`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add package.json bun.lockb src/theme/previews/AtlasCanvas.tsx src/theme/previews/AtlasCanvas.css
git commit -m "feat: add AtlasCanvas with auto-layout and overlays"
```

---

## Task 9: Update Router with New Routes

**Files:**
- Modify: `src/theme/entry.tsx`

**Step 1: Update entry.tsx with new routes**

Modify `src/theme/entry.tsx` to import and use new components:

Add imports at top:

```typescript
import { PreviewsDashboard } from './previews/PreviewsDashboard'
import { PreviewTypeGrid } from './previews/PreviewTypeGrid'
import { ScreenViewer } from './previews/ScreenViewer'
import { FlowViewer } from './previews/FlowViewer'
import { AtlasCanvas } from './previews/AtlasCanvas'
import { previewUnits } from 'virtual:prev-previews'
```

Replace the `PreviewsCatalog` component and `PreviewPage` with type-aware routing:

```typescript
// Type-specific preview viewer
function TypeSpecificViewer() {
  const params = useParams({ strict: false })
  const type = (params as any).type as string
  const name = (params as any).name as string

  // Find the unit to determine actual type
  const unit = (previewUnits as any[]).find(u => {
    const typeMap: Record<string, string> = {
      components: 'component',
      screens: 'screen',
      flows: 'flow',
      atlas: 'atlas',
    }
    return u.type === typeMap[type] && u.name === name
  })

  if (!unit) {
    return <Navigate to="/previews" />
  }

  // Render type-specific viewer
  switch (type) {
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
          <Preview src={`${type}/${name}`} height="100%" showHeader />
        </div>
      )
  }
}
```

Update route definitions:

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

// Type grid
const previewsTypeRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/$type',
  component: PreviewTypeGrid,
})

// Type-specific detail
const previewsDetailRoute = createRoute({
  getParentRoute: () => previewsLayoutRoute,
  path: '/$type/$name',
  component: TypeSpecificViewer,
})

// Build route tree
const previewsRouteWithChildren = previewsLayoutRoute.addChildren([
  previewsDashboardRoute,
  previewsTypeRoute,
  previewsDetailRoute,
])
```

**Step 2: Verify build**

Run: `bun run build`
Expected: No TypeScript errors

**Step 3: Test locally**

Run: `bun run dev`
Navigate to: http://localhost:3000/previews
Expected: Dashboard with category rows

**Step 4: Commit**

```bash
git add src/theme/entry.tsx
git commit -m "feat: update router with dashboard and type-specific routes"
```

---

## Task 10: Add Previews Dropdown to Toolbar

**Files:**
- Modify: `src/theme/Toolbar.tsx`

**Step 1: Update Toolbar with previews dropdown**

Modify `src/theme/Toolbar.tsx` to add smart popover for previews:

Add import:

```typescript
import { SmartPopover } from './SmartPopover'
import { previewUnits } from 'virtual:prev-previews'
```

Replace the previews Link with a SmartPopover:

```typescript
{previews && previews.length > 0 && (
  <SmartPopover
    trigger={
      <button className={`toolbar-btn ${isOnPreviews ? 'active' : ''}`} title="Previews">
        <Icon name="grid" size={18} />
      </button>
    }
    content={
      <div style={{ padding: '8px', minWidth: '180px' }}>
        {['components', 'screens', 'flows', 'atlas'].map(type => {
          const typeMap: Record<string, string> = {
            components: 'component',
            screens: 'screen',
            flows: 'flow',
            atlas: 'atlas',
          }
          const count = (previewUnits as any[]).filter(u => u.type === typeMap[type]).length
          if (count === 0) return null

          return (
            <Link
              key={type}
              to={`/previews/${type}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '4px',
                textDecoration: 'none',
                color: 'var(--fd-foreground)',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--fd-muted)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ textTransform: 'capitalize' }}>{type}</span>
              <span style={{ color: 'var(--fd-muted-foreground)', fontSize: '12px' }}>({count})</span>
            </Link>
          )
        })}
        <div style={{ borderTop: '1px solid var(--fd-border)', marginTop: '4px', paddingTop: '4px' }}>
          <Link
            to="/previews"
            style={{
              display: 'block',
              padding: '8px 12px',
              borderRadius: '4px',
              textDecoration: 'none',
              color: 'var(--fd-primary)',
              fontSize: '14px',
            }}
          >
            View all →
          </Link>
        </div>
      </div>
    }
  />
)}
```

**Step 2: Verify build**

Run: `bun run build`
Expected: No TypeScript errors

**Step 3: Test locally**

Run: `bun run dev`
Click previews icon in toolbar
Expected: Dropdown with type counts

**Step 4: Commit**

```bash
git add src/theme/Toolbar.tsx
git commit -m "feat: add previews dropdown to toolbar"
```

---

## Task 11: Update Virtual Module Types

**Files:**
- Modify: `src/types/virtual.d.ts`

**Step 1: Update virtual module declarations**

Modify `src/types/virtual.d.ts` to include previewUnits type:

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

**Step 2: Verify build**

Run: `bun run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/types/virtual.d.ts
git commit -m "chore: update virtual module types for previewUnits"
```

---

## Task 12: Final Integration Test

**Step 1: Run full test suite**

```bash
bun test
```

Expected: All tests pass

**Step 2: Build production**

```bash
bun run build
```

Expected: Build succeeds without errors

**Step 3: Test locally**

```bash
bun run dev
```

Test navigation:
1. `/previews` - Dashboard with categories
2. `/previews/components` - Components grid
3. `/previews/screens/login` - Screen with state selector
4. `/previews/flows/onboarding` - Flow with step navigation
5. `/previews/atlas/app-structure` - Atlas canvas

**Step 4: Commit final changes**

```bash
git add -A
git commit -m "feat: complete IA and flows implementation"
```

---

## Summary

This plan implements:

1. **Legacy cleanup** - Remove old flat previews
2. **Schema extension** - Add states, triggers, steps, conditions to config
3. **Smart popover** - Position-aware dropdown component
4. **Dashboard** - Vertical categories with horizontal item cards
5. **Type grid** - Grid view per type
6. **Screen viewer** - State selector in toolbar
7. **Flow viewer** - Step navigation with keyboard support
8. **Atlas canvas** - Auto-layout with dagre, condition tabs, overlays
9. **Router update** - New route structure
10. **Toolbar dropdown** - Quick access to preview types

**Execution choice:**

Plan complete and saved to `docs/plans/2026-01-22-ia-and-flows-impl.md`.

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
