# Information Architecture & Flows Design

## Overview

Restructure the previews showcase with proper IA, interactive flows, and atlas canvas views.

**URL Structure:**
```
/previews                           → Dashboard (home)
/previews/components                → Components grid
/previews/components/button         → Button detail
/previews/screens                   → Screens grid
/previews/screens/login             → Login detail (with state selector)
/previews/flows                     → Flows grid
/previews/flows/onboarding          → Onboarding flow (interactive step-through)
/previews/atlas                     → Atlas grid
/previews/atlas/app-structure       → Atlas canvas view
```

**Four Preview Types:**
| Type | Purpose | View |
|------|---------|------|
| Components | UI building blocks | Live preview + code |
| Screens | Full pages with states | Preview + state selector |
| Flows | User journeys | Interactive step-through with hotspots |
| Atlas | Architecture maps | Canvas with overlays |

**Legacy Removal:** Delete `button-demo`, `card-demo`, `input-demo`, `demo` directories.

---

## Dashboard (`/previews`)

Vertical layout with categories, horizontal item cards within each.

```
┌──────────────────────────────────────────────────────────────────┐
│  Previews                                                        │
│  Explore components, screens, flows, and architecture            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Components ─────────────────────────────────────── View all →  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  [snapshot]  │  │  [snapshot]  │  │  [snapshot]  │           │
│  │  Button      │  │  Card        │  │  Input       │           │
│  │  Primary     │  │  Content     │  │  Form        │           │
│  │  actions     │  │  containers  │  │  controls    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  Screens ───────────────────────────────────────── View all →   │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │  [snapshot]  │  │  [snapshot]  │                             │
│  │  Login       │  │  Dashboard   │                             │
│  │  Auth screen │  │  Main app    │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                  │
│  Flows ─────────────────────────────────────────── View all →   │
│  ┌──────────────┐                                               │
│  │  [1→2→3→4]   │                                               │
│  │  Onboarding  │                                               │
│  │  User signup │                                               │
│  └──────────────┘                                               │
│                                                                  │
│  Atlas ─────────────────────────────────────────── View all →   │
│  ┌──────────────┐                                               │
│  │  [○──○──○]   │                                               │
│  │  App Structure│                                              │
│  │  Navigation   │                                               │
│  └──────────────┘                                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Each category:** Header with name + "View all →" link, horizontal scroll of item cards.

**Each item card:** Snapshot thumbnail (live mini-preview), title, short description.

---

## Flows - Interactive Step-Through

Minimal chrome, preview takes majority of viewport. Navigation in floating toolbar.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │                    [Live Screen Preview]                   │ │
│  │                                                            │ │
│  │            ╔═══════════════╗  ← Hotspot highlight          │ │
│  │            ║ Get Started → ║    (pulsing/glowing)          │ │
│  │            ╚═══════════════╝                               │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Email Verification · Next: email_confirmed →                   │
│                                                                  │
│          ┌───────────────────────────────────────────────┐      │
│          │  📱 💻 │ ⛶ │ ⚙️ │      ← ○○●○○○ →           │      │
│          └───────────────────────────────────────────────┘      │
│           ─────────────────   ─────────────────────────         │
│            Fixed controls      Dynamic (step nav)               │
└──────────────────────────────────────────────────────────────────┘
```

**Hotspot overlay:** Flow YAML defines trigger, screen exports selectors, overlay highlights matching element with pulse/glow. Clicking hotspot advances to next step.

---

## Atlas - Canvas View

Pan/zoom canvas with auto-laid out nodes. Each node shows screen snapshot.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │     ┌─────────┐                                           │ │
│  │     │ Login   │─────────┐                                 │ │
│  │     │ [snap]  │         │                                 │ │
│  │     └─────────┘         ▼                                 │ │
│  │                    ┌─────────┐      ┌─────────┐           │ │
│  │                    │Dashboard│─────▶│Settings │           │ │
│  │                    │ [snap]  │      │ [snap]  │           │ │
│  │                    └─────────┘      └─────────┘           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│          ┌───────────────────────────────────────────────┐      │
│          │  📱 💻 │ ⛶ │ ⚙️ │    Guest │ User │ Admin    │      │
│          └───────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

**Clicking a node → Overlay opens:**
- Screen name header
- Live preview with state matching selected condition
- Close button returns to canvas

**Auto-layout:** Uses relationships to build directed graph, Dagre/ELK layout algorithm.

