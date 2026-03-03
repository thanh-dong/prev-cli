import React, { useState, useMemo } from 'react'
import { useSnapshots } from '../hooks/useSnapshots'
import { Icon } from '../icons'

interface SnapshotCompareProps {
  leftId?: string
  rightId?: string
}

export function SnapshotCompare({ leftId: initialLeftId, rightId: initialRightId }: SnapshotCompareProps) {
  const { snapshots } = useSnapshots()
  const [leftId, setLeftId] = useState(initialLeftId || '')
  const [rightId, setRightId] = useState(initialRightId || '')

  const left = useMemo(() => snapshots.find(s => s.id === leftId), [snapshots, leftId])
  const right = useMemo(() => snapshots.find(s => s.id === rightId), [snapshots, rightId])

  if (snapshots.length < 2) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        backgroundColor: 'var(--fd-card)',
        borderRadius: '16px',
        border: '1px solid var(--fd-border)',
      }}>
        <Icon name="camera" size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
        <h2 style={{
          margin: '0 0 8px',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--fd-foreground)',
        }}>
          Need at least 2 snapshots
        </h2>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--fd-muted-foreground)',
        }}>
          Capture snapshots from preview pages to compare them side by side.
        </p>
      </div>
    )
  }

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: '12px',
    border: '1px solid var(--fd-border)',
    borderRadius: '6px',
    backgroundColor: 'var(--fd-background)',
    color: 'var(--fd-foreground)',
    cursor: 'pointer',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      backgroundColor: 'var(--fd-card)',
      borderRadius: '16px',
      border: '1px solid var(--fd-border)',
      overflow: 'hidden',
    }}>
      {/* Header with selectors */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--fd-border)',
        background: 'linear-gradient(to bottom, var(--fd-card), var(--fd-muted))',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--fd-foreground)',
          letterSpacing: '-0.02em',
        }}>
          Compare Snapshots
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={leftId}
            onChange={e => setLeftId(e.target.value)}
            style={selectStyle}
          >
            <option value="">Select left...</option>
            {snapshots.map(s => (
              <option key={s.id} value={s.id}>
                {s.label || s.previewName} — {s.stateOrStep}
              </option>
            ))}
          </select>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--fd-muted-foreground)',
          }}>
            vs
          </span>
          <select
            value={rightId}
            onChange={e => setRightId(e.target.value)}
            style={selectStyle}
          >
            <option value="">Select right...</option>
            {snapshots.map(s => (
              <option key={s.id} value={s.id}>
                {s.label || s.previewName} — {s.stateOrStep}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1px',
        backgroundColor: 'var(--fd-border)',
        minHeight: '400px',
      }}>
        <ComparePane snapshot={left} label="Left" />
        <ComparePane snapshot={right} label="Right" />
      </div>

      {/* Metadata comparison */}
      {left && right && (
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--fd-border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          fontSize: '12px',
        }}>
          <MetadataRow label="Preview" left={left.previewName} right={right.previewName} />
          <MetadataRow label="State/Step" left={left.stateOrStep} right={right.stateOrStep} />
          <MetadataRow label="Viewport" left={left.viewport} right={right.viewport} />
          <MetadataRow label="Captured" left={new Date(left.createdAt).toLocaleString()} right={new Date(right.createdAt).toLocaleString()} />
        </div>
      )}
    </div>
  )
}

function ComparePane({ snapshot, label }: { snapshot?: { screenshotDataUrl: string; previewName: string }; label: string }) {
  if (!snapshot) {
    return (
      <div style={{
        backgroundColor: 'var(--fd-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}>
        <span style={{
          fontSize: '13px',
          color: 'var(--fd-muted-foreground)',
        }}>
          Select {label.toLowerCase()} snapshot
        </span>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'var(--fd-background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflow: 'auto',
    }}>
      <img
        src={snapshot.screenshotDataUrl}
        alt={`${label}: ${snapshot.previewName}`}
        style={{
          maxWidth: '100%',
          maxHeight: '500px',
          objectFit: 'contain',
          borderRadius: '8px',
          border: '1px solid var(--fd-border)',
        }}
      />
    </div>
  )
}

function MetadataRow({ label, left, right }: { label: string; left: string; right: string }) {
  const changed = left !== right
  return (
    <>
      <div>
        <span style={{ fontWeight: 500, color: 'var(--fd-muted-foreground)' }}>{label}: </span>
        <span style={{ color: 'var(--fd-foreground)' }}>{left}</span>
      </div>
      <div>
        <span style={{ fontWeight: 500, color: 'var(--fd-muted-foreground)' }}>{label}: </span>
        <span style={{
          color: changed ? 'oklch(0.55 0.18 25)' : 'var(--fd-foreground)',
          fontWeight: changed ? 600 : 400,
        }}>{right}</span>
      </div>
    </>
  )
}
