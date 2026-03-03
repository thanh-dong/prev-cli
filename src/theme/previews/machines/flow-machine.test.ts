import { test, expect, describe } from 'bun:test'
import {
  flowReducer,
  createFlowInitialState,
  type FlowMachineState,
  type FlowAction,
} from './flow-machine'
import type { FlowStep } from '../../../content/preview-types'

// --- Test fixtures ---

const steps: FlowStep[] = [
  {
    id: 'step1',
    title: 'Sign Up',
    screen: 'signup',
    regions: {
      submit: { goto: 'step2' },
      'login-link': { goto: 'step3' },
    },
  },
  {
    id: 'step2',
    title: 'Dashboard',
    screen: 'dashboard',
    regions: {
      'upgrade-btn': {
        outcomes: {
          success: { goto: 'step3', label: 'Paid' },
          failure: { goto: 'step1' },
        },
      },
    },
  },
  {
    id: 'step3',
    title: 'Settings',
    screen: 'settings',
    terminal: true,
  },
]

const linearSteps: FlowStep[] = [
  { id: 'a', title: 'First', screen: 'page-a' },
  { id: 'b', title: 'Second', screen: 'page-b' },
  { id: 'c', title: 'Third', screen: 'page-c', terminal: true },
]

function loadedState(stepsData: FlowStep[] = steps): FlowMachineState {
  const initial = createFlowInitialState()
  return flowReducer(initial, {
    type: 'loaded',
    steps: stepsData,
    name: 'Test Flow',
    description: 'A test flow',
  })
}

// --- Tests ---

describe('createFlowInitialState', () => {
  test('returns loading state with no steps', () => {
    const state = createFlowInitialState()
    expect(state.status).toBe('loading')
    expect(state.steps).toEqual([])
    expect(state.currentStepId).toBeNull()
    expect(state.history).toEqual([])
    expect(state.outcomePicker).toBeNull()
    expect(state.showOverlay).toBe(true)
    expect(state.isFullscreen).toBe(false)
  })
})

describe('flowReducer — loaded', () => {
  test('sets steps, name, status=ready, navigates to first step', () => {
    const state = loadedState()
    expect(state.status).toBe('ready')
    expect(state.name).toBe('Test Flow')
    expect(state.description).toBe('A test flow')
    expect(state.steps).toEqual(steps)
    expect(state.currentStepId).toBe('step1')
    expect(state.history).toEqual(['step1'])
  })

  test('handles empty steps array', () => {
    const initial = createFlowInitialState()
    const state = flowReducer(initial, { type: 'loaded', steps: [], name: 'Empty' })
    expect(state.status).toBe('ready')
    expect(state.currentStepId).toBeNull()
    expect(state.history).toEqual([])
  })
})

describe('flowReducer — load_error', () => {
  test('sets status=error with message', () => {
    const initial = createFlowInitialState()
    const state = flowReducer(initial, { type: 'load_error', error: 'Network failure' })
    expect(state.status).toBe('error')
    expect(state.error).toBe('Network failure')
  })

  test('sets status=error without message', () => {
    const initial = createFlowInitialState()
    const state = flowReducer(initial, { type: 'load_error' })
    expect(state.status).toBe('error')
  })
})

describe('flowReducer — goto', () => {
  test('navigates to target step and appends to history', () => {
    const state = loadedState()
    const next = flowReducer(state, { type: 'goto', stepId: 'step2' })
    expect(next.currentStepId).toBe('step2')
    expect(next.history).toEqual(['step1', 'step2'])
  })

  test('clears outcome picker on navigation', () => {
    let state = loadedState()
    // Simulate having an outcome picker open
    state = { ...state, outcomePicker: { outcomes: { a: { goto: 'step2' } } } }
    const next = flowReducer(state, { type: 'goto', stepId: 'step2' })
    expect(next.outcomePicker).toBeNull()
  })

  test('ignores goto to non-existent step', () => {
    const state = loadedState()
    const next = flowReducer(state, { type: 'goto', stepId: 'nonexistent' })
    expect(next.currentStepId).toBe('step1')
    expect(next.history).toEqual(['step1'])
  })
})

