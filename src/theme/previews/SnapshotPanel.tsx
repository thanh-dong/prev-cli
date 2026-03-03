import React from 'react'
import type { Snapshot } from '../types'
import { Icon } from '../icons'

interface SnapshotPanelProps {
  snapshots: Snapshot[]
  onDelete: (id: string) => void
  onClose: () => void
}

export function SnapshotPanel({ snapshots, onDelete, onClose }: SnapshotPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(2px)',
          zIndex: 90,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '320px',
        backgroundColor: 'var(--fd-card)',
        borderLeft: '1px solid var(--fd-border)',
        backdropFilter: 'blur(12px)',
        zIndex: 91,
        display: 'flex',
        flexDirection: 'column',
        animation: 'snapshot-panel-slide 200ms ease-out',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--fd-border)',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--fd-foreground)',
            letterSpacing: '-0.01em',
          }}>
            Snapshots
          </h3>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: 'var(--fd-muted-foreground)',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--fd-muted)'
              e.currentTarget.style.color = 'var(--fd-foreground)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--fd-muted-foreground)'
            }}
            title="Close"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}>
          {snapshots.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--fd-muted-foreground)',
            }}>
              <Icon name="camera" size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>
                No snapshots yet
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.7 }}>
                Use the camera button to capture
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '12px',
            }}>
              {snapshots.map((snapshot, index) => (
                <SnapshotCard
                  key={snapshot.id}
                  snapshot={snapshot}
                  onDelete={onDelete}
                  nextSnapshot={index + 1 < snapshots.length ? snapshots[index + 1] : undefined}
                  canCompare={snapshots.length >= 2}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes snapshot-panel-slide {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

interface SnapshotCardProps {
  snapshot: Snapshot
  onDelete: (id: string) => void
  nextSnapshot?: Snapshot
  canCompare: boolean
}

function SnapshotCard({ snapshot, onDelete, nextSnapshot, canCompare }: SnapshotCardProps) {
  const timestamp = new Date(snapshot.createdAt)
  const timeStr = timestamp.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div style={{
      borderRadius: '10px',
      border: '1px solid var(--fd-border)',
      overflow: 'hidden',
      backgroundColor: 'var(--fd-background)',
      transition: 'box-shadow 0.15s ease',
    }}>
      {/* Thumbnail */}
      <div style={{
        position: 'relative',
        backgroundColor: 'var(--fd-muted)',
        aspectRatio: '16 / 10',
        overflow: 'hidden',
      }}>
        <img
          src={snapshot.screenshotDataUrl}
          alt={`Snapshot of ${snapshot.previewName}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* Delete button overlay */}
        <button
          onClick={() => onDelete(snapshot.id)}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            opacity: 0.7,
            transition: 'opacity 0.1s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.7' }}
          title="Delete snapshot"
        >
          <Icon name="x" size={12} />
        </button>

        {/* Viewport badge */}
        <span style={{
          position: 'absolute',
          bottom: '6px',
          left: '6px',
          padding: '2px 6px',
          fontSize: '9px',
          fontWeight: 600,
          borderRadius: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {snapshot.viewport}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--fd-foreground)',
          marginBottom: '2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {snapshot.label || snapshot.previewName}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}>
          <span style={{
            fontSize: '10px',
            color: 'var(--fd-muted-foreground)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {snapshot.stateOrStep} · {timeStr}
          </span>

          {canCompare && nextSnapshot && (
            <a
              href={`${(typeof window !== 'undefined' ? (import.meta.env?.BASE_URL ?? '/') : '/').replace(/\/$/, '')}/previews/_compare?left=${snapshot.id}&right=${nextSnapshot.id}`}
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--fd-primary)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.1s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Compare
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
