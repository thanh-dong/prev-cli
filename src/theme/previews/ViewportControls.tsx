import React from 'react'
import type { Viewport } from '../hooks/useViewport'
import { VIEWPORT_WIDTHS } from '../hooks/useViewport'
import { Icon } from '../icons'

interface ViewportControlsProps {
  viewport: Viewport
  onViewportChange: (v: Viewport) => void
}

const viewportMeta: Record<Viewport, { label: string; icon: 'mobile' | 'tablet' | 'desktop' }> = {
  mobile: { label: 'Mobile', icon: 'mobile' },
  tablet: { label: 'Tablet', icon: 'tablet' },
  desktop: { label: 'Desktop', icon: 'desktop' },
}

export function ViewportControls({ viewport, onViewportChange }: ViewportControlsProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
    }}>
      {(Object.keys(viewportMeta) as Viewport[]).map((key) => {
        const { label, icon } = viewportMeta[key]
        const width = VIEWPORT_WIDTHS[key]
        const isActive = viewport === key
        return (
          <button
            key={key}
            onClick={() => onViewportChange(key)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: isActive ? 'var(--fd-primary)' : 'var(--fd-muted)',
              color: isActive ? 'var(--fd-primary-foreground)' : 'var(--fd-muted-foreground)',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--fd-secondary)'
                e.currentTarget.style.color = 'var(--fd-foreground)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--fd-muted)'
                e.currentTarget.style.color = 'var(--fd-muted-foreground)'
              }
            }}
            title={`${label} (${width}px)`}
          >
            <Icon name={icon} size={14} />
            <span style={{ fontSize: '10px', opacity: 0.7 }}>{width}</span>
          </button>
        )
      })}
    </div>
  )
}
