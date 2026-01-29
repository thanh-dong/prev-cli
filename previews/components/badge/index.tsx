import type { ReactNode } from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

const variants = {
  default: { bg: '#e5e7eb', text: '#374151' },
  success: { bg: '#d1fae5', text: '#065f46' },
  warning: { bg: '#fef3c7', text: '#92400e' },
  error: { bg: '#fee2e2', text: '#991b1b' },
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const v = variants[variant]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 9999,
      fontSize: 12,
      fontWeight: 500,
      backgroundColor: v.bg,
      color: v.text,
    }}>
      {children}
    </span>
  )
}

// Demo
export default function BadgeDemo() {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Badge>Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
    </div>
  )
}
