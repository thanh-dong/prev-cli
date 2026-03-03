import { test, expect, describe } from 'bun:test'
import { createScreenStore } from './screen-store'

describe('createScreenStore', () => {
  test('starts in loading state', () => {
    const store = createScreenStore(['index', 'error'])
    expect(store.getState().status).toBe('loading')
    expect(store.getState().activeState).toBe('index')
    expect(store.getState().availableStates).toEqual(['index', 'error'])
  })

  test('accepts initial state override', () => {
    const store = createScreenStore(['index', 'error'], 'error')
    expect(store.getState().activeState).toBe('error')
  })

  test('setState switches to valid state', () => {
    const store = createScreenStore(['index', 'error'])
    store.getState().setState('error')
    expect(store.getState().activeState).toBe('error')
  })

  test('setState ignores invalid state', () => {
    const store = createScreenStore(['index', 'error'])
    store.getState().setState('nonexistent')
    expect(store.getState().activeState).toBe('index')
  })

  test('setViewport switches viewport', () => {
    const store = createScreenStore(['index'])
    store.getState().setViewport('mobile')
    expect(store.getState().viewport).toBe('mobile')
  })

  test('toggleFullscreen toggles', () => {
    const store = createScreenStore(['index'])
    expect(store.getState().isFullscreen).toBe(false)
    store.getState().toggleFullscreen()
    expect(store.getState().isFullscreen).toBe(true)
  })

  test('build status FSM: loading -> building -> ready', () => {
    const store = createScreenStore(['index'])
    expect(store.getState().status).toBe('loading')
    store.getState().buildStarted()
    expect(store.getState().status).toBe('building')
    store.getState().buildReady()
    expect(store.getState().status).toBe('ready')
    expect(store.getState().error).toBeUndefined()
  })

  test('build status FSM: building -> error', () => {
    const store = createScreenStore(['index'])
    store.getState().buildStarted()
    store.getState().buildError('Syntax error')
    expect(store.getState().status).toBe('error')
    expect(store.getState().error).toBe('Syntax error')
  })

  test('build_ready clears previous error', () => {
    const store = createScreenStore(['index'])
    store.getState().buildStarted()
    store.getState().buildError('oops')
    store.getState().buildStarted()
    store.getState().buildReady()
    expect(store.getState().error).toBeUndefined()
  })
})
