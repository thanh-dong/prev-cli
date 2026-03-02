import { test, expect, describe } from 'bun:test'
import { REGION_BRIDGE_SCRIPT } from './region-bridge'

describe('REGION_BRIDGE_SCRIPT', () => {
  test('is valid JavaScript (parses without error)', () => {
    // Bun.Transpiler will throw on syntax errors
    const transpiler = new Bun.Transpiler({ loader: 'js' })
    expect(() => transpiler.transformSync(REGION_BRIDGE_SCRIPT)).not.toThrow()
  })

  test('contains click handler for [data-region]', () => {
    expect(REGION_BRIDGE_SCRIPT).toContain('data-region')
    expect(REGION_BRIDGE_SCRIPT).toContain('click')
  })

  test('contains highlight-regions listener', () => {
    expect(REGION_BRIDGE_SCRIPT).toContain('highlight-regions')
  })

  test('posts region-click message to parent', () => {
    expect(REGION_BRIDGE_SCRIPT).toContain('region-click')
    expect(REGION_BRIDGE_SCRIPT).toContain('postMessage')
  })

  test('reports region-rects with bounding rect data', () => {
    expect(REGION_BRIDGE_SCRIPT).toContain('region-rects')
    expect(REGION_BRIDGE_SCRIPT).toContain('getBoundingClientRect')
    expect(REGION_BRIDGE_SCRIPT).toContain('reportRegionRects')
  })

  test('sends empty region-rects when regions are cleared', () => {
    // When highlight-regions is sent with empty array, bridge should report empty rects
    expect(REGION_BRIDGE_SCRIPT).toContain("{ type: 'region-rects', rects: [] }")
  })

  test('debounces rect reporting on scroll and resize', () => {
    expect(REGION_BRIDGE_SCRIPT).toContain('scroll')
    expect(REGION_BRIDGE_SCRIPT).toContain('resize')
    expect(REGION_BRIDGE_SCRIPT).toContain('debouncedReport')
  })
})
