# Renderer-Agnostic Previews Design

> Generalize prev-cli's preview system to separate configuration from rendering.

## Overview

**Goal:** Create a preview system where configs are renderer-agnostic. A screen config doesn't know or care if it'll be rendered with React, Solid, or vanilla HTML.

**Inspiration:** [vercel-labs/json-render](../refs/ref-json-render.md) - AI-constrained UI generation via schemas and catalogs.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  USERLAND (Configuration)                                   │
│  ─────────────────────────────────────────────────────────  │
│  previews/                                                  │
│    components/{id}/config.yaml       ← Component config     │
│    screens/{id}/config.yaml          ← Screen config        │
│    flows/{id}/config.yaml            ← Flow config          │
│    atlas/{id}/config.yaml            ← Atlas config         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ file-based discovery + validation
┌─────────────────────────────────────────────────────────────┐
│  APPLAND (Rendering)                                        │
│  ─────────────────────────────────────────────────────────  │
│  Scanner        → discovers units from file structure       │
│  Validator      → checks configs against JSON Schemas       │
│  RendererAdapter→ pluggable (React, Solid, HTML, etc.)      │
│  Output         → static HTML (prod) or HMR server (dev)    │
└─────────────────────────────────────────────────────────────┘
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Type structure | Distinct types (component, screen, flow, atlas) | Explicit schemas per type, easier validation |
| Renderer abstraction | Adapter pattern | Common interface, implementations per renderer |
| Output modes | Static HTML (prod), HMR (dev) | Fast iteration in dev, optimized for prod |
| Discovery | File-based, convention over config | Simple, matches existing structure |
| Validation | CLI command (`prev validate`) | Run in CI, clear error reporting |
| Schema format | JSON Schema | LSP/autocomplete support, language-agnostic |
| Layout abstraction | Minimal shared primitives | ComponentRef and Slot are shared; layout structure is renderer-specific |
| Adapter scope | Thin interface | Bundling/hydration handled by build system, not adapter |

## Schema Design

### Base Schema (all types extend)

```yaml
kind: component|screen|flow|atlas  # discriminator for LSP
id: string                          # unique within type, pattern: [a-z0-9-]+
title: string
description: string                 # optional
tags: string[]
status: draft|stable|deprecated
schemaVersion: "2.0"                # for migration
```

### Type-Specific Extensions

**Component:**
```yaml
kind: component
id: button
title: Button
props:
  label: { type: string, required: true }
  variant: { type: string, enum: [primary, secondary], default: primary }
slots:
  icon: { description: "Leading icon slot" }
```

**Screen:**
```yaml
kind: screen
id: login
title: Login Screen
states:
  default: { description: "Initial state" }
  loading: { description: "Submitting credentials" }
  error: { description: "Invalid credentials" }
layoutByRenderer:
  react:
    # React-specific layout with JSX-like structure
    - type: ComponentRef
      ref: components/header
    - type: Slot
      name: content
    - type: ComponentRef
      ref: components/login-form
      props:
        onSubmit: handleLogin
  html:
    # HTML-specific layout with semantic elements
    - type: ComponentRef
      ref: components/header
    - tag: main
      children:
        - type: Slot
          name: content
```

## Layout Model

Configs support multiple renderers via `layoutByRenderer` map. Each renderer gets its own layout subtree.

**Shared primitives** (work in all renderers):

**ComponentRef** - Reference to a component:
```yaml
type: ComponentRef
ref: components/button      # canonical ref format
props:                      # props passed to component
  label: "Submit"
  variant: primary
```

**Slot** - Named insertion point for content:
```yaml
type: Slot
name: content               # slot identifier
default:                    # optional default content
  - type: ComponentRef
    ref: components/placeholder
```

**Renderer-specific nodes** (validated per renderer schema):
- React: JSX-like structure, event handlers, hooks
- HTML: semantic tags, attributes
- Solid: signals, reactive primitives

**Schema validation:** Each renderer registers its layout schema. Validator selects schema based on `layoutByRenderer` key and validates that subtree.

```yaml
# Screen config example
layoutByRenderer:
  react:    # Validated against react-layout.schema.json
    - type: ComponentRef
      ref: components/header
  html:     # Validated against html-layout.schema.json
    - tag: header
      children: [...]
```

If a renderer key is missing, that renderer can't render this config. This is only warned when explicitly requesting that renderer via `--renderer=X`.

