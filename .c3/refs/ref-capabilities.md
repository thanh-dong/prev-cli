# prev-cli Capability Checklist
Base URL: http://localhost:3737
Verified: 2026-02-27 (pre-migration baseline)

## 1. Core Page Rendering
- [x] `/` — loads, shows sidebar on left, content area on right
- [x] Sidebar contains "Test Scenario" or page title
- [x] Content area shows MDX heading "# Test Scenario"
- [x] Content area shows list items (Preview Types section)
- [x] Floating toolbar pill visible at bottom of screen

## 2. Toolbar (floating pill at bottom)
- [x] Toolbar pill is visible
- [x] Contains TOC button ("Table of Contents")
- [x] Contains theme toggle ("Dark mode")
- [x] Contains width toggle ("Full width")
- [x] Contains Previews link

## 3. SPA Routing
- [x] `/previews` — returns 200, not 404
- [x] `/previews/components/button` — returns 200
- [x] `/previews/screens/login` — returns 200

## 4. Previews Catalog (`/previews`)
- [x] Page loads with "Previews" heading, "4 previews across 4 categories"
- [x] Shows "Components" section with Button card
- [x] Shows "Screens" section with Login card
- [x] Shows "Flows" section with Checkout Flow card
- [x] Shows "Atlas" section with App Information Architecture card

## 5. Component Preview (`/previews/components/button`)
- [x] Page loads, header shows "components/button" with bundle time (6ms)
- [x] Shows an iframe or embedded preview
- [x] Preview iframe shows a blue "Click me" button

## 6. Screen Preview with States (`/previews/screens/login`)
- [x] Page loads, header shows bundle time (9ms)
- [x] State tabs visible: Default, Error, Loading
- [ ] Iframe content renders login form — blank in screenshot (known: iframe load timing)

## 7. Flow Preview (`/previews/flows/checkout`)
- [x] Page loads with "Checkout Flow" title, 3 step dots, nav arrows
- [ ] Step iframe shows "No preview source specified" — flow->screen ref not resolving

## 8. Atlas Preview (`/previews/atlas/app`)
- [x] Page loads with title + description
- [x] Tree view: Home -> Authentication (Login, Register), Products (Catalog, Product Detail)
- [x] Relationships section: 8 relationship pills rendered correctly
- [x] View mode tabs: Tree, Map, Navigate

## 9. Dev-mode bundle endpoints
- [x] `/_preview-bundle/components/button` — 200, application/javascript, 341 bytes
- [x] `/_preview-config/components/button` — 200, JSON with files/entry/tailwind config

## 10. Dark Mode
- [x] Clicking theme toggle changes background to dark, text to light