describe('flowReducer — back', () => {
  test('pops history and navigates to previous step', () => {
    let state = loadedState()
    state = flowReducer(state, { type: 'goto', stepId: 'step2' })
    state = flowReducer(state, { type: 'goto', stepId: 'step3' })
    expect(state.history).toEqual(['step1', 'step2', 'step3'])

    const prev = flowReducer(state, { type: 'back' })
    expect(prev.currentStepId).toBe('step2')
    expect(prev.history).toEqual(['step1', 'step2'])
  })

  test('does nothing when at first step', () => {
    const state = loadedState()
    const same = flowReducer(state, { type: 'back' })
    expect(same.currentStepId).toBe('step1')
    expect(same.history).toEqual(['step1'])
  })

  test('clears outcome picker on back', () => {
    let state = loadedState()
    state = flowReducer(state, { type: 'goto', stepId: 'step2' })
    state = { ...state, outcomePicker: { outcomes: { a: { goto: 'step3' } } } }
    const prev = flowReducer(state, { type: 'back' })
    expect(prev.outcomePicker).toBeNull()
  })
})

describe('flowReducer — linear_next', () => {
  test('moves to next step in array order for non-region steps', () => {
    const state = loadedState(linearSteps)
    const next = flowReducer(state, { type: 'linear_next' })
    expect(next.currentStepId).toBe('b')
    expect(next.history).toEqual(['a', 'b'])
  })

  test('does nothing at last step', () => {
    let state = loadedState(linearSteps)
    state = flowReducer(state, { type: 'goto', stepId: 'c' })
    const same = flowReducer(state, { type: 'linear_next' })
    expect(same.currentStepId).toBe('c')
  })

  test('does nothing for steps with regions (regions required)', () => {
    const state = loadedState(steps)  // step1 has regions
    const same = flowReducer(state, { type: 'linear_next' })
    expect(same.currentStepId).toBe('step1')
  })

  test('does nothing for terminal steps', () => {
    let state = loadedState(linearSteps)
    state = flowReducer(state, { type: 'goto', stepId: 'c' })  // c is terminal
    const same = flowReducer(state, { type: 'linear_next' })
    expect(same.currentStepId).toBe('c')
  })
})

describe('flowReducer — linear_prev', () => {
  test('moves back to previous step via history', () => {
    let state = loadedState(linearSteps)
    state = flowReducer(state, { type: 'linear_next' })  // a -> b
    const prev = flowReducer(state, { type: 'linear_prev' })
    expect(prev.currentStepId).toBe('a')
  })

  test('does nothing at first step', () => {
    const state = loadedState(linearSteps)
    const same = flowReducer(state, { type: 'linear_prev' })
    expect(same.currentStepId).toBe('a')
  })
})

describe('flowReducer — region_click', () => {
  test('simple goto region navigates to target', () => {
    const state = loadedState()
    const next = flowReducer(state, { type: 'region_click', region: 'submit' })
    expect(next.currentStepId).toBe('step2')
    expect(next.history).toEqual(['step1', 'step2'])
  })

  test('outcomes region opens outcome picker', () => {
    let state = loadedState()
    state = flowReducer(state, { type: 'goto', stepId: 'step2' })  // step2 has outcomes
    const next = flowReducer(state, { type: 'region_click', region: 'upgrade-btn' })
    expect(next.outcomePicker).toEqual({
      outcomes: {
        success: { goto: 'step3', label: 'Paid' },
        failure: { goto: 'step1' },
      },
    })
    expect(next.currentStepId).toBe('step2')  // doesn't navigate yet
  })

  test('unknown region does nothing', () => {
    const state = loadedState()
    const same = flowReducer(state, { type: 'region_click', region: 'nonexistent' })
    expect(same.currentStepId).toBe('step1')
    expect(same.outcomePicker).toBeNull()
  })

  test('region click on step with no regions does nothing', () => {
    let state = loadedState()
    state = flowReducer(state, { type: 'goto', stepId: 'step3' })  // terminal, no regions
    const same = flowReducer(state, { type: 'region_click', region: 'anything' })
    expect(same.currentStepId).toBe('step3')
  })
})

describe('flowReducer — pick_outcome', () => {
  test('navigates to chosen outcome and clears picker', () => {
    let state = loadedState()
    state = flowReducer(state, { type: 'goto', stepId: 'step2' })
    state = flowReducer(state, { type: 'region_click', region: 'upgrade-btn' })
    expect(state.outcomePicker).not.toBeNull()

    const next = flowReducer(state, { type: 'pick_outcome', stepId: 'step3' })
    expect(next.currentStepId).toBe('step3')
    expect(next.outcomePicker).toBeNull()
    expect(next.history).toEqual(['step1', 'step2', 'step3'])
  })
})

