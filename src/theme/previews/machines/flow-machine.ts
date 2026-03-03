// Pure flow state machine — zero React imports

import type { FlowStep } from '../../../content/preview-types'

// --- State ---

export interface FlowMachineState {
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

// --- Actions ---

export type FlowAction =
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

// --- Initial state ---

export function createFlowInitialState(): FlowMachineState {
  return {
    status: 'loading',
    name: '',
    steps: [],
    currentStepId: null,
    history: [],
    outcomePicker: null,
    showOverlay: true,
    isFullscreen: false,
  }
}

// --- Helpers ---

function findStep(steps: FlowStep[], id: string): FlowStep | undefined {
  return steps.find(s => s.id === id)
}

function stepIndex(steps: FlowStep[], id: string): number {
  return steps.findIndex(s => s.id === id)
}

function canLinearNext(step: FlowStep): boolean {
  if (step.terminal) return false
  if (step.regions && Object.keys(step.regions).length > 0) return false
  return true
}

// --- ID normalization ---

function normalizeStepIds(steps: FlowStep[]): FlowStep[] {
  const usedIds = new Set<string>()
  // First pass: collect all explicit IDs
  for (const step of steps) {
    if (step.id) usedIds.add(step.id)
  }
  // Second pass: assign unique IDs to steps without one, or with duplicate IDs
  let counter = 0
  const seen = new Set<string>()
  return steps.map((step) => {
    if (step.id && !seen.has(step.id)) {
      seen.add(step.id)
      return step
    }
    // Generate a unique ID that doesn't collide
    while (usedIds.has(`step-${counter}`)) counter++
    const id = `step-${counter}`
    usedIds.add(id)
    seen.add(id)
    counter++
    return { ...step, id }
  })
}

// --- Reducer ---

export function flowReducer(state: FlowMachineState, action: FlowAction): FlowMachineState {
  switch (action.type) {
    case 'loaded': {
      const normalized = normalizeStepIds(action.steps)
      const firstId = normalized.length > 0 ? normalized[0].id! : null
      return {
        ...state,
        status: 'ready',
        name: action.name,
        description: action.description,
        steps: normalized,
        currentStepId: firstId,
        history: firstId ? [firstId] : [],
        error: undefined,
      }
    }

    case 'load_error':
      return { ...state, status: 'error', error: action.error }

    case 'goto': {
      const target = findStep(state.steps, action.stepId)
      if (!target) return state
      return {
        ...state,
        currentStepId: action.stepId,
        history: [...state.history, action.stepId],
        outcomePicker: null,
      }
    }

    case 'back': {
      if (state.history.length <= 1) return state
      const newHistory = state.history.slice(0, -1)
      return {
        ...state,
        currentStepId: newHistory[newHistory.length - 1],
        history: newHistory,
        outcomePicker: null,
      }
    }

    case 'linear_next': {
      if (!state.currentStepId) return state
      const current = findStep(state.steps, state.currentStepId)
      if (!current || !canLinearNext(current)) return state
      const idx = stepIndex(state.steps, state.currentStepId)
      if (idx >= state.steps.length - 1) return state
      const nextStep = state.steps[idx + 1]
      const nextId = nextStep.id!
      return {
        ...state,
        currentStepId: nextId,
        history: [...state.history, nextId],
        outcomePicker: null,
      }
    }

    case 'linear_prev':
      return flowReducer(state, { type: 'back' })

    case 'region_click': {
      if (!state.currentStepId) return state
      const step = findStep(state.steps, state.currentStepId)
      if (!step?.regions) return state

      const region = step.regions[action.region]
      if (!region) return state

      if ('goto' in region) {
        const target = findStep(state.steps, region.goto)
        if (!target) return state
        return {
          ...state,
          currentStepId: region.goto,
          history: [...state.history, region.goto],
          outcomePicker: null,
        }
      }

      if ('outcomes' in region) {
        return {
          ...state,
          outcomePicker: { outcomes: region.outcomes },
        }
      }

      return state
    }

    case 'pick_outcome': {
      const target = findStep(state.steps, action.stepId)
      if (!target) return state
      return {
        ...state,
        currentStepId: action.stepId,
        history: [...state.history, action.stepId],
        outcomePicker: null,
      }
    }

    case 'cancel_picker':
      return { ...state, outcomePicker: null }

    case 'toggle_overlay':
      return { ...state, showOverlay: !state.showOverlay }

    case 'toggle_fullscreen':
      return { ...state, isFullscreen: !state.isFullscreen }

    default:
      return state
  }
}
