// Pure screen state machine — zero React imports

// --- State ---

export interface ScreenMachineState {
  status: 'loading' | 'building' | 'ready' | 'error'
  activeState: string
  availableStates: string[]
  viewport: 'mobile' | 'tablet' | 'desktop'
  isFullscreen: boolean
  error?: string
}

// --- Actions ---

export type ScreenAction =
  | { type: 'set_state'; state: string }
  | { type: 'set_viewport'; viewport: 'mobile' | 'tablet' | 'desktop' }
  | { type: 'toggle_fullscreen' }
  | { type: 'build_started' }
  | { type: 'build_ready' }
  | { type: 'build_error'; error: string }

// --- Initial state ---

export function createScreenInitialState(
  availableStates: string[],
  initialState?: string,
): ScreenMachineState {
  // Clamp: use initialState if valid, else 'index' if available, else first available, else 'index'
  let active = 'index'
  if (initialState && availableStates.includes(initialState)) {
    active = initialState
  } else if (availableStates.includes('index')) {
    active = 'index'
  } else if (availableStates.length > 0) {
    active = availableStates[0]
  }

  return {
    status: 'loading',
    activeState: active,
    availableStates,
    viewport: 'desktop',
    isFullscreen: false,
  }
}

// --- Reducer ---

export function screenReducer(state: ScreenMachineState, action: ScreenAction): ScreenMachineState {
  switch (action.type) {
    case 'set_state': {
      if (!state.availableStates.includes(action.state)) return state
      return { ...state, activeState: action.state }
    }

    case 'set_viewport':
      return { ...state, viewport: action.viewport }

    case 'toggle_fullscreen':
      return { ...state, isFullscreen: !state.isFullscreen }

    case 'build_started':
      return { ...state, status: 'building' }

    case 'build_ready':
      return { ...state, status: 'ready', error: undefined }

    case 'build_error':
      return { ...state, status: 'error', error: action.error }

    default:
      return state
  }
}
