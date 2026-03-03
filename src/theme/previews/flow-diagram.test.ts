import { test, expect, describe } from 'bun:test'
import { flowToMermaid } from './flow-diagram'
import type { FlowStep } from '../../content/preview-types'

describe('flowToMermaid', () => {
  test('simple linear flow → sequential edges', () => {
    const steps: FlowStep[] = [
      { id: 'login', title: 'Login', screen: 'login' },
      { id: 'dashboard', title: 'Dashboard', screen: 'dashboard' },
      { id: 'profile', title: 'Profile', screen: 'profile' },
    ]
    const result = flowToMermaid(steps)
    expect(result).toContain('graph TD')
    expect(result).toContain('login["Login"]')
    expect(result).toContain('dashboard["Dashboard"]')
    expect(result).toContain('profile["Profile"]')
    expect(result).toContain('login --> dashboard')
    expect(result).toContain('dashboard --> profile')
  })

  test('flow with goto regions → labeled edges', () => {
    const steps: FlowStep[] = [
      {
        id: 'signup',
        title: 'Sign Up',
        screen: 'signup',
        regions: {
          submit: { goto: 'verify' },
          'login-link': { goto: 'login' },
        },
      },
      { id: 'verify', title: 'Verify Email', screen: 'verify' },
      { id: 'login', title: 'Login', screen: 'login' },
    ]
    const result = flowToMermaid(steps)
    expect(result).toContain('signup -->|"submit"| verify')
    expect(result).toContain('signup -->|"login-link"| login')
    // signup has regions so no sequential edge from signup
    expect(result).not.toContain('signup --> verify\n')
  })

  test('flow with outcome regions → multiple labeled edges per region', () => {
    const steps: FlowStep[] = [
      {
        id: 'payment',
        title: 'Payment',
        screen: 'payment',
        regions: {
          'pay-btn': {
            outcomes: {
              success: { goto: 'confirm', label: 'Payment OK' },
              failure: { goto: 'error' },
            },
          },
        },
      },
      { id: 'confirm', title: 'Confirmation', screen: 'confirm' },
      { id: 'error', title: 'Error', screen: 'error' },
    ]
    const result = flowToMermaid(steps)
    expect(result).toContain('payment -->|"Payment OK"| confirm')
    expect(result).toContain('payment -->|"failure"| error')
  })

  test('terminal step → stadium shape', () => {
    const steps: FlowStep[] = [
      { id: 'start', title: 'Start', screen: 'start' },
      { id: 'end', title: 'Done', screen: 'done', terminal: true },
    ]
    const result = flowToMermaid(steps)
    expect(result).toContain('end([["Done"]])')
    expect(result).toContain('start["Start"]')
    // Terminal step should not have a sequential edge out
    expect(result).not.toContain('end -->')
  })

  test('current step highlighting → classDef applied', () => {
    const steps: FlowStep[] = [
      { id: 'a', title: 'Step A', screen: 'a' },
      { id: 'b', title: 'Step B', screen: 'b' },
    ]
    const result = flowToMermaid(steps, { currentStepId: 'a' })
    expect(result).toContain('classDef current fill:#3b82f6,stroke:#2563eb,color:#fff')
    expect(result).toContain('class a current')
  })

  test('visited steps highlighting → classDef applied', () => {
    const steps: FlowStep[] = [
      { id: 'a', title: 'Step A', screen: 'a' },
      { id: 'b', title: 'Step B', screen: 'b' },
      { id: 'c', title: 'Step C', screen: 'c' },
    ]
    const result = flowToMermaid(steps, {
      currentStepId: 'c',
      visitedStepIds: ['a', 'b', 'c'],
    })
    expect(result).toContain('class c current')
    expect(result).toContain('class a visited')
    expect(result).toContain('class b visited')
    // Current step should NOT also be marked as visited
    expect(result).not.toMatch(/class c visited/)
  })

  test('empty steps array → returns minimal valid mermaid', () => {
    const result = flowToMermaid([])
    expect(result).toBe('graph TD\n')
  })

  test('step titles with special characters → properly escaped', () => {
    const steps: FlowStep[] = [
      { id: 'special', title: 'Step "with" <quotes> & symbols', screen: 'special' },
    ]
    const result = flowToMermaid(steps)
    expect(result).toContain('#quot;')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
    expect(result).not.toContain('<quotes>')
  })

  test('steps without explicit ids use index-based ids', () => {
    const steps: FlowStep[] = [
      { title: 'First', screen: 'first' },
      { title: 'Second', screen: 'second' },
    ]
    const result = flowToMermaid(steps)
    expect(result).toContain('step-0["First"]')
    expect(result).toContain('step-1["Second"]')
    expect(result).toContain('step-0 --> step-1')
  })

  test('sequential edges stop before terminal steps', () => {
    const steps: FlowStep[] = [
      { id: 'a', title: 'A', screen: 'a' },
      { id: 'b', title: 'B', screen: 'b', terminal: true },
    ]
    const result = flowToMermaid(steps)
    expect(result).toContain('a --> b')
    // b is terminal, no edge out
    expect(result).not.toContain('b -->')
  })
})
