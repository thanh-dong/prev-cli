import React, { useState, useCallback } from 'react'
import { Icon } from '../icons'

interface SnapshotButtonProps {
  onCapture: () => void
}

export function SnapshotButton({ onCapture }: SnapshotButtonProps) {
  const [flashing, setFlashing] = useState(false)

  const handleClick = useCallback(() => {
    onCapture()
    setFlashing(true)
    setTimeout(() => setFlashing(false), 300)
  }, [onCapture])

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          backgroundColor: 'var(--fd-muted)',
          color: 'var(--fd-muted-foreground)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'var(--fd-secondary)'
          e.currentTarget.style.color = 'var(--fd-foreground)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'var(--fd-muted)'
          e.currentTarget.style.color = 'var(--fd-muted-foreground)'
        }}
        title="Capture snapshot"
      >
        <Icon name="camera" size={14} />
      </button>

      {/* Flash overlay */}
      {flashing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'white',
            zIndex: 9999,
            pointerEvents: 'none',
            animation: 'snapshot-flash 300ms ease-out forwards',
          }}
        />
      )}

      <style>{`
        @keyframes snapshot-flash {
          0% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
