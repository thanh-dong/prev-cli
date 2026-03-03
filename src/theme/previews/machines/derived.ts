// Pure derived-value functions — no React, no side effects

import type { FlowStep } from '../../../content/preview-types'
import type { FlowMachineState } from './flow-machine'
import type { ScreenMachineState } from './screen-machine'

/**
 * Get the current step from flow state.
 */
export function getCurrentStep(state: FlowMachineState): FlowStep | null {
  if (!state.currentStepId) return null
  return state.steps.find(s => s.id === state.currentStepId) ?? null
}

/**
 * Whether the current step allows linear (prev/next arrow) navigation.
 * Steps with regions require clicking a region. Terminal steps have no next.
 */
export function getCanLinearNext(state: FlowMachineState): boolean {
  const step = getCurrentStep(state)
  if (!step) return false
  if (step.terminal) return false
  if (step.regions && Object.keys(step.regions).length > 0) return false
  return true
}

/**
 * Resolve the screen name from a step's screen field (string or {ref} object).
 * Strips leading "screens/" prefix to avoid double-prefixing in URLs.
 */
function resolveScreenName(screen: FlowStep['screen']): string {
  const raw = typeof screen === 'string' ? screen : screen.ref
  return raw.replace(/^screens\//, '')
}

/**
 * Build iframe URL for a flow preview step.
 */
export function flowIframeUrl(
  state: FlowMachineState,
  basePath: string,
  isStatic: boolean,
): string {
  const step = getCurrentStep(state)
  if (!step) return ''

  const screenName = resolveScreenName(step.screen)

  if (isStatic) {
    const statePath = step.state ? `${encodeURIComponent(step.state)}/` : ''
    return `${basePath}/_preview/screens/${screenName}/${statePath}`
  }

  const stateParam = step.state ? `&state=${encodeURIComponent(step.state)}` : ''
  return `/_preview-runtime?src=screens/${screenName}${stateParam}`
}

/**
 * Build iframe URL for a screen preview.
 */
export function screenIframeUrl(
  state: ScreenMachineState,
  unitName: string,
  basePath: string,
  isStatic: boolean,
): string {
  if (isStatic) {
    const statePath = state.activeState === 'index' ? '' : `${encodeURIComponent(state.activeState)}/`
    return `${basePath}/_preview/screens/${unitName}/${statePath}`
  }

  return `/_preview-runtime?preview=screens/${unitName}&state=${encodeURIComponent(state.activeState)}`
}
