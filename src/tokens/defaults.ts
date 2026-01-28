// src/tokens/defaults.ts
// Default shadcn design tokens for prev-cli
// Users can override these in their project's tokens.yaml

import type { TokensConfig } from './resolver'

export const DEFAULT_TOKENS: TokensConfig = {
  colors: {
    foreground: "#0f172a",
    "card-foreground": "#0f172a",
    "popover-foreground": "#0f172a",
    primary: "#2563eb",
    "primary-foreground": "#ffffff",
    secondary: "#64748b",
    "secondary-foreground": "#0f172a",
    muted: "#94a3b8",
    "muted-foreground": "#64748b",
    accent: "#2563eb",
    "accent-foreground": "#ffffff",
    destructive: "#ef4444",
    "destructive-foreground": "#ffffff",
    border: "#e2e8f0",
    ring: "#2563eb",
  },
  backgrounds: {
    transparent: "transparent",
    background: "#ffffff",
    card: "#ffffff",
    popover: "#ffffff",
    primary: "#2563eb",
    secondary: "#f1f5f9",
    muted: "#f1f5f9",
    accent: "#f1f5f9",
    destructive: "#ef4444",
    input: "#ffffff",
  },
  spacing: {
    none: "0",
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  },
  typography: {
    sizes: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  radius: {
    none: "0",
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
    full: "9999px",
  },
  shadows: {
    none: "none",
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
}
