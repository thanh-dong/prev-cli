import { test, expect, describe, beforeAll } from 'bun:test'
import { extractRegions, verifyFlow } from './flow-verifier'
import { useTempDirPerSuite, writeFiles } from '../../test/utils'
import type { FlowConfig } from './preview-types'

// --- Cycle 1.1: Region extraction from TSX via Bun.Transpiler ---

describe('extractRegions', () => {
  test('finds data-region attributes in TSX source', () => {
    const source = `
      export default function Signup() {
        return (
          <div>
            <button data-region="submit">Go</button>
            <a data-region="login-link" href="#">Login</a>
          </div>
        )
      }
    `
    expect(extractRegions(source)).toEqual(['submit', 'login-link'])
  })

  test('returns empty array when no regions', () => {
    const source = `
      export default function Plain() {
        return <div>Hello</div>
      }
    `
    expect(extractRegions(source)).toEqual([])
  })

  test('deduplicates region names', () => {
    const source = `
      export default function Dup() {
        return (
          <div>
            <button data-region="submit">Go</button>
            <button data-region="submit">Also Go</button>
          </div>
        )
      }
    `
    expect(extractRegions(source)).toEqual(['submit'])
  })

  test('finds nested regions', () => {
    const source = `
      export default function Nested() {
        return (
          <div data-region="outer">
            <div>
              <button data-region="inner">Click</button>
            </div>
          </div>
        )
      }
    `
    const regions = extractRegions(source)
    expect(regions).toContain('outer')
    expect(regions).toContain('inner')
    expect(regions).toHaveLength(2)
  })

  test('handles regions in conditional rendering', () => {
    const source = `
      export default function Cond({ show }: { show: boolean }) {
        return (
          <div>
            {show && <button data-region="conditional">Maybe</button>}
            <a data-region="always">Always</a>
          </div>
        )
      }
    `
    const regions = extractRegions(source)
    expect(regions).toContain('conditional')
    expect(regions).toContain('always')
  })
})

// --- Cycle 1.3: Flow structural verification ---

const getTempDir = useTempDirPerSuite('prev-flow-verifier-test-')

beforeAll(async () => {
  await writeFiles(getTempDir(), {
    // Valid screen with regions
    'previews/screens/signup/index.tsx': `
      export default function Signup() {
        return (
          <div>
            <button data-region="submit">Go</button>
            <a data-region="login-link" href="#">Login</a>
          </div>
        )
      }
    `,
    'previews/screens/signup/success.tsx': `
      export default function Success() { return <div>Done</div> }
    `,
    // Valid screen without regions
    'previews/screens/dashboard/index.tsx': `
      export default function Dashboard() { return <div>Dashboard</div> }
    `,
    // Screen with a region
    'previews/screens/pricing/index.tsx': `
      export default function Pricing() {
        return <button data-region="upgrade-btn">Upgrade</button>
      }
    `,
  })
})

describe('verifyFlow', () => {
  test('missing screen directory → error', () => {
    const config: FlowConfig = {
      title: 'Test',
      steps: [
        { id: 'step1', screen: 'nonexistent' },
      ],
    }
    const result = verifyFlow(config, getTempDir())
    expect(result.errors.some(e => e.includes('nonexistent'))).toBe(true)
  })

  test('missing state file → error', () => {
    const config: FlowConfig = {
      title: 'Test',
      steps: [
        { id: 'step1', screen: 'signup', state: 'nope' },
      ],
    }
    const result = verifyFlow(config, getTempDir())
    expect(result.errors.some(e => e.includes('nope'))).toBe(true)
  })

  test('missing region in screen source → error', () => {
    const config: FlowConfig = {
      title: 'Test',
      steps: [
        { id: 'step1', screen: 'signup', regions: { 'missing-region': { goto: 'step2' } } },
        { id: 'step2', screen: 'dashboard', terminal: true },
      ],
    }
    const result = verifyFlow(config, getTempDir())
    expect(result.errors.some(e => e.includes('missing-region'))).toBe(true)
  })

  test('goto targets nonexistent step → error', () => {
    const config: FlowConfig = {
      title: 'Test',
      steps: [
        { id: 'step1', screen: 'signup', regions: { submit: { goto: 'nowhere' } } },
      ],
    }
    const result = verifyFlow(config, getTempDir())
    expect(result.errors.some(e => e.includes('nowhere'))).toBe(true)
  })

  test('duplicate step IDs → error', () => {
    const config: FlowConfig = {
      title: 'Test',
      steps: [
        { id: 'dup', screen: 'signup' },
        { id: 'dup', screen: 'dashboard' },
      ],
    }
    const result = verifyFlow(config, getTempDir())
    expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true)
  })

  test('dead-end step (no regions, not terminal) → warning', () => {
    const config: FlowConfig = {
      title: 'Test',
      steps: [
        { id: 'step1', screen: 'signup', regions: { submit: { goto: 'step2' } } },
        { id: 'step2', screen: 'dashboard' }, // no regions, not terminal
      ],
    }
    const result = verifyFlow(config, getTempDir())
    expect(result.warnings.some(w => w.includes('dead-end'))).toBe(true)
  })

  test('terminal step with no regions → no warning', () => {
    const config: FlowConfig = {
      title: 'Test',
      steps: [
        { id: 'step1', screen: 'signup', regions: { submit: { goto: 'final' } } },
        { id: 'final', screen: 'dashboard', terminal: true },
      ],
    }
    const result = verifyFlow(config, getTempDir())
    expect(result.warnings.filter(w => w.includes('dead-end'))).toHaveLength(0)
  })

  test('orphan step (unreachable) → warning', () => {
    const config: FlowConfig = {
      title: 'Test',
      steps: [
        { id: 'step1', screen: 'signup', regions: { submit: { goto: 'step2' } } },
        { id: 'step2', screen: 'dashboard', terminal: true },
        { id: 'orphan', screen: 'dashboard' }, // unreachable
      ],
    }
    const result = verifyFlow(config, getTempDir())
    expect(result.warnings.some(w => w.includes('orphan') || w.includes('unreachable'))).toBe(true)
  })

  test('valid flow with regions → no errors, no warnings', () => {
    const config: FlowConfig = {
      title: 'Test',
      steps: [
        { id: 'step1', screen: 'signup', regions: { submit: { goto: 'step2' }, 'login-link': { goto: 'step2' } } },
        { id: 'step2', screen: 'dashboard', terminal: true },
      ],
    }
    const result = verifyFlow(config, getTempDir())
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })
})
