import React from 'react'
import type { AnnotationCategory } from '../types'

const CATEGORY_COLORS: Record<AnnotationCategory, string> = {
  bug: 'oklch(0.65 0.20 25)',
  copy: 'oklch(0.65 0.15 250)',
  design: 'oklch(0.65 0.18 310)',
  general: 'oklch(0.65 0.10 85)',
}

interface AnnotationPinProps {
  x: number
  y: number
  index: number
  category: AnnotationCategory
  resolved: boolean
  isActive: boolean
  onClick: () => void
}

export function AnnotationPin({ x, y, index, category, resolved, isActive, onClick }: AnnotationPinProps) {
  const color = CATEGORY_COLORS[category]

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        border: '2px solid white',
        backgroundColor: color,
        color: 'white',
        fontSize: '11px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: isActive ? 21 : 20,
        opacity: resolved ? 0.4 : 1,
        boxShadow: isActive
          ? `0 0 0 3px ${color}, 0 2px 8px rgba(0, 0, 0, 0.3)`
          : '0 2px 6px rgba(0, 0, 0, 0.25)',
        transition: 'box-shadow 0.15s ease, opacity 0.15s ease',
        padding: 0,
        lineHeight: 1,
      }}
      title={`#${index} (${category})${resolved ? ' - resolved' : ''}`}
    >
      {index}
    </button>
  )
}
