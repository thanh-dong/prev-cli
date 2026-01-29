# Design: Tailwind + shadcn Token System

## Overview

Replace inline styles in the primitives system with Tailwind utility classes, using shadcn/ui-compatible token naming for seamless ecosystem integration.

## Goals

1. **Tailwind-native rendering** - Primitives output Tailwind classes instead of inline styles
2. **shadcn-compatible tokens** - Use shadcn's semantic naming (background, foreground, muted-foreground, destructive, etc.)
3. **Semantic DSL preserved** - Keep `$col(gap:lg)` syntax, map internally to Tailwind's `gap-6`
4. **Dark mode ready** - CSS variables enable theme switching without code changes

## Token Definitions

### Color Tokens (shadcn-compatible)

| Token | Background Class | Text Class | Purpose |
|-------|------------------|------------|---------|
| `background` | `bg-background` | - | Page background |
| `foreground` | - | `text-foreground` | Page text |
| `card` | `bg-card` | - | Card surfaces |
| `card-foreground` | - | `text-card-foreground` | Card text |
| `primary` | `bg-primary` | `text-primary` | Primary actions |
| `primary-foreground` | - | `text-primary-foreground` | Text on primary |
| `secondary` | `bg-secondary` | `text-secondary` | Secondary actions |
| `secondary-foreground` | - | `text-secondary-foreground` | Text on secondary |
| `muted` | `bg-muted` | - | Subtle backgrounds |
| `muted-foreground` | - | `text-muted-foreground` | Subtle text |
| `accent` | `bg-accent` | - | Highlights |
| `accent-foreground` | - | `text-accent-foreground` | Text on accent |
| `destructive` | `bg-destructive` | `text-destructive` | Errors/danger |
| `destructive-foreground` | - | `text-destructive-foreground` | Text on destructive |
| `border` | - | - | `border-border` |
| `input` | `bg-input` | - | Input fields |
| `ring` | - | - | `ring-ring` |

### Spacing Tokens → Tailwind Scale

| Token | Tailwind | CSS Value |
|-------|----------|-----------|
| `none` | `0` | 0 |
| `xs` | `1` | 0.25rem |
| `sm` | `2` | 0.5rem |
| `md` | `4` | 1rem |
| `lg` | `6` | 1.5rem |
| `xl` | `8` | 2rem |
| `2xl` | `12` | 3rem |

### Radius Tokens

| Token | Tailwind Class |
|-------|----------------|
| `none` | `rounded-none` |
| `sm` | `rounded-sm` |
| `md` | `rounded-md` |
| `lg` | `rounded-lg` |
| `xl` | `rounded-xl` |
| `full` | `rounded-full` |

### Typography Size Tokens

| Token | Tailwind Class |
|-------|----------------|
| `xs` | `text-xs` |
| `sm` | `text-sm` |
| `base` | `text-base` |
| `lg` | `text-lg` |
| `xl` | `text-xl` |
| `2xl` | `text-2xl` |

### Font Weight Tokens

| Token | Tailwind Class |
|-------|----------------|
| `normal` | `font-normal` |
| `medium` | `font-medium` |
| `semibold` | `font-semibold` |
| `bold` | `font-bold` |

## DSL Examples

```yaml
# Layout primitives
$col(gap:lg padding:md)           → class="flex flex-col gap-6 p-4"
$row(gap:sm align:center)         → class="flex flex-row gap-2 items-center"
$box(bg:muted radius:md padding:lg) → class="bg-muted rounded-md p-6"

# Content primitives
$text("Hello" size:lg weight:bold color:foreground)
  → class="text-lg font-bold text-foreground"

$text("Subtitle" color:muted-foreground)
  → class="text-muted-foreground"

$icon(check size:sm color:primary)
  → class="w-4 h-4 text-primary"
```

## CSS Variables (tokens.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}
```

## Implementation Plan

### 1. Update Types (`src/primitives/types.ts`)

- Add new color tokens (shadcn naming)
- Keep spacing/radius/size tokens (just update mappings)
- Add `semibold` weight token

### 2. Update Template Renderer (`src/primitives/template-renderer.ts`)

- Replace inline style generation with Tailwind class generation
- Create token-to-Tailwind mapping objects
- Update all render functions to output `class=""` instead of `style=""`

### 3. Create Tokens CSS (`src/primitives/tokens.css`)

- shadcn-compatible CSS variables
- Light and dark mode values
- Export for use in previews

### 4. Update Parser (`src/primitives/parser.ts`)

- Add new color token validation
- Support hyphenated tokens (muted-foreground)

### 5. Update Tests

- Update expected output from inline styles to Tailwind classes
- Add tests for new color tokens

### 6. Migration

- Update product-page preview to use new tokens
- Update any other existing previews

## Breaking Changes

| Before | After |
|--------|-------|
| `bg:surface` | `bg:background` |
| `color:error` | `color:destructive` |
| `color:muted` (for text) | `color:muted-foreground` |
| `size:md` (text) | `size:base` |

## Dependencies

- Tailwind CSS v4 (already included via Play CDN in preview runtime)
- No additional packages needed
