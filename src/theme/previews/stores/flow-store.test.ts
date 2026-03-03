import { test, expect, describe } from 'bun:test'
import { createFlowStore } from './flow-store'
import type { FlowStep } from '../../../content/preview-types'

const steps: FlowStep[] = [
  {
    id: 'step1',
    title: 'Sign Up',
    screen: 'signup',
    regions: {
      submit: { goto: 'step2' },
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
    title: 'Done',
    screen: 'settings',
    terminal: true,
  },
]

describe('createFlowStore', () => {
  test('starts in loading state', () => {
    const store = createFlowStore()
    expect(store.getState().status).toBe('loading')
    expect(store.getState().currentStepId).toBeNull()
  })

  test('loaded action transitions to ready with steps', () => {
    const store = createFlowStore()
    store.getState().loaded(steps, 'Test Flow', 'A flow')
    const state = store.getState()
    expect(state.status).toBe('ready')
    expect(state.name).toBe('Test Flow')
    expect(state.steps).toEqual(steps)
    expect(state.currentStepId).toBe('step1')
  })

  test('goto navigates and updates history', () => {
    const store = createFlowStore()
    store.getState().loaded(steps, 'Test')
    store.getState().goto('step2')
    expect(store.getState().currentStepId).toBe('step2')
    expect(store.getState().history).toEqual(['step1', 'step2'])
  })

  test('back pops history', () => {
    const store = createFlowStore()
    store.getState().loaded(steps, 'Test')
    store.getState().goto('step2')
    store.getState().back()
    expect(store.getState().currentStepId).toBe('step1')
    expect(store.getState().history).toEqual(['step1'])
  })

  test('regionClick with goto navigates', () => {
    const store = createFlowStore()
    store.getState().loaded(steps, 'Test')
    store.getState().regionClick('submit')
    expect(store.getState().currentStepId).toBe('step2')
  })

  test('regionClick with outcomes opens picker', () => {
    const store = createFlowStore()
    store.getState().loaded(steps, 'Test')
    store.getState().goto('step2')
    store.getState().regionClick('upgrade-btn')
    expect(store.getState().outcomePicker).not.toBeNull()
    expect(store.getState().currentStepId).toBe('step2')
  })

  test('pickOutcome navigates and clears picker', () => {
    const store = createFlowStore()
    store.getState().loaded(steps, 'Test')
    store.getState().goto('step2')
    store.getState().regionClick('upgrade-btn')
    store.getState().pickOutcome('step3')
    expect(store.getState().currentStepId).toBe('step3')
    expect(store.getState().outcomePicker).toBeNull()
  })

  test('cancelPicker clears picker without navigating', () => {
    const store = createFlowStore()
    store.getState().loaded(steps, 'Test')
    store.getState().goto('step2')
    store.getState().regionClick('upgrade-btn')
    store.getState().cancelPicker()
    expect(store.getState().outcomePicker).toBeNull()
    expect(store.getState().currentStepId).toBe('step2')
  })

  test('toggleOverlay toggles showOverlay', () => {
    const store = createFlowStore()
    expect(store.getState().showOverlay).toBe(true)
    store.getState().toggleOverlay()
    expect(store.getState().showOverlay).toBe(false)
  })

  test('toggleFullscreen toggles isFullscreen', () => {
    const store = createFlowStore()
    expect(store.getState().isFullscreen).toBe(false)
    store.getState().toggleFullscreen()
    expect(store.getState().isFullscreen).toBe(true)
  })

  test('linearNext advances for non-region steps', () => {
    const linearSteps: FlowStep[] = [
      { id: 'a', screen: 'page-a' },
      { id: 'b', screen: 'page-b' },
    ]
    const store = createFlowStore()
    store.getState().loaded(linearSteps, 'Test')
    store.getState().linearNext()
    expect(store.getState().currentStepId).toBe('b')
  })

  test('linearPrev goes back', () => {
    const linearSteps: FlowStep[] = [
      { id: 'a', screen: 'page-a' },
      { id: 'b', screen: 'page-b' },
    ]
    const store = createFlowStore()
    store.getState().loaded(linearSteps, 'Test')
    store.getState().linearNext()
    store.getState().linearPrev()
    expect(store.getState().currentStepId).toBe('a')
  })

  // Codex review: missing store-level tests
  test('loadError sets error state', () => {
    const store = createFlowStore()
    store.getState().loadError('Network failure')
    expect(store.getState().status).toBe('error')
    expect(store.getState().error).toBe('Network failure')
  })

  test('load_error -> loaded clears stale error', () => {
    const store = createFlowStore()
    store.getState().loadError('oops')
    store.getState().loaded(steps, 'Recovered')
    expect(store.getState().status).toBe('ready')
    expect(store.getState().error).toBeUndefined()
  })
})
