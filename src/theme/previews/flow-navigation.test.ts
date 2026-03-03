import { test, expect, describe } from 'bun:test'
import { resolveRegionClick, navigateBack, canLinearNext } from './flow-navigation'
import type { FlowStep } from '../../content/preview-types'

const steps: FlowStep[] = [
  {
    id: 'step1',
    screen: 'signup',
    regions: {
      submit: { goto: 'step2' },
      'login-link': { goto: 'step3' },
    },
  },
  {
    id: 'step2',
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
    screen: 'settings',
    terminal: true,
  },
]

describe('resolveRegionClick', () => {
  test('simple goto → returns next step ID', () => {
    const result = resolveRegionClick(steps[0], 'submit')
    expect(result).toEqual({ type: 'goto', stepId: 'step2' })
  })

  test('outcomes → returns pick with outcomes', () => {
    const result = resolveRegionClick(steps[1], 'upgrade-btn')
    expect(result).toEqual({
      type: 'pick',
      outcomes: {
        success: { goto: 'step3', label: 'Paid' },
        failure: { goto: 'step1' },
      },
    })
  })

  test('unknown region → returns null', () => {
    const result = resolveRegionClick(steps[0], 'nonexistent')
    expect(result).toBeNull()
  })

  test('step without regions → returns null', () => {
    const result = resolveRegionClick(steps[2], 'anything')
    expect(result).toBeNull()
  })
})

describe('navigateBack', () => {
  test('pops history stack', () => {
    const history = ['step1', 'step2', 'step3']
    const result = navigateBack(history)
    expect(result).toEqual({ stepId: 'step2', history: ['step1', 'step2'] })
  })

  test('returns null for empty history', () => {
    expect(navigateBack([])).toBeNull()
  })

  test('returns null for single-item history', () => {
    expect(navigateBack(['step1'])).toBeNull()
  })
})

describe('canLinearNext', () => {
  test('step without regions can go linear next', () => {
    const step: FlowStep = { id: 'plain', screen: 'dashboard' }
    expect(canLinearNext(step)).toBe(true)
  })

  test('step with regions cannot go linear next', () => {
    expect(canLinearNext(steps[0])).toBe(false)
  })

  test('terminal step cannot go linear next', () => {
    expect(canLinearNext(steps[2])).toBe(false)
  })
})
