import { test, expect, describe, beforeAll } from 'bun:test'
import { writeFiles, useTempDirPerSuite } from '../../test/utils'
import { verifyFlow } from '../content/flow-verifier'
import type { FlowConfig } from '../content/preview-types'

// Build gate integration tests — verifyFlow runs before preview builds
// We test the verifier directly with realistic directory structures
// rather than invoking the full build (which requires theme plugins etc.)

const getTempDir = useTempDirPerSuite('prev-build-gate-test-')

beforeAll(async () => {
  await writeFiles(getTempDir(), {
    // Valid screen
    'previews/screens/signup/index.tsx': `
      export default function Signup() {
        return <button data-region="submit">Go</button>
      }
    `,
    'previews/screens/dashboard/index.tsx': `
      export default function Dashboard() { return <div>Done</div> }
    `,
  })
})

describe('build gate: flow verification', () => {
  test('build with broken flow reference throws', () => {
    const config: FlowConfig = {
      title: 'Broken',
      steps: [
        { id: 'step1', screen: 'signup', regions: { submit: { goto: 'step2' } } },
        { id: 'step2', screen: 'no-such-screen', terminal: true },
      ],
    }
    const result = verifyFlow(config, getTempDir())
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some(e => e.includes('no-such-screen'))).toBe(true)
  })

  test('build with valid flow succeeds', () => {
    const config: FlowConfig = {
      title: 'Valid',
      steps: [
        { id: 'step1', screen: 'signup', regions: { submit: { goto: 'step2' } } },
        { id: 'step2', screen: 'dashboard', terminal: true },
      ],
    }
    const result = verifyFlow(config, getTempDir())
    expect(result.errors).toHaveLength(0)
  })
})
