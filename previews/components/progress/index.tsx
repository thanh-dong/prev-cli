export interface ProgressProps {
  value: number // 0-100
  showLabel?: boolean
}

export function Progress({ value, showLabel = false }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      <div style={{
        flex: 1,
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${clampedValue}%`,
          height: '100%',
          backgroundColor: '#4f46e5',
          borderRadius: 4,
          transition: 'width 0.3s ease',
        }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', minWidth: 36 }}>
          {clampedValue}%
        </span>
      )}
    </div>
  )
}

// Demo
export default function ProgressDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <Progress value={0} showLabel />
      <Progress value={25} showLabel />
      <Progress value={42} showLabel />
      <Progress value={75} showLabel />
      <Progress value={100} showLabel />
    </div>
  )
}