**Flow:**
```yaml
kind: flow
id: onboarding
title: User Onboarding
steps:
  - id: welcome
    title: Welcome
    screen:
      ref: screens/login
      state: default
  - id: signup
    title: Sign Up
    screen:
      ref: screens/signup
transitions:
  - from: welcome
    to: signup
    trigger: next
```

**Atlas:**
```yaml
kind: atlas
id: app-structure
title: Application Structure
nodes:
  - id: auth
    title: Authentication
    ref: screens/login
  - id: dashboard
    title: Dashboard
    ref: screens/dashboard
relationships:
  - from: auth
    to: dashboard
    type: navigates
```

### Reference Format

Split fields for YAML compatibility (avoids `#` comment issues).

**Canonical format:** `<type>/<id>` where:
- `type` is plural: `screens`, `components`, `flows`, `atlas`
- `id` is the folder name, must match `[a-z0-9-]+`

```yaml
# Full form with state and options
screen:
  ref: screens/login
  state: error
  options:
    animate: true

# Simple form when no state/options (string shorthand)
screen: screens/login
```

**JSON Schema for reference (union of string and object):**
```json
{
  "definitions": {
    "ref": {
      "oneOf": [
        {
          "type": "string",
          "pattern": "^(screens|components|flows|atlas)/[a-z0-9-]+$"
        },
        {
          "type": "object",
          "properties": {
            "ref": { "type": "string", "pattern": "^(screens|components|flows|atlas)/[a-z0-9-]+$" },
            "state": { "type": "string" },
            "options": { "type": "object" }
          },
          "required": ["ref"]
        }
      ]
    }
  }
}
```

## Schema Composition

Use `kind` discriminator + `oneOf` pattern for LSP support.

**Two schema versions** for migration:
- `preview-v1.schema.json` - Transitional: `kind` optional (inferred from directory)
- `preview-v2.schema.json` - Strict: `kind` required

**Schema version selection:** The validator selects the schema based on the `schemaVersion` field in the config:
- If `schemaVersion` is omitted or `"1.0"` → validate against `preview-v1.schema.json`
- If `schemaVersion` is `"2.0"` → validate against `preview-v2.schema.json`
- Unknown `schemaVersion` values → validation error

The `prev migrate` command upgrades configs from v1 to v2 by adding `kind` and setting `schemaVersion: "2.0"`.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "preview-v2.schema.json",
  "oneOf": [
    { "$ref": "#/definitions/component" },
    { "$ref": "#/definitions/screen" },
    { "$ref": "#/definitions/flow" },
    { "$ref": "#/definitions/atlas" }
  ],
  "definitions": {
    "base": {
      "type": "object",
      "properties": {
        "kind": { "enum": ["component", "screen", "flow", "atlas"] },
        "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
        "title": { "type": "string" },
        "description": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } },
        "status": { "enum": ["draft", "stable", "deprecated"] },
        "schemaVersion": { "const": "2.0" }
      },
      "required": ["kind", "id", "title", "schemaVersion"]
    },
    "ref": {
      "oneOf": [
        { "type": "string", "pattern": "^(screens|components|flows|atlas)/[a-z0-9-]+$" },
        {
          "type": "object",
          "properties": {
            "ref": { "type": "string", "pattern": "^(screens|components|flows|atlas)/[a-z0-9-]+$" },
            "state": { "type": "string" },
            "options": { "type": "object" }
          },
          "required": ["ref"]
        }
      ]
    },
    "component": {
      "allOf": [
        { "$ref": "#/definitions/base" },
        {
          "properties": {
            "kind": { "const": "component" },
            "props": {
              "type": "object",
              "additionalProperties": {
                "type": "object",
                "properties": {
                  "type": { "type": "string" },
                  "required": { "type": "boolean" },
                  "default": {},
                  "enum": { "type": "array" }
                }
              }
            },
            "slots": {
              "type": "object",
              "additionalProperties": {
                "type": "object",
                "properties": {
                  "description": { "type": "string" }
                }
              }
            }
          }
        }
      ]
    },
    "screen": {
      "allOf": [
        { "$ref": "#/definitions/base" },
        {
          "properties": {
            "kind": { "const": "screen" },
            "states": {
              "type": "object",
              "additionalProperties": {
                "type": "object",
                "properties": {
                  "description": { "type": "string" }
                }
              }
            },
            "layoutByRenderer": {
              "type": "object",
              "minProperties": 1,
              "additionalProperties": true,
              "description": "Keys must match registered RendererAdapter.name values. At least one renderer required. Each value validated by the corresponding adapter's layoutSchema (may be array or object)."
            }
          },
          "required": ["layoutByRenderer"]
        }
      ]
    },
    "flow": {
      "allOf": [
        { "$ref": "#/definitions/base" },
        {
          "properties": {
            "kind": { "const": "flow" },
            "steps": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
                  "title": { "type": "string" },
                  "screen": { "$ref": "#/definitions/ref" }
                },
                "required": ["id", "title", "screen"]
              }
            },
            "transitions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "from": { "type": "string" },
                  "to": { "type": "string" },
                  "trigger": { "type": "string" }
                },
                "required": ["from", "to", "trigger"]
              }
            }
          },
          "required": ["steps"]
        }
      ]
    },
    "atlas": {
      "allOf": [
        { "$ref": "#/definitions/base" },
        {
          "properties": {
            "kind": { "const": "atlas" },
            "nodes": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
                  "title": { "type": "string" },
                  "ref": { "$ref": "#/definitions/ref" }
                },
                "required": ["id", "title"]
              }
            },
            "relationships": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "from": { "type": "string" },
                  "to": { "type": "string" },
                  "type": { "type": "string" }
                },
                "required": ["from", "to", "type"]
              }
            }
          },
          "required": ["nodes"]
        }
      ]
    }
  }
}
```

**Transitional schema (v1)** omits `kind` from required fields and uses directory-based inference in the validator.

## Renderer Adapter Interface

The adapter interface is intentionally thin. Bundling, asset management, and hydration are handled by the build system (Vite/esbuild), not the adapter. This keeps adapters simple to implement.

```typescript
interface RendererAdapter {
  /** Must match layoutByRenderer keys in configs */
  name: string  // e.g., "react", "html", "solid"

