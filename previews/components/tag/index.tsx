export interface TagProps {
  children: string
  color: string
}

export function Tag({ children, color }: TagProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 500,
      backgroundColor: `${color}20`,
      color: color,
    }}>
      {children}
    </span>
  )
}

// Demo
export default function TagDemo() {
  const tags = [
    { label: 'Marketing', color: '#ec4899' },
    { label: 'Backend', color: '#3b82f6' },
    { label: 'QA', color: '#f59e0b' },
    { label: 'UX', color: '#8b5cf6' },
    { label: 'Data', color: '#10b981' },
  ]
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tags.map(t => <Tag key={t.label} color={t.color}>{t.label}</Tag>)}
    </div>
  )
}
