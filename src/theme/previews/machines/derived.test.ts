import { test, expect, describe } from 'bun:test'
import {
  getCurrentStep,
  getCanLinearNext,
  flowIframeUrl,
  screenIframeUrl,
} from './derived'
import type { FlowMachineState } from './flow-machine'
import type { ScreenMachineState } from './screen-machine'
import type { FlowStep } from '../../../content/preview-types'

// --- Test fixtures ---

const steps: FlowStep[] = [
  { id: 'step1', screen: 'signup', regions: { submit: { goto: 'step2' } } },
  { id: 'step2', screen: 'dashboard' },
  { id: 'step3', screen: 'settings', terminal: true },
]

function flowState(overrides?: Partial<FlowMachineState>): FlowMachineState {
  return {
    status: 'ready',
    name: 'Test',
    steps,
    currentStepId: 'step1',
    history: ['step1'],
    outcomePicker: null,
    showOverlay: true,
    isFullscreen: false,
    ...overrides,
  }
}

function screenState(overrides?: Partial<ScreenMachineState>): ScreenMachineState {
  return {
    status: 'ready',
    activeState: 'index',
    availableStates: ['index', 'error'],
    viewport: 'desktop',
    isFullscreen: false,
    ...overrides,
  }
}

// --- getCurrentStep ---

describe('getCurrentStep', () => {
  test('returns current step by id', () => {
    const state = flowState({ currentStepId: 'step2' })
    const step = getCurrentStep(state)
    expect(step).toEqual(steps[1])
  })

  test('returns null when currentStepId is null', () => {
    const state = flowState({ currentStepId: null })
    expect(getCurrentStep(state)).toBeNull()
  })

  test('returns null when step id not found', () => {
    const state = flowState({ currentStepId: 'nonexistent' })
    expect(getCurrentStep(state)).toBeNull()
  })
})

// --- getCanLinearNext ---

describe('getCanLinearNext', () => {
  test('returns true for step without regions and not terminal', () => {
    const state = flowState({ currentStepId: 'step2' })  // dashboard, no regions
    expect(getCanLinearNext(state)).toBe(true)
  })

  test('returns false for step with regions', () => {
    const state = flowState({ currentStepId: 'step1' })  // signup, has regions
    expect(getCanLinearNext(state)).toBe(false)
  })

  test('returns false for terminal step', () => {
    const state = flowState({ currentStepId: 'step3' })  // terminal
    expect(getCanLinearNext(state)).toBe(false)
  })

  test('returns false when no current step', () => {
    const state = flowState({ currentStepId: null })
    expect(getCanLinearNext(state)).toBe(false)
  })
})

// --- flowIframeUrl ---

