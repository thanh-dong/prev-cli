---
id: adr-20260126-ecommerce-demos
status: accepted
created: 2026-01-26
approved-files:
  - previews/screens/pricing/config.yaml
  - previews/screens/pricing/index.tsx
  - previews/screens/cart/config.yaml
  - previews/screens/cart/index.tsx
  - previews/screens/checkout-success/config.yaml
  - previews/screens/checkout-success/index.tsx
  - previews/flows/checkout/index.yaml
---

# ADR: E-commerce Demo Content

## Problem

The documentation showcase lacks diverse screen and flow examples. Currently only has login, dashboard, and a basic onboarding flow.

## Decision

Add e-commerce themed demo content:

**Screens:**
- `pricing` - SaaS pricing page with tiered plans
- `cart` - Shopping cart with item list
- `checkout-success` - Order confirmation page

**Flows:**
- `checkout` - Complete checkout journey

## Rationale

E-commerce is a common use case that demonstrates:
- Complex UI layouts (pricing grids, cart items)
- Multi-step flows (checkout process)
- State management (cart contents, billing toggle)

## Affected Layers

Demo content only - no architectural changes.