---

## Screens - State Selector

Preview with state dropdown in floating toolbar.

```
          ┌───────────────────────────────────────────────┐
          │  📱 💻 │ ⛶ │ ⚙️ │              State ▼      │
          └───────────────────────────────────────────────┘
```

Dropdown shows available states from screen config. Smart popover positioning based on available space.

---

## Floating Toolbar - Dynamic Content

| Type | Dynamic Area (right side) |
|------|---------------------------|
| Components | (empty or variant selector) |
| Screens | State dropdown |
| Flows | ← step dots → |
| Atlas | Condition tabs |

Fixed controls (left) stay in place, dynamic area fills right side - no layout shift.

---

## Main Nav - Previews Dropdown

Hover/click reveals category list with counts:

```
         ┌───────────────────┐
         │ Components    (4) │
         │ Screens       (2) │
         │ Flows         (1) │
         │ Atlas         (1) │
         ├───────────────────┤
         │ View all →        │
         └───────────────────┘
```

---

## Data Schema

### Components (minimal)

```yaml
# previews/components/button/config.yaml
title: Button
description: Primary actions and interactions
tags: [ui, interactive]
status: stable
category: components

variants:  # optional
  default: {}
  loading: { loading: true }
  disabled: { disabled: true }
```

### Screens (states + triggers)

```yaml
# previews/screens/dashboard/config.yaml
title: Dashboard
description: Main app overview
tags: [screen, main]
status: stable
category: screens

states:
  default:
    user: null
  logged-in:
    user: { name: "John", role: "user" }
  admin:
    user: { name: "Admin", role: "admin" }
    showAdminPanel: true

triggers:
  click_settings: "[data-nav='settings']"
  click_profile: "[data-nav='profile']"
  logout: "[data-action='logout']"
```

### Flows (steps + transitions)

```yaml
# previews/flows/onboarding/index.yaml
title: User Onboarding
description: Complete signup flow
tags: [flow, onboarding]
status: stable
category: flows

steps:
  - id: welcome
    title: Welcome
    description: Landing with value prop
    screen: login
    state: default

  - id: signup
    title: Create Account
    description: User enters credentials
    screen: login
    state: signup-form
    trigger: click_get_started

  - id: complete
    title: Ready
    description: User lands on dashboard
    screen: dashboard
    state: logged-in

transitions:
  - from: welcome
    to: signup
    trigger: click_get_started

  - from: signup
    to: complete
    trigger: submit_form
```

### Atlas (nodes + conditions)

```yaml
# previews/atlas/app-structure/index.yaml
title: App Structure
description: Navigation map
tags: [atlas, architecture]
status: stable
category: atlas

conditions:
  - id: guest
    title: Guest
    default: true
  - id: user
    title: User
  - id: admin
    title: Admin

nodes:
  - id: login
    title: Login
    screen: login
    state: default
    visible: [guest]
    # position: optional override, omit for auto-layout

  - id: dashboard
    title: Dashboard
    screen: dashboard
    state: logged-in
    stateOverrides:
      admin: admin
    visible: [user, admin]

  - id: admin-panel
    title: Admin Panel
    screen: admin-panel
    state: default
    visible: [admin]

relationships:
  - from: login
    to: dashboard
    label: login success

  - from: dashboard
    to: admin-panel
    label: admin only
    visible: [admin]
```

---

## Implementation Summary

**Files to delete (legacy):**
- `previews/button-demo/`
- `previews/card-demo/`
- `previews/input-demo/`
- `previews/demo/`

**New/modified components:**

| Component | Purpose |
|-----------|---------|
| `PreviewsDashboard` | Vertical category cards with horizontal item snapshots |
| `PreviewTypeGrid` | Grid view for `/previews/{type}` |
| `FlowViewer` | Step-through with hotspot overlays |
| `AtlasCanvas` | Pan/zoom canvas with auto-layout nodes |
| `ScreenViewer` | Preview with state dropdown |
| `FloatingToolbar` | Dynamic right section per type |
| `SmartPopover` | Position-aware dropdown |

**Data layer:**
- Extend `scanPreviewUnits()` to parse new schema fields
- Add state/trigger resolution for screens
- Add auto-layout computation for atlas (dagre/ELK)

**Routes:**
- `/previews` → Dashboard
- `/previews/:type` → Type grid
- `/previews/:type/:name` → Detail (type-specific viewer)