  /** JSON Schema for this renderer's layout nodes */
  layoutSchema: JSONSchema

  // Render a complete unit to output
  renderComponent(config: ComponentConfig): RenderOutput
  renderScreen(config: ScreenConfig, state?: string): RenderOutput
  renderFlow(config: FlowConfig, step?: string): RenderOutput
  renderAtlas(config: AtlasConfig): RenderOutput

  // Dev mode support (optional)
  supportsHMR(): boolean
  createDevServer?(port: number): DevServer
}

interface RenderOutput {
  html: string
  css?: string
  js?: string  // Asset path to JS file (e.g., "login.js"), build system handles bundling
}
```

**Renderer key contract:**
- `RendererAdapter.name` **must match** `layoutByRenderer` keys in configs
- Each adapter provides its own `layoutSchema` for validating its layout subtree
- `prev validate --renderer=react` validates only the `react` key in `layoutByRenderer`
- `prev validate` (no flag) validates all `layoutByRenderer` keys against registered adapters
- **Unknown renderer keys:** If a `layoutByRenderer` key doesn't match any registered adapter, validation **errors** (not warning)
- **Missing renderer keys:** Warnings are only produced when using `--renderer=X` flag and the config lacks that renderer's key (e.g., `prev validate --renderer=solid` warns if screen has no `solid` key). Without `--renderer` flag, missing keys are **not** warned—the validator only checks keys that exist.

**What adapters do:**
- Take validated config, produce HTML/CSS/JS output
- Handle state rendering for screens
- Handle step rendering for flows
- Handle graph visualization for atlas

**What adapters don't do (handled by build system):**
- Module bundling and tree-shaking
- Asset optimization and fingerprinting
- Hydration and runtime bootstrapping
- HMR websocket management

**Output semantics by type:**
- `renderComponent`: Isolated component with props applied
- `renderScreen`: Full screen layout in specified state
- `renderFlow`: Current step's screen + navigation UI (prev/next)
- `renderAtlas`: Graph visualization with node thumbnails

## Validation Layers

**Layer 1: JSON Schema** (structure, types, required fields)
- Enforced by `prev validate` CLI
- Enables LSP/autocomplete in editors

**Layer 2: Custom Validator** (semantic rules)
- ID uniqueness within type
- Cross-file reference resolution (screens, components, flows, atlas)
- State validation (ref state exists in target screen's `states` map)
- Circular dependency detection
- **Flow transitions:** `from` and `to` must reference existing step IDs in `steps` array
- **Atlas relationships:** `from` and `to` must reference existing node IDs in `nodes` array
- **layoutByRenderer keys:** Must match a registered `RendererAdapter.name`; unknown keys produce errors

```bash
$ prev validate
✓ 12 components validated
✓ 8 screens validated
✓ 3 flows validated
✓ 1 atlas validated
✗ flows/checkout: step "payment" references unknown screen "screens/payment-v2"
```

## File Structure

```
src/
  schemas/
    base.schema.json
    component.schema.json
    screen.schema.json
    flow.schema.json
    atlas.schema.json
  renderers/
    types.ts              # RendererAdapter interface
    react/
      index.ts            # ReactRenderer implements RendererAdapter
      components/         # React implementations
    html/
      index.ts            # HTMLRenderer implements RendererAdapter
  validator/
    index.ts              # Orchestrates validation
    schema-validator.ts   # JSON Schema validation
    semantic-validator.ts # Cross-file refs, uniqueness, etc.