describe('flowIframeUrl', () => {
  test('dev mode: generates runtime URL without state', () => {
    const state = flowState({ currentStepId: 'step1' })
    const url = flowIframeUrl(state, '', false)
    expect(url).toBe('/_preview-runtime?src=screens/signup')
  })

  test('dev mode: generates runtime URL with state', () => {
    const stepsWithState: FlowStep[] = [
      { id: 'step1', screen: 'signup', state: 'success' },
    ]
    const state = flowState({ steps: stepsWithState, currentStepId: 'step1' })
    const url = flowIframeUrl(state, '', false)
    expect(url).toBe('/_preview-runtime?src=screens/signup&state=success')
  })

  test('static mode: generates preview path without state', () => {
    const state = flowState({ currentStepId: 'step1' })
    const url = flowIframeUrl(state, '/docs', true)
    expect(url).toBe('/docs/_preview/screens/signup/')
  })

  test('static mode: generates preview path with state', () => {
    const stepsWithState: FlowStep[] = [
      { id: 'step1', screen: 'signup', state: 'success' },
    ]
    const state = flowState({ steps: stepsWithState, currentStepId: 'step1' })
    const url = flowIframeUrl(state, '/docs', true)
    expect(url).toBe('/docs/_preview/screens/signup/success/')
  })

  test('handles ref-object screen format', () => {
    const stepsWithRef: FlowStep[] = [
      { id: 'step1', screen: { ref: 'signup' } },
    ]
    const state = flowState({ steps: stepsWithRef, currentStepId: 'step1' })
    const url = flowIframeUrl(state, '', false)
    expect(url).toBe('/_preview-runtime?src=screens/signup')
  })

  test('returns empty string when no current step', () => {
    const state = flowState({ currentStepId: null })
    expect(flowIframeUrl(state, '', false)).toBe('')
  })

  // Codex review: full-path screen refs should not double-prefix
  test('dev mode: strips screens/ prefix from full-path ref', () => {
    const stepsWithFullPath: FlowStep[] = [
      { id: 'step1', screen: 'screens/login' },
    ]
    const state = flowState({ steps: stepsWithFullPath, currentStepId: 'step1' })
    const url = flowIframeUrl(state, '', false)
    expect(url).toBe('/_preview-runtime?src=screens/login')
  })

  test('static mode: strips screens/ prefix from full-path ref', () => {
    const stepsWithFullPath: FlowStep[] = [
      { id: 'step1', screen: 'screens/login' },
    ]
    const state = flowState({ steps: stepsWithFullPath, currentStepId: 'step1' })
    const url = flowIframeUrl(state, '/docs', true)
    expect(url).toBe('/docs/_preview/screens/login/')
  })

  test('dev mode: strips screens/ prefix from full-path ref object', () => {
    const stepsWithFullPath: FlowStep[] = [
      { id: 'step1', screen: { ref: 'screens/login' } },
    ]
    const state = flowState({ steps: stepsWithFullPath, currentStepId: 'step1' })
    const url = flowIframeUrl(state, '', false)
    expect(url).toBe('/_preview-runtime?src=screens/login')
  })
})

describe('flowIframeUrl — URL encoding', () => {
  test('dev mode: encodes state with special characters', () => {
    const stepsWithSpecial: FlowStep[] = [
      { id: 'step1', screen: 'signup', state: 'foo&x=1' },
    ]
    const state = flowState({ steps: stepsWithSpecial, currentStepId: 'step1' })
    const url = flowIframeUrl(state, '', false)
    expect(url).toBe('/_preview-runtime?src=screens/signup&state=foo%26x%3D1')
  })

  test('static mode: encodes state with slashes', () => {
    const stepsWithSlash: FlowStep[] = [
      { id: 'step1', screen: 'signup', state: 'foo/bar' },
    ]
    const state = flowState({ steps: stepsWithSlash, currentStepId: 'step1' })
    const url = flowIframeUrl(state, '/docs', true)
    expect(url).toBe('/docs/_preview/screens/signup/foo%2Fbar/')
  })
})

// --- screenIframeUrl ---

describe('screenIframeUrl', () => {
  test('dev mode: generates runtime URL for default state', () => {
    const state = screenState()
    const url = screenIframeUrl(state, 'dashboard', '', false)
    expect(url).toBe('/_preview-runtime?preview=screens/dashboard&state=index')
  })

  test('dev mode: generates runtime URL for named state', () => {
    const state = screenState({ activeState: 'error' })
    const url = screenIframeUrl(state, 'dashboard', '', false)
    expect(url).toBe('/_preview-runtime?preview=screens/dashboard&state=error')
  })

  test('static mode: generates preview path for default state', () => {
    const state = screenState()
    const url = screenIframeUrl(state, 'dashboard', '/docs', true)
    expect(url).toBe('/docs/_preview/screens/dashboard/')
  })

  test('static mode: generates preview path for named state', () => {
    const state = screenState({ activeState: 'error' })
    const url = screenIframeUrl(state, 'dashboard', '/docs', true)
    expect(url).toBe('/docs/_preview/screens/dashboard/error/')
  })
})

describe('screenIframeUrl — URL encoding', () => {
  test('dev mode: encodes state with special characters', () => {
    const state = screenState({ activeState: 'foo&x=1' })
    const url = screenIframeUrl(state, 'dashboard', '', false)
    expect(url).toBe('/_preview-runtime?preview=screens/dashboard&state=foo%26x%3D1')
  })

  test('static mode: encodes state with slashes', () => {
    const state = screenState({ activeState: 'foo/bar' })
    const url = screenIframeUrl(state, 'dashboard', '/docs', true)
    expect(url).toBe('/docs/_preview/screens/dashboard/foo%2Fbar/')
  })
})
