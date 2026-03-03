import React from 'react'
import type { ApprovalStatus } from '../types'

const STATUS_STYLES: Record<ApprovalStatus, { bg: string; color: string; border: string }> = {
  draft: {
    bg: 'oklch(0.94 0.06 85)',
    color: 'oklch(0.45 0.12 85)',
    border: 'oklch(0.88 0.08 85)',
  },
  'in-review': {
    bg: 'oklch(0.92 0.08 250)',
    color: 'oklch(0.45 0.18 250)',
    border: 'oklch(0.85 0.10 250)',
  },
  approved: {
    bg: 'oklch(0.92 0.08 155)',
    color: 'oklch(0.35 0.12 155)',
    border: 'oklch(0.85 0.10 155)',
  },
  'needs-changes': {
    bg: 'oklch(0.92 0.08 25)',
    color: 'oklch(0.45 0.15 25)',
    border: 'oklch(0.85 0.12 25)',
  },
}

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: 'Draft',
  'in-review': 'In Review',
  approved: 'Approved',
  'needs-changes': 'Needs Changes',
}

interface StatusBadgeProps {
  status: ApprovalStatus
  compact?: boolean
}

export function StatusBadge({ status, compact }: StatusBadgeProps) {
  const style = STATUS_STYLES[status]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: compact ? '2px 6px' : '3px 10px',
      fontSize: compact ? '10px' : '11px',
      fontWeight: 600,
      borderRadius: '6px',
      border: `1px solid ${style.border}`,
      backgroundColor: style.bg,
      color: style.color,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: compact ? '5px' : '6px',
        height: compact ? '5px' : '6px',
        borderRadius: '50%',
        backgroundColor: style.color,
      }} />
      {STATUS_LABELS[status]}
    </span>
  )
}
