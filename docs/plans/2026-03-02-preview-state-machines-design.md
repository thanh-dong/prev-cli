# Preview State Machines & React Writing Rules

**Date:** 2026-03-02
**Scope:** Flow + Screen viewers (Phase 1)
**Dependency:** Zustand (~1kb)

## Problem

Preview viewers (FlowPreview, ScreenPreview) have state management anti-patterns that make changes, testing, and validation difficult:

- 6-8+ `useState` calls per viewer with tangled transitions
- Duplicated patterns: `isStaticBuild` detection, iframe URL construction, build status FSM, fullscreen toggle, browser chrome
- Side effects mixed into state transitions (`setTimeout` hacks for iframe sync)
- Impossible to test navigation logic without rendering full components
- No lint-like validation for content correctness (broken refs, unreachable steps, dead-end flows)

## Design

Three layers, phased:

```
Phase 1 (this design):
  State Machines (pure logic) + Zustand stores + Compound components + Validators

Phase 2 (future):
  Shared PreviewShell extracted from stabilized compound parts
```

### Layer 1: Pure State Machines

Zero React imports. Reducer functions: `(state, action) => newState`.

#### Flow Machine

```ts
// src/theme/previews/machines/flow-machine.ts

interface FlowMachineState {
  status: 'loading' | 'ready' | 'error'
  name: string
  description?: string
  steps: FlowStep[]
  currentStepId: string | null
  history: string[]
  outcomePicker: { outcomes: Record<string, { goto: string; label?: string }> } | null
  showOverlay: boolean
  isFullscreen: boolean
  error?: string
}

type FlowAction =
  | { type: 'loaded'; steps: FlowStep[]; name: string; description?: string }
  | { type: 'load_error'; error?: string }
  | { type: 'goto'; stepId: string }
  | { type: 'back' }
  | { type: 'linear_next' }
  | { type: 'linear_prev' }
  | { type: 'region_click'; region: string }
  | { type: 'pick_outcome'; stepId: string }
  | { type: 'cancel_picker' }
  | { type: 'toggle_overlay' }
  | { type: 'toggle_fullscreen' }

function flowReducer(state: FlowMachineState, action: FlowAction): FlowMachineState
```

Absorbs all logic from `goToStep`, `handleBack`, `handleLinearNext`, `resolveRegionClick`. The existing `flow-navigation.ts` functions merge into the reducer.

`regionRects` (pixel positions from iframe postMessage) stays **outside** the machine as view-layer data. Machine only knows region *names* from step config.

#### Screen Machine

```ts
// src/theme/previews/machines/screen-machine.ts

interface ScreenMachineState {
  status: 'loading' | 'building' | 'ready' | 'error'
  activeState: string           // 'index', 'error', 'loading', etc.
  availableStates: string[]
  viewport: 'mobile' | 'tablet' | 'desktop'
  isFullscreen: boolean
  error?: string
}

type ScreenAction =
  | { type: 'set_state'; state: string }
  | { type: 'set_viewport'; viewport: 'mobile' | 'tablet' | 'desktop' }
  | { type: 'toggle_fullscreen' }
  | { type: 'build_started' }
  | { type: 'build_ready' }
  | { type: 'build_error'; error: string }
```

#### Derived Values as Pure Functions

```ts
// src/theme/previews/machines/derived.ts

function getCurrentStep(state: FlowMachineState): FlowStep | null
function canLinearNext(state: FlowMachineState): boolean
function flowIframeUrl(state: FlowMachineState, unitName: string, basePath: string, isStatic: boolean): string
function screenIframeUrl(state: ScreenMachineState, unitName: string, basePath: string, isStatic: boolean): string
```

### Layer 2: Zustand Stores

Wrap machines in Zustand stores for React consumption with selector-based subscriptions.

```ts
// src/theme/previews/stores/flow-store.ts

const createFlowStore = (unit: PreviewUnit) => createStore<FlowMachineState & FlowActions>((set) => ({
  ...createFlowInitialState(unit),
  goto: (stepId) => set(s => flowReducer(s, { type: 'goto', stepId })),
  back: () => set(s => flowReducer(s, { type: 'back' })),
  regionClick: (region) => set(s => flowReducer(s, { type: 'region_click', region })),
  toggleOverlay: () => set(s => flowReducer(s, { type: 'toggle_overlay' })),
  toggleFullscreen: () => set(s => flowReducer(s, { type: 'toggle_fullscreen' })),
  // ...
}))
```

Testing: create store, call actions, assert state. No React rendering needed.

### Layer 3: Compound Components

Root component owns the store via context. Sub-components consume slices via selectors.

```tsx
// FlowPreview compound root
function FlowPreview({ unit, children }: { unit: PreviewUnit; children: React.ReactNode }) {
  const store = useRef(createFlowStore(unit)).current
  return <FlowStoreContext value={store}>{children}</FlowStoreContext>
}

// Compound parts — each subscribes to its own slice
FlowPreview.Header = function Header() { ... }
FlowPreview.Progress = function Progress() { ... }
FlowPreview.Canvas = function Canvas({ children }) { ... }
FlowPreview.Iframe = function Iframe() { ... }
FlowPreview.RegionOverlay = function RegionOverlay() { ... }
FlowPreview.OutcomePicker = function OutcomePicker() { ... }

// Usage
<FlowPreview unit={unit}>
  <FlowPreview.Header />
  <FlowPreview.Progress />
  <FlowPreview.Canvas>
    <FlowPreview.Iframe />
    <FlowPreview.RegionOverlay />
  </FlowPreview.Canvas>
  <FlowPreview.OutcomePicker />
</FlowPreview>
```

