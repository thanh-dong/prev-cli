// Zustand store wrapping the flow state machine

import { createStore } from 'zustand/vanilla'
import { flowReducer, createFlowInitialState, type FlowMachineState } from '../machines/flow-machine'
import type { FlowStep } from '../../../content/preview-types'

export interface FlowStoreActions {
  loaded: (steps: FlowStep[], name: string, description?: string) => void
  loadError: (error?: string) => void
  goto: (stepId: string) => void
  back: () => void
  linearNext: () => void
  linearPrev: () => void
  regionClick: (region: string) => void
  pickOutcome: (stepId: string) => void
  cancelPicker: () => void
  toggleOverlay: () => void
  toggleFullscreen: () => void
}

export type FlowStore = FlowMachineState & FlowStoreActions

export function createFlowStore() {
  return createStore<FlowStore>((set) => ({
    ...createFlowInitialState(),
    loaded: (steps, name, description) =>
      set(s => flowReducer(s, { type: 'loaded', steps, name, description })),
    loadError: (error) =>
      set(s => flowReducer(s, { type: 'load_error', error })),
    goto: (stepId) =>
      set(s => flowReducer(s, { type: 'goto', stepId })),
    back: () =>
      set(s => flowReducer(s, { type: 'back' })),
    linearNext: () =>
      set(s => flowReducer(s, { type: 'linear_next' })),
    linearPrev: () =>
      set(s => flowReducer(s, { type: 'linear_prev' })),
    regionClick: (region) =>
      set(s => flowReducer(s, { type: 'region_click', region })),
    pickOutcome: (stepId) =>
      set(s => flowReducer(s, { type: 'pick_outcome', stepId })),
    cancelPicker: () =>
      set(s => flowReducer(s, { type: 'cancel_picker' })),
    toggleOverlay: () =>
      set(s => flowReducer(s, { type: 'toggle_overlay' })),
    toggleFullscreen: () =>
      set(s => flowReducer(s, { type: 'toggle_fullscreen' })),
  }))
}