```

## Resolved Decisions

| Question | Decision |
|----------|----------|
| Layout abstraction | `layoutByRenderer` map enables multi-renderer configs. ComponentRef and Slot are shared primitives. |
| Adapter scope | Thin: adapters render output + provide layoutSchema. Build system handles bundling/hydration. |
| Reference format | String or object union, validated by JSON Schema pattern `[a-z0-9-]+`. |
| Discovery convention | All types use `config.yaml`. ID derived from folder name. |
| Migration | Two schemas: v1 (transitional, `kind` optional) and v2 (strict, `kind` required). |
| Layout validation | Each adapter provides `layoutSchema`. Validator selects by `layoutByRenderer` key. |
| JS output | Asset path (e.g., "login.js"), build system handles bundling. |
| Renderer key contract | `RendererAdapter.name` must match `layoutByRenderer` keys. `prev validate --renderer=X` for targeted validation. Unknown keys error; missing keys warn only with `--renderer` flag. |
| Schema version selection | `schemaVersion` field determines which schema to validate against: omitted/`"1.0"` → v1, `"2.0"` → v2. |
| layoutByRenderer value type | `additionalProperties: true` in base schema; actual validation delegated to each adapter's `layoutSchema` (supports array or object roots). |
| Schema completeness | Full type-specific properties defined: `states`, `layoutByRenderer`, `steps`, `transitions`, `nodes`, `relationships`. |
| layoutByRenderer requirement | Required for screens with `minProperties: 1`. Screens must define at least one renderer layout. |
| Semantic validation | Flow transitions and atlas relationships must reference existing step/node IDs. |

## Open Questions (to refine during implementation)

1. **Props typing:** Allow arbitrary JSON Schema for component props, or fixed primitives?
2. **State inheritance:** Do screen states inherit a base layout or fully override?
3. **Atlas scope:** Can atlas nodes reference flows, or only screens/components?

## Discovery Rules

**Convention:** All types use `config.yaml` in their folder.

```
previews/
  components/
    button/
      config.yaml    # kind: component, id derived from folder name "button"
      Button.tsx     # implementation (renderer-specific)
  screens/
    login/
      config.yaml    # kind: screen, id derived from folder name "login"
      Login.tsx
  flows/
    onboarding/
      config.yaml    # kind: flow, id derived from folder name "onboarding"
  atlas/
    app-structure/
      config.yaml    # kind: atlas, id derived from folder name "app-structure"
```

**ID derivation:** If `id` is omitted in config, it's derived from the folder name. If specified, it must match the folder name (validator enforces this).

**Uniqueness:** IDs are unique within their type. `screens/login` and `components/login` are both valid (different namespaces).

## Migration Path

**Phase 1 (v1.x):** Transitional - both old and new formats accepted
- `kind` field optional (inferred from directory: `components/` → `kind: component`)
- Validator warns if `kind` is missing
- `prev migrate` command adds `kind` to existing configs

**Phase 2 (v2.0):** `kind` required
- Validator errors if `kind` is missing
- Old configs must be migrated

## Next Steps

1. Implement JSON Schemas for all types
2. Build `prev validate` CLI command
3. Create React renderer adapter (default)
4. Update scanner to use new validation
5. Add HTML renderer adapter (demonstrates pluggability)
