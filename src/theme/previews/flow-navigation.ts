// Pure navigation logic for interactive flows — no React deps

import type { FlowStep } from '../../content/preview-types'

export type RegionClickResult =
  | { type: 'goto'; stepId: string }
  | { type: 'pick'; outcomes: Record<string, { goto: string; label?: string }> }

/**
 * Resolve a region click on a step.
 * Returns goto target, outcomes to pick from, or null if region is unknown.
 */
export function resolveRegionClick(step: FlowStep, regionName: string): RegionClickResult | null {
  if (!step.regions) return null

  const region = step.regions[regionName]
  if (!region) return null

  if ('goto' in region) {
    return { type: 'goto', stepId: region.goto }
  }

  if ('outcomes' in region) {
    return { type: 'pick', outcomes: region.outcomes }
  }

  return null
}

/**
 * Navigate back in history. Pops the current step and returns the previous one.
 */
export function navigateBack(history: string[]): { stepId: string; history: string[] } | null {
  if (history.length <= 1) return null
  const newHistory = history.slice(0, -1)
  return { stepId: newHistory[newHistory.length - 1], history: newHistory }
}

/**
 * Whether a step allows linear (prev/next arrow) navigation.
 * Steps with regions require clicking a region. Terminal steps have no next.
 */
export function canLinearNext(step: FlowStep): boolean {
  if (step.terminal) return false
  if (step.regions && Object.keys(step.regions).length > 0) return false
  return true
}