### Layer 4: Validators (Lint Rules)

Pure functions that inspect config at build time. Run in preview scanner, tests, or CLI.

```ts
// src/content/flow-validator.ts
function validateFlow(config: FlowConfig, availableScreens: string[]): { errors: string[]; warnings: string[] }
```

**Flow validation rules:**
- All `goto` targets reference existing step IDs
- All `screen` refs resolve to existing screen previews
- No unreachable steps (every step reachable from first step)
- Terminal steps must not have regions
- Non-terminal steps must have either regions OR a linear successor
- Region names follow `^[a-z0-9-]+$` pattern
- Outcome labels are present when >2 outcomes exist
- No duplicate step IDs

**Screen validation rules:**
- All declared states have corresponding files
- Default state (`index`) file exists
- State names are valid identifiers
- No orphan state files (files without config entries)

---

## React Writing Rules

Seven rules for writing preview components within this system.

### Rule 1: Components are renderers, not managers

Components receive machine state from Zustand store and render it. They never own navigation/transition logic directly.

```ts
// GOOD
const currentStepId = useFlowStore(s => s.currentStepId)
const goto = useFlowStore(s => s.goto)

// BAD
const [currentStepId, setCurrentStepId] = useState(...)
const goToStep = (id) => { setCurrentStepId(id); setHistory(...) }
```

### Rule 2: No side effects in state transitions

Iframe communication (`postMessage`, bridge injection) happens in `useEffect` reacting to store state changes. Never inside action handlers.

```ts
// GOOD
useEffect(() => {
  if (currentStepId && currentStep?.regions) {
    iframe.contentWindow?.postMessage({ type: 'highlight-regions', regions: ... }, '*')
  }
}, [currentStepId])

// BAD
const goToStep = (stepId) => {
  dispatch({ type: 'goto', stepId })
  setTimeout(() => { iframe.contentWindow?.postMessage(...) }, 500)
}
```

### Rule 3: Derived values are named functions, not inline expressions

```ts
// GOOD
const iframeUrl = flowIframeUrl(state, unit.name, basePath, isStatic)

// BAD
const iframeUrl = currentStep ? (isStaticBuild ? `${basePath}/_preview/...` : `/_preview-runtime?...`) : ''
```

### Rule 4: Fullscreen is a render mode, not a separate tree

Single render path. Fullscreen is a CSS/layout concern, not a JSX branch.

```tsx
// GOOD
<div className={isFullscreen ? 'preview-fullscreen' : 'preview-inline'}>
  <FlowPreview.Header />
  <FlowPreview.Canvas>...</FlowPreview.Canvas>
</div>

// BAD
if (isFullscreen) { return (<div>...entire duplicated tree...</div>) }
return (<div>...same tree again...</div>)
```

### Rule 5: Config is validated at the boundary, trusted inside

Validators run at build time. Components trust validated config — no defensive chains.

```ts
// GOOD
const { steps } = config as FlowConfig

// BAD
const steps = flow?.steps || []
const firstId = steps[0]?.id || 'step-0'
```

### Rule 6: No style duplication — extract shared patterns

Browser chrome, progress dots, status badges become composable compound parts.

```tsx
// GOOD
<BrowserChrome url={displayUrl}><iframe ... /></BrowserChrome>

// BAD — 20 lines of traffic lights + URL bar copy-pasted per viewer
```

### Rule 7: Compound components with context — no prop drilling

Sub-components access parent state via Zustand store context. Each compound part subscribes to its own slice.

```ts
// GOOD
FlowPreview.Progress = function Progress() {
  const steps = useFlowStore(s => s.steps)
  const currentStepId = useFlowStore(s => s.currentStepId)
  const goto = useFlowStore(s => s.goto)
}

// BAD
<FlowProgress steps={steps} currentStepId={currentStepId} onGoto={goto} history={history} ... />
```

---

## File Structure

```
src/theme/previews/
├── machines/
│   ├── flow-machine.ts          # Pure reducer + initial state
│   ├── screen-machine.ts        # Pure reducer + initial state
│   └── derived.ts               # Pure derived-value functions
├── stores/
│   ├── flow-store.ts            # Zustand store wrapping flow machine
│   └── screen-store.ts          # Zustand store wrapping screen machine
├── compounds/
│   ├── FlowPreview.tsx          # Compound root + sub-components
│   ├── ScreenPreview.tsx        # Compound root + sub-components
│   └── shared/                  # Shared compound parts (BrowserChrome, etc.)
├── FlowPreview.tsx              # Re-export with default compound composition
├── ScreenPreview.tsx            # Re-export with default compound composition
└── PreviewRouter.tsx            # Unchanged — dispatches to viewers
src/content/
├── flow-validator.ts            # Flow lint rules
└── screen-validator.ts          # Screen lint rules
```

## Phase 2 (Future)

Once machine interfaces stabilize:
- Extract shared `PreviewContext` base that both Flow and Screen stores extend
- Build `PreviewShell` compound parts (Canvas, BrowserChrome, FullscreenWrapper)
- Viewers become thin adapters: machine + type-specific compound parts + shared shell parts