describe('flowReducer — cancel_picker', () => {
  test('clears outcome picker without navigating', () => {
    let state = loadedState()
    state = flowReducer(state, { type: 'goto', stepId: 'step2' })
    state = flowReducer(state, { type: 'region_click', region: 'upgrade-btn' })
    expect(state.outcomePicker).not.toBeNull()

    const next = flowReducer(state, { type: 'cancel_picker' })
    expect(next.outcomePicker).toBeNull()
    expect(next.currentStepId).toBe('step2')  // unchanged
  })
})

describe('flowReducer — toggle_overlay', () => {
  test('toggles showOverlay', () => {
    const state = loadedState()
    expect(state.showOverlay).toBe(true)

    const toggled = flowReducer(state, { type: 'toggle_overlay' })
    expect(toggled.showOverlay).toBe(false)

    const back = flowReducer(toggled, { type: 'toggle_overlay' })
    expect(back.showOverlay).toBe(true)
  })
})

describe('flowReducer — toggle_fullscreen', () => {
  test('toggles isFullscreen', () => {
    const state = loadedState()
    expect(state.isFullscreen).toBe(false)

    const toggled = flowReducer(state, { type: 'toggle_fullscreen' })
    expect(toggled.isFullscreen).toBe(true)

    const back = flowReducer(toggled, { type: 'toggle_fullscreen' })
    expect(back.isFullscreen).toBe(false)
  })
})

// --- Codex review fixes ---

describe('flowReducer — loaded normalizes step IDs', () => {
  test('auto-generates IDs for steps without explicit id', () => {
    const noIdSteps: FlowStep[] = [
      { screen: 'page-a' },
      { screen: 'page-b' },
      { id: 'explicit', screen: 'page-c' },
    ]
    const initial = createFlowInitialState()
    const state = flowReducer(initial, { type: 'loaded', steps: noIdSteps, name: 'Auto ID' })
    expect(state.status).toBe('ready')
    // First step should have a generated id
    expect(state.currentStepId).toBeTruthy()
    expect(state.steps[0].id).toBeTruthy()
    expect(state.steps[1].id).toBeTruthy()
    // Explicit id preserved
    expect(state.steps[2].id).toBe('explicit')
    // All IDs are unique
    const ids = state.steps.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('linear_next works with auto-generated step IDs', () => {
    const noIdSteps: FlowStep[] = [
      { screen: 'page-a' },
      { screen: 'page-b' },
    ]
    const initial = createFlowInitialState()
    const state = flowReducer(initial, { type: 'loaded', steps: noIdSteps, name: 'Test' })
    const next = flowReducer(state, { type: 'linear_next' })
    expect(next.currentStepId).toBe(state.steps[1].id)
  })
})

describe('flowReducer — loaded clears stale error', () => {
  test('clears error after load_error -> loaded recovery', () => {
    let state = createFlowInitialState()
    state = flowReducer(state, { type: 'load_error', error: 'Network failure' })
    expect(state.status).toBe('error')
    expect(state.error).toBe('Network failure')

    state = flowReducer(state, { type: 'loaded', steps: linearSteps, name: 'Recovered' })
    expect(state.status).toBe('ready')
    expect(state.error).toBeUndefined()
  })
})

describe('flowReducer — loaded handles ID collisions', () => {
  test('avoids collision when explicit ID matches step-${i} pattern', () => {
    const collidingSteps: FlowStep[] = [
      { id: 'step-1', screen: 'page-a' },  // explicit id matches generated pattern
      { screen: 'page-b' },                  // would naively get step-1
      { screen: 'page-c' },                  // would naively get step-2
    ]
    const initial = createFlowInitialState()
    const state = flowReducer(initial, { type: 'loaded', steps: collidingSteps, name: 'Collision' })
    const ids = state.steps.map(s => s.id)
    // All IDs must be unique
    expect(new Set(ids).size).toBe(ids.length)
    // Explicit ID preserved
    expect(state.steps[0].id).toBe('step-1')
  })

  test('handles duplicate explicit IDs by making them unique', () => {
    const dupSteps: FlowStep[] = [
      { id: 'dup', screen: 'page-a' },
      { id: 'dup', screen: 'page-b' },
      { screen: 'page-c' },
    ]
    const initial = createFlowInitialState()
    const state = flowReducer(initial, { type: 'loaded', steps: dupSteps, name: 'Dup' })
    const ids = state.steps.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('flowReducer — immutability', () => {
  test('does not mutate previous state', () => {
    const state = loadedState()
    const historyCopy = [...state.history]
    flowReducer(state, { type: 'goto', stepId: 'step2' })
    expect(state.history).toEqual(historyCopy)
    expect(state.currentStepId).toBe('step1')
  })
})
