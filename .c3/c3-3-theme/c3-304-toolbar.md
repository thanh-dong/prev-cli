# c3-304: Toolbar

## Purpose

Floating pill toolbar at the bottom of the viewport providing quick access to navigation, theme, and width controls.

## Location

`src/theme/Toolbar.tsx`, `src/theme/Toolbar.css`

## Responsibilities

- Display draggable floating pill
- Toggle TOC panel visibility
- Link to previews catalog (if previews exist)
- Toggle content width (constrained/full)
- Toggle dark/light theme

## Props

```typescript
interface ToolbarProps {
  tree: PageTree.Root
  onThemeToggle: () => void
  onWidthToggle: () => void
  isDark: boolean
  isFullWidth: boolean
  onTocToggle: () => void
  tocOpen: boolean
}
```

## Buttons

| Button | Icon | Action |
|--------|------|--------|
| TOC | List icon | Toggle navigation panel |
| Previews | Grid icon | Link to /previews |
| Width | Expand/Compress | Toggle content width |
| Theme | Sun/Moon | Toggle dark mode |

## Dependencies

- **Internal:** [c3-302-layout](./c3-302-layout.md) provides state handlers
- **Internal:** `./icons` for SVG icon sprite

## Styling

- Fixed position at viewport bottom
- Semi-transparent background with blur
- Smooth transitions on hover/active
- Responsive sizing

## Notes

- Previews button only shown if previews exist
- Icons change based on current state (dark/light, full/constrained)
- Position persists across page navigation
