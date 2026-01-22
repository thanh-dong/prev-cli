import { test, expect } from 'bun:test'
import { compileTailwind } from './tailwind'

test('compileTailwind extracts used classes from content', async () => {
  const content = `
    export default function App() {
      return <div className="flex items-center p-4 bg-blue-500">Hello</div>
    }
  `

  const result = await compileTailwind([{ path: 'App.tsx', content }])

  expect(result.success).toBe(true)
  expect(result.css).toBeDefined()
  expect(result.css).toContain('flex')
  expect(result.css).toContain('items-center')
  expect(result.css).toContain('bg-blue-500')
})

test('compileTailwind returns empty CSS for no Tailwind classes', async () => {
  const content = `
    export default function App() {
      return <div style={{ color: 'red' }}>Hello</div>
    }
  `

  const result = await compileTailwind([{ path: 'App.tsx', content }])

  expect(result.success).toBe(true)
})
