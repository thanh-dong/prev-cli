// Pure function: converts FlowStep[] to Mermaid graph TD source string

import type { FlowStep } from '../../content/preview-types'

interface FlowDiagramOptions {
  currentStepId?: string
  visitedStepIds?: string[]
}

/** Escape special characters for mermaid node labels */
function escapeLabel(label: string): string {
  return label
    .replace(/"/g, '#quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Escape special characters for mermaid edge labels */
function escapeEdgeLabel(label: string): string {
  return label
    .replace(/"/g, "'")
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function flowToMermaid(steps: FlowStep[], options?: FlowDiagramOptions): string {
  if (steps.length === 0) {
    return 'graph TD\n'
  }

  const lines: string[] = ['graph TD']
  const currentStepId = options?.currentStepId
  const visitedStepIds = new Set(options?.visitedStepIds || [])

  // Collect all edges to track which steps already have outgoing connections
  const stepsWithEdges = new Set<string>()

  // First pass: collect edges from regions
  for (const step of steps) {
    const stepId = step.id || `step-${steps.indexOf(step)}`
    if (!step.regions) continue
    for (const [, region] of Object.entries(step.regions)) {
      if ('goto' in region || 'outcomes' in region) {
        stepsWithEdges.add(stepId)
        break
      }
    }
  }

  // Node definitions
  for (const step of steps) {
    const stepId = step.id || `step-${steps.indexOf(step)}`
    const title = escapeLabel(step.title || stepId)
    if (step.terminal) {
      lines.push(`  ${stepId}([["${title}"]])`)
    } else {
      lines.push(`  ${stepId}["${title}"]`)
    }
  }

  // Edge definitions
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const stepId = step.id || `step-${i}`

    if (step.regions) {
      for (const [regionName, region] of Object.entries(step.regions)) {
        if ('goto' in region) {
          lines.push(`  ${stepId} -->|"${escapeEdgeLabel(regionName)}"| ${region.goto}`)
        } else if ('outcomes' in region) {
          for (const [outcomeKey, outcome] of Object.entries(region.outcomes)) {
            const label = outcome.label || outcomeKey
            lines.push(`  ${stepId} -->|"${escapeEdgeLabel(label)}"| ${outcome.goto}`)
          }
        }
      }
    }

    // Sequential edge for steps without regions and not terminal
    if (!step.regions && !step.terminal && !stepsWithEdges.has(stepId) && i < steps.length - 1) {
      const nextStep = steps[i + 1]
      const nextId = nextStep.id || `step-${i + 1}`
      lines.push(`  ${stepId} --> ${nextId}`)
    }
  }

  // Class definitions for highlighting
  const needsCurrent = currentStepId && steps.some(s => s.id === currentStepId)
  const visitedIds = steps
    .filter(s => {
      const id = s.id || `step-${steps.indexOf(s)}`
      return visitedStepIds.has(id) && id !== currentStepId
    })
    .map(s => s.id || `step-${steps.indexOf(s)}`)

  if (needsCurrent || visitedIds.length > 0) {
    lines.push('')
    lines.push('  classDef current fill:#3b82f6,stroke:#2563eb,color:#fff')
    lines.push('  classDef visited fill:#22c55e,stroke:#16a34a,color:#fff')
    if (needsCurrent) {
      lines.push(`  class ${currentStepId} current`)
    }
    for (const id of visitedIds) {
      lines.push(`  class ${id} visited`)
    }
  }

  return lines.join('\n') + '\n'
}
