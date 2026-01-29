import { Button } from '../button'

export interface EmptyStateProps {
  icon: string
  headline: string
  body: string
  cta: string
  onAction?: () => void
}

export function EmptyState({ icon, headline, body, cta }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
      textAlign: 'center',
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        marginBottom: 20,
      }}>
        {icon}
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#111827' }}>
        {headline}
      </h3>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280', maxWidth: 280 }}>
        {body}
      </p>
      <Button variant="primary">{cta}</Button>
    </div>
  )
}

import { emptyStates } from '../../shared/data'

export default function EmptyStateDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <EmptyState icon="📁" {...emptyStates.dashboard} />
      <EmptyState icon="✓" {...emptyStates.board} />
      <EmptyState icon="👥" {...emptyStates.team} />
    </div>
  )
}
