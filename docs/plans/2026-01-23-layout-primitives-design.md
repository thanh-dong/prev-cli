# Layout Primitives Design

> Standardize layout primitives with design-token-aligned syntax for renderer-agnostic preview configs.

## Overview

**Goal:** Simple, composable layout primitives that separate structure from content. Layout describes *where* things go; components handle *what* renders.

**Principles:**
- Primitives are structural only (no content primitives)
- Token-based values (`gap: lg` not `gap: 24px`)
- Renderer-agnostic (same syntax works for React, HTML, etc.)
- Compact YAML-friendly syntax

## Syntax

### Primitives (`$` prefix)

```yaml
$col(gap:lg)      # Column layout
$row(gap:md)      # Row layout
$box(padding:md)  # Container with spacing
$spacer           # Flexible space
$spacer(xl)       # Fixed space
$slot(name)       # State-dependent content placeholder
```

The `$` prefix marks built-in primitives. No `/` in the name.

### Component References (path syntax)

```yaml
components/button     # Reference to component
screens/login         # Reference to screen
flows/checkout        # Reference to flow
```

Path syntax (`/`) distinguishes refs from primitives.

### Props

Inline with parentheses, colon-separated:

```yaml
$col(gap:lg align:center)
$box(padding:md bg:surface radius:sm)
```

Component props as nested YAML:

```yaml
- components/button:
    label: "Submit"
    variant: primary
```

## Design Tokens

Primitives use semantic token values:

| Token Type | Values |
|------------|--------|
| **Spacing** | `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |
| **Align** | `start`, `center`, `end`, `stretch`, `between` |
| **Background** | `surface`, `muted`, `accent`, `transparent` |
| **Radius** | `none`, `sm`, `md`, `lg`, `full` |

Renderers map tokens to actual values.

## Primitive Reference

### `$col(props)`

Vertical stack layout.

| Prop | Values | Default |
|------|--------|---------|
| `gap` | spacing token | `none` |
| `align` | alignment token | `stretch` |
| `padding` | spacing token | `none` |

```yaml
- $col(gap:lg align:center):
    - components/header
    - components/content
    - components/footer
```

### `$row(props)`

Horizontal stack layout.

| Prop | Values | Default |
|------|--------|---------|
| `gap` | spacing token | `none` |
| `align` | alignment token | `center` |
| `padding` | spacing token | `none` |

```yaml
- $row(gap:md):
    - components/logo
    - $spacer
    - components/nav
```

### `$box(props)`

Generic container with spacing and styling.

| Prop | Values | Default |
|------|--------|---------|
| `padding` | spacing token | `none` |
| `bg` | background token | `transparent` |
| `radius` | radius token | `none` |

```yaml
- $box(padding:lg bg:surface radius:md):
    - components/card-content
```

### `$spacer` / `$spacer(size)`

Whitespace. Without size, fills available space (flex). With size, fixed.

```yaml
- $row:
    - components/logo
    - $spacer           # Pushes nav to the right
    - components/nav

- $col(gap:md):
    - components/form
    - $spacer(xl)       # Fixed large gap
    - components/footer
```

### `$slot(name)`

Placeholder for state-dependent content. Filled by `slots` mapping.

```yaml
template:
  - $col:
      - components/header
      - $slot(main)
      - components/footer

slots:
  main:
    default: components/home
    loading: components/spinner
```

## Screen Config Structure

```yaml
kind: screen
id: login
title: Login Screen
schemaVersion: "2.0"

# State definitions (enum)
states:
  default: { description: "Ready to login" }
  logging-in: { description: "Submitting credentials" }
  error: { description: "Login failed" }
  authenticated: { description: "Success" }

# Static UI structure
template:
  - $col(gap:lg align:center):
      - $spacer(xl)
      - components/logo
      - $box(padding:lg bg:surface radius:md):
          - $slot(form)
      - $row(gap:sm):
          - components/forgot-link
          - components/signup-link
      - $spacer(xl)

# State-dependent content
slots:
  form:
    default: components/login-form
    logging-in: components/spinner
    error: components/login-form-error
    authenticated: components/success-message
```

## Parsing Rules

1. **Starts with `$`** → Primitive
2. **Contains `/`** → Component/screen/flow reference
3. **Props in parentheses** → Parse as `key:value` pairs
4. **Children as nested YAML** → Recursive structure

## Migration from layoutByRenderer

Old format:
```yaml
layoutByRenderer:
  react:
    - type: Stack
      gap: lg
      children:
        - type: ComponentRef
          ref: components/header
```

New format:
```yaml
template:
  - $col(gap:lg):
      - components/header
```

The `layoutByRenderer` field remains available for renderer-specific overrides when needed.

## Implementation Tasks

1. Update `src/schemas/layout-primitives.schema.json` with new primitive definitions
2. Add primitive parser to handle `$name(props)` syntax
3. Update screen schema to use `template` and `slots` fields
4. Update validators for new syntax
5. Update React/HTML adapters to render primitives
6. Add migration path from `layoutByRenderer` to `template`

## Open Questions

- Should `$slot` support default content inline? e.g., `$slot(main default:components/fallback)`
- Should we support conditional primitives? e.g., `$if(state:error):`
- Token customization per-project?
