// Zustand store wrapping the screen state machine

import { createStore } from 'zustand/vanilla'
import { screenReducer, createScreenInitialState, type ScreenMachineState } from '../machines/screen-machine'

export interface ScreenStoreActions {
  setState: (state: string) => void
  setViewport: (viewport: 'mobile' | 'tablet' | 'desktop') => void
  toggleFullscreen: () => void
  buildStarted: () => void
  buildReady: () => void
  buildError: (error: string) => void
}

export type ScreenStore = ScreenMachineState & ScreenStoreActions

export function createScreenStore(availableStates: string[], initialState?: string) {
  return createStore<ScreenStore>((set) => ({
    ...createScreenInitialState(availableStates, initialState),
    setState: (state) =>
      set(s => screenReducer(s, { type: 'set_state', state })),
    setViewport: (viewport) =>
      set(s => screenReducer(s, { type: 'set_viewport', viewport })),
    toggleFullscreen: () =>
      set(s => screenReducer(s, { type: 'toggle_fullscreen' })),
    buildStarted: () =>
      set(s => screenReducer(s, { type: 'build_started' })),
    buildReady: () =>
      set(s => screenReducer(s, { type: 'build_ready' })),
    buildError: (error) =>
      set(s => screenReducer(s, { type: 'build_error', error })),
  }))
}
