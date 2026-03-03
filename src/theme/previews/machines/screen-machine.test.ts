import { test, expect, describe } from 'bun:test'
import {
  screenReducer,
  createScreenInitialState,
  type ScreenMachineState,
  type ScreenAction,
} from './screen-machine'

// --- Test fixtures ---

function readyState(overrides?: Partial<ScreenMachineState>): ScreenMachineState {
  return {
    ...createScreenInitialState(['index', 'error', 'loading']),
    status: 'ready',
    ...overrides,
  }
}

// --- Tests ---

describe('createScreenInitialState', () => {
  test('returns loading state with provided states', () => {
    const state = createScreenInitialState(['index', 'error', 'loading'])
    expect(state.status).toBe('loading')
    expect(state.activeState).toBe('index')
    expect(state.availableStates).toEqual(['index', 'error', 'loading'])
    expect(state.viewport).toBe('desktop')
    expect(state.isFullscreen).toBe(false)
    expect(state.error).toBeUndefined()
  })

  test('defaults to index-only when no states provided', () => {
    const state = createScreenInitialState([])
    expect(state.activeState).toBe('index')
    expect(state.availableStates).toEqual([])
  })

  test('accepts initial state override', () => {
    const state = createScreenInitialState(['index', 'error'], 'error')
    expect(state.activeState).toBe('error')
  })
})

describe('screenReducer — set_state', () => {
  test('switches to a valid state', () => {
    const state = readyState()
    const next = screenReducer(state, { type: 'set_state', state: 'error' })
    expect(next.activeState).toBe('error')
  })

  test('ignores switch to non-existent state', () => {
    const state = readyState()
    const same = screenReducer(state, { type: 'set_state', state: 'nonexistent' })
    expect(same.activeState).toBe('index')
  })
})

describe('screenReducer — set_viewport', () => {
  test('switches viewport to mobile', () => {
    const state = readyState()
    const next = screenReducer(state, { type: 'set_viewport', viewport: 'mobile' })
    expect(next.viewport).toBe('mobile')
  })

  test('switches viewport to tablet', () => {
    const state = readyState()
    const next = screenReducer(state, { type: 'set_viewport', viewport: 'tablet' })
    expect(next.viewport).toBe('tablet')
  })

  test('switches viewport to desktop', () => {
    const state = readyState({ viewport: 'mobile' })
    const next = screenReducer(state, { type: 'set_viewport', viewport: 'desktop' })
    expect(next.viewport).toBe('desktop')
  })
})

describe('screenReducer — toggle_fullscreen', () => {
  test('toggles fullscreen on', () => {
    const state = readyState()
    const next = screenReducer(state, { type: 'toggle_fullscreen' })
    expect(next.isFullscreen).toBe(true)
  })

  test('toggles fullscreen off', () => {
    const state = readyState({ isFullscreen: true })
    const next = screenReducer(state, { type: 'toggle_fullscreen' })
    expect(next.isFullscreen).toBe(false)
  })
})

describe('screenReducer — build status FSM', () => {
  test('loading -> building via build_started', () => {
    const state = createScreenInitialState(['index'])
    expect(state.status).toBe('loading')

    const next = screenReducer(state, { type: 'build_started' })
    expect(next.status).toBe('building')
  })

  test('building -> ready via build_ready', () => {
    const state = readyState({ status: 'building' })
    const next = screenReducer(state, { type: 'build_ready' })
    expect(next.status).toBe('ready')
    expect(next.error).toBeUndefined()
  })

  test('build_ready clears previous error', () => {
    const state = readyState({ status: 'building', error: 'previous error' })
    const next = screenReducer(state, { type: 'build_ready' })
    expect(next.error).toBeUndefined()
  })

  test('building -> error via build_error', () => {
    const state = readyState({ status: 'building' })
    const next = screenReducer(state, { type: 'build_error', error: 'Syntax error in component' })
    expect(next.status).toBe('error')
    expect(next.error).toBe('Syntax error in component')
  })

  test('error -> building via build_started (retry)', () => {
    const state = readyState({ status: 'error', error: 'previous' })
    const next = screenReducer(state, { type: 'build_started' })
    expect(next.status).toBe('building')
  })
})

// --- Codex review fixes ---

describe('createScreenInitialState — invalid initial state clamping', () => {
  test('clamps to index when initialState not in availableStates', () => {
    const state = createScreenInitialState(['index', 'error'], 'nonexistent')
    expect(state.activeState).toBe('index')
  })

  test('clamps to first available when initialState invalid and no index', () => {
    const state = createScreenInitialState(['error', 'loading'], 'nonexistent')
    expect(state.activeState).toBe('error')
  })
})

describe('screenReducer — immutability', () => {
  test('does not mutate previous state', () => {
    const state = readyState()
    const original = state.activeState
    screenReducer(state, { type: 'set_state', state: 'error' })
    expect(state.activeState).toBe(original)
  })
})
