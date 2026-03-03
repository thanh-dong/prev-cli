import React, { useEffect, useRef, useState } from 'react'
import type { FlowStep } from '../../content/preview-types'
import { flowToMermaid } from './flow-diagram'

interface FlowDiagramProps {
  steps: FlowStep[]
  currentStepId: string | null
  visitedStepIds: string[]
  onStepClick?: (stepId: string) => void
}

let mermaidInitialized = false

export function FlowDiagram({ steps, currentStepId, visitedStepIds, onStepClick }: FlowDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  const source = flowToMermaid(steps, {
    currentStepId: currentStepId ?? undefined,
    visitedStepIds,
  })

  useEffect(() => {
    let cancelled = false

    async function render() {
      const container = containerRef.current
      if (!container) return

      try {
        const mermaid = (await import('mermaid')).default

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'neutral',
            securityLevel: 'loose',
          })
          mermaidInitialized = true
        }

        const id = 'flow-diagram-' + Date.now()
        const { svg } = await mermaid.render(id, source)

        if (cancelled) return

        container.innerHTML = svg
        setError(null)

        // Attach click handlers to nodes
        if (onStepClick) {
          const nodes = container.querySelectorAll('.node')
          nodes.forEach((node) => {
            const nodeId = node.id
            if (!nodeId) return
            // Mermaid node IDs follow the pattern: flowchart-{stepId}-{number}
            const match = nodeId.match(/^flowchart-(.+?)-\d+$/)
            const stepId = match ? match[1] : nodeId
            ;(node as HTMLElement).style.cursor = 'pointer'
            node.addEventListener('click', () => onStepClick(stepId))
          })
        }
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
      }
    }

    render()

    return () => {
      cancelled = true
    }
  }, [source, onStepClick])

  return (
    <div style={{
      border: '1px solid var(--fd-border)',
      borderRadius: '12px',
      backgroundColor: 'var(--fd-muted)',
      padding: '16px',
      overflow: 'auto',
    }}>
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80px',
        }}
      />
      {error && (
        <pre style={{
          margin: '8px 0 0',
          padding: '12px',
          fontSize: '12px',
          fontFamily: 'var(--fd-font-mono)',
          backgroundColor: 'var(--fd-background)',
          border: '1px solid var(--fd-border)',
          borderRadius: '8px',
          overflow: 'auto',
          color: 'var(--fd-muted-foreground)',
          whiteSpace: 'pre-wrap',
        }}>
          {source}
        </pre>
      )}
    </div>
  )
}
